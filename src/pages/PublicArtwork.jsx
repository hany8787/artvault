/**
 * Public Artwork View
 * Displays a shared artwork without requiring authentication
 */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { SkeletonCard } from '../components/ui/Loader'

export default function PublicArtwork() {
  const { token } = useParams()
  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (token) {
      fetchArtwork()
    }
  }, [token])

  async function fetchArtwork() {
    try {
      const { data, error } = await supabase.rpc('get_public_artwork', { p_token: token })

      if (error) throw error
      if (!data || data.length === 0) {
        setError('Cette œuvre n\'existe pas ou n\'est plus partagée.')
        return
      }

      setArtwork(data[0])
    } catch (err) {
      console.error('Error fetching public artwork:', err)
      setError('Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  async function shareArtwork() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `${artwork.title}${artwork.artist ? ` de ${artwork.artist}` : ''} - ArtVault`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Lien copié !')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark pb-24">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-white/40">visibility_off</span>
          </div>
          <h1 className="font-display text-2xl text-primary dark:text-white mb-3">Œuvre non disponible</h1>
          <p className="text-secondary mb-6">{error}</p>
          <Link to="/" className="btn btn-primary">
            Découvrir ArtVault
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-default">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="font-display text-xl italic text-accent">
            ArtVault
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-secondary px-2 py-1 rounded-full bg-accent/10 border border-accent/20">
              <span className="material-symbols-outlined text-xs align-middle mr-1">visibility</span>
              {artwork.public_views || 1} vue{(artwork.public_views || 1) > 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto">
        {/* Hero Image */}
        <div className="relative bg-black">
          <div className="aspect-[4/3] md:aspect-[16/9] max-h-[70vh] flex items-center justify-center">
            <img
              src={artwork.image_url}
              alt={artwork.title}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>

        {/* Artwork Info */}
        <div className="px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Title & Artist */}
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl md:text-4xl italic text-primary dark:text-white mb-2">
                {artwork.title}
              </h1>
              {artwork.artist && (
                <p className="text-xl text-accent">{artwork.artist}</p>
              )}
              {artwork.year && (
                <p className="text-secondary mt-1">{artwork.year}</p>
              )}
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {artwork.museum && (
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <span className="material-symbols-outlined text-accent text-2xl mb-2">museum</span>
                  <p className="text-sm text-secondary">Musée</p>
                  <p className="font-medium text-primary dark:text-white">{artwork.museum}</p>
                  {artwork.museum_city && (
                    <p className="text-xs text-secondary">{artwork.museum_city}</p>
                  )}
                </div>
              )}

              {artwork.medium && (
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <span className="material-symbols-outlined text-purple-500 text-2xl mb-2">palette</span>
                  <p className="text-sm text-secondary">Technique</p>
                  <p className="font-medium text-primary dark:text-white">{artwork.medium}</p>
                </div>
              )}

              {artwork.period && (
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <span className="material-symbols-outlined text-blue-500 text-2xl mb-2">history</span>
                  <p className="text-sm text-secondary">Période</p>
                  <p className="font-medium text-primary dark:text-white">{artwork.period}</p>
                </div>
              )}

              {artwork.style && (
                <div className="bg-white dark:bg-surface-dark rounded-xl p-4 border border-gray-100 dark:border-gray-800">
                  <span className="material-symbols-outlined text-emerald-500 text-2xl mb-2">style</span>
                  <p className="text-sm text-secondary">Style</p>
                  <p className="font-medium text-primary dark:text-white">{artwork.style}</p>
                </div>
              )}
            </div>

            {/* Description */}
            {artwork.description && (
              <div className="bg-white dark:bg-surface-dark rounded-xl p-6 border border-gray-100 dark:border-gray-800 mb-8">
                <h2 className="font-display text-lg text-primary dark:text-white mb-3">Description</h2>
                <p className="text-secondary leading-relaxed whitespace-pre-line">
                  {artwork.description}
                </p>
              </div>
            )}

            {/* Curatorial Note */}
            {artwork.curatorial_note && (
              <div className="bg-accent/5 dark:bg-accent/10 rounded-xl p-6 border border-accent/20 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-accent">auto_awesome</span>
                  <h2 className="font-display text-lg text-accent">Note curatoriale</h2>
                </div>
                <p className="text-secondary leading-relaxed whitespace-pre-line">
                  {artwork.curatorial_note}
                </p>
              </div>
            )}

            {/* Share Section */}
            <div className="text-center py-8 border-t border-primary/10">
              <p className="text-secondary text-sm mb-4">Partagez cette œuvre</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={shareArtwork}
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-black rounded-lg hover:bg-accent-hover transition-colors font-medium"
                >
                  <span className="material-symbols-outlined">share</span>
                  Partager
                </button>

                {/* Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${artwork.title}${artwork.artist ? ` de ${artwork.artist}` : ''} via @ArtVault`)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                  title="Partager sur Twitter"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                  title="Partager sur Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center py-8 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-2xl border border-accent/20">
              <h2 className="font-display text-xl text-primary dark:text-white mb-2">
                Créez votre collection d'art
              </h2>
              <p className="text-secondary text-sm mb-4 max-w-md mx-auto">
                Scannez, identifiez et collectionnez vos œuvres préférées avec l'IA
              </p>
              <Link to="/" className="btn btn-primary">
                Découvrir ArtVault
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-secondary text-sm border-t border-primary/10">
        <p>Partagé via <Link to="/" className="text-accent hover:underline">ArtVault</Link></p>
      </footer>
    </div>
  )
}
