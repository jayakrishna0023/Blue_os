-- =========================================================
-- BlueOS Database Update Script
-- Run this in your Supabase SQL Editor to add missing columns
-- =========================================================

-- ============================
-- 1. ADD MISSING COLUMNS TO VESSELS TABLE
-- ============================

-- Add vessel_type column (e.g., 'M - Mechanised', 'O - Motorised', 'D - Deep Sea')
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS vessel_type VARCHAR(100) DEFAULT 'M - Mechanised';

-- Add storage capacity (in kg)
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS storage_capacity INTEGER;

-- Add crew capacity
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS crew_capacity INTEGER;

-- Add fuel type
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) DEFAULT 'Diesel';

-- Add IMN number (license/registration number from marine authority)
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS imn_number VARCHAR(100);

-- Add contact info directly on vessels (optional, backup for owner details)
ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);

ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

ALTER TABLE vessels 
ADD COLUMN IF NOT EXISTS address TEXT;

-- ============================
-- 2. UPDATE EXISTING VESSELS WITH DEFAULT VALUES
-- ============================

-- Set default vessel_type for existing records
UPDATE vessels 
SET vessel_type = 'M - Mechanised' 
WHERE vessel_type IS NULL;

-- Set default fuel_type for existing records
UPDATE vessels 
SET fuel_type = 'Diesel' 
WHERE fuel_type IS NULL;

-- ============================
-- 3. COPY OWNER CONTACT INFO FROM USERS TO VESSELS
-- ============================

-- Update vessels with contact info from linked users
UPDATE vessels v
SET 
    contact_number = u.phone,
    email = u.email,
    address = u.address
FROM users u
WHERE u.vessel_id = v.id
  AND (v.contact_number IS NULL OR v.contact_number = '');

-- ============================
-- 4. VERIFY USERS TABLE HAS REQUIRED COLUMNS
-- ============================

-- Ensure users table has phone column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Ensure users table has contact_number column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(20);

-- Ensure users table has email column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Ensure users table has address column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Ensure users table has vessel_id column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS vessel_id INTEGER REFERENCES vessels(id);

-- Ensure users table has owner_id column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id);

-- ============================
-- 5. VERIFY PENDING_REGISTRATIONS TABLE HAS REQUIRED COLUMNS
-- ============================

-- Ensure pending_registrations has registration_data JSONB column
ALTER TABLE pending_registrations 
ADD COLUMN IF NOT EXISTS registration_data JSONB;

-- Ensure pending_registrations has password_hash column
ALTER TABLE pending_registrations 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Ensure pending_registrations has username column
ALTER TABLE pending_registrations 
ADD COLUMN IF NOT EXISTS username VARCHAR(100);

-- Ensure pending_registrations has email column
ALTER TABLE pending_registrations 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- ============================
-- 6. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================

-- Index for user lookups by phone
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Index for user lookups by vessel_id
CREATE INDEX IF NOT EXISTS idx_users_vessel_id ON users(vessel_id);

-- Index for vessel lookups by registration_number
CREATE INDEX IF NOT EXISTS idx_vessels_registration ON vessels(registration_number);

-- ============================
-- 7. VIEW CURRENT DATA (for verification)
-- ============================

-- Run these SELECT statements separately to verify data:
-- SELECT id, name, vessel_type, engine_power_hp, length_meters, storage_capacity, crew_capacity, fuel_type, home_port FROM vessels;
-- SELECT id, username, full_name, phone, vessel_id, vessel_name FROM users WHERE vessel_id IS NOT NULL;

-- ============================
-- 8. CREATE DEFAULT ADMIN USER (if not exists)
-- ============================

-- Check if admin exists, if not create one
INSERT INTO users (username, password, role, full_name)
SELECT 'admin', 'admin123', 'admin', 'System Administrator'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Create default inspector if not exists
INSERT INTO users (username, password, role, full_name)
SELECT 'inspector', 'inspector123', 'inspector', 'Default Inspector'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'inspector');

-- Create default worker if not exists
INSERT INTO users (username, password, role, full_name)
SELECT 'worker', 'worker123', 'worker', 'Default Worker'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'worker');

-- =========================================================
-- SCRIPT COMPLETE
-- After running this script, restart the backend server
-- =========================================================
