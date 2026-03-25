import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExecSql() {
  const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
  if (error) {
    console.error('Error calling exec_sql:', error);
  } else {
    console.log('exec_sql is available! Data:', data);
  }
}

checkExecSql();
