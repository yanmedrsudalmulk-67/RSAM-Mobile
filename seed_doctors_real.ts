import { supabase } from './server/supabase.ts';

const DOCTORS = [
  {
    id_dokter: '1',
    nama_dokter: 'dr. Hijrah Saputra WR, Sp.PD',
    spesialis: 'Spesialis Penyakit Dalam',
    poli: 'Poli Penyakit Dalam',
    jadwal_praktek: 'Senin dan Rabu: 07.30 - 09.00, Jumat : 12:30 - 15:00'
  },
  {
    id_dokter: '2',
    nama_dokter: 'dr. Niko Adhi H, Sp.PD, M.Kes, FINASIM',
    spesialis: 'Spesialis Penyakit Dalam',
    poli: 'Poli Penyakit Dalam',
    jadwal_praktek: 'Selasa: 15:00 - 18:00'
  },
  {
    id_dokter: '3',
    nama_dokter: 'dr. Dhyniek Nurul FLA, Sp.A',
    spesialis: 'Spesialis Anak',
    poli: 'Poli Anak',
    jadwal_praktek: 'Senin - Jumat: 08.00 - 10.00'
  },
  {
    id_dokter: '4',
    nama_dokter: 'dr. Ferry Sudarsono, Sp.B, FINACS',
    spesialis: 'Spesialis Bedah Umum',
    poli: 'Poli Bedah',
    jadwal_praktek: 'Senin - Jumat: 07.30 - 11.00'
  },
  {
    id_dokter: '5',
    nama_dokter: 'dr. Billy Nusa Anggara T, Sp.OG',
    spesialis: 'Spesialis Kebidanan & Kandungan',
    poli: 'Poli Obgyn',
    jadwal_praktek: 'Senin, Rabu dan Jumat : 16.00 - 18.00'
  },
  {
    id_dokter: '6',
    nama_dokter: 'dr. Muthiah Nurul I, Sp.OG',
    spesialis: 'Spesialis Kebidanan & Kandungan',
    poli: 'Poli Obgyn',
    jadwal_praktek: 'Senin dan Kamis : 15.00 - 18.00'
  },
  {
    id_dokter: '7',
    nama_dokter: 'dr. Haris Nur, Sp.N',
    spesialis: 'Spesialis Neurologi',
    poli: 'Poli Neurologi',
    jadwal_praktek: 'Senin, Rabu dan Jumat : 15.30 - 18.00'
  },
  {
    id_dokter: '8',
    nama_dokter: 'dr. Diana Ratna Dewi, Sp.PK',
    spesialis: 'Spesialis Patologi Klinik',
    poli: 'Laboratorium',
    jadwal_praktek: 'Senin - Sabtu : 08.00 - 12.00'
  },
  {
    id_dokter: '9',
    nama_dokter: 'dr. Rosilah, Sp.Rad',
    spesialis: 'Spesialis Radiologi',
    poli: 'Radiologi',
    jadwal_praktek: 'Selasa : 07.00 - 09.00, Sabtu : 09.00 - 11.00'
  },
  {
    id_dokter: '10',
    nama_dokter: 'Lelawati',
    spesialis: 'Poli Gigi',
    poli: 'Poli Gigi',
    jadwal_praktek: 'Senin - Sabtu : 08.00 - 12.00'
  },
  {
    id_dokter: '11',
    nama_dokter: 'dr. M. Arifin Ramadhani',
    spesialis: 'Poli Umum & Vaksinasi',
    poli: 'Poli Umum',
    jadwal_praktek: 'Senin - Sabtu : 08.00 - 14.00'
  }
];

async function seed() {
  console.log('Seeding doctors...');
  
  // Check if table exists by trying to select
  const { error: checkError } = await supabase.from('dokter').select('id_dokter').limit(1);
  
  if (checkError) {
    console.error('Error checking table "dokter":', checkError.message);
    console.log('Table might not exist. Please run the SQL schema first.');
    return;
  }

  const { data, error } = await supabase.from('dokter').upsert(DOCTORS);

  if (error) {
    console.error('Error seeding doctors:', error.message);
  } else {
    console.log('Successfully seeded doctors!');
  }
}

seed();
