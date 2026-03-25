import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching one rekam_medis record to check id type...');
  
  const { data, error } = await supabase.from('rekam_medis').select('id').limit(1);
  
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Data:', data);
    if (data && data.length > 0) {
      console.log('Type of id:', typeof data[0].id);
    }
  }
}

run();
