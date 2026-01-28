/**
 * Color Palette Component
 * Display and filter artworks by dominant color
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { COLOR_GROUPS } from '../../utils/colorExtractor'

// Color filter options
const COLOR_FILTERS = [
  { name: 'Tous', value: null, color: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f)' },
  { name: 'Rouge', value: 'red', color: '#ef4444' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Jaune', value: 'yellow', color: '#eab308' },
  { name: 'Vert', value: 'green', color: '#22c55e' },
  { name: 'Bleu', value: 'blue', color: '#3b82f6' },
  { name: 'Violet', value: 'purple', color: '#a855f7' },
  { name: 'Rose', value: 'pink', color: '#ec4899' },
  { name: 'Neutre', value: 'neutral', color: 'linear-gradient(to right, #000, #888, #fff)' }
]

// Convert hex to HSL for color matching
function hexToHsl(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return null

  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h, s
  const l = (max + min) / 2

  if (max === min) {
    h = s = 0
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Get color category from hex
function getColorCategory(hex) {
  if (!hex) return null

  const hsl = hexToHsl(hex)
  if (!hsl) return null

  const { h, s, l } = hsl

  // Check for neutrals first (low saturation)
  if (s < 15) return 'neutral'

  // Check for brown (low saturation warm colors)
  if (s < 40 && l < 50 && (h < 40 || h > 350)) return 'orange'

  // Hue-based categorization
  if (h < 15 || h >= 345) return 'red'
  if (h < 45) return 'orange'
  if (h < 70) return 'yellow'
  if (h < 170) return 'green'
  if (h < 260) return 'blue'
  if (h < 290) return 'purple'
  if (h < 345) return 'pink'

  return 'neutral'
}

export default function ColorPalette({ artworks, onFilterChange }) {
  const [selectedColor, setSelectedColor] = useState(null)

  // Group artworks by color category
  const colorGroups = useMemo(() => {
    const groups = {}

    artworks.forEach(artwork => {
      if (!artwork.dominant_color) return

      const category = getColorCategory(artwork.dominant_color)
      if (!category) return

      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(artwork)
    })

    return groups
  }, [artworks])

  // Filter artworks by selected color
  const filteredArtworks = useMemo(() => {
    if (!selectedColor) return artworks.filter(a => a.dominant_color)
    return colorGroups[selectedColor] || []
  }, [artworks, selectedColor, colorGroups])

  // Handle color selection
  function handleColorSelect(color) {
    setSelectedColor(color)
    if (onFilterChange) {
      onFilterChange(color)
    }
  }

  // Artworks without color data
  const uncoloredCount = artworks.filter(a => !a.dominant_color).length

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl italic text-accent mb-2">Palette de couleurs</h2>
        <p className="text-secondary text-sm">
          {artworks.length - uncoloredCount} œuvres avec couleur dominante
        </p>
      </div>

      {/* Color filter pills */}
      <div className="mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 px-4 min-w-max">
          {COLOR_FILTERS.map(filter => {
            const count = filter.value ? (colorGroups[filter.value]?.length || 0) : (artworks.length - uncoloredCount)
            const isSelected = selectedColor === filter.value

            return (
              <button
                key={filter.name}
                onClick={() => handleColorSelect(filter.value)}
                disabled={filter.value && count === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isSelected
                    ? 'ring-2 ring-accent ring-offset-2 ring-offset-bg-dark'
                    : ''
                } ${
                  filter.value && count === 0
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:scale-105'
                }`}
                style={{
                  background: filter.color
                }}
              >
                <span className={`text-sm font-medium ${
                  filter.value === 'yellow' || filter.value === 'neutral' ? 'text-black' : 'text-white'
                }`}>
                  {filter.name}
                </span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    filter.value === 'yellow' || filter.value === 'neutral'
                      ? 'bg-black/20 text-black'
                      : 'bg-white/20 text-white'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Color mosaic */}
      <div className="px-4">
        {filteredArtworks.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {filteredArtworks
              .sort((a, b) => {
                // Sort by hue for a nice gradient effect
                const hslA = hexToHsl(a.dominant_color)
                const hslB = hexToHsl(b.dominant_color)
                if (!hslA || !hslB) return 0
                return hslA.h - hslB.h
              })
              .map(artwork => (
                <Link
                  key={artwork.id}
                  to={`/artwork/${artwork.id}`}
                  className="group relative aspect-square overflow-hidden"
                  style={{
                    backgroundColor: artwork.dominant_color || '#333'
                  }}
                >
                  {artwork.image_url && (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  )}

                  {/* Color dot indicator */}
                  <div
                    className="absolute bottom-1 right-1 w-3 h-3 rounded-full border border-white/50 opacity-50 group-hover:opacity-100 transition-opacity"
                    style={{ backgroundColor: artwork.dominant_color }}
                  />

                  {/* Hover info */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                    <p className="text-white text-xs font-medium line-clamp-2">{artwork.title}</p>
                    <p className="text-white/60 text-xs mt-1">{artwork.dominant_color}</p>
                  </div>
                </Link>
              ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-white/30 mb-2">palette</span>
            <p className="text-secondary">
              {selectedColor
                ? `Aucune œuvre ${COLOR_FILTERS.find(f => f.value === selectedColor)?.name.toLowerCase()}`
                : 'Aucune œuvre avec couleur dominante'}
            </p>
          </div>
        )}
      </div>

      {/* Info about uncolored artworks */}
      {uncoloredCount > 0 && (
        <div className="mt-6 px-4">
          <p className="text-center text-secondary text-sm">
            {uncoloredCount} œuvre{uncoloredCount > 1 ? 's' : ''} sans couleur extraite
          </p>
        </div>
      )}
    </div>
  )
}
