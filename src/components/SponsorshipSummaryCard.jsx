import { useState } from 'react'
import { BadgeCheck, Beef, Clock, HandCoins, Mail, Maximize2, Phone, User2, Wrench } from 'lucide-react'
import Lightbox from './Lightbox.jsx'
import { fullName, formatDateTime } from '../lib/helpers.js'
import { formatMoney } from '../lib/currency.js'
import { imageUrl, imageStyle } from '../lib/images.js'

export default function SponsorshipSummaryCard({
  product,
  sponsorships = [],
  remaining = 0,
  status = 'confirmed',
  footer,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const images = product?.images || []
  const isEquipment = product?.kind === 'equipment'
  const Icon = isEquipment ? Wrench : Beef
  const total = sponsorships.reduce((sum, s) => sum + (Number(s.amountPKR) || 0), 0)
  return (
    <article className="card flex h-full flex-col overflow-hidden p-4">
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
        <span className={`chip shrink-0 text-[11px] font-semibold ${
          status === 'pending' ? 'bg-gold-100 text-gold-800' : 'bg-brand-100 text-brand-800'
        }`}>
          {status === 'pending' && <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />}
          {status === 'pending' ? 'Partial' : remaining > 0 ? 'Partial' : 'Confirmed'}
        </span>
      </div>

      {images[0] && (
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative mt-3 h-12 w-16 overflow-hidden rounded-lg border border-black/5 bg-sand"
          aria-label={`Enlarge image of ${product?.name || 'this item'}`}
        >
          <img
            src={imageUrl(images[0])}
            alt={product?.name || 'Product'}
            style={imageStyle(images[0])}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-white transition-colors group-hover:bg-ink/35">
            <Maximize2 className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
          </span>
        </button>
      )}

      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-lg font-semibold tabular-nums text-brand-600">
          {formatMoney(status === 'pending' ? sponsorships[0]?.amountPKR : total, 'PKR')}
        </span>
        <span className="text-xs text-ink/45">of {formatMoney(product?.valuePKR || 0, 'PKR')}</span>
        {remaining > 0 && (
          <span className="text-xs font-medium text-ink/55">· {formatMoney(remaining, 'PKR')} still open</span>
        )}
      </div>

      <div className="sponsor-scroll mt-3 h-[128px] overflow-y-auto rounded-xl bg-parchment p-3 text-sm">
        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink/45">Sponsor</p>
        <div className="flex flex-col gap-2">
          {sponsorships.map((s) => (
            <div key={s.id}>
              <p className="flex items-center gap-1.5 truncate font-medium text-ink">
                <User2 className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
                {fullName(s.donor) || 'Anonymous'}
                {status !== 'pending' && <span className="text-xs font-semibold text-brand-600">— {formatMoney(s.amountPKR, 'PKR')}</span>}
              </p>
              {s.donor?.email && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink/60">
                  <Mail className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                  {s.donor.email}
                </p>
              )}
              {s.donor?.phone && (
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink/60">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-brand-400" aria-hidden="true" />
                  {s.donor.phone}
                </p>
              )}
              <p className="mt-1 flex items-center gap-1.5 text-[11px] text-ink/45">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {status === 'pending' ? 'Reserved' : 'Confirmed'} {formatDateTime(s.confirmedAt || s.reservedAt || s.createdAt)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {footer || (
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          Confirmed
        </p>
      )}

      <Lightbox
        open={lightboxOpen}
        images={images}
        title={product?.name}
        onClose={() => setLightboxOpen(false)}
      />
    </article>
  )
}
