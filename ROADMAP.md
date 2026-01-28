# ArtVault - Roadmap Produit

> **Vision** : L'application de référence pour découvrir, scanner et collectionner l'art
> **Positionnement** : Whart + Scanner IA = ArtVault
> **Dernière mise à jour** : 28 janvier 2026

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

### Phase 1 : Filtres & Affiliation ✅ (Janvier 2026)

**Statut : COMPLÉTÉ**

- [x] Modal filtres plein écran style Whart
- [x] 30+ catégories organisées hiérarchiquement
- [x] Compteur résultats dynamique
- [x] Chips de filtres actifs avec suppression
- [x] Utilitaire génération liens affiliation Amazon
- [x] Composants AffiliateLinks et AffiliateButton

---

### Phase 2 : Audio Guide IA ✅ (Janvier 2026)

**Statut : COMPLÉTÉ**

- [x] Hook `useSpeech` pour Web Speech API (TTS gratuit)
- [x] Service `audioGuide.js` avec génération Claude
- [x] Edge Function `generate-audio-text` déployée
- [x] Composant `AudioGuidePlayer` avec design dépliable
- [x] 3 niveaux de narration : Enfant, Amateur, Expert
- [x] Contrôles play/pause/stop + barre de progression
- [x] Cache local des textes générés
- [x] Intégration dans ArtworkDetail.jsx

**Stack Audio Guide :**
- Génération texte : Claude Sonnet 4 via Edge Function
- Text-to-Speech : Web Speech API (navigateur)
- Upgrade possible : ElevenLabs, Google Cloud TTS

---

### Phase 3 : Scanner Avancé 🚧 (Février 2026)

**Objectif : Scanner plus intelligent et polyvalent**

#### 3.1 Auto-crop intelligent
- [ ] Détection des bords de l'œuvre (OpenCV.js ou TensorFlow.js)
- [ ] Crop automatique avant envoi à Claude
- [ ] Preview avec ajustement manuel
- [ ] Correction de perspective

#### 3.2 OCR Cartel automatique
- [ ] Détection du cartel dans l'image
- [ ] Extraction texte via Google Cloud Vision ou Tesseract.js
- [ ] Pré-remplissage des champs (titre, artiste, année)
- [ ] Fusion intelligente OCR + Claude Vision

#### 3.3 Scan batch (multiple)
- [ ] Mode "visite" : scanner plusieurs œuvres à la suite
- [ ] File d'attente avec aperçu
- [ ] Traitement en arrière-plan
- [ ] Notification quand tout est traité

---

### Phase 4 : Collection Avancée 🔮 (Mars 2026)

**Objectif : Organisation et visualisation enrichies**

#### 4.1 Tri par couleur dominante
- [ ] Extraction couleur dominante à l'upload (Color Thief)
- [ ] Stockage dans table artworks (champ `dominant_color`)
- [ ] Vue "palette" dans Collection
- [ ] Filtre par gamme de couleurs

#### 4.2 Timeline chronologique
- [ ] Vue alternative : frise chronologique
- [ ] Regroupement par siècle/décennie
- [ ] Navigation swipe horizontal
- [ ] Zoom sur période

#### 4.3 Import depuis Google Arts & Culture
- [ ] Connexion compte Google
- [ ] Import des favoris Google Arts
- [ ] Matching avec notre base
- [ ] Enrichissement IA si nécessaire

---

### Phase 5 : IA Avancée 🔮 (Avril 2026)

**Objectif : Expériences IA différenciantes**

#### 5.1 Recommandations "Vous aimerez aussi"
- [ ] Analyse des goûts utilisateur (périodes, styles, artistes)
- [ ] Suggestions basées sur la collection
- [ ] Intégration API musées (Europeana, Rijksmuseum)
- [ ] Section "Découvertes" sur Home

#### 5.2 Analyse stylistique comparative
- [ ] Comparer 2 œuvres côte à côte
- [ ] Analyse des similarités/différences par Claude
- [ ] Graphe d'influences (artiste A → artiste B)
- [ ] "Cette œuvre vous rappelle..." sur fiche détail

#### 5.3 Chatbot expert art
- [ ] Interface chat sur fiche artwork
- [ ] Questions libres sur l'œuvre
- [ ] Historique des conversations
- [ ] Mode "quiz" pour apprendre

---

### Phase 6 : PWA & Performance 🔮 (Mai 2026)

- [ ] manifest.json complet avec tous les icons
- [ ] Service Worker pour cache offline
- [ ] Mode offline (consultation collection)
- [ ] Lazy loading images
- [ ] Compression images avant upload
- [ ] Lighthouse score > 90

---

### Phase 7 : Monétisation 🔮 (Été 2026)

- [ ] Freemium (limite scans gratuits)
- [ ] Plans tarifaires (Premium 4,99€ / Prestige 9,99€)
- [ ] Intégration Stripe
- [ ] Affiliation Amazon active
- [ ] Partenariats musées

---

## 📊 Métriques cibles

| Métrique | Phase 2 | Phase 5 | Phase 7 |
|----------|---------|---------|----------|
| MAU | 100 | 1 000 | 5 000 |
| Scans/jour | 10 | 100 | 500 |
| Rétention J7 | 20% | 30% | 40% |

---

## 🛠 Stack Technique Actuelle

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18 + Vite + Tailwind |
| Backend | Supabase (Auth, DB, Storage, Edge Functions) |
| IA Identification | Claude Vision (claude-sonnet-4) |
| IA Audio Guide | Claude Sonnet 4 + Web Speech API |
| Déploiement | Vercel / Dokploy |

---

*Document vivant - Dernière modification : 28 janvier 2026*
