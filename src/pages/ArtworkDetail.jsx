import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Input, { Textarea } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/Modal'
import Loader from '../components/ui/Loader'
import { ArtworkCard } from '../components/ui/Card'
import MuseumAutocomplete from '../components/MuseumAutocomplete'
import SuggestionInput from '../components/ui/SuggestionInput'
import AddToCollectionModal from '../components/ui/AddToCollectionModal'

export default function ArtworkDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)
  const [relatedArtworks, setRelatedArtworks] = useState([])
  const [togglingFavorite, setTogglingFavorite] = useState(false)
  const [showCollectionModal, setShowCollectionModal] = useState(false)

  useEffect(() => {
    fetchArtwork()
  }, [id])

  async function fetchArtwork() {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      navigate('/collection')
      return
    }

    setArtwork(data)
    setEditForm(data)
    setLoading(false)

    // Fetch related artworks by same artist
    if (data.artist) {
      const { data: related } = await supabase
        .from('artworks')
        .select('id, title, image_url, year, artist')
        .eq('user_id', user.id)
        .eq('artist', data.artist)
        .neq('id', id)
        .limit(4)

      if (related) setRelatedArtworks(related)
    }
  }

  async function toggleFavorite() {
    if (togglingFavorite) return
    setTogglingFavorite(true)

    try {
      const newValue = !artwork.is_favorite
      const { error } = await supabase
        .from('artworks')
        .update({ is_favorite: newValue })
        .eq('id', id)

      if (!error) {
        setArtwork(prev => ({ ...prev, is_favorite: newValue }))
      }
    } catch (err) {
      console.error('Toggle favorite error:', err)
    }

    setTogglingFavorite(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      if (artwork.image_url) {
        const imagePath = artwork.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage.from('artworks').remove([`${user.id}/${imagePath}`])
        }
      }
      const { error } = await supabase.from('artworks').delete().eq('id', id)
      if (error) throw error
      navigate('/collection')
    } catch (err) {
      console.error('Delete error:', err)
      setDeleting(false)
      setShowDeleteModal(false)
    }
  }

  async function handleSave() {
    if (!editForm.title?.trim()) {
      alert('Le titre est requis')
      return
    }
    setSaving(true)
    try {
      // Convert year to integer or null
      const yearValue = editForm.year ? parseInt(editForm.year, 10) : null
      const validYear = !isNaN(yearValue) ? yearValue : null

      const updateData = {
        title: editForm.title?.trim() || null,
        artist: editForm.artist?.trim() || null,
        artist_dates: editForm.artist_dates?.trim() || null,
        year: validYear,
        period: editForm.period?.trim() || null,
        style: editForm.style?.trim() || null,
        medium: editForm.medium?.trim() || null,
        dimensions: editForm.dimensions?.trim() || null,
        museum: editForm.museum?.trim() || null,
        museum_city: editForm.museum_city?.trim() || null,
        museum_country: editForm.museum_country?.trim() || null,
        description: editForm.description?.trim() || null,
        curatorial_note: editForm.curatorial_note?.trim() || null
      }

      const { data, error } = await supabase
        .from('artworks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Save error:', error)
        alert('Erreur lors de la sauvegarde: ' + error.message)
        throw error
      }
      
      // Update local state with saved data
      setArtwork(data)
      setEditForm(data)
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
    }
    setSaving(false)
  }

  function updateEditField(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  async function shareArtwork() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `${artwork.title}${artwork.artist ? ` de ${artwork.artist}` : ''}`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Lien copié !')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
    setShowMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Chargement..." />
      </div>
    )
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => { setEditForm(artwork); setIsEditing(false) }}
              className="btn btn-ghost"
            >
              <span className="material-symbols-outlined">close</span>
              Annuler
            </button>
            <h1 className="font-display italic text-lg">Modifier</h1>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !editForm.title?.trim()}
              className="btn btn-primary"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {/* Title */}
          <Input
            label="Titre *"
            value={editForm.title || ''}
            onChange={(e) => updateEditField('title', e.target.value)}
            className="text-2xl font-display italic"
          />

          {/* Artist row */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Artiste"
              value={editForm.artist || ''}
              onChange={(e) => updateEditField('artist', e.target.value)}
            />
            <Input
              label="Dates de l'artiste"
              value={editForm.artist_dates || ''}
              onChange={(e) => updateEditField('artist_dates', e.target.value)}
              placeholder="1853-1890"
            />
          </div>

          {/* Year, Period, Style */}
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Année"
              value={editForm.year || ''}
              onChange={(e) => updateEditField('year', e.target.value)}
            />
            <SuggestionInput
              label="Période"
              type="period"
              value={editForm.period || ''}
              onChange={(value) => updateEditField('period', value)}
              placeholder="Post-impressionnisme"
            />
            <SuggestionInput
              label="Style"
              type="style"
              value={editForm.style || ''}
              onChange={(value) => updateEditField('style', value)}
              placeholder="Paysage"
            />
          </div>

          {/* Medium, Dimensions */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Technique"
              value={editForm.medium || ''}
              onChange={(e) => updateEditField('medium', e.target.value)}
            />
            <Input
              label="Dimensions"
              value={editForm.dimensions || ''}
              onChange={(e) => updateEditField('dimensions', e.target.value)}
            />
          </div>

          {/* Museum with Autocomplete */}
          <div>
            <label className="label text-secondary mb-2 block">Musée / Collection</label>
            <MuseumAutocomplete
              value={editForm.museum || ''}
              onChange={(value) => updateEditField('museum', value)}
              onMuseumSelect={(museum) => {
                updateEditField('museum', museum.name)
                updateEditField('museum_city', museum.city || '')
                updateEditField('museum_country', museum.country || '')
              }}
              placeholder="Musée d'Orsay"
            />
          </div>

          {/* City, Country */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              value={editForm.museum_city || ''}
              onChange={(e) => updateEditField('museum_city', e.target.value)}
            />
            <Input
              label="Pays"
              value={editForm.museum_country || ''}
              onChange={(e) => updateEditField('museum_country', e.target.value)}
            />
          </div>

          {/* Description */}
          <Textarea
            label="Description"
            value={editForm.description || ''}
            onChange={(e) => updateEditField('description', e.target.value)}
            rows={4}
          />

          {/* Curatorial note */}
          <Textarea
            label="Contexte historique"
            value={editForm.curatorial_note || ''}
            onChange={(e) => updateEditField('curatorial_note', e.target.value)}
            rows={3}
            className="font-display italic"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Back Button - Fixed, very visible */}
      <button
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 w-12 h-12 bg-black/80 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-black transition-colors border-2 border-white/30 shadow-lg"
      >
        <span className="material-symbols-outlined text-2xl">arrow_back</span>
      </button>

      {/* Floating Action Buttons - Right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
        {/* Favorite */}
        <button
          onClick={toggleFavorite}
          disabled={togglingFavorite}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
            artwork.is_favorite
              ? 'bg-red-500 text-white'
              : 'bg-black/70 backdrop-blur-xl text-white hover:bg-black/90 border border-white/20'
          }`}
          title={artwork.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <span className={`material-symbols-outlined text-xl ${artwork.is_favorite ? 'filled' : ''}`}>
            favorite
          </span>
        </button>

        {/* Edit */}
        <button
          onClick={() => setIsEditing(true)}
          className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl text-white hover:bg-black/90 border border-white/20 flex items-center justify-center transition-all shadow-lg"
          title="Modifier"
        >
          <span className="material-symbols-outlined text-xl">edit</span>
        </button>

        {/* Share */}
        <button
          onClick={shareArtwork}
          className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl text-white hover:bg-black/90 border border-white/20 flex items-center justify-center transition-all shadow-lg"
          title="Partager"
        >
          <span className="material-symbols-outlined text-xl">share</span>
        </button>

        {/* More Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl text-white hover:bg-black/90 border border-white/20 flex items-center justify-center transition-all shadow-lg"
            title="Plus d'options"
          >
            <span className="material-symbols-outlined text-xl">more_vert</span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-full mr-2 top-0 w-52 bg-black/90 backdrop-blur-xl rounded-xl overflow-hidden z-50 border border-white/20 shadow-xl">
                <button
                  onClick={() => { setShowCollectionModal(true); setShowMenu(false) }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">folder</span>
                  Ajouter à une collection
                </button>
                <button
                  onClick={toggleTheme}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">
                    {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                  </span>
                  {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                </button>
                <div className="border-t border-white/10" />
                <button
                  onClick={() => { setShowDeleteModal(true); setShowMenu(false) }}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hero Image - 70vh */}
      <div
        className="relative h-[70vh] bg-black cursor-pointer group"
        onClick={() => artwork.image_url && setShowFullImage(true)}
      >
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-8xl text-white/20">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Zoom hint */}
        {artwork.image_url && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-lg">zoom_in</span>
            Cliquez pour agrandir
          </div>
        )}
      </div>

      {/* Title Section - overlapping hero */}
      <section className="relative -mt-32 z-10 text-center px-4 pb-12">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold italic text-white drop-shadow-lg mb-6">
          {artwork.title}
        </h1>

        {/* Artist with gold accent lines */}
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <span className="font-serif italic text-xl text-white/90">
            {artwork.artist || 'Artiste inconnu'}
            {artwork.artist_dates && (
              <span className="text-white/50 ml-2">({artwork.artist_dates})</span>
            )}
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>
      </section>

      {/* Content - Editorial layout */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left column: Metadata */}
          <div className="space-y-8">
            {artwork.year && (
              <div>
                <p className="label mb-1">Année</p>
                <p className="font-display text-2xl">{artwork.year}</p>
              </div>
            )}

            {artwork.medium && (
              <div>
                <p className="label mb-1">Technique</p>
                <p className="font-serif italic text-lg">{artwork.medium}</p>
              </div>
            )}

            {artwork.dimensions && (
              <div>
                <p className="label mb-1">Dimensions</p>
                <p className="text-lg">{artwork.dimensions}</p>
              </div>
            )}

            {artwork.museum && (
              <div>
                <p className="label mb-1">Localisation</p>
                <p className="text-lg">{artwork.museum}</p>
                {(artwork.museum_city || artwork.museum_country) && (
                  <p className="text-secondary">
                    {[artwork.museum_city, artwork.museum_country].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}

            {/* Period & Style tags */}
            {(artwork.period || artwork.style) && (
              <div className="flex flex-wrap gap-2">
                {artwork.period && (
                  <span className="chip chip-accent">{artwork.period}</span>
                )}
                {artwork.style && (
                  <span className="chip">{artwork.style}</span>
                )}
              </div>
            )}
          </div>

          {/* Right columns: Description */}
          <div className="md:col-span-2 space-y-8">
            {artwork.description && (
              <div>
                <p className="label mb-4">À propos de cette œuvre</p>
                <p className="text-lg leading-relaxed font-serif first-letter:text-5xl first-letter:font-display first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-accent">
                  {artwork.description}
                </p>
              </div>
            )}

            {artwork.curatorial_note && (
              <blockquote className="border-l-2 border-accent pl-6 py-4">
                <p className="font-display italic text-xl leading-relaxed text-accent">
                  "{artwork.curatorial_note}"
                </p>
              </blockquote>
            )}

            {/* If no description, show a placeholder */}
            {!artwork.description && !artwork.curatorial_note && (
              <div className="text-center py-12 bg-secondary rounded-xl">
                <span className="material-symbols-outlined text-4xl text-secondary mb-2">description</span>
                <p className="text-secondary">Aucune description disponible</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-outline mt-4"
                >
                  Ajouter une description
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Works */}
      {relatedArtworks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-primary/10">
          <h2 className="label mb-8">
            Autres œuvres de {artwork.artist}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedArtworks.map(related => (
              <ArtworkCard key={related.id} artwork={related} />
            ))}
          </div>
        </section>
      )}

      {/* Share Section */}
      <section className="max-w-6xl mx-auto px-4 py-8 border-t border-primary/10">
        <h2 className="label mb-4 text-center">Partager cette œuvre</h2>
        <div className="flex justify-center gap-3">
          {/* Native Share (mobile) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <button
              onClick={shareArtwork}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined">share</span>
              <span>Partager</span>
            </button>
          )}
          
          {/* Twitter/X */}
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${artwork.title}${artwork.artist ? ` de ${artwork.artist}` : ''} - Découvert sur ArtVault`)}&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Partager sur X"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          
          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Partager sur Facebook"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          
          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${artwork.title}${artwork.artist ? ` de ${artwork.artist}` : ''} - ${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Partager sur WhatsApp"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>
          
          {/* Copy Link */}
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href)
              alert('Lien copié !')
            }}
            className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Copier le lien"
          >
            <span className="material-symbols-outlined text-xl">link</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center border-t border-primary/10">
        <p className="text-sm text-secondary">
          Ajouté le {new Date(artwork.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </p>
      </footer>

      {/* Full Image Modal */}
      {showFullImage && artwork.image_url && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer cette œuvre ?"
        message="Cette action est irréversible. L'œuvre et son image seront définitivement supprimées."
        confirmText={deleting ? 'Suppression...' : 'Supprimer'}
        cancelText="Annuler"
        danger
      />

      {/* Add to Collection Modal */}
      <AddToCollectionModal
        isOpen={showCollectionModal}
        onClose={() => setShowCollectionModal(false)}
        artworkId={id}
        currentCollectionId={artwork.collection_id}
        onSuccess={(collectionId) => {
          setArtwork(prev => ({ ...prev, collection_id: collectionId }))
        }}
      />
    </div>
  )
}
