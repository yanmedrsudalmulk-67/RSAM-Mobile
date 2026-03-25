import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  'users',
  'booking_kunjungan',
  'stok_vaksin',
  'eicv_stock',
  'error_logs',
  'poliklinik',
  'dokter',
  'jadwal_layanan',
  'jadwal_dokter',
  'layanan_images',
  'logo_footer',
  'artikel_portal_rs',
  'footer_settings'
];

async function checkAll() {
  console.log('Comprehensive Table Check:');
  for (const table of tablesToCheck) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table [${table}]: MISSING or ERROR (${error.message})`);
    } else {
      console.log(`Table [${table}]: OK`);
    }
  }
}

checkAll();
