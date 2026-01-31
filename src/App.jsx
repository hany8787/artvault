import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import { PageLoader } from './components/ui/Loader'

// Pages
import Home from './pages/Home'
import Collection from './pages/Collection'
import Collections from './pages/Collections'
import Scan from './pages/Scan'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import ArtworkDetail from './pages/ArtworkDetail'
import Museums from './pages/Museums'
import MuseumDetail from './pages/MuseumDetail'
import News from './pages/News'
import PublicArtwork from './pages/PublicArtwork'

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageLoader message="Chargement..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/p/:token" element={<PublicArtwork />} />

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Home />} />
            <Route path="collection" element={<Collection />} />
            <Route path="collections" element={<Collections />} />
            <Route path="scan" element={<Scan />} />
            <Route path="profile" element={<Profile />} />
            <Route path="artwork/:id" element={<ArtworkDetail />} />
            <Route path="museums" element={<Museums />} />
            <Route path="museum/:id" element={<MuseumDetail />} />
            <Route path="news" element={<News />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
