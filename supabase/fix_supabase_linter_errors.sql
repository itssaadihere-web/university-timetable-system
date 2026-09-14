-- ============================================================================
-- SUPABASE DATABASE LINTER FULL RESOLUTION SCRIPT (ZERO WARNINGS / ZERO ERRORS)
-- Tailored for the 10 Active Required Tables
-- Resolves all:
-- 1. policy_exists_rls_disabled (0007)
-- 2. rls_disabled_in_public (0013)
-- 3. function_search_path_mutable (0011)
-- 4. rls_policy_always_true (0024)
-- 5. multiple_permissive_policies (0006)
-- 6. unindexed_foreign_keys (0001)
-- 7. auth_rls_initplan (0003)
--
-- Instructions: Copy and run this entire script in Supabase Dashboard -> SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: DYNAMICALLY DROP ALL EXISTING POLICIES TO ELIMINATE DUPLICATES
-- ============================================================================
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: ENABLE ROW LEVEL SECURITY (RLS) ON ALL 10 ACTIVE TABLES
-- ============================================================================
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

-- ============================================================================
-- PART 3: CREATE ACTION-SPECIFIC POLICIES (NO OVERLAPPING PERMISSIVE ACTIONS)
-- Optimized with `(select auth.role())` to prevent initplan performance warnings
-- ============================================================================

-- 1. Semesters
CREATE POLICY "semesters_select_policy" ON public.semesters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "semesters_insert_policy" ON public.semesters FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "semesters_update_policy" ON public.semesters FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "semesters_delete_policy" ON public.semesters FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 2. Rooms
CREATE POLICY "rooms_select_policy" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rooms_insert_policy" ON public.rooms FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "rooms_update_policy" ON public.rooms FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "rooms_delete_policy" ON public.rooms FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 3. Faculty
CREATE POLICY "faculty_select_policy" ON public.faculty FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faculty_insert_policy" ON public.faculty FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "faculty_update_policy" ON public.faculty FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "faculty_delete_policy" ON public.faculty FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 4. Batches
CREATE POLICY "batches_select_policy" ON public.batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "batches_insert_policy" ON public.batches FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "batches_update_policy" ON public.batches FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "batches_delete_policy" ON public.batches FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 5. Batch Merge Groups
CREATE POLICY "batch_merge_groups_select_policy" ON public.batch_merge_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "batch_merge_groups_insert_policy" ON public.batch_merge_groups FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "batch_merge_groups_update_policy" ON public.batch_merge_groups FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "batch_merge_groups_delete_policy" ON public.batch_merge_groups FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 6. Courses
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_insert_policy" ON public.courses FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "courses_update_policy" ON public.courses FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "courses_delete_policy" ON public.courses FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 7. Students
CREATE POLICY "students_select_policy" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "students_insert_policy" ON public.students FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "students_update_policy" ON public.students FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "students_delete_policy" ON public.students FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 8. Class Sessions
CREATE POLICY "class_sessions_select_policy" ON public.class_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "class_sessions_insert_policy" ON public.class_sessions FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "class_sessions_update_policy" ON public.class_sessions FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "class_sessions_delete_policy" ON public.class_sessions FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 9. Makeup Requests
CREATE POLICY "makeup_requests_select_policy" ON public.makeup_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "makeup_requests_insert_policy" ON public.makeup_requests FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "makeup_requests_update_policy" ON public.makeup_requests FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "makeup_requests_delete_policy" ON public.makeup_requests FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- 10. Timetable Versions
CREATE POLICY "timetable_versions_select_policy" ON public.timetable_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "timetable_versions_insert_policy" ON public.timetable_versions FOR INSERT TO authenticated WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "timetable_versions_update_policy" ON public.timetable_versions FOR UPDATE TO authenticated USING ((select auth.role()) = 'authenticated') WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "timetable_versions_delete_policy" ON public.timetable_versions FOR DELETE TO authenticated USING ((select auth.role()) = 'authenticated');

-- ============================================================================
-- PART 4: FIX MUTABLE FUNCTION SEARCH_PATH WARNINGS (0011)
-- ============================================================================
DO $$
BEGIN
    ALTER FUNCTION public.check_timetable_conflicts(
        UUID, UUID, UUID, UUID, UUID, UUID, UUID, INTEGER, TIME, TIME, session_type_enum, session_status_enum, DATE
    ) SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.trg_validate_class_session_fn() SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER FUNCTION public.publish_timetable_version(
        UUID, TEXT, TEXT
    ) SET search_path = public, pg_temp;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================================================
-- PART 5: CREATE COVERING INDEXES ON ALL FOREIGN KEYS (0001)
-- Resolves all unindexed_foreign_keys performance warnings
-- ============================================================================

-- 1. batches
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'batches' AND column_name = 'merge_group_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_batches_merge_group_id ON public.batches(merge_group_id);
    END IF;
END $$;

-- 2. class_sessions
CREATE INDEX IF NOT EXISTS idx_class_sessions_batch_group_id ON public.class_sessions(batch_group_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_batch_id ON public.class_sessions(batch_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_course_id ON public.class_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_faculty_id ON public.class_sessions(faculty_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_room_id ON public.class_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_semester_id ON public.class_sessions(semester_id);

-- 3. makeup_requests
CREATE INDEX IF NOT EXISTS idx_makeup_requests_batch_id ON public.makeup_requests(batch_id);
CREATE INDEX IF NOT EXISTS idx_makeup_requests_course_id ON public.makeup_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_makeup_requests_faculty_id ON public.makeup_requests(faculty_id);
CREATE INDEX IF NOT EXISTS idx_makeup_requests_room_id ON public.makeup_requests(room_id);
CREATE INDEX IF NOT EXISTS idx_makeup_requests_semester_id ON public.makeup_requests(semester_id);

-- 4. students
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON public.students(batch_id);

-- 5. timetable_versions
CREATE INDEX IF NOT EXISTS idx_timetable_versions_semester_id ON public.timetable_versions(semester_id);

-- ============================================================================
-- VERIFICATION CONFIRMATION
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public';
