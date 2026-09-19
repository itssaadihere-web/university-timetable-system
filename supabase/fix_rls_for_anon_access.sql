-- ============================================================================
-- FIX ROW-LEVEL SECURITY (RLS) POLICIES FOR ANONYMOUS & AUTHENTICATED ACCESS
-- ============================================================================
-- This script resolves: "new row violates row-level security policy for table students"
-- Run this script in your Supabase Dashboard: SQL Editor -> New Query -> Run.
-- ============================================================================

-- 1. Extend students table columns (in case not already applied)
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS campus_id TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active in Program';
ALTER TABLE IF EXISTS public.students ADD COLUMN IF NOT EXISTS program TEXT;
ALTER TABLE IF EXISTS public.batches ADD COLUMN IF NOT EXISTS program_code TEXT;
ALTER TABLE IF EXISTS public.batches ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE IF EXISTS public.batches ADD COLUMN IF NOT EXISTS parent_batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;

-- 2. Ensure RLS allows full read/write for both anon and authenticated roles
-- (The web application uses the Supabase anon key with client-side role authorization)

-- STUDENTS
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "students_select_policy" ON public.students;
DROP POLICY IF EXISTS "students_insert_policy" ON public.students;
DROP POLICY IF EXISTS "students_update_policy" ON public.students;
DROP POLICY IF EXISTS "students_delete_policy" ON public.students;
DROP POLICY IF EXISTS "students_all_policy" ON public.students;
DROP POLICY IF EXISTS "Allow all for students" ON public.students;

CREATE POLICY "students_all_policy" ON public.students
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- BATCHES
ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batches_select_policy" ON public.batches;
DROP POLICY IF EXISTS "batches_insert_policy" ON public.batches;
DROP POLICY IF EXISTS "batches_update_policy" ON public.batches;
DROP POLICY IF EXISTS "batches_delete_policy" ON public.batches;
DROP POLICY IF EXISTS "batches_all_policy" ON public.batches;

CREATE POLICY "batches_all_policy" ON public.batches
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- ROOMS
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_select_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_insert_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_update_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_delete_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_all_policy" ON public.rooms;

CREATE POLICY "rooms_all_policy" ON public.rooms
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- FACULTY
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faculty_select_policy" ON public.faculty;
DROP POLICY IF EXISTS "faculty_insert_policy" ON public.faculty;
DROP POLICY IF EXISTS "faculty_update_policy" ON public.faculty;
DROP POLICY IF EXISTS "faculty_delete_policy" ON public.faculty;
DROP POLICY IF EXISTS "faculty_all_policy" ON public.faculty;

CREATE POLICY "faculty_all_policy" ON public.faculty
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- COURSES
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_select_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_update_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_policy" ON public.courses;
DROP POLICY IF EXISTS "courses_all_policy" ON public.courses;

CREATE POLICY "courses_all_policy" ON public.courses
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- CLASS SESSIONS
ALTER TABLE IF EXISTS public.class_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "class_sessions_select_policy" ON public.class_sessions;
DROP POLICY IF EXISTS "class_sessions_insert_policy" ON public.class_sessions;
DROP POLICY IF EXISTS "class_sessions_update_policy" ON public.class_sessions;
DROP POLICY IF EXISTS "class_sessions_delete_policy" ON public.class_sessions;
DROP POLICY IF EXISTS "class_sessions_all_policy" ON public.class_sessions;

CREATE POLICY "class_sessions_all_policy" ON public.class_sessions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- BATCH MERGE GROUPS
ALTER TABLE IF EXISTS public.batch_merge_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batch_merge_groups_select_policy" ON public.batch_merge_groups;
DROP POLICY IF EXISTS "batch_merge_groups_insert_policy" ON public.batch_merge_groups;
DROP POLICY IF EXISTS "batch_merge_groups_update_policy" ON public.batch_merge_groups;
DROP POLICY IF EXISTS "batch_merge_groups_delete_policy" ON public.batch_merge_groups;
DROP POLICY IF EXISTS "batch_merge_groups_all_policy" ON public.batch_merge_groups;

CREATE POLICY "batch_merge_groups_all_policy" ON public.batch_merge_groups
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- SEMESTERS
ALTER TABLE IF EXISTS public.semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "semesters_select_policy" ON public.semesters;
DROP POLICY IF EXISTS "semesters_insert_policy" ON public.semesters;
DROP POLICY IF EXISTS "semesters_update_policy" ON public.semesters;
DROP POLICY IF EXISTS "semesters_delete_policy" ON public.semesters;
DROP POLICY IF EXISTS "semesters_all_policy" ON public.semesters;

CREATE POLICY "semesters_all_policy" ON public.semesters
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- TIMETABLE VERSIONS
ALTER TABLE IF EXISTS public.timetable_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "timetable_versions_select_policy" ON public.timetable_versions;
DROP POLICY IF EXISTS "timetable_versions_insert_policy" ON public.timetable_versions;
DROP POLICY IF EXISTS "timetable_versions_update_policy" ON public.timetable_versions;
DROP POLICY IF EXISTS "timetable_versions_delete_policy" ON public.timetable_versions;
DROP POLICY IF EXISTS "timetable_versions_all_policy" ON public.timetable_versions;

CREATE POLICY "timetable_versions_all_policy" ON public.timetable_versions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- MAKEUP REQUESTS
ALTER TABLE IF EXISTS public.makeup_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "makeup_requests_select_policy" ON public.makeup_requests;
DROP POLICY IF EXISTS "makeup_requests_insert_policy" ON public.makeup_requests;
DROP POLICY IF EXISTS "makeup_requests_update_policy" ON public.makeup_requests;
DROP POLICY IF EXISTS "makeup_requests_delete_policy" ON public.makeup_requests;
DROP POLICY IF EXISTS "makeup_requests_all_policy" ON public.makeup_requests;

CREATE POLICY "makeup_requests_all_policy" ON public.makeup_requests
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- SEMESTER CALENDAR
ALTER TABLE IF EXISTS public.semester_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "semester_calendar_all_policy" ON public.semester_calendar;
CREATE POLICY "semester_calendar_all_policy" ON public.semester_calendar
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- AUDIT LOG
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_all_policy" ON public.audit_log;
CREATE POLICY "audit_log_all_policy" ON public.audit_log
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

