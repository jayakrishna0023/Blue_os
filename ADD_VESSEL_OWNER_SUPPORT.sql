-- SQL Migration: Add Vessel Owner Support
-- Run this in your Supabase SQL Editor

-- 1. Add new columns to pending_registrations table for vessel owner registrations
ALTER TABLE pending_registrations 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'vessel',
ADD COLUMN IF NOT EXISTS username VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS registration_data JSONB,
ADD COLUMN IF NOT EXISTS approved_by INTEGER,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- 2. Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_vessel_owner BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 3. Add new columns to vessels table for detailed registration
ALTER TABLE vessels
ADD COLUMN IF NOT EXISTS length_meters DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS engine_power_hp INTEGER,
ADD COLUMN IF NOT EXISTS home_port VARCHAR(255),
ADD COLUMN IF NOT EXISTS build_year INTEGER;

-- 4. Add new columns to crates table for chain of custody
ALTER TABLE crates
ADD COLUMN IF NOT EXISTS packed_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS packed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS seal_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255),
ADD COLUMN IF NOT EXISTS temperature_at_pack DECIMAL(4,1);

-- 5. Add new columns to catch_logs for FAO compliance and quality inspection
ALTER TABLE catch_logs
ADD COLUMN IF NOT EXISTS species_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS scientific_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS fao_zone VARCHAR(10),
ADD COLUMN IF NOT EXISTS freshness VARCHAR(50),
ADD COLUMN IF NOT EXISTS eye_clarity VARCHAR(50),
ADD COLUMN IF NOT EXISTS gill_color VARCHAR(50),
ADD COLUMN IF NOT EXISTS skin_condition VARCHAR(50),
ADD COLUMN IF NOT EXISTS smell VARCHAR(50),
ADD COLUMN IF NOT EXISTS damage_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS damage_notes TEXT,
ADD COLUMN IF NOT EXISTS inspector_notes TEXT,
ADD COLUMN IF NOT EXISTS inspected_by INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMP WITH TIME ZONE;

-- 6. Add fishing_method_code to trips table
ALTER TABLE trips
ADD COLUMN IF NOT EXISTS fishing_method_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS fao_zone VARCHAR(10);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pending_registrations_type ON pending_registrations(type);
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status ON pending_registrations(status);
CREATE INDEX IF NOT EXISTS idx_users_is_vessel_owner ON users(is_vessel_owner);
CREATE INDEX IF NOT EXISTS idx_catch_logs_species_code ON catch_logs(species_code);
CREATE INDEX IF NOT EXISTS idx_crates_packed_by ON crates(packed_by);

-- Success message
SELECT 'Migration completed successfully! Added vessel owner support, FAO compliance, and quality inspection fields.' as message;
