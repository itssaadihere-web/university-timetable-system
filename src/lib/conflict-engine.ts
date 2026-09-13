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
 * Convert 24-hour time string ("08:30" or "13:00") to 12-hour format ("08:30 AM" or "01:00 PM")
 */
export function formatTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  if (isNaN(hours)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const paddedHours = hours < 10 ? `0${hours}` : `${hours}`;
  return `${paddedHours}:${minutes} ${period}`;
}

/**
 * Convert time range to 12-hour format ("08:30 AM – 10:00 AM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return '';
  return `${formatTo12Hour(startTime)} – ${formatTo12Hour(endTime)}`;
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

export const TIME_SLOTS_30MIN: { id: number; start: string; end: string; label: string; start12: string; end12: string }[] = [
  { id: 0, start: '08:30', end: '09:00', label: '08:30 AM – 09:00 AM', start12: '08:30 AM', end12: '09:00 AM' },
  { id: 1, start: '09:00', end: '09:30', label: '09:00 AM – 09:30 AM', start12: '09:00 AM', end12: '09:30 AM' },
  { id: 2, start: '09:30', end: '10:00', label: '09:30 AM – 10:00 AM', start12: '09:30 AM', end12: '10:00 AM' },
  { id: 3, start: '10:00', end: '10:30', label: '10:00 AM – 10:30 AM', start12: '10:00 AM', end12: '10:30 AM' },
  { id: 4, start: '10:30', end: '11:00', label: '10:30 AM – 11:00 AM', start12: '10:30 AM', end12: '11:00 AM' },
  { id: 5, start: '11:00', end: '11:30', label: '11:00 AM – 11:30 AM', start12: '11:00 AM', end12: '11:30 AM' },
  { id: 6, start: '11:30', end: '12:00', label: '11:30 AM – 12:00 PM', start12: '11:30 AM', end12: '12:00 PM' },
  { id: 7, start: '12:00', end: '12:30', label: '12:00 PM – 12:30 PM', start12: '12:00 PM', end12: '12:30 PM' },
  { id: 8, start: '12:30', end: '13:00', label: '12:30 PM – 01:00 PM', start12: '12:30 PM', end12: '01:00 PM' },
  { id: 9, start: '13:00', end: '13:30', label: '01:00 PM – 01:30 PM', start12: '01:00 PM', end12: '01:30 PM' },
  { id: 10, start: '13:30', end: '14:00', label: '01:30 PM – 02:00 PM', start12: '01:30 PM', end12: '02:00 PM' },
  { id: 11, start: '14:00', end: '14:30', label: '02:00 PM – 02:30 PM', start12: '02:00 PM', end12: '02:30 PM' },
  { id: 12, start: '14:30', end: '15:00', label: '02:30 PM – 03:00 PM', start12: '02:30 PM', end12: '03:00 PM' },
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
  rowStart: number;
  rowSpan: number;
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

  const start1Based = slotIndex + 1;
  const spanBoxes = Math.min(boxesCount, TOTAL_30MIN_SLOTS - slotIndex);

  const startPercent = Math.max(0, Math.min(100, ((startMins - baseStart) / baseTotal) * 100));
  const durationPercent = Math.max(0, Math.min(100 - startPercent, (durationMins / baseTotal) * 100));

  return {
    colStart: start1Based,
    colSpan: spanBoxes,
    rowStart: start1Based,
    rowSpan: spanBoxes,
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

  // Rules 1, 2, 3: Overlaps (Room, Teacher, and Batch Double-Bookings)
  // Note: Classes can be conducted or attended back-to-back by students and faculty without artificial buffer restrictions.
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
    const exRoom = rooms.find(
      (r) =>
        r.id === existing.room_id &&
        r.id !== 'a0000000-0000-0000-0000-000000000000' &&
        r.building !== 'TBD'
    );
    const exRoomName = exRoom ? `Room "${exRoom.name}"` : 'Unassigned Room';
    const exBatch = batches.find((b) => b.id === existing.batch_id);
    const exTimeFormatted = formatTimeRange(existing.start_time, existing.end_time);

    const isSameMergeGroup =
      Boolean(batchGroupId) && Boolean(existing.batch_group_id) && existing.batch_group_id === batchGroupId;

    // Approved joint batch merge session (same course, faculty, start, end time, and shared merge group)
    const isApprovedMergeSession =
      isSameMergeGroup &&
      existing.course_id === courseId &&
      existing.faculty_id === facultyId &&
      existing.start_time === startTimeStr &&
      existing.end_time === endTimeStr;

    if (isDirectOverlap) {
      // 1. Room Unavailable Clash (Only evaluated if a physical room is assigned and not an approved joint merge session)
      const isPhysicalRoomAssigned = Boolean(
        roomId &&
          roomId.trim() !== '' &&
          roomId !== 'a0000000-0000-0000-0000-000000000000' &&
          roomId !== 'room-unassigned'
      );
      if (isPhysicalRoomAssigned && existing.room_id === roomId && !isApprovedMergeSession) {
        errors.push(
          `[Room Clash]: "${roomName}" is occupied by ${exCourseName} for batch "${exBatch?.name || 'Batch'}" (${exTimeFormatted}).`
        );
      }

      // 2. Teacher Clash (Faculty Double-Booking - exempted if conducting joint merged session)
      if (existing.faculty_id === facultyId && !isApprovedMergeSession) {
        errors.push(
          `[Teacher Clash]: Instructor ${facultyName} is already teaching ${exCourseName} in ${exRoomName} (${exTimeFormatted}).`
        );
      }

      // 3. Student's Clash (Batch Double-Booking)
      const isSameBatch = existing.batch_id === batchId;

      if (isSameBatch || isSameMergeGroup) {
        if (!isApprovedMergeSession) {
          errors.push(
            `[Batch Clash]: Students in "${batchName}" already have ${exCourseName} in ${exRoomName} (${exTimeFormatted}).`
          );
        }
      }

      // Soft Warning: If merged joint class, check room capacity
      if (isApprovedMergeSession && room) {
        const combinedCount = (batch?.student_count || 30) + (exBatch?.student_count || 30);
        if (combinedCount > room.capacity) {
          warnings.push(
            `[Capacity Warning]: Merged classes ("${batchName}" + "${exBatch?.name}") total ${combinedCount} students in Room "${room.name}" (Capacity: ${room.capacity}).`
          );
        }
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

export interface BatchMergeCandidate {
  existingSession: ClassSession;
  existingBatch: Batch;
  newBatch: Batch;
  course: Course;
  faculty: Faculty;
  room: Room | null;
  combinedStudentCount: number;
  roomCapacity: number;
  hasCapacityIssue: boolean;
}

/**
 * Detects if a proposed or dragged session matches an existing session
 * (same teacher, same course, same room, same day & overlapping time, but different batch)
 * that is eligible for a joint batch merge.
 */
export function findBatchMergeCandidate(params: {
  sessionToValidate: Partial<ClassSession>;
  existingSessions: ClassSession[];
  batches: Batch[];
  courses: Course[];
  faculty: Faculty[];
  rooms: Room[];
}): BatchMergeCandidate | null {
  const { sessionToValidate, existingSessions, batches, courses, faculty, rooms } = params;

  if (!sessionToValidate.faculty_id || !sessionToValidate.course_id || !sessionToValidate.batch_id) {
    return null;
  }

  const startMins = timeToMinutes(sessionToValidate.start_time || '');
  const endMins = timeToMinutes(sessionToValidate.end_time || '');
  if (endMins <= startMins) return null;

  const currentBatch = batches.find((b) => b.id === sessionToValidate.batch_id);
  const currentCourse = courses.find((c) => c.id === sessionToValidate.course_id);
  const currentFaculty = faculty.find((f) => f.id === sessionToValidate.faculty_id);
  const currentRoom = rooms.find(
    (r) =>
      r.id === sessionToValidate.room_id &&
      r.id !== 'a0000000-0000-0000-0000-000000000000' &&
      r.building !== 'TBD'
  );

  if (!currentBatch || !currentCourse || !currentFaculty) return null;

  for (const existing of existingSessions) {
    if (existing.id === sessionToValidate.id || existing.status === 'cancelled') continue;

    // Check same day / date context
    const isSameDateContext =
      (sessionToValidate.specific_date && existing.specific_date === sessionToValidate.specific_date) ||
      (!sessionToValidate.specific_date &&
        !existing.specific_date &&
        existing.day_of_week === sessionToValidate.day_of_week);

    if (!isSameDateContext) continue;

    const exStartMins = timeToMinutes(existing.start_time);
    const exEndMins = timeToMinutes(existing.end_time);
    const isDirectOverlap = Math.max(startMins, exStartMins) < Math.min(endMins, exEndMins);
    if (!isDirectOverlap) continue;

    // Check same teacher
    if (existing.faculty_id !== sessionToValidate.faculty_id) continue;

    // Check same course (or same course code)
    const exCourse = courses.find((c) => c.id === existing.course_id);
    const isSameOrSimilarCourse =
      existing.course_id === sessionToValidate.course_id ||
      (exCourse && currentCourse && exCourse.code === currentCourse.code);

    if (!isSameOrSimilarCourse) continue;

    // Check same room (or both unassigned)
    const exHasRoom =
      existing.room_id &&
      existing.room_id !== 'a0000000-0000-0000-0000-000000000000' &&
      existing.room_id !== 'room-unassigned';
    const curHasRoom =
      sessionToValidate.room_id &&
      sessionToValidate.room_id !== 'a0000000-0000-0000-0000-000000000000' &&
      sessionToValidate.room_id !== 'room-unassigned';

    if (exHasRoom && curHasRoom && existing.room_id !== sessionToValidate.room_id) {
      continue;
    }

    // Must be a different batch
    if (existing.batch_id === sessionToValidate.batch_id) continue;

    // Must not already be merged together under the same merge group
    if (
      sessionToValidate.batch_group_id &&
      existing.batch_group_id &&
      sessionToValidate.batch_group_id === existing.batch_group_id
    ) {
      continue;
    }

    const exBatch = batches.find((b) => b.id === existing.batch_id);
    if (!exBatch) continue;

    const exRoom = rooms.find((r) => r.id === existing.room_id) || currentRoom || null;
    const combinedStudentCount = (currentBatch.student_count || 40) + (exBatch.student_count || 40);
    const roomCapacity = exRoom?.capacity || 60;

    return {
      existingSession: existing,
      existingBatch: exBatch,
      newBatch: currentBatch,
      course: currentCourse,
      faculty: currentFaculty,
      room: exRoom,
      combinedStudentCount,
      roomCapacity,
      hasCapacityIssue: combinedStudentCount > roomCapacity,
    };
  }

  return null;
}
