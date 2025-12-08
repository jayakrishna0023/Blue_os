const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const { supabase, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database
initDB();

async function uploadImage(base64Data, bucketName, path) {
    if (!base64Data) return null;
    try {
        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const base64 = base64Data.split(',')[1] || base64Data;
        const buffer = Buffer.from(base64, 'base64');
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: 'image/jpeg',
                upsert: true
            });
            
        if (error) {
            console.error('Supabase upload error:', error);
            return null;
        }
        
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(path);
            
        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Image upload error:', err);
        return null;
    }
}

// --- ROUTES ---

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password);
            
        if (error) throw error;

        if (users.length > 0) {
            const user = users[0];
            res.json({ success: true, user: { id: user.id, username: user.username, role: user.role, vesselName: user.vessel_name, vessel_id: user.id, owner_id: user.id } });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get All Users (Admin)
app.get('/api/users', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, role, vessel_name, created_at')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Trips
app.post('/api/trips', async (req, res) => {
    const data = req.body;
    console.log("Received trip data:", data); // Debug log

    try {
        // Upload images if present
        const vesselImageUrl = data.vesselImage ? await uploadImage(data.vesselImage, 'catch-images', `trips/${data.tripCode}/vessel.jpg`) : null;
        const gearImageUrl = data.gearImage ? await uploadImage(data.gearImage, 'catch-images', `trips/${data.tripCode}/gear.jpg`) : null;

        // Helper to clean numeric inputs
        const toNum = (val) => (val === '' || val === null || val === undefined) ? null : parseFloat(val);
        // Helper to clean date inputs
        const toDate = (val) => (val === '' || val === null || val === undefined) ? null : val;

        const { data: result, error } = await supabase
            .from('trips')
            .insert([{
                trip_code: data.tripCode,
                vessel_name: data.vesselName || 'Unknown',
                fishing_method: data.fishingMethod,
                departure_date: new Date(), // Always set start to now
                departure_port: data.departurePort,
                crew_count: toNum(data.crewMembers),
                fuel_liters: toNum(data.fuelLiters),
                fuel_price: toNum(data.fuelPrice),
                ice_kg: toNum(data.iceKg),
                ice_price: toNum(data.icePrice),
                food_budget: toNum(data.foodBudget),
                other_expenses: toNum(data.otherExpenses),
                total_expenses: toNum(data.totalExpenses),
                target_species: data.targetSpecies,
                expected_return_date: toDate(data.expectedReturn || data.expectedReturnDate), // Handle both key names
                vessel_image: vesselImageUrl,
                gear_image: gearImageUrl,
                status: 'active'
            }])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            if (error.code === 'PGRST204') {
                console.error("----------------------------------------------------------------");
                console.error("CRITICAL SCHEMA ERROR: The database is missing columns.");
                console.error("Please run the SQL commands in 'UPDATE_TRIPS_TABLE.sql' in your Supabase SQL Editor.");
                console.error("Then, go to API Settings -> 'Reload Schema Cache' if the issue persists.");
                console.error("----------------------------------------------------------------");
            }
            throw error;
        }
        
        res.json({ success: true, tripId: result[0].id, message: 'Trip started' });
    } catch (error) {
        console.error("Trip Creation Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});

app.get('/api/trips/active', async (req, res) => {
    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*')
            .eq('status', 'active')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/trips', async (req, res) => {
    try {
        const { data: rows, error } = await supabase
            .from('trips')
            .select('*')
            .order('departure_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/trips/:tripId/catch', async (req, res) => {
    const { tripId } = req.params;
    try {
        const { data: logs, error } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('trip_id', tripId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Catch Log by QR (with Trip details)
app.get('/api/catch/qr/:qrCode', async (req, res) => {
    const { qrCode } = req.params;
    try {
        // Try to fetch log with trip details
        // Note: This requires a Foreign Key between catch_logs.trip_id and trips.id
        const { data: logs, error } = await supabase
            .from('catch_logs')
            .select(`
                *,
                trips (
                    trip_code,
                    vessel_name,
                    departure_date
                )
            `)
            .eq('qr_code', qrCode);

        if (error) throw error;

        if (logs.length > 0) {
            const log = logs[0];
            
            // Fallback: If the join failed (log.trips is null) but we have trip_id, fetch trip manually
            if (!log.trips && log.trip_id) {
                const { data: tripData } = await supabase
                    .from('trips')
                    .select('trip_code, vessel_name, departure_date')
                    .eq('id', log.trip_id)
                    .single();
                
                if (tripData) {
                    log.trips = tripData;
                }
            }

            res.json({ success: true, log });
        } else {
            res.json({ success: false, message: 'QR Code not found' });
        }
    } catch (error) {
        console.error("Error fetching QR log:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Catch Logs (Insert or Update)
app.post('/api/catch', async (req, res) => {
    const data = req.body;
    console.log("Received catch data:", JSON.stringify(data, null, 2)); // Debug log

    try {
        const cleanQr = data.qrCode ? data.qrCode.trim() : '';

        if (!cleanQr) {
            return res.status(400).json({ success: false, message: 'QR Code is required' });
        }

        if (!data.tripId) {
            return res.status(400).json({ success: false, message: 'Trip ID is missing' });
        }

        // Check if QR exists
        const { data: existing, error: fetchError } = await supabase
            .from('catch_logs')
            .select('id')
            .eq('qr_code', cleanQr);

        if (fetchError) {
            console.error("Error checking existing QR:", fetchError);
            throw fetchError;
        }
        
        if (existing.length > 0) {
            // If it exists, we treat this as an INSPECTION UPDATE
            console.log(`Updating existing catch log for QR: ${cleanQr}`);
            
            const updatePayload = {
                quality_grade: data.qualityGrade,
                freshness: data.freshness,
                damage_assessment: data.damage
            };

            // Only update weight if provided (don't overwrite with 0 if not measured)
            if (data.weight) {
                updatePayload.weight_kg = data.weight;
            }

            // If crate ID is provided (Worker assigning to crate)
            if (data.crateId) {
                updatePayload.crate_id = data.crateId;
            }

            // Track who performed the inspection
            if (data.inspectorId) {
                updatePayload.inspected_by = data.inspectorId;
            }

            const { error: updateError } = await supabase
                .from('catch_logs')
                .update(updatePayload)
                .eq('qr_code', cleanQr);

            if (updateError) {
                console.error("Supabase Catch Update Error:", updateError);
                throw updateError;
            }

            return res.json({ success: true, message: 'Inspection data updated successfully' });
        } else {
            // Insert new catch (Captain)
            let imageUrls = [];
            if (data.images && Array.isArray(data.images)) {
                for (let i = 0; i < data.images.length; i++) {
                    try {
                        const url = await uploadImage(data.images[i], 'catch-images', `catch/${data.tripId}/${cleanQr}_${i}.jpg`);
                        if (url) imageUrls.push(url);
                    } catch (imgErr) {
                        console.error("Image upload failed:", imgErr);
                    }
                }
            }

            const { error: insertError } = await supabase
                .from('catch_logs')
                .insert([{
                    trip_id: data.tripId,
                    species_name: data.species || 'Unknown',
                    weight_kg: data.weight || 0,
                    count: data.count || 1,
                    quality_grade: data.qualityGrade || null,
                    freshness: data.freshness || 'Excellent',
                    damage_assessment: data.damage || 'None',
                    gps_lat: data.gps?.lat || 0,
                    gps_lng: data.gps?.lng || 0,
                    location_name: data.locationName || '',
                    qr_code: cleanQr,
                    images: imageUrls,
                    catch_session_id: data.catchSessionId || null,
                    entered_by: data.userId || null
                }]);

            if (insertError) {
                console.error("Supabase Catch Insert Error:", insertError);
                throw insertError;
            }
            res.json({ success: true, message: 'Catch logged' });
        }
    } catch (error) {
        console.error("Catch Log API Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});

// QR Generation (Advanced)
app.post('/api/qr/generate', async (req, res) => {
    const { qrType, countryCode, landingCentre, year, quantity } = req.body;
    
    if (!qrType || !countryCode || !landingCentre || !year) {
        return res.status(400).json({ success: false, message: 'Missing fields' });
    }

    try {
        // Get or create counter
        const { data: counters, error: fetchError } = await supabase
            .from('qr_counters')
            .select('last_number')
            .eq('qr_type', qrType)
            .eq('country_code', countryCode)
            .eq('landing_centre', landingCentre)
            .eq('year', year);

        if (fetchError) throw fetchError;

        let lastNumber = 0;
        if (counters.length > 0) {
            lastNumber = counters[0].last_number;
        } else {
            const { error: insertError } = await supabase
                .from('qr_counters')
                .insert([{
                    qr_type: qrType,
                    country_code: countryCode,
                    landing_centre: landingCentre,
                    year: year,
                    last_number: 0
                }]);
            if (insertError) throw insertError;
        }

        const codes = [];
        const imageUrls = [];
        
        for (let i = 1; i <= quantity; i++) {
            const num = lastNumber + i;
            const paddedNum = num.toString().padStart(6, '0');
            // Format: TYPE-COUNTRY-CENTER-YEAR-NUMBER (e.g., FISH-IND-CHN-2025-000001)
            const code = `${qrType}-${countryCode}-${landingCentre}-${year}-${paddedNum}`;
            codes.push(code);
            
            try {
                // Generate QR Image
                const dataUrl = await QRCode.toDataURL(code);
                // Upload to Supabase
                const publicUrl = await uploadImage(dataUrl, 'qr-codes', `${code}.png`);
                if (publicUrl) imageUrls.push(publicUrl);
            } catch (err) {
                console.error(`Failed to generate/upload QR for ${code}:`, err);
            }
        }

        // Update counter
        const { error: updateError } = await supabase
            .from('qr_counters')
            .update({ last_number: lastNumber + quantity })
            .eq('qr_type', qrType)
            .eq('country_code', countryCode)
            .eq('landing_centre', landingCentre)
            .eq('year', year);

        if (updateError) throw updateError;

        // Store generated codes
        const qrEntries = codes.map((c, idx) => ({ 
            code: c, 
            status: 'generated',
            image_url: imageUrls[idx] || null
        }));
        
        const { error: qrInsertError } = await supabase.from('qr_codes').insert(qrEntries);
        if (qrInsertError) console.warn("Could not save individual QR codes:", qrInsertError.message);

        res.json({ success: true, codes, imageUrls });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Crates
app.get('/api/crates', async (req, res) => {
    try {
        const { data: crates, error } = await supabase
            .from('crates')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, crates });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/crates/verify-fish', async (req, res) => {
    const { qrCode } = req.body;
    const cleanQr = qrCode ? qrCode.trim() : '';
    
    try {
        // Check if fish exists and is not already in a crate
        const { data: fish, error } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('qr_code', cleanQr)
            .single();

        if (error || !fish) {
            return res.json({ success: false, message: `Fish tag '${cleanQr}' not found in catch logs.` });
        }

        if (fish.crate_id) {
            return res.json({ success: false, message: 'This fish is already packed in a crate.' });
        }

        res.json({ success: true, fish });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/crates/seal', async (req, res) => {
    const { tripId, fishQrCodes } = req.body;
    
    if (!fishQrCodes || fishQrCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'No fish selected for crate.' });
    }

    try {
        // 1. Generate Crate QR
        const crateQr = `CRATE-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Generate QR Image for Crate
        const dataUrl = await QRCode.toDataURL(crateQr);
        const qrImageUrl = await uploadImage(dataUrl, 'qr-codes', `${crateQr}.png`);

        // 2. Calculate totals
        const { data: fishData, error: fetchError } = await supabase
            .from('catch_logs')
            .select('weight_kg, count')
            .in('qr_code', fishQrCodes);
            
        if (fetchError) throw fetchError;

        const totalWeight = fishData.reduce((sum, f) => sum + (f.weight_kg || 0), 0);
        const fishCount = fishData.reduce((sum, f) => sum + (f.count || 1), 0);

        // 3. Create Crate Record
        const { data: crate, error: crateError } = await supabase
            .from('crates')
            .insert([{
                crate_qr: crateQr,
                trip_id: tripId,
                total_weight: totalWeight,
                fish_count: fishCount
            }])
            .select()
            .single();

        if (crateError) throw crateError;

        // 4. Update Fish Records
        const { error: updateError } = await supabase
            .from('catch_logs')
            .update({ crate_id: crate.id })
            .in('qr_code', fishQrCodes);

        if (updateError) throw updateError;

        res.json({ success: true, crate, qrImageUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/crates/:qr', async (req, res) => {
    const { qr } = req.params;
    try {
        const { data: crate, error: crateError } = await supabase
            .from('crates')
            .select('*')
            .eq('crate_qr', qr)
            .single();

        if (crateError || !crate) {
            return res.json({ success: false, message: 'Crate not found' });
        }

        const { data: contents, error: contentError } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('crate_id', crate.id);

        if (contentError) throw contentError;

        res.json({ success: true, crate, contents });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/crates', async (req, res) => {
    const { tripId, crateQr } = req.body;
    try {
        const { error } = await supabase
            .from('crates')
            .insert([{ crate_qr: crateQr, trip_id: tripId }]);
            
        if (error) throw error;
        res.json({ success: true, message: 'Crate registered' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- INSPECTOR ROUTES ---

app.get('/api/inspector/trips', async (req, res) => {
    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*, vessels(name)')
            .eq('status', 'active')
            .order('departure_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/inspector/trip/:tripId/catch', async (req, res) => {
    const { tripId } = req.params;
    try {
        const { data: logs, error } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('trip_id', tripId)
            .order('timestamp', { ascending: false });

        if (error) throw error;
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/inspector/quality', async (req, res) => {
    const { qrCode, temperature, weight, grade, inspectorId } = req.body;
    
    try {
        const { error } = await supabase
            .from('catch_logs')
            .update({
                temperature: temperature, // Need to add this column to schema if not exists
                weight_kg: weight,
                quality_grade: grade,
                inspected_by: inspectorId, // Need to add this column
                inspected_at: new Date()   // Need to add this column
            })
            .eq('qr_code', qrCode);

        if (error) throw error;
        res.json({ success: true, message: 'Quality data updated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin Stats
app.get('/api/stats', async (req, res) => {
    try {
        const { count: vessels } = await supabase.from('vessels').select('*', { count: 'exact', head: true });
        const { count: trips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('status', 'active');
        const { count: species } = await supabase.from('catch_logs').select('*', { count: 'exact', head: true });
        const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        
        res.json({
            success: true,
            data: {
                vessels: vessels || 0,
                trips: trips || 0,
                species: species || 0,
                users: users || 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Registrations
app.get('/api/registrations/pending', async (req, res) => {
    try {
        const { data: rows, error } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('status', 'pending');
            
        if (error) throw error;
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/registrations/approve', async (req, res) => {
    const data = req.body;
    const id = data.pendingId;
    const pin = data.password;
    try {
        const { data: regs, error: fetchError } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('id', id);

        if (fetchError) throw fetchError;

        if (regs.length > 0) {
            const reg = regs[0];
            const username = reg.owner_name.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000);
            
            const { error: insertError } = await supabase
                .from('users')
                .insert([{
                    username, 
                    password: pin, 
                    role: 'captain', 
                    full_name: reg.owner_name, 
                    vessel_name: reg.vessel_name
                }]);
            
            if (insertError) throw insertError;

            const { error: updateError } = await supabase
                .from('pending_registrations')
                .update({ status: 'approved' })
                .eq('id', id);

            if (updateError) throw updateError;
            
            res.json({ success: true, newUser: { username }, message: 'User approved' });
        } else {
            res.json({ success: false, message: 'Registration not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Vessels
app.get('/api/vessels', async (req, res) => {
    try {
        const { data: rows, error } = await supabase.from('vessels').select('*');
        if (error) throw error;
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/vessels', async (req, res) => {
    const data = req.body;
    try {
        const { error } = await supabase
            .from('pending_registrations')
            .insert([{
                owner_name: data.ownerName,
                vessel_name: data.vesselName,
                contact_info: data.contactInfo,
                status: 'pending'
            }]);
            
        if (error) throw error;
        res.json({ success: true, message: 'Registration submitted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Traceability
app.get('/api/trace/:qr', async (req, res) => {
    const qr = req.params.qr;
    try {
        // Supabase join syntax
        const { data: rows, error } = await supabase
            .from('catch_logs')
            .select(`
                *,
                trips (
                    vessel_name,
                    fishing_method,
                    departure_date
                )
            `)
            .eq('qr_code', qr);
        
        if (error) throw error;
        
        if (rows.length > 0) {
            // Flatten the structure to match frontend expectation
            const row = rows[0];
            const flatData = {
                ...row,
                vessel_name: row.trips?.vessel_name,
                fishing_method: row.trips?.fishing_method,
                departure_date: row.trips?.departure_date,
                latitude: row.gps_lat,
                longitude: row.gps_lng
            };
            res.json({ success: true, data: flatData });
        } else {
            res.json({ success: false, message: 'Catch not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export for Vercel
module.exports = app;

// Only listen if run directly
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
