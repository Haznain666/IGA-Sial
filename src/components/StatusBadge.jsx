// Derived product status, straight from the sponsorship ledger.
const STYLES = {
  available: { label: 'Available', cls: 'bg-brand-50 text-brand-700' },
  partial: { label: 'Partly sponsored', cls: 'bg-brand-100 text-brand-800' },
  reserved: { label: 'Reserved', cls: 'bg-gold-100 text-gold-800' },
  sponsored: { label: 'Sponsored', cls: 'bg-moss/15 text-moss-dark' },
}

export default function StatusBadge({ status }) {
  const s = STYLES[status] || STYLES.available
  return (
    <span className={`chip ${s.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {s.label}
    </span>
  )
}
