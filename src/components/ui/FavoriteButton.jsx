import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Bouton Favori ❤️
 * Toggle le statut favori d'une œuvre
 */
export function FavoriteButton({ 
  artworkId, 
  isFavorite = false, 
  size = 'md',
  onToggle 
}) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite)
  const [isLoading, setIsLoading] = useState(false)

  // Sync with prop when it changes
  useEffect(() => {
    setLocalFavorite(isFavorite)
  }, [isFavorite])

  const sizeClasses = {
    sm: 'text-xl p-1.5',
    md: 'text-2xl p-2',
    lg: 'text-3xl p-3'
  }

  const handleToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isLoading) return
    
    const newValue = !localFavorite
    
    // Optimistic update - change UI immediately
    setLocalFavorite(newValue)
    setIsLoading(true)

    try {
      const { error } = await supabase
        .from('artworks')
        .update({ is_favorite: newValue })
        .eq('id', artworkId)

      if (error) {
        // Revert on error
        setLocalFavorite(!newValue)
        throw error
      }

      // Notify parent after successful save
      onToggle?.(newValue)
    } catch (err) {
      console.error('Erreur toggle favori:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        rounded-full transition-all duration-200
        ${localFavorite 
          ? 'text-red-500 bg-black/40' 
          : 'text-white/80 hover:text-white bg-black/30 hover:bg-black/50'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : 'hover:scale-110 active:scale-95'}
        backdrop-blur-sm
      `}
      aria-label={localFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <span className={`material-symbols-outlined ${localFavorite ? 'filled' : ''}`}>
        favorite
      </span>
    </button>
  )
}
