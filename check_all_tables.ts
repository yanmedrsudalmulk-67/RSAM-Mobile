
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAll() {
  const tables = ['users', 'poliklinik', 'jadwal_dokter', 'booking_kunjungan', 'stok_vaksin', 'eicv_stock', 'dokter', 'doctors', 'doctor', 'jadwal_layanan'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`Table ${table}: OK - ${data.length} rows`);
    }
  }
}

checkAll();
