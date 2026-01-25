import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ArtworkDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArtwork()
  }, [id])

  async function fetchArtwork() {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error || !data) {
      navigate('/collection')
      return
    }
    
    setArtwork(data)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-primary">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Back button */}
      <div className="p-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Retour
        </button>
      </div>

      {/* Image */}
      <div className="aspect-[4/3] bg-surface-dark">
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-white/20">image</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 md:p-8">
        {/* Title & Artist */}
        <div className="mb-6">
          <h1 className="font-display text-3xl font-bold italic text-white mb-2">
            {artwork.title}
          </h1>
          <p className="text-xl text-white/80">
            {artwork.artist || 'Artiste inconnu'}
            {artwork.artist_dates && (
              <span className="text-white/40 ml-2">{artwork.artist_dates}</span>
            )}
          </p>
          {artwork.year && (
            <p className="text-white/60 mt-1">{artwork.year}</p>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6">
          {artwork.period && (
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
              {artwork.period}
            </span>
          )}
          {artwork.style && (
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
              {artwork.style}
            </span>
          )}
          {artwork.medium && (
            <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
              {artwork.medium}
            </span>
          )}
        </div>

        {/* Museum */}
        {artwork.museum && (
          <div className="glass rounded-xl p-4 mb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Localisation</p>
            <p className="text-white font-medium">{artwork.museum}</p>
            {(artwork.museum_city || artwork.museum_country) && (
              <p className="text-white/60 text-sm">
                {[artwork.museum_city, artwork.museum_country].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Description */}
        {artwork.description && (
          <div className="mb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Description</p>
            <p className="text-white/80 leading-relaxed">{artwork.description}</p>
          </div>
        )}

        {/* Curatorial Note */}
        {artwork.curatorial_note && (
          <div className="border-l-2 border-primary pl-4 mb-6">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Note curatoriale</p>
            <p className="font-display italic text-primary/90 leading-relaxed">
              {artwork.curatorial_note}
            </p>
          </div>
        )}

        {/* Details */}
        {artwork.dimensions && (
          <div className="text-sm text-white/60">
            <span className="text-white/40">Dimensions : </span>
            {artwork.dimensions}
          </div>
        )}
      </div>
    </div>
  )
}