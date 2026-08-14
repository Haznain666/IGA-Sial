import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, ShieldCheck } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useApp } from '../../store/AppContext.jsx'
import { useToast } from '../../store/ToastContext.jsx'
import { updatePassword } from '../../supabase/api.js'

// Where an invited admin lands after /auth/callback exchanges their code.
export default function SetPassword() {
  const navigate = useNavigate()
  const { session, authLoading } = useApp()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </div>
    )
  }
  if (!session) return <Navigate to="/super-admin" replace />

  const submit = async (ev) => {
    ev.preventDefault()
    const e = {}
    if (password.length < 8) e.password = 'Use at least 8 characters.'
    if (password !== confirm) e.confirm = 'The two passwords don’t match.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      await updatePassword(password)
      toast('Your password is set. Welcome aboard.')
      navigate('/super-admin', { replace: true })
    } catch (err) {
      toast(err.message, { type: 'error', duration: 6000 })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <div className="container-x flex flex-1 items-center justify-center py-10 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo className="h-14" to="/" />
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-600">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Super Admin
            </p>
          </div>

          <form onSubmit={submit} noValidate className="card p-6 sm:p-8">
            <h1 className="font-heading text-xl font-semibold text-pine">Set your password</h1>
            <p className="mt-1 text-sm text-ink/55">
              Signed in as <span className="font-medium text-ink">{session.user?.email}</span>. Choose
              a password to finish setting up your account.
            </p>

            <div className="mt-6 space-y-5">
              <PasswordField
                id="new-password" label="New password" value={password} onChange={setPassword}
                error={errors.password} autoComplete="new-password" placeholder="At least 8 characters"
              />
              <PasswordField
                id="confirm-password" label="Confirm password" value={confirm} onChange={setConfirm}
                error={errors.confirm} autoComplete="new-password" placeholder="Repeat your password"
              />
            </div>

            <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              {busy ? 'Saving…' : 'Save password'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-ink/50">
            <Link to="/super-admin" className="font-medium text-brand-600 hover:text-brand-800">
              Skip for now
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function PasswordField({ id, label, value, onChange, error, placeholder, autoComplete }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative">
        <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
        <input
          id={id}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`field-input pl-9 ${error ? 'field-input-invalid' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
