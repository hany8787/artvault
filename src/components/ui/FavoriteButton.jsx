import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Bouton Favori ❤️
 * Toggle le statut favori d'une œuvre
 */
export function FavoriteButton({ 
  artworkId, 
  initialFavorite = false, 
  size = 'md',
  onToggle 
}) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)

  const sizeClasses = {
    sm: 'text-xl p-1',
    md: 'text-2xl p-2',
    lg: 'text-3xl p-3'
  }

  const handleToggle = async (e) => {
    e.preventDefault() // Empêche la navigation si dans un Link
    e.stopPropagation()
    
    if (isLoading) return
    
    setIsLoading(true)
    const newValue = !isFavorite

    try {
      const { error } = await supabase
        .from('artworks')
        .update({ is_favorite: newValue })
        .eq('id', artworkId)

      if (error) throw error

      setIsFavorite(newValue)
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
        ${isFavorite 
          ? 'text-red-500 hover:text-red-400' 
          : 'text-white/60 hover:text-white'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : 'hover:scale-110 active:scale-95'}
        backdrop-blur-sm bg-black/20 hover:bg-black/40
      `}
      aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
    >
      <span className={`material-symbols-outlined ${isFavorite ? 'filled' : ''}`}>
        favorite
      </span>
    </button>
  )
}
