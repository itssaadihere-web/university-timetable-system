-- ============================================================================
-- UNIVERSITY TIMETABLE SYSTEM — CLEAR ALL DATA SCRIPT
-- ============================================================================
-- Purpose: Safely truncate / delete all rows from all database tables 
-- while keeping the table structure, columns, indexes, and RLS policies intact.
--
-- Instructions:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Select your Project -> SQL Editor
-- 3. Paste and run this script
-- ============================================================================

-- Disable triggers temporarily during truncate to prevent audit/validation blocks
SET session_replication_role = 'replica';

-- Truncate all tables in proper order with CASCADE
TRUNCATE TABLE 
    public.class_sessions,
    public.makeup_requests,
    public.timetable_versions,
    public.students,
    public.courses,
    public.batches,
    public.batch_merge_groups,
    public.faculty,
    public.rooms,
    public.semesters
CASCADE;

-- Re-enable triggers and normal replication role
SET session_replication_role = 'origin';

-- ----------------------------------------------------------------------------
-- VERIFICATION: Check that row counts for all tables are 0
-- ----------------------------------------------------------------------------
SELECT 
    schemaname,
    relname AS table_name,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
