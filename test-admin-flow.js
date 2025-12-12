const axios = require('axios');
const { supabase } = require('./server/db');

const API_URL = 'http://localhost:5000/api';

async function testAdminFlow() {
    console.log('--- ADMIN FLOW TEST ---');

    try {
        // 1. Create a pending registration (simulating vessel registration form)
        console.log('\n1. Creating Pending Vessel Registration...');
        const regRes = await axios.post(`${API_URL}/vessels`, {
            ownerName: 'Test Owner ' + Date.now(),
            vesselName: 'Test Vessel ' + Date.now(),
            contactInfo: '9876543210'
        });
        
        if (!regRes.data.success) throw new Error('Vessel registration failed');
        console.log('✅ Pending Registration Created');

        // 2. Fetch Pending Registrations
        console.log('\n2. Fetching Pending Registrations...');
        const pendingRes = await axios.get(`${API_URL}/admin/pending-registrations`);
        
        if (!pendingRes.data.success) throw new Error('Failed to fetch pending registrations');
        console.log(`✅ Found ${pendingRes.data.data.length} pending registrations`);
        
        if (pendingRes.data.data.length === 0) {
            console.log('⚠️ No pending registrations found to approve. Test stops here.');
            return;
        }
        
        const pendingId = pendingRes.data.data[0].id;
        console.log(`   First pending ID: ${pendingId}`);

        // 3. Approve the first pending registration
        console.log('\n3. Approving Registration...');
        const approveRes = await axios.post(`${API_URL}/admin/approve-registration`, {
            pendingId: pendingId,
            password: '1234',
            adminId: 1
        });
        
        if (!approveRes.data.success) throw new Error('Approval failed: ' + approveRes.data.message);
        console.log('✅ Registration Approved. New User:', approveRes.data.newUser.username);

        // 4. Verify Stats
        console.log('\n4. Fetching Admin Stats...');
        const statsRes = await axios.get(`${API_URL}/stats`);
        if (!statsRes.data.success) throw new Error('Stats fetch failed');
        console.log('✅ Stats:', statsRes.data.data);

        console.log('\n--- ADMIN FLOW TEST COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testAdminFlow();
