-- Add new fields to users table for roles and HRIS integration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id),
  ADD COLUMN IF NOT EXISTS team_role TEXT,
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS manager_id UUID,
  ADD COLUMN IF NOT EXISTS job_code TEXT,
  ADD COLUMN IF NOT EXISTS department_code TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS synced_from_hris BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Create teams table if it does not exist
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
); 