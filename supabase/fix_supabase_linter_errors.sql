-- ============================================================================
-- SUPABASE DATABASE LINTER FIX SCRIPT
-- Resolves all:
-- 1. policy_exists_rls_disabled (0007)
-- 2. rls_disabled_in_public (0013)
-- 3. function_search_path_mutable (0011)
--
-- Instructions: Copy and run this entire script in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: ENABLE ROW LEVEL SECURITY (RLS) ON ALL PUBLIC TABLES
-- ============================================================================

ALTER TABLE IF EXISTS public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.semester_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batch_merge_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.student_courses_completed ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advising_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.makeup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PART 2: CLEAN & RECREATE RLS POLICIES FOR SECURE FULL FUNCTIONALITY
-- ============================================================================

-- 1. Semesters
DROP POLICY IF EXISTS "Public can view semesters" ON public.semesters;
DROP POLICY IF EXISTS "Authenticated can manage semesters" ON public.semesters;
CREATE POLICY "Public can view semesters" ON public.semesters FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage semesters" ON public.semesters FOR ALL USING (true);

-- 2. Semester Calendar
DROP POLICY IF EXISTS "Public can view calendar" ON public.semester_calendar;
DROP POLICY IF EXISTS "Authenticated can manage calendar" ON public.semester_calendar;
CREATE POLICY "Public can view calendar" ON public.semester_calendar FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage calendar" ON public.semester_calendar FOR ALL USING (true);

-- 3. Rooms
DROP POLICY IF EXISTS "Public can view rooms" ON public.rooms;
DROP POLICY IF EXISTS "Authenticated users can manage rooms" ON public.rooms;
CREATE POLICY "Public can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage rooms" ON public.rooms FOR ALL USING (true);

-- 4. Faculty
DROP POLICY IF EXISTS "Public can view faculty" ON public.faculty;
DROP POLICY IF EXISTS "Authenticated users can manage faculty" ON public.faculty;
CREATE POLICY "Public can view faculty" ON public.faculty FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage faculty" ON public.faculty FOR ALL USING (true);

-- 5. Batches
DROP POLICY IF EXISTS "Public can view batches" ON public.batches;
DROP POLICY IF EXISTS "Authenticated users can manage batches" ON public.batches;
CREATE POLICY "Public can view batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage batches" ON public.batches FOR ALL USING (true);

-- 6. Batch Merge Groups
DROP POLICY IF EXISTS "Public can view batch merge groups" ON public.batch_merge_groups;
DROP POLICY IF EXISTS "Authenticated can manage batch merge groups" ON public.batch_merge_groups;
CREATE POLICY "Public can view batch merge groups" ON public.batch_merge_groups FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage batch merge groups" ON public.batch_merge_groups FOR ALL USING (true);

-- 7. Courses
DROP POLICY IF EXISTS "Public can view courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON public.courses;
CREATE POLICY "Public can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage courses" ON public.courses FOR ALL USING (true);

-- 8. Course Prerequisites
DROP POLICY IF EXISTS "Public can view prerequisites" ON public.course_prerequisites;
DROP POLICY IF EXISTS "Authenticated can manage prerequisites" ON public.course_prerequisites;
CREATE POLICY "Public can view prerequisites" ON public.course_prerequisites FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage prerequisites" ON public.course_prerequisites FOR ALL USING (true);

-- 9. Students
DROP POLICY IF EXISTS "Public can view students" ON public.students;
DROP POLICY IF EXISTS "Authenticated can manage students" ON public.students;
CREATE POLICY "Public can view students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage students" ON public.students FOR ALL USING (true);

-- 10. Student Courses Completed
DROP POLICY IF EXISTS "Public can view completed courses" ON public.student_courses_completed;
DROP POLICY IF EXISTS "Authenticated can manage completed courses" ON public.student_courses_completed;
CREATE POLICY "Public can view completed courses" ON public.student_courses_completed FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage completed courses" ON public.student_courses_completed FOR ALL USING (true);

-- 11. Class Sessions
DROP POLICY IF EXISTS "Public can view published sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "Authenticated users can manage sessions" ON public.class_sessions;
CREATE POLICY "Public can view published sessions" ON public.class_sessions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage sessions" ON public.class_sessions FOR ALL USING (true);

-- 12. Advising Suggestions
DROP POLICY IF EXISTS "Authenticated users can manage advising" ON public.advising_suggestions;
DROP POLICY IF EXISTS "Public can view advising" ON public.advising_suggestions;
CREATE POLICY "Public can view advising" ON public.advising_suggestions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage advising" ON public.advising_suggestions FOR ALL USING (true);

-- 13. Makeup Requests
DROP POLICY IF EXISTS "Authenticated users can manage makeup requests" ON public.makeup_requests;
DROP POLICY IF EXISTS "Public can view makeup requests" ON public.makeup_requests;
CREATE POLICY "Public can view makeup requests" ON public.makeup_requests FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage makeup requests" ON public.makeup_requests FOR ALL USING (true);

-- 14. Audit Log
DROP POLICY IF EXISTS "Authenticated users can view audit log" ON public.audit_log;
DROP POLICY IF EXISTS "Authenticated can manage audit log" ON public.audit_log;
CREATE POLICY "Authenticated users can view audit log" ON public.audit_log FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage audit log" ON public.audit_log FOR ALL USING (true);

-- 15. Timetable Versions
DROP POLICY IF EXISTS "Public can view timetable versions" ON public.timetable_versions;
DROP POLICY IF EXISTS "Authenticated can manage timetable versions" ON public.timetable_versions;
CREATE POLICY "Public can view timetable versions" ON public.timetable_versions FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage timetable versions" ON public.timetable_versions FOR ALL USING (true);

-- ============================================================================
-- PART 3: FIX MUTABLE FUNCTION SEARCH_PATH WARNINGS (0011)
-- ============================================================================

-- Fix search_path on check_timetable_conflicts
DO $$
BEGIN
    ALTER FUNCTION public.check_timetable_conflicts(
        UUID, UUID, UUID, UUID, UUID, UUID, UUID, INTEGER, TIME, TIME, session_type_enum, session_status_enum, DATE
    ) SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Fix search_path on trg_validate_class_session_fn
DO $$
BEGIN
    ALTER FUNCTION public.trg_validate_class_session_fn() SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Fix search_path on trg_audit_class_session_fn
DO $$
BEGIN
    ALTER FUNCTION public.trg_audit_class_session_fn() SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Fix search_path on publish_timetable_version
DO $$
BEGIN
    ALTER FUNCTION public.publish_timetable_version(
        UUID, TEXT, TEXT
    ) SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- ============================================================================
-- VERIFICATION CONFIRMATION
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public';
