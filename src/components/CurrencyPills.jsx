import { convertFromPKR, formatMoney } from '../lib/currency.js'
import { useApp } from '../store/AppContext.jsx'

// Shows the PKR donation value prominently with USD / AUD / SAR conversions,
// using the live exchange rates from Settings.
export default function CurrencyPills({ valuePKR, size = 'md', rates, className = '' }) {
  const { settings } = useApp()
  const fx = rates || settings.fxRates
  const c = convertFromPKR(valuePKR, fx)
  const big = size === 'lg' ? 'text-2xl sm:text-3xl' : size === 'sm' ? 'text-lg' : 'text-xl sm:text-2xl'
  return (
    <div className={className}>
      <div className="flex items-baseline gap-1.5">
        <span className={`font-heading font-semibold tabular-nums text-pine ${big}`}>
          {formatMoney(c.PKR, 'PKR')}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {['USD', 'AUD', 'SAR'].map((cur) => (
          <span key={cur} className="chip bg-brand-50 text-xs font-medium tabular-nums text-brand-700">
            {formatMoney(c[cur], cur)}
          </span>
        ))}
      </div>
    </div>
  )
}
