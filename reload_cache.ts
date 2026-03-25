import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseKey = 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reload() {
  const { data, error } = await supabase.from('doctor_schedules').select('*').limit(1);
  console.log('doctor_schedules:', data, error);
}
reload();
