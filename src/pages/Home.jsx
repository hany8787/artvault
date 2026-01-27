import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArtworkCard, MuseumCard } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Loader'

// Hero background - famous artwork
const HERO_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'

// Featured museums for preview
const FEATURED_MUSEUMS = [
  {
    id: 'louvre',
    name: 'Musée du Louvre',
    city: 'Paris',
    country: 'France',
    description: 'Le plus grand musée d\'art du monde',
    image_url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80'
  },
  {
    id: 'orsay',
    name: 'Musée d\'Orsay',
    city: 'Paris',
    country: 'France',
    description: 'Art impressionniste et post-impressionniste',
    image_url: 'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=400&q=80'
  },
  {
    id: 'pompidou',
    name: 'Centre Pompidou',
    city: 'Paris',
    country: 'France',
    description: 'Art moderne et contemporain',
    image_url: 'https://images.unsplash.com/photo-1551866442-64e75e911c23?w=400&q=80'
  }
]

export default function Home() {
  const { user, profile } = useAuth()
  const [recentArtworks, setRecentArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, artists: 0, museums: 0 })
  const [exhibitions, setExhibitions] = useState([])
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true)

  useEffect(() => {
    fetchData()
    fetchExhibitions()
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

  async function fetchExhibitions() {
    try {
      // API Que Faire à Paris - correct URL format
      const url = 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records?limit=10&refine=tags%3Aexposition'

      console.log('Fetching exhibitions from:', url)

      const response = await fetch(url)

      if (!response.ok) {
        console.error('API response not ok:', response.status)
        throw new Error('API unavailable')
      }

      const data = await response.json()
      console.log('API response:', data)

      if (!data.results || data.results.length === 0) {
        console.log('No results from API')
        setExhibitions([])
        return
      }

      const now = new Date()
      const transformed = data.results
        .filter(record => {
          if (!record.date_end) return true
          const endDate = new Date(record.date_end)
          return endDate >= now
        })
        .slice(0, 3)
        .map(record => ({
          id: record.id || Math.random().toString(),
          title: record.title || 'Sans titre',
          venue: record.address_name || record.address_street || 'Paris',
          date_start: record.date_start,
          date_end: record.date_end,
          description: record.lead_text || record.description,
          url: record.url,
          image_url: record.cover_url || record.cover?.url,
        }))

      console.log('Transformed exhibitions:', transformed)
      setExhibitions(transformed)
    } catch (err) {
      console.error('Error fetching exhibitions:', err)
      setExhibitions([])
    } finally {
      setExhibitionsLoading(false)
    }
  }

  function formatDateRange(startDate, endDate) {
    const options = { day: 'numeric', month: 'short' }

    if (!startDate && !endDate) return ''

    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && end) {
      return `${start.toLocaleDateString('fr-FR', options)} - ${end.toLocaleDateString('fr-FR', options)}`
    }

    if (end) return `Jusqu'au ${end.toLocaleDateString('fr-FR', options)}`

    return ''
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
          {profile?.full_name && (
            <p className="text-white/70 font-serif italic mb-4 animate-slide-up">
              Bienvenue, {profile.full_name}
            </p>
          )}
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

      {/* How it works - RIGHT AFTER HERO */}
      <section className="py-20 px-4 bg-bg-light dark:bg-bg-dark">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl text-center mb-4 text-primary dark:text-white">
            Comment ça marche
          </h2>
          <div className="divider-gold mx-auto mb-16" />

          <div className="grid md:grid-cols-3 gap-12 stagger-children">
            {/* Step 1 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">01</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">photo_camera</span>
              </div>
              <h3 className="font-display text-xl mb-2 text-primary dark:text-white">Photographiez</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Capturez une œuvre lors de votre visite au musée
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">02</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">auto_awesome</span>
              </div>
              <h3 className="font-display text-xl mb-2 text-primary dark:text-white">Identifiez</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Notre IA reconnaît l'œuvre et enrichit les informations
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <span className="font-display text-6xl text-accent opacity-30">03</span>
              <div className="w-16 h-16 mx-auto my-4 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-accent">collections</span>
              </div>
              <h3 className="font-display text-xl mb-2 text-primary dark:text-white">Collectionnez</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Constituez votre collection personnelle d'œuvres d'art
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent artworks (if user has artworks) */}
      {stats.total > 0 && (
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-display text-3xl mb-2 text-primary dark:text-white">
                  Récemment ajouté
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
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
        <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-accent">add_photo_alternate</span>
            </div>
            <h2 className="font-display text-3xl mb-4 text-primary dark:text-white">
              Commencez votre collection
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Scannez votre première œuvre d'art et commencez à constituer votre galerie personnelle
            </p>
            <Link to="/scan" className="btn btn-primary btn-lg">
              <span className="material-symbols-outlined">photo_camera</span>
              Scanner une œuvre
            </Link>
          </div>
        </section>
      )}

      {/* Exhibitions */}
      <section className="py-20 px-4 bg-bg-light dark:bg-bg-dark">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl mb-2 text-primary dark:text-white">
                Expositions en cours
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Découvrez les expositions à Paris
              </p>
            </div>
            <Link to="/news" className="btn btn-outline">
              Voir tout
            </Link>
          </div>

          {/* Exhibitions grid */}
          {exhibitionsLoading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : exhibitions.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {exhibitions.map((exhibition) => (
                <a
                  key={exhibition.id}
                  href={exhibition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group overflow-hidden cursor-pointer"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {exhibition.image_url ? (
                      <img
                        src={exhibition.image_url}
                        alt={exhibition.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <span className="material-symbols-outlined text-4xl text-accent/50">museum</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-display text-lg mb-1 line-clamp-2 text-primary dark:text-white group-hover:text-accent transition-colors">
                      {exhibition.title}
                    </h3>
                    <p className="text-accent text-sm mb-1">{exhibition.venue}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {formatDateRange(exhibition.date_start, exhibition.date_end)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-100 dark:bg-gray-800 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">event</span>
              <p className="text-gray-600 dark:text-gray-400">Aucune exposition disponible</p>
            </div>
          )}
        </div>
      </section>

      {/* Museums preview */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl mb-2 text-primary dark:text-white">
                Musées à découvrir
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Explorez les plus grands musées du monde
              </p>
            </div>
            <Link to="/museums" className="btn btn-outline">
              Explorer les musées
            </Link>
          </div>

          {/* Museums grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURED_MUSEUMS.map((museum) => (
              <MuseumCard key={museum.id} museum={museum} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-200 dark:border-gray-800 bg-bg-light dark:bg-bg-dark">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <span className="font-display text-2xl italic text-accent">ArtVault</span>

            {/* Links */}
            <nav className="flex gap-8 text-sm">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                À propos
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                Contact
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-accent transition-colors">
                Mentions légales
              </a>
            </nav>

            {/* Copyright */}
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2026 ArtVault
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
