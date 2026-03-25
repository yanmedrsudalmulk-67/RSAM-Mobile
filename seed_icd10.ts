import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi'; // Use anon key if service role is not available
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedIcd10() {
  try {
    const dataPath = path.join(process.cwd(), 'icd10_data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const icd10Data = JSON.parse(rawData);

    console.log(`Seeding ${icd10Data.length} ICD-10 codes...`);

    const { data, error } = await supabase
      .from('icd10_codes')
      .upsert(icd10Data, { onConflict: 'code' });

    if (error) {
      console.error('Error seeding ICD-10 data:', error);
    } else {
      console.log('Successfully seeded ICD-10 data.');
    }
  } catch (error) {
    console.error('Error reading or parsing data file:', error);
  }
}

seedIcd10();
