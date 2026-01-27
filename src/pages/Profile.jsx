import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'
import Input from '../components/ui/Input'
import { ConfirmDialog } from '../components/ui/Modal'
import { StatCard } from '../components/ui/Card'
import Loader from '../components/ui/Loader'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const [stats, setStats] = useState({
    total: 0,
    favorites: 0,
    periods: [],
    museums: [],
    styles: []
  })
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '' })
  const [saving, setSaving] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [showSignOutModal, setShowSignOutModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem('artvault_language') || 'fr'
  )

  const LANGUAGES = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ]

  function handleLanguageChange(langCode) {
    setSelectedLanguage(langCode)
    localStorage.setItem('artvault_language', langCode)
    setShowLanguageModal(false)
  }

  const currentLanguage = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0]

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
      .select('period, museum, style, is_favorite')
      .eq('user_id', user.id)

    if (!error && data) {
      const periods = [...new Set(data.map(a => a.period).filter(Boolean))]
      const museums = [...new Set(data.map(a => a.museum).filter(Boolean))]
      const styles = [...new Set(data.map(a => a.style).filter(Boolean))]
      const favorites = data.filter(a => a.is_favorite).length

      setStats({
        total: data.length,
        favorites,
        periods,
        museums,
        styles
      })
    }
    setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Chargement..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-4xl mx-auto">
        <p className="label mb-2">Profil</p>
        <h1 className="font-display text-3xl md:text-4xl italic">
          Mon compte
        </h1>
      </header>

      <div className="px-4 max-w-4xl mx-auto space-y-6">
        {/* Profile Card */}
        <div className="card p-6">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-3xl text-accent">person</span>
                </div>
                <div className="flex-1">
                  <Input
                    label="Nom complet"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
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
                  className="btn btn-outline flex-1"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editForm.full_name.trim()}
                  className="btn btn-primary flex-1"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl text-accent">person</span>
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-display italic">
                    {profile?.full_name || 'Utilisateur'}
                  </h2>
                  <p className="text-secondary">{user?.email}</p>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-ghost btn-icon"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-3 border-b border-primary/10">
                  <span className="text-secondary">Membre depuis</span>
                  <span>
                    {profile?.created_at
                      ? new Date(profile.created_at).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between py-3 border-b border-primary/10">
                  <span className="text-secondary">Type de compte</span>
                  <span className="chip chip-accent capitalize">{profile?.membership_type || 'free'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Collection Stats */}
        <div className="card p-6">
          <h3 className="font-display text-xl italic text-accent mb-6">
            Ma collection en chiffres
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon="collections"
              value={stats.total}
              label="Œuvres"
            />
            <StatCard
              icon="favorite"
              value={stats.favorites}
              label="Favoris"
            />
            <StatCard
              icon="history"
              value={stats.periods.length}
              label="Périodes"
            />
            <StatCard
              icon="museum"
              value={stats.museums.length}
              label="Musées"
            />
          </div>

          {/* Museums visited */}
          {stats.museums.length > 0 && (
            <div className="mb-6">
              <p className="label mb-3">Musées visités</p>
              <div className="flex flex-wrap gap-2">
                {stats.museums.slice(0, 5).map(museum => (
                  <span key={museum} className="chip">
                    {museum}
                  </span>
                ))}
                {stats.museums.length > 5 && (
                  <span className="chip chip-accent">
                    +{stats.museums.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Styles explored */}
          {stats.styles.length > 0 && (
            <div>
              <p className="label mb-3">Styles explorés</p>
              <div className="flex flex-wrap gap-2">
                {stats.styles.slice(0, 6).map(style => (
                  <span key={style} className="chip">
                    {style}
                  </span>
                ))}
                {stats.styles.length > 6 && (
                  <span className="chip chip-accent">
                    +{stats.styles.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preferences */}
        <div className="card overflow-hidden">
          <h3 className="font-display text-xl italic text-accent p-6 pb-4">
            Préférences
          </h3>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">
                {theme === 'dark' ? 'dark_mode' : 'light_mode'}
              </span>
              <span>Thème</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">
                {theme === 'dark' ? 'Sombre' : 'Clair'}
              </span>
              <span className="material-symbols-outlined text-secondary">chevron_right</span>
            </div>
          </button>

          <button
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">notifications</span>
              <span>Notifications</span>
            </div>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </button>

          <button
            onClick={() => setShowLanguageModal(true)}
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">language</span>
              <span>Langue</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-secondary text-sm">{currentLanguage.flag} {currentLanguage.name}</span>
              <span className="material-symbols-outlined text-secondary">chevron_right</span>
            </div>
          </button>

          {/* Translation notice */}
          <p className="px-6 py-3 text-sm text-white/40 italic border-t border-primary/10">
            Traductions bientôt disponibles
          </p>
        </div>

        {/* Help & Support */}
        <div className="card overflow-hidden">
          <h3 className="font-display text-xl italic text-accent p-6 pb-4">
            Aide
          </h3>

          <button
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">help</span>
              <span>Centre d'aide</span>
            </div>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </button>

          <button
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">mail</span>
              <span>Nous contacter</span>
            </div>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </button>

          <button
            className="w-full px-6 py-4 text-left hover:bg-secondary transition-colors flex items-center justify-between border-t border-primary/10"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary">info</span>
              <span>À propos</span>
            </div>
            <span className="material-symbols-outlined text-secondary">chevron_right</span>
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={() => setShowSignOutModal(true)}
            className="btn btn-outline w-full"
          >
            <span className="material-symbols-outlined">logout</span>
            Se déconnecter
          </button>

          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full text-red-500/60 text-sm py-2 hover:text-red-500 transition-colors"
          >
            Supprimer mon compte
          </button>
        </div>

        {/* App Version */}
        <p className="text-center text-secondary text-xs pt-4">
          ArtVault v1.0.0
        </p>
      </div>

      {/* Sign Out Confirmation */}
      <ConfirmDialog
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        title="Se déconnecter ?"
        message="Vous devrez vous reconnecter pour accéder à votre collection."
        confirmText="Se déconnecter"
        cancelText="Annuler"
      />

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteAccountModal}
        onClose={() => setShowDeleteAccountModal(false)}
        onConfirm={() => {
          alert('Contactez support@artvault.com pour supprimer votre compte')
          setShowDeleteAccountModal(false)
        }}
        title="Supprimer votre compte ?"
        message="Cette action est irréversible. Toutes vos données, y compris votre collection complète, seront définitivement supprimées."
        confirmText="Supprimer"
        cancelText="Annuler"
        danger
      />

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowLanguageModal(false)}>
          <div className="bg-bg-light dark:bg-bg-dark rounded-xl shadow-xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-primary/10">
              <h3 className="font-display text-xl italic text-center">Choisir la langue</h3>
            </div>
            <div className="p-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full px-4 py-3 text-left rounded-lg flex items-center justify-between transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-accent/10 text-accent'
                      : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </div>
                  {selectedLanguage === lang.code && (
                    <span className="material-symbols-outlined text-accent">check</span>
                  )}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-primary/10">
              <button
                onClick={() => setShowLanguageModal(false)}
                className="btn btn-outline w-full"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
