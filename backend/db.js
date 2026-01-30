const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("WARNING: Supabase credentials missing. Database operations will fail.");
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

module.exports = { supabase };
