import { Link } from 'react-router-dom'
import {
  PackageSearch, ClipboardCheck, ScrollText, Settings, Heart, CircleDot, CheckCircle2, Gift, ArrowRight,
} from 'lucide-react'
import { useApp } from '../../store/AppContext.jsx'
import { formatMoney } from '../../lib/currency.js'

export default function Dashboard() {
  const { availableProducts, reservedProducts, donatedProducts, donations } = useApp()
  const totalRaised = donations.reduce((s, d) => s + (Number(d.amountPKR) || 0), 0)

  const stats = [
    { label: 'Available', value: availableProducts.length, icon: Heart, tone: 'text-brand-600 bg-brand-50' },
    { label: 'Reserved', value: reservedProducts.length, icon: CircleDot, tone: 'text-gold-700 bg-gold-100' },
    { label: 'Donated', value: donatedProducts.length, icon: CheckCircle2, tone: 'text-moss-dark bg-moss/15' },
    { label: 'Total raised', value: formatMoney(totalRaised, 'PKR'), icon: Gift, tone: 'text-pine bg-sand' },
  ]

  const actions = [
    { to: '/super-admin/products', label: 'Manage products', desc: 'Create, edit, and remove animals.', icon: PackageSearch },
    { to: '/super-admin/confirmations', label: 'Confirm donations', desc: 'Confirm or release reserved animals.', icon: ClipboardCheck, badge: reservedProducts.length },
    { to: '/super-admin/donations', label: 'Donations made', desc: 'Full donor and recipient records.', icon: ScrollText },
    { to: '/super-admin/settings', label: 'Settings', desc: 'Toggles, terms, banks, exchange rates.', icon: Settings },
  ]

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
            <p className="mt-3 font-heading text-2xl font-bold text-pine">{s.value}</p>
            <p className="text-sm text-ink/55">{s.label}</p>
          </div>
        ))}
      </div>

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
    </div>
  )
}
