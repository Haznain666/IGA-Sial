import { useState } from 'react'
import { Images, Check, User2, Building2, Maximize2 } from 'lucide-react'
import CurrencyPills from './CurrencyPills.jsx'
import Lightbox from './Lightbox.jsx'
import PartialChips from './PartialChips.jsx'
import { fullName } from '../lib/helpers.js'
import { imageUrl, imageStyle } from '../lib/images.js'

// THE product card. Live stock and equipment share it so both always render at
// exactly the same size, everywhere — public site and Super Admin alike. Every
// zone below has a reserved height and long text is clamped, so a card never
// grows because a name or description is long.
export default function ProductCard({
  product,
  footer,
  selectable = false,
  selected = false,
  onToggleSelect,
  onCardClick,
  showOwner = true,
  showCurrency = true,
  className = '',
}) {
  const [lb, setLb] = useState({ open: false, index: 0 })

  const images = product.images?.length ? product.images : []
  const isEquipment = product.kind === 'equipment'
  const owner = product.owner || {}
  const ownerLabel = owner.ownedByFarm === false ? fullName(owner) || 'Private owner' : 'IGA Sial Farm'

  // Identical three-cell spec strip for both kinds keeps the height locked.
  const specs = isEquipment
    ? [['Warranty', product.warranty], ['Life span', product.lifeSpan], ['Category', 'Equipment']]
    : [['Breed', product.breed], ['Age', product.age], ['Weight', product.weight]]

  const openAt = (i) => setLb({ open: true, index: i })

  const handleCardClick = (event) => {
    if (event.target.closest('button') || event.target.closest('a')) return
    if (onCardClick) {
      onCardClick(product.id)
      return
    }
    if (selectable && onToggleSelect) {
      onToggleSelect(product.id)
    }
  }

  return (
    <article
      onClick={handleCardClick}
      className={`card group flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-lift ${
        selected ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-cream' : ''
      } ${className}`}
    >
      <div className="relative aspect-[4/5] shrink-0 overflow-hidden bg-sand">
        <div className="block h-full w-full">
          <img
            src={imageUrl(images[0])}
            alt={product.name}
            loading="lazy"
            style={imageStyle(images[0])}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>

        <span className="absolute left-3 top-3 chip bg-white/90 text-xs font-semibold text-pine shadow-sm">
          {isEquipment ? 'Equipment' : product.type || 'Live Stock'}
        </span>

        <span className="pointer-events-none absolute bottom-3 left-3 chip bg-ink/70 text-xs font-medium text-cream backdrop-blur-sm">
          <Images className="h-3.5 w-3.5" aria-hidden="true" />
          {images.length}
        </span>

        {selectable && (
          <button
            type="button"
            onClick={() => onToggleSelect?.(product.id)}
            className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all ${
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

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            openAt(0)
          }}
          className="absolute bottom-3 right-3 flex h-8 items-center gap-1 rounded-full bg-ink/60 px-2.5 text-[11px] font-medium text-cream opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          aria-label={`Enlarge ${product.name}`}
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Enlarge
        </button>
      </div>

      {/* Thumbnail strip — always rendered so every card keeps the same height. */}
      <div className="flex h-[60px] shrink-0 gap-1.5 px-4 pt-3">
        {images.slice(0, 4).map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              openAt(i)
            }}
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

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-heading text-xl font-semibold text-pine">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 h-10 text-sm leading-relaxed text-ink/65">{product.details}</p>

        <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-parchment p-3 text-center">
          {specs.map(([label, value], i) => (
            <div key={label} className={i === 1 ? 'border-x border-black/5' : ''}>
              <dt className="truncate text-[11px] uppercase tracking-wide text-ink/45">{label}</dt>
              <dd className="mt-0.5 truncate text-sm font-medium text-ink">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        {showOwner && (
          <p className="mt-3 flex h-5 items-center gap-1.5 text-xs text-ink/55">
            {owner.ownedByFarm === false ? (
              <User2 className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            ) : (
              <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden="true" />
            )}
            <span className="shrink-0 text-ink/45">Owner:</span>
            <span className="truncate font-medium text-ink/70">{ownerLabel}</span>
          </p>
        )}

        {/* Reserved chip row — keeps the card height identical with or without chips. */}
        <PartialChips product={product} className="mt-3" />

        {showCurrency && (
          <div className="mt-3">
            <CurrencyPills valuePKR={product.valuePKR} />
          </div>
        )}

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
