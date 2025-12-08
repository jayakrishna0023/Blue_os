-- Run this in Supabase SQL Editor to fix missing relationships

-- 1. Add Foreign Key for catch_logs -> trips
-- This allows us to fetch Vessel Name and Trip Code when querying a Catch Log
ALTER TABLE catch_logs
ADD CONSTRAINT fk_catch_logs_trips
FOREIGN KEY (trip_id)
REFERENCES trips (id);

-- 2. Add Foreign Key for catch_logs -> crates (if missing)
ALTER TABLE catch_logs
ADD CONSTRAINT fk_catch_logs_crates
FOREIGN KEY (crate_id)
REFERENCES crates (id);

-- 3. Ensure trips table has necessary columns
-- (These should already exist, but good to verify)
-- ALTER TABLE trips ADD COLUMN IF NOT EXISTS vessel_name TEXT;
-- ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_code TEXT;
