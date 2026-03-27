import { supabase } from './server/supabase.js';

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  console.log(error ? error : data);
}
check();
