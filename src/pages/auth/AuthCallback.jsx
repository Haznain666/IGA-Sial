import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { exchangeCode, verifyTokenHash } from '../../supabase/api.js'

// HashRouter swallows the URL fragment, so `detectSessionInUrl` is off and the
// invite / recovery credential is redeemed here by hand. It can arrive either
// before the hash (?code=… on the real query string) or inside the hash route.
function readParams() {
  const merged = new URLSearchParams(window.location.search)
  const hash = window.location.hash || ''
  const qIndex = hash.indexOf('?')
  if (qIndex !== -1) {
    new URLSearchParams(hash.slice(qIndex + 1)).forEach((value, key) => {
      if (!merged.has(key)) merged.set(key, value)
    })
  }
  return {
    code: merged.get('code'),
    tokenHash: merged.get('token_hash') || merged.get('token'),
    type: merged.get('type') || 'invite',
  }
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    // StrictMode double-invokes effects; a code can only be exchanged once.
    if (ran.current) return
    ran.current = true

    const { code, tokenHash, type } = readParams()
    if (!code && !tokenHash) {
      setError('This link is missing its verification code. Please open the most recent email, or ask for a new invite.')
      return
    }
    // token_hash works from any browser; `code` only from the one that started
    // the PKCE flow — so prefer the former and fall back to the latter.
    const redeem = tokenHash ? verifyTokenHash(tokenHash, type) : exchangeCode(code)
    redeem
      .then(() => navigate('/set-password', { replace: true }))
      .catch((e) => setError(e.message || 'This link has expired or has already been used.'))
  }, [navigate])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-sand px-5">
      <div className="w-full max-w-md text-center">
        {error ? (
          <div className="card p-6 sm:p-8">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-4 font-heading text-xl font-semibold text-pine">We couldn’t verify that link</h1>
            <p className="mt-2 text-sm text-ink/60">{error}</p>
            <Link to="/super-admin" className="btn-primary btn-md mt-6">
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
            <p className="mt-4 text-sm text-ink/60">Verifying your link…</p>
          </>
        )}
      </div>
    </div>
  )
}
