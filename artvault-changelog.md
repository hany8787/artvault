# ArtVault - Changelog

Suivi des évolutions et modifications de l'application.

---

## [0.3.0] - 2026-01-27 (En cours)

### À faire (Sprint actuel)
- [ ] Favoris sur artworks (❤️ sur les œuvres)
- [ ] PWA (installation mobile)
- [ ] Partage social
- [ ] Multi-collections
- [ ] Auto-crop intelligent (Scanner)

### Backlog (Plus tard)
- [ ] Internationalisation (i18n)
- [ ] Mode offline

---

## [0.2.0] - 2026-01-27

### Added
- **Carte Leaflet** : Affichage des musées sur carte interactive (vanilla JS, compatible React 18)
- **Expositions dynamiques** : Intégration API "Que faire à Paris" via Edge Function
- **Page Musées** : Vue liste + vue carte avec géolocalisation
- **Page Détail Musée** : Affiche les expositions en cours filtrées par musée

### Fixed
- **Leaflet crash** : Remplacement de react-leaflet par Leaflet vanilla JS (incompatibilité React 18 StrictMode)
- **CORS expositions** : Utilisation de l'Edge Function `get-exhibitions` comme proxy
- **Filtrage expositions** : Amélioration du matching par nom de lieu (venue)
- **Données obsolètes** : Suppression des expositions manuelles périmées

### Technical
- Edge Function `get-exhibitions` v5 : retourne `data` ET `exhibitions` pour compatibilité
- Composant `MuseumMap.jsx` séparé avec Leaflet vanilla
- News.jsx et MuseumDetail.jsx : gestion `data.data || data.exhibitions`

---

## [0.1.0] - 2026-01-26

### Added
- Setup initial du projet (Vite + React + Tailwind)
- Configuration Supabase (Auth, Database, Storage)
- Design system "Galerie Privée de Luxe" (dark mode, accent or #f2b90d)
- **Auth** : Login/Register via Supabase
- **Scanner** : Capture photo + envoi à Claude Vision API
- **Edge Function `enrich-artwork`** : Identification IA des œuvres
- **Collection** : Grille d'œuvres avec filtres (période, style, type, musée)
- **Page Détail Artwork** : Style éditorial avec note curatoriale
- **Profil utilisateur** : Stats, paramètres

### Technical
- React 18 + Vite
- Tailwind CSS avec design tokens custom
- Supabase (Auth, PostgreSQL, Storage, Edge Functions)
- Claude Vision API pour identification
- Structure : pages/, components/, contexts/, lib/

---

## Historique des décisions

### 2026-01-27 - Leaflet vs react-leaflet
- **Décision** : Utiliser Leaflet vanilla JS au lieu de react-leaflet
- **Raison** : Incompatibilité react-leaflet avec React 18 StrictMode (erreur Context.Consumer)
- **Impact** : Composant MuseumMap.jsx avec useRef et L.map()

### 2026-01-27 - API Expositions
- **Décision** : API "Que faire à Paris" via Edge Function proxy
- **Raison** : CORS bloque les appels directs depuis le navigateur
- **Limitation** : Ne couvre que Paris, pas les grands musées nationaux (Louvre, Orsay...)

### 2026-01-26 - Stack technique
- **Décision** : Webapp React au lieu de React Native
- **Raison** : Déploiement simple sur VPS avec Dokploy
- **Impact** : PWA pour l'expérience mobile

### 2026-01-26 - IA Vision
- **Décision** : Claude Vision API (Anthropic)
- **Raison** : Qualité d'identification, support du français
- **Alternative considérée** : GPT-4o Vision, Google Vision

---

## Architecture actuelle

```
artvault/
├── src/
│   ├── components/
│   │   ├── ui/           # Card, Loader, EmptyState...
│   │   ├── MuseumMap.jsx # Carte Leaflet vanilla
│   │   └── Layout.jsx
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Collection.jsx
│   │   ├── Scanner.jsx
│   │   ├── ArtworkDetail.jsx
│   │   ├── Museums.jsx
│   │   ├── MuseumDetail.jsx
│   │   ├── News.jsx       # Expositions
│   │   └── Profile.jsx
│   └── lib/
│       └── supabase.js
├── supabase/
│   └── functions/
│       ├── enrich-artwork/
│       ├── get-exhibitions/
│       └── ocr-cartel/
└── public/
```

## Supabase Edge Functions

| Fonction | Version | Usage |
|----------|---------|-------|
| `enrich-artwork` | v7 | Identification IA via Claude Vision |
| `get-exhibitions` | v5 | Proxy API Paris "Que faire" |
| `ocr-cartel` | v3 | OCR des cartels (expérimental) |

## APIs externes

| API | Usage | Limitation |
|-----|-------|------------|
| Claude Vision | Identification œuvres | Clé API requise |
| Que faire à Paris | Expositions Paris | Musées parisiens uniquement |
| OpenStreetMap | Tuiles carte | Gratuit |

---

## Prochaines étapes (v0.3.0)

1. **Favoris** - Ajouter ❤️ sur les œuvres
2. **PWA** - manifest.json, service worker, installation mobile
3. **Partage social** - Boutons partage artwork
4. **Multi-collections** - Créer des collections thématiques
5. **Auto-crop Scanner** - Détecter et recadrer l'œuvre automatiquement

## Déploiement prévu

- **Hébergement** : VPS avec Dokploy
- **URL** : À définir (ex: artvault.mondomaine.com)
- **Accès** : Web (desktop + mobile) + PWA installable
