import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl !== '/') ? envUrl : 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
