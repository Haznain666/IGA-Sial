// Small shared utilities.

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function initials(first = '', last = '') {
  return `${(first[0] || '').toUpperCase()}${(last[0] || '').toUpperCase()}` || '—'
}

export function fullName(person) {
  if (!person) return ''
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim()
}

export function formatDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export function formatDateTime(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export function isEmail(v) {
  return EMAIL_RE.test(String(v || '').trim())
}

export function isPhone(v) {
  const digits = String(v || '').replace(/[^\d]/g, '')
  return digits.length >= 7 && digits.length <= 15
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

// --- Pakistani identity / contact masks -------------------------------------
// Both are applied as the user types, so stored values are always consistent.
// These are deliberately Pakistan-specific and used ONLY for recipient families
// and villager owners — never for sponsors, who are frequently overseas and
// would be broken by a local phone mask.

// CNIC → 12345-1234567-1 (5-7-1, 13 digits).
export function formatCNIC(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 13)
  if (d.length <= 5) return d
  if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
  return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
}

// Mobile → 0300-123 4567 (4-3-4, 11 digits).
export function formatMobile(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 11)
  if (d.length <= 4) return d
  if (d.length <= 7) return `${d.slice(0, 4)}-${d.slice(4)}`
  return `${d.slice(0, 4)}-${d.slice(4, 7)} ${d.slice(7)}`
}
