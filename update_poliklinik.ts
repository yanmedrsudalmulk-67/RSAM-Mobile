import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseKey);

const additionalPolis = [
  { id_poli: 'p9', nama_poli: 'Dokter Spesialis Patologi Klinik', deskripsi: 'Pelayanan Pemeriksaan Laboratorium', lokasi_ruangan: 'Lantai 1, Ruang Laboratorium', status_poli: 'Aktif', kuota_harian: 20 },
  { id_poli: 'p10', nama_poli: 'Dokter Spesialis Radiologi', deskripsi: 'Pelayanan Pemeriksaan Radiologi', lokasi_ruangan: 'Lantai 1, Ruang Radiologi', status_poli: 'Aktif', kuota_harian: 15 },
  { id_poli: 'p11', nama_poli: 'Poli Saraf', deskripsi: 'Pelayanan kesehatan saraf', lokasi_ruangan: 'Lantai 1, Ruang Poli Saraf', status_poli: 'Aktif', kuota_harian: 15 }
];

async function updatePoliklinik() {
  console.log('Adding additional polikliniks...');
  const { error } = await supabase.from('poliklinik').upsert(additionalPolis);
  if (error) {
    console.error('Error adding polikliniks:', error.message);
  } else {
    console.log('Polikliniks added successfully!');
  }
}

updatePoliklinik();
