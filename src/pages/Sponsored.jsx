import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import SponsorshipSummaryCard from '../components/SponsorshipSummaryCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'
import { fullName, formatDateTime, countryFromPhone } from '../lib/helpers.js'
import { formatMoney } from '../lib/currency.js'
import { Calendar, MapPin, Search } from 'lucide-react'

const PER_PAGE = 6

export default function Sponsored() {
  const navigate = useNavigate()
  const { products, sponsorshipsOf, statusOf, loading } = useApp()
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState('date-desc')
  const [search, setSearch] = useState('')
  const searchInputRef = useRef(null)

  const items = useMemo(() => {
    const rows = products
      .filter((product) => {
        const status = statusOf(product.id)
        return status === 'sponsored' || status === 'partial'
      })
      .map((product) => {
        const sponsors = sponsorshipsOf(product.id).filter((s) => s.status === 'confirmed')
        const totalConfirmed = sponsors.reduce((sum, s) => sum + (Number(s.amountPKR) || 0), 0)
        const remaining = Math.max(0, (Number(product.valuePKR) || 0) - totalConfirmed)
        const lastDate = sponsors.map((s) => s.confirmedAt || s.createdAt).filter(Boolean).sort().pop() || null
        return {
          product,
          sponsors,
          totalConfirmed,
          remaining,
          lastDate,
          isComplete: remaining <= 0,
        }
      })

    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter(({ product, sponsors }) => {
      const haystack = [
        product.name,
        product.assetId,
        product.type,
        product.breed,
        product.kind,
        ...sponsors.map((s) => [fullName(s.donor), s.donor?.email, s.donor?.phone, formatMoney(s.amountPKR, 'PKR')].filter(Boolean).join(' ')),
      ].join(' ').toLowerCase()
      return haystack.includes(query)
    })
  }, [products, search, sponsorshipsOf, statusOf])

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => {
      if (sort === 'value-asc') return a.product.valuePKR - b.product.valuePKR
      if (sort === 'value-desc') return b.product.valuePKR - a.product.valuePKR
      if (sort === 'category') return (a.product.kind || '').localeCompare(b.product.kind || '') || a.product.name.localeCompare(b.product.name)
      const dateOrder = new Date(b.lastDate || 0).getTime() - new Date(a.lastDate || 0).getTime()
      return sort === 'date-asc' ? -dateOrder : dateOrder
    }),
    [items, sort],
  )

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])
  useEffect(() => setPage(1), [search])

  const pageItems = useMemo(() => sortedItems.slice((page - 1) * PER_PAGE, page * PER_PAGE), [page, sortedItems])

  return (
    <div>
      <PageHeader
        eyebrow="Sponsored"
        title="Sponsored Assets"
        subtitle="Assets sponsored to date, including partial contributions that are still collecting the rest of the needed funding."
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
        ) : sortedItems.length === 0 ? (
          <EmptyState
            icon={() => null}
            title="No sponsored items yet"
            description="We don't have any sponsored or partially sponsored items yet. Check back later or be the first to sponsor."
            action={<button onClick={() => navigate('/select')} className="btn-primary btn-md">Sponsor now</button>}
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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

              <div className="relative w-full max-w-md xl:w-[380px]">
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by product, sponsor, amount or asset ID"
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

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map(({ product: p, sponsors, totalConfirmed, remaining, lastDate, isComplete }) => (
                <SponsorshipSummaryCard
                  key={p.id}
                  product={p}
                  sponsorships={sponsors}
                  remaining={remaining}
                  status="confirmed"
                  footer={
                    <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
                      <p className="font-semibold">
                        {isComplete
                          ? 'Fully sponsored — all funding received.'
                          : `Still collecting: ${formatMoney(remaining, 'PKR')} remaining`}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-brand-700/70">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        Sponsored: {formatDateTime(lastDate) || '—'}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-brand-700/70">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        Country: {[...new Set(sponsors.map((s) => countryFromPhone(s.donor?.phone)))].join(', ') || 'Unknown'}
                      </p>
                    </div>
                  }
                />
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
