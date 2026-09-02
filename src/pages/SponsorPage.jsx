import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, Copy, Landmark, ShieldCheck, HandHeart, PackageOpen, HandCoins } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import CurrencyPills from '../components/CurrencyPills.jsx'
import PartialChips from '../components/PartialChips.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { formatAmountInput, formatMoney, parseAmountInput } from '../lib/currency.js'
import { isEmail, isPhone } from '../lib/helpers.js'
import { imageUrl } from '../lib/images.js'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '' }

export default function SponsorPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { availableProducts, cart, settings, removeFromCart, sponsor, remainingOf, isPartialEligible, loading } = useApp()

  const items = useMemo(
    () => availableProducts.filter((p) => cart.includes(p.id)),
    [availableProducts, cart],
  )

  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [accepted, setAccepted] = useState(false)
  const [bankId, setBankId] = useState(settings.banks[0]?.id || '')
  const [busy, setBusy] = useState(false)
  // Per-item partial state: { [productId]: { partial: bool, value: string } }
  const [partials, setPartials] = useState({})
  const formRef = useRef(null)

  // Settings stream in from Supabase after mount, so the dropdown's default has
  // to be applied once the banks actually arrive — otherwise the visible first
  // option and the submitted bankId disagree.
  useEffect(() => {
    if (!bankId && settings.banks.length) setBankId(settings.banks[0].id)
  }, [bankId, settings.banks])

  const selectedBank = settings.banks.find((b) => b.id === bankId) || null

  const entryFor = (p) => partials[p.id] || { partial: false, value: '' }
  const amountFor = (p) => {
    const remaining = remainingOf(p.id)
    const entry = entryFor(p)
    if (!entry.partial) return remaining
    const n = Number(parseAmountInput(entry.value))
    return Number.isFinite(n) ? n : 0
  }
  const total = items.reduce((sum, p) => sum + amountFor(p), 0)

  const setPartial = (id, patch) =>
    setPartials((prev) => ({ ...prev, [id]: { ...(prev[id] || { partial: false, value: '' }), ...patch } }))

  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!isEmail(form.email)) e.email = 'Enter a valid email address.'
    if (!isPhone(form.phone)) e.phone = 'Enter a valid phone number.'
    if (!accepted) e.accepted = 'Please accept the Terms & Conditions to proceed.'
    items.forEach((p) => {
      if (!entryFor(p).partial) return
      const remaining = remainingOf(p.id)
      const n = Number(parseAmountInput(entryFor(p).value))
      if (!Number.isFinite(n) || n <= 0) e[`amt_${p.id}`] = 'Enter an amount greater than zero.'
      else if (n > remaining) e[`amt_${p.id}`] = `That is more than the ${formatMoney(remaining, 'PKR')} still open.`
    })
    setErrors(e)
    return e
  }

  const update = (key) => (ev) => {
    setForm((f) => ({ ...f, [key]: ev.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (busy) return
    const e = validate()
    if (Object.values(e).some(Boolean)) {
      const firstKey = ['firstName', 'lastName', 'email', 'phone'].find((k) => e[k])
      if (firstKey) formRef.current?.querySelector(`[name="${firstKey}"]`)?.focus()
      else if (e.accepted) toast(e.accepted, { type: 'error' })
      else toast('Please check the sponsorship amounts.', { type: 'error' })
      return
    }
    const donor = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    }
    const payload = items.map((p) => ({
      productId: p.id,
      amountPKR: Math.round(amountFor(p)),
      isPartial: entryFor(p).partial,
    }))
    const names = items.map((p) => p.name)

    setBusy(true)
    try {
      await sponsor(payload, donor, bankId || null)
      toast(
        `Thank you, ${donor.firstName}! ${names.length} ${names.length === 1 ? 'item is' : 'items are'} reserved for you.`,
        { duration: 6000 },
      )
      navigate('/thank-you', {
        state: { names, totalPKR: total, donorFirstName: donor.firstName, bankId: bankId || null },
      })
    } catch (err) {
      toast(err.message, { type: 'error', duration: 6000 })
    } finally {
      setBusy(false)
    }
  }

  const copy = (text, label) => {
    if (!text) return
    navigator.clipboard?.writeText(text).then(
      () => toast(`${label} copied.`, { type: 'info', duration: 2000 }),
      () => toast('Could not copy.', { type: 'error' }),
    )
  }

  if (loading || busy) {
    return (
      <>
        <PageHeader eyebrow="Sponsorship" title="Complete your sponsorship" />
        <div className="container-x py-12">
          <div className="flex items-center justify-center py-16">
            <svg className="h-6 w-6 animate-spin text-ink/60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="ml-3 text-ink/70">
              {loading ? 'Loading products…' : 'Processing your sponsorship…'}
            </span>
          </div>
        </div>
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <PageHeader eyebrow="Sponsorship" title="Complete your sponsorship" />
        <div className="container-x py-12">
          <EmptyState
            icon={PackageOpen}
            title="Nothing selected yet"
            description="Choose live stock or equipment to sponsor, then return here to complete your details."
            action={
              <button onClick={() => navigate('/select')} className="btn-primary btn-md">
                Browse live stock &amp; equipment
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
        eyebrow="Sponsorship"
        title="Complete your sponsorship"
        subtitle="Enter your details, review your sponsored asset(s) and choose where to deposit. Our team confirms every transfer."
        backTo="/select"
        backLabel="Back to selection"
      />

      <div className="container-x grid gap-8 py-10 sm:py-12 lg:grid-cols-5 lg:gap-10">
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="min-w-0 lg:col-span-3">
          <section className="card p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <HandHeart className="h-5 w-5 text-brand-500" aria-hidden="true" />
              <h2 className="font-heading text-xl font-semibold text-pine">Your details</h2>
            </div>
            <p className="mt-1 text-sm text-ink/55">
              We use these only to process your sponsorship and send your certificate and updates.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Field
                label="First name" name="firstName" value={form.firstName}
                onChange={update('firstName')} error={errors.firstName}
                autoComplete="given-name" placeholder="Shamila" required
              />
              <Field
                label="Last name" name="lastName" value={form.lastName}
                onChange={update('lastName')} error={errors.lastName}
                autoComplete="family-name" placeholder="Shajer" required
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
              Choose an account and transfer your sponsorship. Keep your receipt — our team will
              confirm it.
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

        <aside className="min-w-0 lg:col-span-2">
          <div className="sticky top-24 card p-6 sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-pine">Your sponsored asset(s)</h2>
            <ul className="mt-5 space-y-4">
              {items.map((p) => {
                const remaining = remainingOf(p.id)
                const eligible = isPartialEligible(p)
                const entry = entryFor(p)
                const amountError = errors[`amt_${p.id}`]
                return (
                  <li key={p.id} className="rounded-2xl border border-black/5 bg-parchment/60 p-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={imageUrl(p.images?.[0])}
                        alt={p.name}
                        className="h-16 w-14 shrink-0 rounded-xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading font-semibold text-pine">{p.name}</p>
                        <p className="truncate text-xs text-ink/50">
                          {p.kind === 'equipment' ? 'Equipment' : p.type || 'Live Stock'} ·{' '}
                          {formatMoney(p.valuePKR, 'PKR')}
                        </p>
                        {/* Item value above stays the product's real value; this is
                            the balance still open on it. Never the same figure once
                            someone has contributed. */}
                        <p className="mt-0.5 text-xs font-medium text-brand-600">
                          {formatMoney(remaining, 'PKR')} available to sponsor
                        </p>
                        <PartialChips product={p} reserveSpace={false} className="mt-1.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(p.id)}
                        className="rounded-full p-1.5 text-ink/40 transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {eligible && (
                      <div className="mt-3 border-t border-black/5 pt-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-2">
                            <HandCoins className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
                            <span id={`partial-${p.id}-label`} className="text-sm font-medium text-ink">
                              Partial sponsor
                            </span>
                          </div>
                          {/* aria-labelledby, not htmlFor: a <button role="switch"> is not a
                              labelable element, so a <label> would leave it unnamed. */}
                          <button
                            id={`partial-${p.id}`}
                            type="button"
                            role="switch"
                            aria-checked={entry.partial}
                            aria-labelledby={`partial-${p.id}-label`}
                            aria-describedby={`partial-${p.id}-desc`}
                            onClick={() =>
                              setPartial(p.id, {
                                partial: !entry.partial,
                                value: !entry.partial ? formatAmountInput(String(remaining)) : '',
                              })
                            }
                            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                              entry.partial ? 'bg-brand-500' : 'bg-black/15'
                            }`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                                entry.partial ? 'left-6' : 'left-1'
                              }`}
                            />
                          </button>
                        </div>
                        <p id={`partial-${p.id}-desc`} className="mt-1 text-xs leading-relaxed text-ink/55">
                          Give any amount towards this item instead of its full value. Others can
                          sponsor the rest, and it is only gifted once the total is reached.
                        </p>

                        {entry.partial && (
                          <div className="mt-3">
                            <label className="field-label" htmlFor={`amount-${p.id}`}>
                              Your amount (PKR)
                            </label>
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45">
                                Rs
                              </span>
                              <input
                                id={`amount-${p.id}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9,]*"
                                value={entry.value}
                                onChange={(e) => {
                                  setPartial(p.id, { value: formatAmountInput(e.target.value) })
                                  if (amountError) setErrors((er) => ({ ...er, [`amt_${p.id}`]: undefined }))
                                }}
                                onWheel={(e) => e.preventDefault()}
                                aria-invalid={!!amountError}
                                className={`field-input pl-9 ${amountError ? 'field-input-invalid' : ''}`}
                              />
                            </div>
                            <p className="mt-1 text-xs text-ink/50">
                              Between {formatMoney(1, 'PKR')} and {formatMoney(remaining, 'PKR')}.
                            </p>
                            {amountError && (
                              <p className="mt-1 text-sm text-red-600" role="alert">
                                {amountError}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className="mt-6 border-t border-black/5 pt-5">
              <p className="text-sm text-ink/55">Total sponsorship</p>
              <div className="mt-2">
                <CurrencyPills valuePKR={total} size="lg" />
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={busy}
              className="btn-gold btn-lg mt-6 w-full"
            >
              <Heart className="h-5 w-5" aria-hidden="true" />
              {busy ? 'Reserving…' : 'Proceed to sponsor'}
            </button>
            <p className="mt-3 text-center text-xs text-ink/45">
              Your contribution is held for you. Our team confirms it once your transfer arrives.
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
