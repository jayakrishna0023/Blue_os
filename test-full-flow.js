const axios = require('axios');
const { supabase } = require('./server/db');

const API_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('--- STARTING FULL SYSTEM TEST ---');

    try {
        // 1. Login as Captain
        console.log('\n1. Testing Captain Login...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'captain1',
            password: 'fish123'
        });
        
        if (!loginRes.data.success) throw new Error('Captain login failed');
        const captain = loginRes.data.user;
        console.log('✅ Captain Logged In:', captain.username);

        // 2. Create Trip
        console.log('\n2. Testing Trip Creation...');
        const tripData = {
            tripCode: `TEST-TRIP-${Date.now()}`,
            vesselName: captain.vessel_name,
            fishingMethod: 'Trawling',
            departurePort: 'Test Port',
            crewMembers: 2,
            crewIds: ['FISHER-MOCK-1', 'FISHER-MOCK-2'] // This tests the trip_crew table
        };
        
        const tripRes = await axios.post(`${API_URL}/trips`, tripData);
        if (!tripRes.data.success) throw new Error('Trip creation failed: ' + tripRes.data.message);
        const tripId = tripRes.data.tripId;
        console.log('✅ Trip Created. ID:', tripId);

        // 3. Log Catch (Captain)
        console.log('\n3. Testing Catch Logging...');
        const catchQr = `FISH-${Date.now()}`;
        const catchData = {
            tripId: tripId,
            species: 'Tuna',
            weight: 10.5,
            grade: 'A', // Frontend sends 'grade'
            qrCode: catchQr,
            latitude: 12.34,
            longitude: 56.78,
            userId: captain.id
        };
        
        // We need to simulate the transformation done in api.js manually or call the endpoint directly with expected payload
        // The server expects 'qualityGrade', api.js transforms 'grade' -> 'qualityGrade'
        // Here we call the server endpoint directly, so we must send what server expects
        const serverCatchPayload = {
            tripId: tripId,
            species_name: 'Tuna', // Server expects species_name? No, server maps 'species' -> 'species_name' if we look at code?
            // Let's check server code again.
            // server/index.js: species_name: data.species || 'Unknown'
            species: 'Tuna',
            weight: 10.5,
            qualityGrade: 'A', // Server expects qualityGrade
            qrCode: catchQr,
            gps: { lat: 12.34, lng: 56.78 },
            userId: captain.id
        };

        const catchRes = await axios.post(`${API_URL}/catch`, serverCatchPayload);
        if (!catchRes.data.success) throw new Error('Catch logging failed: ' + catchRes.data.message);
        console.log('✅ Catch Logged. QR:', catchQr);

        // 4. Login as Worker
        console.log('\n4. Testing Worker Login...');
        const workerRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'worker1',
            password: 'fish123'
        });
        if (!workerRes.data.success) throw new Error('Worker login failed');
        console.log('✅ Worker Logged In');

        // 5. Approve Trip (Worker)
        console.log('\n5. Testing Trip Approval...');
        const approveRes = await axios.post(`${API_URL}/trips/approve`, { tripId });
        if (!approveRes.data.success) throw new Error('Trip approval failed');
        console.log('✅ Trip Approved. New Code:', approveRes.data.tripCode);

        // 6. Verify Fish (Worker)
        console.log('\n6. Testing Fish Verification...');
        const verifyRes = await axios.post(`${API_URL}/crates/verify-fish`, { qrCode: catchQr });
        if (!verifyRes.data.success) throw new Error('Fish verification failed: ' + verifyRes.data.message);
        console.log('✅ Fish Verified:', verifyRes.data.fish.species_name);

        // 7. Seal Crate (Worker)
        console.log('\n7. Testing Crate Sealing...');
        const sealRes = await axios.post(`${API_URL}/crates/seal`, {
            tripId: tripId,
            fishQrCodes: [catchQr]
        });
        if (!sealRes.data.success) throw new Error('Crate sealing failed: ' + sealRes.data.message);
        console.log('✅ Crate Sealed. QR:', sealRes.data.crate.crate_qr);

        console.log('\n--- TEST COMPLETED SUCCESSFULLY ---');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

runTest();
