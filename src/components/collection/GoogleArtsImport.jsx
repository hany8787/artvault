/**
 * Google Arts & Culture Import Component
 * Allows importing artworks from Google Arts & Culture
 *
 * Note: Full integration requires Google OAuth and API access.
 * This component provides the UI and placeholder functionality.
 */

import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

// Parse year string to integer (handles "1503-1519", "vers 1680", etc.)
function parseYear(yearValue) {
  if (!yearValue) return null
  if (typeof yearValue === 'number') {
    return Number.isInteger(yearValue) ? yearValue : null
  }
  const yearStr = String(yearValue).trim()
  const match = yearStr.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/)
  if (match) return parseInt(match[1], 10)
  const parsed = parseInt(yearStr, 10)
  if (!isNaN(parsed) && parsed > 0 && parsed < 2100) return parsed
  return null
}

// Sample artworks from famous museums (fallback data)
const SAMPLE_ARTWORKS = [
  {
    id: 'mona-lisa',
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    year: '1503-1519',
    museum: 'Musée du Louvre',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg'
  },
  {
    id: 'starry-night',
    title: 'La Nuit étoilée',
    artist: 'Vincent van Gogh',
    year: '1889',
    museum: 'MoMA',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg'
  },
  {
    id: 'girl-pearl',
    title: 'La Jeune Fille à la perle',
    artist: 'Johannes Vermeer',
    year: '1665',
    museum: 'Mauritshuis',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg'
  },
  {
    id: 'birth-venus',
    title: 'La Naissance de Vénus',
    artist: 'Sandro Botticelli',
    year: '1485',
    museum: 'Galerie des Offices',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg/1280px-Sandro_Botticelli_-_La_nascita_di_Venere_-_Google_Art_Project_-_edited.jpg'
  },
  {
    id: 'great-wave',
    title: 'La Grande Vague de Kanagawa',
    artist: 'Katsushika Hokusai',
    year: '1831',
    museum: 'Metropolitan Museum of Art',
    image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Tsunami_by_hokusai_19th_century.jpg/1280px-Tsunami_by_hokusai_19th_century.jpg'
  },
  {
    id: 'persistence-memory',
    title: 'La Persistance de la mémoire',
    artist: 'Salvador Dalí',
    year: '1931',
    museum: 'MoMA',
    image_url: 'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg'
  }
]

export default function GoogleArtsImport({ onClose, onImportComplete }) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArtworks, setSelectedArtworks] = useState([])
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Filter sample artworks by search
  const filteredArtworks = searchQuery
    ? SAMPLE_ARTWORKS.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.museum.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : SAMPLE_ARTWORKS

  // Toggle artwork selection
  function toggleSelection(artwork) {
    setSelectedArtworks(prev => {
      const exists = prev.find(a => a.id === artwork.id)
      if (exists) {
        return prev.filter(a => a.id !== artwork.id)
      }
      return [...prev, artwork]
    })
  }

  // Import selected artworks
  async function importArtworks() {
    if (selectedArtworks.length === 0) return

    setImporting(true)
    setError('')
    setImportProgress(0)
    let count = 0

    try {
      for (let i = 0; i < selectedArtworks.length; i++) {
        const artwork = selectedArtworks[i]

        // Check if already exists in collection (use maybeSingle to avoid error on 0 rows)
        const { data: existing } = await supabase
          .from('artworks')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', artwork.title)
          .eq('artist', artwork.artist)
          .maybeSingle()

        if (existing) {
          console.log(`Skipping ${artwork.title} - already exists`)
          setImportProgress(((i + 1) / selectedArtworks.length) * 100)
          continue
        }

        // Insert new artwork (no source field - doesn't exist in DB schema)
        const { error: insertError } = await supabase
          .from('artworks')
          .insert({
            user_id: user.id,
            title: artwork.title,
            artist: artwork.artist,
            year: parseYear(artwork.year),
            museum: artwork.museum,
            image_url: artwork.image_url,
            description: `Importé depuis Google Arts & Culture`
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
        <div className="p-6 border-b border-primary/10 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl italic text-accent">Importer des œuvres</h2>
            <p className="text-secondary text-sm mt-1">
              Découvrez des œuvres célèbres à ajouter à votre collection
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
          >
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
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une œuvre, un artiste..."
              className="input pl-10 w-full"
            />
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
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredArtworks.map(artwork => {
                const isSelected = selectedArtworks.find(a => a.id === artwork.id)

                return (
                  <button
                    key={artwork.id}
                    onClick={() => toggleSelection(artwork)}
                    className={`relative group rounded-xl overflow-hidden text-left transition-all ${
                      isSelected ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-dark' : ''
                    }`}
                  >
                    <div className="aspect-[3/4] bg-secondary">
                      <img
                        src={artwork.image_url}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Selection indicator */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-black">check</span>
                      </div>
                    )}

                    {/* Info overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent">
                      <p className="text-white text-sm font-medium truncate">{artwork.title}</p>
                      <p className="text-white/60 text-xs truncate">{artwork.artist}</p>
                      <p className="text-accent text-xs">{artwork.museum}</p>
                    </div>
                  </button>
                )
              })}
            </div>
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
