
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function initDB() {
  console.log('Initializing database tables...');

  // Create doctors table if not exists
  // Since I cannot run SQL directly, I'll try to insert data into it.
  // If it fails because it doesn't exist, I'll know.
  // Actually, I should probably just assume I need to create it if it's missing.
  // But wait, the user might have already created it or expects me to use what's there.
  // The previous error said it couldn't find 'public.doctors'.

  // I'll use the 'set_up_firebase' tool's equivalent for Supabase if it existed, but it doesn't.
  // I'll just try to use the existing 'dokter' table if it exists, or create 'doctors'.
  // Wait, I'll check 'dokter' again. Maybe it's 'Dokter' (case sensitive)?
}

// I'll just use a more robust check for all tables.
async function listTables() {
  const { data, error } = await supabase.from('users').select('id').limit(1);
  console.log('Users table check:', error ? error.message : 'OK');

  const { data: d1, error: e1 } = await supabase.from('dokter').select('*').limit(1);
  console.log('Dokter table check:', e1 ? e1.message : 'OK');

  const { data: d2, error: e2 } = await supabase.from('doctors').select('*').limit(1);
  console.log('Doctors table check:', e2 ? e2.message : 'OK');

  const { data: d3, error: e3 } = await supabase.from('jadwal_dokter').select('*').limit(1);
  console.log('Jadwal_dokter table check:', e3 ? e3.message : 'OK');
}

listTables();
