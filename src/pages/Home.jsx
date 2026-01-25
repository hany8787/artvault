import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { profile } = useAuth()

  return (
    <div className="p-4 md:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Bienvenue</p>
        <h1 className="font-display text-3xl font-bold italic text-white">
          {profile?.full_name || 'Collectionneur'}
        </h1>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          to="/scan"
          className="glass rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
        >
          <span className="material-symbols-outlined text-4xl text-primary mb-2">photo_camera</span>
          <span className="text-white font-medium">Scanner une œuvre</span>
          <span className="text-white/40 text-sm">Identifier et ajouter</span>
        </Link>

        <Link
          to="/collection"
          className="glass rounded-xl p-6 flex flex-col items-center text-center hover:border-primary/50 transition-colors"
        >
          <span className="material-symbols-outlined text-4xl text-primary mb-2">collections</span>
          <span className="text-white font-medium">Ma collection</span>
          <span className="text-white/40 text-sm">Voir mes œuvres</span>
        </Link>
      </div>

      {/* Info Card */}
      <div className="glass rounded-xl p-6">
        <h2 className="font-display text-xl font-bold italic text-primary mb-4">
          Comment ça marche ?
        </h2>
        <ol className="space-y-3 text-white/80">
          <li className="flex gap-3">
            <span className="text-primary font-bold">1.</span>
            <span>Photographiez une œuvre dans un musée</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">2.</span>
            <span>L'IA identifie l'œuvre et l'artiste</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">3.</span>
            <span>Ajoutez-la à votre collection privée</span>
          </li>
          <li className="flex gap-3">
            <span className="text-primary font-bold">4.</span>
            <span>Retrouvez vos découvertes à tout moment</span>
          </li>
        </ol>
      </div>
    </div>
  )
}