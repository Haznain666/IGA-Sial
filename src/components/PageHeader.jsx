import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  backTo = '/',
  backLabel = 'Back to home',
  hideBack = false,
  actions,
}) {
  return (
    <div className="border-b border-black/5 bg-parchment">
      <div className="container-x py-6 sm:py-10">
        {!hideBack && (
          <Link
            to={backTo}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {backLabel}
          </Link>
        )}
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between ${hideBack ? '' : 'mt-4'}`}>
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            <h1 className="text-balance font-heading text-2xl font-bold text-pine sm:text-4xl">
              {title}
            </h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm text-ink/65 sm:text-base">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  )
}
