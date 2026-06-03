const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ukvvbrniqtkhcnnlipml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("VITE_SUPABASE_ANON_KEY missing in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from('links').select('*').limit(1);
  if (error) {
    console.error("Error reading links:", error);
  } else {
    console.log("Successfully read links:", data);
  }

  const { data: analytics, error: analError } = await supabase.from('analytics').select('*').limit(1);
  if (analError) {
    console.error("Error reading analytics:", analError);
  } else {
    console.log("Successfully read analytics:", analytics);
  }
}

test();
