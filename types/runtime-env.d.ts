declare global {
  interface Window {
    __ENV?: Partial<Record<'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY', string>>
  }
}

export {}
