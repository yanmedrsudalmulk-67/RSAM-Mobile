
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDoctors() {
  const { data, error } = await supabase.from('doctors').select('*').limit(1);
  if (error) {
    console.log('Error fetching doctors:', error.message);
  } else {
    console.log('Doctors table sample:', data);
  }
}

checkDoctors();
