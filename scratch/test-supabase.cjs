const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ukvvbrniqtkhcnnlipml.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const tables = ['profiles', 'links', 'categories', 'campaigns', 'analytics'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' query error:`, error.message, `(${error.code})`);
    } else {
      console.log(`Table '${table}' exists and was queried successfully!`);
    }
  }
}

test();
