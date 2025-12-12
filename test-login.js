const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testLogin() {
    console.log('--- Testing Fisher Login ---');
    try {
        // 1. Test with non-existent mobile (should prompt registration)
        console.log('Testing New User (9999999999)...');
        const resNew = await axios.post(`${API_URL}/auth/fisher/login`, { mobile: '9999999999' });
        console.log('Response:', resNew.data);

        // 2. Test with existing mobile (if any) - we created one in previous step but deleted it.
        // Let's create one first.
        console.log('\nCreating Test Fisher...');
        const regRes = await axios.post(`${API_URL}/fishers`, {
            fullName: 'Login Tester',
            fathersName: 'Tester Sr',
            mobile: '8888888888',
            homePort: 'Test Port',
            address: 'Test Addr',
            emergencyName: 'Emerg',
            emergencyNumber: '7777777777'
        });
        console.log('Registration Response:', regRes.data);

        // 3. Test Login with existing mobile
        console.log('\nTesting Existing User (8888888888)...');
        const resExist = await axios.post(`${API_URL}/auth/fisher/login`, { mobile: '8888888888' });
        console.log('Response:', resExist.data);

    } catch (error) {
        console.error('Fisher Login Test Failed:', error.message);
        if (error.response) console.error('Data:', error.response.data);
    }

    console.log('\n--- Testing Admin Login ---');
    try {
        const resAdmin = await axios.post(`${API_URL}/auth/login`, { username: 'admin', password: 'fish123' });
        console.log('Admin Login Response:', resAdmin.data);
    } catch (error) {
        console.error('Admin Login Test Failed:', error.message);
    }
}

testLogin();
