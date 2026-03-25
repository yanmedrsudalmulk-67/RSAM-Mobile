import { supabase } from './server/supabase.ts';

async function check() {
  const { data, error } = await supabase.from('rekam_medis').select('id_pasien').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log(typeof data[0]?.id_pasien, data[0]?.id_pasien);
  }
}
check();
