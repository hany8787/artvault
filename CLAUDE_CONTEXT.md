# ArtVault - Contexte Claude

> **Dernière mise à jour** : 28 janvier 2026
> **Version** : 0.4.0
> **Statut** : Phase 2 complétée (Audio Guide)

---

## 🎯 Résumé du Projet

**ArtVault** est une application mobile-first (PWA) permettant aux utilisateurs de :
1. **Scanner** des œuvres d'art avec leur téléphone
2. **Identifier** automatiquement l'œuvre via Claude Vision AI
3. **Collecter** et organiser leurs découvertes artistiques
4. **Écouter** des audio guides IA personnalisés

### Stack Technique
| Technologie | Usage |
|-------------|-------|
| React 18 + Vite | Frontend |
| Tailwind CSS | Styling |
| Supabase | Auth, PostgreSQL, Storage, Edge Functions |
| Claude Vision API | Identification des œuvres |
| Claude Sonnet 4 | Génération texte audio guide |
| Web Speech API | Text-to-Speech (gratuit) |

### Design System
- **Mode** : Dark mode par défaut
- **Fond** : `#221e10` (brun sombre) ou neutral-900
- **Accent** : `#f2b90d` (or)
- **Typo titres** : Newsreader (serif, italic)
- **Typo UI** : DM Sans (sans-serif)

---

## 📁 Structure du Projet

```
artvault/
├── src/
│   ├── components/
│   │   ├── audio/
│   │   │   └── AudioGuide.jsx      # ✅ Player audio dépliable
│   │   ├── ui/
│   │   │   ├── Card.jsx
│   │   │   ├── FavoriteButton.jsx
│   │   │   └── ...
│   │   └── Layout.jsx
│   ├── hooks/
│   │   └── useSpeech.js            # ✅ Hook Web Speech API
│   ├── services/
│   │   └── audioGuide.js           # ✅ Service génération texte
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Scan.jsx
│   │   ├── Collection.jsx
│   │   ├── ArtworkDetail.jsx       # ✅ Intègre AudioGuidePlayer
│   │   └── ...
│   └── lib/
│       └── supabase.js
├── supabase/
│   └── functions/
│       ├── enrich-artwork/         # Claude Vision
│       └── generate-audio-text/    # ✅ Audio Guide
└── public/
```

---

## ✅ Fonctionnalités Implémentées

### Core (Phase 0)
- [x] Auth (login/register Supabase)
- [x] Scanner avec caméra ou upload
- [x] Identification via Claude Vision
- [x] Collection avec grille et filtres
- [x] Fiche artwork détaillée
- [x] CRUD complet
- [x] Favoris

### Phase 1 : Filtres
- [x] Modal filtres hiérarchiques (30+ catégories)
- [x] Chips filtres actifs
- [x] Affiliation Amazon (composants prêts)

### Phase 2 : Audio Guide IA ✅
- [x] `useSpeech.js` : Hook TTS avec Web Speech API
- [x] `audioGuide.js` : Service génération texte Claude
- [x] `AudioGuide.jsx` : Composant player dépliable
- [x] Edge Function `generate-audio-text`
- [x] 3 niveaux : Enfant (6-12 ans), Amateur, Expert
- [x] Intégration dans ArtworkDetail.jsx

---

## 🗄️ Base de Données

### Table `artworks`
```sql
id, user_id, title, artist, artist_dates, year,
period, style, type, genre, medium,
museum, museum_city, museum_country, museum_id,
description, curatorial_note, dimensions,
image_url, thumbnail_url,
is_favorite, collection_id,
confidence_score, ai_raw_response
```

### Edge Functions déployées
| Fonction | Usage | ID |
|----------|-------|----|
| `enrich-artwork` | Identification Claude Vision | - |
| `get-exhibitions` | Paris Open Data | - |
| `generate-audio-text` | Audio Guide IA | 1a710eec-1bb1-48df-a174-52eb9b9df4ac |

---

## 🔧 Configuration Audio Guide

### Niveaux de narration
| Niveau | Durée | Tokens | Style |
|--------|-------|--------|-------|
| Enfant | 30-45s | ~100 mots | Simple, questions, anecdotes |
| Amateur | 45-60s | ~150 mots | Contexte historique, accessible |
| Expert | 60-90s | ~200 mots | Analyse technique, érudit |

### Upgrade TTS possible
- **Actuel** : Web Speech API (gratuit, voix navigateur)
- **Option 1** : Google Cloud TTS (~$4/million caractères)
- **Option 2** : ElevenLabs (voix ultra-réalistes, ~$5/mois)
- **Option 3** : OpenAI TTS (bonne qualité, ~$15/million)

---

## 📋 Prochaines Phases (Backlog)

### Phase 3 : Scanner Avancé
- [ ] Auto-crop intelligent (détection bords)
- [ ] OCR cartel automatique
- [ ] Scan batch (multiple œuvres)

### Phase 4 : Collection Avancée
- [ ] Tri par couleur dominante
- [ ] Timeline chronologique
- [ ] Import Google Arts & Culture

### Phase 5 : IA Avancée
- [ ] Recommandations "Vous aimerez aussi"
- [ ] Analyse stylistique comparative
- [ ] Chatbot expert art

---

## 🔗 Liens Utiles

- **GitHub** : https://github.com/hany8787/artvault
- **Supabase** : https://supabase.com/dashboard/project/dzjgilplznhhwwitjztf
- **Design Tokens** : voir `artvault-design-tokens.md`
- **Roadmap** : voir `ROADMAP.md`

---

*Document généré le 28 janvier 2026*
