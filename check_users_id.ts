import { supabase } from './server/supabase.ts';

async function check() {
  const { data, error } = await supabase.from('users').select('id, nik').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(typeof data[0].id, data[0].id);
  }
}
check();
