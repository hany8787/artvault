import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function ArtworkDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [artwork, setArtwork] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

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
  }

  async function handleDelete() {
    setDeleting(true)

    try {
      // Delete image from storage if exists
      if (artwork.image_url) {
        const imagePath = artwork.image_url.split('/').pop()
        if (imagePath) {
          await supabase.storage
            .from('artworks')
            .remove([`${user.id}/${imagePath}`])
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('artworks')
        .delete()
        .eq('id', id)

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

      setArtwork(editForm)
      setIsEditing(false)
    } catch (err) {
      console.error('Save error:', err)
    }

    setSaving(false)
  }

  function updateEditField(field, value) {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  function cancelEdit() {
    setEditForm(artwork)
    setIsEditing(false)
  }

  async function shareArtwork() {
    const shareData = {
      title: artwork.title,
      text: `${artwork.title}${artwork.artist ? ` par ${artwork.artist}` : ''}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Lien copié dans le presse-papier!')
      }
    } catch (err) {
      console.error('Share error:', err)
    }

    setShowMenu(false)
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="text-primary">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Header with back and menu */}
      <div className="p-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Retour
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">more_vert</span>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 glass rounded-xl overflow-hidden z-50">
                <button
                  onClick={() => {
                    setIsEditing(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-xl">edit</span>
                  Modifier
                </button>
                <button
                  onClick={shareArtwork}
                  className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-xl">share</span>
                  Partager
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true)
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                  Supprimer
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Image */}
      <div
        className="aspect-[4/3] bg-surface-dark cursor-pointer"
        onClick={() => artwork.image_url && setShowFullImage(true)}
      >
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-white/20">image</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 md:p-8">
        {isEditing ? (
          /* Edit Mode */
          <div className="space-y-6 max-w-2xl">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-white/60 text-sm mb-1">Titre *</label>
                <input
                  type="text"
                  value={editForm.title || ''}
                  onChange={(e) => updateEditField('title', e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Artiste</label>
                  <input
                    type="text"
                    value={editForm.artist || ''}
                    onChange={(e) => updateEditField('artist', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Dates de l'artiste</label>
                  <input
                    type="text"
                    value={editForm.artist_dates || ''}
                    onChange={(e) => updateEditField('artist_dates', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Année</label>
                  <input
                    type="text"
                    value={editForm.year || ''}
                    onChange={(e) => updateEditField('year', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Période</label>
                  <input
                    type="text"
                    value={editForm.period || ''}
                    onChange={(e) => updateEditField('period', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Style</label>
                  <input
                    type="text"
                    value={editForm.style || ''}
                    onChange={(e) => updateEditField('style', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Technique / Medium</label>
                  <input
                    type="text"
                    value={editForm.medium || ''}
                    onChange={(e) => updateEditField('medium', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={editForm.dimensions || ''}
                    onChange={(e) => updateEditField('dimensions', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Musée / Collection</label>
                <input
                  type="text"
                  value={editForm.museum || ''}
                  onChange={(e) => updateEditField('museum', e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1">Ville</label>
                  <input
                    type="text"
                    value={editForm.museum_city || ''}
                    onChange={(e) => updateEditField('museum_city', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1">Pays</label>
                  <input
                    type="text"
                    value={editForm.museum_country || ''}
                    onChange={(e) => updateEditField('museum_country', e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => updateEditField('description', e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-white/60 text-sm mb-1">Note curatoriale</label>
                <textarea
                  value={editForm.curatorial_note || ''}
                  onChange={(e) => updateEditField('curatorial_note', e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none resize-none font-display italic"
                />
              </div>
            </div>

            {/* Edit Actions */}
            <div className="flex gap-4">
              <button
                onClick={cancelEdit}
                className="flex-1 border border-white/20 text-white py-3 rounded-lg hover:border-white/40 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !editForm.title?.trim()}
                className="flex-1 bg-primary text-bg-dark font-semibold py-3 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <>
            {/* Title & Artist */}
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold italic text-white mb-2">
                {artwork.title}
              </h1>
              <p className="text-xl text-white/80">
                {artwork.artist || 'Artiste inconnu'}
                {artwork.artist_dates && (
                  <span className="text-white/40 ml-2">({artwork.artist_dates})</span>
                )}
              </p>
              {artwork.year && (
                <p className="text-white/60 mt-1">{artwork.year}</p>
              )}
            </div>

            {/* Tags */}
            {(artwork.period || artwork.style || artwork.medium) && (
              <div className="flex flex-wrap gap-2 mb-6">
                {artwork.period && (
                  <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
                    {artwork.period}
                  </span>
                )}
                {artwork.style && (
                  <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
                    {artwork.style}
                  </span>
                )}
                {artwork.medium && (
                  <span className="px-3 py-1 text-xs font-medium uppercase tracking-wider border border-primary/50 rounded-sm text-primary/80">
                    {artwork.medium}
                  </span>
                )}
              </div>
            )}

            {/* Museum */}
            {artwork.museum && (
              <div className="glass rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary">museum</span>
                  <div>
                    <p className="text-white font-medium">{artwork.museum}</p>
                    {(artwork.museum_city || artwork.museum_country) && (
                      <p className="text-white/60 text-sm">
                        {[artwork.museum_city, artwork.museum_country].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {artwork.description && (
              <div className="mb-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Description</p>
                <p className="text-white/80 leading-relaxed">{artwork.description}</p>
              </div>
            )}

            {/* Curatorial Note */}
            {artwork.curatorial_note && (
              <div className="border-l-2 border-primary pl-4 mb-6">
                <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Note curatoriale</p>
                <p className="font-display italic text-primary/90 leading-relaxed text-lg">
                  "{artwork.curatorial_note}"
                </p>
              </div>
            )}

            {/* Details */}
            {artwork.dimensions && (
              <div className="text-sm text-white/60 mb-6">
                <span className="text-white/40">Dimensions : </span>
                {artwork.dimensions}
              </div>
            )}

            {/* Added date */}
            <div className="text-sm text-white/40 pt-4 border-t border-white/10">
              Ajoutée le {new Date(artwork.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </>
        )}
      </div>

      {/* Full Image Modal */}
      {showFullImage && artwork.image_url && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            onClick={() => setShowFullImage(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-400">delete</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Supprimer cette œuvre ?</h3>
              <p className="text-white/60">
                Cette action est irréversible. L'œuvre sera définitivement supprimée de votre collection.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 border border-white/20 text-white py-3 rounded-lg hover:border-white/40 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
