import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function MuseumAutocomplete({
  value,
  onChange,
  onMuseumSelect,
  placeholder = "Musée / Collection"
}) {
  const [query, setQuery] = useState(value || '')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMuseum, setSelectedMuseum] = useState(null)
  const wrapperRef = useRef(null)

  // Update local query when value prop changes
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search museums as user types
  useEffect(() => {
    const searchMuseums = async () => {
      if (query.length < 2) {
        setSuggestions([])
        return
      }

      setLoading(true)
      const searchTerm = query.toLowerCase()

      const { data, error } = await supabase
        .from('museums')
        .select('id, name, aliases, city, country')
        .or(`name.ilike.%${searchTerm}%,aliases.cs.{${searchTerm}}`)
        .limit(8)

      if (!error && data) {
        setSuggestions(data)
      }
      setLoading(false)
    }

    const debounce = setTimeout(searchMuseums, 300)
    return () => clearTimeout(debounce)
  }, [query])

  function handleInputChange(e) {
    const newValue = e.target.value
    setQuery(newValue)
    setSelectedMuseum(null)
    setShowSuggestions(true)
    onChange?.(newValue)
  }

  function handleSelectMuseum(museum) {
    setQuery(museum.name)
    setSelectedMuseum(museum)
    setShowSuggestions(false)
    onChange?.(museum.name)
    onMuseumSelect?.(museum)
  }

  function handleFocus() {
    if (suggestions.length > 0 || query.length >= 2) {
      setShowSuggestions(true)
    }
  }

  // Format display text with alias match highlight
  function formatMuseumDisplay(museum) {
    const matchedAlias = museum.aliases?.find(a =>
      a.toLowerCase().includes(query.toLowerCase())
    )

    return (
      <div>
        <div className="text-white font-medium">{museum.name}</div>
        <div className="text-white/50 text-sm">
          {matchedAlias && matchedAlias.toLowerCase() !== museum.name.toLowerCase() && (
            <span className="text-primary mr-2">({matchedAlias})</span>
          )}
          {[museum.city, museum.country].filter(Boolean).join(', ')}
        </div>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {selectedMuseum && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-primary">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 glass rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          {suggestions.map(museum => (
            <button
              key={museum.id}
              type="button"
              onClick={() => handleSelectMuseum(museum)}
              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0"
            >
              {formatMuseumDisplay(museum)}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 glass rounded-lg p-4 text-white/60 text-sm">
          Aucun musée trouvé. Le musée sera créé automatiquement.
        </div>
      )}
    </div>
  )
}
