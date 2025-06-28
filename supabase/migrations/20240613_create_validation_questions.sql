-- Create validation_questions table for gamification (NOT affiliated with VALID Assessment)
-- These questions are for daily engagement, points, and gamification only.
-- They are NOT used in the official VALID Assessment or scoring.

CREATE TABLE IF NOT EXISTS validation_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'verity', 'association', 'lived_experience', 'institutional', 'desire', 'comparison', 'speed', 'bias', 'daily', 'bonus'
    type TEXT NOT NULL,     -- e.g., 'recognition', 'comparison', 'speed', 'bias', 'bonus', 'streak', 'challenge'
    points INTEGER NOT NULL DEFAULT 2,
    source TEXT NOT NULL DEFAULT 'gamification', -- 'gamification' or other future sources
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_validation_questions_category_type ON validation_questions (category, type); 