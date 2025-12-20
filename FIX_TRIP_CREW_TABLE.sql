-- Run this SQL in your Supabase SQL Editor to fix the trip_crew table

-- 1. Add joined_at column if it doesn't exist
ALTER TABLE trip_crew 
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trip_crew';

-- 3. Check current trip_crew data
SELECT tc.*, f.full_name as fisher_name
FROM trip_crew tc
LEFT JOIN fishers f ON tc.fisher_id = f.id
ORDER BY tc.trip_id DESC
LIMIT 20;
