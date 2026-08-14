import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2, Landmark, Copy, Home, Heart, Clock } from 'lucide-react'
import CurrencyPills from '../components/CurrencyPills.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'

export default function ThankYou() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { bankById } = useApp()
  const { toast } = useToast()

  const info = state || null
  const bank = info?.bankId ? bankById(info.bankId) : null

  const copy = (text, label) => {
    if (!text) return
    navigator.clipboard?.writeText(text).then(
      () => toast(`${label} copied.`, { type: 'info', duration: 2000 }),
      () => toast('Could not copy.', { type: 'error' }),
    )
  }

  if (!info) {
    return (
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-500">
          <Heart className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold text-pine">Thank you for your kindness</h1>
        <p className="mt-2 max-w-sm text-ink/60">
          If you were completing a sponsorship, our team will be in touch. You can browse live stock and
          equipment any time.
        </p>
        <Link to="/select" className="btn-primary btn-lg mt-8">
          Browse live stock &amp; equipment
        </Link>
      </div>
    )
  }

  return (
    <div className="container-x max-w-2xl py-10 sm:py-14">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-white">
          <CheckCircle2 className="h-9 w-9" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-2xl font-bold text-pine sm:text-3xl">
          Thank you{info.donorFirstName ? `, ${info.donorFirstName}` : ''}!
        </h1>
        <p className="mt-3 text-ink/70">
          {info.names?.length === 1
            ? `${info.names[0]} is reserved for you.`
            : `${info.names?.length} items are reserved for you.`}{' '}
          Please complete your transfer below — our team will confirm your sponsorship once it’s received.
        </p>
      </div>

      <div className="card mt-8 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading font-semibold text-pine">Your reserved gift</h2>
          <span className="chip bg-gold-100 text-xs text-gold-800">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Awaiting transfer
          </span>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {info.names?.map((n) => (
            <li key={n} className="chip bg-brand-50 text-sm text-brand-700">
              {n}
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-black/5 pt-4">
          <p className="text-sm text-ink/55">Total to transfer</p>
          <div className="mt-1.5">
            <CurrencyPills valuePKR={info.totalPKR} size="lg" />
          </div>
        </div>
      </div>

      {bank && (
        <div className="card mt-5 p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-brand-500" aria-hidden="true" />
            <h2 className="font-heading font-semibold text-pine">Transfer to</h2>
          </div>
          <dl className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5 bg-parchment">
            <Row label="Bank" value={bank.bankName} />
            <Row label="Account title" value={bank.accountTitle} />
            <Row label="Account number" value={bank.accountNumber} onCopy={() => copy(bank.accountNumber, 'Account number')} />
            {bank.iban && <Row label="IBAN" value={bank.iban} onCopy={() => copy(bank.iban, 'IBAN')} />}
            {bank.swift && <Row label="SWIFT / BIC" value={bank.swift} />}
            {bank.branch && <Row label="Branch" value={bank.branch} />}
          </dl>
          <p className="mt-3 text-xs text-ink/50">
            Keep your transfer receipt. What you reserved is held for you until our team confirms.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button onClick={() => navigate('/')} className="btn-outline btn-lg">
          <Home className="h-5 w-5" aria-hidden="true" />
          Back to home
        </button>
        <Link to="/select" className="btn-primary btn-lg">
          <Heart className="h-5 w-5" aria-hidden="true" />
          Sponsor another
        </Link>
      </div>
    </div>
  )
}

function Row({ label, value, onCopy }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-ink/45">{label}</dt>
        <dd className="mt-0.5 break-words font-medium text-ink">{value}</dd>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          type="button"
          className="shrink-0 rounded-lg p-2 text-brand-500 transition-colors hover:bg-brand-50"
          aria-label={`Copy ${label}`}
        >
          <Copy className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
