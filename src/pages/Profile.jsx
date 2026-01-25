import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Profile() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Profil</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          Mon compte
        </h1>
      </div>

      {/* Profile Card */}
      <div className="glass rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-primary">person</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              {profile?.full_name || 'Utilisateur'}
            </h2>
            <p className="text-white/60">{user?.email}</p>
          </div>
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
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          className="w-full border border-red-500/50 text-red-400 py-3 rounded-lg hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Se déconnecter
        </button>
      </div>
    </div>
  )
}