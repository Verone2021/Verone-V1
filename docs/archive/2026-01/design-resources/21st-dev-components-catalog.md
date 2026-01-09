# Catalogue Composants 21st.dev - Verone

> **Document de Reference Design**
> Source: https://21st.dev
> Date: 2026-01-06
> Applications cibles: LinkMe, Site Internet, Back-Office

---

## Table des Matieres

1. [Cartes & Globes (Maps)](#1-cartes--globes-maps)
2. [Heroes & Landing](#2-heroes--landing)
3. [Backgrounds & Animations](#3-backgrounds--animations)
4. [Images & Galleries](#4-images--galleries)
5. [Carousels & Logos](#5-carousels--logos)
6. [Scroll Animations](#6-scroll-animations)
7. [Cards UI](#7-cards-ui)
8. [Buttons](#8-buttons)
9. [Features Sections](#9-features-sections)
10. [Testimonials](#10-testimonials)
11. [Typography & Texts](#11-typography--texts)
12. [Pricing Sections](#12-pricing-sections)
13. [Installation](#installation)
14. [Plan Implementation](#plan-implementation)

---

## 1. CARTES & GLOBES (Maps)

**URL Section**: https://21st.dev/s/map

### Composants Disponibles

| Composant                 | Auteur        | URL                                                     | Description                                                                | Usage Recommande                                       |
| ------------------------- | ------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| **World Map**             | Aceternity UI | https://21st.dev/aceternity/world-map/default           | Carte mondiale avec lignes de connexion animees entre points geographiques | **LinkMe** - Visualiser connexions entre organisations |
| **Globe**                 | Magic UI      | https://21st.dev/magicui/globe/default                  | Globe 3D interactif rotatif avec points de localisation                    | Site Internet - Section "presence mondiale"            |
| **Interactive Map**       | scott clayton | https://21st.dev/Scottclayton3d/interactive-map/default | Carte interactive cliquable avec regions                                   | **LinkMe** - Carte Europe organisations                |
| **Globe Feature Section** | Ruixen UI     | https://21st.dev/ruixenui/globe-feature-section/default | Section marketing avec globe integre                                       | Site Internet - Landing page                           |
| **Location Tag**          | Jatin Yadav   | https://21st.dev/jatin-yadav05/location-tag/default     | Tags de localisation animes avec pulse                                     | LinkMe - Marqueurs organisations                       |
| **Expand Map**            | Jatin Yadav   | https://21st.dev/jatin-yadav05/expand-map/default       | Carte expandable au clic                                                   | Site Internet - Section contact                        |
| **Orbiting Skills**       | Sera UI       | https://21st.dev/seraui/orbiting-skills/default         | Elements en orbite autour d'un centre                                      | LinkMe - Dashboard visualisation                       |

### Recommandation Prioritaire

- **Pour LinkMe (Carte Europe)**: `World Map` (Aceternity) ou `Interactive Map` (scott clayton)
- **Pour Site Internet**: `Globe` (Magic UI) pour effet "presence internationale"

---

## 2. HEROES & LANDING

**URL Section**: https://21st.dev/s/hero

### Composants Disponibles

| Composant                  | Auteur            | URL                                | Description                                               | Usage Recommande              |
| -------------------------- | ----------------- | ---------------------------------- | --------------------------------------------------------- | ----------------------------- |
| **Hero Particules**        | Jatin Yadan       | https://21st.dev/jatin-yadan/hero  | "Welcome to JatinVerse" - Fond etoiles/particules animees | **Site Internet** - Hero luxe |
| **Elevate Digital Vision** | Kokonut UI        | https://21st.dev/kokonutui/hero    | Hero sombre minimaliste avec texte gradient               | LinkMe - Landing              |
| **Transform Ideas**        | KirkMichael Terko | https://21st.dev/s/hero            | Hero avec effet gradient lumineux                         | Site Internet - A propos      |
| **Animated Gradient**      | Shadowblocks      | https://21st.dev/shadowblocks/hero | Hero avec gradient anime                                  | Site Internet - Contact       |
| **Digital Workshop**       | Shadowblocks      | https://21st.dev/shadowblocks/hero | Hero bleu bold avec CTA                                   | Back-Office - Login           |
| **Component Platform**     | Ali Imran         | https://21st.dev/s/hero            | Hero minimaliste avec animation stylo                     | Site Internet - Collections   |

### Recommandation Prioritaire

- **Site Internet**: Hero avec **particules/etoiles** pour ambiance luxe moderne
- **LinkMe**: Hero **minimaliste sombre** pour professionnalisme B2B

---

## 3. BACKGROUNDS & ANIMATIONS

**URL Section**: https://21st.dev/s/background

### Composants Disponibles

| Composant                    | Auteur           | URL                                               | Description                                   | Usage Recommande                     |
| ---------------------------- | ---------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------------ |
| **Shooting Stars Effect**    | Aceternity UI    | https://21st.dev/aceternity/shooting-stars-effect | Etoiles filantes animees sur fond sombre      | **LinkMe** - Dashboard background    |
| **Dynamic Stars Background** | Aceternity UI    | https://21st.dev/aceternity/stars-background      | Fond etoile dynamique interactif avec curseur | LinkMe - Page d'accueil              |
| **Background Circles**       | Kokonut UI       | https://21st.dev/kokonutui/background-circles     | Cercles concentriques animes (rouge/sombre)   | Site Internet - Section premium      |
| **Background Paths**         | Kokonut UI       | https://21st.dev/kokonutui/background-paths       | Chemins/lignes animes fluides                 | **Site Internet** - Parcours client  |
| **Wavy Background**          | lukascho         | https://21st.dev/lukascho/wavy-background         | Fond ondule organique                         | Site Internet - Sections transitions |
| **Glow Effect**              | Mikołaj Dobrucki | https://21st.dev/s/background                     | Effet de lueur/halo anime                     | LinkMe - Cards highlight             |

### Recommandation Prioritaire

- **LinkMe**: `Dynamic Stars` (evoque reseau/connexions)
- **Site Internet**: `Background Paths` (evoque parcours client luxe)

---

## 4. IMAGES & GALLERIES

**URL Section**: https://21st.dev/s/image

### Composants Disponibles

| Composant              | Auteur         | URL                                                     | Description                                           | Usage Recommande                                   |
| ---------------------- | -------------- | ------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| **Img Sphere**         | Tony Sebastian | https://21st.dev/tonyzebastian/img-sphere/default       | Sphere 3D d'images (Fibonacci), drag-rotate, momentum | **LinkMe** - DEJA IMPLEMENTE                       |
| **Image Comparison**   | Tommy Jensen   | https://21st.dev/tommy-jepsen/image-comparison          | Slider avant/apres pour comparer 2 images             | **Site Internet** - Produits (avant/apres montage) |
| **Stacked Cards**      | Chetan Verma   | https://21st.dev/chetan-verma/stacked-cards-interaction | Cartes empilees interactives avec swipe               | Site Internet - Collections produits               |
| **Image Trail**        | Daniel Petho   | https://21st.dev/daniel-petho/image-trail               | Effet trainee d'images au mouvement curseur           | Site Internet - Page catalogue hover               |
| **Circular Heading**   | Anurag Mishra  | https://21st.dev/anurag-mishra/circular-heading         | Texte rotatif circulaire autour image centrale        | Site Internet - Hero secondaire                    |
| **Hover Zoom Gallery** | Anurag Mishra  | https://21st.dev/anurag-mishra/gallery                  | Galerie avec zoom au hover                            | Site Internet - Produits                           |
| **Albums Layout**      | Aceternity UI  | https://21st.dev/aceternity/albums                      | Layout album photo style Spotify                      | Site Internet - Collections                        |

### Recommandation Prioritaire

- **Site Internet**: `Image Comparison` (avant/apres montage produit), `Stacked Cards` (collections)
- **LinkMe**: `Img Sphere` (deja fait!)

---

## 5. CAROUSELS & LOGOS

**URL Section**: https://21st.dev/s/carousel

### Composants Disponibles

| Composant                    | Auteur       | URL                                                 | Description                                          | Usage Recommande                        |
| ---------------------------- | ------------ | --------------------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| **Logo Carousel**            | cult UI      | https://21st.dev/cult-ui/logo-carousel              | Carousel logos "Trusted by" avec defilement infini   | **Site Internet** - Section partenaires |
| **Logo Carousel Prism**      | Prism UI     | https://21st.dev/prism-ui/logo-carousel             | "The best are already here" - Logos avec fond sombre | Site Internet - Footer partenaires      |
| **Gallery with Image Cards** | Shadowblocks | https://21st.dev/shadowblocks/gallery-image-cards   | Galerie carousel avec cartes images                  | **Site Internet** - Cross-sell produits |
| **Cards Infinite Scroll**    | Tommy Jepsen | https://21st.dev/tommy-jepsen/cards-infinite-scroll | Cartes avec scroll infini horizontal                 | LinkMe - Produits recents               |
| **Carousel Image Cards**     | Tommy Jepsen | https://21st.dev/tommy-jepsen/carousel-image-cards  | Carousel standard avec navigation fleches            | Site Internet - Produits similaires     |
| **Case Studies Carousel**    | Shadowblocks | https://21st.dev/shadowblocks/case-studies          | Carousel etudes de cas avec grandes images           | Site Internet - Realisations clients    |

### Recommandation Prioritaire

- **Site Internet**: `Logo Carousel` (partenaires/marques), `Gallery Image Cards` (cross-sell)
- **LinkMe**: `Cards Infinite Scroll` (produits catalogue)

---

## 6. SCROLL ANIMATIONS

**URL Section**: https://21st.dev/s/scroll-area

### Composants Disponibles

| Composant                       | Auteur            | URL                                                    | Description                                                | Usage Recommande                        |
| ------------------------------- | ----------------- | ------------------------------------------------------ | ---------------------------------------------------------- | --------------------------------------- |
| **Scroll Animations Container** | Aceternity UI     | https://21st.dev/aceternity/container-scroll-animation | "Unleash the power of Scroll Animations" - Conteneur anime | **Site Internet** - Landing sections    |
| **Text Reveal**                 | Magic UI          | https://21st.dev/magicui/text-reveal                   | "Magic UI will change" - Revelation texte au scroll        | **Site Internet** - Storytelling marque |
| **Timeline**                    | Aceternity UI     | https://21st.dev/aceternity/timeline                   | Chronologie verticale animee "Early 2023"                  | Site Internet - A propos/Histoire       |
| **Sticky Scroll Reveal**        | Aceternity UI     | https://21st.dev/aceternity/sticky-scroll-reveal       | Elements qui se revelent en sticky scroll                  | Site Internet - Features produits       |
| **Scroll Progress**             | Motion Primitives | https://21st.dev/motion-primitives/scroll-progress     | Barre de progression lecture page                          | Site Internet - Articles blog           |
| **Parallax Scroll**             | Aceternity UI     | https://21st.dev/aceternity/parallax-scroll            | Effet parallaxe profondeur au scroll                       | **Site Internet** - Hero luxe           |
| **Blur Based Velocity**         | Magic UI          | https://21st.dev/magicui/blur-velocity                 | Effet blur base sur vitesse scroll                         | Site Internet - Transitions sections    |
| **Scroll Carousel**             | Various           | https://21st.dev/s/scroll-area                         | Carousel declenche au scroll                               | Site Internet - Galerie produits        |

### Recommandation Prioritaire

- **Site Internet**: `Text Reveal` + `Parallax` (storytelling luxe), `Timeline` (histoire marque)
- **LinkMe**: `Scroll Progress` (lecture commissions)

---

## 7. CARDS UI

**URL Section**: https://21st.dev/s/card

### Composants Disponibles

| Composant               | Auteur            | URL                                            | Description                              | Usage Recommande                      |
| ----------------------- | ----------------- | ---------------------------------------------- | ---------------------------------------- | ------------------------------------- |
| **Glow Effect Card**    | Motion Primitives | https://21st.dev/motion-primitives/glow-effect | Carte avec effet lueur/halo au hover     | **Site Internet** - Produits premium  |
| **Smoke Effect Card**   | Jatin Yadan       | https://21st.dev/jatin-yadan/smoke-effect      | Carte avec effet fumee/particules        | Site Internet - Collections speciales |
| **Animated Tabs**       | Chetan Verma      | https://21st.dev/chetan-verma/animated-tabs    | Onglets avec animation transition fluide | **LinkMe** - Filtres catalogue        |
| **Skewed Card**         | Kokonut UI        | https://21st.dev/kokonutui/skewed-card         | Carte inclinee 3D au hover               | Site Internet - Mise en avant         |
| **Blinker Card**        | Kokonut UI        | https://21st.dev/kokonutui/blinker-card        | Carte avec effet clignotement bordure    | LinkMe - Notifications/alertes        |
| **Interactive Element** | Kokonut UI        | https://21st.dev/kokonutui/interactive-element | Elements interactifs modulaires          | Back-Office - Dashboard               |
| **Magic Card**          | Serafin           | https://21st.dev/serafin/magic-card            | Carte avec effet magique/brillant        | Site Internet - Produits vedettes     |
| **GitHub Card**         | Various           | https://21st.dev/s/card                        | Carte style GitHub avec interactions     | LinkMe - Infos organisation           |

### Recommandation Prioritaire

- **Site Internet**: `Glow Effect` (produits premium), `Smoke Effect` (collections)
- **LinkMe**: `Animated Tabs` (navigation), `Blinker Card` (notifications)

---

## 8. BUTTONS

**URL Section**: https://21st.dev/s/button

### Composants Disponibles

| Composant                 | Auteur        | URL                                            | Description                                    | Usage Recommande                  |
| ------------------------- | ------------- | ---------------------------------------------- | ---------------------------------------------- | --------------------------------- |
| **Button Colorful Hover** | Kokonut UI    | https://21st.dev/kokonutui/button-colorful     | "Explore Components" - Gradient anime au hover | **Site Internet** - CTA principal |
| **Hold and Release**      | Kokonut UI    | https://21st.dev/kokonutui/hold-release-button | Bouton "Release" avec interaction hold         | Site Internet - Confirmations     |
| **Magnetize Button**      | Kokonut UI    | https://21st.dev/kokonutui/magnetize-button    | "Hover me" - Effet magnetique curseur          | Site Internet - CTAs ludiques     |
| **Particle Button**       | Kokonut UI    | https://21st.dev/kokonutui/particle-button     | "Click me!" - Particules au clic               | Site Internet - Actions speciales |
| **FlipButton**            | LN            | https://21st.dev/ln/flip-button                | "Submit" - Effet flip au clic                  | LinkMe - Formulaires              |
| **Button Origin**         | Origin UI     | https://21st.dev/origin-ui/button              | Bouton noir minimaliste propre                 | **LinkMe** - Actions standards    |
| **Win 98 Button**         | Fathul Irfaan | https://21st.dev/fathul-irfaan/win98-button    | Style retro Windows 98                         | Easter egg / Fun                  |
| **Gradient Button**       | Ali Imam      | https://21st.dev/ali-imam/greadients           | Boutons avec gradients multiples               | Site Internet - Variations CTAs   |

### Recommandation Prioritaire

- **Site Internet**: `Button Colorful Hover` (CTA), `Magnetize Button` (interactions)
- **LinkMe**: `Button Origin` (clean pro), `FlipButton` (formulaires)

---

## 9. FEATURES SECTIONS

**URL Section**: https://21st.dev/s/features

### Composants Disponibles

| Composant              | Auteur        | URL                                         | Description                               | Usage Recommande                      |
| ---------------------- | ------------- | ------------------------------------------- | ----------------------------------------- | ------------------------------------- |
| **Bento Grid**         | Kokonut UI    | https://21st.dev/kokonutui/bento-grid       | Grille bento asymetrique pour features    | **Site Internet** - Services/Features |
| **Features 036**       | Shadowblocks  | https://21st.dev/shadowblocks/features-036  | "Collection Components Shadcn & Tailwind" | Site Internet - Page features         |
| **Features Tab**       | Shadowblocks  | https://21st.dev/shadowblocks/features-tab  | Features avec onglets et images           | **Site Internet** - Produits details  |
| **Gallery with Cards** | Shadowblocks  | https://21st.dev/shadowblocks/gallery-cards | Galerie features avec cartes              | Site Internet - Collections           |
| **Case Studies**       | Shadowblocks  | https://21st.dev/shadowblocks/case-studies  | Section etudes de cas avec images         | Site Internet - Realisations          |
| **Edgeroom Card**      | Aceternity UI | https://21st.dev/aceternity/edgeroom-card   | Carte avec effet "hover" bordure          | LinkMe - Features dashboard           |
| **Features Cards**     | Prism UI      | https://21st.dev/prism-ui/features-cards    | Cartes features minimalistes              | Back-Office - Features list           |

### Recommandation Prioritaire

- **Site Internet**: `Bento Grid` (services), `Features Tab` (details produits)
- **LinkMe**: `Edgeroom Card` (dashboard features)

---

## 10. TESTIMONIALS

**URL Section**: https://21st.dev/s/testimonials

### Composants Disponibles

| Composant                 | Auteur              | URL                                               | Description                                | Usage Recommande                    |
| ------------------------- | ------------------- | ------------------------------------------------- | ------------------------------------------ | ----------------------------------- |
| **Animated Testimonials** | Aceternity UI       | https://21st.dev/aceternity/animated-testimonials | Testimonials avec animations entree/sortie | **Site Internet** - Page principale |
| **Testimonial Marquee**   | Serafin             | https://21st.dev/serafin/testimonial-marquee      | Testimonials defilants en marquee          | Site Internet - Footer              |
| **Testimonials Grid**     | HextaUI             | https://21st.dev/hextaui/testimonials             | Grid testimonials avec etoiles             | **Site Internet** - Page avis       |
| **Testimonial Card**      | Anurag Mishra       | https://21st.dev/anurag-mishra/testimonial        | Carte testimonial classique "John Doe"     | Site Internet - Singles             |
| **3 Content Card**        | Kokonut UI          | https://21st.dev/kokonutui/content-card           | Carte contenu structure avec liste         | LinkMe - Infos organisations        |
| **Testimonials Cards**    | Vaibhav Kumar Singh | https://21st.dev/vaibhav-kumar-singh/testimonials | Cards avec gradient bleu premium           | Site Internet - VIP section         |
| **Trusted by Developers** | Various             | https://21st.dev/s/testimonials                   | Section avatars "Trusted worldwide"        | Site Internet - Social proof        |

### Recommandation Prioritaire

- **Site Internet**: `Animated Testimonials` (principal), `Testimonial Marquee` (footer), `Testimonials Grid` (page dediee)

---

## 11. TYPOGRAPHY & TEXTS

**URL Section**: https://21st.dev/s/text

### Composants Disponibles

| Composant                   | Auteur            | URL                                                    | Description                           | Usage Recommande                   |
| --------------------------- | ----------------- | ------------------------------------------------------ | ------------------------------------- | ---------------------------------- | -------------------------------- |
| **Typewriter Text**         | HextaUI           | https://21st.dev/hextaui/typewriter-text               | "Welcome to HextaUI                   | " - Effet machine a ecrire         | **Site Internet** - Hero tagline |
| **Animated Shiny Text**     | Anurag Mishra     | https://21st.dev/anurag-mishra/animated-shiny-text     | Texte brillant/shiny anime            | **Site Internet** - Titres premium |
| **Text Rewind**             | Kokonut UI        | https://21st.dev/kokonutui/text-rewind                 | "Rewind" - Effet glitch/rewind        | Site Internet - Effets speciaux    |
| **Animated Text**           | Anurag Mishra     | https://21st.dev/anurag-mishra/animated-text           | "Mishra Hub" - Texte anime basique    | Site Internet - Transitions        |
| **Animated Underline**      | Anurag Mishra     | https://21st.dev/anurag-mishra/animated-underline-text | "Namaste World!" - Soulignement anime | Site Internet - Links hover        |
| **Hand Writing Text**       | Kokonut UI        | https://21st.dev/kokonutui/hand-writing-text           | Effet ecriture manuscrite progressive | Site Internet - Signatures         |
| **Wave Text**               | Kokonut UI        | https://21st.dev/kokonutui/wave-text                   | Texte avec ondulation caractere       | Site Internet - Titres animes      |
| **Circular Reveal Heading** | Anurag Mishra     | https://21st.dev/anurag-mishra/circular-reveal-heading | Revelation texte circulaire           | Site Internet - Hero impact        |
| **Text Loop**               | Motion Primitives | https://21st.dev/motion-primitives/text-loop           | Boucle de texte rotative              | Site Internet - Annonces           |

### Recommandation Prioritaire

- **Site Internet**: `Typewriter Text` (hero), `Animated Shiny Text` (titres luxe), `Wave Text` (accents)
- **LinkMe**: `Text Loop` (notifications), `Animated Underline` (navigation)

---

## 12. PRICING SECTIONS

**URL Section**: https://21st.dev/s/pricing-section

### Composants Disponibles

| Composant                 | Auteur              | URL                                               | Description                                  | Usage Recommande                  |
| ------------------------- | ------------------- | ------------------------------------------------- | -------------------------------------------- | --------------------------------- |
| **Pricing Interaction**   | LN                  | https://21st.dev/ln/pricing-interaction           | Toggle mensuel/annuel avec Free/Starter/Pro  | Site Internet - Offres            |
| **Creative Pricing**      | Kokonut UI          | https://21st.dev/kokonutui/creative-pricing       | "Make Short Videos That Pop" - Style creatif | Site Internet - Services creatifs |
| **Pricing Divmission**    | Anurag Mishra       | https://21st.dev/anurag-mishra/pricing-divmission | "Choose Your Perfect Plan" - Colore          | Site Internet - Plans             |
| **Pricing 3 Columns**     | Shadowblocks        | https://21st.dev/shadowblocks/pricing-3           | Layout 3 colonnes clean                      | Site Internet - Comparaison       |
| **Simple Transparent**    | Kokonut UI          | https://21st.dev/kokonutui/pricing-section        | "$9/$15/$49" - Simple et transparent         | Site Internet - SaaS style        |
| **Best Creative Pricing** | Vaibhav Kumar Singh | https://21st.dev/vaibhav-kumar-singh/pricing      | Gradient noir avec "Contact us"              | Site Internet - Enterprise        |
| **Pricing Cards**         | Kokonut UI          | https://21st.dev/kokonutui/pricing-cards          | Cartes pricing modulaires                    | Site Internet - Options           |

### Recommandation Prioritaire

- **Site Internet**: `Pricing Interaction` (toggle), `Pricing 3 Columns` (comparaison claire)

---

## Installation

### Methode Standard (shadcn CLI)

```bash
# Format general
npx shadcn@latest add https://21st.dev/r/[author]/[component]

# Exemples concrets
npx shadcn@latest add https://21st.dev/r/aceternity/world-map
npx shadcn@latest add https://21st.dev/r/magicui/globe
npx shadcn@latest add https://21st.dev/r/kokonutui/button-colorful
npx shadcn@latest add https://21st.dev/r/tommy-jepsen/image-comparison
```

### Dependances Communes

| Dependance                | Usage                   | Installation                                          |
| ------------------------- | ----------------------- | ----------------------------------------------------- |
| **framer-motion**         | Animations              | `pnpm add framer-motion`                              |
| **three**                 | 3D (Globe, Map)         | `pnpm add three @react-three/fiber @react-three/drei` |
| **tailwindcss**           | Styling                 | Deja installe                                         |
| **clsx / tailwind-merge** | Classes conditionnelles | Deja installe                                         |

### Notes Techniques

- **RSC Compatibility**: Verifier `"use client"` pour composants avec animations
- **Next.js 15**: Compatible App Router
- **Tailwind**: Ajouter les keyframes personnalises dans `tailwind.config.js`

---

## Plan Implementation

### Phase 1: Site Internet (Priorite Haute)

| Composant         | Objectif            | Fichier Cible                                                 |
| ----------------- | ------------------- | ------------------------------------------------------------- |
| Logo Carousel     | Section partenaires | `apps/site-internet/src/components/sections/Partners.tsx`     |
| Scroll Animations | Engagement landing  | `apps/site-internet/src/app/page.tsx`                         |
| Text Reveal       | Storytelling        | `apps/site-internet/src/components/sections/Story.tsx`        |
| Testimonials Grid | Social proof        | `apps/site-internet/src/components/sections/Testimonials.tsx` |
| Image Comparison  | Produits            | `apps/site-internet/src/app/produit/[id]/components/`         |

### Phase 2: LinkMe (Priorite Moyenne)

| Composant                   | Objectif                           | Fichier Cible                                      |
| --------------------------- | ---------------------------------- | -------------------------------------------------- |
| World Map / Interactive Map | Visualisation organisations Europe | `apps/linkme/src/components/maps/EuropeMap.tsx`    |
| Dynamic Stars Background    | Page d'accueil                     | `apps/linkme/src/app/(main)/page.tsx`              |
| Animated Tabs               | Navigation catalogue               | `apps/linkme/src/app/(main)/catalogue/components/` |
| Glow Effect Cards           | Produits premium                   | `apps/linkme/src/components/ui/ProductCard.tsx`    |

### Phase 3: Enrichissements (Priorite Basse)

| Composant        | Objectif        | Fichier Cible                                                      |
| ---------------- | --------------- | ------------------------------------------------------------------ |
| Timeline         | Histoire Verone | `apps/site-internet/src/app/a-propos/page.tsx`                     |
| Typewriter Text  | Hero tagline    | `apps/site-internet/src/components/sections/HeroSection.tsx`       |
| Gallery Carousel | Cross-sell      | `apps/site-internet/src/app/produit/[id]/components/CrossSell.tsx` |

---

## Liens Rapides

| Categorie        | URL Direct                                          |
| ---------------- | --------------------------------------------------- |
| Maps             | https://21st.dev/s/map                              |
| Heroes           | https://21st.dev/s/hero                             |
| Backgrounds      | https://21st.dev/s/background                       |
| Images           | https://21st.dev/s/image                            |
| Carousels        | https://21st.dev/s/carousel                         |
| Scroll Areas     | https://21st.dev/s/scroll-area                      |
| Cards            | https://21st.dev/s/card                             |
| Buttons          | https://21st.dev/s/button                           |
| Features         | https://21st.dev/s/features                         |
| Testimonials     | https://21st.dev/s/testimonials                     |
| Texts            | https://21st.dev/s/text                             |
| Pricing          | https://21st.dev/s/pricing-section                  |
| **Best of Week** | https://21st.dev/community/components/week/2026-W02 |
| **Feed**         | https://21st.dev/community/feed                     |

---

## Notes Importantes

1. **Sphere 3D**: Deja implementee sur LinkMe via `tonyzebastian/img-sphere`
2. **Carte Europe**: Priorite pour visualiser les organisations clients
3. **Scroll Animations**: Essentielles pour le site e-commerce luxe
4. **Logo Carousel**: Social proof pour credibilite marque

---

---

## OUTILS 21st.dev (Tools & Legacy Tools)

### A. MAGIC MCP - Serveur MCP pour Claude Code

**URL**: https://21st.dev/mcp
**GitHub**: https://github.com/21st-dev/magic-mcp

#### Description

Magic MCP est un serveur MCP (Model Context Protocol) qui s'integre a Claude Code, Cursor, Windsurf et Cline pour generer des composants UI via IA.

#### Fonctionnalites Principales

- **Generation UI par langage naturel** : Decrivez un composant en texte, l'IA le genere
- **Pas d'hallucination** : Utilise la bibliotheque 21st.dev existante plutot que d'inventer du code
- **Preview en temps reel** : Visualisez les composants generes instantanement
- **TypeScript complet** : Support total TypeScript
- **Integration SVGL** : Acces aux logos et assets de marques professionnels
- **Ajout automatique** : Composants ajoutes directement au projet

#### Exemples d'utilisation

```
/ui create a modern navigation bar with responsive design
/ui design a dashboard card showing user analytics with charts
```

#### Installation Claude Code

```bash
claude mcp add magic --scope user --env API_KEY=<votre_cle>
```

Cle API disponible sur : https://21st.dev/magic/console

#### Avis Utilisateurs

- "C'est comme v0 mais dans votre Cursor/Windsurf/Cline"
- "Ne hallucine pas le code, utilise des composants existants de qualite"
- Les composants generes sont entierement editables et bien structures

#### Utilite pour Verone

| Aspect             | Evaluation                                           |
| ------------------ | ---------------------------------------------------- |
| Pertinence         | **TRES HAUTE** - Generation rapide de composants UI  |
| Gain de temps      | **Significatif** - Plus besoin de coder from scratch |
| Qualite            | **Elevee** - Composants professionnels               |
| **Recommandation** | **INSTALLER**                                        |

**Sources**:

- [GitHub Magic MCP](https://github.com/21st-dev/magic-mcp)
- [Claude MCP Servers](https://www.claudemcp.com/servers/magic-mcp)
- [MCP Index](https://mcpindex.net/en/mcpserver/21st-dev-magic-mcp)

---

### B. MAGIC CHAT - Assistant Design Conversationnel

**URL**: https://21st.dev (Legacy Tools > Magic Chat)

#### Description

Magic Chat est un assistant conversationnel dedie au design UI, permettant de discuter et generer des composants via chat.

#### Fonctionnalites

- Chat interactif pour design UI
- Generation de composants par conversation
- Integration avec la bibliotheque 21st.dev

#### Utilite pour Verone

| Aspect             | Evaluation                            |
| ------------------ | ------------------------------------- |
| Pertinence         | **MOYENNE** - Alternative a Magic MCP |
| Gain de temps      | Modere                                |
| **Recommandation** | **OPTIONNEL** - Magic MCP suffit      |

---

### C. BEST CLAUDE CODE GUI (Agents by 21st)

**URL**: https://21st.dev/agents/waitlist
**Slogan**: "Claude Code, but usable"

#### Description

Une interface graphique web pour Claude Code, concue pour les personnes preferant une UI visuelle au CLI.

#### Fonctionnalites Principales

1. **Connexion repo sans setup local** : Ouvrez n'importe quel repository et travaillez instantanement
2. **Agents en parallele** : Chaque branche s'execute independamment dans son propre sandbox
3. **Preview live** : Chaque changement a une preview en temps reel
4. **Review & Ship** : Voyez la progression, guidez l'execution, mergez quand pret

#### Avantages

- Travail entierement dans le navigateur
- Pas besoin de laptop pour continuer a travailler
- Support mobile
- Pas besoin de comprendre containers/git worktrees/infra

#### Avis Utilisateurs (21st.dev)

> "En tant que personne visuelle, je deteste travailler en CLI. Mais apres avoir utilise Claude Code quelques fois, c'est impossible de revenir en arriere. Le probleme n'est pas Claude. C'est l'interface autour."

#### Utilite pour Verone

| Aspect             | Evaluation                                   |
| ------------------ | -------------------------------------------- |
| Pertinence         | **MOYENNE** - Alternative au CLI Claude Code |
| Gain de temps      | Modere pour travail parallele                |
| Maturite           | En waitlist (pas encore disponible)          |
| **Recommandation** | **SURVEILLER** - S'inscrire a la waitlist    |

---

### D. CANVAS PROTOTYPING (AI Product Designer)

**URL**: https://21st.dev/canvas/homepage
**Slogan**: "Design with context"

#### Description

Un designer IA de produits qui comprend votre produit, vos utilisateurs et votre marche pour creer des prototypes.

#### Fonctionnalites

- Design contextuel base sur votre produit
- Comprehension des utilisateurs et du marche
- Prototypage rapide de pages entieres
- Generation de plusieurs variantes

#### Avis Utilisateurs (Product Hunt)

- "Super facile a utiliser avec React, les composants 3D sont vraiment cool"
- "Gain de temps enorme avec tous ces composants de haute qualite en un seul endroit"
- "De loin le meilleur outil de support design que j'ai utilise avec Next.js"
- "Aide a construire plusieurs apps facilement, la communaute ajoute encore plus de valeur"

#### Utilite pour Verone

| Aspect             | Evaluation                              |
| ------------------ | --------------------------------------- |
| Pertinence         | **HAUTE** - Prototypage nouvelles pages |
| Gain de temps      | **Significatif**                        |
| Qualite            | **Elevee**                              |
| **Recommandation** | **UTILISER** pour prototypage           |

**Sources**:

- [Product Hunt Reviews](https://www.producthunt.com/products/21st-dev-the-npm-for-design-engineers/reviews)
- [Y Combinator](https://www.ycombinator.com/companies/21st)

---

## AVIS GLOBAUX 21st.dev

### Points Forts (selon utilisateurs)

- Composants de haute qualite, gratuits
- Excellente integration React/Next.js
- Composants 3D disponibles
- Communaute active
- Gain de temps considerable
- Fonctionne parfaitement avec Cursor

### Points a Ameliorer (demandes)

- Preview features
- Clarification versioning
- Support contributions custom

### Entreprise

- **Nom**: 21st
- **Funding**: Y Combinator (Winter 2026)
- **Fondation**: 2024
- **Equipe**: 3 personnes
- **Localisation**: San Francisco

---

## 13. SHADERS (Effets Visuels Premium)

**URL Section**: https://21st.dev/s/shader

| Composant                      | Auteur         | Description                                      | Application Cible                |
| ------------------------------ | -------------- | ------------------------------------------------ | -------------------------------- |
| **Animated Shader Background** | Le Thanh       | Lignes ondulees violettes/vertes animees         | **SITE INTERNET** - Hero luxe    |
| **Star Shader Background**     | Marek Jableski | "DIGITAL INNOVATION" - Effet etoiles premium     | **SITE INTERNET** - Landing page |
| **Falling Pattern**            | Efiand         | Effet pluie/chute style Matrix                   | Site Internet - Section tech     |
| **Mesh Renderer**              | Marek Jableski | Rendu 3D avec effet metal                        | **SITE INTERNET** - Produits 3D  |
| **Animated Shader Hero**       | Ravi Kaliye    | "Launch Your Workflow Into Orbit" - Hero spatial | Site Internet - Hero premium     |
| **Shader Lines**               | Ali Imam       | Lignes animees                                   | Site Internet - Backgrounds      |

---

## 14. VIDEOS

**URL Section**: https://21st.dev/s/video

| Composant                        | Auteur       | Description                    | Application Cible                  |
| -------------------------------- | ------------ | ------------------------------ | ---------------------------------- |
| **Video Player**                 | Chetan Verma | Player video avec preview      | **SITE INTERNET** - Pages produits |
| **Shine Border**                 | Magic UI     | Bordure brillante autour video | Site Internet - Mise en valeur     |
| **Hero Video Dialog**            | Magic UI     | Dialog video dans hero section | **SITE INTERNET** - Landing        |
| **Border Beam**                  | Magic UI     | Effet faisceau sur bordure     | Site Internet - Accents            |
| **Scroll Driven Animation Hero** | Arunachalanm | Animation scroll avec video    | **SITE INTERNET** - Storytelling   |

---

## 15. AUTRES CATEGORIES UTILES

### Borders (12 composants)

**URL**: https://21st.dev/s/border

- Bordures animees, brillantes, gradients
- **Application**: Site Internet (mise en valeur produits)

### Docks (6 composants)

**URL**: https://21st.dev/s/dock

- Docks style macOS
- **Application**: Back-Office (navigation)

### Navigation Menus (11 composants)

**URL**: https://21st.dev/s/navbar-navigation

- Menus responsives, hamburgers animes
- **Application**: Site Internet + LinkMe

### Announcements (10 composants)

**URL**: https://21st.dev/s/announcement

- Bannieres, toasts, notifications
- **Application**: Toutes (promotions, alertes)

### Calls to Action (34 composants)

**URL**: https://21st.dev/s/call-to-action

- Boutons CTA, sections d'action
- **Application**: Site Internet (conversions)

### Clients/Logos (16 composants)

**URL**: https://21st.dev/s/clients

- Grilles de logos clients
- **Application**: Site Internet (social proof)

### Footers (14 composants)

**URL**: https://21st.dev/s/footer

- Footers modernes
- **Application**: Site Internet + LinkMe

### Hooks (31 composants)

**URL**: https://21st.dev/s/hook

- React hooks utilitaires (animations, scroll, etc.)
- **Application**: Toutes

### Accordions (40 composants)

**URL**: https://21st.dev/s/accordion

- FAQ, sections depliables
- **Application**: Site Internet (FAQ produits)

---

## SYNTHESE PAR APPLICATION

### SITE INTERNET (E-commerce Luxe) - PRIORITE HAUTE

| Categorie             | Composants Recommandes          | Priorite |
| --------------------- | ------------------------------- | -------- |
| **Heroes**            | Particules, Gradient, Animated  | HAUTE    |
| **Scroll Animations** | Text Reveal, Parallax, Timeline | HAUTE    |
| **Testimonials**      | Animated, Marquee, Grid         | HAUTE    |
| **Logo Carousel**     | Trusted by, Logo Carousel       | HAUTE    |
| **Shaders**           | Star Shader, Animated Shader    | MOYENNE  |
| **Videos**            | Hero Video Dialog, Video Player | MOYENNE  |
| **Typography**        | Typewriter, Shiny Text, Wave    | MOYENNE  |
| **Images**            | Image Comparison, Stacked Cards | MOYENNE  |
| **CTAs**              | Button Colorful, Magnetize      | MOYENNE  |
| **Pricing**           | Pricing Interaction, 3 Columns  | BASSE    |

### LINKME (B2B Dashboard) - PRIORITE MOYENNE

| Categorie       | Composants Recommandes        | Priorite       |
| --------------- | ----------------------------- | -------------- |
| **Maps**        | World Map, Interactive Map    | **TRES HAUTE** |
| **Backgrounds** | Dynamic Stars, Shooting Stars | HAUTE          |
| **Cards**       | Glow Effect, Animated Tabs    | HAUTE          |
| **Carousels**   | Cards Infinite Scroll         | MOYENNE        |
| **Buttons**     | Button Origin, FlipButton     | MOYENNE        |
| **Navigation**  | Responsive Menu               | MOYENNE        |
| **Footers**     | Footer simple                 | BASSE          |

### BACK-OFFICE (Usage Interne) - PRIORITE BASSE

| Categorie      | Composants Recommandes      | Priorite |
| -------------- | --------------------------- | -------- |
| **Docks**      | macOS style dock            | BASSE    |
| **Navigation** | Sidebar, Menu               | BASSE    |
| **Tables**     | Data tables (si disponible) | BASSE    |
| **Forms**      | Form components             | BASSE    |

---

## RESUME RECOMMANDATIONS OUTILS

| Outil                  | Action    | Priorite                             |
| ---------------------- | --------- | ------------------------------------ |
| **Magic MCP**          | INSTALLER | **HAUTE** - Generation composants IA |
| **Canvas Prototyping** | UTILISER  | **HAUTE** - Prototypage pages        |
| **Magic Chat**         | OPTIONNEL | Basse - Magic MCP suffit             |
| **Agents (GUI)**       | WAITLIST  | Moyenne - Surveiller                 |

---

_Document genere le 2026-01-06_
_Prochaine mise a jour: A chaque nouvelle release 21st.dev_
