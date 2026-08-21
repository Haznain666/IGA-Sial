import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight, Heart, ArrowRight, PackageOpen } from 'lucide-react'
import SectionHeading from '../components/SectionHeading.jsx'
import ProductCard from '../components/ProductCard.jsx'
import { useApp } from '../store/AppContext.jsx'

export default function Herd() {
  const navigate = useNavigate()
  const { availableProducts, loading, setCart } = useApp()
  const animals = availableProducts.filter((p) => p.kind !== 'equipment').slice(0, 9)
  const slides = useMemo(
    () => {
      const groups = []
      for (let i = 0; i < animals.length; i += 3) groups.push(animals.slice(i, i + 3))
      return groups
    },
    [animals],
  )

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: slides.length > 1, align: 'center' }, [
    Autoplay({ delay: 6000, stopOnInteraction: true, stopOnMouseEnter: true }),
  ])
  const [selected, setSelected] = useState(0)

  const onSelect = useCallback((api) => setSelected(api.selectedScrollSnap()), [])
  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  const sponsorSingle = (id) => {
    setCart([id])
    navigate('/sponsor')
  }

  return (
    <section id="herd" className="scroll-mt-20 bg-cream py-16 sm:py-28">
      <div className="container-x">
        <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            title="Meet the Herd (available for sponsorships)"
            intro="Every animal here has a name, a story, and a family waiting. Sponsor the one that speaks to you — and pair it with a piece of farm equipment to make the gift go further."
            className="!mx-0"
          />
          <Link to="/select" className="btn-outline btn-md hidden shrink-0 sm:inline-flex">
            View all live stock
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-black/5 bg-white shadow-soft">
                <div className="aspect-[4/5] animate-pulse bg-sand" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-1/3 animate-pulse rounded-full bg-sand" />
                  <div className="h-3 w-full animate-pulse rounded-full bg-sand" />
                  <div className="h-3 w-2/3 animate-pulse rounded-full bg-sand" />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="h-12 animate-pulse rounded-xl bg-sand" />
                    <div className="h-12 animate-pulse rounded-xl bg-sand" />
                    <div className="h-12 animate-pulse rounded-xl bg-sand" />
                  </div>
                  <div className="mt-4 h-11 animate-pulse rounded-full bg-sand" />
                </div>
              </div>
            ))}
          </div>
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
                {slides.map((group, slideIndex) => (
                  <div key={`herd-slide-${slideIndex}`} className="min-w-0 flex-[0_0_100%] px-0.5">
                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {group.map((animal) => (
                        <ProductCard
                          key={animal.id}
                          product={animal}
                          footer={
                            <button onClick={() => sponsorSingle(animal.id)} className="btn-gold btn-md w-full">
                              <Heart className="h-4 w-4" aria-hidden="true" />
                              Sponsor now
                            </button>
                          }
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {slides.length > 1 && (
              <div className="mt-5 flex items-center justify-center gap-4">
                <button
                  onClick={() => emblaApi?.scrollPrev()}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-pine shadow-lift transition-transform hover:scale-105 active:scale-95"
                  aria-label="Previous animal"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex gap-2">
                  {slides.map((_, i) => (
                    <button
                      key={`dot-${i}`}
                      onClick={() => emblaApi?.scrollTo(i)}
                      className={`h-2.5 rounded-full transition-all ${
                        i === selected ? 'w-7 bg-brand-500' : 'w-2.5 bg-brand-200 hover:bg-brand-300'
                      }`}
                      aria-label={`Show slide ${i + 1}`}
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
    </section>
  )
}
