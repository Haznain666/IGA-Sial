import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Heart, ShoppingCart, Check, Plus, PackageOpen, X, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import ProductCard from '../components/ProductCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'
import { useToast } from '../store/ToastContext.jsx'

const PER_PAGE = 6

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'livestock', label: 'Live Stock' },
  { id: 'equipment', label: 'Equipment' },
]

export default function ProductSelection() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { availableProducts, settings, cart, toggleCart, setCart, clearCart, remainingOf, loading } = useApp()
  const multi = settings.multiSelect
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)

  const items = useMemo(() => {
    const base = filter === 'all'
      ? availableProducts
      : availableProducts.filter((p) => (filter === 'equipment' ? p.kind === 'equipment' : p.kind !== 'equipment'))

    const query = search.trim().toLowerCase()
    if (!query) return base

    return base.filter((p) => {
      const haystack = [
        p.name,
        p.assetId,
        p.type,
        p.breed,
        p.kind,
        p.details,
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [availableProducts, filter, search])

  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  useEffect(() => setPage(1), [filter, search])

  const pageItems = useMemo(
    () => items.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [items, page],
  )

  // A sponsorship covers whatever is still open on the item, not its full value.
  const location = useLocation()
  const lastPreselect = useRef(null)

  const cartItems = availableProducts.filter((p) => cart.includes(p.id))
  const cartTotal = cartItems.reduce((sum, p) => sum + remainingOf(p.id), 0)

  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    let pre = params.get('preselect')

    if (!pre && typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const queryIndex = hash.indexOf('?')
      if (queryIndex !== -1) {
        const hashParams = new URLSearchParams(hash.slice(queryIndex + 1))
        pre = hashParams.get('preselect') || pre
      }
    }

    if (!pre || loading) return
    if (lastPreselect.current === pre) return

    const exists = availableProducts.some((p) => p.id === pre)
    if (!exists) return

    lastPreselect.current = pre

    if (multi) {
      if (!cart.includes(pre)) toggleCart(pre)
    } else {
      setCart([pre])
    }

    try {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash || ''
        if (hash.includes('preselect=')) {
          const cleanedHash = hash.split('?')[0]
          const nextUrl = window.location.pathname + window.location.search + cleanedHash
          window.history.replaceState(window.history.state, '', nextUrl)
        } else if (window.location.search.includes('preselect=')) {
          const url = new URL(window.location.href)
          url.searchParams.delete('preselect')
          window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash)
        }
      }
    } catch {
      // ignore
    }
  }, [location.search, loading, availableProducts, cart, multi, setCart, toggleCart])

  const sponsorSingle = (id) => {
    setCart([id])
    navigate('/sponsor')
  }

  const handleCardClick = (id) => {
    if (multi) {
      toggleCart(id)
      return
    }

    const next = cart.includes(id) ? cart.filter((itemId) => itemId !== id) : [id]
    setCart(next)
  }

  const proceedMulti = () => {
    if (cart.length === 0) {
      toast('Select at least one item to sponsor.', { type: 'info' })
      return
    }
    navigate('/sponsor')
  }

  return (
    <div className={multi && cart.length > 0 ? 'pb-28' : ''}>
      <PageHeader
        eyebrow="Sponsorship selection"
        title="Choose what to sponsor"
        subtitle={
          multi
            ? 'Select one or more animals or pieces of equipment, then proceed to sponsor. Tap any photo to view the full gallery.'
            : 'Pick the animal or the equipment whose story speaks to you. Tap any photo to view the full gallery.'
        }
        actions={
          <span className="chip bg-brand-50 text-brand-700">
            {items.length} available
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
            title="Nothing is available right now"
            description="Every animal and every piece of equipment has been reserved or fully sponsored. Please check back soon."
            action={
              <button onClick={() => navigate('/')} className="btn-primary btn-md">
                Back to home
              </button>
            }
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                    className={`chip cursor-pointer px-4 py-2 text-sm transition-colors ${
                      filter === f.id
                        ? 'bg-brand-500 text-white'
                        : 'border border-brand-200 bg-white text-ink/70 hover:bg-brand-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full max-w-md xl:w-[380px]">
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by item name, asset ID, type or breed"
                  className="field-input w-full pr-12"
                />
                <button
                  type="button"
                  onClick={() => searchInputRef.current?.focus()}
                  className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-brand-200 bg-brand-50 text-brand-600 transition-colors hover:bg-brand-100"
                  aria-label="Focus search"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {multi && (
              <div className="mb-6 flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden="true" />
                Multi-select is on — add several items and sponsor them together.
              </div>
            )}

            {items.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title={search ? 'No items matched your search' : 'Nothing available in this category'}
                description={
                  search
                    ? 'Try another keyword or switch back to a broader category to find available sponsorships.'
                    : 'Try another category — there is still something waiting for a sponsor.'
                }
              />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((p) => {
                  const inCart = cart.includes(p.id)
                  return (
                    <ProductCard
                      key={p.id}
                      product={p}
                      selectable={multi}
                      selected={inCart}
                      onToggleSelect={toggleCart}
                      onCardClick={handleCardClick}
                      footer={
                        multi ? (
                          <button
                            onClick={() => toggleCart(p.id)}
                            className={`btn-md w-full ${inCart ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {inCart ? (
                              <>
                                <Check className="h-4 w-4" aria-hidden="true" />
                                Added to sponsorship
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" aria-hidden="true" />
                                Add to sponsorship
                              </>
                            )}
                          </button>
                        ) : (
                          <button onClick={() => sponsorSingle(p.id)} className="btn-gold btn-md w-full">
                            <Heart className="h-4 w-4" aria-hidden="true" />
                            Sponsor now
                          </button>
                        )
                      }
                    />
                  )
                })}
              </div>
            )}

            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
                  {cart.length} {cart.length === 1 ? 'item' : 'items'} selected
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
                Sponsor selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
