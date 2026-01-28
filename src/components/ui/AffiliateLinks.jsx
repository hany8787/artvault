import { generateAffiliateLinks, isAffiliateConfigured } from '../../utils/affiliate'

/**
 * Composant d'affichage des liens affiliés Amazon
 * Affiche 1 à 3 liens contextuels basés sur l'œuvre
 */
export function AffiliateLinks({ artwork, className = '' }) {
  // Ne rien afficher si pas d'artwork ou tag non configuré
  if (!artwork || !isAffiliateConfigured()) {
    return null
  }
  
  const links = generateAffiliateLinks(artwork)
  
  if (links.length === 0) {
    return null
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-xs uppercase tracking-wider text-white/40 mb-3">
        Pour aller plus loin
      </h3>
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 
                       rounded-lg hover:bg-white/10 hover:border-accent/30 transition-all group"
            onClick={() => {
              // Tracking optionnel
              console.log('[Affiliate] Click:', link.id, artwork.title)
            }}
          >
            <span className="material-symbols-outlined text-accent/70 group-hover:text-accent transition-colors">
              {link.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {link.label}
              </p>
              <p className="text-xs text-white/50">
                {link.sublabel}
              </p>
            </div>
            <span className="material-symbols-outlined text-white/30 group-hover:text-accent 
                           transition-colors text-lg">
              arrow_outward
            </span>
          </a>
        ))}
      </div>
      <p className="text-[10px] text-white/30 text-center mt-2">
        Liens affiliés Amazon
      </p>
    </div>
  )
}

/**
 * Version compacte pour les cards (un seul lien)
 */
export function AffiliateButton({ artwork, className = '' }) {
  if (!artwork?.artist || !isAffiliateConfigured()) {
    return null
  }
  
  const links = generateAffiliateLinks(artwork)
  const primaryLink = links[0]
  
  if (!primaryLink) {
    return null
  }
  
  return (
    <a
      href={primaryLink.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs 
                 bg-white/5 border border-white/10 rounded-full 
                 hover:bg-accent/10 hover:border-accent/30 transition-all ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="material-symbols-outlined text-sm text-accent">
        menu_book
      </span>
      <span className="text-white/70">Livres</span>
    </a>
  )
}

export default AffiliateLinks
