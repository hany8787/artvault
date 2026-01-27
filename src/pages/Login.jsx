import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Background artwork image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=1920&q=80')`,
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-semibold italic text-accent">ArtVault</h1>
          <p className="text-white/70 mt-2 font-serif italic">Votre collection privée</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6 border border-white/20 shadow-2xl"
        >
          <h2 className="font-display text-2xl italic text-white text-center">Connexion</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                placeholder="vous@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-white/70 text-sm mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/30 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg-dark font-semibold py-3 rounded-lg hover:bg-accent-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner w-5 h-5 border-2 border-bg-dark/30 border-t-bg-dark rounded-full animate-spin" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>

          <div className="flex items-center gap-4 my-4">
            <div className="flex-1 h-px bg-white/20" />
            <span className="text-white/40 text-sm">ou</span>
            <div className="flex-1 h-px bg-white/20" />
          </div>

          <p className="text-center text-white/70 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-accent hover:text-accent-dark transition-colors font-medium">
              Créer un compte
            </Link>
          </p>
        </form>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-8">
          En vous connectant, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  )
}
