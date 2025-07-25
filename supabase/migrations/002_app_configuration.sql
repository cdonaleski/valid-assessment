-- App Configuration Table
-- Stores non-sensitive configuration that can be updated without server restart
-- NEVER store API keys or sensitive credentials here!

-- Create app_config table for dynamic configuration
CREATE TABLE IF NOT EXISTS public.app_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Configuration key (unique identifier)
    config_key VARCHAR(100) UNIQUE NOT NULL,
    
    -- Configuration value (stored as JSONB for flexibility)
    config_value JSONB NOT NULL,
    
    -- Description for admin interface
    description TEXT,
    
    -- Category for organization
    category VARCHAR(50) DEFAULT 'general',
    
    -- Data type for validation
    data_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, object, array
    
    -- Whether this config is active
    is_active BOOLEAN DEFAULT true,
    
    -- Whether this can be modified (some configs might be read-only)
    is_editable BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_app_config_key ON public.app_config(config_key);
CREATE INDEX IF NOT EXISTS idx_app_config_category ON public.app_config(category);
CREATE INDEX IF NOT EXISTS idx_app_config_active ON public.app_config(is_active);

-- Enable Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Create policies (read-only for anonymous, full access for authenticated)
DROP POLICY IF EXISTS "Allow anonymous read config" ON public.app_config;
CREATE POLICY "Allow anonymous read config"
    ON public.app_config
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Grant permissions
GRANT SELECT ON public.app_config TO anon;

-- Insert default configuration values
INSERT INTO public.app_config (config_key, config_value, description, category, data_type) VALUES
-- Email Configuration (non-sensitive)
('email_from_name', '"VALID Assessment Team"', 'Display name for email sender', 'email', 'string'),
('email_subject_template', '"Your VALID Assessment Results - {firstName}"', 'Email subject template with placeholders', 'email', 'string'),
('email_enabled', 'true', 'Whether email functionality is enabled', 'email', 'boolean'),

-- Assessment Configuration
('assessment_title', '"VALID Assessment"', 'Title displayed in assessment', 'assessment', 'string'),
('results_show_scores', 'true', 'Whether to show numerical scores in results', 'assessment', 'boolean'),
('results_show_recommendations', 'true', 'Whether to show recommendations in results', 'assessment', 'boolean'),
('allow_retake', 'true', 'Whether users can retake the assessment', 'assessment', 'boolean'),

-- UI Configuration
('brand_primary_color', '"#667eea"', 'Primary brand color (hex)', 'ui', 'string'),
('brand_secondary_color', '"#764ba2"', 'Secondary brand color (hex)', 'ui', 'string'),
('show_progress_bar', 'true', 'Whether to show progress bar during assessment', 'ui', 'boolean'),
('auto_advance_questions', 'true', 'Whether questions auto-advance after selection', 'ui', 'boolean'),

-- Content Configuration
('welcome_message', '"Ready to Begin?"', 'Welcome screen title', 'content', 'string'),
('completion_message', '"Thank you for completing the VALID assessment!"', 'Message shown after completion', 'content', 'string'),
('privacy_policy_url', '""', 'URL to privacy policy (optional)', 'content', 'string'),
('terms_of_service_url', '""', 'URL to terms of service (optional)', 'content', 'string'),

-- Analytics Configuration
('track_session_analytics', 'true', 'Whether to track detailed session analytics', 'analytics', 'boolean'),
('track_time_per_question', 'true', 'Whether to track time spent on each question', 'analytics', 'boolean'),

-- Integration Configuration
('webhook_timeout_seconds', '30', 'Timeout for webhook calls in seconds', 'integration', 'number'),
('max_webhook_retries', '3', 'Maximum number of webhook retry attempts', 'integration', 'number')

ON CONFLICT (config_key) DO NOTHING;

-- Create a function to get configuration values easily
CREATE OR REPLACE FUNCTION get_config(key_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT config_value INTO result
    FROM public.app_config
    WHERE config_key = key_name AND is_active = true;
    
    RETURN result;
END;
$$;

-- Create a function to update configuration (for admin use)
CREATE OR REPLACE FUNCTION update_config(key_name TEXT, new_value JSONB)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.app_config
    SET 
        config_value = new_value,
        updated_at = CURRENT_TIMESTAMP
    WHERE config_key = key_name AND is_editable = true;
    
    RETURN FOUND;
END;
$$;

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_app_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_config_updated_at ON public.app_config;
CREATE TRIGGER app_config_updated_at
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW
    EXECUTE FUNCTION update_app_config_updated_at();

-- Create a view for easier configuration access
DROP VIEW IF EXISTS public.config_view;
CREATE OR REPLACE VIEW public.config_view AS
SELECT 
    config_key,
    config_value,
    description,
    category,
    data_type,
    updated_at
FROM public.app_config
WHERE is_active = true
ORDER BY category, config_key;

-- Grant select on the view
GRANT SELECT ON public.config_view TO anon;

-- Add comments
COMMENT ON TABLE public.app_config IS 'Application configuration settings - NON-SENSITIVE data only';
COMMENT ON FUNCTION get_config(TEXT) IS 'Helper function to retrieve configuration values';
COMMENT ON FUNCTION update_config(TEXT, JSONB) IS 'Helper function to update configuration values';
COMMENT ON VIEW public.config_view IS 'Easy access view for active configuration settings'; 