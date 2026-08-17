import { Link } from 'react-router-dom'
import { assetUrl } from '../lib/images.js'

// The one official IGA Sial Farm logo. `chip` wraps it in a light rounded
// plate so it reads cleanly on dark surfaces (e.g. the footer).
export default function Logo({ className = 'h-12', chip = false, to = '/' }) {
  const img = (
    <img
      src={assetUrl('logo.jpg')}
      alt="IGA Sial Farm"
      className={`${className} w-auto ${chip ? 'rounded-lg' : 'rounded-lg'}`}
      width="120"
      height="120"
    />
  )
  const content = chip ? <span className="inline-flex rounded-xl bg-cream p-1.5">{img}</span> : img
  if (!to) return content
  return (
    <Link to={to} aria-label="IGA Sial Farm — home" className="inline-flex shrink-0 items-center">
      {content}
    </Link>
  )
}
