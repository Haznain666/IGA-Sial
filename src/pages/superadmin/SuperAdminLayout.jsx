import { NavLink, Link, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, PackageSearch, ClipboardCheck, ScrollText, Settings, ExternalLink, Users, LogOut,
} from 'lucide-react'
import Logo from '../../components/Logo.jsx'
import AdminAuth from '../auth/AdminAuth.jsx'
import { useApp } from '../../store/AppContext.jsx'
import { useToast } from '../../store/ToastContext.jsx'

const NAV = [
  { to: '/super-admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/super-admin/products', label: 'Products', icon: PackageSearch },
  { to: '/super-admin/confirmations', label: 'Confirmations', icon: ClipboardCheck, badge: 'pending' },
  { to: '/super-admin/sponsorships', label: 'Sponsorships', icon: ScrollText },
  { to: '/super-admin/settings', label: 'Settings', icon: Settings },
  { to: '/super-admin/admin-users', label: 'Admin Users', icon: Users },
]

export default function SuperAdminLayout() {
  const { session, authLoading, isAdmin, sponsorships, signOut } = useApp()
  const { toast } = useToast()

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
      </div>
    )
  }

  // Every /super-admin route is behind this gate.
  if (!session) return <AdminAuth />

  // Signed in, but no active admin profile — deactivated, deleted, or a
  // Supabase user who was never an admin at all. `null` means the database
  // couldn't answer, and we don't lock anyone out on a maybe.
  if (isAdmin === false) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-sand px-5">
        <div className="card w-full max-w-md p-6 text-center sm:p-8">
          <h1 className="font-heading text-xl font-semibold text-pine">No admin access</h1>
          <p className="mt-2 text-sm text-ink/60">
            You are signed in as <span className="font-medium text-ink">{session.user?.email}</span>,
            but this account doesn’t have access to the control panel. Ask an existing admin to
            invite you.
          </p>
          <button
            onClick={async () => {
              await signOut()
              toast('Signed out.', { type: 'info' })
            }}
            className="btn-primary btn-md mt-6"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </div>
    )
  }

  const pendingCount = sponsorships.filter((s) => s.status === 'pending').length

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="sticky top-0 z-40 bg-pine text-cream shadow-md">
        <div className="container-x flex h-14 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Logo chip className="h-8" to="/super-admin" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold leading-tight">Super Admin</p>
              <p className="truncate text-[11px] leading-tight text-cream/60">{session?.user?.email}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-cream transition-colors hover:bg-white/20"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">View site</span>
            </Link>
            <button
              onClick={async () => {
                await signOut()
                toast('Signed out.', { type: 'info' })
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-cream transition-colors hover:bg-white/20"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
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
              {badge === 'pending' && pendingCount > 0 && (
                <span className="rounded-full bg-gold-400 px-1.5 text-[10px] font-semibold text-ink">
                  {pendingCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
