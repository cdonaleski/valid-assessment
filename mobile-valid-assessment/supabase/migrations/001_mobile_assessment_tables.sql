-- Mobile VALID Assessment Database Schema
-- This migration creates SEPARATE tables specifically for the standalone mobile assessment
-- These tables are completely independent from the main VALID assessment system

-- Create mobile_assessments table (SEPARATE from main assessments)
CREATE TABLE IF NOT EXISTS public.mobile_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Demographic Information
    user_age VARCHAR(10) NOT NULL,
    job_role VARCHAR(50) NOT NULL,
    decision_maker VARCHAR(20) NOT NULL,
    consultant_referral VARCHAR(100),
    
    -- Contact Information (JSONB for flexibility)
    contact_info JSONB DEFAULT '{}',
    
    -- Assessment Data
    answers JSONB DEFAULT '{}',
    scores JSONB,
    persona VARCHAR(255),
    
    -- Assessment Status
    status VARCHAR(50) DEFAULT 'started',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Additional Metadata
    browser_info JSONB DEFAULT '{}'
);

-- Create mobile_user_involvement table (SEPARATE tracking for mobile webhooks)
CREATE TABLE IF NOT EXISTS public.mobile_user_involvement (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Link to mobile assessment
    mobile_assessment_id UUID REFERENCES mobile_assessments(id) ON DELETE CASCADE,
    
    -- Involvement Details
    involvement_type VARCHAR(50) NOT NULL, -- 'consultant', 'pilot', 'research', 'updates', 'founder'
    contact_email VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    
    -- Additional Data (demographics, scores, etc.)
    additional_data JSONB DEFAULT '{}',
    
    -- Webhook Tracking
    webhook_sent BOOLEAN DEFAULT FALSE,
    webhook_sent_at TIMESTAMP WITH TIME ZONE,
    webhook_response JSONB,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create mobile_assessment_sessions table (for analytics and debugging)
CREATE TABLE IF NOT EXISTS public.mobile_assessment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mobile_assessment_id UUID REFERENCES mobile_assessments(id) ON DELETE CASCADE,
    
    -- Session tracking
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    
    -- Progress tracking
    screens_visited TEXT[] DEFAULT '{}',
    time_per_screen JSONB DEFAULT '{}',
    
    -- Technical details
    user_agent TEXT,
    screen_resolution VARCHAR(50),
    device_type VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_assessments_status ON public.mobile_assessments(status);
CREATE INDEX IF NOT EXISTS idx_mobile_assessments_created_at ON public.mobile_assessments(created_at);
CREATE INDEX IF NOT EXISTS idx_mobile_user_involvement_type ON public.mobile_user_involvement(involvement_type);
CREATE INDEX IF NOT EXISTS idx_mobile_user_involvement_webhook ON public.mobile_user_involvement(webhook_sent);
CREATE INDEX IF NOT EXISTS idx_mobile_user_involvement_assessment ON public.mobile_user_involvement(mobile_assessment_id);
CREATE INDEX IF NOT EXISTS idx_mobile_sessions_assessment ON public.mobile_assessment_sessions(mobile_assessment_id);

-- Enable Row Level Security
ALTER TABLE public.mobile_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_user_involvement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for mobile_assessments (allow anonymous access for mobile app)
DROP POLICY IF EXISTS "Allow anonymous insert to mobile_assessments" ON public.mobile_assessments;
CREATE POLICY "Allow anonymous insert to mobile_assessments"
    ON public.mobile_assessments
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update to mobile_assessments" ON public.mobile_assessments;
CREATE POLICY "Allow anonymous update to mobile_assessments"
    ON public.mobile_assessments
    FOR UPDATE
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous select to mobile_assessments" ON public.mobile_assessments;
CREATE POLICY "Allow anonymous select to mobile_assessments"
    ON public.mobile_assessments
    FOR SELECT
    TO anon
    USING (true);

-- Create policies for mobile_user_involvement
DROP POLICY IF EXISTS "Allow anonymous insert to mobile_user_involvement" ON public.mobile_user_involvement;
CREATE POLICY "Allow anonymous insert to mobile_user_involvement"
    ON public.mobile_user_involvement
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous select to mobile_user_involvement" ON public.mobile_user_involvement;
CREATE POLICY "Allow anonymous select to mobile_user_involvement"
    ON public.mobile_user_involvement
    FOR SELECT
    TO anon
    USING (true);

DROP POLICY IF EXISTS "Allow anonymous update to mobile_user_involvement" ON public.mobile_user_involvement;
CREATE POLICY "Allow anonymous update to mobile_user_involvement"
    ON public.mobile_user_involvement
    FOR UPDATE
    TO anon
    USING (true);

-- Create policies for mobile_assessment_sessions
DROP POLICY IF EXISTS "Allow anonymous insert to mobile_assessment_sessions" ON public.mobile_assessment_sessions;
CREATE POLICY "Allow anonymous insert to mobile_assessment_sessions"
    ON public.mobile_assessment_sessions
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous update to mobile_assessment_sessions" ON public.mobile_assessment_sessions;
CREATE POLICY "Allow anonymous update to mobile_assessment_sessions"
    ON public.mobile_assessment_sessions
    FOR UPDATE
    TO anon
    USING (true);

-- Grant necessary permissions to anonymous users
GRANT INSERT, SELECT, UPDATE ON public.mobile_assessments TO anon;
GRANT INSERT, SELECT, UPDATE ON public.mobile_user_involvement TO anon;
GRANT INSERT, SELECT, UPDATE ON public.mobile_assessment_sessions TO anon;

-- Create a view for mobile assessment analytics (SEPARATE from main analytics)
DROP VIEW IF EXISTS public.mobile_assessment_analytics;
CREATE OR REPLACE VIEW public.mobile_assessment_analytics AS
SELECT 
    DATE_TRUNC('day', ma.created_at) as date,
    COUNT(*) as total_mobile_assessments,
    COUNT(CASE WHEN ma.status = 'completed' THEN 1 END) as completed_mobile_assessments,
    COUNT(CASE WHEN mui.id IS NOT NULL THEN 1 END) as with_involvement,
    
    -- Demographic breakdowns
    ma.user_age,
    ma.job_role,
    ma.decision_maker,
    ma.consultant_referral,
    
    -- Involvement type breakdown
    mui.involvement_type,
    
    -- Completion rate
    ROUND(
        COUNT(CASE WHEN ma.status = 'completed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as completion_rate_percent,
    
    -- Average scores (for completed assessments)
    AVG((ma.scores->>'verity')::NUMERIC) as avg_verity_score,
    AVG((ma.scores->>'association')::NUMERIC) as avg_association_score,
    AVG((ma.scores->>'lived_experience')::NUMERIC) as avg_lived_experience_score,
    AVG((ma.scores->>'institutional')::NUMERIC) as avg_institutional_score,
    AVG((ma.scores->>'desire')::NUMERIC) as avg_desire_score
    
FROM public.mobile_assessments ma
LEFT JOIN public.mobile_user_involvement mui ON ma.id = mui.mobile_assessment_id
GROUP BY 
    DATE_TRUNC('day', ma.created_at), 
    ma.user_age, 
    ma.job_role, 
    ma.decision_maker, 
    ma.consultant_referral,
    mui.involvement_type
ORDER BY date DESC;

-- Create a summary view for quick dashboard stats
DROP VIEW IF EXISTS public.mobile_assessment_summary;
CREATE OR REPLACE VIEW public.mobile_assessment_summary AS
SELECT 
    -- Total counts
    COUNT(*) as total_assessments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_assessments,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as incomplete_assessments,
    
    -- Today's counts
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_assessments,
    COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status = 'completed' THEN 1 END) as today_completed,
    
    -- This week's counts
    COUNT(CASE WHEN created_at >= DATE_TRUNC('week', CURRENT_DATE) THEN 1 END) as week_assessments,
    
    -- Completion rate
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as overall_completion_rate,
    
    -- Most recent assessment
    MAX(created_at) as last_assessment_at
    
FROM public.mobile_assessments;

-- Grant select on the analytics views
GRANT SELECT ON public.mobile_assessment_analytics TO anon;
GRANT SELECT ON public.mobile_assessment_summary TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.mobile_assessments IS 'Stores data for the standalone mobile VALID assessment - separate from main assessment system';
COMMENT ON TABLE public.mobile_user_involvement IS 'Tracks user involvement preferences from mobile assessment results screen';
COMMENT ON TABLE public.mobile_assessment_sessions IS 'Analytics data for mobile assessment user sessions';
COMMENT ON VIEW public.mobile_assessment_analytics IS 'Analytics view for mobile assessment data - daily breakdowns';
COMMENT ON VIEW public.mobile_assessment_summary IS 'Summary statistics for mobile assessment dashboard'; 