import { useState, useRef, useEffect } from 'react'

// Suggestions prédéfinies pour les périodes artistiques
const PERIOD_SUGGESTIONS = [
  'Antiquité',
  'Moyen Âge',
  'Renaissance',
  'Maniérisme',
  'Baroque',
  'Rococo',
  'Néoclassicisme',
  'Romantisme',
  'Réalisme',
  'Impressionnisme',
  'Post-impressionnisme',
  'Symbolisme',
  'Art nouveau',
  'Fauvisme',
  'Expressionnisme',
  'Cubisme',
  'Futurisme',
  'Dadaïsme',
  'Surréalisme',
  'Art abstrait',
  'Pop Art',
  'Art contemporain',
  'Art minimaliste',
  'Art conceptuel'
]

// Suggestions prédéfinies pour les styles artistiques
const STYLE_SUGGESTIONS = [
  'Abstrait',
  'Figuratif',
  'Portrait',
  'Paysage',
  'Nature morte',
  'Scène de genre',
  'Scène historique',
  'Scène religieuse',
  'Scène mythologique',
  'Marine',
  'Nu',
  'Autoportrait',
  'Vanité',
  'Trompe-l\'œil',
  'Veduta',
  'Capriccio'
]

/**
 * Composant Autocomplete avec suggestions prédéfinies
 */
export default function SuggestionInput({
  value,
  onChange,
  suggestions = [],
  type = 'period', // 'period' ou 'style'
  placeholder = '',
  label,
  className = ''
}) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const wrapperRef = useRef(null)

  // Utiliser les suggestions par défaut selon le type
  const allSuggestions = suggestions.length > 0 
    ? suggestions 
    : (type === 'period' ? PERIOD_SUGGESTIONS : STYLE_SUGGESTIONS)

  // Fermer les suggestions au clic extérieur
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrer les suggestions selon la saisie
  useEffect(() => {
    if (!value || value.length === 0) {
      setFilteredSuggestions(allSuggestions.slice(0, 8))
    } else {
      const filtered = allSuggestions.filter(s =>
        s.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8)
      setFilteredSuggestions(filtered)
    }
  }, [value, allSuggestions])

  function handleInputChange(e) {
    onChange(e.target.value)
    setShowSuggestions(true)
  }

  function handleSelect(suggestion) {
    onChange(suggestion)
    setShowSuggestions(false)
  }

  function handleFocus() {
    setShowSuggestions(true)
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <label className="label text-secondary mb-2 block">{label}</label>
      )}
      <input
        type="text"
        value={value || ''}
        onChange={handleInputChange}
        onFocus={handleFocus}
        className="input w-full"
        placeholder={placeholder}
      />

      {/* Dropdown suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-xl">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { PERIOD_SUGGESTIONS, STYLE_SUGGESTIONS }
