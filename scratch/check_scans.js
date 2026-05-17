const supabase = require('../server/supabase');

async function check() {
  const { data, error } = await supabase
    .from('threat_scans')
    .select('id, target_url, risk_score, status')
    .limit(10);
  
  if (error) {
    console.error('Error fetching threat_scans:', error);
  } else {
    console.log('Threat scans:', data);
  }
}

check();
