import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogoFooter() {
  const { data, error } = await supabase.from('logo_footer').select('*');
  console.log('logo_footer:', data, error);
}

checkLogoFooter();
