import { 
  Room, 
  Faculty, 
  Batch, 
  BatchMergeGroup, 
  Course, 
  ClassSession, 
  Semester, 
  SemesterCalendarEvent, 
  Student, 
  StudentCourseCompleted, 
  AuditLogEntry, 
  TimetableVersion,
  MakeupRequest
} from '@/types';

export const INITIAL_SEMESTERS: Semester[] = [];

export const INITIAL_CALENDAR: SemesterCalendarEvent[] = [];

export const INITIAL_ROOMS: Room[] = [];

export const INITIAL_FACULTY: Faculty[] = [];

export const INITIAL_BATCHES: Batch[] = [];

export const INITIAL_MERGE_GROUPS: BatchMergeGroup[] = [];

export const INITIAL_COURSES: Course[] = [];

export const INITIAL_STUDENTS: Student[] = [];

export const INITIAL_COMPLETED_COURSES: StudentCourseCompleted[] = [];

export const INITIAL_SESSIONS: ClassSession[] = [];

export const INITIAL_AUDIT_LOG: AuditLogEntry[] = [];

export const INITIAL_MAKEUP_REQUESTS: MakeupRequest[] = [];
