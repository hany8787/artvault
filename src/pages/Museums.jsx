import { useState, useEffect, lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MuseumCard } from '../components/ui/Card'
import { SkeletonList } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'

// Lazy load the map component
const MuseumMap = lazy(() => import('../components/MuseumMap'))

export default function Museums() {
  const [museums, setMuseums] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // list, map
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchMuseums()
    requestLocation()
  }, [])

  async function fetchMuseums() {
    try {
      // Get exact count first
      const { count } = await supabase
        .from('museums')
        .select('*', { count: 'exact', head: true })

      setTotalCount(count || 0)

      // Fetch all museums (Supabase default limit is 1000, need to increase)
      const { data, error } = await supabase
        .from('museums')
        .select('*')
        .order('name')
        .range(0, 2999) // Get up to 3000 museums

      if (error) throw error
      setMuseums(data || [])
    } catch (error) {
      console.error('Error fetching museums:', error)
    } finally {
      setLoading(false)
    }
  }

  function requestLocation() {
    if (!navigator.geolocation) return

    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLocationLoading(false)
      },
      (error) => {
        console.log('Geolocation error:', error.message)
        setLocationLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    )
  }

  // Calculate distance between two points
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${km.toFixed(1)} km`
  }

  // Filter museums by search
  const filteredMuseums = museums.filter((museum) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      museum.name?.toLowerCase().includes(query) ||
      museum.city?.toLowerCase().includes(query) ||
      museum.country?.toLowerCase().includes(query)
    )
  })

  // Sort by distance if user location available
  const sortedMuseums = userLocation
    ? [...filteredMuseums].sort((a, b) => {
        if (!a.latitude || !b.latitude) return 0
        const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
        const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        return distA - distB
      })
    : filteredMuseums

  // Museums with coordinates for map
  const museumsWithCoords = sortedMuseums.filter(m => m.latitude && m.longitude)

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-4 pt-6 bg-white dark:bg-bg-dark sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-display font-bold italic">Musées</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userLocation
                ? `${museumsWithCoords.length} musées à proximité`
                : locationLoading
                ? 'Localisation en cours...'
                : `${totalCount || museums.length} musées dans le monde`
              }
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`btn btn-icon ${viewMode === 'list' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <span className="material-symbols-outlined">list</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`btn btn-icon ${viewMode === 'map' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <span className="material-symbols-outlined">map</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un musée, une ville..."
            className="input w-full"
            style={{ paddingLeft: '3rem' }}
          />
        </div>

        {/* Location status */}
        {!userLocation && !locationLoading && (
          <button
            onClick={requestLocation}
            className="mt-4 flex items-center gap-2 text-accent text-sm hover:underline"
          >
            <span className="material-symbols-outlined text-lg">my_location</span>
            Activer la géolocalisation pour trier par proximité
          </button>
        )}
        </div>
      </header>

      {/* Content */}
      <div className="px-4 max-w-6xl mx-auto">
        {loading ? (
          <SkeletonList count={5} />
        ) : sortedMuseums.length === 0 ? (
          <EmptyState
            icon="museum"
            title="Aucun musée trouvé"
            description={searchQuery ? "Essayez une autre recherche" : "Les musées seront bientôt disponibles"}
          />
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-3 mt-4">
            {sortedMuseums.map((museum) => {
              const distance = userLocation && museum.latitude
                ? formatDistance(getDistance(
                    userLocation.lat, userLocation.lng,
                    museum.latitude, museum.longitude
                  ))
                : null

              return (
                <MuseumCard
                  key={museum.id}
                  museum={museum}
                  distance={distance}
                />
              )
            })}
          </div>
        ) : (
          /* Map View */
          <div
            className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 mt-4"
            style={{ height: '70vh', minHeight: '400px' }}
          >
            <Suspense fallback={
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement de la carte...</p>
              </div>
            }>
              <MuseumMap 
                museums={museumsWithCoords}
                userLocation={userLocation}
                getDistance={getDistance}
                formatDistance={formatDistance}
              />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
