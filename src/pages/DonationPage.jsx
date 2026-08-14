import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, Copy, Landmark, ShieldCheck, HandHeart, PackageOpen } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import CurrencyPills from '../components/CurrencyPills.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { isEmail, isPhone } from '../lib/helpers.js'
import { imageUrl } from '../lib/images.js'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '' }

export default function DonationPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { availableProducts, cart, settings, removeFromCart, reserve } = useApp()

  const animals = useMemo(
    () => availableProducts.filter((p) => cart.includes(p.id)),
    [availableProducts, cart],
  )
  const total = animals.reduce((sum, p) => sum + (Number(p.valuePKR) || 0), 0)

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [accepted, setAccepted] = useState(false)
  const [bankId, setBankId] = useState(settings.banks[0]?.id || '')
  const formRef = useRef(null)

  const selectedBank = settings.banks.find((b) => b.id === bankId) || null

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!isEmail(form.email)) e.email = 'Enter a valid email address.'
    if (!isPhone(form.phone)) e.phone = 'Enter a valid phone number.'
    if (!accepted) e.accepted = 'Please accept the Terms & Conditions to proceed.'
    setErrors(e)
    return e
  }

  const update = (key) => (ev) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()
    const e = validate()
    if (Object.values(e).some(Boolean)) {
      const firstKey = ['firstName', 'lastName', 'email', 'phone'].find((k) => e[k])
      if (firstKey) formRef.current?.querySelector(`[name="${firstKey}"]`)?.focus()
      if (e.accepted && !firstKey) toast(e.accepted, { type: 'error' })
      return
    }
    const donor = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }
    const ids = animals.map((a) => a.id)
    const animalNames = animals.map((a) => a.name)
    reserve(ids, donor, bankId || null)
    toast(
      `Thank you, ${donor.firstName}! ${ids.length} ${ids.length === 1 ? 'animal is' : 'animals are'} reserved for you.`,
      { duration: 6000 },
    )
    navigate('/thank-you', {
      state: { animalNames, totalPKR: total, donorFirstName: donor.firstName, bankId: bankId || null },
    })
  }

  const copy = (text, label) => {
    if (!text) return
    navigator.clipboard?.writeText(text).then(
      () => toast(`${label} copied.`, { type: 'info', duration: 2000 }),
      () => toast('Could not copy.', { type: 'error' }),
    )
  }

  if (animals.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Donation" title="Complete your donation" />
        <div className="container-x py-12">
          <EmptyState
            icon={PackageOpen}
            title="No animals selected yet"
            description="Choose one or more animals to donate, then return here to complete your details."
            action={
              <button onClick={() => navigate('/select')} className="btn-primary btn-md">
                Browse animals
              </button>
            }
          />
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Donation"
        title="Complete your donation"
        subtitle="Enter your details, review your gift, and choose where to deposit. Our team confirms every transfer."
        backTo="/select"
        backLabel="Back to selection"
      />

      <div className="container-x grid gap-8 py-10 sm:py-12 lg:grid-cols-5 lg:gap-10">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="lg:col-span-3">
          <section className="card p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-brand-500" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold text-pine">Your details</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              We use these only to process your donation and send your certificate and updates.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="First name" name="firstName" value={form.firstName}
                onChange={update('firstName')} error={errors.firstName}
                autoComplete="given-name" placeholder="Ayesha" required
              />
              <Field
                label="Last name" name="lastName" value={form.lastName}
                onChange={update('lastName')} error={errors.lastName}
                autoComplete="family-name" placeholder="Khan" required
              />
              <Field
                label="Email" name="email" type="email" value={form.email}
                onChange={update('email')} error={errors.email}
                autoComplete="email" placeholder="name@example.com" required
              />
              <Field
                label="Phone number" name="phone" type="tel" value={form.phone}
                onChange={update('phone')} error={errors.phone}
                autoComplete="tel" placeholder="+92 300 1234567" required
              />
            </div>
          </section>

          <section className="card mt-6 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-500" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold text-pine">Terms &amp; Conditions</h2>
            </div>
            <div className="mt-4 max-h-56 overflow-y-auto whitespace-pre-line rounded-2xl bg-parchment p-4 text-sm leading-relaxed text-ink/70">
              {settings.terms}
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked)
                  if (e.target.checked) setErrors((er) => ({ ...er, accepted: undefined }))
                }}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-brand-300 text-brand-500 focus:ring-brand-500"
              />
              <span className={`text-sm ${errors.accepted ? 'text-red-600' : 'text-ink/75'}`}>
                I accept the Terms &amp; Conditions.
              </span>
            </label>
            {errors.accepted && (
              <p className="mt-1 text-sm text-red-600" role="alert">
                {errors.accepted}
              </p>
            )}
          </section>

          <section className="card mt-6 p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-brand-500" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold text-pine">Bank details</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              Choose an account and transfer your donation. Keep your receipt — our team will confirm
              it.
            </p>

            {settings.banks.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-parchment p-4 text-sm text-ink/60">
                Bank details will be shared by our team after you proceed.
              </div>
            ) : (
              <>
                <label className="field-label mt-5" htmlFor="bank-select">
                  Select bank
                </label>
                <select
                  id="bank-select"
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  className="field-input"
                >
                  {settings.banks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName}
                      {b.currency ? ` — ${b.currency}` : ''}
                    </option>
                  ))}
                </select>

                {selectedBank && (
                  <dl className="mt-4 divide-y divide-black/5 rounded-2xl border border-black/5 bg-parchment">
                    <BankRow label="Bank" value={selectedBank.bankName} />
                    <BankRow label="Account title" value={selectedBank.accountTitle} />
                    <BankRow
                      label="Account number" value={selectedBank.accountNumber}
                      onCopy={() => copy(selectedBank.accountNumber, 'Account number')}
                    />
                    {selectedBank.iban && (
                      <BankRow
                        label="IBAN" value={selectedBank.iban}
                        onCopy={() => copy(selectedBank.iban, 'IBAN')}
                      />
                    )}
                    {selectedBank.swift && <BankRow label="SWIFT / BIC" value={selectedBank.swift} />}
                    {selectedBank.branch && <BankRow label="Branch" value={selectedBank.branch} />}
                    {selectedBank.currency && <BankRow label="Currency" value={selectedBank.currency} />}
                  </dl>
                )}
              </>
            )}
          </section>
        </form>

        <aside className="lg:col-span-2">
          <div className="sticky top-24 card p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-pine">Your gift</h2>
            <ul className="mt-5 space-y-3">
              {animals.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <img
                    src={imageUrl(a.images?.[0])}
                    alt={a.name}
                    className="h-16 w-14 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading font-semibold text-pine">{a.name}</p>
                    <p className="text-xs text-ink/50">
                      {a.type} · {formatMoney(a.valuePKR, 'PKR')}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCart(a.id)}
                    className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-red-50 hover:text-red-500"
                    aria-label={`Remove ${a.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>

            <div className="mt-6 border-t border-black/5 pt-5">
              <p className="text-sm text-ink/55">Total donation</p>
              <div className="mt-2">
                <CurrencyPills valuePKR={total} size="lg" />
              </div>
            </div>

            <button type="submit" onClick={handleSubmit} className="btn-gold btn-lg mt-6 w-full">
              <Heart className="h-5 w-5" aria-hidden="true" />
              Proceed to donate
            </button>
            <p className="mt-3 text-center text-xs text-ink/45">
              Animals are reserved for you. You confirm the donation on the next step.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}

function Field({ label, name, value, onChange, error, type = 'text', placeholder, autoComplete, required }) {
  return (
    <div>
      <label className="field-label" htmlFor={name}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        className={`field-input ${error ? 'field-input-invalid' : ''}`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

function BankRow({ label, value, onCopy }) {
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
