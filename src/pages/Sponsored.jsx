import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/PageHeader.jsx'
import ProductCard from '../components/ProductCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import { useApp } from '../store/AppContext.jsx'

const PER_PAGE = 6

export default function Sponsored() {
  const navigate = useNavigate()
  const { completedProducts, loading } = useApp()
  const [page, setPage] = useState(1)

  const items = useMemo(() => completedProducts, [completedProducts])
  const totalPages = Math.max(1, Math.ceil(items.length / PER_PAGE))
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const pageItems = useMemo(() => items.slice((page - 1) * PER_PAGE, page * PER_PAGE), [items, page])

  return (
    <div>
      <PageHeader
        eyebrow="Sponsored"
        title="Our sponsored items"
        subtitle="Items that have been fully sponsored by our generous donors. Thank you to everyone who made this possible."
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pageItems.map((p) => (
                <ProductCard key={p.id} product={p} />
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
