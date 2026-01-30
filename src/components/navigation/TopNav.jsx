import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

// Page title mapping for mobile header
const PAGE_TITLES = {
  '/': 'Accueil',
  '/news': 'Actualités',
  '/collection': 'Ma Collection',
  '/collections': 'Dossiers',
  '/museums': 'Musées',
  '/profile': 'Profil',
}

/**
 * Top Navigation
 * - Mobile: Simple header with logo and page title
 * - Desktop: Full nav with links, theme toggle, profile
 */
export default function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile } = useAuth()
  const location = useLocation()

  // Hide on scan page (full screen) and artwork detail
  if (location.pathname === '/scan' || location.pathname.startsWith('/artwork/')) {
    return null
  }

  // Get current page title for mobile
  const currentTitle = PAGE_TITLES[location.pathname] ||
    (location.pathname.startsWith('/museum/') ? 'Musée' : 'ArtVault')

  // Nav links for desktop
  const navLinks = [
    { path: '/', label: 'Accueil', icon: 'home' },
    { path: '/news', label: 'Actualités', icon: 'calendar_month' },
    { path: '/scan', label: 'Scanner', icon: 'photo_camera' },
    { path: '/collection', label: 'Collection', icon: 'collections' },
    { path: '/museums', label: 'Musées', icon: 'museum' },
  ]

  return (
    <>
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 glass border-b border-default pt-[env(safe-area-inset-top)]">
        <div className="px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-display text-lg italic text-accent">
            ArtVault
          </Link>

          {/* Page title - center */}
          <span className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-secondary">
            {currentTitle}
          </span>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:text-primary transition-colors"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined text-xl">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Profile */}
            {user && (
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full flex items-center justify-center text-accent"
              >
                <span className="material-symbols-outlined text-xl">person</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 glass border-b border-default">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="font-display text-xl italic text-accent">
            ArtVault
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'text-accent'
                      : 'text-secondary hover:text-accent'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side: theme toggle + profile */}
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="btn btn-ghost btn-icon"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Profile with name */}
            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors"
              >
                <span className="material-symbols-outlined text-accent">person</span>
                <span className="text-sm font-medium">
                  {profile?.full_name || 'Profil'}
                </span>
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
