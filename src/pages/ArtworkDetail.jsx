import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Input, { Textarea } from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/Modal'
import Loader from '../components/ui/Loader'
import { ArtworkCard } from '../components/ui/Card'

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
    if (!editForm.title?.trim()) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('artworks')
        .update({
          title: editForm.title?.trim() || null,
          artist: editForm.artist?.trim() || null,
          artist_dates: editForm.artist_dates?.trim() || null,
          year: editForm.year?.trim() || null,
          period: editForm.period?.trim() || null,
          style: editForm.style?.trim() || null,
          medium: editForm.medium?.trim() || null,
          dimensions: editForm.dimensions?.trim() || null,
          museum: editForm.museum?.trim() || null,
          museum_city: editForm.museum_city?.trim() || null,
          museum_country: editForm.museum_country?.trim() || null,
          description: editForm.description?.trim() || null,
          curatorial_note: editForm.curatorial_note?.trim() || null
        })
        .eq('id', id)
      if (error) throw error
      setArtwork({ ...artwork, ...editForm })
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
            <Input
              label="Période"
              value={editForm.period || ''}
              onChange={(e) => updateEditField('period', e.target.value)}
            />
            <Input
              label="Style"
              value={editForm.style || ''}
              onChange={(e) => updateEditField('style', e.target.value)}
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

          {/* Museum */}
          <Input
            label="Musée"
            value={editForm.museum || ''}
            onChange={(e) => updateEditField('museum', e.target.value)}
          />

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
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              disabled={togglingFavorite}
              className={`w-10 h-10 backdrop-blur-xl rounded-full flex items-center justify-center transition-all ${
                artwork.is_favorite
                  ? 'bg-accent text-white'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="material-symbols-outlined">
                {artwork.is_favorite ? 'favorite' : 'favorite_border'}
              </span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <span className="material-symbols-outlined">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-black/80 backdrop-blur-xl rounded-xl overflow-hidden z-50 border border-white/10">
                    <button
                      onClick={() => { setIsEditing(true); setShowMenu(false) }}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">edit</span>
                      Modifier
                    </button>
                    <button
                      onClick={shareArtwork}
                      className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3 transition-colors"
                    >
                      <span className="material-symbols-outlined text-xl">share</span>
                      Partager
                    </button>
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
        </div>
      </header>

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

        {/* Zoom hint */}
        {artwork.image_url && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 text-white/50 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
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
        <div className="flex items-center justify-center gap-4 max-w-lg mx-auto mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-accent/50" />
          <span className="font-serif italic text-xl text-white/90">
            {artwork.artist || 'Artiste inconnu'}
            {artwork.artist_dates && (
              <span className="text-white/50 ml-2">({artwork.artist_dates})</span>
            )}
          </span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-accent/50" />
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={shareArtwork}
            className="btn btn-outline bg-white/10 backdrop-blur-xl text-white border-white/20 hover:border-accent hover:text-accent"
          >
            <span className="material-symbols-outlined">share</span>
            Partager
          </button>
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
    </div>
  )
}
