import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import AnimalSelection from './pages/AnimalSelection.jsx'
import DonationPage from './pages/DonationPage.jsx'
import ThankYou from './pages/ThankYou.jsx'
import NotFound from './pages/NotFound.jsx'

// Super Admin is loaded on demand so the public donor experience stays light.
const SuperAdminLayout = lazy(() => import('./pages/superadmin/SuperAdminLayout.jsx'))
const Dashboard = lazy(() => import('./pages/superadmin/Dashboard.jsx'))
const ManageProduct = lazy(() => import('./pages/ManageProduct.jsx'))
const ConfirmDonation = lazy(() => import('./pages/ConfirmDonation.jsx'))
const DonationsMade = lazy(() => import('./pages/DonationsMade.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))

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
            <Route path="/select" element={<AnimalSelection />} />
            <Route path="/donation" element={<DonationPage />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          <Route path="/super-admin" element={<SuperAdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ManageProduct />} />
            <Route path="confirmations" element={<ConfirmDonation />} />
            <Route path="donations" element={<DonationsMade />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
