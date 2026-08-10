import 'server-only'

import { createClient } from '@supabase/supabase-js'

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL: configure it before creating the Supabase server client.',
    )
  }

  if (!secretKey) {
    throw new Error(
      'Missing SUPABASE_SECRET_KEY: configure it only in the server environment.',
    )
  }

  return createClient(supabaseUrl, secretKey)
}
