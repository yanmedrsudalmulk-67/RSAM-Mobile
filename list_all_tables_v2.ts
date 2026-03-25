import { supabase } from './server/supabase';

async function listAllTables() {
  console.log('Listing all tables in public schema...');
  
  // This is a hacky way to list tables if we don't have direct access to pg_catalog
  // We try to query a non-existent table and see the error message, 
  // or use a known table and see if we can find others.
  
  // Actually, we can try to use the 'rpc' if there's any helper function, 
  // but let's try to query 'information_schema.tables' if possible (usually not allowed for anon)
  
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.log('Error querying information_schema.tables:', error.message);
    } else {
      console.log('Tables found:', data);
    }
  } catch (err: any) {
    console.log('Exception querying information_schema.tables:', err.message);
  }

  // Another way: try to query common names
  const commonNames = ['dokter', 'doctors', 'doctor', 'jadwal_dokter', 'jadwal_layanan', 'booking_kunjungan', 'stok_vaksin', 'users', 'profiles', 'appointments'];
  for (const name of commonNames) {
    const { error } = await supabase.from(name).select('*').limit(1);
    if (!error) {
      console.log(`Table [${name}] EXISTS`);
    } else if (error.code === '42P01') {
      console.log(`Table [${name}] DOES NOT EXIST (42P01)`);
    } else {
      console.log(`Table [${name}] Error: ${error.code} - ${error.message}`);
    }
  }
}

listAllTables();
