import { useState } from 'react'
import {
  ToggleRight, ScrollText, Landmark, Plus, Pencil, Trash2, CheckCircle2, Building2, ListChecks,
  UserCog, Coins, CalendarClock, HandCoins, Beef, Wrench,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import {
  DEFAULT_FX, formatMoney, convertFromPKR, formatAmountInput, parseAmountInput,
} from '../lib/currency.js'

export default function SettingsPage() {
  const { settings, setSettings, addBank, updateBank, deleteBank, MAX_BANKS } = useApp()
  const { toast } = useToast()

  const [terms, setTerms] = useState(settings.terms)
  const [saving, setSaving] = useState(false)
  const [bankBusyId, setBankBusyId] = useState('')
  const [fx, setFx] = useState(() => ({
    USD: String(settings.fxRates?.USD ?? DEFAULT_FX.USD),
    AUD: String(settings.fxRates?.AUD ?? DEFAULT_FX.AUD),
    SAR: String(settings.fxRates?.SAR ?? DEFAULT_FX.SAR),
  }))
  const [holdDays, setHoldDays] = useState(String(settings.reservationDays ?? 7))
  const [minLivestock, setMinLivestock] = useState(String(settings.partialLivestockMin ?? 0))
  const [minEquipment, setMinEquipment] = useState(String(settings.partialEquipmentMin ?? 0))
  const [bankEditor, setBankEditor] = useState({ open: false, bank: null })

  // Every write goes straight to Supabase and streams back to all visitors.
  const save = async (patch, message) => {
    setSaving(true)
    try {
      await setSettings(patch)
      if (message) toast(message)
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key) => (value) => save({ [key]: value }, 'Setting saved.')

  const saveFx = () => {
    const rates = { USD: Number(fx.USD), AUD: Number(fx.AUD), SAR: Number(fx.SAR) }
    if (![rates.USD, rates.AUD, rates.SAR].every((n) => n > 0)) {
      toast('Enter valid rates greater than zero.', { type: 'error' })
      return
    }
    save({ fxRates: rates }, 'Exchange rates saved.')
  }

  const saveHold = () => {
    const n = Math.max(0, Math.round(Number(holdDays) || 0))
    setHoldDays(String(n))
    save(
      { reservationDays: n },
      n > 0
        ? `Pending sponsorships auto-release after ${n} day${n === 1 ? '' : 's'}.`
        : 'Auto-release turned off.',
    )
  }

  const saveThreshold = (kind) => {
    const raw = kind === 'equipment' ? minEquipment : minLivestock
    const n = Math.max(0, Math.round(Number(raw) || 0))
    if (kind === 'equipment') setMinEquipment(String(n))
    else setMinLivestock(String(n))
    save(
      kind === 'equipment' ? { partialEquipmentMin: n } : { partialLivestockMin: n },
      `Minimum saved — ${kind === 'equipment' ? 'equipment' : 'live stock'} worth ${formatMoney(n, 'PKR')} or more can be partially sponsored.`,
    )
  }

  const fxSample = convertFromPKR(100000, {
    USD: Number(fx.USD),
    AUD: Number(fx.AUD),
    SAR: Number(fx.SAR),
  })

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Settings"
        title="Site settings"
        subtitle="Control how sponsorships behave, edit your Terms & Conditions, exchange rates, and bank accounts."
      />

      <div className="container-x max-w-4xl py-8 sm:py-12">
        <SettingCard icon={ToggleRight} title="Sponsorship experience" description="Turn features on or off across the sponsor journey.">
          <div className="divide-y divide-black/5">
            <Toggle id="multiSelect" icon={ListChecks} checked={settings.multiSelect} onChange={toggle('multiSelect')}
              label="Allow multi-select on the selection page"
              description="When on, sponsors can add several animals or pieces of equipment to one sponsorship via a cart. When off, each card sponsors a single item." />
            <Toggle id="gatherRecipientInfo" icon={UserCog} checked={settings.gatherRecipientInfo} onChange={toggle('gatherRecipientInfo')}
              label="Gather recipient info on confirm"
              description="When on, confirming a sponsorship opens a popup to capture the recipient family’s details. When off, sponsorships confirm directly." />
            <Toggle id="collectOwnerInfo" icon={Building2} checked={settings.collectOwnerInfo} onChange={toggle('collectOwnerInfo')}
              label="Collect owner info on Manage Products"
              description="When on, you can record a villager owner per animal. When off, every animal defaults to IGA Sial Farm ownership." />
            {saving && <p className="mt-2 text-sm text-ink/55">Saving…</p> }
          </div>
        </SettingCard>

        <SettingCard
          icon={HandCoins}
          title="Partial payment"
          description="Let several sponsors share the cost of one item. An item qualifies when the master switch is on, its category is on, and its value is at or above that category’s minimum."
        >
          <div className="divide-y divide-black/5">
            <Toggle
              id="partialEnabled" icon={HandCoins} checked={settings.partialEnabled} onChange={toggle('partialEnabled')}
              label="Enable partial payments"
              description="The master switch. With this off, every sponsorship must cover the item’s full remaining value."
            />
          </div>

          <div className={`mt-5 grid gap-4 sm:grid-cols-2 ${settings.partialEnabled ? '' : 'opacity-50'}`}>
            <CategoryPartial
              icon={Beef}
              title="Live Stock"
              enabled={settings.partialLivestockEnabled}
              onToggle={toggle('partialLivestockEnabled')}
              value={minLivestock}
              onChange={setMinLivestock}
              onSave={() => saveThreshold('livestock')}
              disabled={!settings.partialEnabled}
              inputId="partial-min-livestock"
            />
            <CategoryPartial
              icon={Wrench}
              title="Equipment"
              enabled={settings.partialEquipmentEnabled}
              onToggle={toggle('partialEquipmentEnabled')}
              value={minEquipment}
              onChange={setMinEquipment}
              onSave={() => saveThreshold('equipment')}
              disabled={!settings.partialEnabled}
              inputId="partial-min-equipment"
            />
          </div>

          <p className="mt-4 rounded-xl bg-parchment px-4 py-3 text-sm text-ink/60">
            Eligible items show a “Partial sponsorship available” tag everywhere. Each contribution
            still goes through the same confirmation and auto-release rules, and the item is only
            gifted once its full value is confirmed.
          </p>
        </SettingCard>

        <SettingCard
          icon={CalendarClock}
          title="Reservation hold time"
          description="How long a pending sponsorship is held before its amount is automatically released back to the item."
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:max-w-xs sm:flex-1">
              <label className="field-label" htmlFor="hold-days">Auto-release after (days)</label>
              <input
                id="hold-days" type="number" min="0" step="1" value={holdDays}
                onChange={(e) => setHoldDays(e.target.value)} className="field-input"
              />
            </div>
            <button onClick={saveHold} className="btn-primary btn-md">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Save
            </button>
          </div>
          <p className="mt-3 rounded-xl bg-parchment px-4 py-3 text-sm text-ink/60">
            {Number(holdDays) > 0
              ? `A pending contribution is released automatically ${holdDays} day${Number(holdDays) === 1 ? '' : 's'} after it was reserved, unless it is confirmed first. The freed amount becomes available again immediately.`
              : 'Set to 0 to hold pending sponsorships indefinitely (no auto-release).'}
          </p>
        </SettingCard>

        <SettingCard icon={Coins} title="Exchange rates" description="PKR per 1 unit — used to convert every sponsorship value into USD, AUD, and SAR.">
          <div className="grid gap-4 sm:grid-cols-3">
            {['USD', 'AUD', 'SAR'].map((cur) => (
              <div key={cur}>
                <label className="field-label" htmlFor={`fx-${cur}`}>
                  1 {cur} = ? PKR
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/45">Rs</span>
                  <input
                    id={`fx-${cur}`} type="number" min="0" step="0.1" value={fx[cur]}
                    onChange={(e) => setFx((f) => ({ ...f, [cur]: e.target.value }))}
                    className="field-input pl-9"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-xl bg-parchment px-4 py-3 text-sm text-ink/60">
            Example: {formatMoney(100000, 'PKR')} ≈ {formatMoney(fxSample.USD, 'USD')} · {formatMoney(fxSample.AUD, 'AUD')} · {formatMoney(fxSample.SAR, 'SAR')}
          </p>
          <div className="mt-3 flex justify-end">
            <button onClick={saveFx} className="btn-primary btn-md" disabled={saving}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save rates'}
            </button>
          </div>
        </SettingCard>

        <SettingCard icon={ScrollText} title="Terms & Conditions" description="Shown on the sponsorship page for sponsors to accept.">
          <textarea
            value={terms} onChange={(e) => setTerms(e.target.value)} rows={10}
            className="field-input resize-y whitespace-pre-line font-body text-sm leading-relaxed"
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={() => save({ terms }, 'Terms & Conditions saved.')}
              className="btn-primary btn-md"
              disabled={terms === settings.terms || saving}
            >
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Saving…' : 'Save terms'}
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={Landmark} title="Bank accounts"
          description={`Up to ${MAX_BANKS} accounts appear in the sponsorship page dropdown.`}
          action={
            <button
              onClick={() => {
                if (settings.banks.length >= MAX_BANKS) { toast(`You can add up to ${MAX_BANKS} banks.`, { type: 'info' }); return }
                setBankEditor({ open: true, bank: null })
              }}
              className="btn-primary btn-sm" disabled={settings.banks.length >= MAX_BANKS}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add bank
            </button>
          }
        >
          {settings.banks.length === 0 ? (
            <p className="rounded-2xl bg-parchment px-4 py-6 text-center text-sm text-ink/55">
              No bank accounts yet. Add one so sponsors know where to transfer.
            </p>
          ) : (
            <ul className="space-y-3">
              {settings.banks.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-parchment p-4">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-heading font-semibold text-pine">
                      {b.bankName}
                      {b.currency && <span className="chip bg-brand-50 text-[11px] text-brand-700">{b.currency}</span>}
                    </p>
                    <p className="mt-0.5 text-sm text-ink/55">{b.accountTitle} · {b.accountNumber}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBankEditor({ open: true, bank: b })} className="btn-outline btn-sm">
                      <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (bankBusyId === b.id) return
                        setBankBusyId(b.id)
                        try {
                          await deleteBank(b.id)
                          toast(`${b.bankName} removed.`, { type: 'info' })
                        } catch (e) {
                          toast(e.message, { type: 'error' })
                        } finally {
                          setBankBusyId('')
                        }
                      }}
                      className="btn-sm btn border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400"
                      aria-label={`Delete ${b.bankName}`}
                      disabled={bankBusyId === b.id}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {bankBusyId === b.id ? ' Removing…' : ''}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SettingCard>
      </div>

      {bankEditor.open && (
        <BankEditor
          bank={bankEditor.bank}
          onClose={() => setBankEditor({ open: false, bank: null })}
          onSave={async (data) => {
            try {
              if (bankEditor.bank) { await updateBank(bankEditor.bank.id, data); toast('Bank updated.') }
              else { await addBank(data); toast('Bank added.') }
              setBankEditor({ open: false, bank: null })
            } catch (e) {
              toast(e.message, { type: 'error', duration: 6000 })
            }
          }}
        />
      )}
    </>
  )
}

function CategoryPartial({ icon: Icon, title, enabled, onToggle, value, onChange, onSave, disabled, inputId }) {
  const [focused, setFocused] = useState(false)
  // The threshold only means anything while this category is switched on, so the
  // field and its Save button follow the toggle — not just the master switch.
  const fieldsOff = disabled || !enabled

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${
        fieldsOff ? 'border-black/5 bg-black/[0.03]' : 'border-black/5 bg-parchment'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p
          className={`flex items-center gap-2 font-heading font-semibold transition-opacity ${
            fieldsOff ? 'text-pine/50' : 'text-pine'
          }`}
        >
          <Icon className={`h-4 w-4 ${fieldsOff ? 'text-brand-500/50' : 'text-brand-500'}`} aria-hidden="true" />
          {title}
        </p>
        <button
          type="button" role="switch" aria-checked={enabled} aria-label={`Partial payments for ${title}`}
          onClick={() => onToggle(!enabled)} disabled={disabled}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${
            enabled ? 'bg-brand-500' : 'bg-black/15'
          }`}
        >
          <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
      <label
        className={`field-label mt-4 ${fieldsOff ? 'opacity-50' : ''}`}
        htmlFor={inputId}
      >
        Minimum value (PKR)
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span
            className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
              fieldsOff ? 'text-ink/25' : 'text-ink/45'
            }`}
          >
            Rs
          </span>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            // Grouped while typing; decimals settle on blur so the field stays usable.
            value={formatAmountInput(value, { withDecimals: !focused && value !== '' })}
            disabled={fieldsOff}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(parseAmountInput(e.target.value))}
            className="field-input pl-9 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <button
          onClick={onSave}
          disabled={fieldsOff}
          className="btn-outline btn-md shrink-0 transition-transform duration-100 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100"
        >
          Save
        </button>
      </div>
      <p className={`mt-2 text-xs ${fieldsOff ? 'text-ink/35' : 'text-ink/50'}`}>
        {enabled || disabled
          ? `Only ${title.toLowerCase()} worth this much or more can be partially sponsored.`
          : `Switch ${title.toLowerCase()} on to set its minimum.`}
      </p>
    </div>
  )
}

function SettingCard({ icon: Icon, title, description, action, children }) {
  return (
    <section className="card mb-5 p-4 sm:mb-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-heading text-lg font-semibold text-pine">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink/55">{description}</p>}
          </div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function Toggle({ id, icon: Icon, checked, onChange, label, description }) {
  // `htmlFor` does nothing here: a <button role="switch"> is not a labelable
  // element, so the visible text has to be wired up with aria-labelledby or the
  // switch reaches a screen reader with no accessible name at all.
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3">
        {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />}
        <div>
          <span id={`${id}-label`} className="font-medium text-ink">{label}</span>
          <p id={`${id}-desc`} className="mt-0.5 text-sm text-ink/55">{description}</p>
        </div>
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        aria-labelledby={`${id}-label`} aria-describedby={`${id}-desc`}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${checked ? 'bg-brand-500' : 'bg-black/15'}`}
      >
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
      </button>
    </div>
  )
}

const CURRENCIES = ['PKR', 'USD', 'AUD', 'SAR', 'GBP', 'EUR', 'Other']

function BankEditor({ bank, onClose, onSave }) {
  const [form, setForm] = useState(() => ({
    bankName: bank?.bankName || '',
    accountTitle: bank?.accountTitle || 'IGA Sial Farm',
    accountNumber: bank?.accountNumber || '',
    iban: bank?.iban || '',
    swift: bank?.swift || '',
    branch: bank?.branch || '',
    currency: bank?.currency || 'PKR',
  }))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (ev) => {
    ev.preventDefault()
    if (!form.bankName.trim()) { setError('Bank name is required.'); return }
    setBusy(true)
    try {
      await onSave({
        bankName: form.bankName.trim(), accountTitle: form.accountTitle.trim(),
        accountNumber: form.accountNumber.trim(), iban: form.iban.trim(),
        swift: form.swift.trim(), branch: form.branch.trim(), currency: form.currency,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open onClose={onClose} title={bank ? 'Edit bank account' : 'Add bank account'} size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button type="submit" form="bank-form" className="btn-primary btn-md" disabled={busy}>{busy ? (bank ? 'Saving…' : 'Adding…') : (bank ? 'Save' : 'Add bank')}</button>
        </div>
      }
    >
      <form id="bank-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label">Bank name <span className="text-red-500">*</span></label>
          <input value={form.bankName} onChange={set('bankName')} placeholder="Habib Bank Limited (HBL)" className={`field-input ${error ? 'field-input-invalid' : ''}`} />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        <div>
          <label className="field-label">Account title</label>
          <input value={form.accountTitle} onChange={set('accountTitle')} className="field-input" />
        </div>
        <div>
          <label className="field-label">Currency</label>
          <select value={form.currency} onChange={set('currency')} className="field-input">
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Account number</label>
          <input value={form.accountNumber} onChange={set('accountNumber')} placeholder="0001-79001234567" className="field-input" />
        </div>
        <div>
          <label className="field-label">IBAN</label>
          <input value={form.iban} onChange={set('iban')} placeholder="PK36HABB0001790012345670" className="field-input" />
        </div>
        <div>
          <label className="field-label">SWIFT / BIC</label>
          <input value={form.swift} onChange={set('swift')} placeholder="HABBPKKA" className="field-input" />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Branch</label>
          <input value={form.branch} onChange={set('branch')} placeholder="Waryam Wala, Punjab" className="field-input" />
        </div>
      </form>
    </Modal>
  )
}
