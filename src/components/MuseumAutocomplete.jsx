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

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          className="input w-full"
          placeholder={placeholder}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {selectedMuseum && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-accent">
            <span className="material-symbols-outlined text-xl">verified</span>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-default rounded-lg overflow-hidden max-h-64 overflow-y-auto shadow-xl">
          {suggestions.map(museum => (
            <button
              key={museum.id}
              type="button"
              onClick={() => handleSelectMuseum(museum)}
              className="w-full px-4 py-3 text-left hover:bg-black/5 dark:hover:bg-white/10 transition-colors border-b border-default last:border-0"
            >
              <div className="font-medium">{museum.name}</div>
              <div className="text-secondary text-sm">
                {[museum.city, museum.country].filter(Boolean).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && query.length >= 2 && suggestions.length === 0 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-default rounded-lg p-4 text-secondary text-sm shadow-xl">
          Aucun musée trouvé. Le nom sera enregistré tel quel.
        </div>
      )}
    </div>
  )
}
