import { useState } from 'react'
import {
  ToggleRight, ScrollText, Landmark, Plus, Pencil, Trash2, DatabaseBackup, AlertTriangle,
  CheckCircle2, Building2, ListChecks, UserCog, Coins, CalendarClock,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { DEFAULT_FX, formatMoney, convertFromPKR } from '../lib/currency.js'

export default function SettingsPage() {
  const { settings, setSettings, addBank, updateBank, deleteBank, resetDemo, MAX_BANKS, dataMode } = useApp()
  const { toast } = useToast()

  const [terms, setTerms] = useState(settings.terms)
  const [fx, setFx] = useState(() => ({
    USD: String(settings.fxRates?.USD ?? DEFAULT_FX.USD),
    AUD: String(settings.fxRates?.AUD ?? DEFAULT_FX.AUD),
    SAR: String(settings.fxRates?.SAR ?? DEFAULT_FX.SAR),
  }))
  const [holdDays, setHoldDays] = useState(String(settings.reservationDays ?? 7))
  const [bankEditor, setBankEditor] = useState({ open: false, bank: null })
  const [confirmReset, setConfirmReset] = useState(false)

  const toggle = (key) => (value) => {
    setSettings({ [key]: value })
    toast('Setting saved.', { type: 'info', duration: 1600 })
  }

  const saveTerms = () => {
    setSettings({ terms })
    toast('Terms & Conditions saved.')
  }

  const saveFx = () => {
    const rates = {
      USD: Number(fx.USD),
      AUD: Number(fx.AUD),
      SAR: Number(fx.SAR),
    }
    if (![rates.USD, rates.AUD, rates.SAR].every((n) => n > 0)) {
      toast('Enter valid rates greater than zero.', { type: 'error' })
      return
    }
    setSettings({ fxRates: rates })
    toast('Exchange rates saved.')
  }

  const saveHold = () => {
    const n = Math.max(0, Math.round(Number(holdDays) || 0))
    setSettings({ reservationDays: n })
    setHoldDays(String(n))
    toast(n > 0 ? `Reserved animals auto-release after ${n} day${n === 1 ? '' : 's'}.` : 'Auto-release turned off.')
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
        subtitle="Control how donations behave, edit your Terms & Conditions, exchange rates, and bank accounts."
      />

      <div className="container-x max-w-4xl py-8 sm:py-12">
        <SettingCard icon={ToggleRight} title="Donation experience" description="Turn features on or off across the donor journey.">
          <div className="divide-y divide-black/5">
            <Toggle id="multiSelect" icon={ListChecks} checked={settings.multiSelect} onChange={toggle('multiSelect')}
              label="Allow multi-select on Animal Selection"
              description="When on, donors can add several animals to one donation via a cart. When off, each card donates a single animal." />
            <Toggle id="gatherRecipientInfo" icon={UserCog} checked={settings.gatherRecipientInfo} onChange={toggle('gatherRecipientInfo')}
              label="Gather recipient info on confirm"
              description="When on, confirming a donation opens a popup to capture the recipient family’s details. When off, donations confirm directly." />
            <Toggle id="collectOwnerInfo" icon={Building2} checked={settings.collectOwnerInfo} onChange={toggle('collectOwnerInfo')}
              label="Collect owner info on Manage Products"
              description="When on, you can record a villager owner per animal. When off, every animal defaults to IGA Sial Farm ownership." />
          </div>
        </SettingCard>

        <SettingCard
          icon={CalendarClock}
          title="Reservation hold time"
          description="How long a reserved animal is held before it automatically returns to Available if the donation isn't confirmed."
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
              ? `A reserved animal returns to Available automatically ${holdDays} day${Number(holdDays) === 1 ? '' : 's'} after it was reserved, unless the donation is confirmed first.`
              : 'Set to 0 to hold reserved animals indefinitely (no auto-release).'}
          </p>
        </SettingCard>

        <SettingCard icon={Coins} title="Exchange rates" description="PKR per 1 unit — used to convert every donation value into USD, AUD, and SAR.">
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
            <button onClick={saveFx} className="btn-primary btn-md">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Save rates
            </button>
          </div>
        </SettingCard>

        <SettingCard icon={ScrollText} title="Terms & Conditions" description="Shown on the donation page for donors to accept.">
          <textarea
            value={terms} onChange={(e) => setTerms(e.target.value)} rows={10}
            className="field-input resize-y whitespace-pre-line font-body text-sm leading-relaxed"
          />
          <div className="mt-3 flex justify-end">
            <button onClick={saveTerms} className="btn-primary btn-md" disabled={terms === settings.terms}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              Save terms
            </button>
          </div>
        </SettingCard>

        <SettingCard
          icon={Landmark} title="Bank accounts"
          description={`Up to ${MAX_BANKS} accounts appear in the donation page dropdown.`}
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
              No bank accounts yet. Add one so donors know where to transfer.
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
                      onClick={() => { deleteBank(b.id); toast(`${b.bankName} removed.`, { type: 'info' }) }}
                      className="btn-sm btn border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400"
                      aria-label={`Delete ${b.bankName}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SettingCard>

        <SettingCard icon={DatabaseBackup} title="Demo data" description="Reset all products, settings, and donation records back to the original demo content.">
          <button
            onClick={() => setConfirmReset(true)}
            className="btn-md btn border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400"
          >
            <DatabaseBackup className="h-4 w-4" aria-hidden="true" />
            Reset demo data
          </button>
        </SettingCard>
      </div>

      {bankEditor.open && (
        <BankEditor
          bank={bankEditor.bank}
          onClose={() => setBankEditor({ open: false, bank: null })}
          onSave={(data) => {
            if (bankEditor.bank) { updateBank(bankEditor.bank.id, data); toast('Bank updated.') }
            else { addBank(data); toast('Bank added.') }
            setBankEditor({ open: false, bank: null })
          }}
        />
      )}

      <Modal
        open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data" size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmReset(false)} className="btn-ghost btn-md">Cancel</button>
            <button
              onClick={() => {
                resetDemo()
                setConfirmReset(false)
                toast('Demo data has been reset.')
                setTimeout(() => window.location.reload(), dataMode === 'firebase' ? 1200 : 400)
              }}
              className="btn-md btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
            >
              Reset everything
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="text-ink/75">
            This restores the five demo animals and default settings, and clears all reservations and
            donation records.{dataMode === 'firebase' ? ' Because you’re in global mode, this affects the live site for everyone.' : ''} This can’t be undone.
          </p>
        </div>
      </Modal>
    </>
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
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="flex gap-3">
        {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-400" aria-hidden="true" />}
        <div>
          <label htmlFor={id} className="font-medium text-ink">{label}</label>
          <p className="mt-0.5 text-sm text-ink/55">{description}</p>
        </div>
      </div>
      <button
        id={id} type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
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
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (ev) => {
    ev.preventDefault()
    if (!form.bankName.trim()) { setError('Bank name is required.'); return }
    onSave({
      bankName: form.bankName.trim(), accountTitle: form.accountTitle.trim(),
      accountNumber: form.accountNumber.trim(), iban: form.iban.trim(),
      swift: form.swift.trim(), branch: form.branch.trim(), currency: form.currency,
    })
  }

  return (
    <Modal
      open onClose={onClose} title={bank ? 'Edit bank account' : 'Add bank account'} size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost btn-md">Cancel</button>
          <button type="submit" form="bank-form" className="btn-primary btn-md">{bank ? 'Save' : 'Add bank'}</button>
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
