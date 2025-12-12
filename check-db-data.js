const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    console.log('Checking Users...');
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) {
        console.error('Error fetching users:', userError.message);
    } else {
        console.log(`Found ${users.length} users.`);
        if (users.length > 0) {
            console.log('Sample user:', users[0]);
        }
    }

    console.log('\nChecking Fishers...');
    const { data: fishers, error: fisherError } = await supabase.from('fishers').select('*');
    if (fisherError) {
        console.error('Error fetching fishers:', fisherError.message);
    } else {
        console.log(`Found ${fishers.length} fishers.`);
    }
}

checkData();
