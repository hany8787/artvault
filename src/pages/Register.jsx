import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signUp(email, password, fullName)
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-bold italic text-primary">ArtVault</h1>
          <p className="text-white/60 mt-2">Créez votre collection</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-semibold text-white mb-4">Inscription</h2>
          
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-white/60 text-sm mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
              placeholder="vous@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-white/60 text-sm mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-bg-dark font-semibold py-3 rounded-lg hover:bg-primary-hover transition-all disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-white/60 text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}