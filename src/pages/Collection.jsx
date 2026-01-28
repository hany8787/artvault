import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArtworkCard } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import { Drawer } from '../components/ui/Modal'
import { ChipGroup } from '../components/ui/Chip'
import Timeline from '../components/collection/Timeline'
import ColorPalette from '../components/collection/ColorPalette'
import GoogleArtsImport from '../components/collection/GoogleArtsImport'

// Filter options
const PERIODS = [
  { value: 'renaissance', label: 'Renaissance' },
  { value: 'baroque', label: 'Baroque' },
  { value: 'romanticism', label: 'Romantisme' },
  { value: 'impressionism', label: 'Impressionnisme' },
  { value: 'modern', label: 'Art Moderne' },
  { value: 'contemporary', label: 'Contemporain' },
]

const TYPES = [
  { value: 'painting', label: 'Peinture' },
  { value: 'sculpture', label: 'Sculpture' },
  { value: 'photography', label: 'Photographie' },
  { value: 'drawing', label: 'Dessin' },
  { value: 'print', label: 'Gravure' },
]

const SORT_OPTIONS = [
  { value: 'recent', label: 'Date d\'ajout (récent)' },
  { value: 'oldest', label: 'Date d\'ajout (ancien)' },
  { value: 'title', label: 'Titre A-Z' },
  { value: 'artist', label: 'Artiste A-Z' },
  { value: 'year', label: 'Année' },
  { value: 'color', label: 'Couleur dominante' },
]

// View mode options
const VIEW_MODES = [
  { value: 'grid', icon: 'grid_view', label: 'Grille' },
  { value: 'list', icon: 'view_list', label: 'Liste' },
  { value: 'timeline', icon: 'timeline', label: 'Chronologie' },
  { value: 'colors', icon: 'palette', label: 'Couleurs' },
]

export default function Collection() {
  const { user } = useAuth()
  const [artworks, setArtworks] = useState([])
  const [loading, setLoading] = useState(true)

  // View states
  const [viewMode, setViewMode] = useState('grid') // grid, list, timeline, colors
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPeriods, setSelectedPeriods] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [selectedMuseum, setSelectedMuseum] = useState('')
  const [selectedArtist, setSelectedArtist] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [favoritesOnly, setFavoritesOnly] = useState(false)

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
          artwork.museum?.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Period filter
      if (selectedPeriods.length > 0) {
        const period = artwork.period?.toLowerCase() || ''
        const matchesPeriod = selectedPeriods.some(p => period.includes(p))
        if (!matchesPeriod) return false
      }

      // Type filter (by medium)
      if (selectedTypes.length > 0) {
        const medium = artwork.medium?.toLowerCase() || ''
        const matchesType = selectedTypes.some(t => {
          if (t === 'painting') return medium.includes('oil') || medium.includes('huile') || medium.includes('canvas') || medium.includes('toile')
          if (t === 'sculpture') return medium.includes('sculpt') || medium.includes('bronze') || medium.includes('marble')
          if (t === 'photography') return medium.includes('photo') || medium.includes('print')
          if (t === 'drawing') return medium.includes('draw') || medium.includes('dessin') || medium.includes('pencil')
          if (t === 'print') return medium.includes('gravure') || medium.includes('litho') || medium.includes('etching')
          return false
        })
        if (!matchesType) return false
      }

      // Museum filter
      if (selectedMuseum && artwork.museum !== selectedMuseum) {
        return false
      }

      // Artist filter
      if (selectedArtist && artwork.artist !== selectedArtist) {
        return false
      }

      // Favorites filter
      if (favoritesOnly && !artwork.is_favorite) {
        return false
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
      case 'color':
        result = [...result].sort((a, b) => {
          if (!a.dominant_color && !b.dominant_color) return 0
          if (!a.dominant_color) return 1
          if (!b.dominant_color) return -1
          return (a.dominant_color || '').localeCompare(b.dominant_color || '')
        })
        break
      default: // recent
        result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }

    return result
  }, [artworks, searchQuery, selectedPeriods, selectedTypes, selectedMuseum, selectedArtist, sortBy, favoritesOnly])

  // Count active filters
  const activeFilterCount = selectedPeriods.length + selectedTypes.length +
    (selectedMuseum ? 1 : 0) + (selectedArtist ? 1 : 0) + (favoritesOnly ? 1 : 0)

  // Reset filters
  function resetFilters() {
    setSelectedPeriods([])
    setSelectedTypes([])
    setSelectedMuseum('')
    setSelectedArtist('')
    setFavoritesOnly(false)
    setSortBy('recent')
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
            <div className="relative">
              <button
                onClick={() => setShowViewMenu(!showViewMenu)}
                className="btn btn-ghost btn-icon"
              >
                <span className="material-symbols-outlined">
                  {VIEW_MODES.find(v => v.value === viewMode)?.icon || 'grid_view'}
                </span>
              </button>

              {/* View menu dropdown */}
              {showViewMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowViewMenu(false)}
                  />
                  <div className="absolute right-0 top-12 z-50 bg-bg-light dark:bg-bg-dark border border-default rounded-xl shadow-xl py-2 min-w-[160px]">
                    {VIEW_MODES.map(mode => (
                      <button
                        key={mode.value}
                        onClick={() => {
                          setViewMode(mode.value)
                          setShowViewMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-secondary transition-colors ${
                          viewMode === mode.value ? 'text-accent' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-lg">{mode.icon}</span>
                        <span className="text-sm">{mode.label}</span>
                        {viewMode === mode.value && (
                          <span className="material-symbols-outlined text-sm ml-auto">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
              placeholder="Rechercher par titre, artiste ou musée..."
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
      </header>

      {/* Content */}
      <div className="px-4 max-w-7xl mx-auto">
        {loading ? (
          // Loading skeleton
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : artworks.length === 0 ? (
          // Empty state - no artworks at all
          <EmptyState
            icon="collections"
            title="Votre collection est vide"
            description="Scannez votre première œuvre pour commencer à constituer votre galerie personnelle"
            action="Scanner une œuvre"
            actionLink="/scan"
          />
        ) : viewMode === 'timeline' ? (
          // Timeline view
          <Timeline artworks={artworks} />
        ) : viewMode === 'colors' ? (
          // Color palette view
          <ColorPalette artworks={artworks} />
        ) : filteredArtworks.length === 0 ? (
          // Empty filtered results
          <EmptyState
            icon="search_off"
            title="Aucun résultat"
            description="Aucune œuvre ne correspond à vos critères de recherche"
            action="Réinitialiser les filtres"
            onAction={resetFilters}
          />
        ) : viewMode === 'grid' ? (
          // Grid view
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filteredArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))}
          </div>
        ) : (
          // List view
          <div className="space-y-4">
            {filteredArtworks.map((artwork) => (
              <Link
                key={artwork.id}
                to={`/artwork/${artwork.id}`}
                className="card flex gap-4 p-4"
              >
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
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
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display italic truncate">{artwork.title}</h3>
                  <p className="text-secondary text-sm truncate">{artwork.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-secondary text-xs">{artwork.year}</p>
                    {artwork.dominant_color && (
                      <div
                        className="w-3 h-3 rounded-full border border-white/20"
                        style={{ backgroundColor: artwork.dominant_color }}
                        title={`Couleur: ${artwork.dominant_color}`}
                      />
                    )}
                  </div>
                </div>
                {artwork.is_favorite && (
                  <span className="material-symbols-outlined filled text-accent self-center">
                    favorite
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 flex flex-col gap-3 z-30">
        {/* Import from Google Arts */}
        <button
          onClick={() => setShowImport(true)}
          className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20"
          title="Importer des œuvres"
        >
          <span className="material-symbols-outlined">download</span>
        </button>

        {/* Add new (scan) */}
        <Link
          to="/scan"
          className="w-14 h-14 bg-accent rounded-full shadow-lg flex items-center justify-center text-bg-dark hover:bg-accent-hover transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </Link>
      </div>

      {/* Google Arts Import Modal */}
      {showImport && (
        <GoogleArtsImport
          onClose={() => setShowImport(false)}
          onImportComplete={() => {
            setShowImport(false)
            fetchArtworks() // Refresh the list
          }}
        />
      )}

      {/* Filters Drawer */}
      <Drawer
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filtres"
      >
        <div className="space-y-6">
          {/* Results count */}
          <p className="text-secondary">
            {filteredArtworks.length} résultat{filteredArtworks.length > 1 ? 's' : ''}
          </p>

          {/* Favorites toggle */}
          <div className="flex items-center justify-between">
            <span className="font-medium">Favoris uniquement</span>
            <button
              onClick={() => setFavoritesOnly(!favoritesOnly)}
              className={`w-12 h-7 rounded-full transition-colors ${
                favoritesOnly ? 'bg-accent' : 'bg-secondary'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                favoritesOnly ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="divider" />

          {/* Period filter */}
          <div>
            <h3 className="label mb-3">Période</h3>
            <ChipGroup
              options={PERIODS}
              selected={selectedPeriods}
              onChange={setSelectedPeriods}
              multiple
            />
          </div>

          <div className="divider" />

          {/* Type filter */}
          <div>
            <h3 className="label mb-3">Type</h3>
            <ChipGroup
              options={TYPES}
              selected={selectedTypes}
              onChange={setSelectedTypes}
              multiple
            />
          </div>

          <div className="divider" />

          {/* Museum filter */}
          {museums.length > 0 && (
            <div>
              <h3 className="label mb-3">Musée</h3>
              <select
                value={selectedMuseum}
                onChange={(e) => setSelectedMuseum(e.target.value)}
                className="input"
              >
                <option value="">Tous les musées</option>
                {museums.map(museum => (
                  <option key={museum} value={museum}>{museum}</option>
                ))}
              </select>
            </div>
          )}

          {/* Artist filter */}
          {artists.length > 0 && (
            <div>
              <h3 className="label mb-3">Artiste</h3>
              <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                className="input"
              >
                <option value="">Tous les artistes</option>
                {artists.map(artist => (
                  <option key={artist} value={artist}>{artist}</option>
                ))}
              </select>
            </div>
          )}

          <div className="divider" />

          {/* Sort */}
          <div>
            <h3 className="label mb-3">Trier par</h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={resetFilters}
              className="btn btn-outline flex-1"
            >
              Réinitialiser
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="btn btn-primary flex-1"
            >
              Appliquer
            </button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
