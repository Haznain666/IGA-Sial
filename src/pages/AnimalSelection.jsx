import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Check, Plus, ChevronLeft, ChevronRight, PackageOpen, X } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import AnimalCard from '../components/AnimalCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { useToast } from '../store/ToastContext.jsx'

const PER_PAGE = 6

export default function AnimalSelection() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { availableProducts, settings, cart, toggleCart, setCart, clearCart, loading } = useApp()
  const multi = settings.multiSelect
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(availableProducts.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(
    () => availableProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [availableProducts, page],
  )

  const cartItems = availableProducts.filter((p) => cart.includes(p.id))
  const cartTotal = cartItems.reduce((sum, p) => sum + (Number(p.valuePKR) || 0), 0)

  const donateSingle = (id) => {
    setCart([id])
    navigate('/donation')
  }

  const proceedMulti = () => {
    if (cart.length === 0) {
      toast('Select at least one animal to donate.', { type: 'info' })
      return
    }
    navigate('/donation')
  }

  return (
    <div className={multi && cart.length > 0 ? 'pb-28' : ''}>
      <PageHeader
        eyebrow="Animal selection"
        title="Choose an animal to donate"
        subtitle={
          multi
            ? 'Select one or more animals, then proceed to donate. Tap any photo to view the full gallery.'
            : 'Pick the animal whose story speaks to you and donate. Tap any photo to view the full gallery.'
        }
        actions={
          <span className="chip bg-brand-50 text-brand-700">
            {availableProducts.length} available
          </span>
        }
      />

      <div className="container-x py-8 sm:py-12">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-sand" />
            ))}
          </div>
        ) : availableProducts.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No animals are available right now"
            description="Every animal has been reserved or donated. Please check back soon."
            action={
              <button onClick={() => navigate('/')} className="btn-primary btn-md">
                Back to home
              </button>
            }
          />
        ) : (
          <>
            {multi && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
                Multi-select is on — add several animals and donate them together.
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((p) => {
                const inCart = cart.includes(p.id)
                return (
                  <AnimalCard
                    key={p.id}
                    product={p}
                    selectable={multi}
                    selected={inCart}
                    onToggleSelect={toggleCart}
                    footer={
                      multi ? (
                        <button
                          onClick={() => toggleCart(p.id)}
                          className={`btn-md w-full ${inCart ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {inCart ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden="true" />
                              Added to donation
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" aria-hidden="true" />
                              Add to donation
                            </>
                          )}
                        </button>
                      ) : (
                        <button onClick={() => donateSingle(p.id)} className="btn-gold btn-md w-full">
                          <Heart className="h-4 w-4" aria-hidden="true" />
                          Donate now
                        </button>
                      )
                    }
                  />
                )
              })}
            </div>

            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-outline btn-sm !px-3"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    aria-current={n === page}
                    className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
                      n === page
                        ? 'bg-brand-500 text-white'
                        : 'text-ink/60 hover:bg-brand-50 hover:text-pine'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-outline btn-sm !px-3"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      {multi && cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/95 backdrop-blur-md shadow-[0_-8px_30px_-12px_rgba(16,44,34,0.25)]">
          <div className="container-x flex flex-wrap items-center justify-between gap-3 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white">
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-heading font-semibold text-pine">
                  {cart.length} {cart.length === 1 ? 'animal' : 'animals'} selected
                </p>
                <p className="text-sm text-ink/60">
                  Total {formatMoney(cartTotal, 'PKR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearCart} className="btn-ghost btn-sm">
                <X className="h-4 w-4" aria-hidden="true" />
                Clear
              </button>
              <button onClick={proceedMulti} className="btn-gold btn-md">
                <Heart className="h-4 w-4" aria-hidden="true" />
                Donate selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
