import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArtworkCard } from '../components/ui/Card'
import Loader from '../components/ui/Loader'

export default function MuseumDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [museum, setMuseum] = useState(null)
  const [artworks, setArtworks] = useState([])
  const [exhibitions, setExhibitions] = useState([])
  const [loadingExhibitions, setLoadingExhibitions] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMuseum()
    fetchArtworks()
  }, [id])

  // Fetch exhibitions when museum is loaded
  useEffect(() => {
    if (museum) {
      fetchExhibitions()
    }
  }, [museum])

  async function fetchMuseum() {
    const { data, error } = await supabase
      .from('museums')
      .select('*')
      .eq('id', id)
      .single()

    if (!error) {
      setMuseum(data)
    }
    setLoading(false)
  }

  async function fetchArtworks() {
    if (!user) return

    const { data } = await supabase
      .from('artworks')
      .select('*')
      .eq('user_id', user.id)
      .eq('museum_id', id)
      .order('created_at', { ascending: false })

    setArtworks(data || [])
  }

  async function fetchExhibitions() {
    // Only fetch from API for Paris museums
    const isParis = museum.city?.toLowerCase().includes('paris')
    if (!isParis) return

    setLoadingExhibitions(true)
    try {
      const response = await fetch(
        'https://dzjgilplznhhwwitjztf.supabase.co/functions/v1/get-exhibitions?limit=100'
      )
      const data = await response.json()

      if (data.success) {
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        // Extract keywords from museum name (remove common words)
        const stopWords = ['musée', 'museum', 'de', 'du', 'la', 'le', 'les', 'd', 'l', 'des', 'centre', 'national', 'paris']
        const museumWords = museum.name
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
          .split(/[\s\-']+/)
          .filter(word => word.length > 2 && !stopWords.includes(word))

        const matched = data.data.filter(expo => {
          // Check if exhibition is current or future
          if (expo.date_end) {
            const endDate = new Date(expo.date_end)
            if (endDate < now) return false
          }

          // Match by venue, address, title, or description
          const venue = (expo.venue || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const address = (expo.address || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const title = (expo.title || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const description = (expo.description || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          const searchText = venue + ' ' + address + ' ' + title + ' ' + description
          
          // Check if any keyword from museum name appears
          return museumWords.some(word => searchText.includes(word))
        })

        setExhibitions(matched)
      }
    } catch (err) {
      console.error('Error fetching exhibitions:', err)
    } finally {
      setLoadingExhibitions(false)
    }
  }

  function openMaps() {
    if (!museum) return
    const query = encodeURIComponent(`${museum.name}, ${museum.address || museum.city}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
  }

  function formatDateRange(startDate, endDate) {
    const options = { day: 'numeric', month: 'long', year: 'numeric' }
    if (!startDate && !endDate) return 'Dates non communiquées'
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    if (start && end) {
      return `Du ${start.toLocaleDateString('fr-FR', options)} au ${end.toLocaleDateString('fr-FR', options)}`
    }
    if (start) return `À partir du ${start.toLocaleDateString('fr-FR', options)}`
    if (end) return `Jusqu'au ${end.toLocaleDateString('fr-FR', options)}`
    return ''
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Chargement..." />
      </div>
    )
  }

  if (!museum) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-secondary">Musée non trouvé</p>
      </div>
    )
  }

  const isParis = museum.city?.toLowerCase().includes('paris')

  return (
    <div className="min-h-screen pb-24">
      {/* Hero Image */}
      <div className="relative h-64 md:h-80 bg-secondary">
        {museum.image_url ? (
          <img
            src={museum.image_url}
            alt={museum.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-secondary">museum</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-light dark:from-bg-dark to-transparent" />

        {/* Back button */}
        <Link
          to="/museums"
          className="absolute top-4 left-4 btn btn-ghost btn-icon glass"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </div>

      {/* Content */}
      <div className="px-4 max-w-4xl mx-auto -mt-16 relative z-10">
        {/* Museum Info */}
        <div className="bg-bg-light dark:bg-bg-dark rounded-xl shadow-lg p-6 mb-8">
          <h1 className="font-display text-3xl italic mb-2">{museum.name}</h1>

          {museum.address && (
            <p className="text-secondary mb-4">{museum.address}</p>
          )}

          {/* Quick info */}
          <div className="flex flex-wrap gap-4 mb-6">
            {museum.city && (
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-lg">location_on</span>
                <span>{museum.city}{museum.country ? `, ${museum.country}` : ''}</span>
              </div>
            )}
            {museum.website && (
              <a
                href={museum.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-accent hover:underline"
              >
                <span className="material-symbols-outlined text-lg">language</span>
                <span>Site web</span>
              </a>
            )}
            {museum.phone && (
              <a
                href={`tel:${museum.phone}`}
                className="flex items-center gap-2 text-secondary"
              >
                <span className="material-symbols-outlined text-lg">phone</span>
                <span>{museum.phone}</span>
              </a>
            )}
          </div>

          {/* Description */}
          {museum.description && (
            <div className="mb-6">
              <h2 className="label mb-2">À propos</h2>
              <p className="text-secondary leading-relaxed">{museum.description}</p>
            </div>
          )}

          {/* Actions */}
          <button onClick={openMaps} className="btn btn-primary w-full">
            <span className="material-symbols-outlined">directions</span>
            Y aller
          </button>
        </div>

        {/* Exhibitions Section */}
        <div className="mb-8">
          <h2 className="font-display text-2xl italic mb-4">Expositions en cours</h2>

          {isParis ? (
            // Paris museums: show exhibitions from API
            loadingExhibitions ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-secondary text-sm">Recherche des expositions...</p>
              </div>
            ) : exhibitions.length > 0 ? (
              <div className="space-y-4">
                {exhibitions.map((expo) => (
                  <a
                    key={expo.id}
                    href={expo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-secondary rounded-xl overflow-hidden hover:ring-2 hover:ring-accent transition-all"
                  >
                    <div className="flex gap-4">
                      {expo.image_url && (
                        <div className="w-24 h-24 flex-shrink-0">
                          <img
                            src={expo.image_url}
                            alt={expo.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 py-3 pr-4">
                        <h3 className="font-medium line-clamp-2 mb-1">{expo.title}</h3>
                        <p className="text-secondary text-sm">
                          {formatDateRange(expo.date_start, expo.date_end)}
                        </p>
                        {expo.is_free && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                            Gratuit
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-secondary rounded-xl">
                <span className="material-symbols-outlined text-3xl text-secondary mb-2">event</span>
                <p className="text-secondary">Aucune exposition trouvée pour ce musée</p>
                {museum.website && (
                  <a
                    href={museum.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent text-sm mt-2 hover:underline"
                  >
                    Voir le site officiel
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                )}
              </div>
            )
          ) : (
            // Non-Paris museums: link to official website
            <div className="text-center py-8 bg-secondary rounded-xl">
              <span className="material-symbols-outlined text-3xl text-secondary mb-2">language</span>
              <p className="text-secondary mb-3">
                Consultez les expositions sur le site officiel
              </p>
              {museum.website && (
                <a
                  href={museum.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  Voir les expositions
                  <span className="material-symbols-outlined text-lg">open_in_new</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* My artworks from this museum */}
        <div>
          <h2 className="font-display text-2xl italic mb-4">
            Mes œuvres de ce musée
          </h2>

          {artworks.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-xl">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">collections</span>
              <p className="text-secondary">
                Vous n'avez pas encore d'œuvres de ce musée
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {artworks.map((artwork) => (
                <ArtworkCard key={artwork.id} artwork={artwork} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
