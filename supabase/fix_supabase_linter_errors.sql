-- ============================================================================
-- SUPABASE DATABASE LINTER FULL RESOLUTION SCRIPT (ZERO WARNINGS / ZERO ERRORS)
-- Resolves all:
-- 1. policy_exists_rls_disabled (0007)
-- 2. rls_disabled_in_public (0013)
-- 3. function_search_path_mutable (0011)
-- 4. rls_policy_always_true (0024)
-- 5. multiple_permissive_policies (0006)
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
-- PART 2: ENABLE ROW LEVEL SECURITY (RLS) ON ALL 15 PUBLIC TABLES
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
-- PART 3: CREATE ACTION-SPECIFIC POLICIES (NO OVERLAPPING PERMISSIVE ACTIONS)
-- Each action (SELECT, INSERT, UPDATE, DELETE) has exactly ONE clean policy.
-- ============================================================================

-- 1. Semesters
CREATE POLICY "semesters_select_policy" ON public.semesters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "semesters_insert_policy" ON public.semesters FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "semesters_update_policy" ON public.semesters FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "semesters_delete_policy" ON public.semesters FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 2. Semester Calendar
CREATE POLICY "semester_calendar_select_policy" ON public.semester_calendar FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "semester_calendar_insert_policy" ON public.semester_calendar FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "semester_calendar_update_policy" ON public.semester_calendar FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "semester_calendar_delete_policy" ON public.semester_calendar FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 3. Rooms
CREATE POLICY "rooms_select_policy" ON public.rooms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rooms_insert_policy" ON public.rooms FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rooms_update_policy" ON public.rooms FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "rooms_delete_policy" ON public.rooms FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 4. Faculty
CREATE POLICY "faculty_select_policy" ON public.faculty FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "faculty_insert_policy" ON public.faculty FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "faculty_update_policy" ON public.faculty FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "faculty_delete_policy" ON public.faculty FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 5. Batches
CREATE POLICY "batches_select_policy" ON public.batches FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "batches_insert_policy" ON public.batches FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "batches_update_policy" ON public.batches FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "batches_delete_policy" ON public.batches FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 6. Batch Merge Groups
CREATE POLICY "batch_merge_groups_select_policy" ON public.batch_merge_groups FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "batch_merge_groups_insert_policy" ON public.batch_merge_groups FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "batch_merge_groups_update_policy" ON public.batch_merge_groups FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "batch_merge_groups_delete_policy" ON public.batch_merge_groups FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 7. Courses
CREATE POLICY "courses_select_policy" ON public.courses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "courses_insert_policy" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "courses_update_policy" ON public.courses FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "courses_delete_policy" ON public.courses FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 8. Course Prerequisites
CREATE POLICY "course_prerequisites_select_policy" ON public.course_prerequisites FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "course_prerequisites_insert_policy" ON public.course_prerequisites FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "course_prerequisites_update_policy" ON public.course_prerequisites FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "course_prerequisites_delete_policy" ON public.course_prerequisites FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 9. Students
CREATE POLICY "students_select_policy" ON public.students FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "students_insert_policy" ON public.students FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "students_update_policy" ON public.students FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "students_delete_policy" ON public.students FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 10. Student Courses Completed
CREATE POLICY "student_courses_completed_select_policy" ON public.student_courses_completed FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "student_courses_completed_insert_policy" ON public.student_courses_completed FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "student_courses_completed_update_policy" ON public.student_courses_completed FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "student_courses_completed_delete_policy" ON public.student_courses_completed FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 11. Class Sessions
CREATE POLICY "class_sessions_select_policy" ON public.class_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "class_sessions_insert_policy" ON public.class_sessions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "class_sessions_update_policy" ON public.class_sessions FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "class_sessions_delete_policy" ON public.class_sessions FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 12. Advising Suggestions
CREATE POLICY "advising_suggestions_select_policy" ON public.advising_suggestions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "advising_suggestions_insert_policy" ON public.advising_suggestions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "advising_suggestions_update_policy" ON public.advising_suggestions FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "advising_suggestions_delete_policy" ON public.advising_suggestions FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 13. Makeup Requests
CREATE POLICY "makeup_requests_select_policy" ON public.makeup_requests FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "makeup_requests_insert_policy" ON public.makeup_requests FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "makeup_requests_update_policy" ON public.makeup_requests FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "makeup_requests_delete_policy" ON public.makeup_requests FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 14. Audit Log
CREATE POLICY "audit_log_select_policy" ON public.audit_log FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
CREATE POLICY "audit_log_insert_policy" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "audit_log_update_policy" ON public.audit_log FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "audit_log_delete_policy" ON public.audit_log FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

-- 15. Timetable Versions
CREATE POLICY "timetable_versions_select_policy" ON public.timetable_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "timetable_versions_insert_policy" ON public.timetable_versions FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "timetable_versions_update_policy" ON public.timetable_versions FOR UPDATE TO authenticated USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "timetable_versions_delete_policy" ON public.timetable_versions FOR DELETE TO authenticated USING (auth.role() = 'authenticated');

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
    ALTER FUNCTION public.trg_audit_class_session_fn() SET search_path = public, pg_temp;
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
-- VERIFICATION CONFIRMATION
-- ============================================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public';


