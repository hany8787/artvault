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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMuseum()
    fetchArtworks()
  }, [id])

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

  function openMaps() {
    if (!museum) return
    const query = encodeURIComponent(`${museum.name}, ${museum.address || museum.city}`)
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank')
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
            <p className="text-secondary mb-4">
              {museum.address}
            </p>
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
              <p className="text-secondary leading-relaxed">
                {museum.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={openMaps}
            className="btn btn-primary w-full"
          >
            <span className="material-symbols-outlined">directions</span>
            Y aller
          </button>
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
