import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addPoliklinik() {
  const additionalPolis = [
    {
      id_poli: 'p_patologi',
      nama_poli: 'Dokter Spesialis Patologi Klinik',
      deskripsi: 'Layanan Spesialis Patologi Klinik',
      lokasi_ruangan: 'Lantai 1',
      status_poli: 'Aktif',
      kuota_harian: 30
    },
    {
      id_poli: 'p_radiologi',
      nama_poli: 'Dokter Spesialis Radiologi',
      deskripsi: 'Layanan Spesialis Radiologi',
      lokasi_ruangan: 'Lantai 1',
      status_poli: 'Aktif',
      kuota_harian: 30
    }
  ];

  for (const poli of additionalPolis) {
    const { data: existing, error: checkError } = await supabase
      .from('poliklinik')
      .select('*')
      .eq('nama_poli', poli.nama_poli)
      .single();

    if (!existing) {
      const { error } = await supabase.from('poliklinik').insert([poli]);
      if (error) {
        console.error('Error inserting', poli.nama_poli, error.message);
      } else {
        console.log('Inserted', poli.nama_poli);
      }
    } else {
      console.log('Already exists', poli.nama_poli);
    }
  }
}

addPoliklinik();
