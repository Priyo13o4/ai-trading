import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided in .env file");
}

// Determine the correct redirect URL based on environment
export const getRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000/auth/callback';
  }
  
  const { protocol, host } = window.location;
  return `${protocol}//${host}/auth/callback`;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Storage key for auth tokens
    storageKey: 'pipfactor-auth',
    
    // Auto refresh tokens
    autoRefreshToken: true,
    
    // Persist session across tabs
    persistSession: true,
    
    // Detect session in URL (for email verification)
    detectSessionInUrl: true,
  },
})