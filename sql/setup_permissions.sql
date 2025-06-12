-- Set proper role context
SET ROLE postgres;

-- Revoke all existing permissions to start clean
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Grant basic schema usage
GRANT USAGE ON SCHEMA public TO anon;

-- Grant execute on the table creation function
GRANT EXECUTE ON FUNCTION create_tables_if_not_exist() TO anon;

-- Create tables using the function (runs as owner due to SECURITY DEFINER)
SELECT create_tables_if_not_exist();

-- Enable RLS on all tables
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Grant minimal required permissions to anon role
GRANT SELECT, INSERT, UPDATE ON public.assessments TO anon;
GRANT SELECT, INSERT ON public.answers TO anon;
GRANT SELECT, INSERT ON public.results TO anon;
GRANT SELECT ON public.questions TO anon;

-- Grant sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Create RLS policies
DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.assessments;
CREATE POLICY "Enable read for authenticated users" ON public.assessments
    FOR ALL
    USING (true);

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.answers;
CREATE POLICY "Enable read for authenticated users" ON public.answers
    FOR ALL
    USING (true);

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.results;
CREATE POLICY "Enable read for authenticated users" ON public.results
    FOR ALL
    USING (true);

DROP POLICY IF EXISTS "Enable read for authenticated users" ON public.questions;
CREATE POLICY "Enable read for authenticated users" ON public.questions
    FOR ALL
    USING (true);

-- Reset role
RESET ROLE; 