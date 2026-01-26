import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState({ total: 0, periods: [], museums: [] })
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '' })
  const [saving, setSaving] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)

  useEffect(() => {
    if (profile) {
      setEditForm({ full_name: profile.full_name || '' })
    }
    fetchStats()
  }, [profile, user])

  async function fetchStats() {
    if (!user) return

    const { data, error } = await supabase
      .from('artworks')
      .select('period, museum')
      .eq('user_id', user.id)

    if (!error && data) {
      const periods = [...new Set(data.map(a => a.period).filter(Boolean))]
      const museums = [...new Set(data.map(a => a.museum).filter(Boolean))]
      setStats({
        total: data.length,
        periods,
        museums
      })
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  async function handleSaveProfile() {
    if (!editForm.full_name.trim()) return

    setSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editForm.full_name.trim() })
        .eq('id', user.id)

      if (error) throw error

      setIsEditing(false)
      window.location.reload()
    } catch (err) {
      console.error('Save error:', err)
    }

    setSaving(false)
  }

  return (
    <div className="p-4 md:p-8 pb-24">
      <div className="mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Profil</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          Mon compte
        </h1>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-xl p-6 mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">person</span>
              </div>
              <div className="flex-1">
                <label className="block text-white/60 text-sm mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-2 text-white focus:border-primary focus:outline-none"
                  placeholder="Votre nom"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditForm({ full_name: profile?.full_name || '' })
                  setIsEditing(false)
                }}
                className="flex-1 border border-white/20 text-white py-2 rounded-lg hover:border-white/40 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !editForm.full_name.trim()}
                className="flex-1 bg-primary text-bg-dark font-semibold py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-primary">person</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-white">
                  {profile?.full_name || 'Utilisateur'}
                </h2>
                <p className="text-white/60">{user?.email}</p>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Membre depuis</span>
                <span className="text-white">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                    : '-'
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-white/60">Type de compte</span>
                <span className="text-primary capitalize">{profile?.membership_type || 'free'}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Collection Stats */}
      <div className="glass rounded-xl p-6 mb-6">
        <h3 className="font-display text-lg font-bold italic text-primary mb-4">
          Ma collection en chiffres
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="font-display text-3xl font-bold italic text-white">{stats.total}</p>
            <p className="text-white/60 text-sm">Œuvres</p>
          </div>
          <div className="text-center">
            <p className="font-display text-3xl font-bold italic text-white">{stats.periods.length}</p>
            <p className="text-white/60 text-sm">Périodes</p>
          </div>
          <div className="text-center">
            <p className="font-display text-3xl font-bold italic text-white">{stats.museums.length}</p>
            <p className="text-white/60 text-sm">Musées</p>
          </div>
        </div>

        {stats.museums.length > 0 && (
          <div>
            <p className="text-white/40 text-xs uppercase tracking-widest mb-2">Musées visités</p>
            <div className="flex flex-wrap gap-2">
              {stats.museums.slice(0, 5).map(museum => (
                <span
                  key={museum}
                  className="px-3 py-1 text-xs bg-white/10 rounded-full text-white/70"
                >
                  {museum}
                </span>
              ))}
              {stats.museums.length > 5 && (
                <span className="px-3 py-1 text-xs bg-primary/20 rounded-full text-primary">
                  +{stats.museums.length - 5}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="glass rounded-xl overflow-hidden mb-6">
        <h3 className="font-display text-lg font-bold italic text-primary p-6 pb-4">
          Paramètres
        </h3>

        <button
          className="w-full px-6 py-4 text-left text-white hover:bg-white/5 flex items-center justify-between border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/60">notifications</span>
            <span>Notifications</span>
          </div>
          <span className="material-symbols-outlined text-white/40">chevron_right</span>
        </button>

        <button
          className="w-full px-6 py-4 text-left text-white hover:bg-white/5 flex items-center justify-between border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/60">language</span>
            <span>Langue</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/60 text-sm">Français</span>
            <span className="material-symbols-outlined text-white/40">chevron_right</span>
          </div>
        </button>

        <button
          className="w-full px-6 py-4 text-left text-white hover:bg-white/5 flex items-center justify-between border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/60">help</span>
            <span>Aide & Support</span>
          </div>
          <span className="material-symbols-outlined text-white/40">chevron_right</span>
        </button>

        <button
          className="w-full px-6 py-4 text-left text-white hover:bg-white/5 flex items-center justify-between border-t border-white/10"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-white/60">info</span>
            <span>À propos</span>
          </div>
          <span className="material-symbols-outlined text-white/40">chevron_right</span>
        </button>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full border border-white/20 text-white py-3 rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Se déconnecter
        </button>

        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className="w-full text-red-400/60 text-sm py-2 hover:text-red-400 transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* App Version */}
      <p className="text-center text-white/30 text-xs mt-8">
        ArtVault v0.1.0
      </p>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="glass rounded-xl p-6 max-w-sm w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-red-400">warning</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Supprimer votre compte ?</h3>
              <p className="text-white/60 text-sm">
                Cette action est irréversible. Toutes vos données, y compris votre collection complète, seront définitivement supprimées.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 border border-white/20 text-white py-3 rounded-lg hover:border-white/40 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  alert('Contactez support@artvault.com pour supprimer votre compte')
                  setShowDeleteAccountModal(false)
                }}
                className="flex-1 bg-red-500 text-white font-semibold py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
