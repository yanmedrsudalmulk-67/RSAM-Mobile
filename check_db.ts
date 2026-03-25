
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('booking_kunjungan')
    .select('id_booking, nomor_antrian, tanggal_kunjungan, waktu_booking')
    .order('waktu_booking', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Recent bookings:', JSON.stringify(data, null, 2));
  }
}

checkData();
