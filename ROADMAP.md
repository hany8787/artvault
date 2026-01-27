# ArtVault - Roadmap Produit

> **Vision** : L'application de référence pour découvrir, scanner et collectionner l'art
> **Positionnement** : Whart + Scanner IA = ArtVault
> **Dernière mise à jour** : 27 janvier 2026

---

## 🎯 Vision Produit

### Le parcours utilisateur complet

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARTVAULT                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│     AVANT       │    PENDANT      │          APRÈS              │
│                 │                 │                             │
│ • Découvrir     │ • Scanner       │ • Ma Collection             │
│   les expos     │   les œuvres    │ • Partager                  │
│ • Planifier     │ • Identifier    │ • Organiser                 │
│   sa visite     │   par IA        │ • Se souvenir               │
│ • Réserver      │ • Enrichir      │ • Exporter                  │
│   (billetterie) │   les infos     │                             │
└─────────────────┴─────────────────┴─────────────────────────────┘
        ▲                 ▲                      ▲
     (Whart)        (Killer Feature)        (Unique)
                      EXCLUSIF
```

### Différenciation vs Concurrence

| App | Avant | Pendant | Après |
|-----|-------|---------|-------|
| **Whart** | ✅ | ❌ | ❌ |
| **Google Arts** | ✅ | ⚠️ (basique) | ❌ |
| **ArtVault** | ✅ | ✅✅ (IA) | ✅ |

---

## 📅 Phases de développement

### Phase 0 : MVP ✅ (Janvier 2026)

**Statut : COMPLÉTÉ**

- [x] Authentification (Supabase Auth)
- [x] Scanner avec caméra/upload
- [x] Identification IA (Claude Vision)
- [x] Collection personnelle (grille + filtres)
- [x] Fiche artwork détaillée
- [x] CRUD complet (ajout, édition, suppression)
- [x] Favoris
- [x] Design system premium (dark mode, or accent)
- [x] Base musées (227 entrées)
- [x] Page Actualités/Expositions

---

### Phase 1 : Polish & PWA (Février 2026)

**Objectif : Application installable et utilisable offline**

#### 1.1 PWA Complète
- [ ] `manifest.json` complet avec tous les icons
- [ ] Service Worker pour cache offline
- [ ] Splash screen personnalisé
- [ ] Installation prompt optimisé
- [ ] Mode offline (consultation collection)

#### 1.2 Performance
- [ ] Lazy loading images
- [ ] Compression images avant upload
- [ ] Skeleton loaders
- [ ] Optimisation bundle (code splitting)

#### 1.3 UX Polish
- [ ] Animations transitions entre pages
- [ ] Pull-to-refresh sur collection
- [ ] Swipe actions sur cards
- [ ] Onboarding premier lancement
- [ ] Empty states améliorés

#### 1.4 Tests
- [ ] Tests sur iPhone réel
- [ ] Tests sur Android réel
- [ ] Tests tablette
- [ ] Lighthouse score > 90

**KPI Phase 1** : PWA installable, score Lighthouse > 90

---

### Phase 2 : Filtres Avancés & Géolocalisation (Mars 2026)

**Objectif : UX de filtrage professionnelle style Whart**

#### 2.1 Filtres hiérarchiques Collection
- [ ] Modal filtres plein écran
- [ ] 30+ catégories organisées hiérarchiquement
- [ ] Compteur résultats dynamique
- [ ] Recherche dans les filtres

#### 2.2 Expositions "Autour de vous"
- [ ] Géolocalisation sur page Actualités
- [ ] Section "Autour de vous" avec distance
- [ ] Vue carte avec clusters
- [ ] Toggle Liste/Carte

#### 2.3 Fiche Exposition enrichie
- [ ] Bouton "Itinéraire" (Google Maps)
- [ ] Section "What else?" (expos similaires)
- [ ] Favoris exposition

**KPI Phase 2** : Filtres fonctionnels, géoloc opérationnelle

---

### Phase 3 : Croissance & Métriques (Avril 2026)

**Objectif : 1000 utilisateurs actifs**

#### 3.1 Analytics
- [ ] Intégration Mixpanel ou Amplitude
- [ ] Tracking événements clés
- [ ] Dashboard métriques

#### 3.2 Acquisition
- [ ] Landing page marketing
- [ ] SEO (pages publiques expos)
- [ ] Partage social optimisé (Open Graph)

#### 3.3 Rétention
- [ ] Notifications push
- [ ] Email digest hebdomadaire

**KPI Phase 3** : 1000 MAU, 100 scans/jour

---

### Phase 4 : Monétisation (Mai-Juin 2026)

**Objectif : Premiers revenus**

#### 4.1 Freemium
- [ ] Limite scans gratuits (10/mois)
- [ ] Plans tarifaires (Free / Premium 4,99€ / Prestige 9,99€)
- [ ] Intégration Stripe

#### 4.2 Features Premium
- [ ] Collections multiples
- [ ] Export PDF catalogue
- [ ] Mode offline complet
- [ ] Scan illimité

#### 4.3 Affiliation
- [ ] Liens Amazon livres d'art
- [ ] Boutiques musées partenaires
- [ ] Reproductions d'œuvres

**KPI Phase 4** : 50 abonnés payants, MRR 250€

---

### Phase 5 : Partenariats Musées (Été 2026)

**Objectif : Premiers partenariats B2B**

- [ ] Deck commercial PDF
- [ ] Pilotes gratuits avec Paris Musées
- [ ] Dashboard insights pour musées
- [ ] White-label option

**KPI Phase 5** : 2 partenariats pilotes signés

---

### Phase 6 : Billetterie (Automne 2026)

- [ ] Boutons "Réserver" → liens externes
- [ ] Tracking clics affiliation
- [ ] Billetterie intégrée (si traction)

---

### Phase 7 : Expansion (2027)

- [ ] Couverture France (Lyon, Marseille, Bordeaux)
- [ ] i18n (EN, ES, DE, IT)
- [ ] International (Londres, Amsterdam)

---

## 🎨 Features backlog

### Scanner
- [ ] Auto-crop intelligent
- [ ] OCR cartel automatique
- [ ] Scan batch (multiple)

### Collection
- [ ] Tri par couleur dominante
- [ ] Timeline chronologique
- [ ] Import depuis Google Arts

### IA avancée
- [ ] Audio guide IA personnalisé
- [ ] Recommandations "Vous aimerez aussi"
- [ ] Analyse stylistique comparative

### Social
- [ ] Profils publics
- [ ] Collections partagées
- [ ] Commentaires

### Gamification
- [ ] Badges
- [ ] Streaks de visite
- [ ] Leaderboards

---

## 📊 Métriques cibles

| Métrique | Phase 1 | Phase 3 | Phase 5 |
|----------|---------|---------|---------|
| MAU | 100 | 1 000 | 5 000 |
| Scans/jour | 10 | 100 | 500 |
| Rétention J7 | 20% | 30% | 40% |

---

## 💡 Inspirations

| App | Ce qu'on prend |
|-----|----------------|
| **Whart** | Filtres hiérarchiques, UX expos, "Autour de vous" |
| **Shazam** | Instantanéité du scan |
| **Pinterest** | Collections visuelles |
| **Spotify Wrapped** | Récap annuel |
| **Duolingo** | Gamification |

---

*Document vivant - Mise à jour régulière*
