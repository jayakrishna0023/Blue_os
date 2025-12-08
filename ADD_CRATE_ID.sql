-- Add crate_id column to catch_logs if it doesn't exist
ALTER TABLE catch_logs 
ADD COLUMN IF NOT EXISTS crate_id UUID REFERENCES crates(id) ON DELETE SET NULL;

-- Add inspected_by column to catch_logs if it doesn't exist (to track who did the quality check)
ALTER TABLE catch_logs
ADD COLUMN IF NOT EXISTS inspected_by UUID REFERENCES users(id) ON DELETE SET NULL;

NOTIFY pgrst, 'reload schema';
