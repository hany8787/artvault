# ArtVault - Changelog

Suivi des évolutions et modifications de l'application.

---

## [0.3.0] - 2026-01-27

### Added
- **Favoris** : Bouton ❤️ sur les cards (Collection) et page détail artwork
- **Filtre favoris** : Bouton rapide dans le header de Collection
- **Home refonte** : Style app mobile avec sections en scroll horizontal
  - Hero compact avec carte Scanner
  - Stats rapides (œuvres, artistes, musées)
  - Derniers ajouts en scroll horizontal
  - Actualités (expositions) en scroll horizontal
  - Musées à découvrir

### Changed
- **ArtworkDetail** : Barre d'actions déplacée en bas de l'image hero
  - Fond opaque noir avec blur
  - Boutons Favori, Modifier, Menu (...)
  - Meilleur contraste et lisibilité
- **MuseumAutocomplete** : Dropdown avec z-index 100, fond opaque, shadow

### Fixed
- **MuseumAutocomplete** : Texte invisible en light mode (blanc sur blanc)
- **Scan.jsx** : Bouton Enregistrer qui ne marchait pas (year parsing)
- **FavoriteButton** : Latence entre clic et mise à jour du filtre
  - Refactorisé en composant contrôlé avec useEffect

### Technical
- Création de `CLAUDE_CONTEXT.md` pour la continuité du projet
- FavoriteButton : prop `isFavorite` au lieu de `initialFavorite`

---

## [0.2.0] - 2026-01-27

### Added
- **Carte Leaflet** : Affichage des musées sur carte interactive (vanilla JS)
- **Expositions dynamiques** : Intégration API "Que faire à Paris" via Edge Function
- **Page Musées** : Vue liste + vue carte avec géolocalisation
- **Page Détail Musée** : Expositions en cours filtrées par musée

### Fixed
- **Leaflet crash** : Remplacement de react-leaflet par Leaflet vanilla JS
- **CORS expositions** : Edge Function `get-exhibitions` comme proxy
- **Filtrage expositions** : Matching amélioré par nom de lieu

### Technical
- Edge Function `get-exhibitions` v5
- Composant `MuseumMap.jsx` séparé avec Leaflet vanilla

---

## [0.1.0] - 2026-01-26

### Added
- Setup initial du projet (Vite + React + Tailwind)
- Configuration Supabase (Auth, Database, Storage)
- Design system "Galerie Privée de Luxe"
- **Auth** : Login/Register via Supabase
- **Scanner** : Capture photo + Claude Vision API
- **Edge Function `enrich-artwork`** : Identification IA
- **Collection** : Grille d'œuvres avec filtres
- **Page Détail Artwork** : Style éditorial
- **Profil utilisateur** : Stats, paramètres

---

## Historique des décisions

### 2026-01-27 - Refonte Home style app
- **Décision** : Passer d'une page web classique à un style app mobile
- **Raison** : Produit final = app iOS/Android (PWA), pas un site web
- **Impact** : Scroll horizontal, cards compactes, moins de texte

### 2026-01-27 - Barre d'actions artwork en bas
- **Décision** : Déplacer les boutons du header vers le bas de l'image
- **Raison** : Boutons illisibles sur fond d'image variable
- **Impact** : Meilleur UX, contraste garanti

### 2026-01-27 - Leaflet vanilla vs react-leaflet
- **Décision** : Utiliser Leaflet vanilla JS
- **Raison** : Incompatibilité react-leaflet avec React 18 StrictMode
- **Impact** : MuseumMap.jsx avec useRef et L.map()

### 2026-01-26 - Stack technique
- **Décision** : Webapp React + PWA au lieu de React Native
- **Raison** : Déploiement simple, PWA pour mobile
- **Impact** : Installation sur écran d'accueil iOS/Android

---

## Prochaines étapes

### Feature #2 : PWA
- [ ] manifest.json complet avec icons
- [ ] Service worker pour offline basique
- [ ] Splash screen
- [ ] Meta tags pour installation

### Feature #3 : Partage social
- [ ] Preview image générée
- [ ] Meta tags Open Graph
- [ ] Amélioration des boutons partage existants

### Feature #4 : Multi-collections
- [ ] Table `collections` dans Supabase
- [ ] UI pour créer/gérer des collections
- [ ] Modal "Ajouter à une collection"

### Feature #5 : Auto-crop Scanner
- [ ] Détection des bords de l'œuvre
- [ ] Crop automatique avant envoi à Claude

---

## Architecture

```
artvault/
├── src/
│   ├── components/
│   │   ├── ui/              # Card, FavoriteButton, Input, Modal, Loader
│   │   ├── MuseumMap.jsx
│   │   ├── MuseumAutocomplete.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Home.jsx         # Style app mobile
│   │   ├── Scan.jsx
│   │   ├── Collection.jsx
│   │   ├── ArtworkDetail.jsx
│   │   ├── Museums.jsx
│   │   ├── MuseumDetail.jsx
│   │   ├── News.jsx
│   │   └── Profile.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   └── lib/
│       └── supabase.js
├── supabase/functions/
│   ├── identify-artwork/
│   └── get-exhibitions/
└── public/
    ├── manifest.json
    └── icons/
```

## Supabase

| Élément | Détails |
|---------|---------|
| **Project URL** | https://dzjgilplznhhwwitjztf.supabase.co |
| **Tables** | profiles, artworks, museums, scan_history |
| **Storage** | Bucket `artworks` (images) |
| **Edge Functions** | identify-artwork, get-exhibitions |

## Déploiement

- **Hébergement prévu** : VPS avec Dokploy
- **Build** : `npm run build` → dist/
- **GitHub** : https://github.com/hany8787/artvault
