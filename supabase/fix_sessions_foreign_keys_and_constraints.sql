-- ==============================================================================
-- SQL Migration: Relax Class Session Constraints & Ensure Smooth Syncing
-- Run this script in your Supabase Dashboard > SQL Editor (if needed)
-- ==============================================================================

-- 1. Ensure RLS on class_sessions allows full anon and authenticated access
ALTER TABLE IF EXISTS public.class_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon public access to class_sessions" ON public.class_sessions;
DROP POLICY IF EXISTS "class_sessions_all_policy" ON public.class_sessions;

CREATE POLICY "class_sessions_all_policy" ON public.class_sessions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. Relax foreign key constraints on class_sessions to prevent bulk imports
-- from being completely rejected if a course, faculty, or room has a minor naming discrepancy.
ALTER TABLE IF EXISTS public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_course_id_fkey;
ALTER TABLE IF EXISTS public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_faculty_id_fkey;
ALTER TABLE IF EXISTS public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_room_id_fkey;
ALTER TABLE IF EXISTS public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_batch_id_fkey;
ALTER TABLE IF EXISTS public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_semester_id_fkey;

-- Re-add with ON DELETE CASCADE or SET NULL to allow operational flexibility
ALTER TABLE IF EXISTS public.class_sessions
  ADD CONSTRAINT class_sessions_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE,
  ADD CONSTRAINT class_sessions_faculty_id_fkey FOREIGN KEY (faculty_id) REFERENCES public.faculty(id) ON DELETE CASCADE,
  ADD CONSTRAINT class_sessions_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(id) ON DELETE CASCADE,
  ADD CONSTRAINT class_sessions_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE SET NULL;

-- 3. Relax semester_id NOT NULL if not already relaxed
ALTER TABLE IF EXISTS public.class_sessions ALTER COLUMN semester_id DROP NOT NULL;
ALTER TABLE IF EXISTS public.class_sessions ALTER COLUMN room_id DROP NOT NULL;

-- 4. Ensure faculty and rooms RLS allow anon upserts
ALTER TABLE IF EXISTS public.faculty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faculty_all_policy" ON public.faculty;
CREATE POLICY "faculty_all_policy" ON public.faculty FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_all_policy" ON public.rooms;
CREATE POLICY "rooms_all_policy" ON public.rooms FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batches_all_policy" ON public.batches;
CREATE POLICY "batches_all_policy" ON public.batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_all_policy" ON public.courses;
CREATE POLICY "courses_all_policy" ON public.courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
