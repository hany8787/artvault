import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom gold marker for museums
const goldSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36"><path fill="#C9A227" stroke="#1A1A1A" stroke-width="1" d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/><circle fill="#1A1A1A" cx="12" cy="12" r="5"/></svg>`)
const goldIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${goldSvg}`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})

// User location marker (blue)
const userSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle fill="#3B82F6" stroke="#fff" stroke-width="3" cx="12" cy="12" r="8"/></svg>`)
const userIcon = new L.Icon({
  iconUrl: `data:image/svg+xml,${userSvg}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// Component to recenter map
function RecenterMap({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12)
    }
  }, [center, zoom, map])
  return null
}

export default function MuseumMap({ museums, userLocation, getDistance, formatDistance }) {
  // Default center: Paris or user location
  const defaultCenter = userLocation 
    ? [userLocation.lat, userLocation.lng]
    : [48.8566, 2.3522] // Paris

  const defaultZoom = userLocation ? 12 : 5

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ width: '100%', height: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Recenter when user location changes */}
      {userLocation && <RecenterMap center={[userLocation.lat, userLocation.lng]} zoom={12} />}

      {/* User location marker */}
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>
            <div className="text-center p-1">
              <p className="font-medium">Votre position</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Museum markers */}
      {museums.map((museum) => {
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
                  <p className="text-amber-600 text-sm mb-2">
                    📍 {distance}
                  </p>
                )}
                <Link
                  to={`/museum/${museum.id}`}
                  className="text-amber-600 text-sm hover:underline"
                >
                  Voir le musée →
                </Link>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}
