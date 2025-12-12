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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date(),
        env: {
            hasUrl: !!process.env.SUPABASE_URL,
            hasKey: !!process.env.SUPABASE_KEY
        }
    });
});

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

// Get Pending Registrations (Admin)
app.get('/api/admin/pending-registrations', async (req, res) => {
    try {
        const { data: pending, error } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: pending });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve Registration
app.post('/api/admin/approve-registration', async (req, res) => {
    const { pendingId, password, adminId } = req.body;
    
    try {
        // 1. Get pending registration
        const { data: pending, error: fetchError } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('id', pendingId)
            .single();
            
        if (fetchError || !pending) throw new Error('Registration not found');

        // 2. Create User
        // Generate username from owner name (simplified)
        const username = pending.owner_name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
        
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([{
                username: username,
                password: password, // In real app, hash this!
                role: 'captain', // Default to captain/owner
                full_name: pending.owner_name,
                vessel_name: pending.vessel_name
            }])
            .select()
            .single();
            
        if (userError) throw userError;

        // 3. Create Vessel
        const { data: newVessel, error: vesselError } = await supabase
            .from('vessels')
            .insert([{
                name: pending.vessel_name,
                owner_name: pending.owner_name,
                registration_number: 'REG-' + Math.floor(10000 + Math.random() * 90000),
                status: 'active'
            }])
            .select()
            .single();

        if (vesselError) {
            console.error('Vessel creation failed', vesselError);
        } else {
            // Update user with vessel_id
            await supabase.from('users').update({ vessel_id: newVessel.id, owner_id: newUser.id }).eq('id', newUser.id);
        }

        // 4. Update Pending Status
        await supabase
            .from('pending_registrations')
            .update({ status: 'approved' })
            .eq('id', pendingId);

        res.json({ success: true, newUser: newUser });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Trips
app.post('/api/trips', async (req, res) => {
    const data = req.body;
    console.log("Received trip data:", data); // Debug log

    try {
        // Determine status and code
        // If it's a new request, it's pending and has a temporary code
        // NOTE: We use 'active' status because some DBs have a constraint checking for 'active'/'completed' only.
        // We distinguish pending trips by their 'REQ-' code prefix.
        const status = 'active'; 
        const tempCode = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tripCode = data.tripCode || tempCode;

        // Upload images if present
        // Use a safe path that doesn't depend on the final trip code if it's not generated yet
        const imagePathPrefix = `trips/${tripCode}`;
        const vesselImageUrl = data.vesselImage ? await uploadImage(data.vesselImage, 'catch-images', `${imagePathPrefix}/vessel.jpg`) : null;
        const gearImageUrl = data.gearImage ? await uploadImage(data.gearImage, 'catch-images', `${imagePathPrefix}/gear.jpg`) : null;

        // Helper to clean numeric inputs
        const toNum = (val) => (val === '' || val === null || val === undefined) ? null : parseFloat(val);
        // Helper to clean date inputs
        const toDate = (val) => (val === '' || val === null || val === undefined) ? null : val;

        const { data: result, error } = await supabase
            .from('trips')
            .insert([{
                trip_code: tripCode,
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
                status: status
            }])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        const newTripId = result[0].id;

        // Handle Crew List (New Feature)
        if (data.crewIds && Array.isArray(data.crewIds) && data.crewIds.length > 0) {
            const crewInserts = data.crewIds.map(fisherId => ({
                trip_id: newTripId,
                fisher_id: fisherId
            }));
            
            const { error: crewError } = await supabase
                .from('trip_crew')
                .insert(crewInserts);
                
            if (crewError) console.error("Error adding crew to trip:", crewError);
        }
        
        res.json({ success: true, tripId: newTripId, message: 'Trip request submitted for verification' });
    } catch (error) {
        console.error("Trip Creation Error:", error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    }
});

// Update Trip Expenses (Post-Approval)
app.post('/api/trips/expenses', async (req, res) => {
    const { tripId, fuelLiters, fuelPrice, iceKg, icePrice, foodBudget, otherExpenses, totalExpenses } = req.body;
    
    try {
        const toNum = (val) => (val === '' || val === null || val === undefined) ? 0 : parseFloat(val);

        const { data, error } = await supabase
            .from('trips')
            .update({
                fuel_liters: toNum(fuelLiters),
                fuel_price: toNum(fuelPrice),
                ice_kg: toNum(iceKg),
                ice_price: toNum(icePrice),
                food_budget: toNum(foodBudget),
                other_expenses: toNum(otherExpenses),
                total_expenses: toNum(totalExpenses)
            })
            .eq('id', tripId)
            .select();

        if (error) throw error;
        
        res.json({ success: true, message: 'Trip expenses updated successfully' });
    } catch (error) {
        console.error("Expense Update Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Pending Trips (Worker)
app.get('/api/trips/pending', async (req, res) => {
    try {
        // Fetch trips that are either 'pending' OR 'active' but have a temporary code (REQ-...)
        // This handles both DB schema versions (strict vs flexible status)
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*')
            .or('status.eq.pending,and(status.eq.active,trip_code.ilike.REQ-%)')
            .order('id', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve Trip (Worker)
app.post('/api/trips/approve', async (req, res) => {
    const { tripId } = req.body;
    try {
        // Generate official Trip Code
        // Format: TRIP_YYYYMMDD_RANDOM
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
        const random = Math.floor(100000 + Math.random() * 900000);
        const tripCode = `TRIP_${dateStr}_${random}`;

        const { data, error } = await supabase
            .from('trips')
            .update({ 
                status: 'active',
                trip_code: tripCode
            })
            .eq('id', tripId)
            .select();

        if (error) throw error;
        res.json({ success: true, tripCode, message: 'Trip approved and active.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Captain's Trips
app.get('/api/trips/captain', async (req, res) => {
    const { vessel } = req.query;
    
    // If vessel name is provided, use it
    if (vessel && vessel !== 'undefined' && vessel !== 'null') {
        try {
            const { data: trips, error } = await supabase
                .from('trips')
                .select('*')
                .eq('vessel_name', vessel)
                .order('id', { ascending: false });

            if (error) throw error;
            return res.json({ success: true, trips });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }
    
    // Fallback: If no vessel name, return empty list or try to find by user ID if we had auth middleware
    // For now, just return empty to prevent crash
    return res.json({ success: true, trips: [] });
});

app.get('/api/trips/active', async (req, res) => {
    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*')
            .eq('status', 'active')
            .not('trip_code', 'ilike', 'REQ-%') // Exclude pending requests
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

// Fisher Auth & Management
app.post('/api/auth/fisher/login', async (req, res) => {
    const { mobile } = req.body;
    try {
        // Check if fisher exists
        const { data: fisher, error } = await supabase
            .from('fishers')
            .select('*')
            .eq('mobile_number', mobile)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

        if (!fisher) {
            // New user, needs registration
            return res.json({ success: true, isNewUser: true, message: 'User not found, please register' });
        }

        // Existing user, return profile
        // In a real app, we would send OTP here. For now, we mock success.
        return res.json({ 
            success: true, 
            isNewUser: false, 
            user: { ...fisher, role: 'fisher' },
            token: 'mock-jwt-token-fisher' 
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/fishers', async (req, res) => {
    const data = req.body;
    try {
        // Generate Profile QR: FISHER-MOBILE-RANDOM
        const qrCode = `FISHER-${data.mobile}-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const { data: newFisher, error } = await supabase
            .from('fishers')
            .insert([{
                full_name: data.fullName,
                fathers_name: data.fathersName,
                mobile_number: data.mobile,
                home_port: data.homePort,
                address: data.address,
                emergency_contact_name: data.emergencyName,
                emergency_contact_number: data.emergencyNumber,
                qr_code: qrCode
            }])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, user: { ...newFisher, role: 'fisher' }, message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/fishers/:id/trips', async (req, res) => {
    const { id } = req.params;
    try {
        const { data: trips, error } = await supabase
            .from('trip_crew')
            .select(`
                joined_at,
                trips (
                    trip_code,
                    vessel_name,
                    departure_date,
                    status
                )
            `)
            .eq('fisher_id', id)
            .order('joined_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips: trips.map(t => ({ ...t.trips, joined_at: t.joined_at })) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/fishers/qr/:qrCode', async (req, res) => {
    const { qrCode } = req.params;
    try {
        const { data: fisher, error } = await supabase
            .from('fishers')
            .select('*')
            .eq('qr_code', qrCode)
            .single();

        if (error) throw error;
        res.json({ success: true, fisher });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Fisher not found' });
    }
});

app.get('/api/admin/fishers', async (req, res) => {
    try {
        const { data: fishers, error } = await supabase
            .from('fishers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, fishers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
