import { useState, useEffect } from 'react'
import { SkeletonCard } from '../components/ui/Loader'
import { ErrorState } from '../components/ui/EmptyState'

// Major museums with their exhibition pages
const MAJOR_MUSEUMS = [
  {
    name: 'Musée du Louvre',
    city: 'Paris',
    url: 'https://www.louvre.fr/expositions',
    image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  },
  {
    name: "Musée d'Orsay",
    city: 'Paris',
    url: 'https://www.musee-orsay.fr/fr/expositions',
    image: 'https://images.unsplash.com/photo-1591289009723-aef0a1a8a211?w=600&q=80',
  },
  {
    name: 'Centre Pompidou',
    city: 'Paris',
    url: 'https://www.centrepompidou.fr/fr/programme/agenda',
    image: 'https://images.unsplash.com/photo-1551866442-64e75e911c23?w=600&q=80',
  },
  {
    name: "Musée de l'Orangerie",
    city: 'Paris',
    url: 'https://www.musee-orangerie.fr/fr/expositions',
    image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&q=80',
  },
  {
    name: 'Grand Palais',
    city: 'Paris',
    url: 'https://www.grandpalais.fr/fr/les-expositions',
    image: 'https://images.unsplash.com/photo-1509741102003-ca64bfe5f069?w=600&q=80',
  },
  {
    name: 'Musée du quai Branly',
    city: 'Paris',
    url: 'https://www.quaibranly.fr/fr/expositions-evenements',
    image: 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=600&q=80',
  },
]

export default function News() {
  const [exhibitions, setExhibitions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchExhibitions()
  }, [])

  async function fetchExhibitions() {
    setLoading(true)
    setError(null)

    try {
      // Use our Supabase Edge Function
      const response = await fetch(
        'https://dzjgilplznhhwwitjztf.supabase.co/functions/v1/get-exhibitions?limit=100'
      )

      if (!response.ok) throw new Error('API unavailable')

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erreur inconnue')
      }

      // Filter: only current or future exhibitions
      const now = new Date()
      now.setHours(0, 0, 0, 0) // Start of today
      
      const filtered = data.data.filter(expo => {
        // If no end date, check start date
        if (!expo.date_end) {
          if (!expo.date_start) return true // No dates = keep it
          const startDate = new Date(expo.date_start)
          return startDate >= now // Future event
        }
        // Has end date: keep if end date is today or later
        const endDate = new Date(expo.date_end)
        return endDate >= now
      })

      // Sort by start date (soonest first)
      filtered.sort((a, b) => {
        const dateA = a.date_start ? new Date(a.date_start) : new Date('2099-12-31')
        const dateB = b.date_start ? new Date(b.date_start) : new Date('2099-12-31')
        return dateA - dateB
      })

      setExhibitions(filtered)
    } catch (err) {
      console.error('Error fetching exhibitions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDateRange(startDate, endDate) {
    const options = { day: 'numeric', month: 'long' }
    const yearOptions = { day: 'numeric', month: 'long', year: 'numeric' }

    if (!startDate && !endDate) return 'Dates non communiquées'

    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null

    if (start && end) {
      const startYear = start.getFullYear()
      const endYear = end.getFullYear()

      if (startYear === endYear) {
        return `Du ${start.toLocaleDateString('fr-FR', options)} au ${end.toLocaleDateString('fr-FR', yearOptions)}`
      }
      return `Du ${start.toLocaleDateString('fr-FR', yearOptions)} au ${end.toLocaleDateString('fr-FR', yearOptions)}`
    }

    if (start) return `À partir du ${start.toLocaleDateString('fr-FR', yearOptions)}`
    if (end) return `Jusqu'au ${end.toLocaleDateString('fr-FR', yearOptions)}`

    return ''
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl italic text-primary dark:text-white mb-2">
          Expositions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Découvrez les expositions en cours à Paris
        </p>
      </header>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Que Faire à Paris section */}
        <section className="mb-12">
          <h2 className="font-display text-2xl italic text-primary dark:text-white mb-2">
            Expositions à Paris
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {exhibitions.length} expositions en cours et à venir
          </p>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorState
              title="Impossible de charger les expositions"
              description={error}
              onRetry={fetchExhibitions}
            />
          ) : exhibitions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
              <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">event</span>
              <p className="text-gray-600 dark:text-gray-400">Aucune exposition trouvée</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exhibitions.map((exhibition) => (
                <a
                  key={exhibition.id}
                  href={exhibition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card group overflow-hidden"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                    {exhibition.image_url ? (
                      <img
                        src={exhibition.image_url}
                        alt={exhibition.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600">image</span>
                      </div>
                    )}
                    {/* Free badge */}
                    {exhibition.is_free && (
                      <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                        Gratuit
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    {/* Tags */}
                    {exhibition.tags && exhibition.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {exhibition.tags.slice(0, 2).map((tag, i) => (
                          <span key={i} className="text-xs text-accent font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <h3 className="font-display text-lg mb-1 line-clamp-2 text-primary dark:text-white">
                      {exhibition.title}
                    </h3>
                    <p className="text-accent text-sm mb-1">{exhibition.venue}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {formatDateRange(exhibition.date_start, exhibition.date_end)}
                    </p>
                    <div className="flex items-center gap-1 text-accent text-sm mt-3">
                      <span>En savoir plus</span>
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Major museums section */}
        <section>
          <h2 className="font-display text-2xl italic text-primary dark:text-white mb-2">
            Grands musées nationaux
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Consultez les programmes des grands musées parisiens
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MAJOR_MUSEUMS.map((museum) => (
              <a
                key={museum.name}
                href={museum.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card group overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={museum.image}
                    alt={museum.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-display text-lg mb-1 text-primary dark:text-white">{museum.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{museum.city}</p>
                  <div className="flex items-center gap-1 text-accent text-sm mt-2">
                    <span>Voir les expositions</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
