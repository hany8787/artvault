import { useState, useMemo } from 'react'
import { ALL_FILTER_CATEGORIES, getLabelForValue } from '../../data/filterCategories'

/**
 * Modal de filtres hiérarchiques plein écran
 * Style inspiré de Whart avec accordéons et compteur dynamique
 */
export default function HierarchicalFilters({
  isOpen,
  onClose,
  selectedFilters, // { periods: [], art_forms: [], ... }
  onFiltersChange,
  resultCount = 0,
  museums = [], // Liste des musées de la collection
  artists = [], // Liste des artistes de la collection
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState(['periods'])
  const [expandedSubsections, setExpandedSubsections] = useState([])
  
  // Compte le nombre total de filtres actifs
  const activeFilterCount = useMemo(() => {
    return Object.values(selectedFilters).reduce((acc, arr) => {
      return acc + (Array.isArray(arr) ? arr.length : (arr ? 1 : 0))
    }, 0)
  }, [selectedFilters])
  
  // Toggle une section principale
  function toggleSection(sectionId) {
    setExpandedSections(prev => 
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }
  
  // Toggle une sous-section
  function toggleSubsection(subsectionId) {
    setExpandedSubsections(prev =>
      prev.includes(subsectionId)
        ? prev.filter(id => id !== subsectionId)
        : [...prev, subsectionId]
    )
  }
  
  // Toggle un filtre individuel
  function toggleFilter(categoryId, value) {
    const current = selectedFilters[categoryId] || []
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    
    onFiltersChange({
      ...selectedFilters,
      [categoryId]: newValues
    })
  }
  
  // Vérifie si un filtre est sélectionné
  function isSelected(categoryId, value) {
    return (selectedFilters[categoryId] || []).includes(value)
  }
  
  // Reset tous les filtres
  function resetAllFilters() {
    const emptyFilters = {}
    ALL_FILTER_CATEGORIES.forEach(cat => {
      emptyFilters[cat.id] = []
    })
    emptyFilters.museum = ''
    emptyFilters.artist = ''
    emptyFilters.favoritesOnly = false
    onFiltersChange(emptyFilters)
  }
  
  // Filtre les options par recherche
  function filterBySearch(options) {
    if (!searchQuery) return options
    const query = searchQuery.toLowerCase()
    return options.filter(opt => 
      opt.label.toLowerCase().includes(query) ||
      (opt.subcategories && opt.subcategories.some(sub => 
        sub.label.toLowerCase().includes(query)
      ))
    )
  }
  
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-dark border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={onClose}
            className="p-2 -ml-2 text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <h1 className="font-display text-xl italic">Filtres</h1>
          
          <button
            onClick={resetAllFilters}
            className="text-sm text-accent hover:text-accent/80 transition-colors"
            disabled={activeFilterCount === 0}
          >
            Réinitialiser
          </button>
        </div>
        
        {/* Barre de recherche */}
        <div className="px-4 pb-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un filtre..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 
                       text-white placeholder:text-white/40 focus:border-accent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <span className="material-symbols-outlined text-white/40 text-lg">close</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Compteur de résultats */}
        <div className="px-4 pb-3">
          <p className="text-sm text-white/60">
            <span className="text-accent font-medium">{resultCount}</span> résultat{resultCount > 1 ? 's' : ''}
            {activeFilterCount > 0 && (
              <span className="ml-2">
                • {activeFilterCount} filtre{activeFilterCount > 1 ? 's' : ''} actif{activeFilterCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </header>
      
      {/* Contenu scrollable */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
        <div className="px-4 py-4 space-y-2">
          
          {/* Favoris Toggle */}
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-500">favorite</span>
                <span className="font-medium">Favoris uniquement</span>
              </div>
              <button
                onClick={() => onFiltersChange({
                  ...selectedFilters,
                  favoritesOnly: !selectedFilters.favoritesOnly
                })}
                className={`w-12 h-7 rounded-full transition-colors ${
                  selectedFilters.favoritesOnly ? 'bg-accent' : 'bg-white/20'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  selectedFilters.favoritesOnly ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
          
          {/* Catégories de filtres */}
          {ALL_FILTER_CATEGORIES.map(category => {
            const filteredOptions = filterBySearch(category.options)
            if (filteredOptions.length === 0 && searchQuery) return null
            
            const selectedCount = (selectedFilters[category.id] || []).length
            const isExpanded = expandedSections.includes(category.id)
            
            return (
              <div key={category.id} className="bg-white/5 rounded-lg overflow-hidden">
                {/* Header de catégorie */}
                <button
                  onClick={() => toggleSection(category.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent">
                      {category.icon}
                    </span>
                    <span className="font-medium">{category.label}</span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 bg-accent text-bg-dark text-xs font-medium rounded-full">
                        {selectedCount}
                      </span>
                    )}
                  </div>
                  <span className={`material-symbols-outlined text-white/40 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}>
                    expand_more
                  </span>
                </button>
                
                {/* Options de la catégorie */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-1">
                    {filteredOptions.map(option => (
                      <div key={option.value}>
                        {/* Option principale */}
                        <div className="flex items-center">
                          {option.subcategories && option.subcategories.length > 0 ? (
                            // Option avec sous-catégories
                            <>
                              <button
                                onClick={() => toggleSubsection(option.value)}
                                className="p-2 -ml-2"
                              >
                                <span className={`material-symbols-outlined text-white/40 text-lg transition-transform ${
                                  expandedSubsections.includes(option.value) ? 'rotate-90' : ''
                                }`}>
                                  chevron_right
                                </span>
                              </button>
                              <button
                                onClick={() => toggleFilter(category.id, option.value)}
                                className={`flex-1 text-left py-2 px-2 rounded-lg transition-colors ${
                                  isSelected(category.id, option.value)
                                    ? 'bg-accent/20 text-accent'
                                    : 'hover:bg-white/5'
                                }`}
                              >
                                {option.label}
                              </button>
                            </>
                          ) : (
                            // Option simple
                            <button
                              onClick={() => toggleFilter(category.id, option.value)}
                              className={`w-full text-left py-2 px-4 rounded-lg transition-colors ${
                                isSelected(category.id, option.value)
                                  ? 'bg-accent/20 text-accent'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{option.label}</span>
                                {isSelected(category.id, option.value) && (
                                  <span className="material-symbols-outlined text-accent text-lg">
                                    check
                                  </span>
                                )}
                              </div>
                            </button>
                          )}
                        </div>
                        
                        {/* Sous-catégories */}
                        {option.subcategories && 
                         option.subcategories.length > 0 && 
                         expandedSubsections.includes(option.value) && (
                          <div className="ml-8 mt-1 space-y-1 border-l border-white/10 pl-4">
                            {option.subcategories.map(sub => (
                              <button
                                key={sub.value}
                                onClick={() => toggleFilter(category.id, sub.value)}
                                className={`w-full text-left py-1.5 px-3 rounded-lg text-sm transition-colors ${
                                  isSelected(category.id, sub.value)
                                    ? 'bg-accent/20 text-accent'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span>{sub.label}</span>
                                  {isSelected(category.id, sub.value) && (
                                    <span className="material-symbols-outlined text-accent text-sm">
                                      check
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Musée (dropdown dynamique) */}
          {museums.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm text-white/60 mb-2">
                <span className="material-symbols-outlined text-accent text-lg align-middle mr-2">
                  museum
                </span>
                Musée
              </label>
              <select
                value={selectedFilters.museum || ''}
                onChange={(e) => onFiltersChange({
                  ...selectedFilters,
                  museum: e.target.value
                })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 
                         text-white focus:border-accent focus:outline-none"
              >
                <option value="">Tous les musées</option>
                {museums.map(museum => (
                  <option key={museum} value={museum}>{museum}</option>
                ))}
              </select>
            </div>
          )}
          
          {/* Artiste (dropdown dynamique) */}
          {artists.length > 0 && (
            <div className="bg-white/5 rounded-lg p-4">
              <label className="block text-sm text-white/60 mb-2">
                <span className="material-symbols-outlined text-accent text-lg align-middle mr-2">
                  person
                </span>
                Artiste
              </label>
              <select
                value={selectedFilters.artist || ''}
                onChange={(e) => onFiltersChange({
                  ...selectedFilters,
                  artist: e.target.value
                })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 
                         text-white focus:border-accent focus:outline-none"
              >
                <option value="">Tous les artistes</option>
                {artists.map(artist => (
                  <option key={artist} value={artist}>{artist}</option>
                ))}
              </select>
            </div>
          )}
          
        </div>
      </div>
      
      {/* Footer avec bouton Appliquer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-bg-dark border-t border-white/10">
        <button
          onClick={onClose}
          className="w-full bg-accent text-bg-dark font-semibold py-3 rounded-lg 
                   hover:bg-accent/90 transition-colors active:scale-[0.98]"
        >
          Voir {resultCount} résultat{resultCount > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  )
}

/**
 * Chips des filtres actifs (pour afficher sous le header)
 */
export function ActiveFilterChips({ selectedFilters, onRemove, onClearAll }) {
  const chips = []
  
  // Convertir les filtres en chips
  Object.entries(selectedFilters).forEach(([categoryId, values]) => {
    if (categoryId === 'favoritesOnly' && values) {
      chips.push({ id: 'favoritesOnly', label: 'Favoris', categoryId })
    } else if (categoryId === 'museum' && values) {
      chips.push({ id: 'museum', label: values, categoryId })
    } else if (categoryId === 'artist' && values) {
      chips.push({ id: 'artist', label: values, categoryId })
    } else if (Array.isArray(values)) {
      values.forEach(value => {
        chips.push({
          id: `${categoryId}-${value}`,
          label: getLabelForValue(value),
          categoryId,
          value
        })
      })
    }
  })
  
  if (chips.length === 0) return null
  
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => onRemove(chip.categoryId, chip.value)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 
                   text-accent text-sm rounded-full hover:bg-accent/30 transition-colors"
        >
          <span>{chip.label}</span>
          <span className="material-symbols-outlined text-sm">close</span>
        </button>
      ))}
      {chips.length > 1 && (
        <button
          onClick={onClearAll}
          className="px-3 py-1.5 text-white/60 text-sm hover:text-white transition-colors"
        >
          Tout effacer
        </button>
      )}
    </div>
  )
}
