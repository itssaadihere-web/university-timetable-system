-- ============================================================================
-- UNIVERSITY TIMETABLE SYSTEM — PURGE ALL IRRELEVANT & OBSOLETE TABLES
-- ============================================================================
-- Run this in your Supabase Dashboard -> SQL Editor
-- This removes all legacy, duplicate, or unused tables, leaving ONLY the 10
-- active tables used by the application and WhatsApp AI Agent.
-- ============================================================================

-- 1. Drop unused module & legacy tables
DROP TABLE IF EXISTS public.advising_suggestions CASCADE;
DROP TABLE IF EXISTS public.semester_calendar CASCADE;
DROP TABLE IF EXISTS public.semester_calendar_events CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.course_prerequisites CASCADE;
DROP TABLE IF EXISTS public.student_courses_completed CASCADE;
DROP TABLE IF EXISTS public.audit_log CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.n8n_chat_histories CASCADE;
DROP TABLE IF EXISTS public.chat_histories CASCADE;
DROP TABLE IF EXISTS public.webhook_logs CASCADE;
DROP TABLE IF EXISTS public.sessions CASCADE; -- Replaced by class_sessions

-- 2. Drop obsolete custom types
DROP TYPE IF EXISTS public.advising_status_enum CASCADE;
DROP TYPE IF EXISTS public.calendar_event_type CASCADE;

-- 3. Confirm the 10 active and required tables have Row Level Security enabled
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

-- 4. View all remaining active tables
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
