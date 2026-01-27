import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
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
const goldIcon = L.icon({
  iconUrl: `data:image/svg+xml,${goldSvg}`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
})

// User location marker (blue)
const userSvg = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle fill="#3B82F6" stroke="#fff" stroke-width="3" cx="12" cy="12" r="8"/></svg>`)
const userIcon = L.icon({
  iconUrl: `data:image/svg+xml,${userSvg}`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

export default function MuseumMap({ museums, userLocation, getDistance, formatDistance }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    // Initialize map only once
    if (!mapInstanceRef.current && mapRef.current) {
      const defaultCenter = userLocation 
        ? [userLocation.lat, userLocation.lng]
        : [48.8566, 2.3522] // Paris
      
      const defaultZoom = userLocation ? 12 : 5

      mapInstanceRef.current = L.map(mapRef.current).setView(defaultCenter, defaultZoom)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapInstanceRef.current)
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update markers when museums or userLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add user location marker
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('<div class="text-center p-1"><p class="font-medium">Votre position</p></div>')
      
      markersRef.current.push(userMarker)
      
      // Center on user location
      mapInstanceRef.current.setView([userLocation.lat, userLocation.lng], 12)
    }

    // Add museum markers
    museums.forEach((museum) => {
      const distance = userLocation
        ? formatDistance(getDistance(
            userLocation.lat, userLocation.lng,
            museum.latitude, museum.longitude
          ))
        : null

      const popupContent = `
        <div class="p-1 min-w-[200px]">
          <h3 class="font-semibold text-base mb-1">${museum.name}</h3>
          <p class="text-gray-600 text-sm mb-2">${museum.city}, ${museum.country}</p>
          ${distance ? `<p class="text-amber-600 text-sm mb-2">📍 ${distance}</p>` : ''}
          <a href="/museum/${museum.id}" class="text-amber-600 text-sm hover:underline">Voir le musée →</a>
        </div>
      `

      const marker = L.marker([museum.latitude, museum.longitude], { icon: goldIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup(popupContent)

      markersRef.current.push(marker)
    })
  }, [museums, userLocation, getDistance, formatDistance])

  return (
    <div 
      ref={mapRef} 
      style={{ width: '100%', height: '100%' }}
    />
  )
}
