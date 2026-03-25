import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedObat() {
  try {
    const dataPath = path.join(process.cwd(), 'obat_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const obatData = JSON.parse(rawData);

    console.log(`Seeding ${obatData.length} obat codes...`);

    // Temporarily allow anon inserts for seeding if using anon key
    // This is handled by the RLS policy we set in database.sql

    const { data, error } = await supabase
      .from('obat_master')
      .upsert(obatData, { onConflict: 'nama_obat' });

    if (error) {
      console.error('Error seeding Obat data:', error);
    } else {
      console.log('Successfully seeded Obat data.');
    }
  } catch (error) {
    console.error('Error reading or parsing data file:', error);
  }
}

seedObat();
