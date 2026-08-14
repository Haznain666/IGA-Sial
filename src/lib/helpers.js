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
