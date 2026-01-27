# ArtVault - Documentation Technique Complète

> **Version** : 0.3.0  
> **Dernière mise à jour** : 27 janvier 2026  
> **Auteur** : Hassen  
> **Repository** : https://github.com/hany8787/artvault

---

## 📋 Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [Stack technique](#3-stack-technique)
4. [Structure des fichiers](#4-structure-des-fichiers)
5. [Base de données](#5-base-de-données)
6. [Edge Functions Supabase](#6-edge-functions-supabase)
7. [Authentification](#7-authentification)
8. [Pages de l'application](#8-pages-de-lapplication)
9. [Composants UI](#9-composants-ui)
10. [Design System](#10-design-system)
11. [Fonctionnalités détaillées](#11-fonctionnalités-détaillées)
12. [APIs externes](#12-apis-externes)
13. [Storage (Images)](#13-storage-images)
14. [Roadmap](#14-roadmap)
15. [Déploiement](#15-déploiement)
16. [Conventions de code](#16-conventions-de-code)
17. [Commandes utiles](#17-commandes-utiles)

---

## 1. Présentation du projet

### 1.1 Objectif

**ArtVault** est une application mobile-first (PWA) permettant aux utilisateurs de :

1. **Scanner** des œuvres d'art avec leur téléphone (caméra ou upload)
2. **Identifier** automatiquement l'œuvre via Claude Vision AI
3. **Collecter** et organiser leurs découvertes artistiques
4. **Explorer** les musées et expositions en cours

### 1.2 Public cible

- Amateurs d'art visitant des musées
- Collectionneurs souhaitant documenter leurs découvertes
- Étudiants en histoire de l'art

### 1.3 Proposition de valeur

- Identification instantanée par IA
- Fiches détaillées avec contexte historique
- Organisation en collections personnelles
- Découverte d'expositions à proximité

---

## 2. Architecture générale

### 2.1 Diagramme d'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Home   │  │  Scan   │  │Collection│  │ Museums │   ...      │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│       │            │            │            │                  │
│  ┌────┴────────────┴────────────┴────────────┴────┐            │
│  │              React Router + Contexts            │            │
│  │         (AuthContext, ThemeContext)             │            │
│  └─────────────────────┬───────────────────────────┘            │
└────────────────────────┼────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SUPABASE                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │     Auth     │  │   Database   │  │   Storage    │          │
│  │  (auth.users)│  │ (PostgreSQL) │  │  (artworks)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Edge Functions                       │          │
│  │  ┌────────────────┐  ┌────────────────┐          │          │
│  │  │ enrich-artwork │  │ get-exhibitions│          │          │
│  │  │ (Claude API)   │  │ (Paris Open)   │          │          │
│  │  └────────────────┘  └────────────────┘          │          │
│  └──────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    APIs EXTERNES                                 │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   Anthropic API  │  │ Paris Open Data  │                     │
│  │  (Claude Vision) │  │  (Expositions)   │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Flow de données - Scan d'une œuvre

```
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│  Caméra  │───▶│  Base64  │───▶│ Edge Function │───▶│  Claude  │
│  /Upload │    │  Image   │    │enrich-artwork │    │  Vision  │
└──────────┘    └──────────┘    └──────────────┘    └────┬─────┘
                                                          │
                                                          ▼
┌──────────┐    ┌──────────┐    ┌──────────────┐    ┌──────────┐
│ Afficher │◀───│ Stocker  │◀───│   Formulaire │◀───│   JSON   │
│ Détail   │    │ Supabase │    │   Édition    │    │ Metadata │
└──────────┘    └──────────┘    └──────────────┘    └──────────┘
```

---

## 3. Stack technique

### 3.1 Frontend

| Technologie | Version | Usage |
|-------------|---------|-------|
| React | 18.2.0 | Framework UI |
| Vite | 5.4.21 | Build tool |
| React Router | 6.22.0 | Navigation |
| Tailwind CSS | 3.4.1 | Styling |
| Leaflet | 1.9.4 | Cartes (musées) |

### 3.2 Backend (Supabase)

| Service | Usage |
|---------|-------|
| Auth | Authentification email/password |
| Database | PostgreSQL avec RLS |
| Storage | Stockage images artworks |
| Edge Functions | Logique serveur (Claude API) |

### 3.3 APIs externes

| API | Usage |
|-----|-------|
| Anthropic Claude | Vision AI (identification œuvres) |
| Paris Open Data | Expositions en cours |

### 3.4 Dépendances (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "leaflet": "^1.9.4",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-leaflet": "^4.2.1",
    "react-router-dom": "^6.22.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.4.21"
  }
}
```

---

## 4. Structure des fichiers

```
artvault/
├── 📁 public/
│   ├── favicon.svg
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   └── 📁 icons/              # Icônes PWA (72-512px)
│
├── 📁 src/
│   ├── App.jsx                # Routes principales
│   ├── main.jsx               # Point d'entrée React
│   ├── index.css              # Styles globaux + Tailwind
│   │
│   ├── 📁 components/
│   │   ├── Layout.jsx         # Layout principal (header + nav)
│   │   ├── MuseumAutocomplete.jsx
│   │   ├── MuseumMap.jsx      # Carte Leaflet
│   │   │
│   │   ├── 📁 navigation/
│   │   │   ├── TopNav.jsx     # Navigation desktop
│   │   │   └── BottomNav.jsx  # Navigation mobile
│   │   │
│   │   └── 📁 ui/
│   │       ├── Button.jsx
│   │       ├── Card.jsx       # ArtworkCard, MuseumCard
│   │       ├── Chip.jsx
│   │       ├── EmptyState.jsx
│   │       ├── FavoriteButton.jsx
│   │       ├── Input.jsx      # Input, Textarea
│   │       ├── InstallPrompt.jsx
│   │       ├── Loader.jsx     # Loader, PageLoader
│   │       ├── Modal.jsx      # Modal, ConfirmDialog
│   │       ├── SuggestionInput.jsx
│   │       └── AddToCollectionModal.jsx
│   │
│   ├── 📁 contexts/
│   │   ├── AuthContext.jsx    # Gestion auth Supabase
│   │   └── ThemeContext.jsx   # Dark/Light mode
│   │
│   ├── 📁 lib/
│   │   └── supabase.js        # Client Supabase
│   │
│   └── 📁 pages/
│       ├── Home.jsx           # Page d'accueil
│       ├── Scan.jsx           # Scanner + formulaire
│       ├── Collection.jsx     # Grille des œuvres
│       ├── Collections.jsx    # Multi-collections
│       ├── ArtworkDetail.jsx  # Fiche détaillée
│       ├── Museums.jsx        # Liste des musées
│       ├── MuseumDetail.jsx   # Fiche musée
│       ├── News.jsx           # Expositions/actualités
│       ├── Profile.jsx        # Profil utilisateur
│       ├── Login.jsx
│       └── Register.jsx
│
├── 📁 supabase/
│   ├── 📁 functions/
│   │   └── 📁 get-exhibitions/
│   │       └── index.ts
│   └── 📁 migrations/
│       └── *.sql
│
├── 📁 dist/                   # Build production
│
├── .env                       # Variables d'environnement
├── .env.example
├── tailwind.config.js
├── vite.config.js
├── package.json
└── README.md
```

---

## 5. Base de données

### 5.1 Schéma relationnel

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  auth.users │       │   profiles  │       │  artworks   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◀──────│ id (FK)     │       │ id (PK)     │
│ email       │       │ email       │       │ user_id(FK) │──┐
│ ...         │       │ full_name   │       │ title       │  │
└─────────────┘       │ avatar_url  │       │ artist      │  │
                      │ membership  │       │ ...         │  │
                      └─────────────┘       │ museum_id   │──┼──┐
                                            │ collection_id│──┼──┼──┐
                                            └─────────────┘  │  │  │
                                                             │  │  │
┌─────────────┐       ┌─────────────┐       ┌─────────────┐  │  │  │
│  museums    │       │ collections │       │scan_history │  │  │  │
├─────────────┤       ├─────────────┤       ├─────────────┤  │  │  │
│ id (PK)     │◀──────┼─────────────┼───────│ id (PK)     │  │  │  │
│ name        │       │ id (PK)     │◀──────│ user_id(FK) │◀─┘  │  │
│ city        │       │ user_id(FK) │◀──────│ artwork_id  │     │  │
│ country     │       │ name        │       │ ...         │     │  │
│ latitude    │       │ is_default  │       └─────────────┘     │  │
│ longitude   │       └─────────────┘                           │  │
│ ...         │◀────────────────────────────────────────────────┘  │
└─────────────┘                                                    │
                                                                   │
┌─────────────────────────────────────────────────────────────────┘
│
▼
┌─────────────────┐
│   collections   │
└─────────────────┘
```

### 5.2 Table `profiles`

Extension de `auth.users`, créée automatiquement à l'inscription.

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  membership_type TEXT DEFAULT 'free', -- 'free', 'premium', 'prestige'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies** :
- `Users can view own profile` : SELECT WHERE auth.uid() = id
- `Users can update own profile` : UPDATE WHERE auth.uid() = id

### 5.3 Table `artworks` (principale)

```sql
CREATE TABLE artworks (
  -- Identifiants
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Informations principales
  title TEXT NOT NULL,
  artist TEXT,
  artist_dates TEXT,              -- "(1853-1890)"
  year INTEGER,                   -- IMPORTANT: INTEGER pas TEXT
  
  -- Classification
  period TEXT,                    -- Renaissance, Baroque, Modern...
  style TEXT,                     -- Abstract, Realism, Surrealism...
  type TEXT,                      -- Painting, Sculpture, Photography...
  genre TEXT,                     -- Portrait, Landscape, Still Life...
  medium TEXT,                    -- Huile sur toile, Bronze, Marbre...
  
  -- Localisation musée
  museum TEXT,
  museum_city TEXT,
  museum_country TEXT,
  museum_id UUID REFERENCES museums(id),
  
  -- Descriptions
  description TEXT,               -- 1-2 phrases
  curatorial_note TEXT,           -- Note longue (style éditorial)
  dimensions TEXT,                -- "73.7 × 92.1 cm"
  
  -- Images
  image_url TEXT,
  thumbnail_url TEXT,
  cartel_image_url TEXT,          -- Photo du cartel
  cartel_raw_text TEXT,           -- OCR du cartel
  
  -- Métadonnées IA
  confidence_score DECIMAL(5,2),
  ai_raw_response JSONB,
  is_enriched BOOLEAN DEFAULT false,
  
  -- Organisation
  is_favorite BOOLEAN DEFAULT false,
  collection_id UUID REFERENCES collections(id),
  
  -- Partage
  share_token TEXT UNIQUE,
  user_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search (français)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('french', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(artist, '')), 'A') ||
    setweight(to_tsvector('french', COALESCE(museum, '')), 'B') ||
    setweight(to_tsvector('french', COALESCE(period, '')), 'C') ||
    setweight(to_tsvector('french', COALESCE(style, '')), 'C')
  ) STORED
);
```

**Index** :
- `artworks_user_id_idx` : user_id
- `artworks_search_idx` : GIN(search_vector)
- `artworks_period_idx`, `artworks_style_idx`, `artworks_artist_idx`, `artworks_museum_idx`
- `artworks_created_at_idx` : created_at DESC

**RLS Policies** :
- SELECT/INSERT/UPDATE/DELETE : WHERE auth.uid() = user_id

### 5.4 Table `museums`

Base de 227 musées pré-remplie.

```sql
CREATE TABLE museums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',    -- Noms alternatifs
  city TEXT,
  country TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  website TEXT,
  phone TEXT,
  description TEXT,
  image_url TEXT,
  opening_hours TEXT,
  founded_year INTEGER,
  type TEXT DEFAULT 'museum',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.5 Table `collections`

```sql
CREATE TABLE collections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.6 Autres tables

| Table | Usage | Rows |
|-------|-------|------|
| `scan_history` | Historique des scans | 0 |
| `exhibitions` | Expositions manuelles | 0 |
| `museum_exhibitions` | Expositions liées aux musées | 0 |
| `news` | Actualités art | 0 |
| `user_visits` | Visites utilisateur | 0 |

---

## 6. Edge Functions Supabase

### 6.1 `enrich-artwork` (Claude Vision)

**URL** : `https://dzjgilplznhhwwitjztf.supabase.co/functions/v1/enrich-artwork`

**Méthode** : POST

**Headers** :
```
Content-Type: application/json
```

**Body** :
```json
{
  "imageBase64": "...",      // Image en base64 (sans préfixe data:)
  "mediaType": "image/jpeg", // Optionnel, auto-détecté
  "title": "...",            // Alternatif si pas d'image
  "artist": "..."            // Alternatif si pas d'image
}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "title": "La Nuit étoilée",
    "artist": "Vincent van Gogh",
    "artist_dates": "(1853-1890)",
    "year": "1889",
    "period": "Post-impressionnisme",
    "style": "Expressionnisme",
    "medium": "Huile sur toile",
    "dimensions": "73.7 × 92.1 cm",
    "description": "...",
    "curatorial_note": "...",
    "museum": "Museum of Modern Art",
    "museum_city": "New York",
    "museum_country": "États-Unis",
    "confidence": "high"
  }
}
```

**Code source** :
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

// Auto-détection du type d'image
function detectImageType(base64: string): string {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { title, artist, imageBase64, mediaType } = await req.json();

  // Construction du prompt
  const prompt = `Tu es un expert en histoire de l'art...`;

  // Appel Claude API
  const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [...]
    })
  });

  // Parse et retourne
  const enrichedData = JSON.parse(responseText);
  return new Response(JSON.stringify({ success: true, data: enrichedData }));
});
```

### 6.2 `get-exhibitions` (Paris Open Data)

**URL** : `https://dzjgilplznhhwwitjztf.supabase.co/functions/v1/get-exhibitions`

**Méthode** : POST

**Body** :
```json
{
  "limit": 3
}
```

**Réponse** :
```json
{
  "exhibitions": [
    {
      "id": "...",
      "title": "Impressionnisme et Mode",
      "venue": "Musée d'Orsay",
      "date_start": "2026-01-15",
      "date_end": "2026-04-30",
      "description": "...",
      "url": "...",
      "image_url": "..."
    }
  ]
}
```

### 6.3 `ocr-cartel` (Google Vision - non utilisé)

Edge Function pour OCR des cartels via Google Cloud Vision API.
Actuellement non intégrée dans le frontend.

---

## 7. Authentification

### 7.1 AuthContext

```jsx
// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupère la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchProfile(session.user.id)
      setLoading(false)
    })

    // Écoute les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) fetchProfile(session.user.id)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Fonctions exposées
  async function signUp(email, password, fullName) { ... }
  async function signIn(email, password) { ... }
  async function signOut() { ... }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

### 7.2 Protection des routes

```jsx
// src/App.jsx
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader message="Chargement..." />
  if (!user) return <Navigate to="/login" replace />

  return children
}

// Utilisation
<Route path="/" element={
  <ProtectedRoute>
    <Layout />
  </ProtectedRoute>
}>
  <Route index element={<Home />} />
  ...
</Route>
```

### 7.3 Trigger auto-création profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 8. Pages de l'application

### 8.1 Vue d'ensemble

| Page | Route | Description | Mode immersif |
|------|-------|-------------|---------------|
| Home | `/` | Accueil, stats, scanner CTA | Non |
| Scan | `/scan` | Caméra, upload, analyse IA | ✅ Oui |
| Collection | `/collection` | Grille des œuvres + filtres | Non |
| ArtworkDetail | `/artwork/:id` | Fiche détaillée | ✅ Oui |
| Museums | `/museums` | Liste + carte des musées | Non |
| MuseumDetail | `/museum/:id` | Fiche musée | Non |
| News | `/news` | Expositions en cours | Non |
| Profile | `/profile` | Profil utilisateur | Non |
| Login | `/login` | Connexion | N/A (public) |
| Register | `/register` | Inscription | N/A (public) |

### 8.2 Layout et navigation

```jsx
// src/components/Layout.jsx
export default function Layout() {
  const location = useLocation()

  // Pages en mode immersif (sans header/nav)
  const isFullScreen = location.pathname === '/scan' 
    || location.pathname.startsWith('/artwork/')

  if (isFullScreen) {
    return <Outlet />
  }

  return (
    <div className="min-h-screen">
      <TopNav />      {/* Desktop */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />   {/* Mobile */}
      <InstallPrompt />
    </div>
  )
}
```

### 8.3 Home.jsx

Structure :
- Hero compact (greeting + date)
- Scanner Card (CTA principal)
- Ma Collection (stats + derniers ajouts)
- Actualités (expositions scroll horizontal)
- Musées (cards scroll horizontal)
- Comment ça marche (4 étapes)

### 8.4 Scan.jsx (736 lignes)

**États** : `capture` → `analyzing` → `form` → `saving`

**Flow** :
1. Accès caméra ou upload
2. Capture photo → base64
3. Appel `enrich-artwork` Edge Function
4. Affichage formulaire pré-rempli
5. Édition manuelle possible
6. Upload image vers Storage
7. Insert dans table `artworks`

**Extrait clé** (appel IA) :
```jsx
async function analyzeImage() {
  setStep('analyzing')
  setAnalysisStep(0)

  // Animation des étapes
  const interval = setInterval(() => {
    setAnalysisStep(prev => (prev + 1) % ANALYSIS_STEPS.length)
  }, 2000)

  try {
    // Extraction base64 (sans préfixe data:image/...)
    const base64Data = imageData.split(',')[1]

    const response = await fetch(
      'https://dzjgilplznhhwwitjztf.supabase.co/functions/v1/enrich-artwork',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data })
      }
    )

    const result = await response.json()

    if (result.success && result.data) {
      setFormData({
        ...formData,
        ...result.data,
        year: result.data.year ? parseInt(result.data.year, 10) || '' : ''
      })
    }

    setStep('form')
  } catch (err) {
    setError('Erreur lors de l\'analyse')
    setStep('capture')
  } finally {
    clearInterval(interval)
  }
}
```

### 8.5 Collection.jsx

**Fonctionnalités** :
- Grille responsive (2/3/4 colonnes)
- Recherche full-text
- Filtres : période, style, type, musée
- Tri : date, titre, artiste
- Filtre rapide favoris

**Requête Supabase** :
```jsx
let query = supabase
  .from('artworks')
  .select('*')
  .eq('user_id', user.id)
  .order(sortBy, { ascending: sortOrder === 'asc' })

if (filters.period) query = query.eq('period', filters.period)
if (filters.style) query = query.eq('style', filters.style)
if (filters.type) query = query.eq('type', filters.type)
if (filters.museum) query = query.eq('museum', filters.museum)
if (showFavoritesOnly) query = query.eq('is_favorite', true)
if (searchQuery) query = query.textSearch('search_vector', searchQuery)
```

### 8.6 ArtworkDetail.jsx

**Structure** :
- Hero image (70vh) avec zoom
- Boutons flottants verticaux (droite)
- Titre + artiste
- Métadonnées (année, technique, dimensions)
- Description + note curatoriale
- Œuvres du même artiste

**Boutons flottants** :
```jsx
<div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3">
  <button onClick={toggleFavorite} className="w-12 h-12 rounded-full bg-black/70 ...">
    <span className="material-symbols-outlined">favorite</span>
  </button>
  <button onClick={() => setIsEditing(true)} ...>edit</button>
  <button onClick={shareArtwork} ...>share</button>
  <button onClick={() => setShowMenu(!showMenu)} ...>more_vert</button>
</div>
```

---

## 9. Composants UI

### 9.1 Liste des composants

| Composant | Fichier | Props principales |
|-----------|---------|-------------------|
| Button | `ui/Button.jsx` | variant, size, loading |
| Input | `ui/Input.jsx` | label, error, icon |
| Textarea | `ui/Input.jsx` | label, rows |
| Loader | `ui/Loader.jsx` | size, message |
| Modal | `ui/Modal.jsx` | isOpen, onClose, title |
| ConfirmDialog | `ui/Modal.jsx` | message, onConfirm |
| ArtworkCard | `ui/Card.jsx` | artwork, onClick |
| MuseumCard | `ui/Card.jsx` | museum, onClick |
| FavoriteButton | `ui/FavoriteButton.jsx` | artworkId, initialState |
| Chip | `ui/Chip.jsx` | label, selected, onClick |
| EmptyState | `ui/EmptyState.jsx` | icon, title, description |

### 9.2 FavoriteButton (composant contrôlé)

```jsx
export default function FavoriteButton({ 
  artworkId, 
  initialState = false,
  size = 'md',
  showLabel = false,
  onToggle,
  className = '' 
}) {
  const [isFavorite, setIsFavorite] = useState(initialState)
  const [isLoading, setIsLoading] = useState(false)

  // Sync avec prop externe
  useEffect(() => {
    setIsFavorite(initialState)
  }, [initialState])

  async function handleToggle(e) {
    e.preventDefault()
    e.stopPropagation()
    if (isLoading) return

    setIsLoading(true)
    const newValue = !isFavorite

    // Optimistic update
    setIsFavorite(newValue)

    const { error } = await supabase
      .from('artworks')
      .update({ is_favorite: newValue })
      .eq('id', artworkId)

    if (error) {
      setIsFavorite(!newValue) // Rollback
    } else if (onToggle) {
      onToggle(newValue)
    }

    setIsLoading(false)
  }

  return (
    <button onClick={handleToggle} className={...}>
      <span className={`material-symbols-outlined ${isFavorite ? 'filled text-red-500' : ''}`}>
        favorite
      </span>
      {showLabel && <span>{isFavorite ? 'Favori' : 'Ajouter'}</span>}
    </button>
  )
}
```

### 9.3 MuseumAutocomplete

Autocomplete avec recherche dans la table `museums`.

```jsx
export default function MuseumAutocomplete({ value, onChange, onSelect }) {
  const [suggestions, setSuggestions] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  async function searchMuseums(query) {
    if (query.length < 2) return

    const { data } = await supabase
      .from('museums')
      .select('id, name, city, country')
      .or(`name.ilike.%${query}%,city.ilike.%${query}%`)
      .limit(10)

    setSuggestions(data || [])
    setIsOpen(true)
  }

  return (
    <div className="relative">
      <Input value={value} onChange={e => {
        onChange(e.target.value)
        searchMuseums(e.target.value)
      }} />
      
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-100 w-full bg-white dark:bg-neutral-900 
                        border border-neutral-200 dark:border-neutral-700 
                        rounded-lg shadow-2xl mt-1 max-h-60 overflow-y-auto">
          {suggestions.map(museum => (
            <button key={museum.id} onClick={() => {
              onSelect(museum)
              setIsOpen(false)
            }}>
              <span className="font-semibold">{museum.name}</span>
              <span className="text-neutral-500">{museum.city}, {museum.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 10. Design System

### 10.1 Couleurs

```javascript
// tailwind.config.js
colors: {
  // Light mode
  'bg-light': '#FFFFFF',
  'bg-light-secondary': '#F7F7F5',
  'text-light': '#1A1A1A',
  'text-light-secondary': '#6B6B6B',
  'border-light': '#E5E5E5',
  
  // Dark mode
  'bg-dark': '#0D0D0D',
  'bg-dark-secondary': '#1A1A1A',
  'text-dark': '#FFFFFF',
  'text-dark-secondary': '#A0A0A0',
  'border-dark': '#2A2A2A',
  
  // Accent (or)
  'accent': '#C9A227',
  'accent-dark': '#D4AF37',
  'accent-hover': '#B8931F',
  
  // Semantic
  'danger': '#DC2626',
  'success': '#16A34A',
}
```

### 10.2 Typographie

```javascript
fontFamily: {
  'display': ['"Playfair Display"', 'serif'],  // Titres
  'serif': ['"Cormorant Garamond"', 'serif'],  // Texte éditorial
  'sans': ['Inter', 'sans-serif'],              // UI
}
```

### 10.3 Animations

```javascript
animation: {
  'fade-in': 'fadeIn 0.5s ease-out',
  'slide-up': 'slideUp 0.4s ease-out',
  'scan-line': 'scanLine 2s ease-in-out infinite',
  'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
}
```

### 10.4 Dark Mode

L'application utilise `darkMode: 'class'`. Le thème est géré via `ThemeContext` :

```jsx
// Utilisation
<div className="bg-white dark:bg-neutral-900 text-black dark:text-white">
```

---

## 11. Fonctionnalités détaillées

### 11.1 Scanner d'œuvres

1. **Accès caméra** : `navigator.mediaDevices.getUserMedia()`
2. **Capture** : Canvas → base64 JPEG
3. **Upload alternatif** : Input file
4. **Analyse IA** : Edge Function → Claude Vision
5. **Formulaire** : Pré-rempli, éditable
6. **Sauvegarde** : Storage + Database

### 11.2 Favoris

- Colonne `is_favorite` (boolean) dans `artworks`
- Bouton cœur sur cards et page détail
- Filtre rapide "Voir uniquement les favoris"
- Optimistic update pour réactivité

### 11.3 Filtres Collection

- **Période** : Renaissance, Baroque, Impressionnisme...
- **Style** : Abstrait, Réalisme, Surréalisme...
- **Type** : Peinture, Sculpture, Photographie...
- **Musée** : Liste des musées de la collection

### 11.4 Recherche

Full-text search PostgreSQL avec `tsvector` pondéré :
- Poids A : titre, artiste
- Poids B : musée
- Poids C : période, style

---

## 12. APIs externes

### 12.1 Anthropic Claude API

**Modèle** : `claude-sonnet-4-20250514`

**Endpoint** : `https://api.anthropic.com/v1/messages`

**Headers** :
```
x-api-key: ANTHROPIC_API_KEY
anthropic-version: 2023-06-01
Content-Type: application/json
```

**Prompt utilisé** :
```
Tu es un expert en histoire de l'art. Analyse cette oeuvre et fournis des informations détaillées.

Réponds UNIQUEMENT en JSON valide:
{
  "title": "...",
  "artist": "...",
  "artist_dates": "...",
  ...
}
```

### 12.2 Paris Open Data API

**Endpoint** : `https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-/records`

**Filtres** :
- `refine=tags:exposition`
- `limit=10`

---

## 13. Storage (Images)

### 13.1 Configuration

**Bucket** : `artworks`

**Limites** :
- Taille max : 5 MB
- Types autorisés : `image/jpeg`, `image/png`, `image/webp`

### 13.2 Structure des chemins

```
artworks/
└── {user_id}/
    ├── {artwork_id}.jpg
    └── {artwork_id}-thumb.jpg
```

### 13.3 Upload depuis Scan.jsx

```jsx
async function uploadImage() {
  const fileName = `${user.id}/${Date.now()}.jpg`
  
  const { data, error } = await supabase.storage
    .from('artworks')
    .upload(fileName, imageFile, {
      contentType: 'image/jpeg',
      upsert: false
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('artworks')
    .getPublicUrl(fileName)

  return publicUrl
}
```

### 13.4 Policies RLS

```sql
-- Upload dans son propre dossier
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artworks' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Lecture publique
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'artworks');
```

---

## 14. Roadmap

### 🔴 Haute priorité

| Tâche | Complexité | Statut |
|-------|------------|--------|
| Déploiement Dokploy | Moyenne | 🔲 À faire |
| Tests sur mobile réel | Facile | 🔲 À faire |

### 🟡 Moyenne priorité

| Tâche | Complexité | Statut |
|-------|------------|--------|
| Auto-crop intelligent (Scanner) | Complexe | 🔲 À faire |
| Internationalisation (i18n) | Complexe | 🔲 À faire |
| PWA complète | Moyenne | 🔲 À faire |

### 🟢 Basse priorité

| Tâche | Complexité | Statut |
|-------|------------|--------|
| ~~Favoris sur artworks~~ | Facile | ✅ Fait |
| Multi-collections | Moyenne | 🔲 À faire |
| Partage social | Facile | 🔲 À faire |
| Mode offline | Complexe | 🔲 À faire |

### 📅 Plus tard

- Interface admin pour `museum_exhibitions`
- Intégration OpenAgenda (musées régionaux)
- Export PDF de la collection
- Gamification (badges)

---

## 15. Déploiement

### 15.1 Variables d'environnement

```bash
# .env
VITE_SUPABASE_URL=https://dzjgilplznhhwwitjztf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Supabase Edge Functions (secrets)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_CLOUD_API_KEY=... # (pour OCR cartel, non utilisé)
```

### 15.2 Build production

```bash
npm run build
# Output: dist/
```

### 15.3 Dokploy (prévu)

Configuration Docker à définir.

---

## 16. Conventions de code

### 16.1 Nommage

```javascript
// Composants React : PascalCase
function ArtworkCard() {}

// Hooks : camelCase avec "use"
function useAuth() {}

// Fonctions utilitaires : camelCase
function formatDate() {}

// Fichiers composants : PascalCase.jsx ou kebab-case.jsx
// ArtworkCard.jsx ou artwork-card.jsx
```

### 16.2 Tailwind

- Toujours utiliser les variantes `dark:` pour le thème
- Éviter les classes hardcodées (ex: `bg-white` seul)
- Préférer les tokens du design system

```jsx
// ✅ Bon
<div className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">

// ❌ Mauvais
<div className="bg-white text-black">
```

### 16.3 Supabase

- Toujours vérifier les erreurs
- Utiliser les types appropriés (year = INTEGER)

```jsx
const { data, error } = await supabase.from('artworks').select()

if (error) {
  console.error('Erreur:', error)
  return
}
```

---

## 17. Commandes utiles

```bash
# Développement
cd /Users/hd/Desktop/artvault
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Git
git add -A && git commit -m "message" && git push origin main

# Supabase CLI (si installé)
supabase functions serve  # Dev local des Edge Functions
supabase db diff          # Voir les changements de schéma
```

---

## 📎 Liens utiles

| Ressource | URL |
|-----------|-----|
| GitHub Repo | https://github.com/hany8787/artvault |
| Supabase Dashboard | https://supabase.com/dashboard/project/dzjgilplznhhwwitjztf |
| Anthropic Console | https://console.anthropic.com/ |
| Paris Open Data | https://opendata.paris.fr/ |

---

## 📝 Historique des modifications

| Date | Version | Changements |
|------|---------|-------------|
| 27/01/2026 | 0.3.0 | Boutons flottants, mode immersif, Home refonte |
| 27/01/2026 | 0.2.x | Feature favoris, bugs fixes |
| 26/01/2026 | 0.1.x | MVP initial, scanner, collection |

---

*Document généré le 27 janvier 2026*
