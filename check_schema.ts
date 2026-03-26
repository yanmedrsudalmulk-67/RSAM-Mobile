import { supabase } from './server/supabase.js';

async function checkSchema() {
  const { data, error } = await supabase.from('resep_obat').select('*').limit(1);
  if (error) {
    console.error('Error checking resep_obat schema:', error.message);
  } else {
    console.log('Successfully queried resep_obat. First row:', data[0]);
    if (data.length === 0) {
      console.log('Table is empty, but query succeeded.');
    } else {
      console.log('Columns:', Object.keys(data[0]));
    }
  }
}

checkSchema();
