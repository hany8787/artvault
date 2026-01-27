# ArtVault - Contexte Claude

> **Dernière mise à jour** : 27 janvier 2026
> **Version** : 0.3.0
> **Statut** : MVP en développement

---

## 🎯 Résumé du Projet

**ArtVault** est une application mobile-first (PWA) permettant aux utilisateurs de :
1. **Scanner** des œuvres d'art avec leur téléphone
2. **Identifier** automatiquement l'œuvre via Claude Vision AI
3. **Collecter** et organiser leurs découvertes artistiques

### Stack Technique
| Technologie | Usage |
|-------------|-------|
| React 18 + Vite | Frontend |
| Tailwind CSS | Styling |
| Supabase | Auth, PostgreSQL, Storage, Edge Functions |
| Claude Vision API | Identification des œuvres |
| PWA | Installation mobile (prévu) |

### Design System
- **Mode** : Dark mode par défaut
- **Fond** : `#221e10` (brun sombre)
- **Accent** : `#f2b90d` (or)
- **Typo titres** : Newsreader (serif, italic)
- **Typo UI** : DM Sans (sans-serif)

---

## 📁 Structure du Projet

```
artvault/
├── src/
│   ├── components/
│   │   ├── ui/              # Composants réutilisables
│   │   │   ├── Card.jsx     # ArtworkCard, MuseumCard
│   │   │   ├── FavoriteButton.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Loader.jsx
│   │   ├── MuseumAutocomplete.jsx
│   │   └── Layout.jsx       # Header + Bottom Nav
│   ├── pages/
│   │   ├── Home.jsx         # Page d'accueil style app
│   │   ├── Scan.jsx         # Scanner + Claude Vision
│   │   ├── Collection.jsx   # Grille des œuvres
│   │   ├── ArtworkDetail.jsx # Fiche détaillée
│   │   ├── Museums.jsx      # Liste des musées
│   │   ├── MuseumDetail.jsx
│   │   ├── News.jsx         # Expositions
│   │   └── Profile.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   └── lib/
│       └── supabase.js
├── supabase/
│   └── functions/
│       ├── identify-artwork/   # Claude Vision API
│       └── get-exhibitions/    # Paris Musées API
└── public/
    ├── manifest.json
    └── icons/
```

---

## 🗄️ Base de Données (Supabase)

### Tables principales
- **profiles** : Extension de auth.users
- **artworks** : Œuvres de la collection (titre, artiste, musée, image, etc.)
- **museums** : Base des musées avec coordonnées et métadonnées
- **scan_history** : Historique des scans (optionnel)

### Champs importants `artworks`
```sql
id, user_id, title, artist, artist_dates, year,
period, style, type, genre, medium,
museum, museum_city, museum_country, museum_id,
description, curatorial_note, dimensions,
image_url, thumbnail_url,
is_favorite, collection_id,
confidence_score, ai_raw_response
```

---

## ✅ Fonctionnalités Implémentées

### Core
- [x] Auth (login/register Supabase)
- [x] Scanner avec caméra ou upload
- [x] Identification via Claude Vision (Edge Function)
- [x] Collection avec grille et filtres
- [x] Fiche artwork détaillée
- [x] CRUD complet (ajout, modification, suppression)

### Features récentes (v0.3.0)
- [x] **Favoris** : Bouton ❤️ sur cards et détail, filtre rapide
- [x] **Home refonte** : Style app mobile, scroll horizontal, scanner hero
- [x] **Barre d'actions artwork** : Déplacée en bas de l'image avec fond opaque
- [x] **MuseumAutocomplete** : z-index corrigé, style opaque

### API & Intégrations
- [x] Claude Vision pour identification
- [x] Paris Musées API (expositions via Edge Function)
- [x] Table `museums` avec autocomplete

---

## 🐛 Bugs Corrigés (Session 27/01/2026)

1. **MuseumAutocomplete invisible** (blanc sur blanc en light mode)
   - Fix : Classes thème au lieu de hardcoded colors

2. **Bouton Enregistrer qui ne marchait pas** (Scan.jsx)
   - Fix : Parse de `year` en integer, gestion des undefined

3. **Latence favoris** (clic → filtre ne réagit pas)
   - Fix : FavoriteButton en composant contrôlé avec useEffect sync

4. **Boutons illisibles sur fiche artwork**
   - Fix : Déplacés en bas de l'image hero avec fond opaque

---

## 📋 Prochaines Étapes

### Feature #2 : PWA
- [ ] manifest.json complet
- [ ] Service worker pour offline
- [ ] Splash screen
- [ ] Installation sur écran d'accueil

### Feature #3 : Partage social
- [ ] Génération de preview image
- [ ] Meta tags Open Graph
- [ ] Boutons partage (déjà présents basiquement)

### Feature #4 : Multi-collections
- [ ] Table `collections`
- [ ] UI pour créer/gérer des collections
- [ ] Assigner une œuvre à une collection

### Feature #5 : Auto-crop Scanner
- [ ] Détection des bords de l'œuvre
- [ ] Crop automatique avant analyse

---

## 🔧 Commandes Utiles

```bash
# Dev
cd /Users/hd/Desktop/artvault
npm run dev

# Build
npm run build

# Deploy (si Dokploy configuré)
git push origin main
```

---

## 📝 Notes pour Claude Code

Quand tu reprends ce projet :

1. **Lis ce fichier** pour comprendre le contexte
2. **Vérifie** `artvault-changelog.md` pour l'historique
3. **Consulte** `artvault-design-tokens.md` pour le style
4. **Le repo GitHub** : https://github.com/hany8787/artvault

### Conventions
- Composants React : PascalCase
- Hooks : camelCase avec `use`
- Classes Tailwind : thème-aware (`text-primary dark:text-white`)
- Supabase : toujours vérifier les erreurs

### Points d'attention
- Le champ `year` dans artworks est INTEGER (toujours parser)
- Les images sont stockées dans Supabase Storage bucket `artworks`
- L'Edge Function `identify-artwork` utilise la clé Anthropic stockée en secret

---

## 🔗 Liens Utiles

- **Supabase Dashboard** : https://supabase.com/dashboard/project/dzjgilplznhhwwitjztf
- **GitHub Repo** : https://github.com/hany8787/artvault
- **Design Tokens** : voir `artvault-design-tokens.md`
