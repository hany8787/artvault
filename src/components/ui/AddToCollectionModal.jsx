import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import Modal from './Modal'

/**
 * Modal pour ajouter une œuvre à une collection
 */
export default function AddToCollectionModal({ 
  isOpen, 
  onClose, 
  artworkId,
  currentCollectionId,
  onSuccess 
}) {
  const { user } = useAuth()
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(currentCollectionId || null)
  const [saving, setSaving] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchCollections()
      setSelectedId(currentCollectionId || null)
    }
  }, [isOpen, currentCollectionId])

  async function fetchCollections() {
    setLoading(true)
    const { data } = await supabase
      .from('collections')
      .select('id, name')
      .eq('user_id', user.id)
      .order('name')

    setCollections(data || [])
    setLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { error } = await supabase
      .from('artworks')
      .update({ collection_id: selectedId })
      .eq('id', artworkId)

    if (!error) {
      onSuccess?.(selectedId)
      onClose()
    }
    setSaving(false)
  }

  async function handleCreateAndAdd() {
    if (!newName.trim()) return
    setSaving(true)

    // Create collection
    const { data: newCol, error: createError } = await supabase
      .from('collections')
      .insert({
        user_id: user.id,
        name: newName.trim()
      })
      .select()
      .single()

    if (createError || !newCol) {
      setSaving(false)
      return
    }

    // Add artwork to new collection
    const { error: updateError } = await supabase
      .from('artworks')
      .update({ collection_id: newCol.id })
      .eq('id', artworkId)

    if (!updateError) {
      onSuccess?.(newCol.id)
      onClose()
    }
    setSaving(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajouter à une collection">
      {loading ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      ) : showCreate ? (
        <div className="space-y-4">
          <div>
            <label className="label mb-2 block">Nom de la collection</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              placeholder="Ex: Voyage à Paris..."
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setShowCreate(false); setNewName('') }}
              className="btn btn-ghost flex-1"
            >
              Retour
            </button>
            <button
              onClick={handleCreateAndAdd}
              disabled={!newName.trim() || saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Création...' : 'Créer et ajouter'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Collections list */}
          <div className="max-h-64 overflow-y-auto space-y-2">
            {/* No collection option */}
            <button
              onClick={() => setSelectedId(null)}
              className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                selectedId === null
                  ? 'bg-accent/20 border border-accent'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
              }`}
            >
              <span className="material-symbols-outlined text-secondary">
                folder_off
              </span>
              <span className={selectedId === null ? 'text-accent' : ''}>
                Aucune collection
              </span>
            </button>

            {collections.map((col) => (
              <button
                key={col.id}
                onClick={() => setSelectedId(col.id)}
                className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
                  selectedId === col.id
                    ? 'bg-accent/20 border border-accent'
                    : 'bg-white/5 hover:bg-white/10 border border-transparent'
                }`}
              >
                <span className="material-symbols-outlined text-secondary">
                  folder
                </span>
                <span className={selectedId === col.id ? 'text-accent' : ''}>
                  {col.name}
                </span>
                {selectedId === col.id && (
                  <span className="material-symbols-outlined ml-auto text-accent">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Create new */}
          <button
            onClick={() => setShowCreate(true)}
            className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 text-accent"
          >
            <span className="material-symbols-outlined">add</span>
            Créer une nouvelle collection
          </button>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn btn-ghost flex-1">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary flex-1"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
