import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { MuseumCard } from '../components/ui/Card'
import { SkeletonList } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'

export default function Museums() {
  const [museums, setMuseums] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // list, map
  const [userLocation, setUserLocation] = useState(null)

  useEffect(() => {
    fetchMuseums()
    requestLocation()
  }, [])

  async function fetchMuseums() {
    const { data, error } = await supabase
      .from('museums')
      .select('*')
      .order('name')

    if (!error) {
      setMuseums(data || [])
    }
    setLoading(false)
  }

  function requestLocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        () => {
          // User denied or error
          console.log('Location not available')
        }
      )
    }
  }

  // Calculate distance between two points
  function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Format distance
  function formatDistance(km) {
    if (km < 1) return `${Math.round(km * 1000)}m`
    return `${km.toFixed(1)} km`
  }

  // Sort museums by distance if location available
  const sortedMuseums = userLocation
    ? [...museums].sort((a, b) => {
        if (!a.latitude || !b.latitude) return 0
        const distA = getDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude)
        const distB = getDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude)
        return distA - distB
      })
    : museums

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="font-display text-3xl md:text-4xl italic mb-2">
              Musées
            </h1>
            <p className="text-secondary">
              {userLocation ? 'À proximité' : 'Tous les musées'}
            </p>
          </div>

          {/* View toggle */}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            className="btn btn-ghost btn-icon"
          >
            <span className="material-symbols-outlined">
              {viewMode === 'list' ? 'map' : 'list'}
            </span>
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 max-w-4xl mx-auto">
        {loading ? (
          <SkeletonList count={5} />
        ) : museums.length === 0 ? (
          <EmptyState
            icon="museum"
            title="Aucun musée"
            description="Les musées seront bientôt disponibles"
          />
        ) : (
          <div className="space-y-3">
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
        )}
      </div>
    </div>
  )
}
