/**
 * Museum Import Component
 * Search and import artworks from 6+ museum open-access APIs
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { searchMuseums, loadAICCurated, MUSEUM_SOURCES } from '../../services/museumApis'

function parseYear(yearValue) {
  if (!yearValue) return null
  if (typeof yearValue === 'number') {
    return Number.isInteger(yearValue) ? yearValue : null
  }
  const yearStr = String(yearValue).trim()
  if (!yearStr) return null
  const match = yearStr.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
  if (match) return parseInt(match[1], 10)
  const parsed = parseInt(yearStr, 10)
  if (!isNaN(parsed) && parsed > 0 && parsed < 2100) return parsed
  return null
}

// Source display colors
const SOURCE_COLORS = {
  aic: 'bg-red-500/80',
  met: 'bg-blue-500/80',
  rijksmuseum: 'bg-orange-500/80',
  cleveland: 'bg-emerald-500/80',
  harvard: 'bg-purple-500/80',
  va: 'bg-pink-500/80'
}

const SOURCE_LABELS = {
  aic: 'AIC',
  met: 'Met',
  rijksmuseum: 'Rijks',
  cleveland: 'CMA',
  harvard: 'Harvard',
  va: 'V&A'
}

export default function GoogleArtsImport({ onClose, onImportComplete }) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [curatedArtworks, setCuratedArtworks] = useState([])
  const [selectedArtworks, setSelectedArtworks] = useState([])
  const [selectedSource, setSelectedSource] = useState('all')
  const [searching, setSearching] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loadingCurated, setLoadingCurated] = useState(true)
  const searchTimeoutRef = useRef(null)

  // Load curated artworks on mount
  useEffect(() => {
    loadCurated()
  }, [])

  async function loadCurated() {
    try {
      const artworks = await loadAICCurated()
      setCuratedArtworks(artworks)
    } catch (err) {
      console.error('Failed to load curated artworks:', err)
      setCuratedArtworks([])
    } finally {
      setLoadingCurated(false)
    }
  }

  // Debounced search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    if (!query.trim()) {
      setSearchResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    setError('')
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMuseums(query, selectedSource, 30)
        setSearchResults(results)
      } catch (err) {
        console.error('Search error:', err)
        setError('Erreur de recherche. Vérifiez votre connexion.')
      } finally {
        setSearching(false)
      }
    }, 500)
  }, [selectedSource])

  // Re-search when source changes
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    }
  }, [selectedSource])

  const displayedArtworks = searchQuery.trim() ? searchResults : curatedArtworks

  function toggleSelection(artwork) {
    setSelectedArtworks(prev => {
      const exists = prev.find(a => a.id === artwork.id)
      if (exists) return prev.filter(a => a.id !== artwork.id)
      return [...prev, artwork]
    })
  }

  function selectAll() {
    setSelectedArtworks(prev => {
      const allDisplayed = displayedArtworks.filter(a => !prev.find(p => p.id === a.id))
      return [...prev, ...allDisplayed]
    })
  }

  async function importArtworks() {
    if (selectedArtworks.length === 0) return

    setImporting(true)
    setError('')
    setImportProgress(0)
    let count = 0

    try {
      for (let i = 0; i < selectedArtworks.length; i++) {
        const artwork = selectedArtworks[i]

        const { data: existing } = await supabase
          .from('artworks')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', artwork.title)
          .eq('artist', artwork.artist)
          .maybeSingle()

        if (existing) {
          setImportProgress(((i + 1) / selectedArtworks.length) * 100)
          continue
        }

        const sourceName = MUSEUM_SOURCES.find(s => s.id === artwork.source)?.name || artwork.museum

        const { error: insertError } = await supabase
          .from('artworks')
          .insert({
            user_id: user.id,
            title: artwork.title,
            artist: artwork.artist,
            year: parseYear(artwork.year),
            museum: artwork.museum || sourceName,
            museum_city: artwork.museum_city || null,
            museum_country: artwork.museum_country || null,
            medium: artwork.medium || null,
            dimensions: artwork.dimensions || null,
            image_url: artwork.image_url,
            description: `Importé depuis ${sourceName}`
          })

        if (insertError) {
          console.error('Import error:', insertError)
        } else {
          count++
        }

        setImportProgress(((i + 1) / selectedArtworks.length) * 100)
      }

      setImportedCount(count)

      if (count === 0) {
        setError('Aucune œuvre importée. Elles existent peut-être déjà dans votre collection.')
        setImporting(false)
        return
      }

      setSuccess(true)
      setImporting(false)

      // Fermer la modal après un délai
      setTimeout(() => {
        if (onImportComplete) onImportComplete()
      }, 2000)
    } catch (err) {
      console.error('Import failed:', err)
      setError(`Erreur: ${err.message || 'Import échoué'}. Veuillez réessayer.`)
      setImporting(false)
    }
  }

  // Count results by source
  const sourceCounts = {}
  for (const a of searchResults) {
    sourceCounts[a.source] = (sourceCounts[a.source] || 0) + 1
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-light dark:bg-bg-dark rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-primary/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl italic text-accent">Explorer des œuvres</h2>
            <p className="text-secondary text-sm mt-1">
              6 musées · Des milliers d'œuvres en accès libre
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-primary/10 space-y-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary pointer-events-none z-10">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Monet, impressionnisme, portrait, nature morte..."
              className="input w-full"
              style={{ paddingLeft: '3rem' }}
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Source selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {MUSEUM_SOURCES.map(source => {
              const isActive = selectedSource === source.id
              const count = source.id === 'all'
                ? searchResults.length
                : (sourceCounts[source.id] || 0)
              const hasResults = searchQuery.trim() && count > 0

              return (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-accent text-black'
                      : 'bg-white/5 text-secondary hover:bg-white/10'
                  }`}
                >
                  {source.id === 'all' ? 'Tous' : source.name}
                  {hasResults && (
                    <span className={`ml-1.5 ${isActive ? 'text-black/60' : 'text-accent'}`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Artworks grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {success ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-green-500">check_circle</span>
              </div>
              <p className="text-white font-medium">Import terminé !</p>
              <p className="text-secondary text-sm mt-1">
                {importedCount} œuvre{importedCount > 1 ? 's' : ''} ajoutée{importedCount > 1 ? 's' : ''}
              </p>
              <p className="text-accent/60 text-xs mt-3">
                Astuce : ouvrez une œuvre importée et cliquez "Générer avec l'IA" pour obtenir une description complète
              </p>
            </div>
          ) : loadingCurated && !searchQuery.trim() ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : displayedArtworks.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-white/20 mb-2">image_search</span>
              <p className="text-secondary text-sm">
                {searching
                  ? 'Recherche en cours...'
                  : searchQuery.trim()
                    ? 'Aucun résultat. Essayez un autre terme ou changez de musée.'
                    : 'Recherchez une œuvre pour commencer'}
              </p>
            </div>
          ) : (
            <>
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-secondary text-xs">
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                    {selectedSource !== 'all' && ` depuis ${MUSEUM_SOURCES.find(s => s.id === selectedSource)?.name}`}
                  </p>
                  <button onClick={selectAll} className="text-accent text-xs hover:underline">
                    Tout sélectionner
                  </button>
                </div>
              )}
              {!searchQuery.trim() && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-secondary text-xs">
                    <span className="material-symbols-outlined text-xs align-middle mr-1">museum</span>
                    Art Institute of Chicago — Suggestions
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {displayedArtworks.map(artwork => {
                  const isSelected = selectedArtworks.find(a => a.id === artwork.id)

                  return (
                    <button
                      key={artwork.id}
                      onClick={() => toggleSelection(artwork)}
                      className={`relative group rounded-xl overflow-hidden text-left transition-all ${
                        isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-dark' : ''
                      }`}
                    >
                      <div className="aspect-[3/4] bg-white/5">
                        <img
                          src={artwork.image_url}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null
                            e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-3xl text-white/20">hide_image</span></div>'
                          }}
                        />
                      </div>

                      {/* Source badge */}
                      {artwork.source && (
                        <div className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${SOURCE_COLORS[artwork.source] || 'bg-white/30'}`}>
                          {SOURCE_LABELS[artwork.source] || artwork.source}
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm text-black">check</span>
                        </div>
                      )}

                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <p className="text-white text-sm font-medium truncate">{artwork.title}</p>
                        <p className="text-white/60 text-xs truncate">{artwork.artist}</p>
                        {artwork.year && <p className="text-accent text-xs">{artwork.year}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-4 border-t border-primary/10">
            {importing ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Import en cours...</span>
                  <span className="text-accent">{Math.round(importProgress)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-secondary text-sm">
                  {selectedArtworks.length} sélectionnée{selectedArtworks.length > 1 ? 's' : ''}
                </p>
                <div className="flex gap-3">
                  <button onClick={onClose} className="btn btn-ghost">
                    Annuler
                  </button>
                  <button
                    onClick={importArtworks}
                    disabled={selectedArtworks.length === 0}
                    className="btn btn-primary"
                  >
                    <span className="material-symbols-outlined">download</span>
                    Importer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
