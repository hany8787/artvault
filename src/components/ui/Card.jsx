import { Link } from 'react-router-dom'

/**
 * Artwork Card Component
 * For displaying artworks in grids
 */
export function ArtworkCard({ artwork, showOverlay = true }) {
  return (
    <Link
      to={`/artwork/${artwork.id}`}
      className="artwork-card block group"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-secondary">
        {artwork.image_url ? (
          <img
            src={artwork.image_url}
            alt={artwork.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-secondary">image</span>
          </div>
        )}

        {/* Hover overlay */}
        {showOverlay && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-white">visibility</span>
          </div>
        )}

        {/* Favorite badge */}
        {artwork.is_favorite && (
          <div className="absolute top-2 right-2">
            <span className="material-symbols-outlined filled text-accent">favorite</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="mt-3">
        <h3 className="font-display italic text-base truncate">
          {artwork.title}
        </h3>
        {artwork.artist && (
          <p className="text-secondary text-sm truncate">
            {artwork.artist}
          </p>
        )}
        {artwork.year && (
          <p className="text-secondary text-xs mt-1">
            {artwork.year}
          </p>
        )}
      </div>
    </Link>
  )
}

/**
 * Museum Card Component
 */
export function MuseumCard({ museum, distance }) {
  return (
    <Link
      to={`/museum/${museum.id}`}
      className="card flex gap-4 p-4"
    >
      {/* Image */}
      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
        {museum.image_url ? (
          <img
            src={museum.image_url}
            alt={museum.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl text-secondary">museum</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-lg truncate">{museum.name}</h3>
        <p className="text-secondary text-sm truncate">
          {museum.city}{museum.country ? `, ${museum.country}` : ''}
        </p>
        {distance && (
          <p className="text-accent text-sm mt-1">{distance}</p>
        )}
      </div>

      {/* Chevron */}
      <span className="material-symbols-outlined text-secondary self-center">
        chevron_right
      </span>
    </Link>
  )
}

/**
 * Exhibition Card Component
 */
export function ExhibitionCard({ exhibition }) {
  return (
    <a
      href={exhibition.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card block overflow-hidden group"
    >
      {/* Image */}
      <div className="aspect-[16/9] overflow-hidden bg-secondary">
        {exhibition.image_url ? (
          <img
            src={exhibition.image_url}
            alt={exhibition.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-secondary">calendar_month</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="label text-accent mb-2">{exhibition.museum}</p>
        <h3 className="font-display text-lg mb-2">{exhibition.title}</h3>
        <p className="text-secondary text-sm">
          {exhibition.start_date} - {exhibition.end_date}
        </p>
      </div>
    </a>
  )
}

/**
 * Stat Card Component
 */
export function StatCard({ icon, label, value }) {
  return (
    <div className="bg-secondary rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-accent">{icon}</span>
        <span className="label text-secondary">{label}</span>
      </div>
      <p className="font-display text-3xl">{value}</p>
    </div>
  )
}
