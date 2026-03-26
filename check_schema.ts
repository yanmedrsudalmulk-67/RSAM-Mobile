import { supabase } from './server/supabase.js';

async function checkSchema() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'site_assets' });
  if (error) {
    // If get_table_schema doesn't exist, try another way
    const { data: cols, error: colError } = await supabase.from('site_assets').select('*').limit(0);
    if (colError) {
      console.error('Error checking site_assets schema:', colError.message);
    } else {
      console.log('Successfully queried site_assets (table exists).');
    }
  } else {
    console.log('Table schema:', data);
  }
}

checkSchema();
