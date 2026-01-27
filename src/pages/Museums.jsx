import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { MuseumCard } from '../components/ui/Card'
import { SkeletonList } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'

// Lazy load Leaflet to avoid React 18 StrictMode issues
let L = null
let MapContainer = null
let TileLayer = null
let Marker = null
let Popup = null
let useMap = null
let goldIcon = null
let userIcon = null
let leafletLoaded = false

async function loadLeaflet() {
  if (leafletLoaded) return true

  try {
    // Import Leaflet CSS
    await import('leaflet/dist/leaflet.css')

    // Import Leaflet
    const leaflet = await import('leaflet')
    L = leaflet.default

    // Import react-leaflet components
    const reactLeaflet = await import('react-leaflet')
    MapContainer = reactLeaflet.MapContainer
    TileLayer = reactLeaflet.TileLayer
    Marker = reactLeaflet.Marker
    Popup = reactLeaflet.Popup
    useMap = reactLeaflet.useMap

    // Fix for default marker icon
    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })

    // Custom gold marker for museums - using URL-encoded SVG
    const goldSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="#C9A227" stroke="#1A1A1A" stroke-width="1" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/><circle fill="#1A1A1A" cx="12" cy="12" r="5"/></svg>`)
    goldIcon = new L.Icon({
      iconUrl: `data:image/svg+xml,${goldSvg}`,
      iconSize: [24, 36],
      iconAnchor: [12, 36],
      popupAnchor: [0, -36],
    })

    // User location marker (blue)
    const userSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle fill="#3B82F6" stroke="#fff" stroke-width="3" cx="12" cy="12" r="8"/></svg>`)
    userIcon = new L.Icon({
      iconUrl: `data:image/svg+xml,${userSvg}`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    leafletLoaded = true
    return true
  } catch (error) {
    console.error('Failed to load Leaflet:', error)
    return false
  }
}

// Component to recenter map - defined inside component to avoid hoisting issues
function createRecenterComponent() {
  return function RecenterMap({ center }) {
    const map = useMap()
    useEffect(() => {
      if (center && map) {
        map.setView(center, 12)
      }
    }, [center, map])
    return null
  }
}

export default function Museums() {
  const [museums, setMuseums] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('list') // list, map
  const [userLocation, setUserLocation] = useState(null)
  const [locationLoading, setLocationLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)

  useEffect(() => {
    fetchMuseums()
    requestLocation()
  }, [])

  // Load Leaflet when switching to map view
  useEffect(() => {
    if (viewMode === 'map' && !mapReady && !mapError) {
      loadLeaflet().then(success => {
        if (success) {
          setMapReady(true)
        } else {
          setMapError(true)
        }
      })
    }
  }, [viewMode, mapReady, mapError])

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
          console.log('Location not available:', error.message)
          setLocationLoading(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    }
  }

  // Calculate distance using Haversine formula
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
    if (km < 1) return `${Math.round(km * 1000)} m`
    if (km < 10) return `${km.toFixed(1)} km`
    return `${Math.round(km)} km`
  }

  // Filter museums by search
  const filteredMuseums = museums.filter(museum =>
    museum.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    museum.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    museum.country?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort museums by distance if location available
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

  // Default map center (Paris if no user location)
  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [48.8566, 2.3522]

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-3xl md:text-4xl italic text-primary dark:text-white mb-2">
              Musées
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userLocation
                ? `${museumsWithCoords.length} musées trouvés`
                : locationLoading
                ? 'Localisation en cours...'
                : `${museums.length} musées dans le monde`
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
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un musée, une ville..."
            className="input pl-10 w-full"
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
        ) : (
          /* Map View */
          <div
            className="rounded-xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
            style={{ height: '70vh', minHeight: '400px' }}
          >
            {mapError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">error</span>
                <p className="text-gray-600 dark:text-gray-400">Impossible de charger la carte</p>
                <button
                  onClick={() => { setMapError(false); setMapReady(false); }}
                  className="mt-4 btn btn-primary"
                >
                  Réessayer
                </button>
              </div>
            ) : !mapReady ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800">
                <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Chargement de la carte...</p>
              </div>
            ) : MapContainer && TileLayer && Marker && Popup ? (
              <MapContainer
                key={`museum-map-${mapCenter[0]}-${mapCenter[1]}`}
                center={mapCenter}
                zoom={userLocation ? 12 : 5}
                style={{ width: '100%', height: '100%' }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* User location marker */}
                {userLocation && userIcon && (
                  <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                    <Popup>
                      <div className="text-center p-1">
                        <p className="font-medium">Votre position</p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Museum markers */}
                {museumsWithCoords.map((museum) => {
                  const distance = userLocation
                    ? formatDistance(getDistance(
                        userLocation.lat, userLocation.lng,
                        museum.latitude, museum.longitude
                      ))
                    : null

                  return (
                    <Marker
                      key={museum.id}
                      position={[museum.latitude, museum.longitude]}
                      icon={goldIcon}
                    >
                      <Popup>
                        <div className="p-1 min-w-[200px]">
                          <h3 className="font-semibold text-base mb-1">{museum.name}</h3>
                          <p className="text-gray-600 text-sm mb-2">
                            {museum.city}, {museum.country}
                          </p>
                          {distance && (
                            <p className="text-accent text-sm mb-2">
                              <span className="material-symbols-outlined text-sm align-middle mr-1">directions_walk</span>
                              {distance}
                            </p>
                          )}
                          <Link
                            to={`/museum/${museum.id}`}
                            className="text-accent text-sm hover:underline"
                          >
                            Voir le musée →
                          </Link>
                        </div>
                      </Popup>
                    </Marker>
                  )
                })}
              </MapContainer>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
