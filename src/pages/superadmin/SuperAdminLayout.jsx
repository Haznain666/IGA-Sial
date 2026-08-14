import { NavLink, Link, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, PackageSearch, ClipboardCheck, ScrollText, Settings, ExternalLink, Globe, HardDrive,
} from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import { useApp } from '../../store/AppContext.jsx'

const NAV = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/products', label: 'Products', icon: PackageSearch },
  { to: '/super-admin/confirmations', label: 'Confirmations', icon: ClipboardCheck, badge: 'reserved' },
  { to: '/super-admin/donations', label: 'Donations', icon: ScrollText },
  { to: '/super-admin/settings', label: 'Settings', icon: Settings },
]

export default function SuperAdminLayout() {
  const { dataMode, reservedProducts } = useApp()
  const isGlobal = dataMode === 'firebase'

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="sticky top-0 z-40 bg-pine text-cream shadow-md">
        <div className="container-x flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo chip className="h-8" to="/super-admin" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold leading-tight">Super Admin</p>
              <p className="text-[11px] leading-tight text-cream/60">IGA Sial Farm control panel</p>
            </div>
          </div>
          <Link
            to="/"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-cream transition-colors hover:bg-white/20"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">View site</span>
          </Link>
        </div>

        {/* Nav tabs — scrollable on mobile */}
        <nav className="container-x flex gap-1 overflow-x-auto pb-2 hide-scrollbar" aria-label="Super Admin">
          {NAV.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-cream text-pine' : 'text-cream/75 hover:bg-white/10 hover:text-cream'
                }`
              }
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
              {badge === 'reserved' && reservedProducts.length > 0 && (
                <span className="rounded-full bg-gold-400 px-1.5 text-[10px] font-semibold text-ink">
                  {reservedProducts.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* Impact banner */}
      <div
        className={`px-4 py-2 text-center text-xs font-medium ${
          isGlobal ? 'bg-brand-500 text-white' : 'bg-gold-100 text-gold-800'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          {isGlobal ? <Globe className="h-3.5 w-3.5" /> : <HardDrive className="h-3.5 w-3.5" />}
          {isGlobal
            ? 'Global mode — changes here update the live site for every visitor, worldwide.'
            : 'Local preview — add your Firebase config to go global. Data is currently per-browser.'}
        </span>
      </div>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
