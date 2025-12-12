-- Run this script in your Supabase SQL Editor to ensure your database schema is correct

-- 1. Add missing columns to 'trips' table if they don't exist
ALTER TABLE trips ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_code TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vessel_name TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vessel_id TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vessel_owner_id TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_expenses NUMERIC DEFAULT 0;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS crew_members TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS fuel_liters NUMERIC;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS ice_kg NUMERIC;

-- 2. Add missing columns to 'catch_logs' table
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS trip_id BIGINT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS species_name TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 0;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS count INTEGER DEFAULT 1;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS images TEXT[];
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS quality_grade TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS freshness TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS damage_assessment TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS gps_lat NUMERIC;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS gps_lng NUMERIC;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS catch_session_id TEXT;
ALTER TABLE catch_logs ADD COLUMN IF NOT EXISTS entered_by TEXT;

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vessel_name ON trips(vessel_name);
CREATE INDEX IF NOT EXISTS idx_catch_logs_trip_id ON catch_logs(trip_id);
CREATE INDEX IF NOT EXISTS idx_catch_logs_qr_code ON catch_logs(qr_code);

-- 4. Verify tables exist (will error if not, which is fine as it alerts you)
SELECT count(*) FROM trips;
SELECT count(*) FROM catch_logs;
