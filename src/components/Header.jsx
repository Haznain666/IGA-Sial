import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Heart } from 'lucide-react'
import Logo from './Logo.jsx'
import { useApp } from '../store/AppContext.jsx'

const NAV = [
  { id: 'about', label: 'Our story' },
  { id: 'concept', label: 'The model' },
  { id: 'process', label: 'How it works' },
  { id: 'herd', label: 'Meet the herd' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'contact', label: 'Contact' },
]
  
// Additional top-level pages (not in-page sections)
const PAGES = [
  { to: '/sponsored', label: 'Our Sponsored' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { cart } = useApp()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toSection = (id) => {
    setOpen(false)
    if (pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 140)
    }
  }

  return (
    <header
      className={`sticky top-0 z-[100] transition-all duration-300 ${
        scrolled
          ? 'border-b border-black/5 bg-cream/90 backdrop-blur-md'
          : 'border-b border-transparent bg-cream/70 backdrop-blur-sm'
      }`}
    >
      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo className="h-11" />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => toSection(item.id)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-brand-50 hover:text-pine"
            >
              {item.label}
            </button>
          ))}

          {PAGES.map((p) => (
            <Link key={p.to} to={p.to} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/70 transition-colors hover:bg-brand-50 hover:text-pine">
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/select" className="btn-gold btn-md hidden sm:inline-flex">
            <Heart className="h-4 w-4" aria-hidden="true" />
            Sponsor now
            {cart.length > 0 && (
              <span className="ml-1 rounded-full bg-ink/85 px-1.5 py-0.5 text-[11px] font-semibold text-cream">
                {cart.length}
              </span>
            )}
          </Link>

          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-2 text-pine transition-colors hover:bg-brand-50 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-cream lg:hidden">
          <nav className="container-x flex flex-col py-3" aria-label="Mobile">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => toSection(item.id)}
                className="rounded-xl px-3 py-3 text-left text-base font-medium text-ink/80 transition-colors hover:bg-brand-50 hover:text-pine"
              >
                {item.label}
              </button>
            ))}
              <Link to="/sponsored" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-left text-base font-medium text-ink/80 transition-colors hover:bg-brand-50 hover:text-pine">
              Our Sponsored
              </Link>
            <Link to="/select" onClick={() => setOpen(false)} className="btn-gold btn-lg mt-2">
              <Heart className="h-4 w-4" aria-hidden="true" />
              Sponsor now
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
