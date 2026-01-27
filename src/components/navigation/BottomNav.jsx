import { NavLink, useLocation } from 'react-router-dom'

/**
 * Bottom Navigation for Mobile
 * 5 tabs: Accueil, Actualités, Scanner (center), Collection, Musées
 */
export default function BottomNav() {
  const location = useLocation()

  // Hide on scan page (full screen)
  if (location.pathname === '/scan') {
    return null
  }

  // New order: Accueil, Actualités, Scanner (center), Collection, Musées
  const navItems = [
    { path: '/', icon: 'home', label: 'Accueil' },
    { path: '/news', icon: 'calendar_month', label: 'Actus' },
    { path: '/scan', icon: 'photo_camera', label: 'Scanner', isCenter: true },
    { path: '/collection', icon: 'collections', label: 'Collection' },
    { path: '/museums', icon: 'museum', label: 'Musées' },
  ]

  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              item.isCenter
                ? ''
                : `bottom-nav-item ${isActive ? 'active' : ''}`
            }
          >
            {item.isCenter ? (
              <div className="scanner-button">
                <span className="material-symbols-outlined text-2xl">
                  {item.icon}
                </span>
              </div>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">
                  {item.icon}
                </span>
                <span className="mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
