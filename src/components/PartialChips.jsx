import { PiggyBank, CircleDollarSign } from 'lucide-react'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'

// The single source of truth for partial-sponsorship chips.
//
// These have to appear on EVERY surface that shows an item — the home carousels,
// the selection page, and Super Admin. They used to live inline in ProductCard
// only, so the Herd and Equipment carousels silently showed nothing. If you add
// another place that renders a product, render this too.
//
// Rules (see State.md §7):
//   - "Partial sponsorship available" — the item qualifies but nothing is confirmed yet.
//   - "Partially sponsored · Rs X left" — appears ONLY once a contribution is
//     CONFIRMED by an admin, never while it is still pending.
//
// `reserveSpace` keeps a fixed-height row so cards in a grid stay identical
// whether or not a chip is present; carousels pass false to avoid a dead gap.
export default function PartialChips({ product, reserveSpace = true, className = '' }) {
  const { statsOf, isPartialEligible } = useApp()

  const stats = statsOf(product.id)
  const eligible = isPartialEligible(product)
  const partiallySponsored = stats.confirmed > 0 && stats.remaining > 0

  if (!reserveSpace && !eligible && !partiallySponsored) return null

  return (
    <div
      className={`flex flex-wrap items-start gap-1.5 ${reserveSpace ? 'min-h-[26px]' : ''} ${className}`}
    >
      {partiallySponsored && (
        <span className="chip bg-brand-50 text-[11px] font-semibold text-brand-700">
          <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          Partially sponsored · {formatMoney(stats.remaining, 'PKR')} left
        </span>
      )}
      {eligible && !partiallySponsored && (
        <span className="chip bg-gold-100 text-[11px] font-semibold text-gold-800">
          <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
          Partial sponsorship available
        </span>
      )}
    </div>
  )
}
