-- Run this SQL in your Supabase SQL Editor to enable Quality Inspection features

-- Add columns for Quality Inspection to catch_logs table
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS temperature DECIMAL(5,2);
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS quality_grade TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS inspected_by UUID; -- Assuming Supabase Auth uses UUID, or INT if using custom users table
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP WITH TIME ZONE;

-- If you are using a custom 'users' table with integer IDs (based on previous context of 'users' table), use INT instead of UUID
-- Uncomment the line below if your users table uses integer IDs and the above fails or is incorrect for your schema
-- ALTER TABLE catch_logs ALTER COLUMN inspected_by TYPE INT; 
-- OR just add it as INT initially if you are sure:
-- ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS inspected_by INT;

-- Reload schema cache
NOTIFY pgrst, 'reload config';
