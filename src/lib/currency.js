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
