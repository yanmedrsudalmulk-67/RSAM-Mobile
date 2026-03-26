import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllTables() {
  const tables = [
    'users',
    'rekam_medis',
    'diagnosa',
    'obat',
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
    'site_assets'
  ];

  console.log('Checking Supabase Tables:');
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Exists`);
    }
  }
}

checkAllTables();
