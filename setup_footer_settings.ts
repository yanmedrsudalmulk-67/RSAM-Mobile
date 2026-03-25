import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupFooterSettings() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS footer_settings (
          id SERIAL PRIMARY KEY,
          teks_alamat TEXT,
          kontak TEXT,
          logo_rsud TEXT,
          logo_pemkot TEXT,
          logo_kemenkes TEXT,
          logo_bpjs TEXT,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      INSERT INTO footer_settings (id, teks_alamat, kontak) VALUES (1, 'Jl. Pelabuhan II, Lembursitu, Sukabumi', '0266-123456 | info@rsudalmulk.go.id') ON CONFLICT DO NOTHING;
    `
  });
  
  if (error) {
    console.error('Error creating table via RPC, trying direct insert...');
    // If RPC doesn't exist, we might need to just use the existing logo_footer table or create it from the dashboard.
    // Let's check if we can just insert into a new table if it exists, or we can use a generic settings table.
  } else {
    console.log('footer_settings table created.');
  }
}

setupFooterSettings();
