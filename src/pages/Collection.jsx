import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function Collection() {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchArtworks()
  }, [user])

  async function fetchArtworks() {
    if (!user) return
    
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (!error) {
      setArtworks(data || [])
    }
    setLoading(false)
  }

  const filteredArtworks = artworks.filter(artwork =>
    artwork.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artwork.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artwork.museum?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-primary">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Ma collection</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          {artworks.length} œuvre{artworks.length > 1 ? 's' : ''}
        </h1>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
        />
      </div>

      {/* Grid */}
      {filteredArtworks.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-white/20 mb-4">collections</span>
          <p className="text-white/60 mb-4">
            {searchQuery ? 'Aucun résultat' : 'Votre collection est vide'}
          </p>
          {!searchQuery && (
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 bg-primary text-bg-dark font-semibold px-6 py-3 rounded-lg"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Scanner une œuvre
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtworks.map((artwork) => (
            <Link
              key={artwork.id}
              to={`/artwork/${artwork.id}`}
              className="group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-surface-dark">
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-white/20">image</span>
                  </div>
                )}
              </div>
              <h3 className="font-display font-bold italic text-white truncate">
                {artwork.title}
              </h3>
              <p className="text-sm text-white/60 truncate">
                {artwork.artist || 'Artiste inconnu'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}