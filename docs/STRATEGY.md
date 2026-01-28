# ArtVault - Stratégie Produit & Monétisation

> **Version** : 1.0.0  
> **Dernière mise à jour** : 28 janvier 2026  
> **Statut** : Document stratégique validé

---

## 🎯 Vision & Positionnement

### Proposition de Valeur Unique

**"Votre compagnon artistique personnel de Paris à l'Europe"**

**Triangle différenciant** : Scanner IA + Collection perso + Guide expos

> Aucun concurrent ne couvre ces 3 axes à la fois.

**Slogan** : "Scannez, découvrez, collectionnez : l'art à portée de main !"

**Mantra interne** : **Local + Instantané + Personnel**

---

## 📊 Analyse Concurrentielle

### Mapping des 8 Concurrents

| App | Focus | Forces | Faiblesses | Inspiration pour ArtVault |
|-----|-------|--------|------------|---------------------------|
| **Whart** | Guide expos Paris | 800+ expos, exhaustif local, soutien institutionnel | Paris uniquement, pas de scan, pas de collection | Agenda géolocalisé exhaustif |
| **Google Arts & Culture** | Contenu mondial | 2000+ musées, techno AR/IA, visites 360° | Pas orienté visite physique, pas de scanner dédié | Recommandations intelligentes |
| **Smartify** | Scanner universel | 700+ musées partenaires, audio IA, B2B analytics | Moins spécialisé localement, pas de communauté | Scanner fluide, audio personnalisé |
| **Magnus** | Marché de l'art | Prix enchères/galeries, carte galeries, AR | Focus galeries > musées, iOS only | Cote artiste, approche communautaire |
| **Artsy** | Marketplace | 1M+ œuvres, Art Genome recommandations | Pas outil visite, focus contemporain/vente | Personnalisation par goûts |
| **Artnet** | Données marché | Price Database 14M+ résultats | Pas pour visiteur musée, payant | Partenariat potentiel |
| **DailyArt** | Éducation | Œuvre du jour, 26 langues, 4.9/5 | One-way, pas interactif | Storytelling, contenu premium |
| **Second Canvas** | Apps muséales HD | Super-zoom, rayons X, AR | App par musée (morcellement) | Fonctionnalités AR/HD |

### Positionnement Stratégique

```
                    CONTENU RICHE
                         ▲
                         │
        Google A&C  ●    │    ● DailyArt
                         │
    ─────────────────────┼─────────────────────▶ INTERACTIF
    PASSIF               │
                         │
           Whart ●       │    ● ArtVault (cible)
                         │    ● Smartify
                         │
                    LOCAL/VISITE
```

**ArtVault = Whart (local) + Smartify (scan) + DailyArt (éducatif)**

---

## 💰 Stratégie de Monétisation

### 5 Axes de Revenus

#### 1. 🛒 Affiliation & E-commerce (MVP)

| Source | Commission | Priorité |
|--------|------------|----------|
| Amazon Livres d'art | 5% | ✅ MVP |
| Billetterie (Tiqets, GetYourGuide) | 5-8% | ✅ MVP |
| Boutiques musées | À négocier | Phase 2 |
| Art prints (Redbubble, Society6) | ~10% | Phase 2 |
| Cours en ligne (MasterClass) | ~15% | Phase 3 |

**Implémentation** : Liens de recherche Amazon dynamiques
```
https://www.amazon.fr/s?k={artiste}+livre+art&tag=artvault-21
```

#### 2. 🤖 Services IA Premium

| Feature | Description | Pricing |
|---------|-------------|--------|
| Audio Guide IA | Commentaire 2min sur toute œuvre, ton adaptable | Abonnement |
| Compagnon conversationnel | Chatbot questions visite | Premium |
| Analyse stylistique | Détection style/courant similaire | Premium |
| Recommandations hyper-personnalisées | Curateur virtuel | Premium |

**Priorité** : Audio IA (immédiat) > Chatbot (R&D) > Analyse (delight)

#### 3. 🏛️ B2B Musées & Institutions

| Offre | Description | Pricing |
|-------|-------------|--------|
| Dashboard Analytics | Stats scans/favoris anonymisées | Freemium → Abo |
| Notifications ciblées | Retargeting visiteurs | Module payant |
| Widget site web | Intégrable sur site musée | API/Abo |
| White-label | App personnalisée musée | Prestation k€ |

**Approche** : Rapport gratuit musées pilotes → démarcher dans 6-12 mois

#### 4. 👥 Social & Communauté

| Feature | Description | Monétisation |
|---------|-------------|-------------|
| Collections publiques | Experts vendent collections thématiques | Commission |
| Expert certifié | Badge + avantages | ~50€/an |
| Événements payants | Visites privées, webinaires | ~30€/événement |

**Prérequis** : 50k+ utilisateurs

#### 5. 📚 Contenu Premium Exclusif

| Contenu | Format | Prix |
|---------|--------|------|
| Mini-cours histoire art | 5 leçons interactives | 4.99€ |
| Parcours "30 jours" | Façon Duolingo | Abo |
| Visites virtuelles live | Stream guidé | 10€/visite |

---

## 📈 Tableau de Priorisation

### Matrice Effort / Impact

```
         IMPACT ÉLEVÉ
              ▲
              │
   Quick Wins │  Projets Majeurs
   ┌──────────┼──────────────┐
   │ ● Affil. │ ● Audio IA   │
   │ Amazon   │ ● Filtres    │
   │ ● PWA    │   avancés    │
   │          │ ● B2B basic  │
   ├──────────┼──────────────┤
   │ Fill-ins │  Éviter/Tard │
   │ ● Partage│ ● White-label│
   │ social   │ ● Marketplace│
   │          │ ● AR avancée │
   └──────────┴──────────────┘
              │
   EFFORT ────┴───────────────▶
   FAIBLE          ÉLEVÉ
```

### Actions Priorisées par Phase

| # | Action | Phase | Effort | Impact | Status |
|---|--------|-------|--------|--------|--------|
| 1 | Filtres hiérarchiques 30+ catégories | 1 | M | ★★★★ | 🔲 TODO |
| 2 | Système affiliation Amazon | 1 | S | ★★★ | 🔲 TODO |
| 3 | PWA complète (offline, install) | 1 | M | ★★★★ | 🔲 TODO |
| 4 | Géolocalisation "Autour de vous" | 2 | M | ★★★★ | 🔲 TODO |
| 5 | Audio guide IA (Claude + TTS) | 2 | L | ★★★★★ | 🔲 TODO |
| 6 | Déploiement Dokploy | 1 | S | ★★★★★ | 🔲 TODO |
| 7 | Inscription Amazon Partenaires | 1 | S | ★★★ | 🔲 TODO |
| 8 | Profils publics | 3 | M | ★★★ | 🔲 TODO |
| 9 | Dashboard B2B basique | 3 | L | ★★★★ | 🔲 TODO |
| 10 | Multi-collections | 2 | M | ★★★ | 🔲 TODO |

**Légende Effort** : S = Small (1-2j), M = Medium (3-5j), L = Large (1-2 sem)

---

## 🔧 Ressources Techniques

### APIs Musées & Œuvres (Open Data)

| API | Contenu | Usage |
|-----|---------|-------|
| Met Museum API | 470k+ œuvres, images HD CC0 | Enrichissement DB |
| Art Institute Chicago | Œuvres, expos passées/futures | Métadonnées |
| Europeana | Agrégateur européen | Collections européennes |
| Louvre Open Data | Collections peintures | Focus France |
| WikiArt | 250k+ œuvres | Non-commercial |

### Datasets ML/IA

| Dataset | Contenu | Usage |
|---------|---------|-------|
| WikiArt (Kaggle) | 80k images classées style/genre | Entraînement ML |
| Google Open Images | Embeddings CLIP | Similarité visuelle |
| National Gallery London | 130k métadonnées | Enrichissement |

### Études Marché Clés

- **Baromètre Gece 2024** : 63% Français prévoient visiter autant/plus musées
- **Ministère Culture 2024** : 38,9M entrées musées art France 2022
- **Marché mondial** : $57,2 Mds 2023 → $100 Mds 2032 (+6% CAGR)

---

## 🚀 Quick Wins Immédiats

1. **Déployer sur Vercel/Dokploy** → URL pour Amazon Partenaires
2. **Implémenter filtres hiérarchiques** → UX professionnelle
3. **Ajouter liens affiliation Amazon** → Premiers revenus passifs
4. **PWA manifest complet** → Installation mobile
5. **Tracker analytics basique** → Données pour B2B

---

## 📅 Timeline 2026

| Mois | Milestone | Objectif |
|------|-----------|----------|
| Fév | Phase 1 complète | PWA, filtres, affiliation |
| Mars | Phase 2 | Géoloc, audio IA |
| Avril | Phase 3 | 1000 MAU, premiers revenus |
| Mai-Juin | Phase 4 | Abonnement premium, 50 payants |
| Été | Phase 5 | 2 partenariats musées pilotes |

---

*Document vivant - Mise à jour mensuelle*
