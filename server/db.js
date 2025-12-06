const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to initialize DB (Supabase version)
const initDB = async () => {
  try {
    // Check connection by selecting from a table (e.g., users)
    // We can't create tables via JS client easily, so we assume they exist or user runs SQL
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (error) {
        console.error('Supabase connection error or tables missing:', error.message);
        console.log('IMPORTANT: Please run the SQL in "supabase_schema.sql" in your Supabase SQL Editor to create tables.');
    } else {
        console.log('Supabase connected successfully.');
    }
  } catch (err) {
    console.error('Supabase initialization failed:', err.message);
  }
};

module.exports = { supabase, initDB };
