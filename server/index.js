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

// ==================== REGISTRY SYSTEM ====================
// Generate unique Root ID: REG_XXXXXX (6 digit random)
const generateRootId = async () => {
    let rootId;
    let exists = true;
    
    while (exists) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        rootId = `REG_${randomNum}`;
        
        // Check if exists in registry
        const { data } = await supabase
            .from('registry')
            .select('root_id')
            .eq('root_id', rootId)
            .single();
            
        exists = !!data;
    }
    
    return rootId;
};

// Participant Types
const PARTICIPANT_TYPES = {
    // Human Participants
    VESSEL_OWNER: 'vessel_owner',
    FISHER: 'fisher',
    QUALITY_INSPECTOR: 'quality_inspector',
    CRATE_PACKER: 'crate_packer',
    LOGISTICS_PROVIDER: 'logistics_provider',
    ADMIN: 'admin',
    CAPTAIN: 'captain',
    WORKER: 'worker',
    // Assets
    VESSEL: 'vessel',
    FACILITY: 'facility'
};

// =====================================================
// UNIFIED REGISTRY ENDPOINTS (Fishers + Staff)
// =====================================================

// Get Fishers Registry (from fishers table)
app.get('/api/registry/fishers', async (req, res) => {
    try {
        const { data: fishers, error } = await supabase
            .from('fishers')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform to registry format
        const registryData = (fishers || []).map(f => ({
            id: f.id,
            root_id: f.qr_code || `FISHER-${f.id}`,
            name: f.full_name,
            type: 'fisher',
            contact_number: f.mobile_number,
            address: f.address,
            home_port: f.home_port,
            status: f.status || 'active',
            created_at: f.created_at,
            qr_code: f.qr_code,
            fathers_name: f.fathers_name,
            emergency_contact: f.emergency_contact_number,
            emergency_name: f.emergency_contact_name,
            trip_count: 0 // Will be populated below
        }));
        
        // Get trip counts for each fisher
        for (let fisher of registryData) {
            const { count } = await supabase
                .from('trip_crew')
                .select('*', { count: 'exact', head: true })
                .eq('fisher_id', fisher.id);
            fisher.trip_count = count || 0;
        }
        
        res.json({ success: true, data: registryData });
    } catch (error) {
        console.log('Fishers registry error:', error.message);
        res.json({ success: true, data: [] });
    }
});

// Get Staff Registry (Captains, Workers, etc. from users table)
app.get('/api/registry/staff', async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .neq('role', 'admin') // Exclude admins from this list
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Transform to registry format
        const registryData = (users || []).map(u => ({
            id: u.id,
            root_id: u.root_id || `STAFF-${u.id}`,
            name: u.username,
            type: u.role,
            vessel_name: u.vessel_name,
            status: u.status || 'active',
            created_at: u.created_at
        }));
        
        // Get trip counts for captains
        for (let staff of registryData) {
            if (staff.type === 'captain' && staff.vessel_name) {
                const { count } = await supabase
                    .from('trips')
                    .select('*', { count: 'exact', head: true })
                    .eq('vessel_name', staff.vessel_name);
                staff.trip_count = count || 0;
            }
        }
        
        res.json({ success: true, data: registryData });
    } catch (error) {
        console.log('Staff registry error:', error.message);
        res.json({ success: true, data: [] });
    }
});

// Toggle Fisher status
app.post('/api/registry/fishers/:id/toggle-status', async (req, res) => {
    try {
        console.log('Toggling fisher status for ID:', req.params.id);
        
        // First, get the current fisher record
        const { data: fisher, error: fetchError } = await supabase
            .from('fishers')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError) {
            console.error('Error fetching fisher:', fetchError);
            throw fetchError;
        }

        if (!fisher) {
            return res.status(404).json({ success: false, message: 'Fisher not found' });
        }

        // Check current status (default to 'active' if not set)
        const currentStatus = fisher.status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        console.log('Changing status from', currentStatus, 'to', newStatus);

        // Try to update with status column, if it fails with column not exists, 
        // we need to add it via SQL
        const { error: updateError } = await supabase
            .from('fishers')
            .update({ status: newStatus })
            .eq('id', req.params.id);

        if (updateError) {
            // If status column doesn't exist, provide helpful message
            if (updateError.message && updateError.message.includes('does not exist')) {
                console.error('Status column missing. Please add it to the fishers table.');
                return res.status(500).json({ 
                    success: false, 
                    message: 'Status column missing in database. Please run: ALTER TABLE fishers ADD COLUMN status TEXT DEFAULT \'active\';' 
                });
            }
            throw updateError;
        }
        
        res.json({ success: true, message: `Fisher ${newStatus === 'active' ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Toggle fisher status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle Staff status
app.post('/api/registry/staff/:id/toggle-status', async (req, res) => {
    try {
        console.log('Toggling staff status for ID:', req.params.id);
        
        const { data: user, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (fetchError) {
            console.error('Error fetching staff:', fetchError);
            throw fetchError;
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'Staff not found' });
        }

        const currentStatus = user.status || 'active';
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        console.log('Changing status from', currentStatus, 'to', newStatus);

        const { error: updateError } = await supabase
            .from('users')
            .update({ status: newStatus })
            .eq('id', req.params.id);

        if (updateError) {
            if (updateError.message && updateError.message.includes('does not exist')) {
                console.error('Status column missing. Please add it to the users table.');
                return res.status(500).json({ 
                    success: false, 
                    message: 'Status column missing in database. Please run: ALTER TABLE users ADD COLUMN status TEXT DEFAULT \'active\';' 
                });
            }
            throw updateError;
        }
        
        res.json({ success: true, message: `Staff ${newStatus === 'active' ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Toggle staff status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Combined Registry Statistics
app.get('/api/registry/stats', async (req, res) => {
    try {
        // Get fishers count
        const { count: fishersCount } = await supabase
            .from('fishers')
            .select('*', { count: 'exact', head: true });

        // Get active fishers count
        const { count: activeFishers } = await supabase
            .from('fishers')
            .select('*', { count: 'exact', head: true })
            .or('status.eq.active,status.is.null');

        // Get staff counts by role
        const { data: users } = await supabase
            .from('users')
            .select('role, status')
            .neq('role', 'admin');

        const captains = users?.filter(u => u.role === 'captain') || [];
        const workers = users?.filter(u => u.role === 'worker') || [];

        res.json({
            success: true,
            data: {
                fishers: {
                    total: fishersCount || 0,
                    active: activeFishers || 0
                },
                captains: {
                    total: captains.length,
                    active: captains.filter(c => c.status === 'active' || !c.status).length
                },
                workers: {
                    total: workers.length,
                    active: workers.filter(w => w.status === 'active' || !w.status).length
                },
                total: (fishersCount || 0) + (users?.length || 0)
            }
        });
    } catch (error) {
        console.log('Registry stats error:', error.message);
        res.json({ 
            success: true, 
            data: { fishers: { total: 0, active: 0 }, captains: { total: 0, active: 0 }, workers: { total: 0, active: 0 }, total: 0 } 
        });
    }
});

// Original registry endpoints (for backward compatibility)
// Get all Registry entries
app.get('/api/registry', async (req, res) => {
    try {
        const { data: registry, error } = await supabase
            .from('registry')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data: registry || [] });
    } catch (error) {
        // If table doesn't exist, return empty array (graceful fallback)
        console.log('Registry fetch info:', error.message);
        res.json({ success: true, data: [] });
    }
});

// Get Registry entry by Root ID
app.get('/api/registry/:rootId', async (req, res) => {
    try {
        const { data: entry, error } = await supabase
            .from('registry')
            .select('*')
            .eq('root_id', req.params.rootId)
            .single();

        if (error) throw error;
        res.json({ success: true, data: entry });
    } catch (error) {
        res.status(404).json({ success: false, message: 'Registry entry not found' });
    }
});

// Create Registry entry
app.post('/api/registry', async (req, res) => {
    const { name, type, email, contact_number, address, metadata, linked_user_id, linked_vessel_id } = req.body;
    
    try {
        const rootId = await generateRootId();
        
        const { data: entry, error } = await supabase
            .from('registry')
            .insert([{
                root_id: rootId,
                name: name,
                type: type,
                email: email,
                contact_number: contact_number,
                address: address,
                metadata: metadata || {},
                status: 'active',
                linked_user_id: linked_user_id,
                linked_vessel_id: linked_vessel_id,
                created_at: new Date().toISOString()
            }])
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: entry, message: 'Registry entry created' });
    } catch (error) {
        console.error('Registry creation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update Registry entry
app.put('/api/registry/:rootId', async (req, res) => {
    const { name, type, email, contact_number, address, metadata, status } = req.body;
    
    try {
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (type !== undefined) updateData.type = type;
        if (email !== undefined) updateData.email = email;
        if (contact_number !== undefined) updateData.contact_number = contact_number;
        if (address !== undefined) updateData.address = address;
        if (metadata !== undefined) updateData.metadata = metadata;
        if (status !== undefined) updateData.status = status;
        updateData.updated_at = new Date().toISOString();

        const { data: entry, error } = await supabase
            .from('registry')
            .update(updateData)
            .eq('root_id', req.params.rootId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: entry, message: 'Registry entry updated' });
    } catch (error) {
        console.error('Registry update error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Toggle Registry entry status (enable/disable)
app.post('/api/registry/:rootId/toggle-status', async (req, res) => {
    try {
        // Get current status
        const { data: current, error: fetchError } = await supabase
            .from('registry')
            .select('status')
            .eq('root_id', req.params.rootId)
            .single();

        if (fetchError) throw fetchError;

        const newStatus = current.status === 'active' ? 'inactive' : 'active';

        const { data: entry, error } = await supabase
            .from('registry')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('root_id', req.params.rootId)
            .select()
            .single();

        if (error) throw error;
        res.json({ success: true, data: entry, message: `Participant ${newStatus === 'active' ? 'enabled' : 'disabled'}` });
    } catch (error) {
        console.error('Registry toggle error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Registry statistics
app.get('/api/registry/stats/summary', async (req, res) => {
    try {
        const { data: registry, error } = await supabase
            .from('registry')
            .select('type, status');

        if (error) throw error;

        const stats = {
            total: registry?.length || 0,
            active: registry?.filter(r => r.status === 'active').length || 0,
            inactive: registry?.filter(r => r.status === 'inactive').length || 0,
            byType: {}
        };

        // Count by type
        (registry || []).forEach(r => {
            if (!stats.byType[r.type]) stats.byType[r.type] = 0;
            stats.byType[r.type]++;
        });

        res.json({ success: true, data: stats });
    } catch (error) {
        res.json({ success: true, data: { total: 0, active: 0, inactive: 0, byType: {} } });
    }
});

// Verify Registry access (for login security)
app.post('/api/registry/verify-access', async (req, res) => {
    const { userId, rootId } = req.body;
    
    try {
        let query = supabase.from('registry').select('*');
        
        if (rootId) {
            query = query.eq('root_id', rootId);
        } else if (userId) {
            query = query.eq('linked_user_id', userId);
        } else {
            return res.json({ success: false, hasAccess: false, message: 'No identifier provided' });
        }
        
        const { data: entry, error } = await query.single();

        if (error || !entry) {
            return res.json({ success: true, hasAccess: false, message: 'Not found in registry' });
        }

        const hasAccess = entry.status === 'active';
        res.json({ 
            success: true, 
            hasAccess: hasAccess, 
            registryEntry: entry,
            message: hasAccess ? 'Access granted' : 'Participant is disabled in registry'
        });
    } catch (error) {
        console.error('Registry verify error:', error);
        res.json({ success: true, hasAccess: true, message: 'Registry check skipped (table may not exist)' });
    }
});

// ==================== END REGISTRY SYSTEM ====================

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
            
            // Check if user status is inactive (disabled in registry)
            if (user.status === 'inactive') {
                return res.json({ 
                    success: false, 
                    message: 'Access denied. Your account has been disabled by the administrator.' 
                });
            }
            
            res.json({ 
                success: true, 
                user: { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    vesselName: user.vessel_name, 
                    vessel_id: user.id, 
                    owner_id: user.id,
                    root_id: user.root_id // Include root_id if exists
                } 
            });
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

// Reject Registration
app.post('/api/admin/reject-registration', async (req, res) => {
    const { pendingId } = req.body;
    try {
        const { error } = await supabase
            .from('pending_registrations')
            .update({ status: 'rejected' })
            .eq('id', pendingId);

        if (error) throw error;
        res.json({ success: true, message: 'Registration rejected' });
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
                status: status,
                captain_id: data.captainId || null // Store captain's user ID for trip lookup
            }])
            .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        const newTripId = result[0].id;

        // Handle Crew List - Resolve QR codes to fisher IDs
        if (data.crewIds && Array.isArray(data.crewIds) && data.crewIds.length > 0) {
            const resolvedFisherIds = [];
            
            for (const crewId of data.crewIds) {
                // Check if it's a QR code (contains FISHER or dashes) or a numeric ID
                if (crewId.toString().includes('FISHER') || crewId.toString().includes('-')) {
                    // It's a QR code - resolve to actual fisher ID
                    const { data: fisher } = await supabase
                        .from('fishers')
                        .select('id')
                        .eq('qr_code', crewId)
                        .single();
                    
                    if (fisher) {
                        resolvedFisherIds.push(fisher.id);
                    } else {
                        console.log(`Could not resolve QR code: ${crewId}`);
                    }
                } else {
                    // It's already a numeric ID
                    resolvedFisherIds.push(parseInt(crewId));
                }
            }
            
            if (resolvedFisherIds.length > 0) {
                const crewInserts = resolvedFisherIds.map(fisherId => ({
                    trip_id: newTripId,
                    fisher_id: fisherId
                }));
                
                const { error: crewError } = await supabase
                    .from('trip_crew')
                    .insert(crewInserts);
                    
                if (crewError) console.error("Error adding crew to trip:", crewError);
            }
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
    const { vessel, userId } = req.query;
    
    try {
        let query = supabase
            .from('trips')
            .select('*')
            .order('id', { ascending: false });
        
        // If vessel name is provided, filter by it
        if (vessel && vessel !== 'undefined' && vessel !== 'null' && vessel !== '') {
            query = query.eq('vessel_name', vessel);
        } else if (userId && userId !== 'undefined' && userId !== 'null') {
            // Fallback: Find by captain's user ID if stored
            query = query.eq('captain_id', userId);
        }
        
        const { data: trips, error } = await query;
        
        if (error) throw error;
        
        // Include crew count for each trip
        const tripsWithCrew = await Promise.all(trips.map(async (trip) => {
            const { count } = await supabase
                .from('trip_crew')
                .select('*', { count: 'exact', head: true })
                .eq('trip_id', trip.id);
            return { ...trip, crew_count: count || 0 };
        }));
        
        return res.json({ success: true, trips: tripsWithCrew });
    } catch (error) {
        console.error('Captain trips error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
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
        
        // Ensure images is always an array
        const parsedLogs = logs.map(log => ({
            ...log,
            images: Array.isArray(log.images) ? log.images : 
                    (typeof log.images === 'string' ? JSON.parse(log.images || '[]') : [])
        }));
        
        res.json({ success: true, logs: parsedLogs });
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

            // Update weight if provided (allow 0, only skip if undefined/null/empty string)
            if (data.weight !== undefined && data.weight !== null && data.weight !== '') {
                updatePayload.weight_kg = parseFloat(data.weight) || 0;
            }
            
            console.log("Update payload:", updatePayload); // Debug log

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

        // Check if fisher status is inactive (disabled in registry)
        if (fisher.status === 'inactive') {
            return res.json({ 
                success: false, 
                message: 'Access denied. Your account has been disabled by the administrator.' 
            });
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

// Get fisher trips - support both numeric ID and QR code
app.get('/api/fishers/:id/trips', async (req, res) => {
    const { id } = req.params;
    try {
        let fisherId = id;
        
        // If ID looks like a QR code (contains 'FISHER'), resolve to actual ID
        if (id.includes('FISHER') || id.includes('-')) {
            const { data: fisher } = await supabase
                .from('fishers')
                .select('id')
                .eq('qr_code', id)
                .single();
            if (fisher) fisherId = fisher.id;
        }

        const { data: trips, error } = await supabase
            .from('trip_crew')
            .select(`
                joined_at,
                trips (
                    id,
                    trip_code,
                    vessel_name,
                    departure_date,
                    status,
                    departure_port,
                    fishing_method
                )
            `)
            .eq('fisher_id', fisherId)
            .order('joined_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips: trips.map(t => ({ ...t.trips, joined_at: t.joined_at })) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get fisher by QR Code (for crew scanning)
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

// Resolve Fisher QR to ID (for crew assignment)
app.post('/api/fishers/resolve-qr', async (req, res) => {
    const { qrCode } = req.body;
    try {
        const { data: fisher, error } = await supabase
            .from('fishers')
            .select('id, full_name, mobile_number, qr_code')
            .eq('qr_code', qrCode)
            .single();

        if (error || !fisher) {
            return res.json({ success: false, message: 'Fisher not found' });
        }
        res.json({ success: true, fisher });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get trip crew members
app.get('/api/trips/:tripId/crew', async (req, res) => {
    const { tripId } = req.params;
    try {
        const { data: crew, error } = await supabase
            .from('trip_crew')
            .select(`
                fisher_id,
                joined_at,
                fishers (
                    id,
                    full_name,
                    mobile_number,
                    qr_code,
                    home_port
                )
            `)
            .eq('trip_id', tripId);

        if (error) throw error;
        
        const crewList = crew.map(c => ({
            id: c.fisher_id,
            name: c.fishers?.full_name || 'Unknown',
            mobile: c.fishers?.mobile_number,
            qrCode: c.fishers?.qr_code,
            homePort: c.fishers?.home_port,
            joinedAt: c.joined_at
        }));
        
        res.json({ success: true, crew: crewList });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
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
    // Accept both 'fishQrs' (from frontend) and 'fishQrCodes' for compatibility
    const { tripId, fishQrs, fishQrCodes } = req.body;
    const qrCodes = fishQrs || fishQrCodes;
    
    if (!qrCodes || qrCodes.length === 0) {
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
            .in('qr_code', qrCodes);
            
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
            .in('qr_code', qrCodes);

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

// Update Vessel (Admin)
app.put('/api/vessels/:id', async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    try {
        // Only include fields that exist in the database schema
        const updateData = {};
        
        // Core vessel fields (most likely to exist)
        if (data.vessel_name !== undefined) updateData.vessel_name = data.vessel_name;
        if (data.registration_number !== undefined) updateData.registration_number = data.registration_number;
        if (data.home_port !== undefined) updateData.home_port = data.home_port;
        if (data.vessel_type !== undefined) updateData.vessel_type = data.vessel_type;
        if (data.owner_name !== undefined) updateData.owner_name = data.owner_name;
        if (data.contact_number !== undefined) updateData.contact_number = data.contact_number;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.address !== undefined) updateData.address = data.address;
        if (data.license_number !== undefined) updateData.license_number = data.license_number;
        
        // Optional fields (may or may not exist in DB)
        if (data.engine_power !== undefined) updateData.engine_power = data.engine_power;
        if (data.storage_capacity !== undefined) updateData.storage_capacity = data.storage_capacity;
        if (data.crew_capacity !== undefined) updateData.crew_capacity = data.crew_capacity;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        const { data: result, error } = await supabase
            .from('vessels')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) {
            // If column doesn't exist error, try with minimal fields
            if (error.code === 'PGRST204') {
                console.log('Column not found, trying minimal update...');
                const minimalData = {
                    vessel_name: data.vessel_name,
                    registration_number: data.registration_number,
                    home_port: data.home_port,
                    owner_name: data.owner_name,
                    contact_number: data.contact_number
                };
                
                Object.keys(minimalData).forEach(key => {
                    if (minimalData[key] === undefined) delete minimalData[key];
                });
                
                const { data: minResult, error: minError } = await supabase
                    .from('vessels')
                    .update(minimalData)
                    .eq('id', id)
                    .select();
                    
                if (minError) throw minError;
                return res.json({ success: true, message: 'Vessel updated successfully', data: minResult[0] });
            }
            throw error;
        }
        
        res.json({ success: true, message: 'Vessel updated successfully', data: result[0] });
    } catch (error) {
        console.error('Vessel update error:', error);
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
