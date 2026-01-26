import { useState, useEffect } from 'react'
import { ExhibitionCard } from '../components/ui/Card'
import { SkeletonCard } from '../components/ui/Loader'
import { ErrorState } from '../components/ui/EmptyState'

// Major museums with their exhibition pages
const MAJOR_MUSEUMS = [
  {
    name: 'Musée du Louvre',
    city: 'Paris',
    url: 'https://www.louvre.fr/expositions',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Louvre_Museum_Wikimedia_Commons.jpg/1280px-Louvre_Museum_Wikimedia_Commons.jpg',
  },
  {
    name: "Musée d'Orsay",
    city: 'Paris',
    url: 'https://www.musee-orsay.fr/fr/expositions',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Mus%C3%A9e_d%27Orsay%2C_Paris_7e%2C_Left_Bank.jpg/1280px-Mus%C3%A9e_d%27Orsay%2C_Paris_7e%2C_Left_Bank.jpg',
  },
  {
    name: 'Centre Pompidou',
    city: 'Paris',
    url: 'https://www.centrepompidou.fr/fr/programme/agenda',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Centre_Georges-Pompidou_October_21%2C_2011.jpg/1280px-Centre_Georges-Pompidou_October_21%2C_2011.jpg',
  },
  {
    name: "Musée de l'Orangerie",
    city: 'Paris',
    url: 'https://www.musee-orangerie.fr/fr/expositions',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Paris_Mus%C3%A9e_de_l%27Orangerie_Nymph%C3%A9as_ovale_1.jpg/1280px-Paris_Mus%C3%A9e_de_l%27Orangerie_Nymph%C3%A9as_ovale_1.jpg',
  },
  {
    name: 'Grand Palais',
    city: 'Paris',
    url: 'https://www.grandpalais.fr/fr/les-expositions',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/France_Paris_Grand_Palais_01.jpg/1280px-France_Paris_Grand_Palais_01.jpg',
  },
  {
    name: 'Musée Rodin',
    city: 'Paris',
    url: 'https://www.musee-rodin.fr/fr/expositions',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/The_Thinker%2C_Auguste_Rodin.jpg/800px-The_Thinker%2C_Auguste_Rodin.jpg',
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
    try {
      // Try to fetch from Paris Musées API
      const response = await fetch(
        'https://opendata.paris.fr/api/records/1.0/search/?dataset=expositions-des-musees-de-la-ville-de-paris&rows=20&sort=-date_debut'
      )

      if (!response.ok) throw new Error('API unavailable')

      const data = await response.json()

      // Filter current and upcoming exhibitions
      const now = new Date()
      const filtered = data.records
        .filter(record => {
          const endDate = new Date(record.fields.date_fin)
          return endDate >= now
        })
        .map(record => ({
          id: record.recordid,
          title: record.fields.titre,
          museum: record.fields.nom_du_musee,
          start_date: formatDate(record.fields.date_debut),
          end_date: formatDate(record.fields.date_fin),
          description: record.fields.description,
          url: record.fields.url,
          image_url: record.fields.image?.url,
        }))

      setExhibitions(filtered)
    } catch (err) {
      console.error('Error fetching exhibitions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 py-8 md:py-12 max-w-6xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl italic mb-2">
          Expositions
        </h1>
        <p className="text-secondary">
          Découvrez les expositions en cours
        </p>
      </header>

      <div className="px-4 max-w-6xl mx-auto">
        {/* Paris Musées section */}
        <section className="mb-12">
          <h2 className="font-display text-2xl italic mb-2">
            Musées de la Ville de Paris
          </h2>
          <p className="text-secondary mb-6">
            Expositions en cours et à venir
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
              description="L'API Paris Musées n'est pas disponible"
              onRetry={fetchExhibitions}
            />
          ) : exhibitions.length === 0 ? (
            <div className="text-center py-12 bg-secondary rounded-xl">
              <p className="text-secondary">Aucune exposition en cours</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exhibitions.map((exhibition) => (
                <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
              ))}
            </div>
          )}
        </section>

        {/* Major museums section */}
        <section>
          <h2 className="font-display text-2xl italic mb-2">
            Grands musées
          </h2>
          <p className="text-secondary mb-6">
            Consultez les programmes des grands musées
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
                <div className="aspect-[16/9] overflow-hidden bg-secondary">
                  <img
                    src={museum.image}
                    alt={museum.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-display text-lg mb-1">{museum.name}</h3>
                  <p className="text-secondary text-sm">{museum.city}</p>
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
