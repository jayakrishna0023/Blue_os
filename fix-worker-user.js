const { supabase } = require('./server/db');

async function fixWorker() {
    console.log('Checking worker1 user...');
    
    // 1. Check if worker1 exists
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', 'worker1');
        
    if (error) {
        console.error('Error fetching worker:', error);
        return;
    }
    
    if (users.length === 0) {
        console.log('worker1 not found. Creating...');
        const { error: createError } = await supabase
            .from('users')
            .insert([{
                username: 'worker1',
                password: 'fish123', // Standardizing on fish123
                role: 'worker',
                full_name: 'Jane Smith'
            }]);
            
        if (createError) console.error('Error creating worker:', createError);
        else console.log('worker1 created with password fish123');
    } else {
        console.log('worker1 found. Updating password to fish123...');
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: 'fish123' })
            .eq('username', 'worker1');
            
        if (updateError) console.error('Error updating worker:', updateError);
        else console.log('worker1 password updated to fish123');
    }
}

fixWorker();
