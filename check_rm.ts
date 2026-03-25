import { supabase } from './server/supabase.ts';

async function check() {
  const { data, error } = await supabase.from('rekam_medis').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(Object.keys(data[0] || {}));
  }
}
check();
