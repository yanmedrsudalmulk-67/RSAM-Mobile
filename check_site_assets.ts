import { supabase } from './server/supabase.js';

async function checkTable() {
  const { data, error } = await supabase.from('site_assets').select('*').limit(1);
  if (error) {
    console.error('Error checking site_assets table:', error.message);
    if (error.message.includes('relation "site_assets" does not exist')) {
      console.log('Table site_assets does NOT exist.');
    }
  } else {
    console.log('Table site_assets exists.');
  }
}

checkTable();
