# ArtVault

Application de collection d'œuvres d'art avec identification IA.

## Stack

- **Frontend** : React 18 + Vite + Tailwind CSS
- **Backend** : Supabase (Auth, PostgreSQL, Storage)
- **IA** : Claude Vision API

## Setup

1. Cloner le repo
```bash
git clone https://github.com/hany8787/artvault.git
cd artvault
```

2. Installer les dépendances
```bash
npm install
```

3. Configurer les variables d'environnement
```bash
cp .env.example .env
```

Puis éditer `.env` avec vos clés Supabase :
```
VITE_SUPABASE_URL=https://dzjgilplznhhwwitjztf.supabase.co
VITE_SUPABASE_ANON_KEY=votre-anon-key
```

4. Lancer le serveur de développement
```bash
npm run dev
```

## Structure

```
src/
├── components/     # Composants réutilisables
├── contexts/       # Contexts React (Auth)
├── lib/            # Config Supabase
├── pages/          # Pages de l'app
└── index.css       # Styles globaux
```

## Fonctionnalités

- ✅ Authentification (login/register)
- ✅ Page d'accueil
- ✅ Collection avec recherche
- ✅ Détail d'une œuvre
- 🚧 Scanner (identification IA) - En développement
- 🚧 Filtres avancés - À venir

## Design

Style "Galerie Privée de Luxe" :
- Dark mode par défaut
- Couleur accent : Or (#f2b90d)
- Typo titres : Newsreader (serif, italic)
- Typo UI : DM Sans
