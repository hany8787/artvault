import { Outlet, NavLink } from 'react-router-dom'

function NavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-4 py-2 transition-colors ${
          isActive ? 'text-primary' : 'text-white/60 hover:text-white'
        }`
      }
    >
      <span className="material-symbols-outlined text-2xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </NavLink>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg-dark flex flex-col">
      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0 md:pt-16">
        <Outlet />
      </main>

      {/* Desktop header */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-16 bg-bg-darker/80 backdrop-blur-md border-b border-white/10 items-center justify-between px-8 z-50">
        <h1 className="font-display text-2xl font-bold italic text-primary">ArtVault</h1>
        <nav className="flex gap-8">
          <NavLink to="/" className={({ isActive }) => isActive ? 'text-primary' : 'text-white/60 hover:text-white'}>Accueil</NavLink>
          <NavLink to="/collection" className={({ isActive }) => isActive ? 'text-primary' : 'text-white/60 hover:text-white'}>Collection</NavLink>
          <NavLink to="/scan" className={({ isActive }) => isActive ? 'text-primary' : 'text-white/60 hover:text-white'}>Scanner</NavLink>
          <NavLink to="/profile" className={({ isActive }) => isActive ? 'text-primary' : 'text-white/60 hover:text-white'}>Profil</NavLink>
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-darker/95 backdrop-blur-md border-t border-white/10 flex justify-around py-2 z-50">
        <NavItem to="/" icon="home" label="Accueil" />
        <NavItem to="/collection" icon="collections" label="Collection" />
        <NavItem to="/scan" icon="photo_camera" label="Scanner" />
        <NavItem to="/profile" icon="person" label="Profil" />
      </nav>
    </div>
  )
}