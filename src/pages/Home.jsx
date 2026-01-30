import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { ArtworkCard, MuseumCard } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Loader'

export default function Home() {
  const { user, profile } = useAuth()
  const [recentArtworks, setRecentArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, artists: 0, museums: 0 })
  const [exhibitions, setExhibitions] = useState([])
  const [exhibitionsLoading, setExhibitionsLoading] = useState(true)
  const [featuredMuseums, setFeaturedMuseums] = useState([])
  const [museumsLoading, setMuseumsLoading] = useState(true)
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    fetchData()
    fetchExhibitions()
    // Get user location for museum recommendations
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        () => {} // Ignore errors
      )
    }
  }, [user])

  // Fetch museums when we have collection data or location
  useEffect(() => {
    fetchFeaturedMuseums()
  }, [user, recentArtworks, userLocation])

  async function fetchData() {
    if (!user) return

    try {
      // Fetch recent artworks
      const { data: artworks } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6)

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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const response = await fetch(`${supabaseUrl}/functions/v1/get-exhibitions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({ limit: 5 })
      })

      if (!response.ok) {
        setExhibitions([])
        return
      }

      const data = await response.json()
      setExhibitions(data?.exhibitions || [])
    } catch (err) {
      console.error('Error fetching exhibitions:', err)
      setExhibitions([])
    } finally {
      setExhibitionsLoading(false)
    }
  }

  async function fetchFeaturedMuseums() {
    try {
      let recommendedMuseums = []

      // Strategy 1: Get museums from user's recent artworks
      if (user && recentArtworks.length > 0) {
        const museumNames = [...new Set(recentArtworks.map(a => a.museum).filter(Boolean))]
        if (museumNames.length > 0) {
          const { data: collectionMuseums } = await supabase
            .from('museums')
            .select('*')
            .in('name', museumNames)
            .limit(4)

          if (collectionMuseums?.length > 0) {
            recommendedMuseums = collectionMuseums
          }
        }
      }

      // Strategy 2: If user has location, get nearby museums
      if (recommendedMuseums.length < 4 && userLocation) {
        const { data: nearbyMuseums } = await supabase
          .from('museums')
          .select('*')
          .not('latitude', 'is', null)
          .limit(20)

        if (nearbyMuseums?.length > 0) {
          // Sort by distance and take closest ones
          const withDistance = nearbyMuseums.map(m => ({
            ...m,
            distance: getDistance(userLocation.lat, userLocation.lng, m.latitude, m.longitude)
          })).sort((a, b) => a.distance - b.distance)

          const existingIds = new Set(recommendedMuseums.map(m => m.id))
          const nearby = withDistance.filter(m => !existingIds.has(m.id)).slice(0, 4 - recommendedMuseums.length)
          recommendedMuseums = [...recommendedMuseums, ...nearby]
        }
      }

      // Strategy 3: Fall back to famous Paris museums
      if (recommendedMuseums.length < 4) {
        const famousNames = ['Musée du Louvre', 'Musée d\'Orsay', 'Centre Pompidou', 'Musée de l\'Orangerie']
        const { data: famousMuseums } = await supabase
          .from('museums')
          .select('*')
          .in('name', famousNames)
          .limit(4 - recommendedMuseums.length)

        if (famousMuseums?.length > 0) {
          const existingIds = new Set(recommendedMuseums.map(m => m.id))
          const famous = famousMuseums.filter(m => !existingIds.has(m.id))
          recommendedMuseums = [...recommendedMuseums, ...famous]
        }
      }

      setFeaturedMuseums(recommendedMuseums.slice(0, 4))
    } catch (err) {
      console.error('Error fetching featured museums:', err)
      setFeaturedMuseums([])
    } finally {
      setMuseumsLoading(false)
    }
  }

  // Calculate distance between two points (Haversine formula)
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
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
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark pb-24">
      {/* Compact Hero - App Style */}
      <section className="relative pt-6 pb-8 px-4 bg-gradient-to-b from-accent/10 to-transparent">
        <div className="max-w-lg mx-auto">
          {/* Greeting */}
          <div className="mb-6">
            <p className="text-sm text-secondary mb-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <h1 className="font-display text-2xl md:text-3xl text-primary dark:text-white">
              Bonjour{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''} 👋
            </h1>
          </div>

          {/* Scanner Card - Hero CTA */}
          <Link
            to="/scan"
            className="block relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent to-amber-600 p-6 shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-white">photo_camera</span>
                </div>
                <div>
                  <h2 className="font-semibold text-lg text-white">Scanner une œuvre</h2>
                  <p className="text-white/80 text-sm">Identifiez avec l'IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <span>Commencer</span>
                <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-white/5" />
          </Link>
        </div>
      </section>

      {/* Comment ça marche - Compact */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-2xl text-primary dark:text-white mb-5 text-center">Comment ça marche</h2>

          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
            <div className="flex-shrink-0 w-44 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-white">1</div>
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-accent">photo_camera</span>
              </div>
              <h3 className="font-semibold text-base text-primary dark:text-white mb-1">Photographiez</h3>
              <p className="text-sm text-secondary">Capturez l'œuvre</p>
            </div>
            <div className="flex-shrink-0 w-44 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold text-white">2</div>
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-purple-500">auto_awesome</span>
              </div>
              <h3 className="font-semibold text-base text-primary dark:text-white mb-1">Identifiez</h3>
              <p className="text-sm text-secondary">L'IA reconnaît</p>
            </div>
            <div className="flex-shrink-0 w-44 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 text-center relative">
              <div className="absolute -top-2 -left-2 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white">3</div>
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-blue-500">collections</span>
              </div>
              <h3 className="font-semibold text-base text-primary dark:text-white mb-1">Collectionnez</h3>
              <p className="text-sm text-secondary">Votre galerie</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ma Collection - Quick Stats */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-primary dark:text-white">Ma Collection</h2>
            <Link to="/collection" className="text-accent font-medium flex items-center gap-1">
              Voir tout
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </Link>
          </div>

          {/* Stats Cards - Horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar mb-5">
            <Link to="/collection" className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 min-w-[130px]">
              <span className="material-symbols-outlined text-3xl text-accent mb-2">collections</span>
              <p className="text-3xl font-bold text-primary dark:text-white">{stats.total}</p>
              <p className="text-sm text-secondary">œuvres</p>
            </Link>
            <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 min-w-[130px]">
              <span className="material-symbols-outlined text-3xl text-purple-500 mb-2">palette</span>
              <p className="text-3xl font-bold text-primary dark:text-white">{stats.artists}</p>
              <p className="text-sm text-secondary">artistes</p>
            </div>
            <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 min-w-[130px]">
              <span className="material-symbols-outlined text-3xl text-blue-500 mb-2">museum</span>
              <p className="text-3xl font-bold text-primary dark:text-white">{stats.museums}</p>
              <p className="text-sm text-secondary">musées</p>
            </div>
          </div>

          {/* Recent Artworks - Horizontal scroll */}
          {loading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-40">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : recentArtworks.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {recentArtworks.map((artwork) => (
                <div key={artwork.id} className="flex-shrink-0 w-40">
                  <ArtworkCard artwork={artwork} compact />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">add_photo_alternate</span>
              <p className="text-secondary text-sm mb-3">Votre collection est vide</p>
              <Link to="/scan" className="text-accent text-sm font-medium">
                Scanner ma première œuvre →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Actualités / Expositions */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-primary dark:text-white">Actualités</h2>
            <Link to="/news" className="text-accent font-medium flex items-center gap-1">
              Voir tout
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </Link>
          </div>

          {/* Exhibitions - Horizontal scroll cards */}
          {exhibitionsLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-64">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : exhibitions.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {exhibitions.map((exhibition) => (
                <a
                  key={exhibition.id}
                  href={exhibition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 w-64 bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {exhibition.image_url ? (
                      <img
                        src={exhibition.image_url}
                        alt={exhibition.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.onerror = null
                          e.target.src = 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=400&q=80'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300">museum</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-primary dark:text-white line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                      {exhibition.title}
                    </h3>
                    <p className="text-accent text-xs mb-0.5">{exhibition.venue}</p>
                    <p className="text-secondary text-xs">
                      {formatDateRange(exhibition.date_start, exhibition.date_end)}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">event</span>
              <p className="text-secondary text-sm">Aucune exposition disponible</p>
            </div>
          )}
        </div>
      </section>

      {/* Musées à découvrir */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl text-primary dark:text-white">Musées recommandés</h2>
            <Link to="/museums" className="text-accent font-medium flex items-center gap-1">
              Explorer
              <span className="material-symbols-outlined text-xl">chevron_right</span>
            </Link>
          </div>

          {/* Museums - Horizontal scroll */}
          {museumsLoading ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-48">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : featuredMuseums.length > 0 ? (
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
              {featuredMuseums.map((museum) => (
                <Link
                  key={museum.id}
                  to={`/museum/${museum.id}`}
                  className="flex-shrink-0 w-52 bg-white dark:bg-surface-dark rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {museum.image_url ? (
                      <img
                        src={museum.image_url}
                        alt={museum.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-accent/10">
                        <span className="material-symbols-outlined text-3xl text-accent/50">museum</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-sm text-primary dark:text-white line-clamp-1 mb-0.5">
                      {museum.name}
                    </h3>
                    <p className="text-secondary text-xs">
                      {museum.city}{museum.country ? `, ${museum.country}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-surface-dark rounded-xl p-6 text-center border border-gray-100 dark:border-gray-800">
              <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2">museum</span>
              <p className="text-secondary text-sm mb-3">Découvrez les musées</p>
              <Link to="/museums" className="text-accent text-sm font-medium">
                Explorer →
              </Link>
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
