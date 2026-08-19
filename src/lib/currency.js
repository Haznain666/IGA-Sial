// Default indicative exchange rates — PKR per 1 unit of foreign currency.
// These are the fallback; the live values are editable in Super Admin → Settings
// and stored on `settings.fxRates`.
export const DEFAULT_FX = {
  USD: 278.5,
  AUD: 183.0,
  SAR: 74.3,
}

export const CURRENCIES = ['PKR', 'USD', 'AUD', 'SAR']

const SYMBOLS = {
  PKR: 'Rs',
  USD: '$',
  AUD: 'A$',
  SAR: 'SAR',
}

function resolveRates(rates) {
  return {
    USD: Number(rates?.USD) > 0 ? Number(rates.USD) : DEFAULT_FX.USD,
    AUD: Number(rates?.AUD) > 0 ? Number(rates.AUD) : DEFAULT_FX.AUD,
    SAR: Number(rates?.SAR) > 0 ? Number(rates.SAR) : DEFAULT_FX.SAR,
  }
}

// Convert a PKR amount into the four supported currencies.
export function convertFromPKR(pkr, rates) {
  const value = Number(pkr) || 0
  const fx = resolveRates(rates)
  return {
    PKR: value,
    USD: value / fx.USD,
    AUD: value / fx.AUD,
    SAR: value / fx.SAR,
  }
}

// Format a raw amount in a given currency. Amounts are rounded to whole units.
export function formatMoney(amount, currency = 'PKR') {
  const rounded = Math.round(Number(amount) || 0)
  const num = rounded.toLocaleString('en-US')
  const symbol = SYMBOLS[currency] || ''
  return currency === 'USD' || currency === 'AUD' ? `${symbol}${num}` : `${symbol} ${num}`
}

// Convenience: format a PKR base value in every currency.
export function formatAllFromPKR(pkr, rates) {
  const converted = convertFromPKR(pkr, rates)
  return CURRENCIES.reduce((acc, cur) => {
    acc[cur] = formatMoney(converted[cur], cur)
    return acc
  }, {})
}

// Money typed into an admin field. Kept as text (not <input type="number">) so
// thousands separators can be shown while typing; the caller stores the raw
// numeric string. Decimals are settled on blur — formatting them mid-keystroke
// makes the field impossible to type into.
export function formatAmountInput(value, { withDecimals = false } = {}) {
  const raw = String(value ?? '').replace(/[^\d.]/g, '')
  if (raw === '') return ''
  const [intPart, ...rest] = raw.split('.')
  const decPart = rest.join('')
  const grouped = (intPart || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  if (withDecimals) {
    const n = Number(`${intPart || 0}.${decPart || 0}`)
    return Number.isFinite(n)
      ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : grouped
  }
  return raw.includes('.') ? `${grouped}.${decPart}` : grouped
}

// Inverse of the above — strip separators back to a plain numeric string.
export function parseAmountInput(value) {
  return String(value ?? '').replace(/,/g, '').replace(/[^\d.]/g, '')
}
