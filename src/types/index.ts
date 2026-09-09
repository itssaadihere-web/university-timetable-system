export type UserRole = 'student' | 'faculty' | 'coordinator' | 'admin';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  faculty_id?: string;
  password?: string;
  created_at: string;
  created_by?: string;
}

export type RoomType = 'standard' | 'horseshoe' | 'multimedia' | 'interactive_lcd' | 'computer_lab';

export interface Room {
  id: string;
  name: string;
  building: string;
  floor: number;
  capacity: number;
  room_types: RoomType[];
  is_active?: boolean;
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  max_load_per_day: number;
  availability_window?: Record<string, string[]>; // e.g. { mon: ["08:30-17:00"] }
  is_active?: boolean;
}

export interface BatchMergeGroup {
  id: string;
  name: string;
}

export interface Batch {
  id: string;
  name: string;
  program: string;
  semester: number;
  student_count: number;
  is_irregular?: boolean;
  merge_group_id?: string | null;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  credit_hours: number;
  required_room_types: RoomType[];
  prerequisites?: string[]; // Course IDs
}

export interface CoursePrerequisite {
  course_id: string;
  required_course_id: string;
}

export interface Student {
  id: string;
  roll_number: string;
  name: string;
  email: string;
  batch_id: string;
  is_irregular: boolean;
}

export interface StudentCourseCompleted {
  id: string;
  student_id: string;
  course_id: string;
  grade: string;
  semester_completed: string;
}

export type SessionType = 'regular' | 'makeup';
export type SessionStatus = 'draft' | 'published' | 'cancelled';

export interface ClassSession {
  id: string;
  semester_id: string;
  course_id: string;
  faculty_id: string;
  room_id?: string | null;
  batch_id: string;
  batch_group_id?: string | null;
  day_of_week: number; // 1 = Mon, 2 = Tue, ..., 6 = Sat, 7 = Sun
  start_time: string; // "08:30" or "08:30:00"
  end_time: string; // "10:00" or "10:00:00"
  session_type: SessionType;
  status: SessionStatus;
  specific_date?: string | null; // "YYYY-MM-DD" for makeup classes
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Semester {
  id: string;
  name: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export type CalendarEventType = 'midterm_week' | 'finals_week' | 'holiday' | 'semester_break';

export interface SemesterCalendarEvent {
  id: string;
  semester_id: string;
  event_name: string;
  event_type: CalendarEventType;
  start_date: string;
  end_date: string;
  description?: string;
}

export interface AuditLogEntry {
  id: string;
  class_session_id?: string;
  changed_by: string;
  change_type: 'INSERT' | 'UPDATE' | 'DELETE' | 'PUBLISH' | 'ROLLOVER';
  old_value?: Partial<ClassSession> | null;
  new_value?: Partial<ClassSession> | null;
  description: string;
  timestamp: string;
}

export interface TimetableVersion {
  id: string;
  semester_id: string;
  version_number: number;
  snapshot: ClassSession[];
  changes_summary?: string;
  published_by: string;
  published_at: string;
}

export interface AdvisingSuggestion {
  id: string;
  student_id: string;
  flagged_course_id: string;
  clashing_course_id?: string | null;
  reason: string;
  suggested_alternative?: {
    action?: string;
    recommended_course?: string;
    alternative_slots?: Array<{ day: number; start: string; end: string; room?: string }>;
    available_faculty_slots?: Array<{ day: number; start: string; end: string; faculty: string }>;
  };
  status: 'pending' | 'resolved' | 'dismissed';
  notes?: string;
  created_at: string;
}

export interface MakeupRequest {
  id: string;
  semester_id: string;
  course_id: string;
  faculty_id: string;
  room_id: string;
  batch_id: string;
  requested_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ConflictValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export type TimetableViewMode = 'batch' | 'faculty' | 'room';

export interface TimetableFilterState {
  viewMode: TimetableViewMode;
  selectedBatchId?: string;
  selectedFacultyId?: string;
  selectedRoomId?: string;
  selectedRoomTypes: RoomType[];
  departmentFilter: string;
  showDrafts: boolean;
  searchQuery: string;
}
