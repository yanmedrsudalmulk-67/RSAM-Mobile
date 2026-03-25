import { createClient } from '@supabase/supabase-js';
import { DOCTORS } from './src/constants';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseKey);

const poliMapping: { [key: string]: string[] } = {
  'Spesialis Penyakit Dalam': ['Poli Penyakit Dalam'],
  'Spesialis Anak': ['Poli Anak'],
  'Spesialis Bedah Umum': ['Poli Bedah'],
  'Spesialis Kebidanan & Kandungan': ['Poli Obgyn'],
  'Spesialis Neurologi': ['Poli Neurologi'],
  'Spesialis Patologi Klinik': ['Poli Umum'],
  'Spesialis Radiologi': ['Poli Umum'],
  'Poli Gigi': ['Poli Gigi'],
  'Poli Umum & Vaksinasi': ['Poli Umum', 'Poli Vaksinasi']
};

async function seedDoctors() {
  console.log('Clearing existing jadwal_dokter...');
  await supabase.from('jadwal_dokter').delete().neq('id', 0);

  const schedules: any[] = [];

  for (const doctor of DOCTORS) {
    const polis = poliMapping[doctor.specialty] || ['Poli Umum'];
    const scheduleStr = doctor.schedule;

    for (const poli of polis) {
      // Parse schedule string
      const parts = scheduleStr.split(',').map(p => p.trim());
      for (const part of parts) {
        const [daysPart, timePart] = part.split(':').map(p => p.trim());
        if (!daysPart || !timePart) continue;

        const [startTime, endTime] = timePart.split('-').map(t => t.trim().replace('.', ':'));
        
        // Handle day ranges like 'Senin - Jumat'
        if (daysPart.includes('-')) {
          schedules.push({
            nama_dokter: doctor.name,
            hari_praktek: daysPart,
            jam_mulai: startTime,
            jam_selesai: endTime,
            poli: poli,
            status_dokter: 'aktif'
          });
        } else {
          // Handle multiple days like 'Senin dan Rabu'
          const days = daysPart.split(/dan|,/).map(d => d.trim());
          for (const day of days) {
            schedules.push({
              nama_dokter: doctor.name,
              hari_praktek: day,
              jam_mulai: startTime,
              jam_selesai: endTime,
              poli: poli,
              status_dokter: 'aktif'
            });
          }
        }
      }
    }
  }

  console.log(`Inserting ${schedules.length} schedules...`);
  const { error } = await supabase.from('jadwal_dokter').insert(schedules);

  if (error) {
    console.error('Error seeding doctors:', error.message);
  } else {
    console.log('Seeding successful!');
  }
}

seedDoctors();
