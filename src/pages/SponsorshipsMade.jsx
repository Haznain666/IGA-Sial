import { useNavigate } from 'react-router-dom'
import {
  ScrollText, User2, Gift, HeartHandshake, Mail, Phone, Fingerprint, Landmark, Calendar,
  Wrench, Beef, Users,
} from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { fullName, formatDateTime } from '../lib/helpers.js'
import { imageUrl } from '../lib/images.js'

// A product appears here exactly once, and only once it is FULLY sponsored with
// every contribution confirmed. The card then lists every sponsor who chipped in.
export default function SponsorshipsMade() {
  const navigate = useNavigate()
  const { completedProducts, sponsorsOf, bankById, loading } = useApp()

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
    const fields = ['Item ID', 'Sponsor ID', 'Sponsor Name', 'Contact Number', 'Contact Email', 'Sponsored Amount', 'Sponsorship Date']
    const rows = completedProducts.flatMap((product) =>
      sponsorsOf(product.id).filter((s) => s.status === 'confirmed').map((s) => [
        product.id, s.donor?.id || s.id, fullName(s.donor) || 'Anonymous', s.donor?.phone || '', s.donor?.email || '',
        s.amountPKR, s.confirmedAt || s.createdAt || '',
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
        {completedProducts.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No completed sponsorships yet"
            description="Once every contribution towards an item is confirmed, it appears here with full sponsor and recipient details."
            action={
              <button onClick={() => navigate('/super-admin/confirmations')} className="btn-primary btn-md">
                Go to confirmations
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Sponsorships completed" value={completedProducts.length} icon={HeartHandshake} />
              <StatCard label="Total value sponsored" value={formatMoney(totalPKR, 'PKR')} icon={Gift} />
            </div>

            <div className="space-y-5">
              {completedProducts.map((p) => {
                const sponsors = sponsorsOf(p.id)
                const isEquipment = p.kind === 'equipment'
                const Icon = isEquipment ? Wrench : Beef
                const lastConfirmed = sponsors
                  .map((s) => s.confirmedAt)
                  .filter(Boolean)
                  .sort()
                  .pop()
                const recipient = sponsors.find((s) => s.recipient)?.recipient || null

                return (
                  <article key={p.id} className="card overflow-hidden">
                    <div className="flex flex-wrap items-center gap-4 border-b border-black/5 bg-parchment p-5">
                      <img
                        src={imageUrl(p.images?.[0])}
                        alt={p.name}
                        className="h-24 w-20 shrink-0 rounded-2xl object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-heading text-lg font-semibold text-pine">{p.name}</p>
                        <p className="flex items-center gap-1.5 text-sm text-ink/50">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                          {isEquipment
                            ? [p.warranty, p.lifeSpan].filter(Boolean).join(' · ') || 'Equipment'
                            : [p.type, p.breed].filter(Boolean).join(' · ')}
                        </p>
                        <p className="mt-1 font-heading font-semibold text-brand-600">
                          {formatMoney(p.valuePKR, 'PKR')}
                        </p>
                      </div>
                      <span className="chip bg-brand-50 text-xs font-medium text-brand-700">
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {sponsors.length} {sponsors.length === 1 ? 'sponsor' : 'sponsors'}
                      </span>
                    </div>

                    <div className="grid gap-5 p-5 lg:grid-cols-[1fr_minmax(0,280px)]">
                      <div>
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink/45">
                          <User2 className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                          Sponsors
                        </p>
                        <ul className="space-y-3">
                          {sponsors.map((s) => {
                            const bank = s.bankId ? bankById(s.bankId) : null
                            return (
                              <li
                                key={s.id}
                                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-black/5 bg-parchment/60 p-3"
                              >
                                <div className="min-w-0">
                                  <p className="font-heading font-semibold text-pine">
                                    {fullName(s.donor) || '—'}
                                  </p>
                                  <div className="mt-1 space-y-0.5">
                                    {s.donor?.email && (
                                      <p className="flex items-center gap-1.5 break-all text-sm text-ink/60">
                                        <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                                        {s.donor.email}
                                      </p>
                                    )}
                                    {s.donor?.phone && (
                                      <p className="flex items-center gap-1.5 text-sm text-ink/60">
                                        <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                                        {s.donor.phone}
                                      </p>
                                    )}
                                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink/45">
                                      <span className="flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                                        {formatDateTime(s.confirmedAt)}
                                      </span>
                                      {bank && (
                                        <span className="flex items-center gap-1.5">
                                          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                                          {bank.bankName}
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-heading font-semibold tabular-nums text-brand-600">
                                    {formatMoney(s.amountPKR, 'PKR')}
                                  </p>
                                  {s.isPartial && (
                                    <span className="chip mt-1 bg-gold-100 text-[11px] text-gold-800">Partial</span>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>

                      <div>
                        <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink/45">
                          <HeartHandshake className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
                          Recipient
                        </p>
                        <div className="rounded-2xl border border-black/5 bg-parchment/60 p-3">
                          <p className={`font-heading font-semibold ${recipient ? 'text-pine' : 'text-ink/40'}`}>
                            {recipient ? fullName(recipient) : 'Not recorded'}
                          </p>
                          {recipient && (
                            <div className="mt-1 space-y-0.5">
                              {recipient.cnic && (
                                <p className="flex items-center gap-1.5 text-sm text-ink/60">
                                  <Fingerprint className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                                  {recipient.cnic}
                                </p>
                              )}
                              {recipient.phone && (
                                <p className="flex items-center gap-1.5 text-sm text-ink/60">
                                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                                  {recipient.phone}
                                </p>
                              )}
                              {recipient.email && (
                                <p className="flex items-center gap-1.5 break-all text-sm text-ink/60">
                                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                                  {recipient.email}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-black/5 bg-white px-5 py-3 text-xs text-ink/50">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        Fully sponsored {formatDateTime(lastConfirmed)}
                      </span>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        )}
      </div>
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
