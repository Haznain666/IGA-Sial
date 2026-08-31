import { createClient } from '@supabase/supabase-js'

// Vite exposes only VITE_ variables to the browser bundle, so keep the client
// keys under that prefix for build-time inlining.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  // Loud, early failure — the app has no localStorage fallback any more.
  console.error('Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
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
