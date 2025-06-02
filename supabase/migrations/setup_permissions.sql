-- Enable RLS (Row Level Security)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for questions table
CREATE POLICY "Allow anonymous read access to questions"
    ON public.questions
    FOR SELECT
    TO anon
    USING (true);

-- Create policies for assessments table
CREATE POLICY "Allow anonymous insert to assessments"
    ON public.assessments
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own assessments"
    ON public.assessments
    FOR SELECT
    TO anon
    USING (email = current_user OR current_user = 'authenticated');

-- Create policies for assessment_progress table
CREATE POLICY "Allow anonymous insert to assessment_progress"
    ON public.assessment_progress
    FOR INSERT
    TO anon
    WITH CHECK (true);

CREATE POLICY "Allow users to read their own progress"
    ON public.assessment_progress
    FOR SELECT
    TO anon
    USING (assessment_id IN (
        SELECT id FROM public.assessments 
        WHERE email = current_user
    ));

-- Grant necessary permissions to anonymous users
GRANT SELECT ON public.questions TO anon;
GRANT INSERT, SELECT ON public.assessments TO anon;
GRANT INSERT, SELECT ON public.assessment_progress TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE public.questions_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE public.assessment_progress_id_seq TO anon; 