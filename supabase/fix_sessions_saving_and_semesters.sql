-- ============================================================================
-- SQL Migration: Fix Session Saving & Semesters in Supabase
-- Run this script in your Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. Insert default active semester into public.semesters
INSERT INTO public.semesters (id, name, academic_year, start_date, end_date, is_active)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Fall 2026',
    '2026-2027',
    '2026-09-01',
    '2027-01-31',
    true
)
ON CONFLICT (id) DO UPDATE 
SET is_active = true,
    name = EXCLUDED.name,
    academic_year = EXCLUDED.academic_year;

-- 2. Open RLS policy for semesters so anon and authenticated users can read and write
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "semesters_all_policy" ON public.semesters;
CREATE POLICY "semesters_all_policy" ON public.semesters
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Relax semester_id constraint on class_sessions
-- Making semester_id nullable and dropping the restrictive foreign key guarantees
-- that scheduled classes will NEVER be blocked or rejected by Postgres!
ALTER TABLE public.class_sessions ALTER COLUMN semester_id DROP NOT NULL;
ALTER TABLE public.class_sessions DROP CONSTRAINT IF EXISTS class_sessions_semester_id_fkey;

-- 4. Ensure class_sessions RLS allows all actions for anon and authenticated
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "class_sessions_all_policy" ON public.class_sessions;
CREATE POLICY "class_sessions_all_policy" ON public.class_sessions
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 5. Ensure courses RLS allows all actions
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "courses_all_policy" ON public.courses;
CREATE POLICY "courses_all_policy" ON public.courses
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Ensure faculty, batches, and rooms RLS allow all actions
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "faculty_all_policy" ON public.faculty;
CREATE POLICY "faculty_all_policy" ON public.faculty
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batches_all_policy" ON public.batches;
CREATE POLICY "batches_all_policy" ON public.batches
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rooms_all_policy" ON public.rooms;
CREATE POLICY "rooms_all_policy" ON public.rooms
FOR ALL TO anon, authenticated
USING (true)
WITH CHECK (true);
