import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

function getPublicEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  if (typeof window !== 'undefined' && window.__ENV?.[name]) {
    return window.__ENV[name]
  }

  return process.env[name]
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const url = getPublicEnv('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Configure Supabase environment variables before using the client.',
    )
  }

  supabaseClient = createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })

  return supabaseClient
}
