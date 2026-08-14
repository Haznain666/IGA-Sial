import { PiggyBank, CircleDollarSign, Clock } from 'lucide-react'
import { useApp } from '../store/AppContext.jsx'
import { formatMoney } from '../lib/currency.js'

// The single source of truth for partial-sponsorship chips.
//
// These have to appear on EVERY surface that shows an item — the home carousels,
// the selection page, and Super Admin. They used to live inline in ProductCard
// only, so the Herd and Equipment carousels silently showed nothing. If you add
// another place that renders a product, render this too.
//
// Exactly ONE chip shows at a time, in this order:
//   1. "Partially sponsored · Rs X left" — money CONFIRMED by an admin.
//   2. "Partially reserved · Rs X left"  — money PLEDGED but not yet confirmed.
//   3. "Partial sponsorship available"   — qualifies, nothing committed yet.
//
// One chip, not several, because the card height is a hard design constant: a
// second chip would wrap on narrow cards and break it. The amount shown is the
// REMAINING balance — display only. A product's value_pkr is never changed by a
// sponsorship; `remaining` is derived from the sponsorships ledger.
//
// `reserveSpace` keeps a fixed-height row so cards in a grid stay identical
// whether or not a chip is present; carousels pass false to avoid a dead gap.
export default function PartialChips({ product, reserveSpace = true, className = '' }) {
  const { statsOf, isPartialEligible } = useApp()

  const stats = statsOf(product.id)
  const eligible = isPartialEligible(product)
  const openBalance = stats.remaining > 0

  const confirmedPart = stats.confirmed > 0 && openBalance
  const reservedPart = !confirmedPart && stats.pending > 0 && openBalance
  const availableOnly = stats.committed === 0 && eligible

  if (!reserveSpace && !confirmedPart && !reservedPart && !availableOnly) return null

  const left = formatMoney(stats.remaining, 'PKR')

  return (
    <div
      className={`flex flex-wrap items-start gap-1.5 ${reserveSpace ? 'min-h-[26px]' : ''} ${className}`}
    >
      {confirmedPart && (
        <span className="chip whitespace-nowrap bg-brand-50 text-[11px] font-semibold text-brand-700">
          <CircleDollarSign className="h-3.5 w-3.5" aria-hidden="true" />
          Partially sponsored · {left} left
        </span>
      )}
      {reservedPart && (
        <span className="chip whitespace-nowrap bg-gold-50 text-[11px] font-semibold text-gold-800">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          Partially reserved · {left} left
        </span>
      )}
      {availableOnly && (
        <span className="chip whitespace-nowrap bg-gold-100 text-[11px] font-semibold text-gold-800">
          <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />
          Partial sponsorship available
        </span>
      )}
    </div>
  )
}
