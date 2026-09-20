import { 
  ClassSession, 
  Student, 
  Batch, 
  Course, 
  Faculty, 
  Room 
} from '@/types';
import { 
  TIMETABLE_DAYS, 
  formatTo12Hour, 
  formatTimeRange, 
  timeToMinutes 
} from '@/lib/conflict-engine';
import { 
  getRoomNavigationDetails, 
  formatWhatsAppRoomNavigation 
} from '@/lib/campus-navigation';

export interface WhatsAppConversationSession {
  phoneNumber: string;
  studentId?: string;
  studentName?: string;
  rollNumber?: string;
  batchId?: string;
  batchName?: string;
  program?: string;
  isIdentified: boolean;
  pendingIntent?: {
    type: 'full_timetable' | 'next_class' | 'today_schedule' | 'tomorrow_schedule' | 'day_schedule' | 'room_navigation' | 'course_schedule' | 'faculty_schedule';
    targetCourseId?: string;
    targetFacultyId?: string;
    targetRoomId?: string;
    targetDay?: number;
    originalQuestion?: string;
  } | null;
  lastActivity: number;
}

// In-Memory store for conversation sessions (keyed by student phone number)
const conversationStore: Record<string, WhatsAppConversationSession> = {};

export interface ProcessMessageContext {
  phoneNumber: string;
  incomingText: string;
  students: Student[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
  sessions: ClassSession[];
  customTimeStr?: string; // For simulation/testing (e.g. "10:15")
  customDayOfWeek?: number; // 1-7 for testing
}

export interface ProcessMessageResult {
  replyText: string;
  sessionState: WhatsAppConversationSession;
  dispatchedToPhone: string;
}

/**
 * Normalizes input text for case-insensitive matching
 */
function clean(str: string): string {
  return (str || '').toLowerCase().trim();
}

/**
 * Removes punctuation/special characters for fuzzy comparison
 */
function alphanumericOnly(str: string): string {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Checks if a string contains any day of week and returns day ID (1=Mon ... 7=Sun)
 */
function extractDayOfWeek(text: string): { dayId: number; dayName: string } | null {
  const t = clean(text);
  if (t.includes('mon') || t.includes('somwar') || t.includes('peer')) return { dayId: 1, dayName: 'Monday' };
  if (t.includes('tue') || t.includes('mangal')) return { dayId: 2, dayName: 'Tuesday' };
  if (t.includes('wed') || t.includes('budh')) return { dayId: 3, dayName: 'Wednesday' };
  if (t.includes('thu') || t.includes('jumerat') || t.includes('jummarat')) return { dayId: 4, dayName: 'Thursday' };
  if (t.includes('fri') || t.includes('jumma') || t.includes('juma')) return { dayId: 5, dayName: 'Friday' };
  if (t.includes('sat') || t.includes('hafta') || t.includes('saturday')) return { dayId: 6, dayName: 'Saturday' };
  if (t.includes('sun') || t.includes('itwar') || t.includes('sunday')) return { dayId: 7, dayName: 'Sunday' };
  return null;
}

/**
 * Main WhatsApp Conversational Engine
 */
export function processIncomingWhatsAppMessage(ctx: ProcessMessageContext): ProcessMessageResult {
  const { phoneNumber, incomingText, students, batches, courses, faculty, rooms, sessions } = ctx;
  const rawText = incomingText.trim();
  const lowerText = clean(rawText);
  const alphaText = alphanumericOnly(rawText);

  // 1. Retrieve or initialize user conversation session
  let session = conversationStore[phoneNumber];
  if (!session) {
    session = {
      phoneNumber,
      isIdentified: false,
      lastActivity: Date.now(),
    };
    conversationStore[phoneNumber] = session;
  }
  session.lastActivity = Date.now();

  // 2. Check for reset or logout command
  if (lowerText === 'reset' || lowerText === 'logout' || lowerText === 'change user' || lowerText === 'switch student' || lowerText === 'restart') {
    conversationStore[phoneNumber] = {
      phoneNumber,
      isIdentified: false,
      lastActivity: Date.now(),
    };
    const reply = [
      `🔄 *Session Reset Successfully!*`,
      ``,
      `🎓 *Welcome to Salim Habib University (SHU) Timetable Assistant!*`,
      `Please provide your *Student Roll Number / ID* (e.g. \`AF-2026-001\`), *Full Name*, or *Batch / Section* (e.g. \`Section 1A\`, \`BAN-2\`) to get started.`,
    ].join('\n');

    return { replyText: reply, sessionState: conversationStore[phoneNumber], dispatchedToPhone: phoneNumber };
  }

  // 3. Identification Check: Roll Number / Student ID / Name / Batch
  let identifiedNow = false;
  let matchedStudent: Student | undefined = undefined;

  // A. Check by Student ID / Roll Number
  matchedStudent = students.find((s) => {
    const sAlpha = alphanumericOnly(s.roll_number);
    const sClean = clean(s.roll_number);
    return (
      sClean === lowerText ||
      lowerText.includes(sClean) ||
      alphaText === sAlpha ||
      alphaText.includes(sAlpha) ||
      (sAlpha.length > 4 && alphaText.includes(sAlpha))
    );
  });

  // B. Check by Student Name if not matched by Roll Number
  if (!matchedStudent) {
    const matchingByName = students.filter((s) => {
      const nameParts = clean(s.name).split(' ');
      const sFullAlpha = alphanumericOnly(s.name);
      return (
        alphaText.includes(sFullAlpha) ||
        (lowerText.length > 3 && clean(s.name) === lowerText) ||
        nameParts.some((part) => part.length >= 4 && (lowerText.startsWith(part) || lowerText.includes(`i am ${part}`) || lowerText.includes(`name is ${part}`)))
      );
    });

    if (matchingByName.length === 1) {
      matchedStudent = matchingByName[0];
    }
  }

  // If a student record is found, update session
  if (matchedStudent) {
    const studentBatch = batches.find((b) => b.id === matchedStudent!.batch_id);
    session.studentId = matchedStudent.id;
    session.studentName = matchedStudent.name;
    session.rollNumber = matchedStudent.roll_number;
    session.batchId = matchedStudent.batch_id || undefined;
    session.batchName = studentBatch ? studentBatch.name : 'Enrolled Batch';
    session.program = studentBatch ? studentBatch.program : 'Faculty of Management Sciences';
    session.isIdentified = true;
    identifiedNow = true;
  }

  // C. Check by Batch / Section Name if not matched by individual student
  if (!session.isIdentified) {
    const matchedBatch = batches.find((b) => {
      const bAlpha = alphanumericOnly(b.name);
      return (
        alphaText.includes(bAlpha) ||
        lowerText.includes(clean(b.name)) ||
        (b.name.toLowerCase().includes('section') && lowerText.includes(b.name.toLowerCase().replace('section ', 'sec ')))
      );
    });

    if (matchedBatch) {
      session.batchId = matchedBatch.id;
      session.batchName = matchedBatch.name;
      session.program = matchedBatch.program;
      session.studentName = `Student (${matchedBatch.name})`;
      session.isIdentified = true;
      identifiedNow = true;
    }
  }

  // 4. Intent Classification

  // Query: Specific Room Navigation
  const matchedRoom = rooms.find((r) => {
    const rAlpha = alphanumericOnly(r.name);
    const rIdAlpha = alphanumericOnly(r.id);
    return (
      alphaText.includes(rAlpha) ||
      lowerText.includes(clean(r.name)) ||
      (rIdAlpha.length > 3 && alphaText.includes(rIdAlpha))
    );
  });

  const isRoomQuery = 
    Boolean(matchedRoom) ||
    lowerText.includes('where is room') ||
    lowerText.includes('where is') ||
    lowerText.includes('room location') ||
    lowerText.includes('navigate to') ||
    lowerText.includes('how to reach') ||
    lowerText.includes('room guidance') ||
    lowerText.includes('floor directions') ||
    lowerText.includes('kahan hai');

  // Query: Next Class / Immediate Lecture
  const isNextClassQuery = 
    lowerText.includes('next class') ||
    lowerText.includes('next lecture') ||
    lowerText.includes('upcoming class') ||
    lowerText.includes('upcoming lecture') ||
    lowerText.includes('what is my next') ||
    lowerText.includes('what class do i have') ||
    lowerText.includes('where do i go now') ||
    lowerText.includes('where is my class') ||
    lowerText.includes('right now') ||
    lowerText.includes('agli class') ||
    lowerText.includes('next');

  // Query: Today's Schedule
  const isTodayQuery = 
    lowerText.includes('today') ||
    lowerText.includes('aaj') ||
    lowerText.includes("today's schedule") ||
    lowerText.includes("today's class");

  // Query: Tomorrow's Schedule
  const isTomorrowQuery = 
    lowerText.includes('tomorrow') ||
    lowerText.includes('kal');

  // Query: Specific Day of Week
  const extractedDay = extractDayOfWeek(lowerText);

  // Query: Full Timetable
  const isFullTimetableQuery = 
    lowerText.includes('full timetable') ||
    lowerText.includes('whole timetable') ||
    lowerText.includes('complete schedule') ||
    lowerText.includes('weekly schedule') ||
    lowerText.includes('all classes') ||
    lowerText.includes('pura timetable') ||
    lowerText.includes('timetable') ||
    lowerText.includes('schedule');

  // Query: Specific Course Inquiry
  const matchedCourse = courses.find((c) => {
    const cCodeAlpha = alphanumericOnly(c.code);
    const cNameClean = clean(c.name);
    return (
      alphaText.includes(cCodeAlpha) ||
      lowerText.includes(clean(c.code)) ||
      (cNameClean.length > 5 && lowerText.includes(cNameClean))
    );
  });

  // Query: Specific Faculty Inquiry (only if instructor keywords or explicitly asking about faculty)
  const isFacultyQuery = 
    lowerText.includes('prof') || 
    lowerText.includes('dr.') || 
    lowerText.includes('dr ') || 
    lowerText.includes('faculty') || 
    lowerText.includes('instructor') || 
    lowerText.includes('teacher') || 
    lowerText.includes('sir ') || 
    lowerText.includes('miss ') || 
    lowerText.includes('madam') ||
    lowerText.includes('teaches') ||
    lowerText.includes('classes of');

  const matchedFaculty = isFacultyQuery ? faculty.find((f) => {
    const fClean = clean(f.name);
    const nameParts = fClean.split(' ');
    return (
      lowerText.includes(fClean) ||
      nameParts.some((p) => p.length >= 4 && !['prof', 'dr', 'sir', 'madam'].includes(p) && lowerText.includes(p))
    );
  }) : undefined;

  // -------------------------------------------------------------
  // EXECUTION ROUTING
  // -------------------------------------------------------------

  // Case A: Room Navigation Query (Can be answered immediately even if unauthenticated)
  if (matchedRoom || (isRoomQuery && !isNextClassQuery)) {
    const targetRoom = matchedRoom || rooms[0];
    const navDetails = getRoomNavigationDetails(targetRoom.id, targetRoom.name, targetRoom.building);
    
    const reply = [
      `🏛️ *SALIM HABIB UNIVERSITY (SHU) CAMPUS NAVIGATION*`,
      `──────────────────────────`,
      formatWhatsAppRoomNavigation(navDetails),
      `──────────────────────────`,
      `💡 *Need your next class?* Send your *Roll No* (e.g. \`AF-2026-001\`) or ask *"What is my next class?"* anytime!`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Case B: Student Just Provided Their Roll No / Name with NO other question
  if (identifiedNow && !isNextClassQuery && !isTodayQuery && !isTomorrowQuery && !extractedDay && !isFullTimetableQuery && !matchedCourse && !matchedFaculty) {
    const greetingHeader = buildIdentityConfirmationHeader(session);
    const nextClassSummary = getNextClassText(session, { batches, courses, faculty, rooms, sessions, customTimeStr: ctx.customTimeStr, customDayOfWeek: ctx.customDayOfWeek });

    const reply = [
      greetingHeader,
      ``,
      `📌 *Quick Access for ${session.studentName}:*`,
      nextClassSummary,
      ``,
      `──────────────────────────`,
      `💬 *You can ask me anytime:*`,
      `• *"What is my next class?"* ➔ Room & Instructor info`,
      `• *"Today's classes"* ➔ Complete daily agenda`,
      `• *"Full Timetable"* ➔ Entire weekly schedule`,
      `• *"Where is room TF-308?"* ➔ Step-by-step navigation`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Case C: Check if we need student identification for personalized queries
  const isPersonalizedQuery = isNextClassQuery || isTodayQuery || isTomorrowQuery || Boolean(extractedDay) || isFullTimetableQuery;

  if (isPersonalizedQuery && !session.isIdentified) {
    // Save pending intent
    if (isNextClassQuery) session.pendingIntent = { type: 'next_class', originalQuestion: rawText };
    else if (isTodayQuery) session.pendingIntent = { type: 'today_schedule', originalQuestion: rawText };
    else if (isTomorrowQuery) session.pendingIntent = { type: 'tomorrow_schedule', originalQuestion: rawText };
    else if (extractedDay) session.pendingIntent = { type: 'day_schedule', targetDay: extractedDay.dayId, originalQuestion: rawText };
    else if (isFullTimetableQuery) session.pendingIntent = { type: 'full_timetable', originalQuestion: rawText };

    const reply = [
      `👋 *Assalam-o-Alaikum & Welcome to SHU Timetable Assistant!*`,
      ``,
      `To provide your exact schedule, room numbers, and navigation instructions, please confirm who you are:`,
      ``,
      `🎓 *Please send your:*`,
      `1️⃣ *Student Roll Number / ID* (e.g. \`AF-2026-001\`, \`BAN-2026-015\`, \`BBA-2026-022\`)`,
      `2️⃣ *Full Name* (e.g. \`Ayesha Siddiqui\`, \`Bilal Tariq\`)`,
      `3️⃣ *Batch / Section* (e.g. \`Section 1A\`, \`BAN-2\`, \`BSAF-3A\`)`,
      ``,
      `Once confirmed, I'll deliver your schedule and room directions instantly!`,
    ].join('\n');

    return { replyText: reply, sessionState: session, dispatchedToPhone: phoneNumber };
  }

  // Case D: Next Class Query (Student is identified)
  if (isNextClassQuery) {
    const greetingHeader = identifiedNow ? buildIdentityConfirmationHeader(session) + '\n\n' : '';
    const nextClassText = getNextClassText(session, { batches, courses, faculty, rooms, sessions, customTimeStr: ctx.customTimeStr, customDayOfWeek: ctx.customDayOfWeek });
    
    return {
      replyText: greetingHeader + nextClassText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case E: Today's Schedule
  if (isTodayQuery) {
    const now = new Date();
    const currentDayOfWeek = ctx.customDayOfWeek || (now.getDay() === 0 ? 7 : now.getDay());
    const dayName = TIMETABLE_DAYS.find((d) => d.id === currentDayOfWeek)?.name || 'Today';

    const greetingHeader = identifiedNow ? buildIdentityConfirmationHeader(session) + '\n\n' : '';
    const dayScheduleText = getDayScheduleText(session, currentDayOfWeek, `Today (${dayName})`, { batches, courses, faculty, rooms, sessions });

    return {
      replyText: greetingHeader + dayScheduleText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case F: Tomorrow's Schedule
  if (isTomorrowQuery) {
    const now = new Date();
    const currentDayOfWeek = ctx.customDayOfWeek || (now.getDay() === 0 ? 7 : now.getDay());
    const tomorrowDayOfWeek = (currentDayOfWeek % 7) + 1;
    const dayName = TIMETABLE_DAYS.find((d) => d.id === tomorrowDayOfWeek)?.name || 'Tomorrow';

    const greetingHeader = identifiedNow ? buildIdentityConfirmationHeader(session) + '\n\n' : '';
    const dayScheduleText = getDayScheduleText(session, tomorrowDayOfWeek, `Tomorrow (${dayName})`, { batches, courses, faculty, rooms, sessions });

    return {
      replyText: greetingHeader + dayScheduleText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case G: Specific Day Schedule (e.g. Monday, Friday)
  if (extractedDay) {
    const greetingHeader = identifiedNow ? buildIdentityConfirmationHeader(session) + '\n\n' : '';
    const dayScheduleText = getDayScheduleText(session, extractedDay.dayId, extractedDay.dayName, { batches, courses, faculty, rooms, sessions });

    return {
      replyText: greetingHeader + dayScheduleText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case H: Full Weekly Timetable
  if (isFullTimetableQuery) {
    const greetingHeader = identifiedNow ? buildIdentityConfirmationHeader(session) + '\n\n' : '';
    const fullTimetableText = getFullTimetableText(session, { batches, courses, faculty, rooms, sessions });

    return {
      replyText: greetingHeader + fullTimetableText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case I: Specific Course Inquiry
  if (matchedCourse) {
    const courseScheduleText = getCourseScheduleText(matchedCourse, { batches, courses, faculty, rooms, sessions });
    return {
      replyText: courseScheduleText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Case J: Specific Faculty Inquiry
  if (matchedFaculty) {
    const facultyScheduleText = getFacultyScheduleText(matchedFaculty, { batches, courses, faculty, rooms, sessions });
    return {
      replyText: facultyScheduleText,
      sessionState: session,
      dispatchedToPhone: phoneNumber,
    };
  }

  // Fallback: Welcome & Help Menu
  const fallbackReply = [
    `🎓 *Salim Habib University (SHU) Timetable Assistant*`,
    `──────────────────────────`,
    session.isIdentified 
      ? `👤 *Active Profile:* ${session.studentName} (${session.batchName})\n🎓 *Roll No:* ${session.rollNumber || 'Enrolled'}`
      : `👋 Welcome! To get your personalized schedule, please send your *Student Roll No* or *Batch Name*.`,
    ``,
    `💬 *Available Commands:*`,
    `1️⃣ *"What is my next class?"* ➔ Next lecture, room & floor guide`,
    `2️⃣ *"Today's classes"* / *"Tomorrow schedule"* ➔ Daily timetable`,
    `3️⃣ *"Full Timetable"* ➔ Complete weekly schedule`,
    `4️⃣ *"Where is room TF-308?"* ➔ Step-by-step room walking directions`,
    `5️⃣ *"Reset"* ➔ Switch student profile or roll number`,
    `──────────────────────────`,
    `💡 *Tip:* Send your query directly (e.g. \`AF-2026-001\`, \`Next class\`, \`Where is room A-04?\`).`,
  ].join('\n');

  return { replyText: fallbackReply, sessionState: session, dispatchedToPhone: phoneNumber };
}

// -------------------------------------------------------------
// HELPER FORMATTING FUNCTIONS
// -------------------------------------------------------------

function buildIdentityConfirmationHeader(session: WhatsAppConversationSession): string {
  return [
    `✅ *Student Identity Verified!*`,
    `👤 *Name:* ${session.studentName}`,
    session.rollNumber ? `🎓 *Roll No:* ${session.rollNumber}` : null,
    `📚 *Batch:* ${session.batchName}`,
    session.program ? `🏛️ *Program:* ${session.program}` : null,
  ].filter(Boolean).join('\n');
}

/**
 * Calculates and formats Next Class details + walking directions
 */
function getStudentBatchSessions(
  batchId: string | undefined,
  batches: Batch[],
  sessions: ClassSession[]
): ClassSession[] {
  if (!batchId) return [];
  const batchObj = batches.find((b) => b.id === batchId);
  return sessions.filter((s) => {
    if (s.status !== 'published') return false;
    const isDirectMatch = s.batch_id === batchId;
    const isJointMatch = Boolean(batchObj?.merge_group_id && s.batch_group_id && s.batch_group_id === batchObj.merge_group_id);
    return isDirectMatch || isJointMatch;
  });
}

function getNextClassText(
  session: WhatsAppConversationSession,
  data: {
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
    customTimeStr?: string;
    customDayOfWeek?: number;
  }
): string {
  const { batches, courses, faculty, rooms, sessions } = data;
  const batchId = session.batchId || batches[0]?.id;
  const batchObj = batches.find((b) => b.id === batchId);
  const publishedSessions = getStudentBatchSessions(batchId, batches, sessions);

  const now = new Date();
  const currentDayOfWeek = data.customDayOfWeek || (now.getDay() === 0 ? 7 : now.getDay());
  const currentMinutes = data.customTimeStr ? timeToMinutes(data.customTimeStr) : now.getHours() * 60 + now.getMinutes();

  // 1. Check for upcoming class today
  const todaysUpcoming = publishedSessions
    .filter((s) => s.day_of_week === currentDayOfWeek && timeToMinutes(s.start_time) >= currentMinutes)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let nextClass: ClassSession | null = todaysUpcoming[0] || null;
  let whenLabel = 'Today';

  // 2. If no more classes today, look for subsequent days
  if (!nextClass) {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDayId = ((currentDayOfWeek + offset - 1) % 7) + 1;
      const nextDayClasses = publishedSessions
        .filter((s) => s.day_of_week === nextDayId)
        .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

      if (nextDayClasses.length > 0) {
        nextClass = nextDayClasses[0];
        const dayName = TIMETABLE_DAYS.find((d) => d.id === nextDayId)?.name;
        whenLabel = offset === 1 ? `Tomorrow (${dayName})` : `${dayName}`;
        break;
      }
    }
  }

  if (!nextClass) {
    return [
      `⏰ *Next Class Status:*`,
      `No upcoming classes found for *${batchObj?.name || 'your batch'}*.`,
      `Enjoy your time off! 🌴`,
    ].join('\n');
  }

  const crs = courses.find((c) => c.id === nextClass!.course_id);
  const fac = faculty.find((f) => f.id === nextClass!.faculty_id);
  const rm = rooms.find((r) => r.id === nextClass!.room_id);
  const timeStr = formatTimeRange(nextClass.start_time, nextClass.end_time);
  const isJoint = Boolean(nextClass.batch_group_id);

  const replyLines: string[] = [
    `⏰ *NEXT CLASS DETAILS* (${whenLabel})`,
    `🎓 *Batch:* ${batchObj?.name || 'Batch'}${isJoint ? ' _(Joint Section Class)_' : ''}`,
    `──────────────────────────`,
    `📖 *Course:* ${crs?.code} – ${crs?.name}`,
    `⏰ *Time:* ${timeStr}`,
    `👨‍🏫 *Instructor:* ${fac?.name || 'TBA'}`,
    `🚪 *Room:* *${rm?.name || 'Venue TBA'}*`,
  ];

  if (rm) {
    const navDetails = getRoomNavigationDetails(rm.id, rm.name, rm.building);
    replyLines.push(``);
    replyLines.push(`📍 *Location & Route:*`);
    replyLines.push(formatWhatsAppRoomNavigation(navDetails));
  }

  return replyLines.join('\n');
}

/**
 * Formats daily schedule for a specific day
 */
function getDayScheduleText(
  session: WhatsAppConversationSession,
  dayId: number,
  dayTitle: string,
  data: {
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
  }
): string {
  const { batches, courses, faculty, rooms, sessions } = data;
  const batchId = session.batchId || batches[0]?.id;
  const batchObj = batches.find((b) => b.id === batchId);
  const publishedSessions = getStudentBatchSessions(batchId, batches, sessions);

  const dayClasses = publishedSessions
    .filter((s) => s.day_of_week === dayId)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  const lines: string[] = [
    `📅 *SCHEDULE FOR ${dayTitle.toUpperCase()}*`,
    `🎓 *Batch:* ${batchObj?.name || 'Enrolled Batch'} (${batchObj?.program || 'SHU'})`,
    `──────────────────────────`,
  ];

  if (dayClasses.length === 0) {
    lines.push(``);
    lines.push(`🌴 *No classes scheduled for this day.* Enjoy your free day!`);
    return lines.join('\n');
  }

  for (let i = 0; i < dayClasses.length; i++) {
    const cls = dayClasses[i];
    const crs = courses.find((c) => c.id === cls.course_id);
    const fac = faculty.find((f) => f.id === cls.faculty_id);
    const rm = rooms.find((r) => r.id === cls.room_id);
    const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;
    const timeStr = formatTimeRange(cls.start_time, cls.end_time);

    lines.push(``);
    lines.push(`*${i + 1}. ${crs?.code} – ${crs?.name}*`);
    lines.push(`   ⏰ Time: *${timeStr}*`);
    lines.push(`   👨‍🏫 Instructor: ${fac?.name || 'TBA'}`);
    lines.push(`   🚪 Room: *${rm?.name || 'Venue TBA'}* ${nav ? `(${nav.floorLabel})` : ''}`);
    if (nav && nav.specialtyTags.some((t) => t.includes('Lab'))) {
      lines.push(`   💻 *Specialty:* ${nav.specialtyDescription}`);
    }
  }

  lines.push(``);
  lines.push(`──────────────────────────`);
  lines.push(`📍 *Need Room Directions?* Send *"Where is [Room Name]?"* anytime!`);

  return lines.join('\n');
}

/**
 * Formats full weekly timetable
 */
function getFullTimetableText(
  session: WhatsAppConversationSession,
  data: {
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
  }
): string {
  const { batches, courses, faculty, rooms, sessions } = data;
  const batchId = session.batchId || batches[0]?.id;
  const batchObj = batches.find((b) => b.id === batchId);
  const batchSessions = getStudentBatchSessions(batchId, batches, sessions);

  if (batchSessions.length === 0) {
    return `📅 *Official Timetable for ${batchObj?.name || 'Batch'}:*\n\nNo published classes are currently found in the system.`;
  }

  const lines: string[] = [
    `📅 *OFFICIAL WEEKLY TIMETABLE*`,
    `🎓 *Batch:* ${batchObj?.name || 'Batch'}`,
    `🏛️ *Program:* ${batchObj?.program || 'Faculty of Management Sciences'}`,
    `🏢 *Campus:* Salim Habib University (SHU)`,
    `──────────────────────────`,
  ];

  for (let dayId = 1; dayId <= 7; dayId++) {
    const dayName = TIMETABLE_DAYS.find((d) => d.id === dayId)?.name || `Day ${dayId}`;
    const dayClasses = batchSessions
      .filter((s) => s.day_of_week === dayId)
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    if (dayClasses.length > 0) {
      lines.push(``);
      lines.push(`📌 *${dayName.toUpperCase()}:*`);
      for (const cls of dayClasses) {
        const crs = courses.find((c) => c.id === cls.course_id);
        const fac = faculty.find((f) => f.id === cls.faculty_id);
        const rm = rooms.find((r) => r.id === cls.room_id);
        const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;
        const timeStr = formatTimeRange(cls.start_time, cls.end_time);

        lines.push(`• *${crs?.code}* (${timeStr})`);
        lines.push(`  👨‍🏫 ${fac?.name || 'TBA'} | 🚪 ${rm?.name || 'Venue TBA'} ${nav ? `(${nav.floorLabel})` : ''}`);
      }
    }
  }

  lines.push(``);
  lines.push(`──────────────────────────`);
  lines.push(`💡 *Need directions?* Ask *"Where is room TF-308?"* or *"What is my next class?"*`);

  return lines.join('\n');
}

/**
 * Formats course timetable search
 */
function getCourseScheduleText(
  course: Course,
  data: {
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
  }
): string {
  const { batches, faculty, rooms, sessions } = data;
  const courseSessions = sessions.filter((s) => s.course_id === course.id && s.status === 'published');

  const lines: string[] = [
    `📖 *COURSE TIMETABLE: ${course.code}*`,
    `📘 *Title:* ${course.name} (${course.credit_hours} Cr. Hrs)`,
    `🏛️ *Department:* ${course.department}`,
    `──────────────────────────`,
  ];

  if (courseSessions.length === 0) {
    lines.push(`No active sessions are scheduled for this course.`);
  } else {
    for (const cls of courseSessions) {
      const dName = TIMETABLE_DAYS.find((d) => d.id === cls.day_of_week)?.name || `Day ${cls.day_of_week}`;
      const b = batches.find((b) => b.id === cls.batch_id);
      const fac = faculty.find((f) => f.id === cls.faculty_id);
      const rm = rooms.find((r) => r.id === cls.room_id);
      const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

      lines.push(``);
      lines.push(`🗓️ *${dName}* | ${formatTimeRange(cls.start_time, cls.end_time)}`);
      lines.push(`  👥 Batch: ${b?.name} (${b?.program})`);
      lines.push(`  👨‍🏫 Faculty: ${fac?.name}`);
      lines.push(`  🚪 Room: ${rm?.name || 'TBA'} ${nav ? `(${nav.floorLabel})` : ''}`);
    }
  }

  return lines.join('\n');
}

/**
 * Formats faculty timetable search
 */
function getFacultyScheduleText(
  facMember: Faculty,
  data: {
    batches: Batch[];
    courses: Course[];
    faculty: Faculty[];
    rooms: Room[];
    sessions: ClassSession[];
  }
): string {
  const { batches, courses, rooms, sessions } = data;
  const facSessions = sessions.filter((s) => s.faculty_id === facMember.id && s.status === 'published');

  const lines: string[] = [
    `👨‍🏫 *FACULTY SCHEDULE: ${facMember.name}*`,
    `🏛️ *Department:* ${facMember.department}`,
    `──────────────────────────`,
  ];

  if (facSessions.length === 0) {
    lines.push(`No active classes are assigned to this instructor.`);
  } else {
    for (const cls of facSessions) {
      const dName = TIMETABLE_DAYS.find((d) => d.id === cls.day_of_week)?.name || `Day ${cls.day_of_week}`;
      const b = batches.find((b) => b.id === cls.batch_id);
      const crs = courses.find((c) => c.id === cls.course_id);
      const rm = rooms.find((r) => r.id === cls.room_id);
      const nav = rm ? getRoomNavigationDetails(rm.id, rm.name, rm.building) : null;

      lines.push(``);
      lines.push(`🗓️ *${dName}* | ${formatTimeRange(cls.start_time, cls.end_time)}`);
      lines.push(`  📚 Course: ${crs?.code} – ${crs?.name}`);
      lines.push(`  👥 Batch: ${b?.name}`);
      lines.push(`  🚪 Room: ${rm?.name || 'TBA'} ${nav ? `(${nav.floorLabel})` : ''}`);
    }
  }

  return lines.join('\n');
}

/**
 * Dispatches an interactive message (Buttons or List) to Meta WhatsApp Cloud API.
 * Automatically falls back to standard text dispatch if Meta is unavailable or if another provider is configured.
 */
export async function sendRealWhatsAppInteractiveMessage(
  toPhone: string,
  interactive: {
    type: 'button' | 'list';
    body: string;
    header?: string;
    footer?: string;
    buttons?: Array<{ id: string; title: string }>;
    buttonLabel?: string;
    sections?: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  const formattedPhone = toPhone.replace(/[^0-9]/g, '');
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
      let interactivePayload: any = null;

      if (interactive.type === 'button' && interactive.buttons && interactive.buttons.length > 0) {
        // Meta requires at most 3 buttons with titles up to 20 chars
        const safeButtons = interactive.buttons.slice(0, 3).map((btn) => ({
          type: 'reply',
          reply: {
            id: btn.id.slice(0, 256),
            title: btn.title.slice(0, 20),
          },
        }));

        interactivePayload = {
          type: 'button',
          body: {
            text: interactive.body.slice(0, 1024),
          },
          action: {
            buttons: safeButtons,
          },
        };

        if (interactive.header) {
          interactivePayload.header = {
            type: 'text',
            text: interactive.header.slice(0, 60),
          };
        }
        if (interactive.footer) {
          interactivePayload.footer = {
            text: interactive.footer.slice(0, 60),
          };
        }
      } else if (interactive.type === 'list' && interactive.sections && interactive.sections.length > 0) {
        // Meta requires max 10 rows across all sections, titles up to 24 chars, descriptions up to 72 chars
        let totalRows = 0;
        const safeSections = [];

        for (const section of interactive.sections) {
          if (totalRows >= 10) break;
          const remaining = 10 - totalRows;
          const safeRows = section.rows.slice(0, remaining).map((row) => ({
            id: row.id.slice(0, 200),
            title: row.title.slice(0, 24),
            description: row.description ? row.description.slice(0, 72) : undefined,
          }));

          totalRows += safeRows.length;
          safeSections.push({
            title: section.title.slice(0, 24),
            rows: safeRows,
          });
        }

        interactivePayload = {
          type: 'list',
          body: {
            text: interactive.body.slice(0, 1024),
          },
          action: {
            button: (interactive.buttonLabel || 'View Options').slice(0, 20),
            sections: safeSections,
          },
        };

        if (interactive.header) {
          interactivePayload.header = {
            type: 'text',
            text: interactive.header.slice(0, 60),
          };
        }
        if (interactive.footer) {
          interactivePayload.footer = {
            text: interactive.footer.slice(0, 60),
          };
        }
      }

      if (interactivePayload) {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: formattedPhone,
            type: 'interactive',
            interactive: interactivePayload,
          }),
        });

        const data = await res.json();
        if (res.ok && data.messages?.[0]?.id) {
          return { success: true, id: data.messages[0].id };
        } else {
          console.warn('Interactive WhatsApp message failed on Meta API, falling back to text:', data);
        }
      }
    } catch (err: any) {
      console.warn('Interactive dispatch encountered error, falling back to plain text:', err?.message);
    }
  }

  // Fallback: format buttons/lists as plain text and dispatch standard text message
  let fallbackText = interactive.body;
  if (interactive.type === 'button' && interactive.buttons) {
    fallbackText += '\n\n' + interactive.buttons.map((b, i) => `👉 Reply *${b.title}*`).join('\n');
  } else if (interactive.type === 'list' && interactive.sections) {
    fallbackText += '\n\n' + interactive.sections.map((sec) => 
      `*${sec.title}:*\n` + sec.rows.map((r) => `• *${r.title}*${r.description ? ` (${r.description})` : ''}`).join('\n')
    ).join('\n\n');
  }

  return sendRealWhatsAppMessage(formattedPhone, fallbackText);
}

/**
 * Dispatches an outgoing message to the real WhatsApp provider:
 * 1. Twilio WhatsApp API (No Facebook Dev account needed!)
 * 2. UltraMsg / Green API (Instant QR code scan!)
 * 3. Evolution API / Self-Hosted QR Gateway
 * 4. Meta WhatsApp Cloud API
 */
export async function sendRealWhatsAppMessage(toPhone: string, messageText: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const formattedPhone = toPhone.replace(/[^0-9]/g, '');

  // -------------------------------------------------------------
  // PROVIDER 1: Twilio WhatsApp API (Easiest - No Meta Dev Account Required)
  // -------------------------------------------------------------
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioAuthToken && twilioFrom) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const fromFormatted = twilioFrom.startsWith('whatsapp:') ? twilioFrom : `whatsapp:${twilioFrom}`;
      const toFormatted = `whatsapp:+${formattedPhone}`;

      const params = new URLSearchParams();
      params.append('From', fromFormatted);
      params.append('To', toFormatted);
      params.append('Body', messageText);

      const authHeader = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString('base64');
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Twilio WhatsApp error response:', data);
        return { success: false, error: data?.message || 'Twilio dispatch error' };
      }

      return { success: true, id: data.sid };
    } catch (err: any) {
      console.error('Twilio dispatch error:', err);
      return { success: false, error: err?.message };
    }
  }

  // -------------------------------------------------------------
  // PROVIDER 2: UltraMsg API (Instant QR Code link)
  // -------------------------------------------------------------
  const ultraInstance = process.env.ULTRAMSG_INSTANCE_ID;
  const ultraToken = process.env.ULTRAMSG_TOKEN;

  if (ultraInstance && ultraToken) {
    try {
      const url = `https://api.ultramsg.com/${ultraInstance}/messages/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          token: ultraToken,
          to: formattedPhone,
          body: messageText,
        }).toString(),
      });

      const data = await res.json();
      return { success: Boolean(data.sent || data.id), id: String(data.id || '') };
    } catch (err: any) {
      console.error('UltraMsg dispatch error:', err);
      return { success: false, error: err?.message };
    }
  }

  // -------------------------------------------------------------
  // PROVIDER 3: Evolution API (Self-Hosted QR Code Gateway)
  // -------------------------------------------------------------
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const evoInstance = process.env.EVOLUTION_INSTANCE_NAME || 'shu-timetable';

  if (evoUrl && evoKey) {
    try {
      const endpoint = `${evoUrl.replace(/\/$/, '')}/message/sendText/${evoInstance}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evoKey,
        },
        body: JSON.stringify({
          number: formattedPhone,
          text: messageText,
        }),
      });

      const data = await res.json();
      return { success: Boolean(data.key?.id), id: data.key?.id };
    } catch (err: any) {
      console.error('Evolution API error:', err);
      return { success: false, error: err?.message };
    }
  }

  // -------------------------------------------------------------
  // PROVIDER 4: Meta WhatsApp Cloud API (Standard)
  // -------------------------------------------------------------
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (metaToken && metaPhoneId) {
    try {
      const url = `https://graph.facebook.com/v19.0/${metaPhoneId}/messages`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: messageText },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Meta WhatsApp Cloud API error response:', data);
        return { success: false, error: data?.error?.message || 'Meta API error' };
      }

      return { success: true, id: data.messages?.[0]?.id };
    } catch (err: any) {
      console.error('Failed to dispatch real WhatsApp message:', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  }

  // Fallback for local simulation
  console.info(`[WhatsApp Dispatch Simulation] To: ${toPhone} | Length: ${messageText.length}`);
  return { success: true, id: `sim-${Date.now()}` };
}
