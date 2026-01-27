import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { SkeletonCard } from '../components/ui/Loader'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'

export default function Collections() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newCollection, setNewCollection] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchCollections()
  }, [user])

  async function fetchCollections() {
    if (!user) return

    // Fetch collections with artwork count
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        artworks:artworks(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      // Get cover images from first artwork in each collection
      const collectionsWithCovers = await Promise.all(
        data.map(async (col) => {
          const { data: firstArtwork } = await supabase
            .from('artworks')
            .select('image_url')
            .eq('collection_id', col.id)
            .limit(1)
            .single()
          
          return {
            ...col,
            artwork_count: col.artworks?.[0]?.count || 0,
            cover_url: firstArtwork?.image_url || null
          }
        })
      )
      setCollections(collectionsWithCovers)
    }
    setLoading(false)
  }

  async function handleCreate() {
    if (!newCollection.name.trim()) return
    setCreating(true)

    const { data, error } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: newCollection.name.trim(),
        description: newCollection.description.trim() || null
      })
      .select()
      .single()

    if (!error && data) {
      setCollections(prev => [{ ...data, artwork_count: 0 }, ...prev])
      setShowCreateModal(false)
      setNewCollection({ name: '', description: '' })
    }
    setCreating(false)
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-7xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl md:text-4xl italic mb-2">
              Mes Collections
            </h1>
            <p className="text-secondary">
              {collections.length} collection{collections.length > 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <span className="material-symbols-outlined mr-2">add</span>
            Nouvelle
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} className="h-48" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <EmptyState
            icon="collections_bookmark"
            title="Aucune collection"
            description="Créez votre première collection pour organiser vos œuvres par thème"
            action="Créer une collection"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collection?collectionId=${collection.id}`}
                className="card group overflow-hidden"
              >
                {/* Cover */}
                <div className="aspect-[16/9] bg-secondary relative overflow-hidden">
                  {collection.cover_url ? (
                    <img
                      src={collection.cover_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-5xl text-secondary">
                        collections_bookmark
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="font-display text-xl italic text-white mb-1">
                      {collection.name}
                    </h3>
                    <p className="text-white/60 text-sm">
                      {collection.artwork_count} œuvre{collection.artwork_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {collection.description && (
                  <div className="p-4">
                    <p className="text-secondary text-sm line-clamp-2">
                      {collection.description}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouvelle collection"
      >
        <div className="space-y-4">
          <div>
            <label className="label mb-2 block">Nom *</label>
            <input
              type="text"
              value={newCollection.name}
              onChange={(e) => setNewCollection(prev => ({ ...prev, name: e.target.value }))}
              className="input"
              placeholder="Ex: Voyage à Paris, Impressionnistes..."
              autoFocus
            />
          </div>

          <div>
            <label className="label mb-2 block">Description</label>
            <textarea
              value={newCollection.description}
              onChange={(e) => setNewCollection(prev => ({ ...prev, description: e.target.value }))}
              className="input textarea"
              rows={3}
              placeholder="Décrivez votre collection..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowCreateModal(false)}
              className="btn btn-ghost flex-1"
            >
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={!newCollection.name.trim() || creating}
              className="btn btn-primary flex-1"
            >
              {creating ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
