import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArtworkCard } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Loader'

// Hero background - famous artwork
const HERO_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'

export default function Home() {
  const { user } = useAuth()
  const [recentArtworks, setRecentArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, artists: 0, museums: 0 })

  useEffect(() => {
    fetchData()
  }, [user])

  async function fetchData() {
    if (!user) return

    try {
      // Fetch recent artworks
      const { data: artworks } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setRecentArtworks(artworks || [])

      // Fetch stats
      const { count: total } = await supabase
        .from('artworks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { data: artistData } = await supabase
        .from('artworks')
        .select('artist')
        .eq('user_id', user.id)
        .not('artist', 'is', null)

      const { data: museumData } = await supabase
        .from('artworks')
        .select('museum')
        .eq('user_id', user.id)
        .not('museum', 'is', null)

      const uniqueArtists = new Set(artistData?.map(a => a.artist)).size
      const uniqueMuseums = new Set(museumData?.map(m => m.museum)).size

      setStats({
        total: total || 0,
        artists: uniqueArtists,
        museums: uniqueMuseums,
      })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="The Starry Night"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-bg-light dark:to-bg-dark" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl text-white mb-6 animate-slide-up">
            Votre Collection Personnelle
          </h1>
          <p className="font-serif text-xl md:text-2xl text-white/80 mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Capturez, identifiez et collectionnez les œuvres qui vous inspirent
          </p>
          <Link
            to="/scan"
            className="btn btn-primary btn-lg animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            <span className="material-symbols-outlined">photo_camera</span>
            Commencer à scanner
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-pulse-soft">
          <span className="material-symbols-outlined text-white/50 text-3xl">
            keyboard_arrow_down
          </span>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-4">
            Comment ça marche
          </h2>
          <div className="divider-gold mx-auto mb-16" />

          <div className="grid md:grid-cols-3 gap-12 stagger-children">
            {/* Step 1 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">01</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">photo_camera</span>
              </div>
              <h3 className="font-display text-xl mb-2">Photographiez</h3>
              <p className="text-secondary">
                Capturez une œuvre lors de votre visite au musée
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">02</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">auto_awesome</span>
              </div>
              <h3 className="font-display text-xl mb-2">Identifiez</h3>
              <p className="text-secondary">
                Notre IA reconnaît l'œuvre et enrichit les informations
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">03</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">collections</span>
              </div>
              <h3 className="font-display text-xl mb-2">Collectionnez</h3>
              <p className="text-secondary">
                Constituez votre collection personnelle d'œuvres d'art
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent acquisitions (if user has artworks) */}
      {stats.total > 0 && (
        <section className="py-20 px-4 bg-secondary">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl mb-2">
                  Dernières acquisitions
                </h2>
                <p className="text-secondary">
                  {stats.total} œuvre{stats.total > 1 ? 's' : ''} · {stats.artists} artiste{stats.artists > 1 ? 's' : ''} · {stats.museums} musée{stats.museums > 1 ? 's' : ''}
                </p>
              </div>
              <Link to="/collection" className="btn btn-outline">
                Voir tout
              </Link>
            </div>

            {/* Artworks carousel */}
            <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-64">
                    <SkeletonCard />
                  </div>
                ))
              ) : (
                recentArtworks.map((artwork) => (
                  <div key={artwork.id} className="flex-shrink-0 w-64">
                    <ArtworkCard artwork={artwork} />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Empty state CTA (if no artworks) */}
      {!loading && stats.total === 0 && (
        <section className="py-20 px-4 bg-secondary">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-accent">add_photo_alternate</span>
            </div>
            <h2 className="font-display text-3xl mb-4">
              Commencez votre collection
            </h2>
            <p className="text-secondary mb-8">
              Scannez votre première œuvre d'art et commencez à constituer votre galerie personnelle
            </p>
            <Link to="/scan" className="btn btn-primary btn-lg">
              <span className="material-symbols-outlined">photo_camera</span>
              Scanner une œuvre
            </Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-default">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <span className="font-display text-2xl italic text-accent">ArtVault</span>

            {/* Links */}
            <nav className="flex gap-8 text-sm">
              <a href="#" className="text-secondary hover:text-accent transition-colors">
                À propos
              </a>
              <a href="#" className="text-secondary hover:text-accent transition-colors">
                Contact
              </a>
              <a href="#" className="text-secondary hover:text-accent transition-colors">
                Mentions légales
              </a>
            </nav>

            {/* Copyright */}
            <p className="text-secondary text-sm">
              © 2025 ArtVault
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
