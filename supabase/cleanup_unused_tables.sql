-- ============================================================================
-- UNIVERSITY TIMETABLE SYSTEM — DATABASE CLEANUP SCRIPT
-- ============================================================================
-- Purpose: Remove all unused tables (including student advising module) and 
-- keep ONLY the 10 active tables required and used by the University Timetable System.
--
-- Instructions:
-- 1. Open Supabase Dashboard -> Project -> SQL Editor
-- 2. Paste and run this script
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: DROP UNUSED & REMOVED MODULE TABLES & CONSTRAINTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.advising_suggestions CASCADE;
DROP TABLE IF EXISTS public.semester_calendar CASCADE;
DROP TABLE IF EXISTS public.course_prerequisites CASCADE;
DROP TABLE IF EXISTS public.student_courses_completed CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;

-- Drop obsolete types if no longer needed
DROP TYPE IF EXISTS public.advising_status_enum CASCADE;
DROP TYPE IF EXISTS public.calendar_event_type CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 2: ENSURE RLS (ROW LEVEL SECURITY) IS ENABLED ON ALL 10 ACTIVE TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.batch_merge_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.makeup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable_versions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 3: VERIFICATION — LIST ALL REMAINING TABLES IN THE PUBLIC SCHEMA
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
