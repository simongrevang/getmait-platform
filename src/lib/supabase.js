import { createClient } from '@supabase/supabase-js'

// Hardcoded for production stability
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://supabase.getmait.dk"
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc3MDI4NjgwMCwiZXhwIjo0OTI1OTYwNDAwLCJyb2xlIjoiYW5vbiJ9.Lshy9-QNUcZhFol6_zI6yinhWak7nmkd03rMs94-viE"

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[GetMait] Missing Supabase environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl ? 'set' : 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'set' : 'MISSING'
  })
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
