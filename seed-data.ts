import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseKey);

const generateObat = () => {
  const obat = [];
  const prefixes = ['Amox', 'Para', 'Ibu', 'Cef', 'Dexa', 'Mef', 'Ran', 'Ome', 'Lans', 'Met'];
  const suffixes = ['cillin', 'cetamol', 'profen', 'trix', 'methasone', 'namic', 'tidine', 'prazole', 'formin', 'lol'];
  const categories = ['Antibiotik', 'Analgesik', 'Anti-inflamasi', 'Antasida', 'Vitamin', 'Suplemen', 'Lainnya'];
  const units = ['Tablet', 'Kapsul', 'Sirup', 'Salep', 'Injeksi', 'Pcs'];

  for (let i = 1; i <= 500; i++) {
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${prefix}${suffix} ${Math.floor(Math.random() * 500) + 100}mg`;
    
    obat.push({
      nama_obat: name,
      kategori: categories[Math.floor(Math.random() * categories.length)],
      satuan: units[Math.floor(Math.random() * units.length)],
      stok: Math.floor(Math.random() * 1000) + 50
    });
  }
  return obat;
};

const generateDiagnosa = () => {
  const diagnosa = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let i = 1; i <= 500; i++) {
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const code = `${letter}${num1}${num2}.${Math.floor(Math.random() * 9)}`;
    
    diagnosa.push({
      code: code,
      name: `Diagnosa Penyakit ${code}`,
      description: `Deskripsi medis untuk diagnosa ${code}`
    });
  }
  return diagnosa;
};

async function seed() {
  console.log('Memulai proses seeding data...');
  
  // Check if tables exist
  const { error: checkError } = await supabase.from('obat_master').select('id').limit(1);
  if (checkError) {
    console.error('Tabel obat_master tidak ditemukan. Pastikan Anda sudah menjalankan database.sql di Supabase.');
    return;
  }

  const obatData = generateObat();
  console.log(`Menyisipkan ${obatData.length} data obat...`);
  
  // Insert in batches of 100
  for (let i = 0; i < obatData.length; i += 100) {
    const batch = obatData.slice(i, i + 100);
    const { error } = await supabase.from('obat_master').insert(batch);
    if (error) console.error(`Error insert obat batch ${i}:`, error.message);
  }

  const diagnosaData = generateDiagnosa();
  console.log(`Menyisipkan ${diagnosaData.length} data diagnosa...`);
  
  for (let i = 0; i < diagnosaData.length; i += 100) {
    const batch = diagnosaData.slice(i, i + 100);
    const { error } = await supabase.from('icd10_codes').insert(batch);
    if (error) console.error(`Error insert diagnosa batch ${i}:`, error.message);
  }

  console.log('Seeding selesai!');
}

seed();
