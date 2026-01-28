/**
 * ArtVault - Catégories de filtres hiérarchiques
 * 30+ catégories organisées pour une UX style Whart
 */

// ===========================================
// FORMES D'ART (Types d'œuvres)
// ===========================================
export const ART_FORMS = {
  id: 'art_forms',
  label: 'Formes d\'art',
  icon: 'palette',
  options: [
    { value: 'painting', label: 'Peinture' },
    { value: 'sculpture', label: 'Sculpture' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'photography', label: 'Photographie' },
    { value: 'engraving', label: 'Gravure' },
    { value: 'drawing', label: 'Dessin' },
    { value: 'decorative_arts', label: 'Arts décoratifs' },
    { value: 'digital_art', label: 'Arts numériques' },
    { value: 'performance', label: 'Performance' },
    { value: 'installation', label: 'Installation' },
    { value: 'video', label: 'Vidéo' },
    { value: 'textile', label: 'Textile' },
    { value: 'ceramic', label: 'Céramique' },
    { value: 'glasswork', label: 'Verrerie' },
    { value: 'goldsmith', label: 'Orfèvrerie' },
    { value: 'furniture', label: 'Mobilier' },
    { value: 'tapestry', label: 'Tapisserie' },
    { value: 'mosaic', label: 'Mosaïque' },
    { value: 'fresco', label: 'Fresque' },
    { value: 'watercolor', label: 'Aquarelle' },
    { value: 'pastel', label: 'Pastel' },
    { value: 'collage', label: 'Collage' },
    { value: 'assemblage', label: 'Assemblage' },
    { value: 'land_art', label: 'Land Art' },
    { value: 'street_art', label: 'Street Art' },
    { value: 'conceptual', label: 'Art conceptuel' },
    { value: 'minimal', label: 'Art minimal' },
    { value: 'kinetic', label: 'Art cinétique' },
    { value: 'mixed_media', label: 'Mixed media' },
  ]
};

// ===========================================
// PÉRIODES (Hiérarchique avec sous-catégories)
// ===========================================
export const PERIODS = {
  id: 'periods',
  label: 'Périodes',
  icon: 'history',
  options: [
    {
      value: 'prehistory',
      label: 'Préhistoire',
      subcategories: []
    },
    {
      value: 'antiquity',
      label: 'Antiquité',
      subcategories: [
        { value: 'egyptian', label: 'Art égyptien' },
        { value: 'greek', label: 'Art grec' },
        { value: 'roman', label: 'Art romain' },
        { value: 'mesopotamian', label: 'Art mésopotamien' },
        { value: 'etruscan', label: 'Art étrusque' },
      ]
    },
    {
      value: 'middle_ages',
      label: 'Moyen Âge',
      subcategories: [
        { value: 'byzantine', label: 'Art byzantin' },
        { value: 'romanesque', label: 'Art roman' },
        { value: 'gothic', label: 'Art gothique' },
        { value: 'carolingian', label: 'Art carolingien' },
      ]
    },
    {
      value: 'renaissance',
      label: 'Renaissance',
      subcategories: [
        { value: 'early_renaissance', label: 'Primitifs italiens' },
        { value: 'quattrocento', label: 'Quattrocento' },
        { value: 'high_renaissance', label: 'Haute Renaissance' },
        { value: 'mannerism', label: 'Maniérisme' },
        { value: 'northern_renaissance', label: 'Renaissance nordique' },
      ]
    },
    {
      value: 'baroque_classical',
      label: 'Baroque & Classicisme',
      subcategories: [
        { value: 'caravaggism', label: 'Caravagisme' },
        { value: 'flemish_baroque', label: 'Baroque flamand' },
        { value: 'french_classicism', label: 'Classicisme français' },
        { value: 'dutch_golden_age', label: 'Siècle d\'or néerlandais' },
      ]
    },
    {
      value: 'eighteenth',
      label: 'XVIIIe siècle',
      subcategories: [
        { value: 'rococo', label: 'Rococo' },
        { value: 'neoclassicism', label: 'Néoclassicisme' },
        { value: 'vedutism', label: 'Védutisme' },
      ]
    },
    {
      value: 'nineteenth',
      label: 'XIXe siècle',
      subcategories: [
        { value: 'romanticism', label: 'Romantisme' },
        { value: 'realism', label: 'Réalisme' },
        { value: 'impressionism', label: 'Impressionnisme' },
        { value: 'post_impressionism', label: 'Post-impressionnisme' },
        { value: 'symbolism', label: 'Symbolisme' },
        { value: 'art_nouveau', label: 'Art nouveau' },
        { value: 'pre_raphaelites', label: 'Préraphaélites' },
        { value: 'barbizon_school', label: 'École de Barbizon' },
        { value: 'naturalism', label: 'Naturalisme' },
        { value: 'orientalism', label: 'Orientalisme' },
      ]
    },
    {
      value: 'twentieth',
      label: 'XXe siècle',
      subcategories: [
        { value: 'fauvism', label: 'Fauvisme' },
        { value: 'cubism', label: 'Cubisme' },
        { value: 'expressionism', label: 'Expressionnisme' },
        { value: 'dadaism', label: 'Dadaïsme' },
        { value: 'surrealism', label: 'Surréalisme' },
        { value: 'abstract_art', label: 'Art abstrait' },
        { value: 'pop_art', label: 'Pop Art' },
        { value: 'art_brut', label: 'Art brut' },
        { value: 'minimalism', label: 'Minimalisme' },
        { value: 'arte_povera', label: 'Arte Povera' },
        { value: 'abstract_expressionism', label: 'Expressionnisme abstrait' },
        { value: 'bauhaus', label: 'Bauhaus' },
        { value: 'art_deco', label: 'Art déco' },
      ]
    },
    {
      value: 'twenty_first',
      label: 'XXIe siècle',
      subcategories: [
        { value: 'contemporary', label: 'Art contemporain' },
        { value: 'digital_art_movement', label: 'Art numérique' },
        { value: 'nft_art', label: 'NFT Art' },
        { value: 'new_media', label: 'New Media Art' },
      ]
    },
  ]
};

// ===========================================
// AIRES CULTURELLES (Géographique)
// ===========================================
export const CULTURAL_AREAS = {
  id: 'cultural_areas',
  label: 'Aires culturelles',
  icon: 'public',
  options: [
    { value: 'western_europe', label: 'Europe occidentale' },
    { value: 'eastern_europe', label: 'Europe de l\'Est' },
    { value: 'chinese', label: 'Art chinois' },
    { value: 'japanese', label: 'Art japonais' },
    { value: 'indian', label: 'Art indien' },
    { value: 'southeast_asian', label: 'Asie du Sud-Est' },
    { value: 'african', label: 'Art africain' },
    { value: 'oceanian', label: 'Art d\'Océanie' },
    { value: 'precolumbian', label: 'Amériques précolombiennes' },
    { value: 'north_american', label: 'Amérique du Nord' },
    { value: 'latin_american', label: 'Amérique latine' },
    { value: 'islamic', label: 'Art islamique' },
    { value: 'middle_eastern', label: 'Proche et Moyen-Orient' },
  ]
};

// ===========================================
// GENRES (Thèmes / Sujets)
// ===========================================
export const GENRES = {
  id: 'genres',
  label: 'Genres',
  icon: 'category',
  options: [
    { value: 'portrait', label: 'Portrait' },
    { value: 'landscape', label: 'Paysage' },
    { value: 'still_life', label: 'Nature morte' },
    { value: 'history_painting', label: 'Peinture d\'histoire' },
    { value: 'religious', label: 'Art religieux' },
    { value: 'mythological', label: 'Mythologie' },
    { value: 'genre_scene', label: 'Scène de genre' },
    { value: 'nude', label: 'Nu' },
    { value: 'marine', label: 'Marine' },
    { value: 'animal', label: 'Animalier' },
    { value: 'abstract', label: 'Abstrait' },
    { value: 'self_portrait', label: 'Autoportrait' },
    { value: 'cityscape', label: 'Vue urbaine' },
    { value: 'interior', label: 'Intérieur' },
    { value: 'allegory', label: 'Allégorie' },
  ]
};

// ===========================================
// TECHNIQUES / SUPPORTS
// ===========================================
export const TECHNIQUES = {
  id: 'techniques',
  label: 'Techniques',
  icon: 'brush',
  options: [
    { value: 'oil_canvas', label: 'Huile sur toile' },
    { value: 'oil_panel', label: 'Huile sur bois' },
    { value: 'tempera', label: 'Tempera' },
    { value: 'acrylic', label: 'Acrylique' },
    { value: 'watercolor_tech', label: 'Aquarelle' },
    { value: 'gouache', label: 'Gouache' },
    { value: 'pastel_tech', label: 'Pastel' },
    { value: 'pencil', label: 'Crayon' },
    { value: 'charcoal', label: 'Fusain' },
    { value: 'ink', label: 'Encre' },
    { value: 'etching', label: 'Eau-forte' },
    { value: 'lithography', label: 'Lithographie' },
    { value: 'woodcut', label: 'Gravure sur bois' },
    { value: 'bronze', label: 'Bronze' },
    { value: 'marble', label: 'Marbre' },
    { value: 'terracotta', label: 'Terre cuite' },
    { value: 'mixed', label: 'Technique mixte' },
  ]
};

// ===========================================
// EXPORT GLOBAL
// ===========================================
export const ALL_FILTER_CATEGORIES = [
  PERIODS,
  ART_FORMS,
  GENRES,
  TECHNIQUES,
  CULTURAL_AREAS,
];

// Fonction utilitaire pour récupérer toutes les valeurs d'une catégorie (y compris sous-catégories)
export function getAllValuesFromCategory(category) {
  const values = [];
  
  category.options.forEach(option => {
    values.push(option.value);
    if (option.subcategories) {
      option.subcategories.forEach(sub => {
        values.push(sub.value);
      });
    }
  });
  
  return values;
}

// Fonction pour trouver le label d'une valeur
export function getLabelForValue(value) {
  for (const category of ALL_FILTER_CATEGORIES) {
    for (const option of category.options) {
      if (option.value === value) return option.label;
      if (option.subcategories) {
        for (const sub of option.subcategories) {
          if (sub.value === value) return sub.label;
        }
      }
    }
  }
  return value;
}

// Fonction pour matcher une œuvre avec les filtres
export function matchesFilter(artwork, filterCategory, selectedValues) {
  if (!selectedValues || selectedValues.length === 0) return true;
  
  // Champs à vérifier selon la catégorie
  const fieldsToCheck = {
    periods: ['period', 'style'],
    art_forms: ['type', 'medium'],
    genres: ['genre', 'type'],
    techniques: ['medium', 'type'],
    cultural_areas: ['museum_country', 'period'],
  };
  
  const fields = fieldsToCheck[filterCategory] || [];
  
  return selectedValues.some(filterValue => {
    return fields.some(field => {
      const artworkValue = (artwork[field] || '').toLowerCase();
      const filterLower = filterValue.toLowerCase();
      
      // Matching flexible
      return artworkValue.includes(filterLower) ||
             filterLower.includes(artworkValue) ||
             normalizeForMatch(artworkValue).includes(normalizeForMatch(filterLower));
    });
  });
}

// Normalise les chaînes pour le matching
function normalizeForMatch(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime accents
    .replace(/[^a-z0-9]/g, '') // Garde que alphanum
    .toLowerCase();
}

export default {
  ART_FORMS,
  PERIODS,
  CULTURAL_AREAS,
  GENRES,
  TECHNIQUES,
  ALL_FILTER_CATEGORIES,
  getAllValuesFromCategory,
  getLabelForValue,
  matchesFilter,
};
