import { useNavigate } from 'react-router-dom'
import { ScrollText, User2, Gift, HeartHandshake, Mail, Phone, Fingerprint, Landmark, Calendar } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { fullName, formatDateTime } from '../lib/helpers.js'
import { imageUrl } from '../lib/images.js'

export default function DonationsMade() {
  const navigate = useNavigate()
  const { donations, bankById } = useApp()

  const totalPKR = donations.reduce((sum, d) => sum + (Number(d.amountPKR) || 0), 0)

  return (
    <>
      <PageHeader
        hideBack
        eyebrow="Donations made"
        title="Completed donations"
        subtitle="A record of every confirmed donation, including the animal, the donor, and the receiving family."
        actions={
          <button onClick={() => navigate('/super-admin/confirmations')} className="btn-outline btn-md">
            Confirm donations
          </button>
        }
      />

      <div className="container-x py-10 sm:py-12">
        {donations.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title="No donations recorded yet"
            description="Confirmed donations will appear here with full donor and recipient details."
            action={
              <button onClick={() => navigate('/super-admin/confirmations')} className="btn-primary btn-md">
                Go to confirm donations
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <StatCard label="Donations completed" value={donations.length} icon={HeartHandshake} />
              <StatCard label="Total value donated" value={formatMoney(totalPKR, 'PKR')} icon={Gift} />
              <StatCard
                label="Families supported"
                value={new Set(donations.filter((d) => d.recipient).map((d) => fullName(d.recipient))).size || '—'}
                icon={User2}
              />
            </div>

            <div className="space-y-5">
              {donations.map((d) => {
                const bank = d.bankId ? bankById(d.bankId) : null
                return (
                  <article key={d.id} className="card overflow-hidden">
                    <div className="grid gap-0 md:grid-cols-[auto_1fr]">
                      <div className="flex items-center gap-4 border-b border-black/5 bg-parchment p-5 md:border-b-0 md:border-r">
                        <img
                          src={imageUrl(d.image)}
                          alt={d.productName}
                          className="h-24 w-20 shrink-0 rounded-2xl object-cover"
                        />
                        <div>
                          <p className="font-heading text-lg font-semibold text-pine">{d.productName}</p>
                          <p className="text-sm text-ink/50">{d.productType} · {d.breed}</p>
                          <p className="mt-1 font-heading font-semibold text-brand-600">
                            {formatMoney(d.amountPKR, 'PKR')}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-5 p-5 sm:grid-cols-2">
                        <PartyBlock
                          title="Donor"
                          icon={User2}
                          name={fullName(d.donor)}
                          rows={[
                            d.donor?.email && [Mail, d.donor.email],
                            d.donor?.phone && [Phone, d.donor.phone],
                          ]}
                        />
                        <PartyBlock
                          title="Recipient"
                          icon={HeartHandshake}
                          name={d.recipient ? fullName(d.recipient) : 'Not recorded'}
                          muted={!d.recipient}
                          rows={
                            d.recipient
                              ? [
                                  d.recipient.cnic && [Fingerprint, d.recipient.cnic],
                                  d.recipient.phone && [Phone, d.recipient.phone],
                                  d.recipient.email && [Mail, d.recipient.email],
                                ]
                              : []
                          }
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-black/5 bg-white px-5 py-3 text-xs text-ink/50">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        Confirmed {formatDateTime(d.confirmedAt)}
                      </span>
                      {bank && (
                        <span className="flex items-center gap-1.5">
                          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                          {bank.bankName}
                        </span>
                      )}
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
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-ink/55">{label}</p>
        <p className="font-heading text-2xl font-bold text-pine">{value}</p>
      </div>
    </div>
  )
}

function PartyBlock({ title, icon: Icon, name, rows = [], muted }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink/45">
        <Icon className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
        {title}
      </p>
      <p className={`font-heading font-semibold ${muted ? 'text-ink/40' : 'text-pine'}`}>{name}</p>
      <div className="mt-1.5 space-y-1">
        {rows.filter(Boolean).map(([RowIcon, text], i) => (
          <p key={i} className="flex items-center gap-1.5 text-sm text-ink/60">
            <RowIcon className="h-3.5 w-3.5 text-brand-400" aria-hidden="true" />
            {text}
          </p>
        ))}
      </div>
    </div>
  )
}
