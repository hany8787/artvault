import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'oldest', label: 'Plus ancien' },
  { value: 'title', label: 'Titre A-Z' },
  { value: 'artist', label: 'Artiste A-Z' }
]

const VIEW_MODES = ['grid', 'list']

export default function Collection() {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [selectedMuseum, setSelectedMuseum] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')

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

  // Extract unique filter values from artworks
  const filterOptions = useMemo(() => {
    const periods = [...new Set(artworks.map(a => a.period).filter(Boolean))].sort()
    const styles = [...new Set(artworks.map(a => a.style).filter(Boolean))].sort()
    const museums = [...new Set(artworks.map(a => a.museum).filter(Boolean))].sort()
    return { periods, styles, museums }
  }, [artworks])

  // Filter and sort artworks
  const filteredArtworks = useMemo(() => {
    let result = artworks.filter(artwork => {
      // Search query
      const matchesSearch = !searchQuery ||
        artwork.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.museum?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artwork.description?.toLowerCase().includes(searchQuery.toLowerCase())

      // Period filter
      const matchesPeriod = !selectedPeriod || artwork.period === selectedPeriod

      // Style filter
      const matchesStyle = !selectedStyle || artwork.style === selectedStyle

      // Museum filter
      const matchesMuseum = !selectedMuseum || artwork.museum === selectedMuseum

      return matchesSearch && matchesPeriod && matchesStyle && matchesMuseum
    })

    // Sort
    switch (sortBy) {
      case 'oldest':
        result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        break
      case 'title':
        result = [...result].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
        break
      case 'artist':
        result = [...result].sort((a, b) => (a.artist || '').localeCompare(b.artist || ''))
        break
      // 'recent' is default, already sorted
    }

    return result
  }, [artworks, searchQuery, selectedPeriod, selectedStyle, selectedMuseum, sortBy])

  // Count active filters
  const activeFiltersCount = [selectedPeriod, selectedStyle, selectedMuseum].filter(Boolean).length

  // Clear all filters
  function clearFilters() {
    setSelectedPeriod('')
    setSelectedStyle('')
    setSelectedMuseum('')
    setSearchQuery('')
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-primary">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 pb-24">
      {/* Header */}
      <div className="mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Ma collection</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          {artworks.length} œuvre{artworks.length > 1 ? 's' : ''}
        </h1>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 space-y-3">
        {/* Search */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, artiste, musée..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex items-center gap-3">
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${showFilters || activeFiltersCount > 0
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-white/20 text-white/60 hover:border-white/40'
              }`}
          >
            <span className="material-symbols-outlined text-xl">tune</span>
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 bg-primary text-bg-dark text-xs font-bold rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Sort Dropdown */}
          <div className="relative flex-1 max-w-[180px]">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value} className="bg-bg-dark">
                  {option.label}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-xl">
              expand_more
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex border border-white/20 rounded-lg overflow-hidden">
            {VIEW_MODES.map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`p-2 transition-colors ${viewMode === mode
                    ? 'bg-primary text-bg-dark'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <span className="material-symbols-outlined text-xl">
                  {mode === 'grid' ? 'grid_view' : 'view_list'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="glass rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Period Filter */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Période</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-bg-dark">Toutes les périodes</option>
                  {filterOptions.periods.map(period => (
                    <option key={period} value={period} className="bg-bg-dark">{period}</option>
                  ))}
                </select>
              </div>

              {/* Style Filter */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Style</label>
                <select
                  value={selectedStyle}
                  onChange={(e) => setSelectedStyle(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-bg-dark">Tous les styles</option>
                  {filterOptions.styles.map(style => (
                    <option key={style} value={style} className="bg-bg-dark">{style}</option>
                  ))}
                </select>
              </div>

              {/* Museum Filter */}
              <div>
                <label className="block text-white/60 text-sm mb-2">Musée</label>
                <select
                  value={selectedMuseum}
                  onChange={(e) => setSelectedMuseum(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-bg-dark">Tous les musées</option>
                  {filterOptions.museums.map(museum => (
                    <option key={museum} value={museum} className="bg-bg-dark">{museum}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-primary hover:text-primary-hover text-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
                Effacer tous les filtres
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      {(searchQuery || activeFiltersCount > 0) && (
        <p className="text-white/60 text-sm mb-4">
          {filteredArtworks.length} résultat{filteredArtworks.length > 1 ? 's' : ''}
          {filteredArtworks.length !== artworks.length && ` sur ${artworks.length}`}
        </p>
      )}

      {/* Artworks Display */}
      {filteredArtworks.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-white/20 mb-4">collections</span>
          <p className="text-white/60 mb-4">
            {searchQuery || activeFiltersCount > 0
              ? 'Aucun résultat ne correspond à vos critères'
              : 'Votre collection est vide'}
          </p>
          {(searchQuery || activeFiltersCount > 0) ? (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Effacer les filtres
            </button>
          ) : (
            <Link
              to="/scan"
              className="inline-flex items-center gap-2 bg-primary text-bg-dark font-semibold px-6 py-3 rounded-lg"
            >
              <span className="material-symbols-outlined">photo_camera</span>
              Scanner une œuvre
            </Link>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredArtworks.map((artwork) => (
            <Link
              key={artwork.id}
              to={`/artwork/${artwork.id}`}
              className="group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden mb-2 bg-surface-dark relative">
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
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                  <div>
                    {artwork.museum && (
                      <p className="text-white/70 text-xs truncate">{artwork.museum}</p>
                    )}
                    {artwork.year && (
                      <p className="text-primary text-xs">{artwork.year}</p>
                    )}
                  </div>
                </div>
              </div>
              <h3 className="font-display font-bold italic text-white truncate group-hover:text-primary transition-colors">
                {artwork.title}
              </h3>
              <p className="text-sm text-white/60 truncate">
                {artwork.artist || 'Artiste inconnu'}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-3">
          {filteredArtworks.map((artwork) => (
            <Link
              key={artwork.id}
              to={`/artwork/${artwork.id}`}
              className="glass rounded-xl p-4 flex gap-4 hover:border-primary/50 transition-colors block"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-surface-dark flex-shrink-0">
                {artwork.image_url ? (
                  <img
                    src={artwork.image_url}
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-2xl text-white/20">image</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold italic text-white truncate">
                  {artwork.title}
                </h3>
                <p className="text-white/60 truncate">
                  {artwork.artist || 'Artiste inconnu'}
                  {artwork.year && <span className="text-white/40"> • {artwork.year}</span>}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {artwork.period && (
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60">
                      {artwork.period}
                    </span>
                  )}
                  {artwork.museum && (
                    <span className="text-xs px-2 py-0.5 bg-white/10 rounded text-white/60 truncate max-w-[150px]">
                      {artwork.museum}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex items-center text-white/40">
                <span className="material-symbols-outlined">chevron_right</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Floating Add Button (Mobile) */}
      <Link
        to="/scan"
        className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-primary rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-primary-hover transition-colors z-40"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>
    </div>
  )
}
