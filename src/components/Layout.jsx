import { Outlet, useLocation } from 'react-router-dom'
import TopNav from './navigation/TopNav'
import BottomNav from './navigation/BottomNav'
import { InstallPrompt } from './ui/InstallPrompt'

/**
 * Main Layout Component
 * Includes top nav (desktop), bottom nav (mobile), and main content area
 */
export default function Layout() {
  const location = useLocation()

  // Full screen pages (no padding, no nav)
  const isFullScreen = location.pathname === '/scan'

  if (isFullScreen) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen">
      {/* Top Navigation (Desktop) */}
      <TopNav />

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Bottom Navigation (Mobile) */}
      <BottomNav />

      {/* PWA Install Banner */}
      <InstallPrompt />
    </div>
  )
}
