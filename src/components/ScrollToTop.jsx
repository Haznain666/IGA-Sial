import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Reset scroll position when navigating between pages (but not for in-page
// hash anchors on the home page).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (hash) return
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}
