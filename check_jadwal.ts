
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJadwal() {
  const { data, error } = await supabase.from('jadwal_dokter').select('*').limit(1);
  if (error) {
    console.log('Error fetching jadwal_dokter:', error.message);
  } else {
    console.log('Jadwal_dokter table sample:', data);
  }
}

checkJadwal();
