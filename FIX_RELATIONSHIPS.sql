-- Ensure foreign key relationship between catch_logs and trips
ALTER TABLE catch_logs 
DROP CONSTRAINT IF EXISTS catch_logs_trip_id_fkey;

ALTER TABLE catch_logs
ADD CONSTRAINT catch_logs_trip_id_fkey
FOREIGN KEY (trip_id)
REFERENCES trips(id)
ON DELETE CASCADE;

-- Ensure foreign key relationship between catch_logs and users (entered_by)
ALTER TABLE catch_logs
DROP CONSTRAINT IF EXISTS catch_logs_entered_by_fkey;

ALTER TABLE catch_logs
ADD CONSTRAINT catch_logs_entered_by_fkey
FOREIGN KEY (entered_by)
REFERENCES users(id)
ON DELETE SET NULL;

-- Refresh the schema cache by notifying (optional, but good practice)
NOTIFY pgrst, 'reload schema';
