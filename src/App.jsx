import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, Navigate } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import ProductSelection from './pages/ProductSelection.jsx'
import SponsorPage from './pages/SponsorPage.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'

// Auth entry points sit outside the public chrome — they have their own shell.
const AuthCallback = lazy(() => import('./pages/auth/AuthCallback.jsx'))
const SetPassword = lazy(() => import('./pages/auth/SetPassword.jsx'))

// Super Admin is loaded on demand so the public sponsor experience stays light.
const SuperAdminLayout = lazy(() => import('./pages/superadmin/SuperAdminLayout.jsx'))
const Dashboard = lazy(() => import('./pages/superadmin/Dashboard.jsx'))
const ManageProduct = lazy(() => import('./pages/ManageProduct.jsx'))
const ConfirmSponsorships = lazy(() => import('./pages/ConfirmSponsorships.jsx'))
const SponsorshipsMade = lazy(() => import('./pages/SponsorshipsMade.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const AdminUsers = lazy(() => import('./pages/AdminUsers.jsx'))

function PublicLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-sand">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/select" element={<ProductSelection />} />
            <Route path="/sponsor" element={<SponsorPage />} />
            {/* Old link kept alive so bookmarks and shared URLs still land. */}
            <Route path="/donation" element={<Navigate to="/sponsor" replace />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/set-password" element={<SetPassword />} />

          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ManageProduct />} />
            <Route path="confirmations" element={<ConfirmSponsorships />} />
            <Route path="sponsorships" element={<SponsorshipsMade />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin-users" element={<AdminUsers />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
