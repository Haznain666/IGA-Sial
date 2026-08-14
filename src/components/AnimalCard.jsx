import { useState } from 'react'
import { Images, Check, User2, Building2, Maximize2 } from 'lucide-react'
import CurrencyPills from './CurrencyPills.jsx'
import Lightbox from './Lightbox.jsx'
import { fullName } from '../lib/helpers.js'
import { imageUrl, imageStyle } from '../lib/images.js'

// Rich animal profile card. One fixed PORTRAIT image frame keeps every card
// consistent; the full photo set opens in the lightbox. `selectable` turns on
// the multi-select checkbox.
export default function AnimalCard({
  product,
  footer,
  selectable = false,
  selected = false,
  onToggleSelect,
  showOwner = true,
  className = '',
}) {
  const [lb, setLb] = useState({ open: false, index: 0 })
  const images = product.images?.length ? product.images : []
  const owner = product.owner || {}
  const ownerLabel = owner.ownedByFarm ? 'IGA Sial Farm' : fullName(owner) || 'Private owner'

  const openAt = (i) => setLb({ open: true, index: i })

  return (
    <article
      className={`card group flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lift ${
        selected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-cream' : ''
      } ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-sand">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="block h-full w-full cursor-zoom-in"
          aria-label={`View photos of ${product.name}`}
        >
          <img
            src={imageUrl(images[0])}
            alt={product.name}
            loading="lazy"
            style={imageStyle(images[0])}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </button>

        <span className="absolute left-3 top-3 chip bg-white/90 text-xs font-semibold text-pine shadow-sm">
          {product.type}
        </span>

        <span className="pointer-events-none absolute bottom-3 left-3 chip bg-ink/70 text-xs font-medium text-cream backdrop-blur-sm">
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          {images.length}
        </span>

        {selectable && (
          <button
            type="button"
            onClick={() => onToggleSelect?.(product.id)}
            className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
              selected
                ? 'border-brand-500 bg-brand-500 text-white'
                : 'border-white/80 bg-white/70 text-transparent hover:border-brand-400'
            }`}
            aria-pressed={selected}
            aria-label={selected ? `Remove ${product.name} from selection` : `Add ${product.name} to selection`}
          >
            <Check className="h-5 w-5" strokeWidth={3} />
          </button>
        )}

        <span className="absolute bottom-3 right-3 flex h-8 items-center gap-1 rounded-full bg-ink/60 px-2.5 text-[11px] font-medium text-cream opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Enlarge
        </span>
      </div>

      {images.length > 1 && (
        <div className="flex gap-1.5 px-4 pt-3">
          {images.slice(0, 4).map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => openAt(i)}
              className="h-12 w-10 shrink-0 overflow-hidden rounded-lg border border-black/5 transition-transform hover:scale-105"
              aria-label={`View photo ${i + 1} of ${product.name}`}
            >
              <img src={imageUrl(src)} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
          {images.length > 4 && (
            <span className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-medium text-brand-600">
              +{images.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-heading text-xl font-semibold text-pine">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink/65">{product.details}</p>

        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-parchment p-3 text-center">
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ink/45">Breed</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{product.breed || '—'}</dd>
          </div>
          <div className="border-x border-black/5">
            <dt className="text-[11px] uppercase tracking-wide text-ink/45">Age</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{product.age || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-wide text-ink/45">Weight</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink">{product.weight || '—'}</dd>
          </div>
        </dl>

        {showOwner && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-ink/55">
            {owner.ownedByFarm ? (
              <Building2 className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            ) : (
              <User2 className="h-3.5 w-3.5 text-brand-500" aria-hidden="true" />
            )}
            <span className="text-ink/45">Owner:</span>
            <span className="font-medium text-ink/70">{ownerLabel}</span>
          </p>
        )}

        <div className="mt-4">
          <CurrencyPills valuePKR={product.valuePKR} />
        </div>

        {footer && <div className="mt-4 pt-1">{footer}</div>}
      </div>

      <Lightbox
        open={lb.open}
        images={images}
        index={lb.index}
        title={product.name}
        onClose={() => setLb({ open: false, index: 0 })}
      />
    </article>
  )
}
