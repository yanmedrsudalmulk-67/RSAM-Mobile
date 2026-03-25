
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  const { data, error } = await supabase.from('doctor_schedules').select('*').limit(1);
  if (error) {
    console.log('Table doctor_schedules does not exist or error:', error.message);
  } else {
    console.log('Table doctor_schedules exists.');
  }
}

checkTable();
