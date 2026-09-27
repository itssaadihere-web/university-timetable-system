import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Batch, Course, Faculty, Room, ClassSession, Student } from '@/types';
import { formatTo12Hour, TIMETABLE_DAYS } from '@/lib/conflict-engine';
import { getRoomNavigationDetails, formatWhatsAppRoomNavigation } from '@/lib/campus-navigation';

interface CachedData {
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  sessions: ClassSession[];
  students: Student[];
  lastFetched: number;
}

let memoryCache: CachedData | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

/**
 * Fetches all live timetable data from Supabase with in-memory TTL caching
 */
export async function getLiveTimetableData(forceRefresh = false): Promise<CachedData> {
  const now = Date.now();
  if (!forceRefresh && memoryCache && now - memoryCache.lastFetched < CACHE_TTL_MS) {
    return memoryCache;
  }

  if (!isSupabaseConfigured || !supabase) {
    console.warn('[WhatsApp Data] Supabase is not configured, returning empty dataset.');
    return {
      batches: [],
      courses: [],
      faculty: [],
      rooms: [],
      sessions: [],
      students: [],
      lastFetched: now,
    };
  }

  try {
    const [bRes, cRes, fRes, rRes, sRes, stRes] = await Promise.all([
      supabase.from('batches').select('*'),
      supabase.from('courses').select('*'),
      supabase.from('faculty').select('*'),
      supabase.from('rooms').select('*'),
      supabase.from('class_sessions').select('*'),
      supabase.from('students').select('*'),
    ]);

    memoryCache = {
      batches: (bRes.data as Batch[]) || [],
      courses: (cRes.data as Course[]) || [],
      faculty: (fRes.data as Faculty[]) || [],
      rooms: (rRes.data as Room[]) || [],
      sessions: (sRes.data as ClassSession[]) || [],
      students: (stRes.data as Student[]) || [],
      lastFetched: now,
    };

    return memoryCache;
  } catch (err) {
    console.error('[WhatsApp Data] Failed to load live timetable data from Supabase:', err);
    if (memoryCache) return memoryCache;
    return {
      batches: [],
      courses: [],
      faculty: [],
      rooms: [],
      sessions: [],
      students: [],
      lastFetched: now,
    };
  }
}

/**
 * Cleans string for fuzzy comparisons
 */
export function cleanText(str: string): string {
  return (str || '').toLowerCase().trim();
}

export function alphanumericOnly(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Maps common university program aliases to standardized program codes
 */
export const PROGRAM_ALIASES: Record<string, string> = {
  acf: 'BAC',
  'a&f': 'BAC',
  'accounting': 'BAC',
  'accounting and finance': 'BAC',
  'bsaf': 'BAC',
  'bac': 'BAC',
  'bba': 'BBA',
  'business administration': 'BBA',
  'business admin': 'BBA',
  'ban': 'BAN',
  'business analytics': 'BAN',
  'analytics': 'BAN',
  'scm': 'SCM',
  'supply chain': 'SCM',
  'supply chain management': 'SCM',
  'fin': 'FIN',
  'fintech': 'FIN',
  'financial tech': 'FIN',
  'arm': 'ARM',
  'bsarm': 'ARM',
};

/**
 * Detects if a text mentions any program code or alias
 */
export function extractProgramCode(text: string): string | null {
  const cleaned = cleanText(text);
  const alpha = alphanumericOnly(text);

  // Check specific multi-word aliases first
  for (const [alias, code] of Object.entries(PROGRAM_ALIASES)) {
    if (alias.includes(' ') && cleaned.includes(alias)) {
      return code;
    }
  }

  // Check single word aliases / codes with word boundaries
  const words = cleaned.split(/[\s,.-]+/);
  for (const word of words) {
    if (PROGRAM_ALIASES[word]) {
      return PROGRAM_ALIASES[word];
    }
  }

  // Fallback to substring matching on alpha text
  for (const [alias, code] of Object.entries(PROGRAM_ALIASES)) {
    if (alias.length >= 3 && alpha.includes(alphanumericOnly(alias))) {
      return code;
    }
  }

  return null;
}

/**
 * Extracts semester number from text (e.g. "3rd semester", "sem 3", "semester 2", "3rd", "3")
 */
export function extractSemesterNumber(text: string): number | null {
  const cleaned = cleanText(text);

  // Patterns like "3rd semester", "3 semester", "sem 3", "semester 3"
  const match1 = cleaned.match(/(?:sem(?:ester)?\s*(\d+))|(?:(\d+)\s*(?:st|nd|rd|th)?\s*sem(?:ester)?)/i);
  if (match1) {
    const num = parseInt(match1[1] || match1[2], 10);
    if (!isNaN(num) && num >= 1 && num <= 8) return num;
  }

  // Patterns like "3rd", "1st", "2nd"
  const match2 = cleaned.match(/\b([1-8])(?:st|nd|rd|th)\b/i);
  if (match2) {
    return parseInt(match2[1], 10);
  }

  // Patterns with batch numbering like "batch 3" or "-3"
  const match3 = cleaned.match(/(?:batch|sec|section)[\s-]*([1-8])/i);
  if (match3) {
    return parseInt(match3[1], 10);
  }

  return null;
}

/**
 * Extracts a specific section if mentioned (e.g. "section 1a", "3a", "sec 3b")
 */
export function extractSectionLetter(text: string): string | null {
  const cleaned = cleanText(text);
  const match = cleaned.match(/(?:section|sec|batch)[\s-]*[0-9]*([a-d])\b|\b[1-8]([a-d])\b/i);
  if (match) {
    return (match[1] || match[2]).toUpperCase();
  }
  return null;
}

/**
 * Finds candidate batches based on user text (e.g. "Acf 3rd semester" -> Batch-3A-BAC, Batch-3B-BAC, Batch-3C-BAC)
 */
export function findMatchingBatches(text: string, batches: Batch[]): Batch[] {
  const cleaned = cleanText(text);
  const alpha = alphanumericOnly(text);

  // 1. Direct match by exact or sub batch name (e.g. "batch-3a-bac", "3a-bac")
  const exact = batches.filter((b) => {
    const bNameClean = cleanText(b.name);
    const bAlpha = alphanumericOnly(b.name);
    return cleaned === bNameClean || alpha === bAlpha || alpha.includes(bAlpha);
  });
  if (exact.length > 0) return exact;

  const progCode = extractProgramCode(text);
  const semNumber = extractSemesterNumber(text);
  const sectionLetter = extractSectionLetter(text);

  // Filter batches matching program & semester
  let matched = batches.filter((b) => {
    const bProg = (b.program_code || '').toUpperCase();
    const bName = b.name.toUpperCase();
    const bSemester = b.semester;

    // Check program match
    const progMatches = progCode ? (bProg === progCode || bName.includes(progCode)) : true;
    
    // Check semester match
    const semMatches = semNumber !== null ? (bSemester === semNumber || bName.includes(`-${semNumber}`) || bName.includes(`BATCH-${semNumber}`)) : true;

    return progMatches && semMatches;
  });

  // If specific section was mentioned, narrow down strictly by section token
  if (sectionLetter && matched.length > 1) {
    const sectionMatched = matched.filter((b) => {
      if (b.section && b.section.toUpperCase() === sectionLetter) return true;
      const bUpper = b.name.toUpperCase();
      const targetPattern = semNumber ? `${semNumber}${sectionLetter}` : `-${sectionLetter}-`;
      return (
        bUpper.includes(`-${targetPattern}-`) ||
        bUpper.includes(`-${targetPattern}`) ||
        bUpper.includes(targetPattern) ||
        bUpper.includes(`-${sectionLetter}-`)
      );
    });
    if (sectionMatched.length > 0) return sectionMatched;
  }

  // Sort batches neatly by name
  return matched.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Common subject aliases for courses taught at university
 */
export const COURSE_ALIASES: Record<string, string> = {
  islamiat: 'islamic studies',
  islamiyat: 'islamic studies',
  islamic: 'islamic studies',
  quran: 'fehm-ul-quran',
  stats: 'statistics',
  math: 'mathematics',
  maths: 'mathematics',
  mkt: 'marketing',
  acc: 'accounting',
  eco: 'microeconomics',
  fin: 'finance',
  ob: 'organizational behavior',
};

/**
 * Finds matching course from text (e.g. "islamic studies", "islamiat", "marketing", "mkt-101")
 */
export function findMatchingCourse(text: string, courses: Course[]): Course | null {
  const cleaned = cleanText(text);
  const alpha = alphanumericOnly(text);

  // Check aliases
  let expanded = cleaned;
  for (const [alias, canonical] of Object.entries(COURSE_ALIASES)) {
    if (cleaned.includes(alias)) {
      expanded = expanded.replace(alias, canonical);
    }
  }

  // 1. Direct course code match (e.g. "IST - 101", "MKT - 101", "ECO - 102")
  for (const c of courses) {
    const cCodeAlpha = alphanumericOnly(c.code);
    if (cCodeAlpha.length >= 3 && alpha.includes(cCodeAlpha)) {
      return c;
    }
  }

  // 2. Direct course name match or alias match
  for (const c of courses) {
    const cNameClean = cleanText(c.name);
    if (cleaned.includes(cNameClean) || expanded.includes(cNameClean)) {
      return c;
    }
  }

  // 3. Partial keyword matching
  const keywords = [
    'islamic studies',
    'fehm-ul-quran',
    'principles of marketing',
    'financial accounting',
    'microeconomics',
    'business mathematics',
    'statistics',
    'finance',
    'business analytics',
    'supply chain',
    'fintech',
    'organizational behavior',
  ];
  for (const kw of keywords) {
    if (cleaned.includes(kw) || expanded.includes(kw)) {
      const match = courses.find((c) => cleanText(c.name).includes(kw));
      if (match) return match;
    }
  }

  return null;
}

/**
 * Finds student by roll number or full name
 */
export function findStudent(text: string, students: Student[]): Student | null {
  const cleaned = cleanText(text);
  const alpha = alphanumericOnly(text);

  // Match by roll number
  const byRoll = students.find((s) => {
    const sAlpha = alphanumericOnly(s.roll_number);
    const sClean = cleanText(s.roll_number);
    return (
      cleaned === sClean ||
      cleaned.includes(sClean) ||
      alpha === sAlpha ||
      alpha.includes(sAlpha) ||
      (sAlpha.length >= 6 && alpha.includes(sAlpha))
    );
  });
  if (byRoll) return byRoll;

  // Match by name
  const byName = students.filter((s) => {
    const sNameClean = cleanText(s.name);
    const sNameAlpha = alphanumericOnly(s.name);
    return (
      cleaned.length >= 4 &&
      (cleaned === sNameClean ||
        alpha === sNameAlpha ||
        alpha.includes(sNameAlpha) ||
        cleaned.includes(`i am ${sNameClean}`) ||
        cleaned.includes(`my name is ${sNameClean}`))
    );
  });

  if (byName.length === 1) return byName[0];
  return null;
}

/**
 * Enriches a ClassSession with course name, code, room details, and faculty name
 */
export interface EnrichedClassSession {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string; // 12-hour formatted, e.g. "08:30 AM"
  endTime: string;   // 12-hour formatted, e.g. "10:30 AM"
  rawStartTime: string;
  rawEndTime: string;
  courseCode: string;
  courseName: string;
  facultyName: string;
  roomName: string;
  roomBuilding: string;
  roomFloor: number;
  navigationDirections: string;
}

export function enrichSession(
  s: ClassSession,
  courses: Course[],
  faculty: Faculty[],
  rooms: Room[]
): EnrichedClassSession {
  const course = courses.find((c) => c.id === s.course_id);
  const instructor = faculty.find((f) => f.id === s.faculty_id);
  const room = rooms.find((r) => r.id === s.room_id);
  const dayObj = TIMETABLE_DAYS.find((d) => d.id === s.day_of_week);

  let navDirections = '';
  if (room) {
    const nav = getRoomNavigationDetails(room.id, room.name, room.building);
    navDirections = nav ? nav.directions.join(' ') : '';
  }

  return {
    id: s.id,
    dayOfWeek: s.day_of_week,
    dayName: dayObj ? dayObj.name : `Day ${s.day_of_week}`,
    startTime: formatTo12Hour(s.start_time),
    endTime: formatTo12Hour(s.end_time),
    rawStartTime: s.start_time,
    rawEndTime: s.end_time,
    courseCode: course ? course.code : 'COURSE',
    courseName: course ? course.name : 'Scheduled Lecture',
    facultyName: instructor ? instructor.name : 'Assigned Faculty',
    roomName: room ? room.name : 'TBD',
    roomBuilding: room ? room.building : 'SHU Campus',
    roomFloor: room ? room.floor : 1,
    navigationDirections: navDirections,
  };
}

/**
 * Gets all sessions for a batch for a given day (1=Mon ... 7=Sun)
 */
export function getBatchSessionsForDay(
  batchId: string,
  dayOfWeek: number,
  sessions: ClassSession[],
  courses: Course[],
  faculty: Faculty[],
  rooms: Room[]
): EnrichedClassSession[] {
  const batchSessions = sessions.filter(
    (s) => s.batch_id === batchId && s.day_of_week === dayOfWeek
  );

  return batchSessions
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
    .map((s) => enrichSession(s, courses, faculty, rooms));
}

/**
 * Gets the next upcoming class for a batch (considering Pakistan standard time Asia/Karachi)
 */
export function getBatchNextClass(
  batchId: string,
  sessions: ClassSession[],
  courses: Course[],
  faculty: Faculty[],
  rooms: Room[],
  customDayOfWeek?: number,
  customTimeStr?: string
): { currentClass?: EnrichedClassSession; nextClass?: EnrichedClassSession; dayName: string } {
  // Get current Pakistan time (Asia/Karachi, UTC+5)
  const now = new Date();
  const options = { timeZone: 'Asia/Karachi', hour12: false };
  const formatter = new Intl.DateTimeFormat([], {
    ...options,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  
  let currentDay = customDayOfWeek;
  if (!currentDay) {
    const d = now.getDay();
    currentDay = d === 0 ? 7 : d; // 1=Mon ... 7=Sun
  }

  let currentTimeStr = customTimeStr;
  if (!currentTimeStr) {
    const parts = formatter.formatToParts(now);
    const hour = parts.find((p) => p.type === 'hour')?.value || '08';
    const minute = parts.find((p) => p.type === 'minute')?.value || '00';
    currentTimeStr = `${hour}:${minute}`;
  }

  const todaySessions = getBatchSessionsForDay(batchId, currentDay, sessions, courses, faculty, rooms);
  const dayObj = TIMETABLE_DAYS.find((d) => d.id === currentDay);
  const dayName = dayObj ? dayObj.name : 'Today';

  // Find currently ongoing class
  const currentClass = todaySessions.find(
    (s) => s.rawStartTime.slice(0, 5) <= currentTimeStr! && currentTimeStr! < s.rawEndTime.slice(0, 5)
  );

  // Find next class today
  const nextClassToday = todaySessions.find(
    (s) => s.rawStartTime.slice(0, 5) > currentTimeStr!
  );

  if (nextClassToday) {
    return { currentClass, nextClass: nextClassToday, dayName };
  }

  // If no more classes today, look ahead to tomorrow or next active day
  for (let offset = 1; offset <= 6; offset++) {
    const nextDay = ((currentDay - 1 + offset) % 7) + 1;
    const upcomingSessions = getBatchSessionsForDay(batchId, nextDay, sessions, courses, faculty, rooms);
    if (upcomingSessions.length > 0) {
      const nextDayObj = TIMETABLE_DAYS.find((d) => d.id === nextDay);
      return {
        currentClass,
        nextClass: upcomingSessions[0],
        dayName: nextDayObj ? nextDayObj.name : `Day ${nextDay}`,
      };
    }
  }

  return { currentClass, dayName };
}

/**
 * Gets full weekly schedule for a batch grouped by day
 */
export function getBatchFullWeeklySchedule(
  batchId: string,
  sessions: ClassSession[],
  courses: Course[],
  faculty: Faculty[],
  rooms: Room[]
): Record<string, EnrichedClassSession[]> {
  const result: Record<string, EnrichedClassSession[]> = {};

  for (const day of TIMETABLE_DAYS) {
    const daySessions = getBatchSessionsForDay(batchId, day.id, sessions, courses, faculty, rooms);
    if (daySessions.length > 0) {
      result[day.name] = daySessions;
    }
  }

  return result;
}
