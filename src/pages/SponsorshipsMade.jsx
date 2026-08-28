import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScrollText, User2, Gift, HeartHandshake, Mail, Phone, Fingerprint, Landmark, Calendar,
  Wrench, Beef, Users, Trash2, AlertTriangle,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Modal from '../components/Modal.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useApp } from '../store/AppContext.jsx'
import { useToast } from '../store/ToastContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { fullName, formatDateTime } from '../lib/helpers.js'

// A product appears here exactly once, and only once it is FULLY sponsored with
// every contribution confirmed. The card then lists every sponsor who chipped in.
export default function SponsorshipsMade() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { completedProducts, sponsorsOf, bankById, loading, deleteProduct } = useApp()
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return completedProducts

    return completedProducts.filter((product) => {
      const haystack = [
        product.name,
        product.assetId,
        product.type,
        product.breed,
        product.kind,
        ...sponsorsOf(product.id).map((s) => [
          fullName(s.donor),
          s.donor?.email,
          s.donor?.phone,
          s.id,
        ].filter(Boolean).join(' ')),
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [completedProducts, search, sponsorsOf])

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleteBusy(true)
    try {
      await deleteProduct(confirmDelete.id)
      toast(`${confirmDelete.name} was removed.`, { type: 'info' })
      setConfirmDelete(null)
    } catch (e) {
      toast(e.message, { type: 'error', duration: 6000 })
    } finally {
      setDeleteBusy(false)
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader hideBack eyebrow="Sponsorships made" title="Completed sponsorships" />
        <div className="container-x py-12">
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

  const totalPKR = completedProducts.reduce((sum, p) => sum + (Number(p.valuePKR) || 0), 0)
  const exportCsv = () => {
    const fields = ['Product ID', 'Asset ID', 'Sponsor ID', 'Sponsor Name', 'Contact Number', 'Contact Email', 'Sponsored Amount', 'Sponsorship Date']
    const rows = completedProducts.flatMap((product) =>
      sponsorsOf(product.id).filter((s) => s.status === 'confirmed').map((s) => [
        product.id,
        product.assetId || '',
        s.donor?.id || s.id,
        fullName(s.donor) || 'Anonymous',
        s.donor?.phone || '',
        s.donor?.email || '',
        s.amountPKR,
        s.confirmedAt || s.createdAt || '',
      ]),
    )
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const csv = [fields, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `sponsored-assets-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Sponsorships made"
        title="Completed sponsorships"
        subtitle="Every fully sponsored animal and piece of equipment, with the sponsor details and contribution history."
        actions={
          <div className="flex flex-wrap gap-2">
            <button onClick={exportCsv} className="btn-outline btn-md">Download CSV</button>
            <button onClick={() => navigate('/super-admin/confirmations')} className="btn-outline btn-md">Confirm sponsorships</button>
          </div>
        }
      />

      <div className="container-x py-10 sm:py-12">
        <div className="mb-6">
          <label className="field-label">Search completed sponsorships</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, asset ID, sponsor name or phone"
            className="field-input"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={search ? 'No completed sponsorships matched your search' : 'No completed sponsorships yet'}
            description={
              search
                ? 'Try a different keyword or clear the search to view all completed sponsorships.'
                : 'Once every contribution towards an item is confirmed, it appears here with full sponsor and recipient details.'
            }
            action={
              <button onClick={() => navigate('/super-admin/confirmations')} className="btn-primary btn-md">
                Go to confirmations
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Sponsorships completed" value={filteredProducts.length} icon={HeartHandshake} />
              <StatCard label="Total value sponsored" value={formatMoney(filteredProducts.reduce((sum, p) => sum + (Number(p.valuePKR) || 0), 0), 'PKR')} icon={Gift} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((p) => {
                const sponsors = sponsorsOf(p.id)
                const lastConfirmed = sponsors
                  .map((s) => s.confirmedAt)
                  .filter(Boolean)
                  .sort()
                  .pop()

                return (
                  <ProductCard
                    key={p.id}
                    product={p}
                    showOwner={false}
                    footer={
                      <div className="space-y-3 relative">
                        <div className="flex items-center gap-2 text-xs text-ink/60">
                          <Users className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                          <span>{sponsors.length} {sponsors.length === 1 ? 'sponsor' : 'sponsors'}</span>
                          {lastConfirmed && <span>· {formatDateTime(lastConfirmed)}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(p)}
                          className="absolute right-0 bottom-0 flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                          aria-label={`Delete ${p.name}`}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    }
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete sponsored item"
        description="This will remove the item from the sponsored list."
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmDelete(null)} className="btn-md btn border border-red-200 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500" disabled={deleteBusy}>
              Cancel
            </button>
            <button type="button" onClick={handleDelete} className="btn-primary btn-md" disabled={deleteBusy}>
              {deleteBusy ? 'Deleting…' : 'Sure'}
            </button>
          </div>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="text-ink/75">
            Are you sure you want to delete this sponsored item?
            <span className="mt-2 block font-semibold text-ink">
              {confirmDelete?.name || 'Item'}
              {confirmDelete?.assetId ? ` · ${confirmDelete.assetId}` : ''}
            </span>
          </p>
        </div>
      </Modal>
    </>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-ink/55">{label}</p>
        <p className="truncate font-heading text-2xl font-bold text-pine">{value}</p>
      </div>
    </div>
  )
}
