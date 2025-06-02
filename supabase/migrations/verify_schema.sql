-- Verify assessments table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'assessments'
ORDER BY ordinal_position;

-- Verify questions table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'questions'
ORDER BY ordinal_position;

-- Verify assessment_progress table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'assessment_progress'
ORDER BY ordinal_position; 