import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck, XCircle, ClipboardCheck, Wrench,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { fullName, formatDateTime, formatCNIC, formatMobile } from '../lib/helpers.js'
import { formatMoney } from '../lib/currency.js'
import SponsorshipSummaryCard from '../components/SponsorshipSummaryCard.jsx'

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
    sponsorships, settings, productById, remainingOf, confirmSponsorship, cancelSponsorship, updateSponsorship, updateProduct, loading,
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
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState({ open: false, sponsorship: null })
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT)
  const [errors, setErrors] = useState({})
  const [editErrors, setEditErrors] = useState({})
  const [confirmingId, setConfirmingId] = useState(null)
  const [cancellingId, setCancellingId] = useState(null)
  const [recipientBusy, setRecipientBusy] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, sponsorship: null })
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', email: '', phone: '', productName: '' })
  const [editBusy, setEditBusy] = useState(false)

  const filteredPending = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return pending

    return pending.filter((s) => {
      const product = productById(s.productId)
      const haystack = [
        product?.name,
        product?.assetId,
        product?.type,
        product?.breed,
        fullName(s.donor),
        s.donor?.email,
        s.donor?.phone,
        s.id,
        s.productId,
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [pending, productById, search])

  const filteredConfirmedInProgress = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return confirmedInProgress

    return confirmedInProgress.filter((s) => {
      const product = productById(s.productId)
      const haystack = [
        product?.name,
        product?.assetId,
        product?.type,
        product?.breed,
        fullName(s.donor),
        s.donor?.email,
        s.donor?.phone,
        s.id,
        s.productId,
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [confirmedInProgress, productById, search])

  const confirmedGroups = useMemo(() => {
    const groups = new Map()
    for (const s of confirmedInProgress) {
      if (!groups.has(s.productId)) {
        groups.set(s.productId, {
          productId: s.productId,
          product: productById(s.productId),
          remaining: remainingOf(s.productId),
          sponsors: [],
        })
      }
      groups.get(s.productId).sponsors.push(s)
    }
    return Array.from(groups.values())
  }, [confirmedInProgress, productById, remainingOf])

  const filteredConfirmedGroups = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return confirmedGroups

    return confirmedGroups.filter(({ product, sponsors }) => {
      const haystack = [
        product?.name,
        product?.assetId,
        product?.type,
        product?.breed,
        ...sponsors.map((s) => [fullName(s.donor), s.donor?.email, s.donor?.phone, formatMoney(s.amountPKR, 'PKR')].filter(Boolean).join(' ')),
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [confirmedGroups, productById, search])

  const totalPages = Math.max(1, Math.ceil(filteredPending.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  useEffect(() => setPage(1), [search])

  const pageItems = useMemo(
    () => filteredPending.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filteredPending, page],
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
        <div className="mb-6">
          <label className="field-label">Search sponsorships</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by sponsor, email, mobile, item or asset ID"
            className="field-input"
          />
        </div>

        {filteredPending.length === 0 ? (
          <EmptyState
            icon={ClipboardCheck}
            title={search ? 'No sponsorships matched your search' : 'Nothing awaiting confirmation'}
            description={
              search
                ? 'Try a different keyword or clear the search to view all pending sponsorships.'
                : 'When a sponsor completes the form, their contribution appears here for you to confirm.'
            }
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
                    productName: productById(s.productId)?.name || '',
                  })
                  setEditModal({ open: true, sponsorship: s })
                  setEditErrors({})
                }}
                confirming={confirmingId === s.id}
                cancelling={cancellingId === s.id}
              />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}

        {filteredConfirmedGroups.length > 0 && (
          <section className="mt-12">
            <h2 className="font-heading text-lg font-semibold text-pine">
              Confirmed, still collecting
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-ink/55">
              Money already received on items that are not yet fully sponsored. These move to
              Sponsorships made once their full value is confirmed.
            </p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredConfirmedGroups.map(({ product, sponsors, remaining, productId }) => (
                <ConfirmedGroupCard
                  key={productId}
                  product={product}
                  remaining={remaining}
                  sponsors={sponsors}
                  onEdit={sponsors[0] ? () => {
                    const s = sponsors[0]
                    setEditForm({
                      firstName: s.donor?.firstName || '',
                      lastName: s.donor?.lastName || '',
                      email: s.donor?.email || '',
                      phone: s.donor?.phone || '',
                      productName: product?.name || '',
                    })
                    setEditModal({ open: true, sponsorship: s })
                    setEditErrors({})
                  } : undefined}
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
          if (!editForm.productName.trim()) e.productName = 'Item name is required.'
          setEditErrors(e)
          if (Object.keys(e).length) return
          setEditBusy(true)
          try {
            const product = productById(editModal.sponsorship.productId)
            const nextProductName = editForm.productName.trim()
            if (product && nextProductName && product.name !== nextProductName) {
              await updateProduct(product.id, { ...product, name: nextProductName })
            }
            await updateSponsorship(editModal.sponsorship.id, { donor: {
              firstName: editForm.firstName.trim(), lastName: editForm.lastName.trim(), email: editForm.email.trim(), phone: editForm.phone.trim()
            } })
            toast('Donor and item details updated.')
            setEditModal({ open: false, sponsorship: null })
          } catch (err) {
            toast(err.message, { type: 'error', duration: 6000 })
          } finally {
            setEditBusy(false)
          }
        }} noValidate className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <RField label="First name" value={editForm.firstName} onChange={(ev) => setEditForm((f) => ({ ...f, firstName: ev.target.value }))} error={editErrors.firstName} required />
            <RField label="Last name" value={editForm.lastName} onChange={(ev) => setEditForm((f) => ({ ...f, lastName: ev.target.value }))} error={editErrors.lastName} required />
          </div>
          <RField label="Item name" value={editForm.productName} onChange={(ev) => setEditForm((f) => ({ ...f, productName: ev.target.value }))} error={editErrors.productName} required />
          <RField label="Mobile number" type="tel" value={editForm.phone} onChange={(ev) => setEditForm((f) => ({ ...f, phone: ev.target.value }))} />
          <RField label="Email" type="email" value={editForm.email} onChange={(ev) => setEditForm((f) => ({ ...f, email: ev.target.value }))} />
        </form>
      </Modal>
    </>
  )
}

// Deliberately compact: no hero image and no lightbox — just thumbnails that
// magnify on hover, so a long queue stays scannable.
function ConfirmationCard({ sponsorship: s, product, remaining, holdLabel, onConfirm, onCancel, onEdit, confirming = false, cancelling = false }) {
  return (
    <SponsorshipSummaryCard
      product={product}
      sponsorships={[s]}
      remaining={remaining}
      status="pending"
      footer={onConfirm ? <div className="mt-3 grid grid-cols-3 gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
                        title="Edit donor"
                        aria-label="Edit donor"
                        className="btn-ghost btn-sm p-2"
                        disabled={confirming || cancelling}
                      >
                        <Wrench className="h-4 w-4" aria-hidden="true" />
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
        </div> : <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700"><BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />Confirmed{s.confirmedAt ? ` ${formatDateTime(s.confirmedAt)}` : ''}</p>}
    />
  )
}

function ConfirmedGroupCard({ product, sponsors, remaining, onEdit }) {
  return (
    <SponsorshipSummaryCard
      product={product}
      sponsorships={sponsors}
      remaining={remaining}
      status="confirmed"
      footer={onEdit && (
        <button type="button" onClick={onEdit} className="btn-ghost btn-sm mt-3 w-full" aria-label="Edit donor">
          Edit donor
        </button>
      )}
    />
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
