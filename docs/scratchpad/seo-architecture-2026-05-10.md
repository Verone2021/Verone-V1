# Architecture SEO — veronecollections.fr

**Date :** 2026-05-10 (données réelles SEMrush Pro)
**Statut :** Validé — prêt pour implémentation Claude Code
**À lire avec :** `seo-strategy-2026-05-10.md` (stratégie globale + off-page + AI SEO)

---

## Vue d'ensemble : les 4 niveaux du SEO couverts

| Niveau                                           | Statut     | Outil utilisé                       |
| ------------------------------------------------ | ---------- | ----------------------------------- |
| **On-page** — clusters H1/H2/H3 par page         | ✅ Complet | SEMrush Keyword Magic + Keyword Gap |
| **Technique** — sitemap, schema, Core Web Vitals | ✅ Complet | Instructions Claude Code            |
| **Off-page** — backlinks, outreach               | ✅ Complet | SEMrush Backlink Analytics          |
| **AI SEO** — citabilité ChatGPT/Gemini           | ✅ Complet | SEMrush AI Visibility               |

---

## Architecture URL complète — 4 niveaux de profondeur

```
/                                    ← Niveau 0 — Homepage (brand)
├── /catalogue                       ← Niveau 1 — Catalogue global
│   ├── ?categorie=luminaires        ← Niveau 2 — Catégorie produit
│   ├── ?categorie=miroirs           ← Niveau 2
│   ├── ?categorie=vases             ← Niveau 2
│   ├── ?categorie=mobilier          ← Niveau 2
│   ├── ?categorie=textiles          ← Niveau 2
│   └── ?categorie=objets            ← Niveau 2
├── /collections                     ← Niveau 1 — Collections éditoriales
│   ├── /collections/chambre         ← Niveau 2 ⭐ PRIORITÉ 1 SEO
│   ├── /collections/salon           ← Niveau 2 ⭐ PRIORITÉ 2 SEO
│   └── /collections/exterieur       ← Niveau 2 (volume faible)
├── /blog                            ← Niveau 1 — Hub blog
│   ├── /blog/[article-chambre-1]    ← Niveau 3 ⭐ PORTE D'ENTRÉE SEO
│   ├── /blog/[article-chambre-2]    ← Niveau 3
│   ├── /blog/[article-salon-1]      ← Niveau 3
│   ├── /blog/[article-mural-1]      ← Niveau 3
│   └── /blog/[...5 autres]          ← Niveau 3
├── /produit/[slug]                  ← Niveau 3 — Fiche produit (long-tail)
├── /a-propos                        ← Niveau 1 — Brand storytelling
├── /contact                         ← Niveau 1 — Brand
├── /livraison                       ← Niveau 1 — CMS
├── /retours                         ← Niveau 1 — CMS
├── /faq                             ← Niveau 1 — CMS + FAQ schema
├── /cgv                             ← Niveau 1 — Légal
└── /mentions-legales                ← Niveau 1 — Légal
```

---

## SEO ON-PAGE — Clusters complets par page

### NIVEAU 0 — Homepage (`/`)

**Rôle SEO :** Notoriété de marque. Bénéficie de l'autorité remontant des pages profondes. Ne cible pas de keyword générique concurrentiel.

| Balise                 | Contenu                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title (48 car.)        | `Sélection déco et mobilier design — Vérone`                                                                                                             |
| Meta desc (150 car.)   | `Mille pièces vues, cinquante retenues. Sélection déco et mobilier design pour salon et chambre. Chaque pièce choisie pour ce qu'elle fait à un espace.` |
| H1 (sr-only, DOM only) | `Sélection déco et mobilier design — Vérone Collections`                                                                                                 |
| Keyword primaire       | _Aucun — page de marque_                                                                                                                                 |

**Maillage interne :** liens vers `/collections/chambre`, `/collections/salon`, `/blog`, `/catalogue`

---

### NIVEAU 1 — Page Catalogue (`/catalogue`)

| Balise               | Contenu                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Title (55 car.)      | `Catalogue déco design en ligne — Sélection Vérone`                                                                              |
| Meta desc (148 car.) | `Sélection déco et mobilier design : chaque pièce vue, pesée, retenue. Filtre par univers, matière ou budget. Livraison France.` |
| H1 visible           | `Catalogue` + compteur dynamique `[N] pièces`                                                                                    |
| Keywords primaires   | "catalogue déco design en ligne" · "sélection déco design"                                                                       |

---

### NIVEAU 2A — Collection Chambre (`/collections/chambre`) ⭐ PRIORITÉ 1

**Cluster complet : 782 keywords · 16 110 vol/mois · KD moyen 23%**

#### H1 (keyword primaire)

```
Déco chambre adulte — sélection chic et tendance
```

#### H2 — Keywords secondaires (sections de la page)

| H2                                                           | Keyword ciblé                      | Vol/mois | KD% |
| ------------------------------------------------------------ | ---------------------------------- | -------- | --- |
| `Déco chambre cocooning — les pièces qui font la différence` | idée déco chambre adulte cocooning | 720      | 27% |
| `Déco murale chambre — murs et tête de lit`                  | déco murale chambre adulte         | 390      | 18% |
| `Déco chambre chic et design — l'essentiel`                  | déco chambre adulte chic           | 1 000    | 26% |
| `Petite chambre adulte — pièces compactes, impact maximal`   | idée déco petite chambre adulte    | 140      | 14% |

#### H3 — Keywords tertiaires (mentions dans le corps de texte)

- "déco tête de lit chambre adulte" (170, KD 15%)
- "objet déco chambre adulte" (50, KD 21%)
- "tendance déco chambre adulte" (110, KD 16%)
- "déco chambre adulte bohème" (140, KD 21%)
- "déco chambre adulte nature" (140, KD 24%)
- "déco chambre adulte zen" (70, KD 19%)
- "déco chambre adulte 2026" (70) ← mettre à jour chaque année

#### Balises SEO

| Balise               | Contenu                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Title (47 car.)      | `Déco chambre adulte tendance — Sélection Vérone`                                                                   |
| Meta desc (116 car.) | `Sélection déco chambre adulte : luminaires, textiles, objets. Chic, tendance, pensé pour durer. Livraison France.` |
| Canonical            | `https://veronecollections.fr/collections/chambre`                                                                  |

#### Contenu éditorial obligatoire (200 mots min.)

Texte signé "regard Vérone" : pourquoi cette sélection chambre ? Ce qu'une pièce doit faire à l'espace pour entrer. Un point de vue assumé — pas un catalogue descriptif. Utiliser le champ lexical validé (matière, proportion, ce que l'objet fait à l'espace).

#### Schema.org

```json
{
  "@type": "CollectionPage",
  "name": "Déco chambre adulte tendance — Vérone",
  "url": "https://veronecollections.fr/collections/chambre"
}
```

---

### NIVEAU 2A — Collection Salon (`/collections/salon`) ⭐ PRIORITÉ 2

**Cluster complet : 138 keywords · 3 190 vol/mois · KD moyen 23%**

#### H1 (keyword primaire)

```
Déco salon tendance — sélection éditoriale
```

#### H2 — Keywords secondaires

| H2                                              | Keyword ciblé                    | Vol/mois | KD% |
| ----------------------------------------------- | -------------------------------- | -------- | --- |
| `Tendances déco salon 2025-2026`                | tendance déco 2025 salon         | 1 300    | 27% |
| `Couleurs et matières — ce qui marque un salon` | couleur tendance déco 2025 salon | 210      | 25% |
| `Luminaires salon — ce qui change tout`         | luminaire salon design           | 320      | 33% |

#### H3 — Keywords tertiaires

- "suspension luminaire design pour salon" (210, KD 16%)
- "déco salon tendance 2026" (140, KD 19%)
- "déco tendance salon" (70, KD 25%)

#### Balises SEO

| Balise               | Contenu                                                                                                         |
| -------------------- | --------------------------------------------------------------------------------------------------------------- |
| Title (41 car.)      | `Déco salon tendance — Sélection Vérone`                                                                        |
| Meta desc (118 car.) | `Sélection déco salon : pièces choisies pour leur caractère, leur matière, leur présence. Tendances 2025-2026.` |

---

### NIVEAU 2A — Collection Extérieur (`/collections/exterieur`)

Volume France quasi nul. Page SEO passive — présence pour la complétude.

| Title     | `Déco extérieur design — Sélection Vérone`                                            |
| --------- | ------------------------------------------------------------------------------------- |
| Meta desc | `Sélection déco et mobilier d'extérieur. Le même niveau d'exigence qu'à l'intérieur.` |

---

### NIVEAU 2B — Catégories Catalogue (résultats Keyword Gap)

Ces pages sont des filtres URL. Elles ciblent les keywords produit que TCR et Fleux rankent mais pas Vérone. Toutes ont KD ≤ 33%.

#### Luminaires (`/catalogue?categorie=luminaires`)

| H2 / Keyword secondaire                | Vol/mois | KD%    |
| -------------------------------------- | -------- | ------ |
| Lampadaire design                      | 4 400    | 16% 🟢 |
| Lampadaires muraux                     | 1 900    | 17% 🟢 |
| Applique murale design                 | 1 900    | 24% 🟢 |
| Lampe bureau                           | 12 100   | 27% 🟢 |
| Luminaire salon design                 | 320      | 33% 🟡 |
| Suspension luminaire design pour salon | 210      | 16% 🟢 |

Title : `Luminaires design — Sélection Vérone` | Meta : `Lampadaires, appliques, suspensions : luminaires design sélectionnés pour leur présence. Livraison France.`

#### Miroirs (`/catalogue?categorie=miroirs`)

| H2 / Keyword secondaire | Vol/mois | KD%    |
| ----------------------- | -------- | ------ |
| Miroir mural            | 12 100   | 32% 🟡 |
| Miroir original         | 1 300    | 31% 🟡 |
| Déco miroir mural       | 1 600    | 19% 🟢 |

Title : `Miroirs design — Sélection Vérone` | Meta : `Miroirs muraux et à poser : pièces sélectionnées pour leur caractère. Formes, matières, proportions.`

#### Vases & objets (`/catalogue?categorie=vases`)

| H2 / Keyword secondaire | Vol/mois | KD%    |
| ----------------------- | -------- | ------ |
| Vase design             | 1 900    | 24% 🟢 |
| Vase en céramique       | 1 900    | 28% 🟢 |
| Vase ceramique          | 1 000    | 12% 🟢 |

Title : `Vases et objets déco design — Sélection Vérone`

#### Mobilier (`/catalogue?categorie=mobilier`)

| H2 / Keyword secondaire | Vol/mois | KD%    |
| ----------------------- | -------- | ------ |
| Table basse dorée       | 1 600    | 22% 🟢 |
| Table de chevet au mur  | 1 300    | 22% 🟢 |

#### Accessoires/textiles (`/catalogue?categorie=accessoires`)

| H2 / Keyword secondaire    | Vol/mois | KD%    |
| -------------------------- | -------- | ------ |
| Patère murale              | 1 600    | 18% 🟢 |
| Porte-manteau design mural | 1 000    | 15% 🟢 |
| Objet design               | 1 600    | 28% 🟢 |

---

### NIVEAU 3 — Blog Articles (8 articles, plan complet)

Le blog est la **porte d'entrée SEO principale** du site au lancement. Les articles redirigent vers les pages collections par un CTA et des liens internes vers les produits pertinents.

#### Article 1 — `/blog/deco-chambre-adulte-tendance-2025-2026`

**Keyword primaire :** "déco chambre adulte tendance" (1 000 vol, KD 25%)
**H1 :** `Déco chambre adulte tendance 2025-2026 — ce qui marque vraiment un espace`
**H2 secondaires :**

- "déco chambre adulte cocooning" (720, KD 27%)
- "déco chambre adulte chic" (1 000, KD 26%)
- "objet déco chambre adulte" (50, KD 21%)
  **H3 tertiaires :** matières (lin, laiton, travertin), styles (nature, bohème, épuré)
  **Title :** `Déco chambre adulte tendance 2025-2026 — Guide Vérone`
  **CTA vers :** `/collections/chambre`

#### Article 2 — `/blog/idees-deco-chambre-adulte-cocooning`

**Keyword primaire :** "idée déco chambre adulte cocooning" (720 vol, KD 27%)
**H1 :** `Idées déco chambre adulte cocooning — 8 pièces qui changent l'ambiance`
**H2 secondaires :** "déco chambre cosy" · "déco chambre adulte nature"
**CTA vers :** `/collections/chambre`

#### Article 3 — `/blog/tendances-deco-salon-2025`

**Keyword primaire :** "tendance déco 2025 salon" (1 300 vol, KD 27%)
**H1 :** `Tendances déco salon 2025 — un regard sur ce qui restera`
**H2 secondaires :**

- "couleur tendance déco 2025 salon" (210, KD 25%)
- "tendance déco salon 2026" (140, KD 19%)
- "luminaire salon design" (320, KD 33%)
  **CTA vers :** `/collections/salon`

#### Article 4 — `/blog/decoration-murale-bois`

**Keyword primaire :** "décoration murale bois" (3 600 vol, KD 24%)
**H1 :** `Décoration murale bois — 10 pièces avec un vrai caractère`
**H2 secondaires :**

- "tableau décoration salon" (2 400, KD 22%)
- "décoration murale originale" (1 600, KD 21%)
- "art mural" (880, KD 22%)
  **CTA vers :** `/catalogue?categorie=objets` + `/collections/salon`

#### Article 5 — `/blog/idees-deco-entree-maison`

**Keyword primaire :** "idée déco entrée maison" (480 vol, KD 27%)
**H1 :** `Idées déco entrée maison — ce qui fait une bonne première impression`
**H2 secondaires :** "patère murale" (1 600, KD 18%) · "miroir entrée" · "objet design entrée"
**CTA vers :** `/catalogue?categorie=accessoires`

#### Article 6 — `/blog/tableau-decoration-salon`

**Keyword primaire :** "tableau décoration salon" (2 400 vol, KD 22%)
**H1 :** `Tableau décoration salon — comment choisir avec un vrai point de vue`
**H2 secondaires :**

- "décoration murale design" (1 600, KD 35%)
- "art mural" (880, KD 22%)
  **CTA vers :** `/collections/salon`

#### Article 7 — `/blog/idees-cadeaux-deco-maison`

**Keyword primaire :** "idée cadeau déco maison" (170 vol, KD 10%)
**H1 :** `Idées cadeaux déco maison — des pièces qui durent`
**Angle :** intentionnellement éditorial, pas un guide shopping générique

#### Article 8 — `/blog/tendances-deco-maison-2026`

**Keyword primaire :** "tendance déco maison 2026" (140 vol, KD 20%)
**H1 :** `Tendances déco maison 2026 — ce qu'on voit venir`

---

### NIVEAU 3 — Fiches Produit (`/produit/[slug]`)

**Stratégie :** long-tail naturel basé sur le nom produit + matière + usage + pièce.

Format URL : `/produit/[nom-produit-kebab-case]`

| Balise           | Règle                                                                           |
| ---------------- | ------------------------------------------------------------------------------- |
| Title            | `[Nom produit] — [Catégorie] design · Vérone`                                   |
| Meta desc        | Description éditoriale 120-150 car. (depuis champ `editorial_note` back-office) |
| H1               | Nom produit complet                                                             |
| H2               | "Pourquoi cette pièce" (texte éditorial obligatoire)                            |
| Long-tail captés | `[matière] + [catégorie] + [usage]` ex: "lampe laiton chambre adulte"           |

**Schema.org Product obligatoire :**

```json
{
  "@type": "Product",
  "name": "...",
  "image": "...",
  "offers": {
    "@type": "Offer",
    "price": "...",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock"
  }
}
```

**Maillage interne :** chaque fiche → lien vers la collection correspondante + lien vers l'article blog pertinent.

---

## SEO TECHNIQUE — Checklist Claude Code

### Fichiers obligatoires au lancement

```typescript
// sitemap.ts — priorités par niveau
homepage: 1.0 | collections: 0.9 | catalogue: 0.8 | blog: 0.7 | fiches: 0.7 | legal: 0.3
```

```
# robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /compte/
Disallow: /admin/
Sitemap: https://veronecollections.fr/sitemap.xml
```

### Core Web Vitals — cibles

- LCP < 2.5s → `next/image` avec `priority` sur hero + images above-the-fold
- CLS = 0 → dimensions d'image toujours déclarées dans le layout
- INP < 200ms → pas de JS bloquant sur pages collections
- Lighthouse Performance ≥ 90 (cible 100)

### Schema.org — mapping complet

| Page                | @type                    |
| ------------------- | ------------------------ |
| Homepage            | Organization             |
| Collections         | CollectionPage           |
| Catalogue catégorie | CollectionPage           |
| Fiche produit       | Product + BreadcrumbList |
| Blog article        | Article + BreadcrumbList |
| FAQ                 | FAQPage (schema Q&A)     |
| Contact             | ContactPage              |

### FAQ Schema — page `/faq` (signal AI SEO)

Questions à structurer en schema `FAQPage` :

- "Quelles sont les meilleures boutiques déco en ligne en France ?" → réponse inclut Vérone
- "Comment choisir un luminaire design pour son salon ?"
- "Qu'est-ce qu'un concept store déco ?"
- "Vérone livre-t-il dans toute la France ?"

---

## SEO OFF-PAGE — Plan d'action

### Benchmark concurrents

| Concurrent                 | Ref. Domains            | Authority Score | .fr domains |
| -------------------------- | ----------------------- | --------------- | ----------- |
| The Cool Republic          | 2 300                   | 37              | 284 (12%)   |
| Fleux                      | ~2 000                  | 37              | Non mesuré  |
| **Vérone (objectif an 1)** | **100-150 .fr qualité** | **Viser 25-30** | **100%**    |

### Stratégie brisure de liens (SEMrush off-page)

Méthode : identifier les backlinks brisés (404) sur les sites qui mentionnent TCR ou Fleux, proposer un contenu Vérone en remplacement.

Domaines prioritaires à surveiller : thesocialitefamily.com, milkdecoration.com, decocrush.fr, lebonbonparis.com

### Outreach presse — cibles prioritaires

| Média                               | Authority Score estimé | Angle                                                    |
| ----------------------------------- | ---------------------- | -------------------------------------------------------- |
| Elle Décoration (elledecoration.fr) | ~70                    | "Nos coups de cœur" — envoyer 3 pièces + brief éditorial |
| Côté Maison (cotemaisn.fr)          | ~60                    | "Shopping sélection"                                     |
| AD Magazine France (ad-magazine.fr) | ~60                    | "Découverte concept store"                               |
| Marie Claire Maison                 | ~65                    | "Boutique en ligne" sélection                            |
| The Socialite Family                | ~45                    | Collaboration shooting déco                              |
| Milk Decoration                     | ~40                    | Article invité ou sélection produits                     |

**Angle universel :** "concept store éditorial — moins de 100 pièces, chacune choisie pour un vrai point de vue. Pas un catalogue." La rareté est l'argument éditorial.

---

## AI SEO — Plan d'action

### Benchmark

|                     | AI Visibility   | ChatGPT mentions | Gemini mentions |
| ------------------- | --------------- | ---------------- | --------------- |
| The Cool Republic   | 42              | 693              | 441             |
| Fleux               | 36              | n/a              | n/a             |
| **Vérone objectif** | **>30 en an 1** | **200+**         | **100+**        |

### Actions concrètes

1. **Page À-propos ultra-citeable** — description canonique de la marque répétée identiquement sur tous les canaux : "Vérone est un concept store éditorial déco et mobilier en ligne. Moins de 100 pièces sélectionnées à la fois, chacune choisie pour ce qu'elle fait à un espace."

2. **FAQ schema sur la homepage et /faq** — les IA utilisent les FAQ pour répondre aux questions "quelles boutiques déco en ligne ?"

3. **Articles blog citeables** — chaque article doit contenir des données factuelles (chiffres, sélections numérotées, ratios) que les IA peuvent citer verbatim.

4. **Cohérence cross-sources** — même description sur : Google Business, Pinterest, Instagram bio, Trustpilot, LinkedIn. Les IA triangulent les informations.

5. **Mentions presse** — un article Elle Déco ou AD qui cite Vérone = signal fort pour les IA (elles indexent ces sources).
