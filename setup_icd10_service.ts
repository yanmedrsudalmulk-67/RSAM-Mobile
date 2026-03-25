import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupIcd10() {
  const sql = `
    CREATE TABLE IF NOT EXISTS icd10_codes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      code VARCHAR(20) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS rekam_medis_diagnosa (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      rekam_medis_id UUID REFERENCES rekam_medis(id) ON DELETE CASCADE,
      icd10_id UUID REFERENCES icd10_codes(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  const { error } = await supabase.rpc('exec_sql', { sql });
  console.log('Result:', error ? error.message : 'Success');
}

setupIcd10();
