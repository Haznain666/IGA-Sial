import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-heading text-6xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-pine">Page not found</h1>
      <p className="mt-2 max-w-sm text-ink/60">
        The page you’re looking for doesn’t exist or may have moved.
      </p>
      <Link to="/" className="btn-primary btn-lg mt-8">
        <Home className="h-5 w-5" aria-hidden="true" />
        Back to home
      </Link>
    </div>
  )
}
