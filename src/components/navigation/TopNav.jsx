import { NavLink, Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'

/**
 * Top Navigation for Desktop
 * Logo, nav links, theme toggle, profile
 */
export default function TopNav() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const location = useLocation()

  // Hide on scan page (full screen)
  if (location.pathname === '/scan') {
    return null
  }

  const navLinks = [
    { path: '/', label: 'Accueil' },
    { path: '/collection', label: 'Collection' },
    { path: '/scan', label: 'Scanner' },
    { path: '/museums', label: 'Musées' },
    { path: '/news', label: 'Actualités' },
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
                `text-sm font-medium transition-colors ${
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

          {/* Profile */}
          {user && (
            <Link to="/profile" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium text-bg-dark">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
