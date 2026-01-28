/**
 * Service Audio Guide - Génération de texte narratif
 * Utilise Claude API via Edge Function pour générer des descriptions audio
 */

import { supabase } from '../lib/supabase';

// Cache local pour éviter de regénérer les mêmes textes
const audioTextCache = new Map();

/**
 * Niveaux de narration disponibles
 */
export const AUDIO_LEVELS = {
  enfant: {
    id: 'enfant',
    label: 'Enfant',
    sublabel: '6-12 ans',
    icon: 'child_care',
    description: 'Explication simple et amusante'
  },
  amateur: {
    id: 'amateur', 
    label: 'Amateur',
    sublabel: 'Grand public',
    icon: 'person',
    description: 'Contexte et histoire accessible'
  },
  expert: {
    id: 'expert',
    label: 'Expert',
    sublabel: 'Connaisseurs',
    icon: 'school',
    description: 'Analyse technique et stylistique'
  }
};

/**
 * Génère le prompt selon le niveau
 */
function getPromptForLevel(artwork, level) {
  const baseInfo = `
Œuvre : "${artwork.title || 'Sans titre'}"
Artiste : ${artwork.artist || 'Artiste inconnu'}${artwork.artist_dates ? ` ${artwork.artist_dates}` : ''}
Date : ${artwork.year || 'Date inconnue'}
Technique : ${artwork.medium || 'Non spécifiée'}
Période/Style : ${artwork.period || ''} ${artwork.style || ''}
Musée : ${artwork.museum || 'Non spécifié'}${artwork.museum_city ? `, ${artwork.museum_city}` : ''}
Description existante : ${artwork.description || 'Aucune'}
Note curatoriale : ${artwork.curatorial_note || 'Aucune'}
`.trim();

  const prompts = {
    enfant: `Tu es un guide de musée qui parle à des enfants de 6-12 ans.

${baseInfo}

Génère un texte audio de 30-45 secondes (environ 80-100 mots) qui :
- Utilise un vocabulaire simple et des phrases courtes
- Pose des questions pour engager l'enfant ("Tu vois le petit chien dans le coin ?")
- Fait des comparaisons avec leur quotidien
- Raconte une mini-histoire ou anecdote amusante sur l'œuvre
- Termine par une invitation à observer un détail

Ton : enthousiaste, curieux, comme si tu racontais un secret passionnant.
Ne commence pas par "Bonjour" ou "Salut". Commence directement par l'accroche.`,

    amateur: `Tu es un guide de musée passionné qui s'adresse au grand public.

${baseInfo}

Génère un texte audio de 45-60 secondes (environ 120-150 mots) qui :
- Situe l'œuvre dans son contexte historique
- Explique ce qui rend cette œuvre importante ou unique
- Mentionne une anecdote intéressante sur l'artiste ou la création
- Décrit les éléments visuels marquants
- Fait un lien avec l'émotion ou le message de l'œuvre

Ton : cultivé mais accessible, comme une conversation avec un ami passionné d'art.
Ne commence pas par "Bonjour". Commence directement par une accroche captivante.`,

    expert: `Tu es un conservateur de musée qui s'adresse à des connaisseurs en art.

${baseInfo}

Génère un texte audio de 60-90 secondes (environ 150-200 mots) qui :
- Analyse les choix techniques et stylistiques
- Situe l'œuvre dans l'évolution de l'artiste et du mouvement
- Mentionne les influences et l'héritage
- Évoque la réception critique et l'historiographie
- Compare avec d'autres œuvres majeures si pertinent
- Utilise le vocabulaire technique approprié (mais explicite)

Ton : érudit, précis, analytique, comme une notice de catalogue d'exposition.
Ne commence pas par des formules de politesse. Commence par une thèse ou observation clé.`
  };

  return prompts[level] || prompts.amateur;
}

/**
 * Génère le texte audio via Edge Function
 * @param {Object} artwork - L'œuvre
 * @param {string} level - 'enfant', 'amateur', ou 'expert'
 * @returns {Promise<string>} Le texte généré
 */
export async function generateAudioText(artwork, level = 'amateur') {
  // Vérifier le cache
  const cacheKey = `${artwork.id}-${level}`;
  if (audioTextCache.has(cacheKey)) {
    return audioTextCache.get(cacheKey);
  }

  const prompt = getPromptForLevel(artwork, level);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio-text`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prompt, level })
      }
    );

    if (!response.ok) {
      throw new Error('Erreur génération audio');
    }

    const { text } = await response.json();
    
    // Mettre en cache
    audioTextCache.set(cacheKey, text);
    
    return text;
  } catch (error) {
    console.error('Erreur génération texte audio:', error);
    
    // Fallback : utiliser la description existante
    return getFallbackText(artwork, level);
  }
}

/**
 * Texte de fallback si l'API échoue
 */
function getFallbackText(artwork, level) {
  const title = artwork.title || 'Cette œuvre';
  const artist = artwork.artist || 'un artiste';
  const year = artwork.year ? `en ${artwork.year}` : '';
  const medium = artwork.medium || '';
  const museum = artwork.museum || '';

  if (level === 'enfant') {
    return `${title} a été créée par ${artist} ${year}. ${artwork.description || `C'est une œuvre fascinante qui nous invite à observer attentivement chaque détail.`}`;
  }

  if (level === 'expert') {
    return `${title}, ${medium ? medium + ',' : ''} réalisée par ${artist} ${year}. ${artwork.curatorial_note || artwork.description || `Cette œuvre témoigne de la maîtrise technique et de la vision artistique de son créateur.`}${museum ? ` Conservée au ${museum}.` : ''}`;
  }

  // Amateur (défaut)
  return `${title} est une œuvre de ${artist}${year ? `, créée ${year}` : ''}. ${artwork.description || `Elle illustre parfaitement le talent de cet artiste et les caractéristiques de son époque.`}${museum ? ` Vous pouvez l'admirer au ${museum}.` : ''}`;
}

/**
 * Pré-génère les textes pour les 3 niveaux (optionnel, pour mise en cache)
 */
export async function preloadAudioTexts(artwork) {
  const levels = ['enfant', 'amateur', 'expert'];
  const promises = levels.map(level => generateAudioText(artwork, level));
  await Promise.allSettled(promises);
}

/**
 * Vide le cache (utile après modification d'une œuvre)
 */
export function clearAudioCache(artworkId = null) {
  if (artworkId) {
    ['enfant', 'amateur', 'expert'].forEach(level => {
      audioTextCache.delete(`${artworkId}-${level}`);
    });
  } else {
    audioTextCache.clear();
  }
}

export default {
  AUDIO_LEVELS,
  generateAudioText,
  preloadAudioTexts,
  clearAudioCache
};
