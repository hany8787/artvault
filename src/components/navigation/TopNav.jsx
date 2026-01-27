import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Top Navigation for Desktop
 * Logo, nav links, theme toggle, profile
 */
export default function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { user, profile } = useAuth()
  const location = useLocation()

  // Hide on scan page (full screen)
  if (location.pathname === '/scan') {
    return null
  }

  // New order: Accueil, Actualités, Scanner, Collection, Musées
  const navLinks = [
    { path: '/', label: 'Accueil', icon: 'home' },
    { path: '/news', label: 'Actualités', icon: 'calendar_month' },
    { path: '/scan', label: 'Scanner', icon: 'photo_camera' },
    { path: '/collection', label: 'Collection', icon: 'collections' },
    { path: '/museums', label: 'Musées', icon: 'museum' },
  ]

  return (
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
  )
}
