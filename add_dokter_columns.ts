
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumns() {
  const sql = `
    ALTER TABLE dokter ADD COLUMN IF NOT EXISTS is_rekomendasi BOOLEAN DEFAULT false;
    ALTER TABLE dokter ADD COLUMN IF NOT EXISTS urutan_rekomendasi INTEGER DEFAULT 0;
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.error('Error adding columns:', error);
  } else {
    console.log('Columns added successfully');
  }
}

addColumns();
