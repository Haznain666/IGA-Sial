import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import ProductCard from '../components/ProductCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'
import { fullName, formatDateTime, countryFromPhone } from '../lib/helpers.js'
import { formatMoney } from '../lib/currency.js'
import { Calendar, MapPin, Users } from 'lucide-react'

const PER_PAGE = 6

export default function Sponsored() {
  const navigate = useNavigate()
  const { completedProducts, sponsorshipsOf, loading } = useApp()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('date-desc')

  const items = useMemo(() => {
    const rows = completedProducts.map((product) => {
      const sponsors = sponsorshipsOf(product.id).filter((s) => s.status === 'confirmed')
      const lastDate = sponsors.map((s) => s.confirmedAt || s.createdAt).filter(Boolean).sort().pop() || null
      return { product, sponsors, lastDate }
    })
    return rows.sort((a, b) => {
      if (sort === 'value-asc') return a.product.valuePKR - b.product.valuePKR
      if (sort === 'value-desc') return b.product.valuePKR - a.product.valuePKR
      if (sort === 'category') return (a.product.kind || '').localeCompare(b.product.kind || '') || a.product.name.localeCompare(b.product.name)
      const dateOrder = new Date(b.lastDate || 0).getTime() - new Date(a.lastDate || 0).getTime()
      return sort === 'date-asc' ? -dateOrder : dateOrder
    })
  }, [completedProducts, sponsorshipsOf, sort])
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => items.slice((page - 1) * PER_PAGE, page * PER_PAGE), [items, page])

  return (
    <div>
      <PageHeader
        eyebrow="Sponsored"
        title="Sponsored Assets"
        subtitle="Assets that have been fully sponsored by those who believe in and support our cause. Thank you to everyone whose generosity is helping us make a meaningful difference."
        actions={
          <button onClick={() => navigate('/select')} className="btn-outline btn-md">
            Sponsor an item
          </button>
        }
      />

      <div className="container-x py-8 sm:py-12">
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: PER_PAGE }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-sand" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={() => null}
            title="No sponsored items yet"
            description="We don't have any fully sponsored items yet. Check back later or be the first to sponsor."
            action={<button onClick={() => navigate('/select')} className="btn-primary btn-md">Sponsor now</button>}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-ink/70">
                Sort by
                <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className="field-input w-auto">
                  <option value="date-desc">Sponsored date (newest)</option>
                  <option value="date-asc">Sponsored date (oldest)</option>
                  <option value="category">Category</option>
                  <option value="value-desc">Asset value (high to low)</option>
                  <option value="value-asc">Asset value (low to high)</option>
                </select>
              </label>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map(({ product: p, sponsors, lastDate }) => (
                <article key={p.id} className="card flex h-full flex-col">
                  <ProductCard product={p} showOwner={false} showCurrency={false} className="border-0 shadow-none" />
                  <div className="border-t border-black/5 px-4 pb-4 pt-3 text-sm">
                    <p className="flex items-center gap-2 font-medium text-pine">
                      <Users className="h-4 w-4 text-brand-500" aria-hidden="true" />
                      Sponsor: {sponsors.map((s) => fullName(s.donor)).filter(Boolean).join(', ') || 'Anonymous'}
                    </p>
                    <p className="mt-2 flex items-center gap-2 text-xs text-ink/60">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      Sponsored: {formatDateTime(lastDate) || '—'}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-ink/60">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                      Country: {[...new Set(sponsors.map((s) => countryFromPhone(s.donor?.phone)))].join(', ') || 'Unknown'}
                    </p>
                    <p className="mt-2 font-heading font-semibold text-brand-600">{formatMoney(p.valuePKR, 'PKR')}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
