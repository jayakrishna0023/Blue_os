-- =====================================================
-- BlueOS Mariculture Module - Supabase Tables
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- Mariculture Users (optional - can share main users table)
CREATE TABLE IF NOT EXISTS mari_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'farmer',
  phone VARCHAR(20),
  email VARCHAR(255),
  module VARCHAR(50) DEFAULT 'mariculture',
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mariculture Farms
CREATE TABLE IF NOT EXISTS mari_farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farmer_id UUID NOT NULL,
  farm_code VARCHAR(50) UNIQUE,
  farm_name VARCHAR(255) NOT NULL,
  address TEXT,
  district VARCHAR(100),
  water_body_type VARCHAR(50) DEFAULT 'Sea',
  total_area_hectares DECIMAL(10,2),
  primary_species VARCHAR(100),
  gps_lat DECIMAL(10,6),
  gps_lng DECIMAL(10,6),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Culture Units (Rafts, Longlines, Sea Cages, Pens)
CREATE TABLE IF NOT EXISTS mari_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES mari_farms(id) ON DELETE CASCADE,
  unit_code VARCHAR(50) UNIQUE,
  unit_name VARCHAR(255) NOT NULL,
  unit_type VARCHAR(50) DEFAULT 'raft',
  species VARCHAR(100),
  capacity INTEGER DEFAULT 0,
  gps_coordinates VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seedings
CREATE TABLE IF NOT EXISTS mari_seedings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES mari_units(id) ON DELETE CASCADE,
  species VARCHAR(100),
  quantity INTEGER DEFAULT 0,
  seed_source VARCHAR(255),
  seeding_date DATE,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harvests
CREATE TABLE IF NOT EXISTS mari_harvests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES mari_farms(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES mari_units(id),
  harvest_code VARCHAR(50) UNIQUE,
  qr_code VARCHAR(100),
  qr_image_url TEXT,
  species VARCHAR(100),
  total_quantity_kg DECIMAL(10,2),
  method VARCHAR(50) DEFAULT 'manual',
  harvest_date DATE,
  grade VARCHAR(50),
  status VARCHAR(30) DEFAULT 'pending_inspection',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Water Quality Records
CREATE TABLE IF NOT EXISTS mari_water_quality (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES mari_units(id) ON DELETE CASCADE,
  temperature_c DECIMAL(5,2),
  ph DECIMAL(4,2),
  dissolved_oxygen DECIMAL(5,2),
  salinity_ppt DECIMAL(5,2),
  turbidity DECIMAL(5,2),
  recorded_by UUID,
  recorded_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inspections
CREATE TABLE IF NOT EXISTS mari_inspections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  harvest_id UUID REFERENCES mari_harvests(id),
  inspector_id UUID,
  water_temp_c DECIMAL(5,2),
  ph_level DECIMAL(4,2),
  dissolved_oxygen DECIMAL(5,2),
  avg_weight_g DECIMAL(8,2),
  quality_grade VARCHAR(20),
  overall_score DECIMAL(4,2),
  freshness_score INTEGER,
  remarks TEXT,
  decision VARCHAR(20),
  inspection_date TIMESTAMPTZ DEFAULT NOW()
);

-- Crates
CREATE TABLE IF NOT EXISTS mari_crates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  harvest_id UUID REFERENCES mari_harvests(id),
  crate_code VARCHAR(50) UNIQUE,
  qr_code VARCHAR(100),
  qr_image_url TEXT,
  packer_id UUID,
  species VARCHAR(100),
  weight_kg DECIMAL(8,2),
  grade VARCHAR(50),
  notes TEXT,
  packing_date TIMESTAMPTZ,
  dispatch_date TIMESTAMPTZ,
  dispatched_to VARCHAR(255),
  vehicle_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'packed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Sample Test Users (run after creating tables)
-- =====================================================
INSERT INTO mari_users (username, password_hash, full_name, role) VALUES
  ('marifarmer', 'marifarmer123', 'Selvam Murugan', 'farmer'),
  ('mariinspector', 'mariinspector123', 'Murugan Selvam', 'inspector'),
  ('maripacker', 'maripacker123', 'Kannan Perumal', 'packer')
ON CONFLICT (username) DO NOTHING;

-- Enable RLS (Row Level Security) - optional for dev
-- ALTER TABLE mari_farms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mari_units ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE mari_harvests ENABLE ROW LEVEL SECURITY;
-- etc.

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mari_farms_farmer ON mari_farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_mari_units_farm ON mari_units(farm_id);
CREATE INDEX IF NOT EXISTS idx_mari_harvests_farm ON mari_harvests(farm_id);
CREATE INDEX IF NOT EXISTS idx_mari_harvests_status ON mari_harvests(status);
CREATE INDEX IF NOT EXISTS idx_mari_inspections_harvest ON mari_inspections(harvest_id);
CREATE INDEX IF NOT EXISTS idx_mari_crates_harvest ON mari_crates(harvest_id);
CREATE INDEX IF NOT EXISTS idx_mari_water_quality_unit ON mari_water_quality(unit_id);
