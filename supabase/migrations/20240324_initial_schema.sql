-- Create questions table
CREATE TABLE IF NOT EXISTS public.questions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    category VARCHAR(1) CHECK (category IN ('V', 'A', 'L', 'I', 'D')),
    order_num INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    demographics JSONB,
    status VARCHAR(50) DEFAULT 'started',
    scores JSONB,
    persona VARCHAR(255),
    current_question INTEGER DEFAULT 0,
    answers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create assessment_progress table for auto-save
CREATE TABLE IF NOT EXISTS public.assessment_progress (
    id SERIAL PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id),
    answers JSONB,
    last_question INTEGER,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_questions_category ON public.questions(category);
CREATE INDEX idx_questions_order ON public.questions(order_num);
CREATE INDEX idx_assessments_email ON public.assessments(email);
CREATE INDEX idx_assessments_status ON public.assessments(status);
CREATE INDEX idx_assessment_progress_assessment ON public.assessment_progress(assessment_id); 