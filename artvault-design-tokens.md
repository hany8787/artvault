# ArtVault - Design Tokens

> **Dernière mise à jour** : 27 janvier 2026
> **Version** : 0.3.0

---

## 🎨 Couleurs

### Palette Principale
| Token | Valeur | Usage |
|-------|--------|-------|
| `primary` / `accent` | `#f2b90d` | Accents, boutons, liens, éléments interactifs |
| `primary-hover` | `#d4a00c` | Hover states |
| `primary-light` | `rgba(242, 185, 13, 0.1)` | Backgrounds subtils, tags sélectionnés |

### Backgrounds
| Token | Valeur | Usage |
|-------|--------|-------|
| `bg-dark` | `#221e10` | Background principal (dark mode) |
| `bg-darker` | `#1a1709` | Zones plus sombres, footer |
| `bg-light` | `#f8f8f5` | Background light mode, modals |
| `bg-cream` | `#faf9f6` | Cards light mode |

### Surfaces
| Token | Valeur | Usage |
|-------|--------|-------|
| `surface-dark` | `#2a2515` | Cards sur fond sombre |
| `surface-glass` | `rgba(0, 0, 0, 0.3)` | Glassmorphism overlays |
| `surface-light` | `#ffffff` | Cards light mode |

### Texte
| Token | Valeur | Usage |
|-------|--------|-------|
| `text-primary` | `#ffffff` | Texte principal (dark mode) |
| `text-secondary` | `rgba(255, 255, 255, 0.6)` | Texte secondaire |
| `text-muted` | `rgba(255, 255, 255, 0.4)` | Labels, hints |
| `text-dark` | `#1a1a1a` | Texte principal (light mode) |

### Bordures
| Token | Valeur | Usage |
|-------|--------|-------|
| `border-subtle` | `rgba(255, 255, 255, 0.1)` | Séparateurs discrets |
| `border-gold` | `rgba(242, 185, 13, 0.3)` | Bordures accent |

---

## 📤 Typographie

### Fonts
```css
--font-display: 'Newsreader', serif;  /* Titres, texte éditorial */
--font-sans: 'DM Sans', sans-serif;   /* UI, labels, boutons */
```

### Échelle de tailles
| Classe | Taille | Usage |
|--------|--------|-------|
| `text-xs` | 10px | Labels uppercase, metadata |
| `text-sm` | 14px | Body small, tags |
| `text-base` | 16px | Body text |
| `text-lg` | 18px | Sous-titres |
| `text-xl` | 20px | Titres secondaires |
| `text-2xl` | 24px | Titres de section |
| `text-3xl` | 30px | Titres de page |
| `text-4xl` | 36px | Hero titles |

### Styles de texte
```css
/* Titre principal - Serif italic */
.title-display {
  font-family: 'Newsreader', serif;
  font-weight: 700;
  font-style: italic;
  letter-spacing: -0.02em;
}

/* Label uppercase */
.label-uppercase {
  font-family: 'DM Sans', sans-serif;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

/* Texte éditorial */
.text-editorial {
  font-family: 'Newsreader', serif;
  font-size: 16px;
  line-height: 1.7;
}
```

---

## 📦 Composants

### Boutons

```jsx
// Primaire (or)
<button className="bg-accent text-bg-dark font-semibold px-6 py-3 rounded-lg hover:bg-accent/90 transition-all active:scale-95">
  Label
</button>

// Outline
<button className="border border-accent/30 text-accent px-6 py-3 rounded-lg hover:bg-accent/10 transition-all">
  Label
</button>

// Ghost
<button className="text-white/60 hover:text-white px-4 py-2 transition-colors">
  Label
</button>

// Bouton flottant (actions artwork)
<button className="w-12 h-12 rounded-full bg-black/70 backdrop-blur-xl text-white hover:bg-black/90 border border-white/20 flex items-center justify-center transition-all shadow-lg">
  <span className="material-symbols-outlined">icon</span>
</button>
```

### Cards

```jsx
// Card glassmorphism (sur fond sombre)
<div className="backdrop-blur-md bg-black/30 border border-white/10 rounded-xl p-6">
  ...
</div>

// Card artwork
<div className="group cursor-pointer">
  <div className="aspect-[3/4] rounded-lg overflow-hidden mb-3">
    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
  </div>
  <h3 className="font-display font-bold italic text-white">Titre</h3>
  <p className="text-sm text-white/60">Artiste</p>
</div>

// Card avec scroll horizontal (Home)
<div className="flex-shrink-0 w-36 bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm">
  ...
</div>
```

### Inputs

```jsx
// Input standard
<input 
  className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/40 focus:border-accent focus:outline-none transition-colors"
  placeholder="Search..."
/>

// Search bar avec icône
<div className="relative">
  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/40">search</span>
  <input className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 ..." />
</div>
```

### Tags

```jsx
// Tag standard
<span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider border border-white/20 rounded-sm text-white/70">
  Oil on Canvas
</span>

// Tag sélectionné
<span className="inline-block px-3 py-1 text-xs font-medium uppercase tracking-wider border border-accent bg-accent/10 rounded-sm text-accent">
  Modern
</span>
```

---

## 🎯 Effets Spéciaux

### Glassmorphism
```css
.glass {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Boutons flottants (ArtworkDetail)
```css
.floating-action {
  position: fixed;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  z-index: 50;
}
```

### Scroll horizontal (Home)
```jsx
<div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 w-36">
      ...
    </div>
  ))}
</div>
```

---

## 📱 Breakpoints

| Breakpoint | Valeur | Usage |
|------------|--------|-------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop |
| `xl` | 1280px | Large desktop |

### Navigation
- **Mobile (< md)** : Bottom nav fixe
- **Desktop (>= md)** : Header top avec liens

### Pages Full Screen (sans navigation)
- `/scan` - Scanner
- `/artwork/*` - Fiche artwork (mode immersif)

### Grille Collection
- **Mobile** : 2 colonnes
- **Tablet** : 3 colonnes
- **Desktop** : 4 colonnes

```jsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
  ...
</div>
```

---

## 🎭 Icônes (Material Symbols)

### Configuration
```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
}

/* Icône filled (ex: favori actif) */
.material-symbols-outlined.filled {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

### Icônes principales
| Icône | Nom | Usage |
|-------|-----|-------|
| 🏠 | `home` | Navigation home |
| 📷 | `photo_camera` | Scan |
| 🖼️ | `collections` | Collection |
| 👤 | `person` | Profile |
| 🔍 | `search` | Recherche |
| ⚙️ | `tune` | Filtres |
| ❤️ | `favorite` | Favoris |
| ↗️ | `share` | Partager |
| 🗑️ | `delete` | Supprimer |
| ✕ | `close` | Fermer |
| ✏️ | `edit` | Modifier |
| ← | `arrow_back` | Retour |
| ⋮ | `more_vert` | Menu vertical |

---

## 🌙 Dark Mode

L'application est **dark mode par défaut**.

Pour les éléments qui doivent avoir un style différent :
```jsx
// Exemple : texte
<p className="text-neutral-900 dark:text-white">...</p>

// Exemple : background
<div className="bg-white dark:bg-neutral-800">...</div>

// Exemple : bordure
<div className="border-neutral-200 dark:border-neutral-700">...</div>
```

### Classes Tailwind thème-aware
Toujours utiliser les variantes `dark:` pour supporter le toggle de thème.
