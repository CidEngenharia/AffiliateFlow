const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check() {
  const { data: catData, error: catError } = await supabase.from('categories').select('*').limit(1);
  if (catError) {
    console.error('Error on categories:', catError.message);
  } else {
    console.log('Categories table exists, sample:', catData);
  }

  const { data: linkData, error: linkError } = await supabase.from('links').select('*').limit(1);
  if (linkError) {
    console.error('Error on links:', linkError.message);
  } else {
    console.log('Links table exists! Columns in sample:', Object.keys(linkData[0] || {}));
  }
  process.exit(0);
}
check();
