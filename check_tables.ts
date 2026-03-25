import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const { data: icd10, error: err1 } = await supabase.from('icd10_codes').select('*').limit(1);
  console.log('icd10_codes:', err1 ? err1.message : 'exists');
  
  const { data: rmd, error: err2 } = await supabase.from('rekam_medis_diagnosa').select('*').limit(1);
  console.log('rekam_medis_diagnosa:', err2 ? err2.message : 'exists');
}

checkTables();
