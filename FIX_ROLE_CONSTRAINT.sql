-- Fix the users table role constraint to include 'inspector'
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add the updated constraint with 'inspector' included
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'captain', 'worker', 'public', 'inspector'));

-- Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND contype = 'c';
