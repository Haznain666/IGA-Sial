import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight, Heart, Images, ArrowRight, PackageOpen, Maximize2 } from 'lucide-react'
import SectionHeading from '../components/SectionHeading.jsx'
import CurrencyPills from '../components/CurrencyPills.jsx'
import PartialChips from '../components/PartialChips.jsx'
import Lightbox from '../components/Lightbox.jsx'
import { useApp } from '../store/AppContext.jsx'
import { fullName } from '../lib/helpers.js'
import { imageUrl, imageStyle } from '../lib/images.js'

// Home "Meet the Herd" carousel — live products, up to five available animals.
export default function Herd() {
  const { availableProducts, loading } = useApp()
  const animals = availableProducts.filter((p) => p.kind !== 'equipment').slice(0, 5)

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: animals.length > 1, align: 'center' }, [
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ])
  const [selected, setSelected] = useState(0)
  const [lb, setLb] = useState({ open: false, images: [], index: 0, title: '' })

  const onSelect = useCallback((api) => setSelected(api.selectedScrollSnap()), [])
  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const openLightbox = (images, index, title) => setLb({ open: true, images, index, title })

  return (
    <section id="herd" className="scroll-mt-20 bg-cream py-16 sm:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Available for sponsorship"
            title="Meet the Herd"
            intro="Every animal here has a name, a story, and a family waiting. Sponsor the one that speaks to you — and pair it with a piece of farm equipment to make the gift go further."
            className="!mx-0"
          />
          <Link to="/select" className="btn-outline btn-md hidden shrink-0 sm:inline-flex">
            View all live stock
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 h-72 animate-pulse rounded-3xl bg-sand" />
        ) : animals.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-brand-200 bg-white/60 px-6 py-16 text-center">
            <PackageOpen className="h-10 w-10 text-brand-400" aria-hidden="true" />
            <h3 className="mt-4 font-heading text-lg font-semibold text-pine">
              Every animal has found a home
            </h3>
            <p className="mt-2 max-w-sm text-sm text-ink/60">
              All live stock is currently reserved or fully sponsored. Please check back soon — or sponsor a piece of equipment below.
            </p>
          </div>
        ) : (
          <div className="relative mt-8 sm:mt-12">
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex">
                {animals.map((animal) => (
                  <div key={animal.id} className="min-w-0 flex-[0_0_100%] px-0.5">
                    <FeaturedAnimal animal={animal} onOpenLightbox={openLightbox} />
                  </div>
                ))}
              </div>
            </div>

            {animals.length > 1 && (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pine shadow-lift transition-transform hover:scale-105 active:scale-95"
                  aria-label="Previous animal"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {animals.map((a, i) => (
                    <button
                      key={a.id}
                      onClick={() => emblaApi?.scrollTo(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === selected ? 'w-7 bg-brand-500' : 'w-2.5 bg-brand-200 hover:bg-brand-300'
                      }`}
                      aria-label={`Show ${a.name}`}
                      aria-current={i === selected}
                    />
                  ))}
                </div>
                <button
                  onClick={() => emblaApi?.scrollNext()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pine shadow-lift transition-transform hover:scale-105 active:scale-95"
                  aria-label="Next animal"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}

            <Link to="/select" className="btn-outline btn-md mt-6 flex w-full sm:hidden">
              View all live stock
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      <Lightbox
        open={lb.open}
        images={lb.images}
        index={lb.index}
        title={lb.title}
        onClose={() => setLb((s) => ({ ...s, open: false }))}
      />
    </section>
  )
}

function FeaturedAnimal({ animal, onOpenLightbox }) {
  const images = animal.images || []
  const owner = animal.owner || {}
  const ownerLabel = owner.ownedByFarm ? 'IGA Sial Farm' : fullName(owner) || 'Private owner'

  return (
    <div className="grid gap-0 overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-[minmax(0,42%)_1fr]">
      <div className="relative bg-sand">
        <button
          type="button"
          onClick={() => onOpenLightbox(images, 0, animal.name)}
          className="block aspect-[4/5] w-full cursor-zoom-in overflow-hidden"
          aria-label={`View photos of ${animal.name}`}
        >
          <img
            src={imageUrl(images[0])}
            alt={animal.name}
            style={imageStyle(images[0])}
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
          />
        </button>
        <span className="absolute left-4 top-4 chip bg-white/90 font-semibold text-pine shadow-sm">
          {animal.type}
        </span>
        <span className="absolute right-4 top-4 flex h-9 items-center gap-1.5 rounded-full bg-ink/60 px-3 text-xs font-medium text-cream backdrop-blur-sm">
          <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          Tap to enlarge
        </span>
        {images.length > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex gap-2">
            {images.slice(0, 4).map((src, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onOpenLightbox(images, i, animal.name)}
                className="h-11 w-11 overflow-hidden rounded-lg border-2 border-white/80 shadow-md transition-transform hover:scale-110"
                aria-label={`View photo ${i + 1} of ${animal.name}`}
              >
                <img src={imageUrl(src)} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 text-sm text-ink/50">
          <Images className="h-4 w-4 text-brand-500" aria-hidden="true" />
          {images.length} {images.length === 1 ? 'photo' : 'photos'}
        </div>
        <h3 className="mt-1.5 font-heading text-2xl font-bold text-pine sm:text-3xl">{animal.name}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-ink/70 sm:text-base">{animal.details}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            ['Breed', animal.breed],
            ['Age', animal.age],
            ['Weight', animal.weight],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-parchment p-2.5 text-center sm:p-3">
              <dt className="text-[11px] uppercase tracking-wide text-ink/45">{label}</dt>
              <dd className="mt-0.5 font-heading text-sm font-semibold text-ink">{value || '—'}</dd>
            </div>
          ))}
        </dl>

        <PartialChips product={animal} reserveSpace={false} className="mt-5" />

        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <CurrencyPills valuePKR={animal.valuePKR} size="lg" />
          <Link to="/select" className="btn-gold btn-lg w-full sm:w-auto">
            <Heart className="h-5 w-5" aria-hidden="true" />
            Sponsor now
          </Link>
        </div>
        <p className="mt-3 text-xs text-ink/45">Owner: {ownerLabel}</p>
      </div>
    </div>
  )
}
