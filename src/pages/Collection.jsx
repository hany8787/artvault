import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArtworkCard } from '../components/ui/Card'
import { FavoriteButton } from '../components/ui/FavoriteButton'
import { SkeletonCard } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import HierarchicalFilters, { ActiveFilterChips } from '../components/filters/HierarchicalFilters'
import { ALL_FILTER_CATEGORIES, matchesFilter } from '../data/filterCategories'

// Options de tri
const SORT_OPTIONS = [
  { value: 'recent', label: 'Date d\'ajout (récent)' },
  { value: 'oldest', label: 'Date d\'ajout (ancien)' },
  { value: 'title', label: 'Titre A-Z' },
  { value: 'artist', label: 'Artiste A-Z' },
  { value: 'year', label: 'Année' },
]

// État initial des filtres
function getInitialFilters() {
  const filters = {}
  ALL_FILTER_CATEGORIES.forEach(cat => {
    filters[cat.id] = []
  })
  filters.museum = ''
  filters.artist = ''
  filters.favoritesOnly = false
  return filters
}

export default function Collection() {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  // View states
  const [viewMode, setViewMode] = useState('grid') // grid, list
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState(getInitialFilters())
  const [sortBy, setSortBy] = useState('recent')

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

  // Get unique museums and artists for filter dropdowns
  const museums = useMemo(() => {
    const unique = [...new Set(artworks.filter(a => a.museum).map(a => a.museum))]
    return unique.sort()
  }, [artworks])

  const artists = useMemo(() => {
    const unique = [...new Set(artworks.filter(a => a.artist).map(a => a.artist))]
    return unique.sort()
  }, [artworks])

  // Filter and sort artworks
  const filteredArtworks = useMemo(() => {
    let result = artworks.filter(artwork => {
      // Search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          artwork.title?.toLowerCase().includes(query) ||
          artwork.artist?.toLowerCase().includes(query) ||
          artwork.museum?.toLowerCase().includes(query) ||
          artwork.period?.toLowerCase().includes(query) ||
          artwork.style?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Favorites filter
      if (selectedFilters.favoritesOnly && !artwork.is_favorite) {
        return false
      }

      // Museum filter
      if (selectedFilters.museum && artwork.museum !== selectedFilters.museum) {
        return false
      }

      // Artist filter
      if (selectedFilters.artist && artwork.artist !== selectedFilters.artist) {
        return false
      }

      // Hierarchical category filters
      for (const category of ALL_FILTER_CATEGORIES) {
        const selectedValues = selectedFilters[category.id] || []
        if (selectedValues.length > 0) {
          if (!matchesFilter(artwork, category.id, selectedValues)) {
            return false
          }
        }
      }

      return true
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
      case 'year':
        result = [...result].sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0))
        break
      default: // recent
        result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return result
  }, [artworks, searchQuery, selectedFilters, sortBy])

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (key === 'favoritesOnly' && value) count++
      else if (key === 'museum' && value) count++
      else if (key === 'artist' && value) count++
      else if (Array.isArray(value)) count += value.length
    })
    return count
  }, [selectedFilters])

  // Reset filters
  function resetFilters() {
    setSelectedFilters(getInitialFilters())
  }

  // Remove a single filter
  function removeFilter(categoryId, value) {
    if (categoryId === 'favoritesOnly') {
      setSelectedFilters(prev => ({ ...prev, favoritesOnly: false }))
    } else if (categoryId === 'museum') {
      setSelectedFilters(prev => ({ ...prev, museum: '' }))
    } else if (categoryId === 'artist') {
      setSelectedFilters(prev => ({ ...prev, artist: '' }))
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        [categoryId]: (prev[categoryId] || []).filter(v => v !== value)
      }))
    }
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl italic mb-2">
              Ma Collection
            </h1>
            <p className="text-secondary">
              {artworks.length} œuvre{artworks.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-2">
            {/* Favorites quick filter */}
            <button
              onClick={() => setSelectedFilters(prev => ({
                ...prev,
                favoritesOnly: !prev.favoritesOnly
              }))}
              className={`btn btn-ghost btn-icon ${selectedFilters.favoritesOnly ? 'text-red-500' : ''}`}
              title="Favoris uniquement"
            >
              <span className={`material-symbols-outlined ${selectedFilters.favoritesOnly ? 'filled' : ''}`}>
                favorite
              </span>
            </button>

            {/* Search toggle */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`btn btn-ghost btn-icon ${showSearch ? 'text-accent' : ''}`}
            >
              <span className="material-symbols-outlined">search</span>
            </button>

            {/* Filter button */}
            <button
              onClick={() => setShowFilters(true)}
              className="btn btn-ghost btn-icon relative"
            >
              <span className="material-symbols-outlined">tune</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-xs font-medium text-bg-dark rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="btn btn-ghost btn-icon"
            >
              <span className="material-symbols-outlined">
                {viewMode === 'grid' ? 'view_list' : 'grid_view'}
              </span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        {showSearch && (
          <div className="relative animate-slide-up">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, artiste, musée, période..."
              className="input pl-12"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                <span className="material-symbols-outlined text-secondary">close</span>
              </button>
            )}
          </div>
        )}

        {/* Sort dropdown (desktop) */}
        <div className="hidden md:flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/60">Trier par :</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border border-white/20 rounded-lg px-3 py-1.5 text-sm
                       focus:border-accent focus:outline-none"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <p className="text-sm text-white/60">
            {filteredArtworks.length} résultat{filteredArtworks.length > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Active Filter Chips */}
      <ActiveFilterChips
        selectedFilters={selectedFilters}
        onRemove={removeFilter}
        onClearAll={resetFilters}
      />

      {/* Content */}
      <div className="px-4 max-w-7xl mx-auto">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          // Empty state
          artworks.length === 0 ? (
            <EmptyState
              icon="collections"
              title="Votre collection est vide"
              description="Scannez votre première œuvre pour commencer à constituer votre galerie personnelle"
              action="Scanner une œuvre"
              actionLink="/scan"
            />
          ) : (
            <EmptyState
              icon="search_off"
              title="Aucun résultat"
              description="Aucune œuvre ne correspond à vos critères de recherche"
              action="Réinitialiser les filtres"
              onAction={resetFilters}
            />
          )
        ) : (
          // Artworks grid
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
            : 'space-y-4'
          }>
            {filteredArtworks.map((artwork) => (
              viewMode === 'grid' ? (
                <ArtworkCard 
                  key={artwork.id} 
                  artwork={artwork}
                  onFavoriteToggle={(newValue) => {
                    // Update local state immediately
                    setArtworks(prev => prev.map(a => 
                      a.id === artwork.id ? { ...a, is_favorite: newValue } : a
                    ))
                  }}
                />
              ) : (
                // List view
                <div
                  key={artwork.id}
                  className="card flex gap-4 p-4"
                >
                  <Link
                    to={`/artwork/${artwork.id}`}
                    className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary"
                  >
                    {artwork.image_url ? (
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-secondary">image</span>
                      </div>
                    )}
                  </Link>
                  <Link to={`/artwork/${artwork.id}`} className="flex-1 min-w-0">
                    <h3 className="font-display italic truncate">{artwork.title}</h3>
                    <p className="text-secondary text-sm truncate">{artwork.artist}</p>
                    <p className="text-secondary text-xs mt-1">{artwork.year}</p>
                  </Link>
                  <FavoriteButton 
                    artworkId={artwork.id}
                    initialFavorite={artwork.is_favorite}
                    size="sm"
                    onToggle={(newValue) => {
                      setArtworks(prev => prev.map(a => 
                        a.id === artwork.id ? { ...a, is_favorite: newValue } : a
                      ))
                    }}
                  />
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Link
        to="/scan"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-accent-hover transition-all z-30"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </Link>

      {/* Hierarchical Filters Modal */}
      <HierarchicalFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        selectedFilters={selectedFilters}
        onFiltersChange={setSelectedFilters}
        resultCount={filteredArtworks.length}
        museums={museums}
        artists={artists}
      />
    </div>
  )
}
