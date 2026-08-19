export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-brand-200 bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
      )}
      <h3 className="mt-4 font-heading text-lg font-semibold text-pine">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-ink/60">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
