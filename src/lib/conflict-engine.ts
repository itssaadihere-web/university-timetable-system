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
      // 1. Room Double-Booking
      if (existing.room_id === roomId) {
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
