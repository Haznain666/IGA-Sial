import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// A SECOND Supabase client that exists for exactly one job: sending the invite
// e-mail. It differs from the main client in one decisive way — `flowType` is
// 'implicit', not 'pkce'.
//
// Why this exists (this was a real, 100%-reproducible production bug):
// PKCE generates a `code_verifier`, stores it in the localStorage of the
// browser that STARTED the flow, and mails a link carrying only `?code=`.
// Redeeming that code requires the verifier. But the person who starts an
// invite is the ADMIN, on their laptop — and the person who opens the link is
// the INVITEE, on their phone. The verifier is never where the link is opened,
// so every invite opened on another device died with:
//   "PKCE code verifier not found in storage."
//
// With the implicit flow no verifier is involved: Supabase mails a link that
// comes back carrying the session itself in the URL fragment, which any
// browser on any device can redeem. src/supabase/authRedirect.js picks it up.
//
// `persistSession: false` + its own `storageKey` keep this client completely
// out of the signed-in admin's session storage — inviting someone must never
// touch who you are signed in as.
// ---------------------------------------------------------------------------
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const inviteClient = createClient(url || '', key || '', {
  auth: {
    flowType: 'implicit',
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'sb-iga-invite-sender',
  },
})
