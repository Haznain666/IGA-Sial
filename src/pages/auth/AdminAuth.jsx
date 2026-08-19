import { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, Mail, KeyRound, ArrowLeft, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useApp } from '../../store/AppContext.jsx'
import { useToast } from '../../store/ToastContext.jsx'
import { isEmail } from '../../lib/helpers.js'
import { requestPasswordReset, verifyRecoveryCode, updatePassword } from '../../supabase/api.js'

// The Super Admin gate. Everything under /super-admin renders this until a
// Supabase session exists. Three modes live here so the whole recovery flow
// stays on one screen: sign in → request a code → set a new password.
export default function AdminAuth() {
  const { signIn } = useApp()
  const { toast } = useToast()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setBusy(false)
    }
  }

  const doLogin = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!isEmail(email)) e.email = 'Enter a valid email address.'
    if (!password) e.password = 'Enter your password.'
    setErrors(e)
    if (Object.keys(e).length) return
    run(async () => {
      await signIn(email.trim(), password)
      toast('Welcome back.')
    })
  }

  const doRequestCode = (ev) => {
    ev.preventDefault()
    if (!isEmail(email)) {
      setErrors({ email: 'Enter a valid email address.' })
      return
    }
    setErrors({})
    run(async () => {
      await requestPasswordReset(email.trim())
      setMode('code')
      toast('If that email is registered, a 6-digit code is on its way.', { duration: 6000 })
    })
  }

  const doVerify = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!/^\d{6}$/.test(code.trim())) e.code = 'Enter the 6-digit code from your email.'
    if (newPassword.length < 8) e.newPassword = 'Use at least 8 characters.'
    setErrors(e)
    if (Object.keys(e).length) return
    run(async () => {
      await verifyRecoveryCode(email.trim(), code.trim())
      await updatePassword(newPassword)
      toast('Your password has been updated. You are signed in.')
    })
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

          <div className="card p-6 sm:p-8">
            {mode === 'login' && (
              <form onSubmit={doLogin} noValidate>
                <h1 className="font-heading text-xl font-semibold text-pine">Sign in</h1>
                <p className="mt-1 text-sm text-ink/55">
                  This control panel is for IGA Sial Farm administrators only.
                </p>

                <div className="mt-6 space-y-5">
                  <AuthField
                    label="Email" id="admin-email" type="email" value={email}
                    onChange={setEmail} error={errors.email} autoComplete="email"
                    placeholder="name@example.com" icon={Mail}
                  />
                  <div>
                    <label className="field-label" htmlFor="admin-password">Password</label>
                    <div className="relative">
                      <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />
                      <input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        aria-invalid={!!errors.password}
                        className={`field-input pl-9 pr-11 ${errors.password ? 'field-input-invalid' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink/40 transition-colors hover:bg-brand-50 hover:text-ink"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600" role="alert">{errors.password}</p>}
                  </div>
                </div>

                <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
                  <LogIn className="h-5 w-5" aria-hidden="true" />
                  {busy ? 'Signing in…' : 'Sign in'}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('email'); setErrors({}) }}
                  className="mt-4 w-full text-center text-sm font-medium text-brand-600 transition-colors hover:text-brand-800"
                >
                  Forgot your password?
                </button>
              </form>
            )}

            {mode === 'email' && (
              <form onSubmit={doRequestCode} noValidate>
                <BackButton onClick={() => { setMode('login'); setErrors({}) }} />
                <h1 className="mt-3 font-heading text-xl font-semibold text-pine">Reset your password</h1>
                <p className="mt-1 text-sm text-ink/55">
                  Enter your admin email and we’ll send you a 6-digit verification code.
                </p>
                <div className="mt-6">
                  <AuthField
                    label="Email" id="reset-email" type="email" value={email}
                    onChange={setEmail} error={errors.email} autoComplete="email"
                    placeholder="name@example.com" icon={Mail}
                  />
                </div>
                <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
                  {busy ? 'Sending…' : 'Send code'}
                </button>
              </form>
            )}

            {mode === 'code' && (
              <form onSubmit={doVerify} noValidate>
                <BackButton onClick={() => { setMode('email'); setErrors({}) }} />
                <h1 className="mt-3 font-heading text-xl font-semibold text-pine">Enter your code</h1>
                <p className="mt-1 text-sm text-ink/55">
                  We sent a 6-digit code to <span className="font-medium text-ink">{email}</span>.
                  Enter it below and choose a new password.
                </p>

                <div className="mt-6 space-y-5">
                  <div>
                    <label className="field-label" htmlFor="reset-code">6-digit code</label>
                    <input
                      id="reset-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      aria-invalid={!!errors.code}
                      className={`field-input text-center text-2xl font-semibold tracking-[0.4em] tabular-nums ${errors.code ? 'field-input-invalid' : ''}`}
                    />
                    {errors.code && <p className="mt-1 text-sm text-red-600" role="alert">{errors.code}</p>}
                  </div>
                  <AuthField
                    label="New password" id="reset-password" type="password" value={newPassword}
                    onChange={setNewPassword} error={errors.newPassword} autoComplete="new-password"
                    placeholder="At least 8 characters" icon={KeyRound}
                  />
                </div>

                <button type="submit" disabled={busy} className="btn-primary btn-lg mt-6 w-full">
                  {busy ? 'Updating…' : 'Set new password'}
                </button>
              </form>
            )}
          </div>

          <p className="mt-6 text-center text-sm text-ink/50">
            <Link to="/" className="font-medium text-brand-600 hover:text-brand-800">
              Back to the public site
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-800"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back
    </button>
  )
}

function AuthField({ label, id, type = 'text', value, onChange, error, placeholder, autoComplete, icon: Icon }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" aria-hidden="true" />}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          className={`field-input ${Icon ? 'pl-9' : ''} ${error ? 'field-input-invalid' : ''}`}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-600" role="alert">{error}</p>}
    </div>
  )
}
