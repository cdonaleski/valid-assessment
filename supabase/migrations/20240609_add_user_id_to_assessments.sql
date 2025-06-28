-- Migration: Add user_id to assessments and set up RLS for user-linked reports

-- 1. Add user_id column
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Create index for performance
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);

-- 3. Enable Row Level Security
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- 4. Policy: Only allow users to select their own assessments
CREATE POLICY "Users can view their own assessments"
ON assessments
FOR SELECT
USING (user_id = auth.uid());

-- 5. Policy: Only allow users to insert their own assessments
CREATE POLICY "Users can insert their own assessments"
ON assessments
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- 6. Policy: Only allow users to update their own assessments
CREATE POLICY "Users can update their own assessments"
ON assessments
FOR UPDATE
USING (user_id = auth.uid());

-- 7. Policy: Only allow users to delete their own assessments (optional)
CREATE POLICY "Users can delete their own assessments"
ON assessments
FOR DELETE
USING (user_id = auth.uid()); 