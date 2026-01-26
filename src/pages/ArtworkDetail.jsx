import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

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
        .select('id, title, image_url, year')
        .eq('user_id', user.id)
        .eq('artist', data.artist)
        .neq('id', id)
        .limit(4)

      if (related) setRelatedArtworks(related)
    }
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

  async function shareArtwork() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: artwork.title,
          text: `${artwork.title}${artwork.artist ? ` by ${artwork.artist}` : ''}`,
          url: window.location.href
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copied!')
      }
    } catch (err) {
      console.error('Share error:', err)
    }
    setShowMenu(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-display italic text-xl">Loading...</div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="min-h-screen pb-8">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-bg-light/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <button onClick={() => { setEditForm(artwork); setIsEditing(false) }} className="btn-ghost flex items-center gap-2">
              <span className="material-symbols-outlined">close</span>
              Cancel
            </button>
            <h1 className="font-display italic text-lg">Edit Artwork</h1>
            <button
              onClick={handleSave}
              disabled={saving || !editForm.title?.trim()}
              className="btn-primary py-2 px-4 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Title *</label>
            <input type="text" value={editForm.title || ''} onChange={(e) => updateEditField('title', e.target.value)} className="input-field text-2xl font-display italic" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Artist</label>
              <input type="text" value={editForm.artist || ''} onChange={(e) => updateEditField('artist', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Artist Dates</label>
              <input type="text" value={editForm.artist_dates || ''} onChange={(e) => updateEditField('artist_dates', e.target.value)} className="input-field" placeholder="1853-1890" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Year</label>
              <input type="text" value={editForm.year || ''} onChange={(e) => updateEditField('year', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Period</label>
              <input type="text" value={editForm.period || ''} onChange={(e) => updateEditField('period', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Style</label>
              <input type="text" value={editForm.style || ''} onChange={(e) => updateEditField('style', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Medium</label>
              <input type="text" value={editForm.medium || ''} onChange={(e) => updateEditField('medium', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Dimensions</label>
              <input type="text" value={editForm.dimensions || ''} onChange={(e) => updateEditField('dimensions', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Museum</label>
            <input type="text" value={editForm.museum || ''} onChange={(e) => updateEditField('museum', e.target.value)} className="input-field" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">City</label>
              <input type="text" value={editForm.museum_city || ''} onChange={(e) => updateEditField('museum_city', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Country</label>
              <input type="text" value={editForm.museum_country || ''} onChange={(e) => updateEditField('museum_country', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Description</label>
            <textarea value={editForm.description || ''} onChange={(e) => updateEditField('description', e.target.value)} rows={4} className="input-field resize-none" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-2">Curatorial Note</label>
            <textarea value={editForm.curatorial_note || ''} onChange={(e) => updateEditField('curatorial_note', e.target.value)} rows={3} className="input-field resize-none font-display italic" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div className="relative">
              <button onClick={() => setShowMenu(!showMenu)} className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-48 glass-dark rounded-xl overflow-hidden z-50">
                    <button onClick={() => { setIsEditing(true); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl">edit</span>Edit
                    </button>
                    <button onClick={shareArtwork} className="w-full px-4 py-3 text-left text-white hover:bg-white/10 flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl">share</span>Share
                    </button>
                    <button onClick={() => { setShowDeleteModal(true); setShowMenu(false) }} className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-3">
                      <span className="material-symbols-outlined text-xl">delete</span>Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-[70vh] bg-black cursor-pointer group" onClick={() => artwork.image_url && setShowFullImage(true)}>
        {artwork.image_url ? (
          <img src={artwork.image_url} alt={artwork.title} className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-700" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-8xl text-white/20">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />
      </div>

      {/* Title Section */}
      <section className="relative -mt-32 z-10 text-center px-4 pb-12">
        <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold italic text-white drop-shadow-lg mb-6">
          {artwork.title}
        </h1>

        {/* Artist with gold lines */}
        <div className="divider-text max-w-md mx-auto mb-8">
          <span className="font-display italic text-xl text-white/90">
            {artwork.artist || 'Unknown Artist'}
            {artwork.artist_dates && <span className="text-white/50 ml-2">({artwork.artist_dates})</span>}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={shareArtwork} className="btn-outline bg-white/10 backdrop-blur-xl text-white border-white/20 hover:border-primary hover:text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">share</span>
            Share
          </button>
          <button onClick={() => window.print()} className="btn-outline bg-white/10 backdrop-blur-xl text-white border-white/20 hover:border-primary hover:text-primary flex items-center gap-2">
            <span className="material-symbols-outlined">download</span>
            Download
          </button>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Left: Metadata */}
          <div className="space-y-8">
            {artwork.year && (
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Year</p>
                <p className="font-display text-2xl">{artwork.year}</p>
              </div>
            )}
            {artwork.medium && (
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Medium</p>
                <p className="font-display italic text-lg">{artwork.medium}</p>
              </div>
            )}
            {artwork.dimensions && (
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Dimensions</p>
                <p className="text-lg">{artwork.dimensions}</p>
              </div>
            )}
            {artwork.museum && (
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Location</p>
                <p className="text-lg">{artwork.museum}</p>
                {(artwork.museum_city || artwork.museum_country) && (
                  <p className="text-black/50 dark:text-white/50">{[artwork.museum_city, artwork.museum_country].filter(Boolean).join(', ')}</p>
                )}
              </div>
            )}
            {(artwork.period || artwork.style) && (
              <div className="flex flex-wrap gap-2">
                {artwork.period && (
                  <span className="px-3 py-1 text-xs uppercase tracking-widest border border-primary/30 text-primary">{artwork.period}</span>
                )}
                {artwork.style && (
                  <span className="px-3 py-1 text-xs uppercase tracking-widest border border-black/20 dark:border-white/20">{artwork.style}</span>
                )}
              </div>
            )}
          </div>

          {/* Right: Description */}
          <div className="md:col-span-2 space-y-8">
            {artwork.description && (
              <div>
                <p className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-4">About This Work</p>
                <p className="drop-cap text-lg leading-relaxed font-body">{artwork.description}</p>
              </div>
            )}

            {artwork.curatorial_note && (
              <div className="editorial-quote py-6">
                <p className="font-display italic text-xl leading-relaxed text-primary/90">
                  {artwork.curatorial_note}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Works */}
      {relatedArtworks.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12 border-t border-black/10 dark:border-white/10">
          <h2 className="text-xs uppercase tracking-widest text-black/40 dark:text-white/40 mb-8">
            More by {artwork.artist}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedArtworks.map(related => (
              <Link key={related.id} to={`/artwork/${related.id}`} className="group">
                <div className="aspect-[4/5] bg-black/5 dark:bg-white/5 overflow-hidden mb-2">
                  {related.image_url ? (
                    <img src={related.image_url} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl text-black/20 dark:text-white/20">image</span>
                    </div>
                  )}
                </div>
                <p className="text-sm truncate group-hover:text-primary transition-colors">{related.title}</p>
                {related.year && <p className="text-xs text-black/40 dark:text-white/40">{related.year}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-sm text-black/30 dark:text-white/30">
          Added {new Date(artwork.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </footer>

      {/* Full Image Modal */}
      {showFullImage && artwork.image_url && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center" onClick={() => setShowFullImage(false)}>
          <button onClick={() => setShowFullImage(false)} className="absolute top-4 right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
            <span className="material-symbols-outlined">close</span>
          </button>
          <img src={artwork.image_url} alt={artwork.title} className="max-w-full max-h-full object-contain" />
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-400">delete</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Delete this artwork?</h3>
              <p className="text-black/60 dark:text-white/60">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={deleting} className="btn-outline flex-1 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
