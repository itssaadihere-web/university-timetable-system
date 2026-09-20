-- ==============================================================================
-- Migration: Allow duplicate course codes (code is user-customizable, while
-- id UUID is the sole unique identifier), and ensure full RLS write access.
-- ==============================================================================

-- 1. Drop unique constraints on courses(code) if they exist
ALTER TABLE IF EXISTS public.courses DROP CONSTRAINT IF EXISTS courses_code_key;
ALTER TABLE IF EXISTS public.courses DROP CONSTRAINT IF EXISTS courses_code_unique;

-- 2. Drop unique index if it exists
DROP INDEX IF EXISTS idx_courses_code_unique;
DROP INDEX IF EXISTS courses_code_key;

-- 3. Ensure RLS policies allow both SELECT and INSERT/UPDATE for anon role
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon public access to courses" ON public.courses;
CREATE POLICY "Anon public access to courses" ON public.courses FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS public.class_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon public access to class_sessions" ON public.class_sessions;
CREATE POLICY "Anon public access to class_sessions" ON public.class_sessions FOR ALL TO anon USING (true) WITH CHECK (true);
