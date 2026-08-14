import { createClient } from '@supabase/supabase-js'

// Env vars use the NEXT_PUBLIC_ prefix; vite.config.js exposes that prefix so
// `import.meta.env.NEXT_PUBLIC_*` resolves at build time.
const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const key = import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // Loud, early failure — the app has no localStorage fallback any more.
  console.error('Supabase env vars are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.')
}

export const supabase = createClient(url || '', key || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    // The app uses HashRouter, so Supabase can't reliably read the callback
    // out of the URL — we exchange the `code` ourselves in /auth/callback.
    detectSessionInUrl: false,
  },
})
