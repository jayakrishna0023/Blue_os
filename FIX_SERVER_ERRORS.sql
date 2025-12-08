-- Fix missing column in qr_codes table
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage buckets if they don't exist (this is usually done in UI, but good to document)
-- Note: You cannot create buckets via SQL in Supabase usually, but you can insert into storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('catch-images', 'catch-images', true)
ON CONFLICT (id) DO NOTHING;

-- Fix RLS policies for Storage
-- Allow public access to view files
CREATE POLICY "Public Access QR Codes" ON storage.objects FOR SELECT USING ( bucket_id = 'qr-codes' );
CREATE POLICY "Public Access Catch Images" ON storage.objects FOR SELECT USING ( bucket_id = 'catch-images' );

-- Allow authenticated (and anon for now, for testing) uploads
-- DROP POLICY IF EXISTS "Allow Uploads QR Codes" ON storage.objects;
CREATE POLICY "Allow Uploads QR Codes" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'qr-codes' );

-- DROP POLICY IF EXISTS "Allow Uploads Catch Images" ON storage.objects;
CREATE POLICY "Allow Uploads Catch Images" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'catch-images' );

-- Fix RLS for qr_codes table if needed
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON qr_codes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- For development/testing, you might want to allow anon inserts too if your auth isn't fully set up yet
CREATE POLICY "Enable insert for anon users" ON qr_codes FOR INSERT WITH CHECK (true);

-- Fix RLS for qr_counters table
ALTER TABLE qr_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON qr_counters FOR SELECT USING (true);
CREATE POLICY "Enable insert/update for all users" ON qr_counters FOR ALL USING (true);
