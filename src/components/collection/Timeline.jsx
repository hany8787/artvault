/**
 * Timeline Component
 * Chronological view of artworks organized by century/decade
 */

import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

// Century/period data with colors
const CENTURIES = [
  { id: '15', label: 'XVe siècle', period: 'Renaissance', color: '#8B4513' },
  { id: '16', label: 'XVIe siècle', period: 'Renaissance tardive', color: '#A0522D' },
  { id: '17', label: 'XVIIe siècle', period: 'Baroque', color: '#CD853F' },
  { id: '18', label: 'XVIIIe siècle', period: 'Rococo / Néoclassicisme', color: '#DEB887' },
  { id: '19', label: 'XIXe siècle', period: 'Romantisme / Impressionnisme', color: '#F4A460' },
  { id: '20', label: 'XXe siècle', period: 'Art moderne', color: '#D2691E' },
  { id: '21', label: 'XXIe siècle', period: 'Art contemporain', color: '#FF8C00' }
]

export default function Timeline({ artworks }) {
  const [selectedCentury, setSelectedCentury] = useState(null)
  const [expandedDecades, setExpandedDecades] = useState({})

  // Group artworks by century and decade
  const groupedArtworks = useMemo(() => {
    const groups = {}

    artworks.forEach(artwork => {
      const year = parseInt(artwork.year)
      if (!year || isNaN(year)) return

      const century = Math.floor(year / 100) + 1
      const decade = Math.floor(year / 10) * 10
      const centuryKey = century.toString()
      const decadeKey = decade.toString()

      if (!groups[centuryKey]) {
        groups[centuryKey] = { decades: {}, count: 0 }
      }
      if (!groups[centuryKey].decades[decadeKey]) {
        groups[centuryKey].decades[decadeKey] = []
      }

      groups[centuryKey].decades[decadeKey].push(artwork)
      groups[centuryKey].count++
    })

    return groups
  }, [artworks])

  // Get centuries that have artworks
  const activeCenturies = CENTURIES.filter(c => groupedArtworks[c.id])

  // Toggle decade expansion
  function toggleDecade(decade) {
    setExpandedDecades(prev => ({
      ...prev,
      [decade]: !prev[decade]
    }))
  }

  // Get artworks without year
  const undatedArtworks = artworks.filter(a => !a.year || isNaN(parseInt(a.year)))

  return (
    <div className="py-4">
      {/* Timeline header */}
      <div className="mb-8 text-center">
        <h2 className="font-display text-2xl italic text-accent mb-2">Frise chronologique</h2>
        <p className="text-secondary text-sm">
          {artworks.length - undatedArtworks.length} œuvres datées sur {artworks.length}
        </p>
      </div>

      {/* Century selector (horizontal scroll) */}
      <div className="mb-8 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 px-4 min-w-max">
          {CENTURIES.map(century => {
            const hasArtworks = groupedArtworks[century.id]
            const count = hasArtworks?.count || 0
            const isSelected = selectedCentury === century.id

            return (
              <button
                key={century.id}
                onClick={() => setSelectedCentury(isSelected ? null : century.id)}
                disabled={!hasArtworks}
                className={`flex flex-col items-center px-4 py-3 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-accent text-black'
                    : hasArtworks
                    ? 'bg-white/5 hover:bg-white/10 text-white'
                    : 'bg-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <span className="text-lg font-medium">{century.label}</span>
                <span className="text-xs opacity-70">{century.period}</span>
                {count > 0 && (
                  <span className={`mt-1 px-2 py-0.5 rounded-full text-xs ${
                    isSelected ? 'bg-black/20' : 'bg-accent/20 text-accent'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative px-4">
        {/* Central line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-accent/20" />

        {/* Filtered centuries */}
        {(selectedCentury ? [CENTURIES.find(c => c.id === selectedCentury)] : activeCenturies).map(century => {
          if (!century) return null
          const centuryData = groupedArtworks[century.id]
          if (!centuryData) return null

          const decades = Object.keys(centuryData.decades).sort()

          return (
            <div key={century.id} className="mb-8">
              {/* Century header */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-4 h-4 rounded-full border-2 border-accent z-10"
                  style={{ backgroundColor: century.color }}
                />
                <div>
                  <h3 className="font-display text-xl italic text-white">{century.label}</h3>
                  <p className="text-accent text-sm">{century.period}</p>
                </div>
              </div>

              {/* Decades */}
              <div className="ml-10 space-y-4">
                {decades.map(decade => {
                  const decadeArtworks = centuryData.decades[decade]
                  const isExpanded = expandedDecades[decade]
                  const displayArtworks = isExpanded ? decadeArtworks : decadeArtworks.slice(0, 4)

                  return (
                    <div key={decade} className="relative">
                      {/* Decade connector */}
                      <div className="absolute -left-6 top-3 w-4 h-0.5 bg-accent/30" />

                      {/* Decade header */}
                      <button
                        onClick={() => toggleDecade(decade)}
                        className="flex items-center gap-2 mb-3 text-secondary hover:text-white transition-colors"
                      >
                        <span className="text-sm font-medium">{decade}s</span>
                        <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                          {decadeArtworks.length} œuvre{decadeArtworks.length > 1 ? 's' : ''}
                        </span>
                        <span className="material-symbols-outlined text-sm">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </button>

                      {/* Artworks grid */}
                      <div className="grid grid-cols-4 gap-2">
                        {displayArtworks.map(artwork => (
                          <Link
                            key={artwork.id}
                            to={`/artwork/${artwork.id}`}
                            className="group relative aspect-square rounded-lg overflow-hidden bg-white/5"
                          >
                            {artwork.image_url ? (
                              <img
                                src={artwork.image_url}
                                alt={artwork.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-white/30">image</span>
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                              <p className="text-white text-xs font-medium truncate">{artwork.title}</p>
                              <p className="text-white/60 text-xs truncate">{artwork.year}</p>
                            </div>
                          </Link>
                        ))}
                      </div>

                      {/* Show more button */}
                      {decadeArtworks.length > 4 && !isExpanded && (
                        <button
                          onClick={() => toggleDecade(decade)}
                          className="mt-2 text-accent text-xs hover:underline"
                        >
                          + {decadeArtworks.length - 4} autre{decadeArtworks.length - 4 > 1 ? 's' : ''}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Undated artworks */}
        {undatedArtworks.length > 0 && !selectedCentury && (
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 bg-white/10 z-10" />
              <div>
                <h3 className="font-display text-xl italic text-white/60">Non datées</h3>
                <p className="text-secondary text-sm">{undatedArtworks.length} œuvre{undatedArtworks.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="ml-10 grid grid-cols-4 gap-2">
              {undatedArtworks.slice(0, 8).map(artwork => (
                <Link
                  key={artwork.id}
                  to={`/artwork/${artwork.id}`}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-white/5"
                >
                  {artwork.image_url ? (
                    <img
                      src={artwork.image_url}
                      alt={artwork.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/30">image</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {activeCenturies.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-4xl text-white/30 mb-2">timeline</span>
          <p className="text-secondary">Aucune œuvre datée dans votre collection</p>
          <p className="text-secondary text-sm mt-1">Ajoutez des années à vos œuvres pour les voir sur la frise</p>
        </div>
      )}
    </div>
  )
}
