-- Run this SQL in your Supabase SQL Editor to fix ALL "Column not found" errors

-- Ensure all expense and detail columns exist
ALTER TABLE trips ADD COLUMN IF NOT EXISTS fuel_price DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS ice_price DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS food_budget DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS other_expenses DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS total_expenses DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS crew_count INT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS fuel_liters DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS ice_kg DECIMAL(10,2);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS target_species TEXT;

-- Ensure the previously identified missing columns exist
ALTER TABLE trips ADD COLUMN IF NOT EXISTS expected_return_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS vessel_image TEXT;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS gear_image TEXT;

-- Reload the PostgREST schema cache (CRITICAL)
NOTIFY pgrst, 'reload config';
