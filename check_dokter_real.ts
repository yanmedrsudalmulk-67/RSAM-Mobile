
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDokter() {
  console.log('Checking dokter table...');
  const { data, error } = await supabase.from('dokter').select('*');
  if (error) {
    console.log('Error fetching dokter:', error.message);
  } else {
    console.log('Dokter data:', data);
  }

  console.log('Checking jadwal_dokter table...');
  const { data: data2, error: error2 } = await supabase.from('jadwal_dokter').select('*');
  if (error2) {
    console.log('Error fetching jadwal_dokter:', error2.message);
  } else {
    console.log('Jadwal_dokter data length:', data2.length);
  }
}

checkDokter();
