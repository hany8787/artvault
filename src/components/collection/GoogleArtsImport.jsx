/**
 * Art Import Component
 * Search and import real artworks from museum APIs:
 * - Art Institute of Chicago (primary) - free, no key needed
 * - Curated suggestions as fallback
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Art Institute of Chicago API
const AIC_BASE = 'https://api.artic.edu/api/v1'
const AIC_IMAGE = 'https://www.artic.edu/iiif/2'

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

function aicImageUrl(imageId, size = 843) {
  if (!imageId) return null
  return `${AIC_IMAGE}/${imageId}/full/${size},/0/default.jpg`
}

function mapAicArtwork(item) {
  return {
    id: `aic-${item.id}`,
    title: item.title || 'Sans titre',
    artist: item.artist_title || 'Artiste inconnu',
    year: item.date_display || (item.date_start ? String(item.date_start) : ''),
    museum: 'Art Institute of Chicago',
    medium: item.medium_display || '',
    dimensions: item.dimensions || '',
    image_url: aicImageUrl(item.image_id),
    image_id: item.image_id
  }
}

// Curated artwork IDs from AIC for initial display
const CURATED_IDS = [
  27992,  // A Sunday on La Grande Jatte — Seurat
  28560,  // The Bedroom — Van Gogh
  111628, // Nighthawks — Hopper
  6565,   // American Gothic — Wood
  87479,  // The Old Guitarist — Picasso
  80607,  // Sky Above Clouds IV — O'Keeffe
  16568,  // The Assumption of the Virgin — El Greco
  16487,  // Stacks of Wheat — Monet
  14598,  // Bathers by a River — Matisse
  20684,  // The Herring Net — Homer
  76244,  // Judith Slaying Holofernes — Gentileschi
  24306,  // Two Sisters (On the Terrace) — Renoir
]

export default function GoogleArtsImport({ onClose, onImportComplete }) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [curatedArtworks, setCuratedArtworks] = useState([])
  const [selectedArtworks, setSelectedArtworks] = useState([])
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
    loadCuratedArtworks()
  }, [])

  async function loadCuratedArtworks() {
    try {
      const res = await fetch(
        `${AIC_BASE}/artworks?ids=${CURATED_IDS.join(',')}&fields=id,title,artist_title,date_start,date_display,medium_display,dimensions,image_id`
      )
      if (!res.ok) throw new Error('API error')
      const json = await res.json()
      const artworks = (json.data || [])
        .map(mapAicArtwork)
        .filter(a => a.image_id)
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
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${AIC_BASE}/artworks/search?q=${encodeURIComponent(query)}&fields=id,title,artist_title,date_start,date_display,medium_display,dimensions,image_id&limit=24`
        )
        if (!res.ok) throw new Error('Search failed')
        const json = await res.json()
        const artworks = (json.data || [])
          .map(mapAicArtwork)
          .filter(a => a.image_id)
        setSearchResults(artworks)
      } catch (err) {
        console.error('Search error:', err)
        setError('Erreur de recherche. Vérifiez votre connexion.')
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  // Which artworks to display
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

        const { error: insertError } = await supabase
          .from('artworks')
          .insert({
            user_id: user.id,
            title: artwork.title,
            artist: artwork.artist,
            year: parseYear(artwork.year),
            museum: artwork.museum,
            medium: artwork.medium || null,
            dimensions: artwork.dimensions || null,
            image_url: artwork.image_url,
            description: `Importé depuis Art Institute of Chicago`
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
        return
      }

      setSuccess(true)
      setTimeout(() => {
        if (onImportComplete) onImportComplete()
      }, 1500)
    } catch (err) {
      console.error('Import failed:', err)
      setError('Erreur lors de l\'import. Veuillez réessayer.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-bg-light dark:bg-bg-dark rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-primary/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl italic text-accent">Explorer des œuvres</h2>
            <p className="text-secondary text-sm mt-1">
              Recherchez parmi des milliers d'œuvres de musées
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-primary/10">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Monet, impressionnisme, portrait, nature morte..."
              className="input pl-10 w-full"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
              </div>
            )}
          </div>
          {!searchQuery.trim() && (
            <p className="text-xs text-secondary mt-2">
              <span className="material-symbols-outlined text-xs align-middle mr-1">museum</span>
              Art Institute of Chicago — {curatedArtworks.length} œuvres suggérées
            </p>
          )}
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
                {searchQuery.trim()
                  ? 'Aucun résultat. Essayez un autre terme.'
                  : 'Recherchez une œuvre pour commencer'}
              </p>
            </div>
          ) : (
            <>
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <p className="text-secondary text-xs">{searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}</p>
                  <button onClick={selectAll} className="text-accent text-xs hover:underline">
                    Tout sélectionner
                  </button>
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
