-- =====================================================
-- BlueOS Aquaculture Module - Supabase Tables
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create tables
-- for the Aquaculture module (Freshwater Fish Farming)
-- =====================================================

-- 1. Aquaculture Users Table
CREATE TABLE IF NOT EXISTS aqua_users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'inspector', 'packer', 'admin')),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    profile_image TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aquaculture Farms Table
CREATE TABLE IF NOT EXISTS aqua_farms (
    id SERIAL PRIMARY KEY,
    farmer_id INTEGER REFERENCES aqua_users(id),
    farm_code VARCHAR(50) UNIQUE NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    address TEXT,
    district VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Andhra Pradesh',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    total_area_acres DECIMAL(10, 2),
    water_source VARCHAR(100),
    primary_species VARCHAR(100),
    license_number VARCHAR(100),
    license_expiry DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aquaculture Ponds Table
CREATE TABLE IF NOT EXISTS aqua_ponds (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER REFERENCES aqua_farms(id) ON DELETE CASCADE,
    pond_code VARCHAR(50) UNIQUE NOT NULL,
    pond_name VARCHAR(100) NOT NULL,
    area_acres DECIMAL(10, 3),
    depth_meters DECIMAL(5, 2),
    pond_type VARCHAR(50) CHECK (pond_type IN ('earthen', 'lined', 'concrete', 'raceway')),
    species VARCHAR(100),
    status VARCHAR(50) DEFAULT 'empty' CHECK (status IN ('empty', 'preparation', 'stocked', 'ready', 'harvesting')),
    stocking_date DATE,
    stocking_density VARCHAR(50),
    expected_harvest_date DATE,
    doc INTEGER DEFAULT 0, -- Days of Culture
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Aquaculture Stocking Records
CREATE TABLE IF NOT EXISTS aqua_stockings (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES aqua_ponds(id) ON DELETE CASCADE,
    stocking_date DATE NOT NULL,
    species VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL, -- Number of seed/PL
    seed_source VARCHAR(255),
    hatchery_name VARCHAR(255),
    seed_size_mm DECIMAL(5, 2),
    stocking_density VARCHAR(50),
    pcr_test_result VARCHAR(50),
    batch_number VARCHAR(100),
    cost_per_thousand DECIMAL(10, 2),
    total_cost DECIMAL(12, 2),
    notes TEXT,
    created_by INTEGER REFERENCES aqua_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Water Quality Records
CREATE TABLE IF NOT EXISTS aqua_water_quality (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES aqua_ponds(id) ON DELETE CASCADE,
    recorded_date DATE NOT NULL,
    recorded_time TIME,
    temperature_c DECIMAL(4, 1),
    ph DECIMAL(4, 2),
    dissolved_oxygen DECIMAL(5, 2),
    salinity_ppt DECIMAL(5, 2),
    ammonia_ppm DECIMAL(6, 3),
    nitrite_ppm DECIMAL(6, 3),
    nitrate_ppm DECIMAL(6, 3),
    alkalinity DECIMAL(6, 2),
    hardness DECIMAL(6, 2),
    transparency_cm INTEGER,
    notes TEXT,
    recorded_by INTEGER REFERENCES aqua_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Feed Records
CREATE TABLE IF NOT EXISTS aqua_feed_records (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES aqua_ponds(id) ON DELETE CASCADE,
    feed_date DATE NOT NULL,
    feed_type VARCHAR(100),
    brand VARCHAR(100),
    quantity_kg DECIMAL(10, 2) NOT NULL,
    feed_size VARCHAR(50),
    feeding_times INTEGER DEFAULT 4,
    total_cost DECIMAL(10, 2),
    notes TEXT,
    recorded_by INTEGER REFERENCES aqua_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Growth Sampling Records
CREATE TABLE IF NOT EXISTS aqua_growth_samples (
    id SERIAL PRIMARY KEY,
    pond_id INTEGER REFERENCES aqua_ponds(id) ON DELETE CASCADE,
    sample_date DATE NOT NULL,
    doc INTEGER, -- Days of Culture at sampling
    sample_count INTEGER,
    avg_body_weight_g DECIMAL(8, 2),
    avg_length_cm DECIMAL(6, 2),
    survival_rate_pct DECIMAL(5, 2),
    biomass_kg DECIMAL(10, 2),
    fcr DECIMAL(4, 2), -- Feed Conversion Ratio
    adg DECIMAL(5, 3), -- Average Daily Growth (g/day)
    health_status VARCHAR(50) CHECK (health_status IN ('healthy', 'stressed', 'diseased', 'recovering')),
    notes TEXT,
    recorded_by INTEGER REFERENCES aqua_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Harvest Records
CREATE TABLE IF NOT EXISTS aqua_harvests (
    id SERIAL PRIMARY KEY,
    harvest_code VARCHAR(50) UNIQUE NOT NULL,
    pond_id INTEGER REFERENCES aqua_ponds(id),
    farm_id INTEGER REFERENCES aqua_farms(id),
    harvest_date DATE NOT NULL,
    harvest_type VARCHAR(50) CHECK (harvest_type IN ('partial', 'full')),
    method VARCHAR(100),
    total_quantity_kg DECIMAL(12, 2) NOT NULL,
    avg_body_weight_g DECIMAL(8, 2),
    avg_count_per_kg INTEGER,
    grade VARCHAR(50),
    survival_rate_pct DECIMAL(5, 2),
    fcr DECIMAL(4, 2),
    doc INTEGER,
    temperature_at_harvest DECIMAL(4, 1),
    buyer_name VARCHAR(255),
    price_per_kg DECIMAL(10, 2),
    total_value DECIMAL(15, 2),
    status VARCHAR(50) DEFAULT 'pending_inspection' CHECK (status IN ('pending_inspection', 'inspected', 'approved', 'rejected', 'packed', 'dispatched')),
    qr_code VARCHAR(100) UNIQUE,
    notes TEXT,
    created_by INTEGER REFERENCES aqua_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Inspection Records
CREATE TABLE IF NOT EXISTS aqua_inspections (
    id SERIAL PRIMARY KEY,
    inspection_code VARCHAR(50) UNIQUE NOT NULL,
    harvest_id INTEGER REFERENCES aqua_harvests(id),
    farm_id INTEGER REFERENCES aqua_farms(id),
    inspector_id INTEGER REFERENCES aqua_users(id),
    inspection_date DATE NOT NULL,
    inspection_type VARCHAR(100),
    
    -- Quality Parameters
    appearance_score INTEGER CHECK (appearance_score BETWEEN 1 AND 10),
    freshness_score INTEGER CHECK (freshness_score BETWEEN 1 AND 10),
    odor_score INTEGER CHECK (odor_score BETWEEN 1 AND 10),
    texture_score INTEGER CHECK (texture_score BETWEEN 1 AND 10),
    color_score INTEGER CHECK (color_score BETWEEN 1 AND 10),
    overall_score DECIMAL(4, 2),
    
    -- Lab Tests
    antibiotic_test VARCHAR(50),
    heavy_metal_test VARCHAR(50),
    microbiological_test VARCHAR(50),
    
    -- Results
    quality_grade VARCHAR(20) CHECK (quality_grade IN ('A', 'B', 'C', 'Rejected')),
    is_approved BOOLEAN,
    rejection_reason TEXT,
    
    -- Temperature Chain
    temperature_at_inspection DECIMAL(4, 1),
    ice_condition VARCHAR(50),
    
    -- Documentation
    photos TEXT[], -- Array of photo URLs
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Packing/Crates Table for Aquaculture
CREATE TABLE IF NOT EXISTS aqua_crates (
    id SERIAL PRIMARY KEY,
    crate_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code VARCHAR(100) UNIQUE,
    qr_image_url TEXT,
    harvest_id INTEGER REFERENCES aqua_harvests(id),
    inspection_id INTEGER REFERENCES aqua_inspections(id),
    packer_id INTEGER REFERENCES aqua_users(id),
    
    -- Crate Details
    species VARCHAR(100),
    grade VARCHAR(50),
    quantity_kg DECIMAL(10, 2),
    count_per_kg INTEGER,
    
    -- Packing Info
    packing_date TIMESTAMP WITH TIME ZONE,
    ice_weight_kg DECIMAL(6, 2),
    gross_weight_kg DECIMAL(10, 2),
    net_weight_kg DECIMAL(10, 2),
    temperature_at_packing DECIMAL(4, 1),
    
    -- Destination
    buyer_name VARCHAR(255),
    destination VARCHAR(255),
    vehicle_number VARCHAR(50),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    
    -- Status
    status VARCHAR(50) DEFAULT 'empty' CHECK (status IN ('empty', 'packed', 'dispatched', 'delivered')),
    dispatch_date TIMESTAMP WITH TIME ZONE,
    delivery_date TIMESTAMP WITH TIME ZONE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Traceability Chain for Aquaculture
CREATE TABLE IF NOT EXISTS aqua_traceability (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'stocking', 'growth', 'harvest', 'inspection', 'crate'
    entity_id INTEGER NOT NULL,
    qr_code VARCHAR(100),
    parent_qr_code VARCHAR(100),
    action VARCHAR(100) NOT NULL,
    action_by INTEGER REFERENCES aqua_users(id),
    action_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INSERT DEFAULT USERS
-- =====================================================

-- Insert default aquaculture users (password: password123)
INSERT INTO aqua_users (username, password_hash, role, full_name, email, phone, address) VALUES
('aquafarmer', '$2b$10$rQZ8K.YqT5F9w5XL5e1OeOD5FJzqL3h5G5H8j5K5L5M5N5O5P5Q5R', 'farmer', 'Kumar Rajan', 'kumar.rajan@email.com', '+91 98765 43210', 'Nellore District, Andhra Pradesh'),
('aquainspector', '$2b$10$rQZ8K.YqT5F9w5XL5e1OeOD5FJzqL3h5G5H8j5K5L5M5N5O5P5Q5R', 'inspector', 'Dr. Lakshmi Devi', 'lakshmi.devi@email.com', '+91 98765 43211', 'Vijayawada, Andhra Pradesh'),
('aquapacker', '$2b$10$rQZ8K.YqT5F9w5XL5e1OeOD5FJzqL3h5G5H8j5K5L5M5N5O5P5Q5R', 'packer', 'Ramesh Kumar', 'ramesh.kumar@email.com', '+91 98765 43212', 'Machilipatnam, Andhra Pradesh'),
('aquaadmin', '$2b$10$rQZ8K.YqT5F9w5XL5e1OeOD5FJzqL3h5G5H8j5K5L5M5N5O5P5Q5R', 'admin', 'Admin User', 'admin.aqua@blueos.com', '+91 98765 43200', 'Head Office')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- INSERT DEMO DATA
-- =====================================================

-- Insert demo farms for the farmer
INSERT INTO aqua_farms (farmer_id, farm_code, farm_name, address, district, latitude, longitude, total_area_acres, water_source, primary_species, status) 
SELECT 
    (SELECT id FROM aqua_users WHERE username = 'aquafarmer'),
    'FARM-AQUA-001',
    'Sunrise Aqua Farm',
    'Muthukur, Nellore District',
    'Nellore',
    14.2896,
    80.0174,
    4.2,
    'Bore Well + Canal',
    'Vannamei Shrimp',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM aqua_farms WHERE farm_code = 'FARM-AQUA-001');

INSERT INTO aqua_farms (farmer_id, farm_code, farm_name, address, district, latitude, longitude, total_area_acres, water_source, primary_species, status) 
SELECT 
    (SELECT id FROM aqua_users WHERE username = 'aquafarmer'),
    'FARM-AQUA-002',
    'Blue Waters Farm',
    'Kavali, Nellore District',
    'Nellore',
    14.9167,
    79.9833,
    3.5,
    'Canal Water',
    'Vannamei Shrimp',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM aqua_farms WHERE farm_code = 'FARM-AQUA-002');

-- Insert demo ponds
INSERT INTO aqua_ponds (farm_id, pond_code, pond_name, area_acres, depth_meters, pond_type, species, status, stocking_date, stocking_density, doc)
SELECT 
    (SELECT id FROM aqua_farms WHERE farm_code = 'FARM-AQUA-001'),
    'POND-A1-001',
    'Pond A1',
    0.8,
    1.5,
    'earthen',
    'Vannamei',
    'stocked',
    '2024-09-01',
    '60 PL/m²',
    75
WHERE NOT EXISTS (SELECT 1 FROM aqua_ponds WHERE pond_code = 'POND-A1-001');

INSERT INTO aqua_ponds (farm_id, pond_code, pond_name, area_acres, depth_meters, pond_type, species, status, stocking_date, stocking_density, doc)
SELECT 
    (SELECT id FROM aqua_farms WHERE farm_code = 'FARM-AQUA-001'),
    'POND-A2-002',
    'Pond A2',
    0.9,
    1.5,
    'earthen',
    'Vannamei',
    'stocked',
    '2024-09-15',
    '55 PL/m²',
    60
WHERE NOT EXISTS (SELECT 1 FROM aqua_ponds WHERE pond_code = 'POND-A2-002');

INSERT INTO aqua_ponds (farm_id, pond_code, pond_name, area_acres, depth_meters, pond_type, species, status, stocking_date, stocking_density, doc)
SELECT 
    (SELECT id FROM aqua_farms WHERE farm_code = 'FARM-AQUA-001'),
    'POND-A3-003',
    'Pond A3',
    0.75,
    1.2,
    'lined',
    'Vannamei',
    'empty',
    NULL,
    NULL,
    0
WHERE NOT EXISTS (SELECT 1 FROM aqua_ponds WHERE pond_code = 'POND-A3-003');

INSERT INTO aqua_ponds (farm_id, pond_code, pond_name, area_acres, depth_meters, pond_type, species, status, stocking_date, stocking_density, doc)
SELECT 
    (SELECT id FROM aqua_farms WHERE farm_code = 'FARM-AQUA-002'),
    'POND-B1-004',
    'Pond B1',
    1.2,
    1.5,
    'lined',
    'Vannamei',
    'ready',
    '2024-08-15',
    '65 PL/m²',
    95
WHERE NOT EXISTS (SELECT 1 FROM aqua_ponds WHERE pond_code = 'POND-B1-004');

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_aqua_farms_farmer ON aqua_farms(farmer_id);
CREATE INDEX IF NOT EXISTS idx_aqua_ponds_farm ON aqua_ponds(farm_id);
CREATE INDEX IF NOT EXISTS idx_aqua_harvests_pond ON aqua_harvests(pond_id);
CREATE INDEX IF NOT EXISTS idx_aqua_harvests_farm ON aqua_harvests(farm_id);
CREATE INDEX IF NOT EXISTS idx_aqua_inspections_harvest ON aqua_inspections(harvest_id);
CREATE INDEX IF NOT EXISTS idx_aqua_crates_harvest ON aqua_crates(harvest_id);
CREATE INDEX IF NOT EXISTS idx_aqua_water_quality_pond ON aqua_water_quality(pond_id);
CREATE INDEX IF NOT EXISTS idx_aqua_traceability_qr ON aqua_traceability(qr_code);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY (Optional)
-- =====================================================

-- ALTER TABLE aqua_users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE aqua_farms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE aqua_ponds ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE aqua_harvests ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DONE!
-- =====================================================
