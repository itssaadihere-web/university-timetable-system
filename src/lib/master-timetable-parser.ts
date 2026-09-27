import * as XLSX from 'xlsx';
import { generateUUID, isValidUUID } from './uuid';
import { Batch, Course, Faculty, Room, RoomType, ClassSession } from '../types';

export interface ParsedTimetableSlot {
  dayOfWeek: number;
  dayName: string;
  startTime: string; // "08:30"
  endTime: string;   // "11:00"
  roomName: string;
  note?: string;
  error?: string;
}

export interface TypoSuggestion {
  field: 'course_code' | 'room' | 'day' | 'instructor';
  original: string;
  suggested: string;
  reason: string;
}

export interface AnalyzedMasterRow {
  rowNumber: number; // 1-indexed Excel row
  degreeProgram: string;
  semester: string;
  courseCode: string;
  section: string;
  courseTitle: string;
  classNo: string;
  instructorName: string;
  roomVenue: string;
  daysTimings: string;
  status: 'valid' | 'warning' | 'error';
  isExcluded: boolean;
  issues: string[];
  suggestions: TypoSuggestion[];
  parsedSlots: ParsedTimetableSlot[];
  resolvedBatchName: string;
}

export interface MasterTimetableParseResult {
  summary: {
    totalRows: number;
    validRows: number;
    warningRows: number;
    errorRows: number;
    excludedRows: number;
    uniqueBatchesCount: number;
    uniqueCoursesCount: number;
    uniqueFacultyCount: number;
    uniqueRoomsCount: number;
    totalSlotsCount: number;
  };
  rows: AnalyzedMasterRow[];
  extractedBatches: Batch[];
  extractedCourses: Course[];
  extractedFaculty: Faculty[];
  extractedRooms: Room[];
  generatedSessions: ClassSession[];
}

const DAY_MAP: Record<string, { id: number; name: string }> = {
  mon: { id: 1, name: 'Monday' },
  monday: { id: 1, name: 'Monday' },
  tue: { id: 2, name: 'Tuesday' },
  tues: { id: 2, name: 'Tuesday' },
  tuesday: { id: 2, name: 'Tuesday' },
  wed: { id: 3, name: 'Wednesday' },
  wednesday: { id: 3, name: 'Wednesday' },
  thu: { id: 4, name: 'Thursday' },
  thur: { id: 4, name: 'Thursday' },
  thurs: { id: 4, name: 'Thursday' },
  thursday: { id: 4, name: 'Thursday' },
  fri: { id: 5, name: 'Friday' },
  friday: { id: 5, name: 'Friday' },
  sat: { id: 6, name: 'Saturday' },
  saturday: { id: 6, name: 'Saturday' },
  sun: { id: 7, name: 'Sunday' },
  sunday: { id: 7, name: 'Sunday' },
};

/**
 * Converts 12-hour string (e.g. "8:30AM", "1:00PM", "11:30 AM") to 24h "HH:mm"
 */
export function convertTo24Hour(timeStr: string): string | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = (match[3] || '').toUpperCase();

  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Parses "Days & Timings" string into individual slots
 * e.g. "Mon - 8:30AM - 11:00AM; Wed - 8:30AM - 11:00AM"
 * or "Mon - 11:30AM - 1:00PM (LH 302); Wed - 11:30AM - 1:00PM (LAB 308)"
 */
export function parseTimingsString(
  timingsStr: string,
  defaultRoom: string
): { slots: ParsedTimetableSlot[]; suggestions: TypoSuggestion[]; issues: string[] } {
  const slots: ParsedTimetableSlot[] = [];
  const suggestions: TypoSuggestion[] = [];
  const issues: string[] = [];

  if (!timingsStr || typeof timingsStr !== 'string' || timingsStr.trim() === '-' || timingsStr.trim() === '') {
    issues.push('Days & Timings is missing or empty.');
    return { slots, suggestions, issues };
  }

  // Split multiple sessions separated by semicolon ';'
  const segments = timingsStr.split(';').map((s) => s.trim()).filter(Boolean);

  for (const seg of segments) {
    let room = (defaultRoom || '').trim();
    if (room === '-') room = 'TBD';
    let note = '';

    // Check parenthesis for room overrides or special notes: (LH 302) or (For BS Business Analytics only)
    const parenMatch = seg.match(/\(([^)]+)\)/);
    let cleanSeg = seg;
    if (parenMatch) {
      const inside = parenMatch[1].trim();
      if (/^for\s/i.test(inside) || /only$/i.test(inside)) {
        note = inside;
      } else {
        room = inside;
      }
      cleanSeg = seg.replace(/\([^)]+\)/g, '').trim();
    }

    // Match day, start time, end time
    // Examples: "Mon - 8:30AM - 11:00AM", "Tues - 12:00PM - 3:00PM", "Wed: 9:00AM - 12:00PM"
    const match = cleanSeg.match(/([a-zA-Z]+)\s*[-:]?\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)\s*[-–to]+\s*(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/i);

    if (match) {
      const rawDay = match[1].toLowerCase();
      const rawStart = match[2];
      const rawEnd = match[3];

      const dayInfo = DAY_MAP[rawDay];
      if (!dayInfo) {
        issues.push(`Unrecognized day name: "${match[1]}"`);
        continue;
      }

      // Check day abbreviation typo suggestion
      if (rawDay === 'tues') {
        suggestions.push({
          field: 'day',
          original: 'Tues',
          suggested: 'Tuesday',
          reason: 'Standard day naming',
        });
      } else if (rawDay === 'thurs') {
        suggestions.push({
          field: 'day',
          original: 'Thurs',
          suggested: 'Thursday',
          reason: 'Standard day naming',
        });
      }

      const start24 = convertTo24Hour(rawStart);
      const end24 = convertTo24Hour(rawEnd);

      if (!start24 || !end24) {
        issues.push(`Invalid time format in "${seg}"`);
        continue;
      }

      slots.push({
        dayOfWeek: dayInfo.id,
        dayName: dayInfo.name,
        startTime: start24,
        endTime: end24,
        roomName: room || 'TBD',
        note: note || undefined,
      });
    } else {
      issues.push(`Could not parse timing expression: "${seg}"`);
    }
  }

  return { slots, suggestions, issues };
}

/**
 * Standardizes course code (e.g. "ACC 101" -> "ACC-101", "ACC - 106" -> "ACC-106")
 */
export function standardizeCourseCode(code: string): { standardized: string; suggestion?: TypoSuggestion } {
  if (!code) return { standardized: 'CRS-100' };
  const trimmed = code.trim();
  const normalized = trimmed.replace(/\s*[-–]\s*/g, '-').replace(/\s+/g, '-').toUpperCase();

  if (normalized !== trimmed) {
    return {
      standardized: normalized,
      suggestion: {
        field: 'course_code',
        original: trimmed,
        suggested: normalized,
        reason: 'Unified hyphenated course code format',
      },
    };
  }

  return { standardized: normalized };
}

/**
 * Normalizes Room Names (e.g. "LH 302" -> "Lecture Hall 302")
 */
export function standardizeRoomName(room: string): { standardized: string; suggestion?: TypoSuggestion } {
  if (!room || room === '-' || room.toLowerCase() === 'tbd') {
    return { standardized: 'TBD' };
  }
  const trimmed = room.trim();

  // If starts with "LH " e.g. "LH 302" -> "Lecture Hall 302"
  if (/^lh\s*(\d+)/i.test(trimmed)) {
    const num = trimmed.match(/^lh\s*(\d+)/i)![1];
    const std = `Lecture Hall ${num}`;
    return {
      standardized: std,
      suggestion: {
        field: 'room',
        original: trimmed,
        suggested: std,
        reason: 'Expanded "LH" to standard "Lecture Hall"',
      },
    };
  }

  return { standardized: trimmed };
}

/**
 * Resolves Batch Name and Semester from Degree Program, Semester column, and Section
 */
export function resolveBatchInfo(
  degreeProgram: string,
  semesterVal: string,
  sectionVal: string
): { name: string; semester: number; program: string; section: string } {
  const degree = (degreeProgram || '').trim() || 'Undergraduate';
  const sem = (semesterVal || '').trim();
  const sec = (sectionVal || '').trim();

  let semPart = '1';
  let semNumber = 1;

  if (/^semester\s*(\d+)/i.test(sem)) {
    const m = sem.match(/^semester\s*(\d+)/i);
    semPart = m ? m[1] : '1';
    semNumber = parseInt(semPart, 10) || 1;
  } else {
    const m = sem.match(/[-–]\s*(\d+[A-Za-z]?)/);
    if (m) {
      semPart = m[1].toUpperCase();
    } else {
      const anyNum = sem.match(/(\d+[A-Za-z]?)/);
      if (anyNum) semPart = anyNum[1].toUpperCase();
    }
    const numOnly = semPart.match(/\d+/);
    semNumber = numOnly ? parseInt(numOnly[0], 10) : 1;
  }

  // Exact user-specified syntax: "Sem <semPart> . <Degree Program>"
  // e.g. "Sem 1 . BS (A&F)", "Sem 3A . BS (A&F)", "Sem 2 . BS (FinTech)", "Sem 2 . BBA"
  const batchName = `Sem ${semPart} . ${degree}`;

  return {
    name: batchName,
    semester: semNumber,
    program: degree,
    section: sec,
  };
}

/**
 * Primary Master Timetable Parser
 * Parses an Excel / CSV buffer or worksheet into normalized database entities and validation analysis
 */
export function parseMasterTimetableData(
  rawData: any[][],
  existingBatches: Batch[] = [],
  existingCourses: Course[] = [],
  existingFaculty: Faculty[] = [],
  existingRooms: Room[] = [],
  activeSemesterId: string = '11111111-1111-1111-1111-111111111111'
): MasterTimetableParseResult {
  // 1. Locate header row
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, rawData.length); i++) {
    const row = rawData[i];
    if (
      row &&
      row.some(
        (cell) =>
          typeof cell === 'string' &&
          (cell.toLowerCase().includes('course code') ||
            cell.toLowerCase().includes('degree program') ||
            cell.toLowerCase().includes('instructor'))
      )
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error(
      'Could not detect timetable table headers. Required columns: Degree Program, Semester, Course Code, Section, Course Title, Instructor Name, Room / Venue, Days & Timings.'
    );
  }

  const headerRow = rawData[headerIndex].map((h) => String(h || '').trim().toLowerCase());
  const getColIdx = (...terms: string[]) => {
    return headerRow.findIndex((h) =>
      terms.some((t) => h.replace(/[\s_-]+/g, '').includes(t.replace(/[\s_-]+/g, '')))
    );
  };

  const degreeIdx = getColIdx('degreeprogram', 'degree', 'program');
  const semIdx = getColIdx('semester', 'sem');
  const codeIdx = getColIdx('coursecode', 'code');
  const secIdx = getColIdx('section', 'sec');
  const titleIdx = getColIdx('coursetitle', 'title', 'course');
  const classNoIdx = getColIdx('classno', 'class', 'crn');
  const instructorIdx = getColIdx('instructorname', 'instructor', 'faculty', 'teacher');
  const roomIdx = getColIdx('roomvenue', 'room', 'venue');
  const timingsIdx = getColIdx('daystimings', 'days', 'timings', 'schedule');

  const rows = rawData.slice(headerIndex + 1);

  const analyzedRows: AnalyzedMasterRow[] = [];
  const batchesMap = new Map<string, Batch>();
  const coursesMap = new Map<string, Course>();
  const facultyMap = new Map<string, Faculty>();
  const roomsMap = new Map<string, Room>();
  const generatedSessions: ClassSession[] = [];

  // Seed with existing entities
  existingBatches.forEach((b) => batchesMap.set(b.name.trim().toLowerCase(), b));
  existingCourses.forEach((c) => coursesMap.set(c.code.trim().toLowerCase(), c));
  existingFaculty.forEach((f) => facultyMap.set(f.name.trim().toLowerCase(), f));
  existingRooms.forEach((r) => roomsMap.set(r.name.trim().toLowerCase(), r));

  // Initialize room with all 5 specialities enabled by default
  const defaultRoomSpecialities: RoomType[] = ['standard', 'multimedia', 'interactive_lcd', 'computer_lab', 'horseshoe'];

  rows.forEach((r, idx) => {
    // Skip empty lines
    if (!r || r.length === 0 || !r.some((c) => c !== undefined && String(c).trim() !== '')) {
      return;
    }

    const rowNum = headerIndex + 2 + idx;
    const rawDegree = String(r[degreeIdx] ?? '').trim();
    const rawSem = String(r[semIdx] ?? '').trim();
    const rawCode = String(r[codeIdx] ?? '').trim();
    const rawSec = String(r[secIdx] ?? '').trim();
    const rawTitle = String(r[titleIdx] ?? '').trim();
    const rawClassNo = String(r[classNoIdx] ?? '').trim();
    const rawInstructor = String(r[instructorIdx] ?? '').trim();
    const rawRoom = String(r[roomIdx] ?? '').trim();
    const rawTimings = String(r[timingsIdx] ?? '').trim();

    const issues: string[] = [];
    const suggestions: TypoSuggestion[] = [];

    if (!rawCode) {
      issues.push('Missing Course Code.');
    }
    if (!rawTitle) {
      issues.push('Missing Course Title.');
    }
    if (!rawTimings || rawTimings === '-') {
      issues.push('Missing Days & Timings.');
    }

    // 1. Course Code & Title
    const { standardized: stdCode, suggestion: codeSugg } = standardizeCourseCode(rawCode);
    if (codeSugg) suggestions.push(codeSugg);

    // 2. Room & Typo
    const { standardized: stdRoom, suggestion: roomSugg } = standardizeRoomName(rawRoom);
    if (roomSugg) suggestions.push(roomSugg);

    // 3. Batch info
    const batchInfo = resolveBatchInfo(rawDegree, rawSem, rawSec);

    // 4. Parse Days & Timings
    const { slots, suggestions: timingSuggs, issues: timingIssues } = parseTimingsString(rawTimings, stdRoom);
    suggestions.push(...timingSuggs);
    issues.push(...timingIssues);

    const hasFatal = issues.some((i) => i.includes('Missing Course Code') || i.includes('Invalid time format') || i.includes('Missing Days'));
    const status: 'valid' | 'warning' | 'error' = hasFatal ? 'error' : (issues.length > 0 ? 'warning' : 'valid');

    analyzedRows.push({
      rowNumber: rowNum,
      degreeProgram: rawDegree,
      semester: rawSem,
      courseCode: stdCode,
      section: rawSec,
      courseTitle: rawTitle,
      classNo: rawClassNo,
      instructorName: rawInstructor,
      roomVenue: stdRoom,
      daysTimings: rawTimings,
      status,
      isExcluded: status === 'error',
      issues,
      suggestions,
      parsedSlots: slots,
      resolvedBatchName: batchInfo.name,
    });

    // If row is not fatal error, build entities
    if (status !== 'error') {
      // --- Batch Entity ---
      const batchKey = batchInfo.name.trim().toLowerCase();
      let resolvedBatch = batchesMap.get(batchKey);
      if (!resolvedBatch) {
        resolvedBatch = {
          id: generateUUID(),
          name: batchInfo.name,
          program: batchInfo.program,
          semester: batchInfo.semester,
          section: batchInfo.section || undefined,
          student_count: 40,
          is_irregular: false,
        };
        batchesMap.set(batchKey, resolvedBatch);
      }

      // --- Course Entity ---
      const courseKey = stdCode.trim().toLowerCase();
      let resolvedCourse = coursesMap.get(courseKey);
      if (!resolvedCourse) {
        const isLabCourse = rawTitle.toLowerCase().includes('lab') || rawTitle.toLowerCase().includes('ict');
        resolvedCourse = {
          id: generateUUID(),
          code: stdCode,
          name: rawTitle,
          department: batchInfo.program || 'Management Sciences',
          credit_hours: 3,
          required_room_types: isLabCourse ? ['computer_lab', 'multimedia'] : ['standard'],
        };
        coursesMap.set(courseKey, resolvedCourse);
      }

      // --- Faculty Entity ---
      const facNames = rawInstructor.split(/[,/]+/).map((s) => s.trim()).filter((s) => Boolean(s) && s !== '-');
      const primaryInstructorName = facNames.length > 0 ? facNames[0] : (rawInstructor || 'Department Faculty');
      const facKey = primaryInstructorName.trim().toLowerCase();
      let resolvedFaculty = facultyMap.get(facKey);
      if (!resolvedFaculty) {
        const emailSlug = primaryInstructorName
          .toLowerCase()
          .replace(/^dr\.?\s*/i, '')
          .replace(/^mr\.?\s*/i, '')
          .replace(/^ms\.?\s*/i, '')
          .replace(/^engr\.?\s*/i, '')
          .replace(/^prof\.?\s*/i, '')
          .trim()
          .replace(/\s+/g, '.');

        resolvedFaculty = {
          id: generateUUID(),
          name: primaryInstructorName,
          email: `${emailSlug || 'faculty'}@shu.edu.pk`,
          department: batchInfo.program || 'Management Sciences',
          max_load_per_day: 4,
          is_active: true,
        };
        facultyMap.set(facKey, resolvedFaculty);
      }

      // --- Sessions & Rooms ---
      slots.forEach((slot) => {
        const slotRoomName = slot.roomName && slot.roomName !== '-' ? slot.roomName : stdRoom;
        let resolvedRoomId: string | null = null;

        if (slotRoomName && slotRoomName !== 'TBD' && slotRoomName !== '-') {
          const roomKey = slotRoomName.trim().toLowerCase();
          let resolvedRoom = roomsMap.get(roomKey);
          if (!resolvedRoom) {
            // Determine building / floor from room code
            let building = 'Academic Block';
            let floor = 1;
            if (slotRoomName.startsWith('TF-') || slotRoomName.includes('302') || slotRoomName.includes('311')) {
              building = 'Third Floor (Block A)';
              floor = 3;
            } else if (slotRoomName.startsWith('FRF-') || slotRoomName.includes('401') || slotRoomName.includes('405')) {
              building = 'Fourth Floor (Block A)';
              floor = 4;
            } else if (slotRoomName.startsWith('SF-')) {
              building = 'Second Floor (Block A)';
              floor = 2;
            } else if (slotRoomName.startsWith('FF-')) {
              building = 'First Floor (Block A)';
              floor = 1;
            } else if (slotRoomName.toLowerCase().includes('old building') || slotRoomName.startsWith('C-')) {
              building = 'Old Building';
              floor = 2;
            }

            resolvedRoom = {
              id: generateUUID(),
              name: slotRoomName,
              building,
              floor,
              capacity: 50,
              // All specialities enabled by default as requested!
              room_types: defaultRoomSpecialities,
              is_active: true,
            };
            roomsMap.set(roomKey, resolvedRoom);
          }
          resolvedRoomId = resolvedRoom ? resolvedRoom.id : null;
        }

        generatedSessions.push({
          id: generateUUID(),
          semester_id: activeSemesterId,
          batch_id: resolvedBatch!.id,
          course_id: resolvedCourse!.id,
          faculty_id: resolvedFaculty!.id,
          room_id: resolvedRoomId,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime,
          session_type: 'regular',
          status: 'published',
        });
      });
    }
  });

  const totalValid = analyzedRows.filter((r) => r.status === 'valid').length;
  const totalWarning = analyzedRows.filter((r) => r.status === 'warning').length;
  const totalError = analyzedRows.filter((r) => r.status === 'error').length;
  const totalExcluded = analyzedRows.filter((r) => r.isExcluded).length;

  return {
    summary: {
      totalRows: analyzedRows.length,
      validRows: totalValid,
      warningRows: totalWarning,
      errorRows: totalError,
      excludedRows: totalExcluded,
      uniqueBatchesCount: batchesMap.size,
      uniqueCoursesCount: coursesMap.size,
      uniqueFacultyCount: facultyMap.size,
      uniqueRoomsCount: roomsMap.size,
      totalSlotsCount: generatedSessions.length,
    },
    rows: analyzedRows,
    extractedBatches: Array.from(batchesMap.values()),
    extractedCourses: Array.from(coursesMap.values()),
    extractedFaculty: Array.from(facultyMap.values()),
    extractedRooms: Array.from(roomsMap.values()),
    generatedSessions,
  };
}
