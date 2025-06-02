-- Reset schema to clean state
DROP TABLE IF EXISTS public.assessment_progress CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;

-- Clear any existing data
TRUNCATE TABLE public.questions CASCADE;
TRUNCATE TABLE public.assessments CASCADE;
TRUNCATE TABLE public.assessment_progress CASCADE;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow anonymous read access to questions" ON public.questions;
DROP POLICY IF EXISTS "Allow anonymous insert to assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow users to read their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Allow anonymous insert to assessment_progress" ON public.assessment_progress;
DROP POLICY IF EXISTS "Allow users to read their own progress" ON public.assessment_progress; 