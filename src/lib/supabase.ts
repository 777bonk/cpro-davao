import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 🚨 SAFETY ALARM: If Vite can't read the .env file, throw a massive error!
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🔴 MISSING SUPABASE VARIABLES! Check your .env file.");
  throw new Error("Missing Supabase environment variables. Make sure your .env file has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);