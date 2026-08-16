import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { exchangeCode, verifyTokenHash } from '../../supabase/api.js'

// Most invite links never reach this page any more: they carry their session in
// the URL fragment and are redeemed at boot by src/supabase/authRedirect.js,
// which lands the invitee straight on /set-password.
//
// This page is the handler for everything else — an e-mail template that emits
// {{ .TokenHash }}, an older `?code=` link still sitting in someone's inbox, or
// a link that has expired — and for turning any of those failures into a
// sentence a person can act on.
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
    error: merged.get('error_description') || merged.get('error'),
  }
}

// Supabase's raw messages are written for developers. Admins get these instead.
function explain(raw) {
  const msg = String(raw || '')
  if (/code verifier/i.test(msg)) {
    return 'This link was created for a different browser, so it can’t be opened here. Ask an admin to send you a fresh invitation from the Admin Users page — the new link will work on this device.'
  }
  if (/expired/i.test(msg)) {
    return 'This link has expired. Invitation links are valid for a limited time — ask an admin to send you a new one.'
  }
  if (/jwt|base64|malformed|parse/i.test(msg)) {
    return 'This link is damaged — some email apps break long links across lines. Copy the whole link into your browser’s address bar, or ask an admin for a new invitation.'
  }
  if (/already|used|invalid|not found/i.test(msg)) {
    return 'This link has already been used or is no longer valid. If you have already set a password, sign in below; otherwise ask an admin for a new invitation.'
  }
  return msg || 'We couldn’t verify that link. Ask an admin to send you a new invitation.'
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const ran = useRef(false)

  useEffect(() => {
    // StrictMode double-invokes effects; a code can only be exchanged once.
    if (ran.current) return
    ran.current = true

    const { code, tokenHash, type, error: linkError } = readParams()
    if (linkError) {
      setError(explain(linkError))
      return
    }
    if (!code && !tokenHash) {
      setError('This link is missing its verification code. Please open the most recent email, or ask an admin for a new invitation.')
      return
    }
    // token_hash works from any browser; `code` only from the one that started
    // the PKCE flow — so prefer the former and fall back to the latter.
    const redeem = tokenHash ? verifyTokenHash(tokenHash, type) : exchangeCode(code)
    redeem
      .then(() => navigate('/set-password', { replace: true }))
      .catch((e) => setError(explain(e.message)))
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
