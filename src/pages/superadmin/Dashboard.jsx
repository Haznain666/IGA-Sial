import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PackageSearch, ClipboardCheck, ScrollText, Settings, Heart, CircleDot, CheckCircle2, Gift,
  ArrowRight, Users, Trash2, AlertTriangle,
} from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { formatMoney } from '../../lib/currency.js'
import ProductCard from '../../components/ProductCard.jsx'
import Modal from '../../components/Modal.jsx'
import { useToast } from '../../store/ToastContext.jsx'

export default function Dashboard() {
  const { availableProducts, completedProducts, sponsorships, deleteProduct } = useApp()
  const { toast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const pendingCount = sponsorships.filter((s) => s.status === 'pending').length
  const totalRaised = sponsorships
    .filter((s) => s.status === 'confirmed')
    .reduce((sum, s) => sum + (Number(s.amountPKR) || 0), 0)

  const stats = [
    { label: 'Open for sponsorship', value: availableProducts.length, icon: Heart, tone: 'text-brand-600 bg-brand-50' },
    { label: 'Awaiting confirmation', value: pendingCount, icon: CircleDot, tone: 'text-gold-700 bg-gold-100' },
    { label: 'Fully sponsored', value: completedProducts.length, icon: CheckCircle2, tone: 'text-moss-dark bg-moss/15' },
    { label: 'Total confirmed', value: formatMoney(totalRaised, 'PKR'), icon: Gift, tone: 'text-pine bg-sand' },
  ]

  const actions = [
    { to: '/super-admin/products', label: 'Manage products', desc: 'Create, edit, and remove live stock and equipment.', icon: PackageSearch },
    { to: '/super-admin/confirmations', label: 'Confirm sponsorships', desc: 'Confirm or release pending contributions.', icon: ClipboardCheck, badge: pendingCount },
    { to: '/super-admin/sponsorships', label: 'Sponsorships made', desc: 'Every completed item with all its sponsors.', icon: ScrollText },
    { to: '/super-admin/settings', label: 'Settings', desc: 'Toggles, partial payments, terms, banks, rates.', icon: Settings },
    { to: '/super-admin/admin-users', label: 'Admin users', desc: 'Invite teammates and manage their access.', icon: Users },
  ]

  const featuredSponsored = completedProducts.slice(0, 3)

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

  return (
    <div className="container-x py-6 sm:py-10">
      <h1 className="font-heading text-2xl font-bold text-pine sm:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">Everything you change here is reflected on the public site.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 sm:p-5">
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${s.tone}`}>
              <s.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="mt-3 truncate font-heading text-2xl font-bold text-pine">{s.value}</p>
            <p className="text-sm text-ink/55">{s.label}</p>
          </div>
        ))}
      </div>

      {featuredSponsored.length > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold text-pine">Sponsored items</h2>
            <Link to="/super-admin/sponsorships" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {featuredSponsored.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showOwner={false}
                footer={
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(product)}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
                      aria-label={`Delete ${product.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <a.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-heading font-semibold text-pine">
                {a.label}
                {a.badge > 0 && (
                  <span className="rounded-full bg-gold-400 px-1.5 text-[11px] font-semibold text-ink">
                    {a.badge}
                  </span>
                )}
              </p>
              <p className="text-sm text-ink/55">{a.desc}</p>
            </div>
            <ArrowRight className="h-5 w-5 shrink-0 text-ink/30 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        ))}
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
    </div>
  )
}
