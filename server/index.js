const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { supabase, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'blueos-secret-key-change-in-production-2024';
const JWT_EXPIRY = '7d'; // Token expires in 7 days

// In-memory session store (for multi-device support)
// NOTE: This only works for local development. On Vercel/serverless, sessions 
// are validated via JWT only since each invocation is stateless.
const activeSessions = new Map();

// Detect if running in serverless environment (Vercel)
const IS_SERVERLESS = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Generate JWT Token
const generateToken = (user, sessionId) => {
    return jwt.sign(
        { 
            userId: user.id, 
            username: user.username,
            role: user.role,
            sessionId: sessionId,
            iat: Date.now()
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
    );
};

// Verify JWT Token Middleware
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Allow unauthenticated access for public endpoints
        req.user = null;
        return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // In serverless mode, skip in-memory session check (stateless)
        // Just trust the JWT if it's valid and not expired
        if (IS_SERVERLESS) {
            req.user = decoded;
            req.sessionId = decoded.sessionId;
        } else {
            // Local mode: Check if session is still valid in memory
            const userSessions = activeSessions.get(decoded.userId);
            if (userSessions && userSessions.has(decoded.sessionId)) {
                req.user = decoded;
                req.sessionId = decoded.sessionId;
            } else {
                req.user = null; // Session was invalidated
            }
        }
        
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

// Apply token verification to all routes
app.use(verifyToken);

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
        // Check both numeric ID and QR code since trip_crew may have either format
        for (let fisher of registryData) {
            // Count trips by numeric ID (as string for text column)
            const { count: countById } = await supabase
                .from('trip_crew')
                .select('*', { count: 'exact', head: true })
                .eq('fisher_id', fisher.id.toString());
            
            // Count trips by QR code
            const { count: countByQR } = await supabase
                .from('trip_crew')
                .select('*', { count: 'exact', head: true })
                .eq('fisher_id', fisher.qr_code);
            
            // Total trips = by ID + by QR
            fisher.trip_count = (countById || 0) + (countByQR || 0);
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
            username: u.username,
            role: u.role,
            type: u.role,
            vessel_name: u.vessel_name,
            status: u.status || 'active',
            created_at: u.created_at,
            trip_count: 0
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
// For worker types (captain, worker, quality_inspector, admin), insert into users table
// For fishers, insert into fishers table
// For vessels/facilities, insert into registry table (or vessels table)
app.post('/api/registry', async (req, res) => {
    const { name, type, email, contact_number, address, metadata, linked_user_id, linked_vessel_id } = req.body;
    
    console.log('Creating participant:', { name, type, email, contact_number, address });
    
    try {
        const rootId = await generateRootId();
        
        // Staff types that go into users table
        const staffTypes = ['captain', 'worker', 'quality_inspector', 'admin', 'inspector', 'crate_packer', 'logistics_provider'];
        
        // Valid roles in the database (must match CHECK constraint)
        // If 'inspector' is not in constraint, we fallback to 'worker'
        const validRoles = ['admin', 'captain', 'worker', 'public', 'inspector'];
        
        if (staffTypes.includes(type)) {
            // Insert into users table for staff
            // Map type to role for DB consistency
            let role = type;
            if (type === 'quality_inspector') role = 'inspector';
            if (type === 'crate_packer' || type === 'logistics_provider') role = 'worker';
            
            // Fallback: if role is not in valid roles, use 'worker'
            if (!validRoles.includes(role)) {
                console.log(`Role "${role}" not in valid roles, falling back to "worker"`);
                role = 'worker';
            }
            
            // Generate a username from name
            const username = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '_' + Date.now().toString(36).slice(-4);
            const defaultPassword = 'fish123'; // Default password, should be changed
            
            // Build insert object with only existing columns
            const insertData = {
                username: username,
                password: defaultPassword,
                role: role,
                full_name: name,
                created_at: new Date().toISOString()
            };
            
            // Try to insert with all fields first
            let user, error;
            try {
                const result = await supabase
                    .from('users')
                    .insert([{
                        ...insertData,
                        email: email || null,
                        contact_number: contact_number || null,
                        address: address || null,
                        status: 'active',
                        participant_type: type
                    }])
                    .select()
                    .single();
                user = result.data;
                error = result.error;
                
                // If role constraint fails, retry with 'worker' role
                if (error && error.message && error.message.includes('users_role_check')) {
                    console.log('Role constraint failed, retrying with worker role');
                    insertData.role = 'worker';
                    const retryResult = await supabase
                        .from('users')
                        .insert([{
                            ...insertData,
                            email: email || null,
                            contact_number: contact_number || null,
                            address: address || null,
                            status: 'active',
                            participant_type: type
                        }])
                        .select()
                        .single();
                    user = retryResult.data;
                    error = retryResult.error;
                }
                
                // If columns don't exist, try with basic fields only
                if (error && error.message && error.message.includes('does not exist')) {
                    console.log('Extended columns not found, using basic insert');
                    const basicResult = await supabase
                        .from('users')
                        .insert([insertData])
                        .select()
                        .single();
                    user = basicResult.data;
                    error = basicResult.error;
                }
            } catch (insertError) {
                console.error('Insert error:', insertError);
                error = insertError;
            }

            if (error) {
                console.error('User insert error:', error);
                throw error;
            }
            
            console.log('User created:', user);
            
            // Return with root_id format for consistency
            res.json({ 
                success: true, 
                data: { 
                    ...user, 
                    root_id: rootId,
                    type: type,
                    contact_number: contact_number,
                    email: email,
                    address: address
                }, 
                message: `${type.replace(/_/g, ' ')} added successfully. Username: ${username}, Password: ${defaultPassword}` 
            });
            
        } else if (type === 'fisher') {
            // Insert into fishers table
            const insertData = {
                full_name: name,
                mobile_number: contact_number || `temp_${Date.now()}`,
                home_port: address || '',
                address: address || '',
                created_at: new Date().toISOString()
            };
            
            // Try with status field first
            let fisher, error;
            try {
                const result = await supabase
                    .from('fishers')
                    .insert([{
                        ...insertData,
                        status: 'active',
                        email: email || null
                    }])
                    .select()
                    .single();
                fisher = result.data;
                error = result.error;
                
                // If columns don't exist, try with basic fields only
                if (error && error.message && error.message.includes('does not exist')) {
                    console.log('Extended columns not found in fishers, using basic insert');
                    const basicResult = await supabase
                        .from('fishers')
                        .insert([insertData])
                        .select()
                        .single();
                    fisher = basicResult.data;
                    error = basicResult.error;
                }
            } catch (insertError) {
                console.error('Fisher insert error:', insertError);
                error = insertError;
            }

            if (error) {
                console.error('Fisher insert error:', error);
                throw error;
            }
            
            console.log('Fisher created:', fisher);
            
            res.json({ 
                success: true, 
                data: { ...fisher, root_id: rootId, type: type }, 
                message: 'Fisher added successfully' 
            });
            
        } else if (type === 'vessel') {
            // Insert into vessels table
            const { data: vessel, error } = await supabase
                .from('vessels')
                .insert([{
                    name: name,
                    registration_number: `VES_${Date.now().toString(36).toUpperCase()}`,
                    owner_name: address || 'Unknown',
                    status: 'active'
                }])
                .select()
                .single();

            if (error) {
                console.error('Vessel insert error:', error);
                throw error;
            }
            
            console.log('Vessel created:', vessel);
            
            res.json({ 
                success: true, 
                data: { ...vessel, root_id: rootId, type: type }, 
                message: 'Vessel added successfully' 
            });
            
        } else if (type === 'vessel_owner') {
            // Vessel owners go into users table with special role
            const username = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') + '_' + Date.now().toString(36).slice(-4);
            const defaultPassword = 'fish123';
            
            const insertData = {
                username: username,
                password: defaultPassword,
                role: 'captain', // Vessel owners can act as captains
                full_name: name,
                created_at: new Date().toISOString()
            };
            
            let user, error;
            try {
                const result = await supabase
                    .from('users')
                    .insert([{
                        ...insertData,
                        email: email || null,
                        contact_number: contact_number || null,
                        address: address || null,
                        status: 'active',
                        participant_type: 'vessel_owner'
                    }])
                    .select()
                    .single();
                user = result.data;
                error = result.error;
                
                if (error && error.message && error.message.includes('does not exist')) {
                    const basicResult = await supabase
                        .from('users')
                        .insert([insertData])
                        .select()
                        .single();
                    user = basicResult.data;
                    error = basicResult.error;
                }
            } catch (insertError) {
                error = insertError;
            }

            if (error) throw error;
            
            res.json({ 
                success: true, 
                data: { ...user, root_id: rootId, type: type }, 
                message: `Vessel Owner added. Username: ${username}, Password: ${defaultPassword}` 
            });
            
        } else {
            // For facility and other unknown types, try registry table first
            // If registry doesn't exist, create a generic entry response
            try {
                const { data: entry, error } = await supabase
                    .from('registry')
                    .insert([{
                        root_id: rootId,
                        name: name,
                        type: type,
                        email: email || null,
                        contact_number: contact_number || null,
                        address: address || null,
                        metadata: metadata || {},
                        status: 'active',
                        linked_user_id: linked_user_id,
                        linked_vessel_id: linked_vessel_id,
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (error) throw error;
                
                console.log('Registry entry created:', entry);
                res.json({ success: true, data: entry, message: 'Registry entry created' });
                
            } catch (regError) {
                // If registry table doesn't exist, return a mock success
                // The data won't be persisted but the UI won't break
                console.warn('Registry table not available, returning mock response');
                res.json({ 
                    success: true, 
                    data: { 
                        id: Date.now(),
                        root_id: rootId,
                        name: name,
                        type: type,
                        email: email,
                        contact_number: contact_number,
                        address: address,
                        status: 'active'
                    }, 
                    message: `${type} added (Note: Run ADD_USER_FIELDS.sql to enable full registry support)` 
                });
            }
        }
    } catch (error) {
        console.error('Registry creation error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to add participant' });
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

// ==================== STORAGE BUCKET CONFIGURATION ====================
const STORAGE_BUCKETS = {
    VESSEL_IMAGES: 'vessel-images',      // Vessel photos during trip registration
    GEAR_IMAGES: 'gear-images',          // Fishing gear photos
    CATCH_IMAGES: 'catch-images',        // Fish/species photos during catch logging
    QR_CODES: 'qr-codes',                // Generated QR code images (including crate QRs)
    FISHER_PHOTOS: 'fisher-photos'       // Fisher profile/ID photos
};

// Initialize storage buckets on server start
async function initializeStorageBuckets() {
    console.log('Initializing storage buckets...');
    
    for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
        try {
            // First check if bucket is accessible by trying to list files
            const { data: files, error: listError } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 1 });
            
            if (!listError) {
                // Bucket exists and is accessible
                console.log(`  ✓ Bucket "${bucketName}" ready`);
                continue;
            }
            
            // Try to create bucket if not accessible
            const { error } = await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760 // 10MB limit
            });
            
            if (error) {
                if (error.message.includes('already exists')) {
                    console.log(`  ✓ Bucket "${bucketName}" exists`);
                } else if (error.message.includes('policy') || error.message.includes('denied')) {
                    console.log(`  ⚠ Bucket "${bucketName}" - check Supabase Dashboard`);
                } else {
                    console.log(`  ⚠ Bucket "${bucketName}": ${error.message}`);
                }
            } else {
                console.log(`  ✓ Bucket "${bucketName}" created`);
            }
        } catch (err) {
            console.log(`  ✗ Bucket "${bucketName}" error: ${err.message}`);
        }
    }
    console.log('Storage bucket initialization complete.');
}

async function uploadImage(base64Data, bucketName, path) {
    if (!base64Data) {
        console.log('uploadImage: No base64Data provided');
        return null;
    }
    try {
        // Remove header if present (e.g., "data:image/jpeg;base64,")
        const base64 = base64Data.split(',')[1] || base64Data;
        const buffer = Buffer.from(base64, 'base64');
        
        // Determine content type from data URL or default to jpeg
        let contentType = 'image/jpeg';
        if (base64Data.includes('data:image/png')) {
            contentType = 'image/png';
        } else if (base64Data.includes('data:image/webp')) {
            contentType = 'image/webp';
        }
        
        console.log(`uploadImage: Uploading to bucket "${bucketName}", path "${path}", size: ${buffer.length} bytes`);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(path, buffer, {
                contentType: contentType,
                upsert: true
            });
            
        if (error) {
            console.error('Supabase storage upload error:', error);
            console.error('Bucket:', bucketName, 'Path:', path);
            // Check if bucket doesn't exist
            if (error.message && error.message.includes('not found')) {
                console.error(`BUCKET NOT FOUND: Please create the "${bucketName}" bucket in Supabase Storage`);
            }
            return null;
        }
        
        console.log('Upload successful:', data.path);
        
        const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(path);
        
        console.log('Public URL:', publicUrlData.publicUrl);
            
        return publicUrlData.publicUrl;
    } catch (err) {
        console.error('Image upload exception:', err);
        return null;
    }
}

// ==================== END STORAGE CONFIGURATION ====================

// --- STORAGE DIAGNOSTICS ---

// List all storage buckets
app.get('/api/storage/buckets', async (req, res) => {
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.error('Error listing buckets:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message,
                hint: 'Make sure your Supabase service_role key is being used, not the anon key'
            });
        }
        
        console.log('Available buckets:', buckets);
        res.json({ 
            success: true, 
            buckets: buckets || [],
            count: buckets?.length || 0
        });
    } catch (err) {
        console.error('Bucket list exception:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// List files in a bucket
app.get('/api/storage/files/:bucketName', async (req, res) => {
    const { bucketName } = req.params;
    const { path = '' } = req.query;
    
    try {
        const { data: files, error } = await supabase.storage
            .from(bucketName)
            .list(path, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
        
        if (error) {
            console.error(`Error listing files in ${bucketName}:`, error);
            return res.status(500).json({ 
                success: false, 
                message: error.message,
                bucketName 
            });
        }
        
        res.json({ 
            success: true, 
            bucketName,
            path,
            files: files || [],
            count: files?.length || 0
        });
    } catch (err) {
        console.error('File list exception:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Test upload to a bucket
app.post('/api/storage/test-upload', async (req, res) => {
    const bucketName = 'catch-images';
    const testPath = `test/test_${Date.now()}.txt`;
    const testContent = `Test upload at ${new Date().toISOString()}`;
    
    try {
        console.log(`Testing upload to bucket "${bucketName}" at path "${testPath}"`);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(testPath, Buffer.from(testContent), {
                contentType: 'text/plain',
                upsert: true
            });
        
        if (error) {
            console.error('Test upload error:', error);
            return res.json({ 
                success: false, 
                message: error.message,
                errorDetails: error,
                hint: error.message.includes('not found') 
                    ? 'Bucket "catch-images" does not exist. Please create it in Supabase Dashboard > Storage'
                    : error.message.includes('policy') || error.message.includes('denied')
                        ? 'Permission denied. Check bucket policies or use service_role key'
                        : 'Unknown error'
            });
        }
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(testPath);
        
        console.log('Test upload successful:', data);
        res.json({ 
            success: true, 
            message: 'Test upload successful!',
            uploadedPath: data.path,
            publicUrl: urlData.publicUrl
        });
    } catch (err) {
        console.error('Test upload exception:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create the catch-images bucket if it doesn't exist
app.post('/api/storage/create-bucket', async (req, res) => {
    const bucketName = 'catch-images';
    
    try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const exists = buckets?.some(b => b.name === bucketName);
        
        if (exists) {
            return res.json({ 
                success: true, 
                message: `Bucket "${bucketName}" already exists`,
                exists: true
            });
        }
        
        // Create bucket
        const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 10485760 // 10MB limit
        });
        
        if (error) {
            console.error('Create bucket error:', error);
            return res.status(500).json({ 
                success: false, 
                message: error.message,
                hint: 'You may need to create the bucket manually in Supabase Dashboard'
            });
        }
        
        console.log(`Bucket "${bucketName}" created successfully`);
        res.json({ 
            success: true, 
            message: `Bucket "${bucketName}" created successfully`,
            created: true
        });
    } catch (err) {
        console.error('Create bucket exception:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

// Create all required buckets
app.post('/api/storage/init-all-buckets', async (req, res) => {
    const results = [];
    
    for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
        try {
            const { error } = await supabase.storage.createBucket(bucketName, {
                public: true,
                fileSizeLimit: 10485760
            });
            
            if (error) {
                if (error.message.includes('already exists')) {
                    results.push({ bucket: bucketName, status: 'exists' });
                } else {
                    results.push({ bucket: bucketName, status: 'error', message: error.message });
                }
            } else {
                results.push({ bucket: bucketName, status: 'created' });
            }
        } catch (err) {
            results.push({ bucket: bucketName, status: 'error', message: err.message });
        }
    }
    
    res.json({ success: true, results, buckets: Object.values(STORAGE_BUCKETS) });
});

// Get storage summary across all buckets
app.get('/api/storage/summary', async (req, res) => {
    const summary = {};
    
    for (const [key, bucketName] of Object.entries(STORAGE_BUCKETS)) {
        try {
            const { data: files, error } = await supabase.storage
                .from(bucketName)
                .list('', { limit: 1000 });
            
            if (error) {
                summary[bucketName] = { error: error.message };
            } else {
                summary[bucketName] = { 
                    fileCount: files?.length || 0,
                    folders: files?.filter(f => f.id === null).map(f => f.name) || []
                };
            }
        } catch (err) {
            summary[bucketName] = { error: err.message };
        }
    }
    
    res.json({ success: true, summary, buckets: STORAGE_BUCKETS });
});

// --- ROUTES ---

// ==================== MODULE AUTH (Aquaculture/Mariculture) ====================
// Module Login - For Aquaculture and Mariculture modules
app.post('/api/auth/module/login', async (req, res) => {
    const { username, password, module, role } = req.body;
    
    console.log('[Module Login] Attempt:', { username, module, role });
    
    // Demo credentials for each module and role
    const demoCredentials = {
        aquaculture: {
            farmer: { username: 'aqua_farmer', password: 'farmer123' },
            inspector: { username: 'aqua_inspector', password: 'inspector123' },
            packer: { username: 'aqua_packer', password: 'packer123' }
        },
        mariculture: {
            farmer: { username: 'mari_farmer', password: 'farmer123' },
            inspector: { username: 'mari_inspector', password: 'inspector123' },
            packer: { username: 'mari_packer', password: 'packer123' }
        }
    };

    try {
        // First, try to find user in database
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password);

        if (!error && users && users.length > 0) {
            const user = users[0];
            
            // Check if user status is inactive
            if (user.status === 'inactive') {
                return res.json({ 
                    success: false, 
                    message: 'Access denied. Your account has been disabled by the administrator.' 
                });
            }
            
            // Generate session
            const sessionId = uuidv4();
            const token = generateToken(user, sessionId);
            
            // Store session (only in local mode)
            if (!IS_SERVERLESS) {
                if (!activeSessions.has(user.id)) {
                    activeSessions.set(user.id, new Map());
                }
                activeSessions.get(user.id).set(sessionId, {
                    createdAt: new Date(),
                    userAgent: req.headers['user-agent'],
                    ip: req.ip
                });
            }
            
            console.log('[Module Login] Success from DB for:', username);
            
            return res.json({
                success: true,
                token: token,
                sessionId: sessionId,
                user: {
                    id: user.id,
                    username: user.username,
                    role: role,
                    module: module,
                    full_name: user.full_name || username
                }
            });
        }

        // Fallback to demo credentials
        const demoCreds = demoCredentials[module]?.[role];
        if (demoCreds && demoCreds.username === username && demoCreds.password === password) {
            // Create demo user object
            const demoUser = {
                id: `${module}_${role}_demo`,
                username: username,
                role: role
            };
            
            const sessionId = uuidv4();
            const token = generateToken(demoUser, sessionId);
            
            console.log('[Module Login] Success with demo credentials for:', username);
            
            return res.json({
                success: true,
                token: token,
                sessionId: sessionId,
                user: {
                    id: demoUser.id,
                    username: username,
                    role: role,
                    module: module,
                    full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`
                }
            });
        }

        console.log('[Module Login] Failed for:', username);
        res.json({ success: false, message: 'Invalid credentials' });
        
    } catch (error) {
        console.error('[Module Login] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Auth
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Hash the password to check against stored hashed passwords
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        // First try to find user by username only
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error;
        
        // Check if user exists and verify password (support both plain and hashed)
        if (!user || (user.password !== password && user.password !== passwordHash)) {
            return res.json({ success: false, message: 'Invalid credentials' });
        }
            
        // Check if user status is inactive (disabled in registry)
        if (user.status === 'inactive') {
            return res.json({ 
                success: false, 
                message: 'Access denied. Your account has been disabled by the administrator.' 
            });
        }
        
        // Generate unique session ID for this login
        const sessionId = uuidv4();
        
        // Generate JWT token
        const token = generateToken(user, sessionId);
        
        // Store session in memory (only useful for local development)
        // In serverless mode, JWT alone is used for authentication
        if (!IS_SERVERLESS) {
            if (!activeSessions.has(user.id)) {
                activeSessions.set(user.id, new Map());
            }
            activeSessions.get(user.id).set(sessionId, {
                createdAt: new Date(),
                userAgent: req.headers['user-agent'],
                ip: req.ip
                });
                
                // Limit to 10 active sessions per user
                const userSessions = activeSessions.get(user.id);
                if (userSessions.size > 10) {
                    // Remove oldest session
                    const oldestKey = userSessions.keys().next().value;
                    userSessions.delete(oldestKey);
                }
            }
            
            res.json({ 
                success: true, 
                token: token,
                sessionId: sessionId,
                user: { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role, 
                    full_name: user.full_name,
                    vesselName: user.vessel_name,
                    vessel_name: user.vessel_name,
                    vessel_id: user.vessel_id, 
                    owner_id: user.owner_id,
                    root_id: user.root_id
                } 
            });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Logout endpoint - invalidate session
app.post('/api/auth/logout', (req, res) => {
    if (req.user && req.sessionId) {
        const userSessions = activeSessions.get(req.user.userId);
        if (userSessions) {
            userSessions.delete(req.sessionId);
            if (userSessions.size === 0) {
                activeSessions.delete(req.user.userId);
            }
        }
    }
    res.json({ success: true, message: 'Logged out successfully' });
});

// ==================== VESSEL OWNER OTP LOGIN ====================

// Send OTP for Vessel Owner
app.post('/api/auth/vessel-owner/send-otp', async (req, res) => {
    const { mobile } = req.body;

    console.log('[Vessel Owner Send OTP] Request for mobile:', mobile);

    if (!mobile || mobile.length < 10) {
        return res.status(400).json({
            success: false,
            message: 'Please enter a valid mobile number'
        });
    }

    try {
        // Check if vessel owner exists in users table (approved)
        // Look for users with phone number and vessel_id (they are vessel owners)
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or(`phone.eq.${mobile},contact_number.eq.${mobile}`)
            .not('vessel_id', 'is', null);

        if (error) {
            console.error('Database error:', error);
            throw error;
        }
        
        // Get first matching user (or null)
        const user = users && users.length > 0 ? users[0] : null;

        // Also check pending registrations
        const { data: pending } = await supabase
            .from('pending_registrations')
            .select('*')
            .eq('contact_info', mobile)
            .eq('type', 'vessel_owner')
            .single();

        if (!user && !pending) {
            console.log('[Vessel Owner Send OTP] No account found for mobile:', mobile);
            return res.json({
                success: false,
                message: 'No vessel owner account found with this mobile number'
            });
        }

        if (!user && pending && pending.status === 'pending') {
            return res.json({
                success: false,
                message: 'Your registration is pending approval. Please wait for admin confirmation.'
            });
        }

        // Generate OTP (6 digits) - In production, send via SMS
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store OTP in session (expires in 10 minutes)
        const otpKey = `otp_${mobile}`;
        if (!activeSessions.has(otpKey)) {
            activeSessions.set(otpKey, {
                otp: otp,
                expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
                attempts: 0
            });
        }

        console.log('[Vessel Owner Send OTP] OTP sent to:', mobile, '(Test OTP:', otp, ')');

        res.json({
            success: true,
            message: 'OTP sent to your registered mobile number',
            testOtp: otp // Remove in production
        });
    } catch (error) {
        console.error('[Vessel Owner Send OTP] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP: ' + error.message
        });
    }
});

// Verify OTP for Vessel Owner
app.post('/api/auth/vessel-owner/verify-otp', async (req, res) => {
    const { mobile, otp } = req.body;

    console.log('[Vessel Owner Verify OTP] Request for mobile:', mobile);

    if (!mobile || !otp) {
        return res.status(400).json({
            success: false,
            message: 'Mobile number and OTP are required'
        });
    }

    try {
        // Check stored OTP - In serverless mode, use fallback test OTP "1234"
        const otpKey = `otp_${mobile}`;
        const storedOtpData = activeSessions.get(otpKey);

        // In serverless/Vercel mode, allow test OTP "1234" since in-memory sessions don't persist
        if (IS_SERVERLESS && otp === '1234') {
            console.log('[Vessel Owner Verify OTP] Using test OTP in serverless mode');
            // Skip OTP verification, proceed to user lookup
        } else if (!storedOtpData) {
            // In local mode, require stored OTP
            if (!IS_SERVERLESS) {
                return res.json({
                    success: false,
                    message: 'OTP expired. Please request a new one.'
                });
            }
        } else {
            // Check if OTP is expired
            if (Date.now() > storedOtpData.expiresAt) {
                activeSessions.delete(otpKey);
                return res.json({
                    success: false,
                    message: 'OTP expired. Please request a new one.'
                });
            }

            // Check if OTP matches
            if (storedOtpData.otp !== otp && otp !== '1234') {
                storedOtpData.attempts++;
                
                if (storedOtpData.attempts > 3) {
                    activeSessions.delete(otpKey);
                    return res.json({
                        success: false,
                        message: 'Too many failed attempts. Please request a new OTP.'
                    });
                }

                return res.json({
                    success: false,
                    message: 'Invalid OTP. Please try again.'
                });
            }
            
            // OTP is valid, clear it
            activeSessions.delete(otpKey);
        }

        // Fetch vessel owner data
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .or(`phone.eq.${mobile},contact_number.eq.${mobile}`)
            .not('vessel_id', 'is', null);
        
        // Get first matching user (or null)
        const user = users && users.length > 0 ? users[0] : null;

        if (error) {
            console.error('Database error:', error);
            throw error;
        }

        if (!user) {
            console.log('[Vessel Owner Verify OTP] User not found after OTP verification');
            return res.json({
                success: false,
                message: 'User account not found'
            });
        }

        // Check if user status is inactive
        if (user.status === 'inactive') {
            return res.json({
                success: false,
                message: 'Your account has been disabled. Please contact support.'
            });
        }

        // Generate session
        const sessionId = uuidv4();
        const token = generateToken(
            {
                id: user.id,
                username: user.username || mobile,
                role: 'vessel_owner'
            },
            sessionId
        );

        // Store session
        if (!IS_SERVERLESS) {
            if (!activeSessions.has(user.id)) {
                activeSessions.set(user.id, new Map());
            }
            activeSessions.get(user.id).set(sessionId, {
                createdAt: new Date(),
                userAgent: req.headers['user-agent'],
                ip: req.ip
            });
        }

        console.log('[Vessel Owner Verify OTP] Login successful for:', mobile);

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            sessionId: sessionId,
            user: {
                id: user.id,
                userId: user.id,
                username: user.username,
                mobile: mobile,
                role: 'vessel_owner',
                fullName: user.full_name,
                vesselId: user.vessel_id,
                vesselName: user.vessel_name
            }
        });
    } catch (error) {
        console.error('[Vessel Owner Verify OTP] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP: ' + error.message
        });
    }
});

// Vessel Owner Login - for approved vessel owners only
app.post('/api/auth/vessel-owner/login', async (req, res) => {
    const { username, password } = req.body;
    
    console.log('[Vessel Owner Login] Attempt for:', username);
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Username and password are required' 
        });
    }
    
    try {
        // Check if user exists - vessel owners are stored as 'captain' role with vessel_id
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
            
        if (error || !user) {
            console.log('[Vessel Owner Login] User not found');
            return res.json({ 
                success: false, 
                message: 'Invalid credentials or account not approved yet.' 
            });
        }
        
        // Check if this user has a vessel (vessel owner check)
        if (!user.vessel_id && user.role !== 'vessel_owner') {
            console.log('[Vessel Owner Login] User is not a vessel owner');
            return res.json({ 
                success: false, 
                message: 'This account is not registered as a vessel owner. Please use the Staff Login.' 
            });
        }
        
        // Verify password - support both plain text and hashed passwords
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        if (user.password !== password && user.password !== passwordHash) {
            console.log('[Vessel Owner Login] Invalid password');
            return res.json({ success: false, message: 'Invalid credentials' });
        }
        
        // Create session token
        const token = crypto.randomBytes(32).toString('hex');
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        // Store session
        if (!activeSessions.has(user.id)) {
            activeSessions.set(user.id, new Map());
        }
        activeSessions.get(user.id).set(sessionId, {
            token,
            createdAt: new Date(),
            userAgent: req.headers['user-agent']
        });
        
        console.log('[Vessel Owner Login] Success for:', username);
        
        res.json({
            success: true,
            user: {
                userId: user.id,
                username: user.username,
                role: 'vessel_owner', // Return as vessel_owner for frontend routing
                fullName: user.full_name,
                vesselId: user.vessel_id,
                vesselName: user.vessel_name
            },
            token,
            sessionId
        });
        
    } catch (error) {
        console.error('[Vessel Owner Login] Error:', error);
        res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
    }
});

// Vessel Owner Registration - creates pending registration for admin approval
app.post('/api/auth/vessel-owner/register', async (req, res) => {
    const { owner, vessel, credentials } = req.body;
    
    console.log('[Vessel Owner Registration] Received registration request');
    
    if (!owner?.name || !owner?.phone || !vessel?.vesselName || !vessel?.registrationNumber || !credentials?.username || !credentials?.password) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing required fields. Please fill in all required information.' 
        });
    }
    
    try {
        // Check if username already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('username', credentials.username)
            .single();
            
        if (existingUser) {
            return res.json({ success: false, message: 'Username already taken. Please choose a different username.' });
        }
        
        // Check if vessel registration number already exists
        const { data: existingVessel } = await supabase
            .from('vessels')
            .select('id')
            .eq('registration_number', vessel.registrationNumber)
            .single();
            
        if (existingVessel) {
            return res.json({ success: false, message: 'A vessel with this registration number already exists.' });
        }
        
        // Check for pending registration with same contact_info or username
        const { data: existingPending } = await supabase
            .from('pending_registrations')
            .select('id')
            .or(`contact_info.eq.${owner.phone},username.eq.${credentials.username}`)
            .eq('status', 'pending');
            
        if (existingPending && existingPending.length > 0) {
            return res.json({ success: false, message: 'A registration request with this phone number or username is already pending.' });
        }
        
        // Hash password using crypto (simple approach - use bcrypt in production)
        const passwordHash = crypto.createHash('sha256').update(credentials.password).digest('hex');
        
        // Create pending registration - use columns that exist in the table
        const registrationData = {
            type: 'vessel_owner',
            owner_name: owner.name,
            vessel_name: vessel.vesselName,
            contact_info: owner.phone,
            email: owner.email || null,
            username: credentials.username,
            password_hash: passwordHash, // Store hashed password
            status: 'pending',
            registration_data: {
                owner: {
                    name: owner.name,
                    phone: owner.phone,
                    email: owner.email,
                    address: owner.address,
                    aadhaar_number: owner.aadhaarNumber,
                    pan_number: owner.panNumber
                },
                vessel: {
                    name: vessel.vesselName,
                    registration_number: vessel.registrationNumber,
                    imn_number: vessel.imnNumber,
                    vessel_type: vessel.vesselType,
                    length: vessel.length,
                    storage_capacity: vessel.storageCapacity,
                    crew_capacity: vessel.crewCapacity,
                    engine_power: vessel.enginePower,
                    fuel_type: vessel.fuelType,
                    home_port: vessel.homePort,
                    build_year: vessel.buildYear
                }
            }
        };
        
        const { data: pending, error: insertError } = await supabase
            .from('pending_registrations')
            .insert([registrationData])
            .select()
            .single();
            
        if (insertError) {
            console.error('[Vessel Owner Registration] Insert error:', insertError);
            throw insertError;
        }
        
        console.log('[Vessel Owner Registration] Created pending registration:', pending.id);
        
        res.json({ 
            success: true, 
            message: 'Registration submitted successfully. Please wait for admin approval.',
            pendingId: pending.id
        });
        
    } catch (error) {
        console.error('[Vessel Owner Registration] Error:', error);
        res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
});

// Validate session endpoint
app.get('/api/auth/validate', (req, res) => {
    if (req.user) {
        res.json({ 
            success: true, 
            valid: true, 
            user: {
                userId: req.user.userId,
                username: req.user.username,
                role: req.user.role
            }
        });
    } else {
        res.json({ success: false, valid: false, message: 'Invalid or expired session' });
    }
});

// Get active sessions for user (for session management UI)
app.get('/api/auth/sessions', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    const userSessions = activeSessions.get(req.user.userId);
    if (!userSessions) {
        return res.json({ success: true, sessions: [] });
    }
    
    const sessions = [];
    userSessions.forEach((session, sessionId) => {
        sessions.push({
            sessionId: sessionId,
            createdAt: session.createdAt,
            current: sessionId === req.sessionId
        });
    });
    
    res.json({ success: true, sessions });
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

        // Handle vessel_owner type registrations (new flow)
        if (pending.type === 'vessel_owner' && pending.registration_data) {
            const regData = pending.registration_data;
            const ownerData = regData.owner;
            const vesselData = regData.vessel;
            
            console.log('[Admin Approval] Processing vessel_owner registration:', pending.id);
            
            // Create the vessel with all available data
            // After running supabase_update_vessels.sql, new columns will be available
            const vesselInsertData = {
                name: vesselData.name,
                owner_name: ownerData.name,
                registration_number: vesselData.registration_number,
                status: 'active',
                home_port: vesselData.home_port || null,
                engine_power_hp: parseInt(vesselData.engine_power) || null,
                length_meters: parseFloat(vesselData.length) || null,
                build_year: parseInt(vesselData.build_year) || null,
                // New columns (available after SQL script)
                vessel_type: vesselData.vessel_type || 'M - Mechanised',
                storage_capacity: parseInt(vesselData.storage_capacity) || null,
                crew_capacity: parseInt(vesselData.crew_capacity) || null,
                fuel_type: vesselData.fuel_type || 'Diesel',
                imn_number: vesselData.imn_number || null,
                // Owner contact info on vessel
                contact_number: ownerData.phone || null,
                email: ownerData.email || null,
                address: ownerData.address || null
            };
            
            const { data: newVessel, error: vesselError } = await supabase
                .from('vessels')
                .insert([vesselInsertData])
                .select()
                .single();
                
            if (vesselError) {
                console.error('[Admin Approval] Vessel creation error:', vesselError);
                throw new Error('Failed to create vessel: ' + vesselError.message);
            }
            
            console.log('[Admin Approval] Created vessel:', newVessel.id);
            
            // Create the user with vessel_owner role (use only columns that exist)
            // Note: Using 'captain' as role since DB constraint may not have 'vessel_owner'
            // The is_vessel_owner flag (if exists) or vessel_id will identify them
            const { data: newUser, error: userError } = await supabase
                .from('users')
                .insert([{
                    username: pending.username,
                    password: pending.password_hash, // Already stored during registration
                    role: 'captain', // Use captain role (vessel owners are captains of their vessels)
                    full_name: ownerData.name,
                    vessel_name: vesselData.name,
                    vessel_id: newVessel.id,
                    phone: ownerData.phone, // Store phone number for OTP login
                    contact_number: ownerData.phone, // Also store in contact_number
                    email: ownerData.email || null,
                    address: ownerData.address || null
                }])
                .select()
                .single();
                
            if (userError) {
                console.error('[Admin Approval] User creation error:', userError);
                // Rollback vessel creation
                await supabase.from('vessels').delete().eq('id', newVessel.id);
                throw new Error('Failed to create user: ' + userError.message);
            }
            
            console.log('[Admin Approval] Created user:', newUser.id);
            
            // Note: vessels table doesn't have owner_id column
            // The link is via users.vessel_id -> vessels.id
            
            // Update user with owner_id (self-reference for vessel owners)
            await supabase
                .from('users')
                .update({ owner_id: newUser.id })
                .eq('id', newUser.id);
            
            // Mark registration as approved
            await supabase
                .from('pending_registrations')
                .update({ status: 'approved', approved_by: adminId, approved_at: new Date().toISOString() })
                .eq('id', pendingId);
                
            console.log('[Admin Approval] Vessel owner registration approved successfully');
            
            return res.json({ 
                success: true, 
                newUser: { ...newUser, password: undefined, password_hash: undefined },
                newVessel: newVessel,
                message: 'Vessel owner registration approved'
            });
        }
        
        // Legacy flow for other registration types
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
    
    // Debug log - show if images are present (truncated)
    console.log("Received trip data:");
    console.log("  - vesselImage:", data.vesselImage ? `present (${data.vesselImage.length} chars)` : 'none');
    console.log("  - gearImage:", data.gearImage ? `present (${data.gearImage.length} chars)` : 'none');
    console.log("  - vesselName:", data.vesselName);
    console.log("  - departurePort:", data.departurePort);

    try {
        // Determine status and code
        // If it's a new request, it's pending and has a temporary code
        // NOTE: We use 'active' status because some DBs have a constraint checking for 'active'/'completed' only.
        // We distinguish pending trips by their 'REQ-' code prefix.
        const status = 'active'; 
        const tempCode = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const tripCode = data.tripCode || tempCode;

        // Upload images to SEPARATE buckets
        // Vessel images go to vessel-images bucket
        // Gear images go to gear-images bucket
        const vesselPath = `${tripCode}/vessel_${Date.now()}.jpg`;
        const gearPath = `${tripCode}/gear_${Date.now()}.jpg`;
        
        console.log('Uploading trip images...');
        console.log(`  - Vessel image to: ${STORAGE_BUCKETS.VESSEL_IMAGES}/${vesselPath}`);
        console.log(`  - Gear image to: ${STORAGE_BUCKETS.GEAR_IMAGES}/${gearPath}`);
        
        const vesselImageUrl = data.vesselImage 
            ? await uploadImage(data.vesselImage, STORAGE_BUCKETS.VESSEL_IMAGES, vesselPath) 
            : null;
        const gearImageUrl = data.gearImage 
            ? await uploadImage(data.gearImage, STORAGE_BUCKETS.GEAR_IMAGES, gearPath) 
            : null;
        
        console.log("  - vesselImageUrl:", vesselImageUrl || 'none');
        console.log("  - gearImageUrl:", gearImageUrl || 'none');

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
        console.log(`New trip created with ID: ${newTripId}`);

        // Handle Crew List - Resolve QR codes to fisher IDs
        if (data.crewIds && Array.isArray(data.crewIds) && data.crewIds.length > 0) {
            console.log(`Processing ${data.crewIds.length} crew members:`, data.crewIds);
            const resolvedFisherIds = [];
            
            for (const crewId of data.crewIds) {
                const crewIdStr = crewId.toString();
                // Check if it's a QR code (contains FISHER) or a numeric ID
                // Note: Don't use includes('-') alone as it could match valid formats
                const isQRCode = crewIdStr.includes('FISHER');
                
                console.log(`  - Processing crew: ${crewIdStr}, isQR: ${isQRCode}`);
                
                if (isQRCode) {
                    // It's a QR code - resolve to actual fisher ID
                    const { data: fisher, error: resolveErr } = await supabase
                        .from('fishers')
                        .select('id')
                        .eq('qr_code', crewIdStr)
                        .single();
                    
                    if (resolveErr) {
                        console.log(`    - QR resolve error:`, resolveErr.message);
                    }
                    
                    if (fisher) {
                        console.log(`    - Resolved QR to fisher ID: ${fisher.id}`);
                        resolvedFisherIds.push(fisher.id);
                    } else {
                        console.log(`    - Could not resolve QR code: ${crewIdStr}`);
                    }
                } else {
                    // It's already a numeric ID
                    const numericId = parseInt(crewIdStr);
                    console.log(`    - Using numeric ID: ${numericId}`);
                    resolvedFisherIds.push(numericId);
                }
            }
            
            console.log(`Resolved fisher IDs: ${JSON.stringify(resolvedFisherIds)}`);
            
            if (resolvedFisherIds.length > 0) {
                const crewInserts = resolvedFisherIds.map(fisherId => ({
                    trip_id: newTripId,
                    fisher_id: fisherId
                }));
                
                console.log(`Inserting crew records:`, crewInserts);
                
                const { error: crewError } = await supabase
                    .from('trip_crew')
                    .insert(crewInserts);
                    
                if (crewError) {
                    console.error("Error adding crew to trip:", crewError);
                } else {
                    console.log(`Successfully added ${crewInserts.length} crew members to trip`);
                }
            }
        } else {
            console.log(`No crew IDs provided for trip`);
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
        console.log('[GET /api/trips] Fetching all trips...');
        const { data: trips, error } = await supabase
            .from('trips')
            .select('*')
            .order('departure_date', { ascending: false });

        if (error) throw error;
        
        console.log(`[GET /api/trips] Found ${trips?.length || 0} trips`);
        
        // Enhance each trip with catch and crew statistics
        const enhancedTrips = await Promise.all((trips || []).map(async (trip) => {
            const tripId = trip.id;
            
            // Get crew count - ensure we're querying with the correct type
            const { count: crewCount, error: crewErr } = await supabase
                .from('trip_crew')
                .select('*', { count: 'exact', head: true })
                .eq('trip_id', tripId);
            
            if (crewErr) console.log(`[GET /api/trips] Crew count error for trip ${tripId}:`, crewErr.message);
            
            // Get catch stats from catch_logs
            const { data: catchLogs, error: catchErr } = await supabase
                .from('catch_logs')
                .select('weight_kg, species_name, quality_grade')
                .eq('trip_id', tripId);
            
            if (catchErr) console.log(`[GET /api/trips] Catch logs error for trip ${tripId}:`, catchErr.message);
            
            const logs = catchLogs || [];
            const totalCatchWeight = logs.reduce((sum, log) => sum + (parseFloat(log.weight_kg) || 0), 0);
            const catchCount = logs.length;
            const speciesSet = new Set(logs.map(log => log.species_name).filter(Boolean));
            const inspectedCount = logs.filter(log => log.quality_grade).length;
            
            // Log stats for debugging
            console.log(`[GET /api/trips] Trip ${tripId} (${trip.trip_code}): crew=${crewCount || 0}, catch=${catchCount}, weight=${totalCatchWeight.toFixed(2)}, inspected=${inspectedCount}`);
            
            return {
                ...trip,
                crew_count: crewCount || 0,
                total_catch: Math.round(totalCatchWeight * 100) / 100,
                catch_count: catchCount,
                species_count: speciesSet.size,
                inspected_count: inspectedCount
            };
        }));
        
        res.json({ success: true, data: enhancedTrips });
    } catch (error) {
        console.error('[GET /api/trips] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/trips/:tripId/catch', async (req, res) => {
    const { tripId } = req.params;
    console.log(`[GET /api/trips/${tripId}/catch] Fetching catch logs for trip ID: ${tripId} (type: ${typeof tripId})`);
    try {
        // Try parsing as integer if it's a numeric string
        const numericTripId = parseInt(tripId);
        const queryId = isNaN(numericTripId) ? tripId : numericTripId;
        console.log(`[GET /api/trips/${tripId}/catch] Using query ID: ${queryId} (type: ${typeof queryId})`);
        
        const { data: logs, error } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('trip_id', queryId)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error(`[GET /api/trips/${tripId}/catch] Error:`, error);
            throw error;
        }
        
        console.log(`[GET /api/trips/${tripId}/catch] Found ${logs?.length || 0} catch logs`);
        
        // Ensure images is always an array, robust to malformed JSON
        const parsedLogs = (logs || []).map(log => {
            let imagesArr = [];
            if (Array.isArray(log.images)) {
                imagesArr = log.images;
            } else if (typeof log.images === 'string') {
                try {
                    imagesArr = JSON.parse(log.images || '[]');
                    if (!Array.isArray(imagesArr)) imagesArr = [];
                } catch (e) {
                    console.warn('Malformed images JSON in catch_logs:', log.images, e);
                    imagesArr = [];
                }
            }
            return {
                ...log,
                images: imagesArr
            };
        });
        res.json({ success: true, logs: parsedLogs });
    } catch (error) {
        console.error(`[GET /api/trips/${tripId}/catch] Exception:`, error);
        res.status(500).json({ success: false, message: error.message, logs: [] });
    }
});

// Validate QR Code - Check if it's already been used
app.get('/api/catch/validate-qr/:qrCode', async (req, res) => {
    const { qrCode } = req.params;
    try {
        const cleanQr = qrCode.trim();
        
        const { data: existing, error } = await supabase
            .from('catch_logs')
            .select('id, species_name, trip_id')
            .eq('qr_code', cleanQr);

        if (error) throw error;

        if (existing && existing.length > 0) {
            const log = existing[0];
            // QR is already used with a species logged
            if (log.species_name) {
                return res.json({ 
                    success: true, 
                    isUsed: true, 
                    species: log.species_name,
                    message: `This QR code has already been used for "${log.species_name}"`
                });
            }
        }
        
        // QR is available
        res.json({ success: true, isUsed: false });
    } catch (error) {
        console.error("QR Validation error:", error);
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
    
    // Debug logging - show what was received (truncate images for readability)
    const debugData = {
        ...data,
        images: data.images ? `[${data.images.length} images, first ${data.images[0]?.substring(0, 50)}...]` : 'none'
    };
    console.log("Received catch data:", JSON.stringify(debugData, null, 2));

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
            .select('id, species_name, trip_id')
            .eq('qr_code', cleanQr);

        if (fetchError) {
            console.error("Error checking existing QR:", fetchError);
            throw fetchError;
        }
        
        // Check if this QR is already logged for a DIFFERENT trip (reject completely)
        if (existing && existing.length > 0) {
            const existingLog = existing[0];
            
            // If QR has species (captain already logged it) and new request is trying to add species (not inspection)
            // This means someone is trying to use the same QR for a new catch entry
            if (existingLog.species_name && data.species && !data.qualityGrade) {
                return res.status(400).json({ 
                    success: false, 
                    message: `This QR code has already been used for "${existingLog.species_name}". Each QR can only be used once.`,
                    isDuplicate: true
                });
            }
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

            // Track who performed the inspection and when
            if (data.inspectorId) {
                updatePayload.inspected_by = data.inspectorId;
                updatePayload.inspected_at = new Date().toISOString();
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
            console.log(`Inserting new catch log for QR: ${cleanQr}, Trip: ${data.tripId}`);
            console.log(`Images to upload: ${data.images ? data.images.length : 0}`);
            
            let imageUrls = [];
            if (data.images && Array.isArray(data.images) && data.images.length > 0) {
                console.log('Starting fish image uploads to catch-images bucket...');
                for (let i = 0; i < data.images.length; i++) {
                    try {
                        // Organize by trip/species/qr code
                        const speciesSlug = (data.species || 'unknown').toLowerCase().replace(/\s+/g, '_');
                        const imagePath = `trip_${data.tripId}/${speciesSlug}/${cleanQr}_${i}_${Date.now()}.jpg`;
                        console.log(`Uploading image ${i + 1}/${data.images.length} to: ${STORAGE_BUCKETS.CATCH_IMAGES}/${imagePath}`);
                        const url = await uploadImage(data.images[i], STORAGE_BUCKETS.CATCH_IMAGES, imagePath);
                        if (url) {
                            imageUrls.push(url);
                            console.log(`Image ${i + 1} uploaded successfully: ${url}`);
                        } else {
                            console.log(`Image ${i + 1} upload returned null`);
                        }
                    } catch (imgErr) {
                        console.error(`Image ${i + 1} upload failed:`, imgErr);
                    }
                }
                console.log(`Total images uploaded: ${imageUrls.length}`);
            } else {
                console.log('No images provided in request');
            }

            // Ensure trip_id is a number
            const tripIdNum = parseInt(data.tripId);
            if (isNaN(tripIdNum)) {
                return res.status(400).json({ success: false, message: 'Invalid Trip ID format' });
            }

            // Use current timestamp in ISO format for proper storage
            const currentTimestamp = new Date().toISOString();
            console.log(`Inserting catch with timestamp: ${currentTimestamp}`);

            const { error: insertError } = await supabase
                .from('catch_logs')
                .insert([{
                    trip_id: tripIdNum,
                    species_name: data.species || 'Unknown',
                    weight_kg: parseFloat(data.weight) || 0,
                    count: parseInt(data.count) || 1,
                    quality_grade: data.qualityGrade || null,
                    freshness: data.freshness || 'Excellent',
                    damage_assessment: data.damage || 'None',
                    gps_lat: parseFloat(data.gps?.lat) || 0,
                    gps_lng: parseFloat(data.gps?.lng) || 0,
                    location_name: data.locationName || '',
                    qr_code: cleanQr,
                    images: imageUrls,
                    catch_session_id: data.catchSessionId || null,
                    entered_by: data.userId ? parseInt(data.userId) : null,
                    timestamp: currentTimestamp
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

        // Generate unique session ID for this login
        const sessionId = uuidv4();
        
        // Create user object for token
        const userForToken = {
            id: fisher.id,
            username: fisher.mobile_number,
            role: 'fisher'
        };
        
        // Generate JWT token
        const token = generateToken(userForToken, sessionId);
        
        // Store session (only in local mode)
        if (!IS_SERVERLESS) {
            if (!activeSessions.has(fisher.id)) {
                activeSessions.set(fisher.id, new Map());
            }
            activeSessions.get(fisher.id).set(sessionId, {
                createdAt: new Date(),
                userAgent: req.headers['user-agent'],
                ip: req.ip
            });
        }

        // Existing user, return profile with proper token
        return res.json({ 
            success: true, 
            isNewUser: false, 
            token: token,
            sessionId: sessionId,
            user: { ...fisher, role: 'fisher' }
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

        // Generate session for new user
        const sessionId = uuidv4();
        const userForToken = {
            id: newFisher.id,
            username: newFisher.mobile_number,
            role: 'fisher'
        };
        const token = generateToken(userForToken, sessionId);
        
        // Store session (only in local mode)
        if (!IS_SERVERLESS) {
            if (!activeSessions.has(newFisher.id)) {
                activeSessions.set(newFisher.id, new Map());
            }
            activeSessions.get(newFisher.id).set(sessionId, {
                createdAt: new Date(),
                userAgent: req.headers['user-agent'],
                ip: req.ip
            });
        }

        res.json({ 
            success: true, 
            token: token,
            sessionId: sessionId,
            user: { ...newFisher, role: 'fisher' }, 
            message: 'Registration successful' 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get fisher trips - support both numeric ID and QR code
app.get('/api/fishers/:id/trips', async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching trips for fisher: ${id}`);
    
    try {
        let fisherId = id;
        
        // If ID looks like a QR code (contains 'FISHER' or has dashes but isn't purely numeric), resolve to actual ID
        const isQRCode = id.includes('FISHER') || (id.includes('-') && isNaN(parseInt(id)));
        
        if (isQRCode) {
            console.log(`  - ID is a QR code, resolving...`);
            const { data: fisher, error: fisherError } = await supabase
                .from('fishers')
                .select('id')
                .eq('qr_code', id)
                .single();
            
            if (fisherError) {
                console.log(`  - QR resolution error:`, fisherError.message);
            }
            
            if (fisher) {
                fisherId = fisher.id;
                console.log(`  - Resolved to fisher ID: ${fisherId}`);
            } else {
                console.log(`  - Could not resolve QR code: ${id}`);
            }
        } else {
            console.log(`  - Using numeric ID: ${fisherId}`);
        }

        // Now using joined_at column after ALTER TABLE added it
        const { data: trips, error } = await supabase
            .from('trip_crew')
            .select(`
                trip_id,
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

        if (error) {
            console.log(`  - Trip fetch error:`, error.message);
            throw error;
        }
        
        console.log(`  - Found ${trips?.length || 0} trip_crew records`);
        
        // Filter out any null trips (orphaned records) and map
        // Sort by the trip's departure_date (most recent first)
        const validTrips = trips
            .filter(t => t.trips) 
            .map(t => ({ ...t.trips }))
            .sort((a, b) => new Date(b.departure_date || 0) - new Date(a.departure_date || 0));

        console.log(`  - Returning ${validTrips.length} valid trips`);
        res.json({ success: true, trips: validTrips });
    } catch (error) {
        console.error(`  - Error fetching fisher trips:`, error.message);
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
        console.log(`[GET /api/trips/${tripId}/crew] Fetching crew members`);
        
        const tripIdNum = parseInt(tripId);
        if (isNaN(tripIdNum)) {
            return res.status(400).json({ success: false, message: 'Invalid trip ID', crew: [] });
        }
        
        // Try to fetch with join first (if foreign key exists)
        let crewList = [];
        
        try {
            const { data: joinedData, error: joinError } = await supabase
                .from('trip_crew')
                .select(`
                    fisher_id,
                    fishers:fisher_id (
                        id,
                        full_name,
                        mobile_number,
                        qr_code,
                        home_port,
                        aadhaar_last_four,
                        status
                    )
                `)
                .eq('trip_id', tripIdNum);
            
            if (!joinError && joinedData && joinedData.length > 0) {
                console.log(`[GET /api/trips/${tripId}/crew] Found ${joinedData.length} crew via join`);
                crewList = joinedData.map(record => {
                    const f = record.fishers;
                    if (f) {
                        return {
                            id: f.id,
                            fisherId: record.fisher_id,
                            name: f.full_name || 'Unknown Fisher',
                            mobile: f.mobile_number || 'N/A',
                            qrCode: f.qr_code,
                            homePort: f.home_port || 'N/A',
                            aadhaarLast4: f.aadhaar_last_four,
                            status: f.status || 'active'
                        };
                    } else {
                        return {
                            id: record.fisher_id,
                            fisherId: record.fisher_id,
                            name: `Fisher #${record.fisher_id}`,
                            mobile: 'N/A',
                            qrCode: null,
                            homePort: 'N/A',
                            status: 'unknown'
                        };
                    }
                });
                return res.json({ success: true, crew: crewList });
            }
        } catch (joinErr) {
            console.log(`[GET /api/trips/${tripId}/crew] Join failed, trying manual lookup:`, joinErr.message);
        }
        
        // Fallback: Manual lookup
        const { data: crewRecords, error: crewError } = await supabase
            .from('trip_crew')
            .select('fisher_id')
            .eq('trip_id', tripIdNum);

        if (crewError) {
            console.error(`[GET /api/trips/${tripId}/crew] Error fetching trip_crew:`, crewError);
            throw crewError;
        }
        
        console.log(`[GET /api/trips/${tripId}/crew] Found ${crewRecords?.length || 0} crew records`);
        
        if (!crewRecords || crewRecords.length === 0) {
            return res.json({ success: true, crew: [] });
        }
        
        // Get all fisher IDs
        const fisherIds = crewRecords.map(r => parseInt(r.fisher_id)).filter(id => !isNaN(id));
        console.log(`[GET /api/trips/${tripId}/crew] Looking up fisher IDs:`, fisherIds);
        
        if (fisherIds.length > 0) {
            // Batch fetch all fishers
            const { data: fishers, error: fisherErr } = await supabase
                .from('fishers')
                .select('id, full_name, mobile_number, qr_code, home_port, aadhaar_last_four, status')
                .in('id', fisherIds);
            
            if (!fisherErr && fishers) {
                console.log(`[GET /api/trips/${tripId}/crew] Found ${fishers.length} fishers`);
                const fisherMap = new Map(fishers.map(f => [f.id, f]));
                
                crewList = crewRecords.map(record => {
                    const fId = parseInt(record.fisher_id);
                    const f = fisherMap.get(fId);
                    if (f) {
                        return {
                            id: f.id,
                            fisherId: fId,
                            name: f.full_name || 'Unknown Fisher',
                            mobile: f.mobile_number || 'N/A',
                            qrCode: f.qr_code,
                            homePort: f.home_port || 'N/A',
                            aadhaarLast4: f.aadhaar_last_four,
                            status: f.status || 'active'
                        };
                    } else {
                        return {
                            id: fId,
                            fisherId: fId,
                            name: `Fisher #${fId}`,
                            mobile: 'N/A',
                            qrCode: null,
                            homePort: 'N/A',
                            status: 'unknown'
                        };
                    }
                });
            }
        }
        
        console.log(`[GET /api/trips/${tripId}/crew] Returning ${crewList.length} crew members`);
        res.json({ success: true, crew: crewList });
    } catch (error) {
        console.error(`[GET /api/trips/${tripId}/crew] Error:`, error);
        res.status(500).json({ success: false, message: error.message, crew: [] });
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
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    if (!quantity || quantity < 1 || quantity > 500) {
        return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 500' });
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
        const duplicates = [];
        
        for (let i = 1; i <= quantity; i++) {
            const num = lastNumber + i;
            const paddedNum = num.toString().padStart(6, '0');
            // Format: TYPE-COUNTRY-CENTER-YEAR-NUMBER (e.g., FISH-IND-CHN-2025-000001)
            const code = `${qrType}-${countryCode}-${landingCentre}-${year}-${paddedNum}`;
            
            // Check for duplicates
            const { data: existing, error: checkErr } = await supabase
                .from('qr_codes')
                .select('id')
                .eq('code', code);

            if (checkErr) {
                console.error('Error checking for duplicate:', checkErr);
            } else if (existing && existing.length > 0) {
                duplicates.push(code);
                continue;
            }
            
            codes.push(code);
            
            try {
                // Generate QR Image
                const dataUrl = await QRCode.toDataURL(code, { 
                    width: 300, 
                    margin: 2,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                // Upload to qr-codes bucket, organized by type/year
                const qrPath = `${qrType}/${year}/${code}.png`;
                const publicUrl = await uploadImage(dataUrl, STORAGE_BUCKETS.QR_CODES, qrPath);
                if (publicUrl) imageUrls.push(publicUrl);
            } catch (err) {
                console.error(`Failed to generate/upload QR for ${code}:`, err);
            }
        }

        // Only update counter if new codes were generated
        if (codes.length > 0) {
            const { error: updateError } = await supabase
                .from('qr_counters')
                .update({ last_number: lastNumber + codes.length })
                .eq('qr_type', qrType)
                .eq('country_code', countryCode)
                .eq('landing_centre', landingCentre)
                .eq('year', year);

            if (updateError) throw updateError;

            // Store generated codes with appropriate table based on type
            const qrEntries = codes.map((c, idx) => ({ 
                code: c, 
                status: 'generated',
                image_url: imageUrls[idx] || null
            }));
            
            const { error: qrInsertError } = await supabase.from('qr_codes').insert(qrEntries);
            if (qrInsertError) {
                console.warn("Could not save QR codes to qr_codes table:", qrInsertError.message);
            }

            // If it's a CRATE type, also insert into crates table so workers can immediately scan them
            if (qrType === 'CRATE') {
                const crateEntries = codes.map(code => ({
                    crate_qr: code,
                    fish_count: 0,
                    total_weight: 0,
                    created_at: new Date().toISOString()
                }));
                
                const { error: crateInsertError } = await supabase.from('crates').insert(crateEntries);
                if (crateInsertError) {
                    console.warn("Could not save crate records:", crateInsertError.message);
                } else {
                    console.log(`Created ${crateEntries.length} crate records for scanning`);
                }
            }
        }

        if (codes.length === 0) {
            return res.json({ 
                success: false, 
                message: `All ${quantity} codes already exist. No new codes generated.`,
                isDuplicate: true,
                duplicates: duplicates
            });
        }

        res.json({ 
            success: true, 
            codes, 
            imageUrls,
            generated: codes.length,
            duplicates: duplicates.length > 0 ? duplicates : undefined,
            message: duplicates.length > 0 ? `Generated ${codes.length} codes, ${duplicates.length} were duplicates` : `Generated ${codes.length} codes successfully`
        });
    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// =====================================================
// WORKER STATS API
// =====================================================

// Get worker stats
app.get('/api/worker/stats/:workerId', async (req, res) => {
    const { workerId } = req.params;
    try {
        // Get fish inspected count (from catch_logs where inspected_by matches)
        const { count: inspectedCount } = await supabase
            .from('catch_logs')
            .select('*', { count: 'exact', head: true })
            .eq('inspected_by', workerId);

        // Get trips approved count (where worker approved - if tracked)
        const { count: tripsApproved } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .eq('approved_by', workerId);

        // Get crates packed count
        const { count: cratesPacked } = await supabase
            .from('crates')
            .select('*', { count: 'exact', head: true })
            .eq('packed_by', workerId);

        // Get recent activity
        const { data: recentCatches } = await supabase
            .from('catch_logs')
            .select('qr_code, species_name, inspected_at, created_at')
            .eq('inspected_by', workerId)
            .not('inspected_at', 'is', null)
            .order('inspected_at', { ascending: false })
            .limit(5);

        const { data: recentCrates } = await supabase
            .from('crates')
            .select('crate_qr, created_at')
            .eq('packed_by', workerId)
            .order('created_at', { ascending: false })
            .limit(5);

        res.json({
            success: true,
            stats: {
                inspected: inspectedCount || 0,
                approved: tripsApproved || 0,
                cratesPacked: cratesPacked || 0
            },
            recentActivity: {
                catches: recentCatches || [],
                crates: recentCrates || []
            }
        });
    } catch (error) {
        console.error('Worker stats error:', error);
        res.json({ 
            success: true, 
            stats: { inspected: 0, approved: 0, cratesPacked: 0 },
            recentActivity: { catches: [], crates: [] }
        });
    }
});

// Get active trips for crate management (trips that are not completed)
app.get('/api/worker/active-trips', async (req, res) => {
    try {
        const { data: trips, error } = await supabase
            .from('trips')
            .select('id, trip_code, vessel_name, status, fishing_method, departure_port, departure_date')
            .in('status', ['active', 'approved', 'in_progress'])
            .order('departure_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, trips: trips || [] });
    } catch (error) {
        console.error('Active trips error:', error);
        res.json({ success: true, trips: [] });
    }
});

// Crates
app.get('/api/crates', async (req, res) => {
    const { tripId } = req.query;
    try {
        let query = supabase
            .from('crates')
            .select('*')
            .order('created_at', { ascending: false });
        
        // Optionally filter by trip
        if (tripId) {
            query = query.eq('trip_id', tripId);
        }
        
        const { data: crates, error } = await query;

        if (error) throw error;
        
        // Enhance crates with display names
        const enhancedCrates = (crates || []).map(crate => ({
            ...crate,
            display_name: crate.crate_qr || `CRATE-${crate.id}`,
            status: crate.fish_count > 0 ? 'in-use' : 'empty'
        }));
        
        res.json({ success: true, crates: enhancedCrates });
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
        
        // Check for duplicate crate QR
        const { data: existingCrate, error: checkError } = await supabase
            .from('crates')
            .select('id')
            .eq('crate_qr', crateQr);

        if (checkError) throw checkError;

        if (existingCrate && existingCrate.length > 0) {
            return res.json({ success: false, message: 'Duplicate crate QR generated. Please try again.', isDuplicate: true });
        }
        
        // Generate QR Image for Crate and upload to qr-codes bucket
        const dataUrl = await QRCode.toDataURL(crateQr, {
            width: 300,
            margin: 2,
            color: { dark: '#000000', light: '#ffffff' }
        });
        const crateQrPath = `CRATE/${new Date().getFullYear()}/${crateQr}.png`;
        const qrImageUrl = await uploadImage(dataUrl, STORAGE_BUCKETS.QR_CODES, crateQrPath);

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

app.post('/api/crates/:crateId/add-fish', async (req, res) => {
    const { crateId } = req.params;
    const { fishQrCodes, packerId } = req.body;  // Accept packerId for chain of custody

    if (!fishQrCodes || !Array.isArray(fishQrCodes) || fishQrCodes.length === 0) {
        return res.status(400).json({ success: false, message: 'No fish QR codes provided' });
    }

    try {
        // Get the crate
        const { data: crate, error: crateError } = await supabase
            .from('crates')
            .select('*')
            .eq('id', crateId)
            .single();

        if (crateError || !crate) {
            return res.json({ success: false, message: 'Crate not found' });
        }

        // Update all fish records with the crate_id
        const { data: fishData, error: fetchError } = await supabase
            .from('catch_logs')
            .select('weight_kg, count')
            .in('qr_code', fishQrCodes);
            
        if (fetchError) throw fetchError;

        // Check for duplicates - fish that are already in this or other crates
        const { data: existingCrateFish, error: checkError } = await supabase
            .from('catch_logs')
            .select('qr_code, crate_id')
            .in('qr_code', fishQrCodes)
            .not('crate_id', 'is', null);

        if (checkError) throw checkError;

        if (existingCrateFish && existingCrateFish.length > 0) {
            const duplicates = existingCrateFish.map(f => f.qr_code);
            return res.json({ 
                success: false, 
                message: `These fish are already in another crate: ${duplicates.join(', ')}`,
                isDuplicate: true
            });
        }

        // Calculate totals
        const totalWeight = fishData.reduce((sum, f) => sum + (f.weight_kg || 0), 0);
        const fishCount = fishData.reduce((sum, f) => sum + (f.count || 1), 0);

        // Update fish records to point to this crate
        const { error: updateError } = await supabase
            .from('catch_logs')
            .update({ crate_id: crateId })
            .in('qr_code', fishQrCodes);

        if (updateError) throw updateError;

        // Update crate totals and packer info
        const updatedCrate = {
            ...crate,
            total_weight: (crate.total_weight || 0) + totalWeight,
            fish_count: (crate.fish_count || 0) + fishCount
        };

        // Build update object with optional packed_by field
        const crateUpdate = { 
            total_weight: updatedCrate.total_weight,
            fish_count: updatedCrate.fish_count
        };
        
        // Add packer info if provided (for chain of custody)
        if (packerId) {
            crateUpdate.packed_by = packerId;
            crateUpdate.packed_at = new Date().toISOString();
        }

        const { error: crateUpdateError } = await supabase
            .from('crates')
            .update(crateUpdate)
            .eq('id', crateId);

        if (crateUpdateError) throw crateUpdateError;

        res.json({ success: true, crate: updatedCrate, message: 'Fish added to crate successfully' });
    } catch (error) {
        console.error('Add fish to crate error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/crates', async (req, res) => {
    const { tripId, crateQr } = req.body;
    
    try {
        // Check for duplicate crate QR
        const { data: existing, error: checkError } = await supabase
            .from('crates')
            .select('id')
            .eq('crate_qr', crateQr);

        if (checkError) throw checkError;

        if (existing && existing.length > 0) {
            return res.json({ success: false, message: 'This crate QR already exists. Each crate must have a unique QR code.', isDuplicate: true });
        }

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
        // Get vessel count
        const { count: vessels } = await supabase.from('vessels').select('*', { count: 'exact', head: true });
        
        // Get active trips count
        const { count: activeTrips } = await supabase
            .from('trips')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')
            .not('trip_code', 'ilike', 'REQ-%');
        
        // Get total trips count
        const { count: totalTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true });
        
        // Get unique species count
        const { data: speciesData } = await supabase
            .from('catch_logs')
            .select('species_name');
        const uniqueSpecies = new Set((speciesData || []).map(s => s.species_name).filter(Boolean));
        
        // Get total fish tagged (catch logs count)
        const { count: fishTagged } = await supabase.from('catch_logs').select('*', { count: 'exact', head: true });
        
        // Get total catch weight
        const { data: catchWeightData } = await supabase
            .from('catch_logs')
            .select('weight_kg');
        const totalCatchWeight = (catchWeightData || []).reduce((sum, log) => sum + (parseFloat(log.weight_kg) || 0), 0);
        
        // Get fishers count
        const { count: fishersCount } = await supabase.from('fishers').select('*', { count: 'exact', head: true });
        
        // Get users count
        const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        
        // Get pending registrations count
        const { count: pendingRegs } = await supabase
            .from('pending_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        
        res.json({
            success: true,
            data: {
                vessels: vessels || 0,
                trips: activeTrips || 0,
                totalTrips: totalTrips || 0,
                species: uniqueSpecies.size || 0,
                fish: fishTagged || 0,
                totalCatchWeight: Math.round(totalCatchWeight * 100) / 100,
                fishers: fishersCount || 0,
                users: usersCount || 0,
                pendingRegistrations: pendingRegs || 0
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

// Vessels with aggregated stats
app.get('/api/vessels', async (req, res) => {
    try {
        const { data: vessels, error } = await supabase.from('vessels').select('*');
        if (error) throw error;
        
        // Get all users to find vessel owners
        const { data: allUsers } = await supabase.from('users').select('*');
        
        // Create a map of vessel_id to owner
        const vesselOwnerMap = {};
        (allUsers || []).forEach(user => {
            if (user.vessel_id) {
                vesselOwnerMap[user.vessel_id] = user;
            }
        });
        
        // Enhance each vessel with trip and catch statistics + owner details
        const enhancedVessels = await Promise.all((vessels || []).map(async (vessel) => {
            const vesselName = vessel.vessel_name || vessel.name;
            
            // Get trips for this vessel
            const { data: vesselTrips, error: tripErr } = await supabase
                .from('trips')
                .select('id, status')
                .eq('vessel_name', vesselName);
            
            const tripIds = (vesselTrips || []).map(t => t.id);
            const totalTrips = tripIds.length;
            const activeTrips = (vesselTrips || []).filter(t => t.status === 'active').length;
            
            // Get total catch weight for all trips of this vessel
            let totalCatchWeight = 0;
            let totalCatchCount = 0;
            
            if (tripIds.length > 0) {
                const { data: catchLogs } = await supabase
                    .from('catch_logs')
                    .select('weight_kg')
                    .in('trip_id', tripIds);
                
                if (catchLogs) {
                    totalCatchWeight = catchLogs.reduce((sum, log) => sum + (parseFloat(log.weight_kg) || 0), 0);
                    totalCatchCount = catchLogs.length;
                }
            }
            
            // Get owner details from the vesselOwnerMap (users with vessel_id = this vessel's id)
            const owner = vesselOwnerMap[vessel.id];
            const ownerDetails = owner ? {
                contact_number: owner.phone || owner.contact_number,
                email: owner.email,
                address: owner.address,
                owner_user_id: owner.id
            } : {};
            
            // Map DB column names to frontend-expected names
            return {
                id: vessel.id,
                vessel_name: vesselName,
                registration_number: vessel.registration_number,
                owner_name: vessel.owner_name,
                owner_id: ownerDetails.owner_user_id || null,
                status: vessel.status,
                home_port: vessel.home_port,
                // Map technical specs - handle both old and new column names
                vessel_type: vessel.vessel_type || vessel.type || 'M - Mechanised',
                engine_power: vessel.engine_power || vessel.engine_power_hp,
                length: vessel.length || vessel.length_meters,
                storage_capacity: vessel.storage_capacity,
                crew_capacity: vessel.crew_capacity,
                fuel_type: vessel.fuel_type || 'Diesel',
                build_year: vessel.build_year,
                license_number: vessel.license_number || vessel.imn_number,
                imn_number: vessel.imn_number,
                // Owner details from users table
                contact_number: ownerDetails.contact_number || vessel.contact_number,
                email: ownerDetails.email || vessel.email,
                address: ownerDetails.address || vessel.address,
                // Stats
                total_trips: totalTrips,
                active_trips: activeTrips,
                total_catch_weight: Math.round(totalCatchWeight * 100) / 100,
                total_catch_count: totalCatchCount
            };
        }));
        
        res.json({ success: true, data: enhancedVessels });
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
        // Map frontend field names to database column names
        // After running supabase_update_vessels.sql, these columns will exist:
        // id, name, registration_number, owner_name, status, length_meters, engine_power_hp, 
        // home_port, build_year, vessel_type, storage_capacity, crew_capacity, fuel_type, imn_number,
        // contact_number, email, address
        const updateData = {};
        
        // Core vessel fields - map to actual DB columns
        if (data.vessel_name !== undefined) updateData.name = data.vessel_name;
        if (data.registration_number !== undefined) updateData.registration_number = data.registration_number;
        if (data.home_port !== undefined) updateData.home_port = data.home_port;
        if (data.owner_name !== undefined) updateData.owner_name = data.owner_name;
        if (data.status !== undefined) updateData.status = data.status;
        
        // Technical specs - map to actual DB columns
        if (data.engine_power !== undefined) updateData.engine_power_hp = parseInt(data.engine_power) || null;
        if (data.length !== undefined) updateData.length_meters = parseFloat(data.length) || null;
        if (data.build_year !== undefined) updateData.build_year = parseInt(data.build_year) || null;
        
        // New columns (after running SQL script)
        if (data.vessel_type !== undefined) updateData.vessel_type = data.vessel_type;
        if (data.storage_capacity !== undefined) updateData.storage_capacity = parseInt(data.storage_capacity) || null;
        if (data.crew_capacity !== undefined) updateData.crew_capacity = parseInt(data.crew_capacity) || null;
        if (data.fuel_type !== undefined) updateData.fuel_type = data.fuel_type;
        if (data.license_number !== undefined) updateData.imn_number = data.license_number;

        if (Object.keys(updateData).length === 0 && !data.contact_number && !data.email && !data.address) {
            return res.status(400).json({ success: false, message: 'No valid fields to update' });
        }

        let result = null;
        
        if (Object.keys(updateData).length > 0) {
            const { data: updateResult, error } = await supabase
                .from('vessels')
                .update(updateData)
                .eq('id', id)
                .select();

            if (error) {
                console.error('Vessel update error details:', error);
                throw error;
            }
            result = updateResult;
        }
        
        // Also update owner details in users table if provided
        if (data.contact_number || data.email || data.address) {
            // Find the owner (user with vessel_id = this vessel's id)
            const { data: owners } = await supabase
                .from('users')
                .select('id')
                .eq('vessel_id', parseInt(id));
            
            if (owners && owners.length > 0) {
                const ownerUpdate = {};
                if (data.contact_number) {
                    ownerUpdate.phone = data.contact_number;
                    ownerUpdate.contact_number = data.contact_number;
                }
                if (data.email) ownerUpdate.email = data.email;
                if (data.address) ownerUpdate.address = data.address;
                
                await supabase
                    .from('users')
                    .update(ownerUpdate)
                    .eq('id', owners[0].id);
            }
        }
        
        res.json({ success: true, message: 'Vessel updated successfully', data: result ? result[0] : null });
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

// Debug endpoint to check database data
app.get('/api/debug/data-check', async (req, res) => {
    try {
        // Get all trips
        const { data: trips } = await supabase.from('trips').select('id, trip_code, vessel_name').limit(10);
        
        // Get all trip_crew records
        const { data: tripCrew } = await supabase.from('trip_crew').select('*').limit(20);
        
        // Get all catch_logs
        const { data: catchLogs } = await supabase.from('catch_logs').select('id, trip_id, species_name, weight_kg').limit(20);
        
        // Get all fishers
        const { data: fishers } = await supabase.from('fishers').select('id, full_name, qr_code').limit(10);
        
        res.json({
            success: true,
            data: {
                trips: trips || [],
                tripCrew: tripCrew || [],
                catchLogs: catchLogs || [],
                fishers: fishers || [],
                tripCrewTypes: tripCrew?.map(tc => ({ 
                    trip_id: tc.trip_id, 
                    trip_id_type: typeof tc.trip_id,
                    fisher_id: tc.fisher_id,
                    fisher_id_type: typeof tc.fisher_id
                })),
                catchLogTypes: catchLogs?.map(cl => ({
                    trip_id: cl.trip_id,
                    trip_id_type: typeof cl.trip_id
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================== EXCEL EXPORT API ==================
// Export trip data as JSON for Excel generation (client-side)
app.get('/api/export/trip/:tripId', async (req, res) => {
    const { tripId } = req.params;
    console.log(`[Export] Generating export data for trip ${tripId}`);
    
    try {
        // 1. Get Trip Details
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select(`
                *,
                vessels(name, registration_number, imn_number, vessel_type)
            `)
            .eq('id', tripId)
            .single();
        
        if (tripError || !trip) {
            return res.status(404).json({ success: false, message: 'Trip not found' });
        }

        // 2. Get Crew Members
        const { data: tripCrew } = await supabase
            .from('trip_crew')
            .select(`
                fisher_id,
                role,
                share_percentage,
                fishers(id, name, phone, aadhaar_last_4)
            `)
            .eq('trip_id', tripId);

        // 3. Get Catch Logs with quality inspection data
        const { data: catchLogs } = await supabase
            .from('catch_logs')
            .select('*')
            .eq('trip_id', tripId)
            .order('timestamp', { ascending: true });

        // 4. Get Crates with chain of custody
        const { data: crates } = await supabase
            .from('crates')
            .select('*')
            .eq('trip_id', tripId)
            .order('created_at', { ascending: true });

        // 5. Get Worker who packed each crate (from users table)
        const packerIds = [...new Set((crates || []).map(c => c.packed_by).filter(Boolean))];
        let packers = {};
        if (packerIds.length > 0) {
            const { data: packerData } = await supabase
                .from('users')
                .select('id, name, phone')
                .in('id', packerIds);
            packers = (packerData || []).reduce((acc, p) => {
                acc[p.id] = p;
                return acc;
            }, {});
        }

        // 6. Get Inspectors who inspected fish
        const inspectorIds = [...new Set((catchLogs || []).map(c => c.inspected_by).filter(Boolean))];
        let inspectors = {};
        if (inspectorIds.length > 0) {
            const { data: inspectorData } = await supabase
                .from('users')
                .select('id, name')
                .in('id', inspectorIds);
            inspectors = (inspectorData || []).reduce((acc, i) => {
                acc[i.id] = i;
                return acc;
            }, {});
        }

        // Format catch data for export
        const formattedCatch = (catchLogs || []).map(log => ({
            qr_code: log.qr_code,
            species_code: log.species_code || '',
            species_name: log.species_name,
            scientific_name: log.scientific_name || '',
            fao_zone: log.fao_zone || '',
            weight_kg: log.weight_kg || '',
            count: log.count || 1,
            latitude: log.latitude,
            longitude: log.longitude,
            catch_timestamp: log.timestamp,
            // Quality Inspection Data
            temperature: log.temperature || '',
            quality_grade: log.quality_grade || '',
            freshness: log.freshness || '',
            eye_clarity: log.eye_clarity || '',
            gill_color: log.gill_color || '',
            skin_condition: log.skin_condition || '',
            smell: log.smell || '',
            damage_type: log.damage_type || '',
            damage_notes: log.damage_notes || '',
            inspector_notes: log.inspector_notes || '',
            inspected_by: log.inspected_by ? (inspectors[log.inspected_by]?.name || log.inspected_by) : '',
            inspected_at: log.inspected_at || '',
            // Crate Info
            crate_id: log.crate_id || ''
        }));

        // Format crate data with chain of custody
        const formattedCrates = (crates || []).map(crate => ({
            crate_qr: crate.crate_qr,
            fish_count: crate.fish_count || 0,
            total_weight: crate.total_weight || 0,
            packed_at: crate.created_at,
            packed_by_id: crate.packed_by || '',
            packed_by_name: crate.packed_by ? (packers[crate.packed_by]?.name || 'Unknown') : '',
            packed_by_phone: crate.packed_by ? (packers[crate.packed_by]?.phone || '') : '',
            seal_number: crate.seal_number || '',
            storage_location: crate.storage_location || '',
            temperature_at_pack: crate.temperature_at_pack || ''
        }));

        // Format crew data
        const formattedCrew = (tripCrew || []).map(tc => ({
            name: tc.fishers?.name || 'Unknown',
            phone: tc.fishers?.phone || '',
            aadhaar_last_4: tc.fishers?.aadhaar_last_4 || '',
            role: tc.role || 'crew',
            share_percentage: tc.share_percentage || 0
        }));

        // Build export object
        const exportData = {
            success: true,
            exportedAt: new Date().toISOString(),
            trip: {
                id: trip.id,
                trip_code: trip.trip_code,
                status: trip.status,
                departure_date: trip.departure_date,
                departure_port: trip.departure_port,
                return_date: trip.return_date,
                return_port: trip.return_port,
                fishing_method: trip.fishing_method,
                fishing_method_code: trip.fishing_method_code || '',
                target_species: trip.target_species,
                fao_zone: trip.fao_zone || '',
                fuel_used: trip.fuel_used || '',
                ice_used: trip.ice_used || '',
                total_expense: trip.total_expense || 0
            },
            vessel: {
                name: trip.vessels?.name || '',
                registration_number: trip.vessels?.registration_number || '',
                imn_number: trip.vessels?.imn_number || '',
                vessel_type: trip.vessels?.vessel_type || ''
            },
            crew: formattedCrew,
            catch: formattedCatch,
            crates: formattedCrates,
            summary: {
                total_catch_count: formattedCatch.length,
                total_weight: formattedCatch.reduce((sum, c) => sum + (parseFloat(c.weight_kg) || 0), 0),
                total_crates: formattedCrates.length,
                crew_count: formattedCrew.length,
                species_breakdown: formattedCatch.reduce((acc, c) => {
                    const key = c.species_code || c.species_name;
                    if (!acc[key]) {
                        acc[key] = { name: c.species_name, code: c.species_code, count: 0, weight: 0 };
                    }
                    acc[key].count += (c.count || 1);
                    acc[key].weight += (parseFloat(c.weight_kg) || 0);
                    return acc;
                }, {}),
                quality_summary: {
                    grade_a: formattedCatch.filter(c => c.quality_grade === 'A').length,
                    grade_b: formattedCatch.filter(c => c.quality_grade === 'B').length,
                    grade_c: formattedCatch.filter(c => c.quality_grade === 'C').length,
                    rejected: formattedCatch.filter(c => c.quality_grade === 'Rejected').length,
                    not_inspected: formattedCatch.filter(c => !c.quality_grade).length
                }
            }
        };

        console.log(`[Export] Successfully generated export data for trip ${tripId}`);
        res.json(exportData);

    } catch (error) {
        console.error('[Export] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Admin: Link vessels and users - update users.vessel_id where missing
app.post('/api/admin/link-vessels-users', async (req, res) => {
    try {
        console.log('[Admin] Linking vessels and users...');
        
        // Get all vessels (raw data from DB)
        const { data: vessels, error: vErr } = await supabase.from('vessels').select('*');
        if (vErr) throw vErr;
        
        // Get all users with vessel_name
        const { data: users, error: uErr } = await supabase.from('users').select('*');
        if (uErr) throw uErr;
        
        console.log('[Admin] Found', vessels.length, 'vessels and', users.length, 'users');
        
        const updates = [];
        
        for (const user of users) {
            if (!user.vessel_name || user.vessel_id) continue; // Skip if no vessel_name or already has vessel_id
            
            // Find matching vessel
            const vessel = vessels.find(v => {
                const vesselName = v.name || v.vessel_name;
                return vesselName && vesselName.toLowerCase().trim() === user.vessel_name.toLowerCase().trim();
            });
            
            if (vessel) {
                console.log('[Admin] Linking user', user.username, 'to vessel', vessel.name);
                
                // Update user with vessel_id
                const { error: updateErr } = await supabase
                    .from('users')
                    .update({ vessel_id: vessel.id })
                    .eq('id', user.id);
                
                if (!updateErr) {
                    updates.push({
                        user: user.username,
                        vessel: vessel.name,
                        userId: user.id,
                        vesselId: vessel.id
                    });
                }
            }
        }
        
        console.log('[Admin] Linked', updates.length, 'users with their vessels');
        
        res.json({ 
            success: true, 
            message: `Linked ${updates.length} users with their vessels`,
            updates 
        });
    } catch (error) {
        console.error('[Admin] Link error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export for Vercel
module.exports = app;

// Only listen if run directly
if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(`Server running on http://localhost:${PORT}`);
        
        // Initialize storage buckets on startup
        await initializeStorageBuckets();
    });
}
