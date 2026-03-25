import { createClient } from '@supabase/supabase-js';

const envUrl = process.env.SUPABASE_URL;
const supabaseUrl = (envUrl && envUrl !== '/') ? envUrl : 'https://ecigekykrqolnpxazopn.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_5ynwaOWbO7f5JFVesfCQrw_l-tk_LLi';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use Service Role Key for server-side operations if available to bypass RLS
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey || supabaseAnonKey);
