import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = ['users', 'booking_kunjungan', 'stok_vaksin', 'eicv_stock', 'jadwal_dokter'];
  for (const table of tables) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`Table ${table}: OK`);
    }
  }

  console.log('\nTesting insert into jadwal_dokter...');
  const { error: insertError } = await supabase.from('jadwal_dokter').insert([{
    nama_dokter: 'Test Doctor',
    hari_praktek: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '12:00',
    poli: 'Umum'
  }]);

  if (insertError) {
    console.log(`Insert Test: FAILED - ${insertError.message}`);
  } else {
    console.log('Insert Test: SUCCESS');
    // Cleanup
    await supabase.from('jadwal_dokter').delete().eq('nama_dokter', 'Test Doctor');
  }
}

checkTables();
