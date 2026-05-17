const supabase = require('./supabase');
async function test() {
  const { data, error } = await supabase.from('profiles').select('id').limit(1);
  console.log('Profiles:', data, 'Error:', error);
}
test();
