import { supabase } from './client.js'

// ---------------------------------------------------------------------------
// Auth links land on the site root, not on a route. This module runs ONCE at
// boot, before the router mounts, and turns whatever the e-mail link brought
// back into either a live session or a readable error.
//
// Three shapes can arrive, and all three must work on iOS Safari, Android
// Chrome and every desktop browser:
//
//   1. #access_token=…&refresh_token=…   implicit flow (how invites arrive now)
//   2. #token_hash=… / ?token_hash=…     e-mail templates using {{ .TokenHash }}
//   3. #error=…&error_code=otp_expired   an expired or already-used link
//
// Supabase REPLACES the fragment of the redirect URL, so a redirect target of
// `https://site/#/auth/callback` comes back as `https://site/#access_token=…`
// and the route is gone. That is why this runs before the router: it reads the
// payload, then rewrites the URL to a real route so HashRouter has something
// valid to render.
//
// The tokens are scrubbed from the address bar with replaceState as soon as
// they are consumed, so they never sit in history or get shared in a screenshot.
// ---------------------------------------------------------------------------

function payloadParams() {
  const hash = window.location.hash || ''
  // Take whatever follows the LAST '#': `#/auth/callback#access_token=…` is a
  // shape Supabase can produce when the redirect target already had a hash.
  const tail = hash.slice(hash.lastIndexOf('#') + 1)
  // A route ('/select', '/auth/callback?…') is not an auth payload.
  if (!tail || tail.startsWith('/')) return null
  const params = new URLSearchParams(tail)
  const carries =
    params.get('access_token') || params.get('token_hash') || params.get('token') ||
    params.get('error') || params.get('error_code') || params.get('error_description')
  return carries ? params : null
}

// `?code=…` on the real query string, with no route to handle it.
function strayCode() {
  const search = new URLSearchParams(window.location.search)
  const code = search.get('code')
  if (!code) return null
  const hash = window.location.hash || ''
  // Older invite e-mails already pointed at the callback route — leave those be.
  if (hash.startsWith('#/auth/callback')) return null
  return code
}

// replaceState (not location.hash =) so the credential-bearing URL leaves no
// history entry to go "back" to. This runs before HashRouter mounts, so the
// router simply reads the rewritten hash as its initial route.
function goto(hash) {
  // Drop the query string entirely: it is only ever auth debris at this point.
  window.history.replaceState(null, '', `${window.location.pathname}${hash}`)
}

// An auth link clicked while the site is ALREADY open in that tab changes only
// the fragment, so the page never reloads and the boot pass never runs — the
// router would render Not Found over a perfectly good invite. This catches
// that case and reloads once, on the rewritten URL. The session (if there was
// one in the payload) is already persisted by then, so the reload lands signed
// in. It cannot loop: after consuming, the hash is a plain route.
export function watchAuthRedirect() {
  window.addEventListener('hashchange', () => {
    if (!payloadParams()) return
    consumeAuthRedirect().then(() => window.location.reload())
  })
}

export async function consumeAuthRedirect() {
  const code = strayCode()
  if (code) {
    goto(`#/auth/callback?code=${encodeURIComponent(code)}`)
    return
  }

  const params = payloadParams()
  if (!params) return

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const type = params.get('type') || 'invite'

  if (accessToken && refreshToken) {
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) throw error
      // Signed in. Invites and recoveries both need a password next.
      goto('#/set-password')
    } catch (e) {
      goto(`#/auth/callback?error=${encodeURIComponent(e.message || 'That link could not be verified.')}`)
    }
    return
  }

  const tokenHash = params.get('token_hash') || params.get('token')
  if (tokenHash) {
    goto(`#/auth/callback?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`)
    return
  }

  const message = params.get('error_description') || params.get('error_code') || params.get('error')
  goto(`#/auth/callback?error=${encodeURIComponent(message || 'That link could not be verified.')}`)
}
