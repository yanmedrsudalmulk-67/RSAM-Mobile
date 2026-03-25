import { supabase } from './server/supabase.ts';

async function check() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(Object.keys(data[0] || {}));
  }
}
check();
