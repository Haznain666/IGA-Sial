import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck, XCircle, User2, Mail, Phone, Clock, ClipboardCheck, Timer, HandCoins, Wrench, Beef,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { fullName, formatDateTime, formatCNIC, formatMobile } from '../lib/helpers.js'
import { formatMoney } from '../lib/currency.js'
import { imageUrl, imageStyle } from '../lib/images.js'

const PER_PAGE = 6
const EMPTY_RECIPIENT = { firstName: '', lastName: '', cnic: '', phone: '', email: '' }

function daysLeftLabel(reservedAt, days) {
  const n = Number(days) || 0
  if (n <= 0 || !reservedAt) return null
  const expiry = new Date(reservedAt).getTime() + n * 86400000
  if (!Number.isFinite(expiry)) return null
  const d = Math.ceil((expiry - Date.now()) / 86400000)
  return d > 0 ? `Auto-releases in ${d} day${d === 1 ? '' : 's'}` : 'Releasing shortly'
}

export default function ConfirmSponsorships() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const {
    sponsorships, settings, productById, remainingOf, confirmSponsorship, cancelSponsorship, updateSponsorship, loading,
  } = useApp()

  const pending = useMemo(
    () => sponsorships.filter((s) => s.status === 'pending'),
    [sponsorships],
  )

  // Confirmed money on an item that is NOT yet fully sponsored used to vanish
  // from Super Admin entirely: it left this page (no longer pending) but had not
  // reached Sponsorships Made (which only lists fully sponsored items). Show it
  // here as a read-only record so every confirmed contribution stays visible.
  const confirmedInProgress = useMemo(
    () =>
      sponsorships.filter(
        (s) => s.status === 'confirmed' && remainingOf(s.productId) > 0,
      ),
    [sponsorships, remainingOf],
  )

  const [page, setPage] = useState(1)
  const [modal, setModal] = useState({ open: false, sponsorship: null })
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT)
  const [errors, setErrors] = useState({})
  const [confirmingId, setConfirmingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [recipientBusy, setRecipientBusy] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, sponsorship: null })
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [editBusy, setEditBusy] = useState(false)

  const totalPages = Math.max(1, Math.ceil(pending.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(
    () => pending.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [pending, page],
  )

  const startConfirm = async (s) => {
    // prevent double-clicking confirm
    if (confirmingId === s.id) return
    if (settings.gatherRecipientInfo) {
      setRecipient(EMPTY_RECIPIENT)
      setErrors({})
      setModal({ open: true, sponsorship: s })
      return
    }
    setConfirmingId(s.id)
    try {
      await confirmSponsorship(s.id, null)
      toast('Sponsorship confirmed. Thank you!')
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setConfirmingId(null)
    }
  }

  const submitRecipient = async (ev) => {
    ev.preventDefault()
    if (recipientBusy) return
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
    setRecipientBusy(true)
    try {
      await confirmSponsorship(modal.sponsorship.id, clean)
      toast(`Sponsorship confirmed for ${fullName(clean)}.`)
      setModal({ open: false, sponsorship: null })
    } catch (err) {
      toast(err.message, { type: 'error', duration: 6000 })
    } finally {
      setRecipientBusy(false)
    }
  }

  const cancel = async (s, product) => {
    if (cancellingId === s.id) return
    setCancellingId(s.id)
    try {
      await cancelSponsorship(s.id)
      toast(`${product?.name || 'That item'} has been released and is available again.`, { type: 'info' })
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setCancellingId(null)
    }
  }

  // `format` masks the value as it is typed (CNIC / mobile).
  const setR = (key, format) => (ev) => {
    const raw = ev.target.value
    const next = format ? format(raw) : raw
    setRecipient((r) => ({ ...r, [key]: next }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
  }

  if (loading) {
    return (
      <>
        <PageHeader
          hideBack
          eyebrow="Confirm sponsorships"
          title="Pending sponsorships"
          subtitle="Each contribution waiting on a transfer. Confirm it once the money arrives, or cancel to free the amount back up."
          actions={
            <button onClick={() => navigate('/super-admin/sponsorships')} className="btn-outline btn-md">
              <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              Sponsorships made
            </button>
          }
        />

        <div className="container-x py-10 sm:py-12">
          <div className="flex items-center justify-center py-16">
            <svg className="h-6 w-6 animate-spin text-ink/60" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
            <span className="ml-3 text-ink/70">Loading…</span>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Confirm sponsorships"
        title="Pending sponsorships"
        subtitle="Each contribution waiting on a transfer. Confirm it once the money arrives, or cancel to free the amount back up."
        actions={
          <button onClick={() => navigate('/super-admin/sponsorships')} className="btn-outline btn-md">
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            Sponsorships made
          </button>
        }
      />

      <div className="container-x py-10 sm:py-12">
        {pending.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title="Nothing awaiting confirmation"
            description="When a sponsor completes the form, their contribution appears here for you to confirm."
            action={
              <button onClick={() => navigate('/select')} className="btn-primary btn-md">
                Go to sponsorship selection
              </button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((s) => (
                <ConfirmationCard
                  key={s.id}
                  sponsorship={s}
                  product={productById(s.productId)}
                  remaining={remainingOf(s.productId)}
                  holdLabel={daysLeftLabel(s.reservedAt, settings.reservationDays)}
                  onConfirm={() => startConfirm(s)}
                  onCancel={() => cancel(s, productById(s.productId))}
                onEdit={() => {
                  setEditForm({
                    firstName: s.donor?.firstName || '',
                    lastName: s.donor?.lastName || '',
                    email: s.donor?.email || '',
                    phone: s.donor?.phone || '',
                  })
                  setEditModal({ open: true, sponsorship: s })
                }}
                confirming={confirmingId === s.id}
                cancelling={cancellingId === s.id}
              />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}

        {confirmedInProgress.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-lg font-semibold text-pine">
              Confirmed, still collecting
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/55">
              Money already received on items that are not yet fully sponsored. These move to
              Sponsorships made once their full value is confirmed.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {confirmedInProgress.map((s) => (
                <ConfirmationCard
                  key={s.id}
                  sponsorship={s}
                  product={productById(s.productId)}
                  remaining={remainingOf(s.productId)}
                  onEdit={() => {
                    setEditForm({
                      firstName: s.donor?.firstName || '',
                      lastName: s.donor?.lastName || '',
                      email: s.donor?.email || '',
                      phone: s.donor?.phone || '',
                    })
                    setEditModal({ open: true, sponsorship: s })
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, sponsorship: null })}
        title="Recipient details"
        description={
          modal.sponsorship
            ? `Who will receive ${productById(modal.sponsorship.productId)?.name || 'this item'}?`
            : ''
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal({ open: false, sponsorship: null })}
              className="btn-ghost btn-md"
              disabled={recipientBusy}
            >
              Cancel
            </button>
            <button type="submit" form="recipient-form" className="btn-primary btn-md" disabled={recipientBusy}>
              <BadgeCheck className="h-4 w-4" aria-hidden="true" />
              {recipientBusy ? 'Confirming…' : 'Confirm sponsorship'}
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
          <RField
            label="CNIC number"
            value={recipient.cnic}
            onChange={setR('cnic', formatCNIC)}
            placeholder="35202-1234567-8"
            inputMode="numeric"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <RField
              label="Mobile number"
              type="tel"
              value={recipient.phone}
              onChange={setR('phone', formatMobile)}
              placeholder="0300-123 4567"
              inputMode="numeric"
            />
            <RField label="Email" type="email" value={recipient.email} onChange={setR('email')} placeholder="name@example.com" />
          </div>
        </form>
      </Modal>

      {/* Edit donor modal */}
      <Modal
        open={editModal.open}
        onClose={() => setEditModal({ open: false, sponsorship: null })}
        title="Edit sponsorship donor"
        description={editModal.sponsorship ? `Edit donor for ${productById(editModal.sponsorship.productId)?.name || ''}` : ''}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditModal({ open: false, sponsorship: null })} className="btn-ghost btn-md" disabled={editBusy}>Cancel</button>
            <button type="submit" form="edit-donor-form" className="btn-primary btn-md" disabled={editBusy}>{editBusy ? 'Saving…' : 'Save'}</button>
          </div>
        }
      >
        <form id="edit-donor-form" onSubmit={async (ev) => {
          ev.preventDefault()
          if (editBusy) return
          const e = {}
          if (!editForm.firstName.trim()) e.firstName = 'First name is required.'
          if (!editForm.lastName.trim()) e.lastName = 'Last name is required.'
          setErrors(e)
          if (Object.keys(e).length) return
          setEditBusy(true)
          try {
            await updateSponsorship(editModal.sponsorship.id, { donor: {
              firstName: editForm.firstName.trim(), lastName: editForm.lastName.trim(), email: editForm.email.trim(), phone: editForm.phone.trim()
            } })
            toast('Donor updated.')
            setEditModal({ open: false, sponsorship: null })
          } catch (err) {
            toast(err.message, { type: 'error', duration: 6000 })
          } finally {
            setEditBusy(false)
          }
        }} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <RField label="First name" value={editForm.firstName} onChange={(v) => setEditForm((f) => ({ ...f, firstName: v }))} error={errors.firstName} required />
            <RField label="Last name" value={editForm.lastName} onChange={(v) => setEditForm((f) => ({ ...f, lastName: v }))} error={errors.lastName} required />
          </div>
          <RField label="Mobile number" type="tel" value={editForm.phone} onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))} />
          <RField label="Email" type="email" value={editForm.email} onChange={(v) => setEditForm((f) => ({ ...f, email: v }))} />
        </form>
      </Modal>
    </>
  )
}

// Deliberately compact: no hero image and no lightbox — just thumbnails that
// magnify on hover, so a long queue stays scannable.
function ConfirmationCard({ sponsorship: s, product, remaining, holdLabel, onConfirm, onCancel, onEdit, confirming = false, cancelling = false }) {
  const [preview, setPreview] = useState(null)
  const images = product?.images || []
  const isEquipment = product?.kind === 'equipment'
  const Icon = isEquipment ? Wrench : Beef
  const donor = s.donor

  return (
    <article className="card flex flex-col p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-pine">
            {product?.name || 'Unknown item'}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/50">
            <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            {isEquipment ? 'Equipment' : product?.type || 'Live Stock'}
          </p>
        </div>
        {s.isPartial && (
          <span className="chip shrink-0 bg-gold-100 text-[11px] font-semibold text-gold-800">
            <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
            Partial
          </span>
        )}
      </div>

      {/* Thumbnails with hover magnifier */}
      <div className="relative mt-3 flex gap-1.5">
        {images.slice(0, 5).map((img, i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setPreview(i)}
            onMouseLeave={() => setPreview(null)}
            onFocus={() => setPreview(i)}
            onBlur={() => setPreview(null)}
            className="h-11 w-9 shrink-0 overflow-hidden rounded-lg border border-black/5 transition-transform hover:scale-105"
            aria-label={`Preview photo ${i + 1}`}
          >
            <img src={imageUrl(img)} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
        {preview !== null && images[preview] && (
          <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 h-56 w-[180px] overflow-hidden rounded-2xl border border-black/10 bg-sand shadow-lift">
            <img
              src={imageUrl(images[preview])}
              alt=""
              style={imageStyle(images[preview])}
              className="h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-lg font-semibold tabular-nums text-brand-600">
          {formatMoney(s.amountPKR, 'PKR')}
        </span>
        <span className="text-xs text-ink/45">of {formatMoney(product?.valuePKR || 0, 'PKR')}</span>
        {remaining > 0 && (
          <span className="text-xs font-medium text-ink/55">· {formatMoney(remaining, 'PKR')} still open</span>
        )}
      </div>

      <div className="mt-3 rounded-xl bg-parchment p-3 text-sm">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink/45">Sponsor</p>
        <p className="flex items-center gap-1.5 truncate font-medium text-ink">
          <User2 className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
          {fullName(donor) || '—'}
        </p>
        {donor?.email && (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink/60">
            <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
            {donor.email}
          </p>
        )}
        {donor?.phone && (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink/60">
            <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
            {donor.phone}
          </p>
        )}
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink/45">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Reserved {formatDateTime(s.reservedAt)}
        </p>
        {holdLabel && (
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-gold-700">
            <Timer className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {holdLabel}
          </p>
        )}
      </div>

      {onConfirm ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="btn-sm btn-ghost transition-transform duration-100 active:scale-95"
              disabled={confirming || cancelling}
            >
              <Wrench className="h-4 w-4" aria-hidden="true" />
              Edit
            </button>
          )}
          <button
            onClick={onConfirm}
            className="btn-primary btn-sm transition-transform duration-100 active:scale-95"
            disabled={confirming}
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            {confirming ? 'Confirming…' : 'Confirm'}
          </button>
          <button
            onClick={onCancel}
            className="btn-sm btn border border-red-200 bg-white text-red-600 transition-transform duration-100 hover:bg-red-50 focus-visible:ring-red-400 active:scale-95"
            disabled={cancelling}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      ) : (
        // Read-only record of money already confirmed on an unfinished item.
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Confirmed{s.confirmedAt ? ` ${formatDateTime(s.confirmedAt)}` : ''}
        </p>
      )}
    </article>
  )
}

function RField({ label, value, onChange, error, type = 'text', placeholder, required, inputMode }) {
  return (
    <div>
      <label className="field-label">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        type={type}
        inputMode={inputMode}
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
