import { 
  ClassSession, 
  Room, 
  Faculty, 
  Batch, 
  Course, 
  SemesterCalendarEvent, 
  ConflictValidationResult 
} from '@/types';

/**
 * Convert HH:MM or HH:MM:SS string to total minutes from 00:00
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * Standard Institutional Teachable Time Window (08:30 AM - 03:00 PM)
 * 13 equal 30-minute intervals = 6.5 hours = 390 minutes.
 */
export const TEACHABLE_START_TIME = '08:30';
export const TEACHABLE_END_TIME = '15:00';
export const TEACHABLE_START_MINUTES = 510; // 08:30
export const TEACHABLE_END_MINUTES = 900;   // 15:00
export const TOTAL_30MIN_SLOTS = 13;

export const TIME_SLOTS_30MIN: { id: number; start: string; end: string; label: string }[] = [
  { id: 0, start: '08:30', end: '09:00', label: '08:30 - 09:00' },
  { id: 1, start: '09:00', end: '09:30', label: '09:00 - 09:30' },
  { id: 2, start: '09:30', end: '10:00', label: '09:30 - 10:00' },
  { id: 3, start: '10:00', end: '10:30', label: '10:00 - 10:30' },
  { id: 4, start: '10:30', end: '11:00', label: '10:30 - 11:00' },
  { id: 5, start: '11:00', end: '11:30', label: '11:00 - 11:30' },
  { id: 6, start: '11:30', end: '12:00', label: '11:30 - 12:00' },
  { id: 7, start: '12:00', end: '12:30', label: '12:00 - 12:30' },
  { id: 8, start: '12:30', end: '13:00', label: '12:30 - 13:00' },
  { id: 9, start: '13:00', end: '13:30', label: '13:00 - 13:30' },
  { id: 10, start: '13:30', end: '14:00', label: '13:30 - 14:00' },
  { id: 11, start: '14:00', end: '14:30', label: '14:00 - 14:30' },
  { id: 12, start: '14:30', end: '15:00', label: '14:30 - 15:00' },
];

export const TIMETABLE_DAYS = [
  { id: 1, name: 'Monday', short: 'Mon', isWeekend: false },
  { id: 2, name: 'Tuesday', short: 'Tue', isWeekend: false },
  { id: 3, name: 'Wednesday', short: 'Wed', isWeekend: false },
  { id: 4, name: 'Thursday', short: 'Thu', isWeekend: false },
  { id: 5, name: 'Friday', short: 'Fri', isWeekend: false },
  { id: 6, name: 'Saturday', short: 'Sat', isWeekend: true },
  { id: 7, name: 'Sunday', short: 'Sun', isWeekend: true },
];

/**
 * Calculates grid column start and span (in 30-min box units)
 * e.g., 3-hour class (180 mins) = 6 boxes
 *       2-hour class (120 mins) = 4 boxes
 *       1.5-hour class (90 mins) = 3 boxes
 */
export function calculateSlotSpan(startTime: string, endTime: string): {
  colStart: number;
  colSpan: number;
  slotIndex: number;
  boxesCount: number;
  startPercent: number;
  durationPercent: number;
} {
  const startMins = timeToMinutes(startTime);
  const endMins = timeToMinutes(endTime);
  const baseStart = TEACHABLE_START_MINUTES;
  const baseTotal = TEACHABLE_END_MINUTES - TEACHABLE_START_MINUTES;

  const rawSlotIndex = (startMins - baseStart) / 30;
  const slotIndex = Math.max(0, Math.min(TOTAL_30MIN_SLOTS - 1, Math.floor(rawSlotIndex)));
  const durationMins = Math.max(15, endMins - startMins);
  const boxesCount = Math.max(1, Math.round(durationMins / 30));

  const colStart = slotIndex + 1;
  const colSpan = Math.min(boxesCount, TOTAL_30MIN_SLOTS - slotIndex);

  const startPercent = Math.max(0, Math.min(100, ((startMins - baseStart) / baseTotal) * 100));
  const durationPercent = Math.max(0, Math.min(100 - startPercent, (durationMins / baseTotal) * 100));

  return {
    colStart,
    colSpan,
    slotIndex,
    boxesCount,
    startPercent,
    durationPercent,
  };
}

/**
 * Format minutes back to HH:MM (24-hour)
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export interface ConflictCheckContext {
  sessionToValidate: Partial<ClassSession>;
  existingSessions: ClassSession[];
  rooms: Room[];
  faculty: Faculty[];
  batches: Batch[];
  courses: Course[];
  calendarEvents?: SemesterCalendarEvent[];
}

/**
 * Evaluates whether a proposed session has any clashes across Rooms, Faculty, Batches,
 * 15-minute buffer boundaries, room equipment capabilities, or holiday/exam calendar dates.
 */
export function validateSessionConflicts(ctx: ConflictCheckContext): ConflictValidationResult {
  const { sessionToValidate, existingSessions, rooms, faculty, batches, courses, calendarEvents = [] } = ctx;
  const errors: string[] = [];
  const warnings: string[] = [];

  const sessionId = sessionToValidate.id;
  const courseId = sessionToValidate.course_id;
  const facultyId = sessionToValidate.faculty_id;
  const roomId = sessionToValidate.room_id;
  const batchId = sessionToValidate.batch_id;
  const batchGroupId = sessionToValidate.batch_group_id;
  const dayOfWeek = sessionToValidate.day_of_week;
  const startTimeStr = sessionToValidate.start_time;
  const endTimeStr = sessionToValidate.end_time;
  const sessionType = sessionToValidate.session_type || 'regular';
  const status = sessionToValidate.status || 'draft';
  const specificDate = sessionToValidate.specific_date;

  if (status === 'cancelled') {
    return { valid: true, errors: [], warnings: [] };
  }

  if (!courseId || !facultyId || !roomId || !batchId || !startTimeStr || !endTimeStr) {
    return {
      valid: false,
      errors: ['Incomplete session information provided.'],
    };
  }

  const startMins = timeToMinutes(startTimeStr);
  const endMins = timeToMinutes(endTimeStr);

  if (endMins <= startMins) {
    errors.push(`End time (${endTimeStr}) must be later than start time (${startTimeStr}).`);
  }

  // Lookup metadata
  const room = rooms.find((r) => r.id === roomId);
  const teacher = faculty.find((f) => f.id === facultyId);
  const batch = batches.find((b) => b.id === batchId);
  const course = courses.find((c) => c.id === courseId);

  const roomName = room ? room.name : 'Unknown Room';
  const facultyName = teacher ? teacher.name : 'Unknown Faculty';
  const batchName = batch ? batch.name : 'Unknown Batch';
  const courseName = course ? `${course.code} - ${course.name}` : 'Unknown Course';

  // Rule 5: Room Capability Check
  if (course && room && course.required_room_types && course.required_room_types.length > 0) {
    const missingCapabilities = course.required_room_types.filter(
      (requiredTag) => !room.room_types.includes(requiredTag)
    );

    if (missingCapabilities.length > 0) {
      errors.push(
        `Room Capability Mismatch: Course "${course.code}" requires [${missingCapabilities.join(', ')}], but Room "${roomName}" only provides [${room.room_types.join(', ')}].`
      );
    }
  }

  // Rule 6: Calendar Holiday / Exam Check for regular recurring sessions
  if (sessionType === 'regular' && specificDate) {
    const sessionDate = new Date(specificDate);
    const conflictingEvent = calendarEvents.find((evt) => {
      const s = new Date(evt.start_date);
      const e = new Date(evt.end_date);
      return sessionDate >= s && sessionDate <= e;
    });

    if (conflictingEvent) {
      errors.push(
        `Calendar Restriction: Regular recurring session cannot be scheduled during "${conflictingEvent.event_name}" (${specificDate}).`
      );
    }
  }

  // Rule 1, 2, 3, 4: Overlaps and 15-Minute Buffers
  for (const existing of existingSessions) {
    // Skip self and cancelled
    if (existing.id === sessionId || existing.status === 'cancelled') {
      continue;
    }

    // Match day / specific_date
    const isSameDateContext =
      (specificDate && existing.specific_date === specificDate) ||
      (!specificDate && !existing.specific_date && existing.day_of_week === dayOfWeek);

    if (!isSameDateContext) {
      continue;
    }

    const exStartMins = timeToMinutes(existing.start_time);
    const exEndMins = timeToMinutes(existing.end_time);

    const isDirectOverlap =
      Math.max(startMins, exStartMins) < Math.min(endMins, exEndMins);

    const exCourse = courses.find((c) => c.id === existing.course_id);
    const exCourseName = exCourse ? `${exCourse.code} (${exCourse.name})` : 'Class';
    const exRoom = rooms.find((r) => r.id === existing.room_id);
    const exBatch = batches.find((b) => b.id === existing.batch_id);

    if (isDirectOverlap) {
      // 1. Room Double-Booking (Only evaluated if a physical room is assigned)
      const isPhysicalRoomAssigned = Boolean(roomId && roomId.trim() !== '');
      if (isPhysicalRoomAssigned && existing.room_id === roomId) {
        errors.push(
          `Room Double-Booking: Room "${roomName}" is already booked for "${exCourseName}" with batch "${exBatch?.name || 'Batch'}" from ${existing.start_time} to ${existing.end_time}.`
        );
      }

      // 2. Faculty Double-Booking
      if (existing.faculty_id === facultyId) {
        errors.push(
          `Faculty Double-Booking: ${facultyName} is already teaching "${exCourseName}" in Room "${exRoom?.name || 'Room'}" from ${existing.start_time} to ${existing.end_time}.`
        );
      }

      // 3. Batch Double-Booking
      const isSameBatch = existing.batch_id === batchId;
      const isSameMergeGroup =
        Boolean(batchGroupId) && Boolean(existing.batch_group_id) && existing.batch_group_id === batchGroupId;

      if (isSameBatch || isSameMergeGroup) {
        // Exception: Approved batch merge session (same course, faculty, start, end time)
        const isApprovedMergeSession =
          isSameMergeGroup &&
          existing.course_id === courseId &&
          existing.faculty_id === facultyId &&
          existing.start_time === startTimeStr &&
          existing.end_time === endTimeStr;

        if (!isApprovedMergeSession) {
          errors.push(
            `Batch Double-Booking: Batch "${batchName}" is already scheduled for "${exCourseName}" in Room "${exRoom?.name || 'Room'}" from ${existing.start_time} to ${existing.end_time}.`
          );
        }
      }
    }

    // 4. Buffer Rule (Mandatory 15-minute gap between adjacent sessions for faculty OR batch)
    if (existing.faculty_id === facultyId || existing.batch_id === batchId) {
      const isBufferViolation =
        (startMins >= exEndMins && startMins - exEndMins < 15) ||
        (exStartMins >= endMins && exStartMins - endMins < 15);

      if (isBufferViolation) {
        const entityLabel =
          existing.faculty_id === facultyId ? `Faculty (${facultyName})` : `Batch (${batchName})`;
        errors.push(
          `15-Minute Buffer Violation: Less than 15-minute transition gap with adjacent class "${exCourseName}" (${existing.start_time} - ${existing.end_time}) for ${entityLabel}.`
        );
      }
    }
  }

  // Soft check: Faculty daily workload limit warning
  if (teacher && teacher.max_load_per_day) {
    const facultySessionsToday = existingSessions.filter(
      (s) =>
        s.faculty_id === facultyId &&
        s.id !== sessionId &&
        s.status !== 'cancelled' &&
        ((specificDate && s.specific_date === specificDate) ||
          (!specificDate && !s.specific_date && s.day_of_week === dayOfWeek))
    );

    const totalHoursToday =
      facultySessionsToday.reduce((acc, s) => {
        return acc + (timeToMinutes(s.end_time) - timeToMinutes(s.start_time)) / 60;
      }, 0) + (endMins - startMins) / 60;

    if (totalHoursToday > teacher.max_load_per_day) {
      warnings.push(
        `Faculty Load Notice: ${facultyName} will reach ${totalHoursToday.toFixed(1)} hrs on this day (target limit: ${teacher.max_load_per_day} hrs).`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
