/**
 * ArtVault - Système d'affiliation Amazon
 * 
 * Génère des liens de recherche Amazon avec tag affilié
 * Commission : ~5% sur les livres d'art
 */

// TODO: Remplacer par ton vrai tag Amazon Partenaires
const AMAZON_AFFILIATE_TAG = 'artvault-21';

// Configuration par pays (extensible)
const AMAZON_DOMAINS = {
  FR: 'amazon.fr',
  DE: 'amazon.de',
  UK: 'amazon.co.uk',
  US: 'amazon.com',
  ES: 'amazon.es',
  IT: 'amazon.it',
};

/**
 * Génère un lien de recherche Amazon pour une œuvre
 * @param {Object} artwork - L'œuvre avec ses métadonnées
 * @param {string} country - Code pays (FR par défaut)
 * @returns {string} URL de recherche Amazon avec tag affilié
 */
export function generateAmazonSearchLink(artwork, country = 'FR') {
  const domain = AMAZON_DOMAINS[country] || AMAZON_DOMAINS.FR;
  const baseUrl = `https://www.${domain}/s`;
  
  // Construction des termes de recherche
  let searchTerms = [];
  
  if (artwork.artist) {
    // Priorité 1: Artiste + "livre art"
    searchTerms = [artwork.artist, 'livre', 'art'];
  } else if (artwork.period) {
    // Priorité 2: Période/mouvement
    searchTerms = [artwork.period, 'peinture', 'livre'];
  } else if (artwork.title) {
    // Priorité 3: Titre de l'œuvre
    searchTerms = [artwork.title, 'art'];
  } else {
    // Fallback générique
    searchTerms = ['histoire', 'art', 'livre'];
  }
  
  const query = encodeURIComponent(searchTerms.join(' '));
  
  return `${baseUrl}?k=${query}&tag=${AMAZON_AFFILIATE_TAG}`;
}

/**
 * Génère plusieurs liens affiliés contextuels pour une œuvre
 * @param {Object} artwork - L'œuvre avec ses métadonnées
 * @returns {Array} Liste de liens avec labels et icônes
 */
export function generateAffiliateLinks(artwork) {
  const tag = AMAZON_AFFILIATE_TAG;
  const links = [];
  
  // Lien artiste (prioritaire si disponible)
  if (artwork.artist) {
    links.push({
      id: 'artist',
      label: `Livres sur ${artwork.artist}`,
      sublabel: 'Voir sur Amazon',
      url: `https://www.amazon.fr/s?k=${encodeURIComponent(artwork.artist + ' art livre')}&tag=${tag}`,
      icon: 'menu_book',
      priority: 1,
    });
  }
  
  // Lien mouvement/période
  if (artwork.period) {
    links.push({
      id: 'period',
      label: `Découvrir ${artwork.period}`,
      sublabel: 'Livres sur ce mouvement',
      url: `https://www.amazon.fr/s?k=${encodeURIComponent(artwork.period + ' peinture art')}&tag=${tag}`,
      icon: 'palette',
      priority: 2,
    });
  }
  
  // Lien musée (catalogues)
  if (artwork.museum) {
    links.push({
      id: 'museum',
      label: `Catalogues ${artwork.museum}`,
      sublabel: 'Publications du musée',
      url: `https://www.amazon.fr/s?k=${encodeURIComponent(artwork.museum + ' catalogue exposition')}&tag=${tag}`,
      icon: 'museum',
      priority: 3,
    });
  }
  
  // Lien style si différent de période
  if (artwork.style && artwork.style !== artwork.period) {
    links.push({
      id: 'style',
      label: `Art ${artwork.style}`,
      sublabel: 'Explorer ce style',
      url: `https://www.amazon.fr/s?k=${encodeURIComponent(artwork.style + ' art livre')}&tag=${tag}`,
      icon: 'brush',
      priority: 4,
    });
  }
  
  // Trier par priorité et limiter à 3
  return links.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

/**
 * Génère un lien vers un livre spécifique par ASIN
 * @param {string} asin - Code ASIN Amazon du produit
 * @param {string} country - Code pays
 * @returns {string} URL directe vers le produit
 */
export function generateAmazonProductLink(asin, country = 'FR') {
  const domain = AMAZON_DOMAINS[country] || AMAZON_DOMAINS.FR;
  return `https://www.${domain}/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;
}

/**
 * Vérifie si le tag affilié est configuré
 * @returns {boolean}
 */
export function isAffiliateConfigured() {
  return AMAZON_AFFILIATE_TAG !== 'VOTRE_TAG_ICI' && AMAZON_AFFILIATE_TAG.length > 0;
}

export default {
  generateAmazonSearchLink,
  generateAffiliateLinks,
  generateAmazonProductLink,
  isAffiliateConfigured,
  AMAZON_AFFILIATE_TAG,
};
