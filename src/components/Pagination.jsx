import { ChevronLeft, ChevronRight } from 'lucide-react'

// Shared 6-per-page pager, used on the selection page and in Confirmations.
export default function Pagination({ page, totalPages, onChange, className = '' }) {
  if (totalPages <= 1) return null
  return (
    <nav className={`mt-10 flex items-center justify-center gap-2 ${className}`} aria-label="Pagination">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="btn-outline btn-sm !px-3"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page}
          className={`h-9 w-9 rounded-full text-sm font-medium transition-colors ${
            n === page ? 'bg-brand-500 text-white' : 'text-ink/60 hover:bg-brand-50 hover:text-pine'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="btn-outline btn-sm !px-3"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  )
}
