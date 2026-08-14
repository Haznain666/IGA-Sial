import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, XCircle, User2, Mail, Phone, Clock, ClipboardCheck, ArrowRight, Timer } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import AnimalCard from '../components/AnimalCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { fullName, formatDateTime } from '../lib/helpers.js'

const EMPTY_RECIPIENT = { firstName: '', lastName: '', cnic: '', phone: '', email: '' }

function daysLeftLabel(reservedAt, days) {
  const n = Number(days) || 0
  if (n <= 0 || !reservedAt) return null
  const expiry = new Date(reservedAt).getTime() + n * 86400000
  if (!Number.isFinite(expiry)) return null
  const d = Math.ceil((expiry - Date.now()) / 86400000)
  return d > 0 ? `Auto-releases in ${d} day${d === 1 ? '' : 's'}` : 'Releasing shortly'
}

export default function ConfirmDonation() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { reservedProducts, settings, confirmDonation, cancelReservation } = useApp()

  const [modal, setModal] = useState({ open: false, product: null })
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT)
  const [errors, setErrors] = useState({})

  const startConfirm = (product) => {
    if (settings.gatherRecipientInfo) {
      setRecipient(EMPTY_RECIPIENT)
      setErrors({})
      setModal({ open: true, product })
    } else {
      confirmDonation(product.id, null)
      toast(`${product.name}’s donation is confirmed. Thank you!`)
    }
  }

  const submitRecipient = (ev) => {
    ev.preventDefault()
    const e = {}
    if (!recipient.firstName.trim()) e.firstName = 'First name is required.'
    if (!recipient.lastName.trim()) e.lastName = 'Last name is required.'
    setErrors(e)
    if (Object.keys(e).length) return
    const clean = {
      firstName: recipient.firstName.trim(),
      lastName: recipient.lastName.trim(),
      cnic: recipient.cnic.trim(),
      phone: recipient.phone.trim(),
      email: recipient.email.trim(),
    }
    confirmDonation(modal.product.id, clean)
    toast(`${modal.product.name}’s donation is confirmed for ${fullName(clean)}.`)
    setModal({ open: false, product: null })
  }

  const cancel = (product) => {
    cancelReservation(product.id)
    toast(`${product.name} has been released and is available again.`, { type: 'info' })
  }

  const setR = (key) => (ev) => {
    setRecipient((r) => ({ ...r, [key]: ev.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Confirm donation"
        title="Reserved animals"
        subtitle="These animals are reserved and hidden from the public site. Confirm each donation once the transfer is complete, or cancel to release the animal."
        actions={
          <button onClick={() => navigate('/super-admin/donations')} className="btn-outline btn-md">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Donations made
          </button>
        }
      />

      <div className="container-x py-10 sm:py-12">
        {reservedProducts.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="No reserved animals"
            description="When a donor completes the donation form, the animals they choose appear here for you to confirm."
            action={
              <button onClick={() => navigate('/select')} className="btn-primary btn-md">
                Go to animal selection
              </button>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reservedProducts.map((p) => {
              const donor = p.reservation?.donor
              const holdLabel = daysLeftLabel(p.reservation?.reservedAt, settings.reservationDays)
              return (
                <AnimalCard
                  key={p.id}
                  product={p}
                  showOwner={false}
                  footer={
                    <div className="space-y-4">
                      <div className="rounded-2xl bg-parchment p-3 text-sm">
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink/45">
                          Donor
                        </p>
                        <p className="flex items-center gap-1.5 font-medium text-ink">
                          <User2 className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                          {fullName(donor) || '—'}
                        </p>
                        {donor?.email && (
                          <p className="mt-1 flex items-center gap-1.5 text-ink/60">
                            <Mail className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
                            {donor.email}
                          </p>
                        )}
                        {donor?.phone && (
                          <p className="mt-1 flex items-center gap-1.5 text-ink/60">
                            <Phone className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
                            {donor.phone}
                          </p>
                        )}
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/45">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          Reserved {formatDateTime(p.reservation?.reservedAt)}
                        </p>
                        {holdLabel && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-gold-700">
                            <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                            {holdLabel}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => startConfirm(p)} className="btn-primary btn-sm">
                          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
                          Confirm
                        </button>
                        <button
                          onClick={() => cancel(p)}
                          className="btn-sm btn border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:ring-red-400"
                        >
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, product: null })}
        title="Recipient details"
        description={modal.product ? `Who will receive ${modal.product.name}?` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal({ open: false, product: null })}
              className="btn-ghost btn-md"
            >
              Cancel
            </button>
            <button type="submit" form="recipient-form" className="btn-primary btn-md">
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              Confirm donation
            </button>
          </div>
        }
      >
        <form id="recipient-form" onSubmit={submitRecipient} noValidate className="grid gap-4">
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Only the recipient’s first and last name are required. All other fields are optional.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <RField label="First name" value={recipient.firstName} onChange={setR('firstName')} error={errors.firstName} required />
            <RField label="Last name" value={recipient.lastName} onChange={setR('lastName')} error={errors.lastName} required />
          </div>
          <RField label="CNIC number" value={recipient.cnic} onChange={setR('cnic')} placeholder="35202-1234567-8" />
          <div className="grid gap-4 sm:grid-cols-2">
            <RField label="Phone number" type="tel" value={recipient.phone} onChange={setR('phone')} placeholder="+92 300 1234567" />
            <RField label="Email" type="email" value={recipient.email} onChange={setR('email')} placeholder="name@example.com" />
          </div>
        </form>
      </Modal>
    </>
  )
}

function RField({ label, value, onChange, error, type = 'text', placeholder, required }) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
