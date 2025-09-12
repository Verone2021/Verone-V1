import { createClient } from '@supabase/supabase-js'

// Create Supabase admin client with service role key
export function createSupabaseAdmin(
  supabaseUrl?: string,
  supabaseServiceKey?: string,
  options?: any
) {
  const url = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = supabaseServiceKey || process.env.SUPABASE_ACCESS_TOKEN!

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    ...options
  })
}

// Alias for consistency
export const createServiceRoleClient = createSupabaseAdmin