/* Function to create tables if they don't exist */
CREATE OR REPLACE FUNCTION create_tables_if_not_exist()
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    table_exists BOOLEAN;
    column_exists BOOLEAN;
BEGIN
    /* Set proper search_path */
    SET search_path TO public;
    
    /* Check if assessments table exists */
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'assessments'
    ) INTO table_exists;

    IF NOT table_exists THEN
        /* Create assessments table if it doesn't exist */
        CREATE TABLE assessments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT NOT NULL,
            demographics JSONB NOT NULL,
            status TEXT NOT NULL DEFAULT 'in_progress',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP WITH TIME ZONE,
            resume_token TEXT,
            resume_token_expires_at TIMESTAMP WITH TIME ZONE
        );

        /* Create indexes */
        CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email);
        CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
        CREATE INDEX IF NOT EXISTS idx_assessments_resume_token ON assessments(resume_token);
    END IF;

    /* Check if answers table exists */
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'answers'
    ) INTO table_exists;

    IF NOT table_exists THEN
        /* Create answers table if it doesn't exist */
        CREATE TABLE answers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            assessment_id UUID NOT NULL REFERENCES assessments(id),
            question_id TEXT NOT NULL,
            answer INTEGER NOT NULL CHECK (answer >= 1 AND answer <= 7),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(assessment_id, question_id)
        );

        /* Create indexes */
        CREATE INDEX IF NOT EXISTS idx_answers_assessment ON answers(assessment_id);
        CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
    END IF;

    /* Check if results table exists */
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'results'
    ) INTO table_exists;

    IF NOT table_exists THEN
        /* Create results table if it doesn't exist */
        CREATE TABLE results (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            assessment_id UUID NOT NULL REFERENCES assessments(id),
            scores JSONB NOT NULL,
            quality_metrics JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(assessment_id)
        );

        /* Create indexes */
        CREATE INDEX IF NOT EXISTS idx_results_assessment ON results(assessment_id);
    END IF;

    /* Check if questions table exists */
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'questions'
    ) INTO table_exists;

    IF NOT table_exists THEN
        /* Create questions table if it doesn't exist */
        CREATE TABLE questions (
            id TEXT PRIMARY KEY,
            text TEXT NOT NULL,
            dimension TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        /* Create indexes */
        CREATE INDEX IF NOT EXISTS idx_questions_dimension ON questions(dimension);
    END IF;
END;
$$ LANGUAGE plpgsql; 