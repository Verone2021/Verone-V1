# Prompt Stitch — Refonte Design Site Internet Vérone

**Date :** 2026-04-17
**Usage :** Copier-coller ce prompt entier dans une NOUVELLE conversation Claude Code qui utilisera le MCP `stitch` (Google). Le prompt contient (1) le contexte de marque, (2) l'audit du site actuel, (3) les pages à designer, (4) les inspirations, (5) les contraintes techniques.

---

## AUDIT DU SITE ACTUEL (état 2026-04-17)

**URL production :** https://veronecollections.fr
**Stack :** Next.js 15 App Router + Tailwind + Supabase + Stripe Checkout
**Port local :** 3001
**Repo :** `apps/site-internet/`

### Pages existantes

Homepage, `/catalogue`, `/produit/[id]`, `/collections`, `/collections/[slug]`, `/panier`, `/checkout`, `/compte`, `/a-propos`, `/ambassadeur`, `/contact`, `/faq`, `/livraison`, `/retours`, `/cgv`, `/mentions-legales`, `/confidentialite`, `/cookies`, `/auth`.

### Composants homepage existants

`HeroSection`, `CategoryTiles`, `InspirationBanner`, `HomepageReviews`, `NewsletterSection`.
Layout : `Header`, `MegaMenu`, `MobileNav`, `PromoBanner`, `Footer`.
Produit : `CardProductLuxury`.

### Problèmes identifiés (audit visuel)

1. **Mobile exécrable** — le hero split desktop (texte + image) se réduit mal, image disparaît en `lg:hidden`, mobile voit uniquement un bloc de texte aride.
2. **Hero peu immersif** — pas de parallax, pas de storytelling visuel, juste un produit en `object-contain` sur gris.
3. **Reassurance avec emojis (🔍 💰 ✨ 🤝)** — non premium, à remplacer par icônes ligne fines ou illustrations.
4. **Grille produits statique** — 3 colonnes desktop, pas d'animation au scroll, pas de reveal, pas de hover cinématique.
5. **Animations pauvres** — uniquement `fadeIn` / `fadeInUp` / `shimmer`. Aucun scroll-triggered, aucun IntersectionObserver, aucune décomposition produit.
6. **InspirationBanner sous-exploitée** — pas de moodboard, pas de carrousel éditorial.
7. **Mobile nav basique** — drawer simple, pas d'expérience dédiée mobile-first.
8. **Typographie luxury non assumée** — Playfair présente mais sous-utilisée, hiérarchie typographique faible.

### Charte graphique (OBLIGATOIRE à respecter)

```
COULEURS (tailwind verone-*)
- verone-black:    #000000   ← dominante texte, CTA primaires, fond sections "philosophie"
- verone-white:    #FFFFFF   ← dominante fond
- verone-gray-50:  #FAFAFA   ← fond subtil
- verone-gray-100: #F5F5F5
- verone-gray-200: #E5E5E5   ← bordures
- verone-gray-400: #A3A3A3   ← texte secondaire
- verone-gray-500: #737373   ← texte descriptions
- verone-gray-600: #525252
- verone-gray-800: #262626
- verone-gray-900: #171717
- Accent : amber-700 (#B45309) / amber-400 (#FBBF24) — UNIQUEMENT pour les kickers/labels "Concept Store", "Notre philosophie"

TYPOGRAPHIE
- Titres (H1, H2, H3) : Playfair Display (serif) bold, tracking-tight
- Body, UI, boutons  : Inter (sans-serif)
- Kickers/labels     : Inter uppercase tracking-[0.2em] text-xs font-semibold

SHADOWS
- shadow-luxury    : 0 20px 60px -10px rgba(0,0,0,0.15)
- shadow-luxury-lg : 0 30px 80px -15px rgba(0,0,0,0.25)
- shadow-luxury-xl : 0 40px 100px -20px rgba(0,0,0,0.35)

ESPACEMENT
- Sections : py-24 (96px) desktop, py-16 mobile
- Container : max-w-7xl mx-auto px-6 lg:px-8
```

### INTERDITS STRICTS (CLAUDE.md projet)

- ❌ JAMAIS utiliser les mots "luxe", "haut de gamme", "artisans d'excellence".
- ✅ Positionnement : **concept store** — sourcing créatif, produits originaux, qualité-prix, sélection curatée.
- ❌ Pas de couleurs hors palette verone + amber.
- ❌ Pas de `any` TypeScript, pas de `pnpm dev` lancé par l'agent.
- ❌ JAMAIS créer de formulaire dans `apps/` → toujours dans `packages/@verone/`.

---

## AUDIT WESTWING.FR — COMPOSANTS RÉELS OBSERVÉS (référence #1)

Extraction technique faite le 2026-04-17 via fetch de `westwing.fr` (homepage), `westwing.fr/meubles` (catalogue), page produit canapé Wolke. **C'est ce qu'on réplique structurellement, adapté en noir/blanc éditorial.**

### Header (westwing.fr)

- Hauteur totale ~120-140px (nav + 2 bandeaux promo).
- 2 bandeaux promo empilés en top : "Accès anticipé : Nouveautés & Deals" + "Collection Days : jusqu'à -50%".
- Logo gauche, nav horizontale centre : `Produits / INSPIRATION / NOUVEAUTÉS / JARDIN / % COLLECTION DAYS`.
- Icônes droite : compte (user), wishlist (cœur), panier (bag).
- Fond blanc, sans-serif.
- **Adaptation Vérone :** 1 seul bandeau promo (pas 2), logo VERONE serif centré tracking large, nav `Catalogue / Collections / Inspiration / Notre histoire`, accent amber sur "NOUVEAU".

### Hero homepage (westwing.fr)

- Image statique pleine largeur, hauteur ~400-500px mobile, grande desktop.
- Texte centré overlay : titre sans-serif bold 48-64px mobile / 72-96px desktop, sous-titre + dates.
- CTA "Acheter" centré sous titre.
- **Adaptation Vérone :** photo lifestyle moody (pas "campagne promo"), titre serif Newsreader (pas sans), pas de dates soldes, CTA blanc sur noir "Découvrir la sélection".

### Catégories / Univers (westwing.fr)

- **11 tuiles** en grille/carrousel horizontal (Nouveautés, Meubles, Jardin, Déco, Luminaires, Tapis, Linge de maison, Art de la table, Cuisine, Enfants, Cadeaux, Outlet).
- Ratio tuile ~1:1.2 (presque carré, légèrement portrait).
- Image full-bleed + titre blanc en overlay centré bas, sans-serif 16-20px.
- Border-radius 4-8px.
- Click anywhere sur card.
- **Adaptation Vérone :** 4-5 tuiles max (Mobilier, Décoration, Luminaires, Textiles, Art de la table), ratio 3/4 portrait (plus éditorial), titre serif Newsreader 24px overlay bas, border-radius 0px.

### Grille produits (westwing.fr catalogue)

- **Desktop : 4 colonnes**, gap ~20-24px, image 180×240 (ratio 3:4 portrait).
- Mobile : 1-2 colonnes.
- Total "6812 Produits" → pagination infinite scroll / "Charger plus".
- **Card produit westwing :**
  - Image principale + 4-5 mini-thumbnails circulaires en pastilles **sous l'image** (variantes couleur).
  - Nom produit left-aligned 14-16px sous image.
  - Marque en petit (ex: "Westwing Collection").
  - Prix actuel gras + ancien prix barré `<s>` si promo.
  - Badge "DEAL" top-left rouge si promo.
  - Favori cœur : apparition au hover (non visible par défaut).
- **Adaptation Vérone :** 3 colonnes desktop (pas 4 → plus d'espace, curation), 2 cols mobile, fond card #FAFAFA object-contain (FIX du bug zoom fauteuils), badge "NOUVEAU" amber discret (pas rouge DEAL), nom serif Newsreader 18px (pas sans-serif), pas de marque (on ne met pas en avant les marques), favori cœur visible top-right par défaut.

### Bandeaux éditoriaux (westwing.fr)

- **Split banner 50/50** : "Canapés en PROMO" gauche + "Lits en PROMO" droite, hauteur ~250-300px chacun, image full-bleed + titre blanc overlay + "Acheter maintenant".
- **Bandeau large** : "Déco et accessoires en PROMO" + "Un vent de fraîcheur avec Westwing Collection" + CTA bouton.
- **Adaptation Vérone :** split banner 50/50 OK mais thématique éditoriale (pas promo) → "Salon" / "Chambre", titre serif blanc sur photo, CTA lien souligné "Découvrir →" (pas bouton).

### Filtres catalogue (westwing.fr /meubles)

- **Sidebar gauche** desktop, accordéons verticaux avec compteurs.
- Filtres : Matériau `Bois(2300), Tissu(1534), Métal(1519)`, Couleur `Marron(1416), Beige(1122), Blanc(948)`, Style `Moderne(2104), Scandinave(826)`, Marques, Prix, Durable (checkbox).
- Chaque item = case à cocher + libellé + nombre entre parenthèses.
- Mobile : drawer fullscreen (non visible par défaut).
- Barre tri en top grille : dropdown "Trier par [Popularité ▼]" (Popularité, Prix ↑/↓, Nouveau).
- Breadcrumb : `Accueil / Meubles`.
- Bannière catégorie en haut : photo + grid d'accès rapides (12 sous-catégories en icônes).
- **Adaptation Vérone :** sidebar gauche accordéons identique desktop, bottom sheet swipe-up mobile (pas fullscreen drawer → plus moderne), pas de grid sous-catégories en icônes (on fait carrousel horizontal), tri en select minimaliste sans bouton rond.

### Card produit détaillée (westwing.fr catalogue)

```
[Image principale + carousel 5-6 photos au hover/swipe]
  ↓
[Mini-pastilles circulaires variantes couleur sous photo]
  ↓
[Nom produit]
  ↓
[Marque "Westwing Collection" en petit]
  ↓
[Prix actuel | Ancien prix barré si promo]
  ↓
[Badge "DEAL" rouge en overlay si promo]
```

### Page produit (westwing.fr canapé Wolke)

- **Layout :** colonne gauche 45-50% galerie, colonne droite 45-50% infos, gouttière 8-10%. Passage col unique < 768px.
- **Galerie gauche :** 13 images empilées verticalement, ratio 420×560 (portrait 4:5-ish, très proche 3:4), thumbnails cliquables + "Voir plus", pas de zoom hover.
- **Colonne droite (ordre exact descendant) :**
  1. Breadcrumb gris petit
  2. Marque (lien bleu) "Westwing Collection"
  3. Titre produit sans-serif gras 24-28px
  4. Nombre avis entre parenthèses "(71 avis)"
  5. Prix "2 099 €" noir 20-24px + TVA incl. + frais d'envoi gris petit
  6. Service additionnel "Montage 79 €. Détails"
  7. **CTA "Ajouter au panier"** — gris charcoal (PAS rouge), 100% largeur ~350px, hauteur 48-50px, radius 4-6px
  8. Info livraison "Livraison dans les 7-8 semaines"
  9. **Accordéons empilés :** Dimensions (avec schéma image numéroté : L256 × H65 × P118), Détails produit (5-6 paragraphes : matière, densité, cadre, pieds, réf), Échantillon gratuit, Avis clients, WE CARE (certif FSC)
  10. Sélecteur couleur : **16+ pastilles circulaires 40×40px**, 5 visibles + "+" pour dérouler, label sous "Bouclette beige clair", chaque couleur = URL distincte
- **Produits recommandés :** section "Adoptez le look AVEC CET ARTICLE" (PAS "Vous aimerez aussi"), 1 produit en carousel.
- Pas de countdown, pas de "plus que X en stock".
- **Adaptation Vérone :**
  - Galerie gauche thumbnails verticaux (PAS empilés), photo principale centrée 4/5
  - Titre serif Newsreader (pas sans)
  - CTA **noir pur 100%** (pas charcoal), texte "Ajouter au panier"
  - Sticky CTA mobile bottom fixe 64px (absent de westwing mobile)
  - Pas de marque affichée (on ne revend pas de marques renommées, on curate)
  - Accordéons avec chevron fin → (pas + / -)
  - Section recommandations "Pièces à associer" (plus concept store) 4 produits grid

### Footer (westwing.fr)

- **6 colonnes logiques :**
  1. Paiement sécurisé : 9 logos (Visa, Mastercard, Amex, PayPal, Klarna...)
  2. Livraison : 5 logos (DPD, DHL, Relais Colis...)
  3. Aide & Contact (Suivi colis, Retours, Délais, Contact, tel, email)
  4. À propos (Carrière, Presse, Affiliation, Garantie, Guides)
  5. Informations utiles (B2B, Frais, Retours, Idées déco, Bons cadeaux, Newsletter)
  6. Apps & Socials (QR code, Google Play, AppStore, IG/TikTok/Pinterest)
- Fond blanc ou gris très clair #F5F5F5.
- Sans-serif 12-14px gris foncé.
- **Adaptation Vérone :** fond noir pur (inversé), texte blanc/gris-400, logo VERONE serif en haut, 4 colonnes suffisent (Boutique / Service client / À propos / Légal), icônes paiement ligne (pas logos couleur), socials minimalistes ligne.

### Typographie & couleurs réelles Westwing

- **Font stack probable :** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` — **tout sans-serif, pas de serif**.
- **Couleur primaire texte :** `#1A1A1A` ou `#222` (noir cassé).
- **Accent promo :** rouge `~#E63946` ou `#D32F2F`.
- **Fond :** `#FFFFFF`.
- **Border-radius :** 4-8px (arrondi modéré).
- **Adaptation Vérone :** **ON CASSE ce choix** pour se différencier → passer en serif Newsreader pour les titres (éditorial), noir pur `#000000`, amber `#B45309` comme unique accent (pas rouge urgence), border-radius 0px sur cards/boutons (angles vifs).

### Classes CSS observées

`.hero-banner`, `.category-grid`, `.product-card`, `.split-banner`, `.footer-column`, `.product-grid`, `.payment-icons`, `.shipping-icons`, `.dtl_1`, `.mod_2`, `.col_` (variantes couleur), paramètres Shopify CDN `width=180&height=240`.

### Tech stack Westwing (infos utiles)

- Probablement **Shopify** (stack `Oxygen`, CDN `shopify.com`).
- CDN images : `cdn-cms-ww.westwing.com`.
- Breakpoints : mobile < 768px, desktop ≥ 1024px.
- **Adaptation Vérone :** on reste Next.js 15 + Supabase, pas Shopify. Mais on reprend la philosophie responsive et les tailles d'images CDN.

### Animations observées Westwing

Aucune animation notable détectée (site performant, statique). **Avantage Vérone :** on peut se différencier en ajoutant des animations éditoriales (scroll reveals, parallax léger, décomposition produit Nano Banana au scroll — choses que Westwing n'a pas).

---

## PROMPT À DONNER À STITCH (MCP Google)

> Rôle : designer senior e-commerce. Tu travailles pour **Vérone**, concept store français (décoration et mobilier d'intérieur) avec un catalogue curaté de 200-300 pièces. Tu utilises le MCP `mcp__stitch__*` (Google Stitch) pour générer les écrans.
>
> **Mission :** refondre totalement l'expérience visuelle du site `veronecollections.fr` en mobile-first, avec une direction artistique éditoriale **basée directement sur les composants réels de westwing.fr** (voir section "AUDIT WESTWING.FR — COMPOSANTS RÉELS OBSERVÉS" ci-dessus). Westwing est la **référence principale obligatoire** : on reproduit la structure (header, hero campagne, grille catégories 11 tuiles, grille produit 4 cols avec variantes couleur pastilles sous photo, layout page produit 50/50 galerie+accordéons, footer 6 colonnes) **mais on la traduit en éditorial noir/blanc pur** : serif Newsreader au lieu de sans, angles vifs 0px au lieu de radius 4-8px, amber en micro-accent au lieu de rouge promo, photos object-contain (pas zoom). Inspirations secondaires : ferm-living.com (whitespace moody), hay.dk (rigueur), maisonsarahlavoine.com (ambiance parisienne).
>
> **Check obligatoire avant chaque écran :** lire la section "AUDIT WESTWING.FR" et reproduire les mêmes composants structurels, seulement le style change.
>
> ### 1. Créer le design system Stitch
>
> - Appeler `mcp__stitch__create_design_system` avec la charte Vérone noir/blanc ci-dessous.
> - Couleurs principales : noir pur `#000000`, blanc pur `#FFFFFF`, 10 nuances de gris de `#FAFAFA` à `#171717`. Accent unique : amber `#B45309` (desktop) / `#FBBF24` (dark sections) réservé aux petits kickers UPPERCASE (pas de gros bloc orange).
> - Typographie : Playfair Display pour tous les titres (serif, bold, tracking serré), Inter pour le reste.
> - Style général : minimalisme éditorial, beaucoup de whitespace, ratios photo 4/5 et 3/4, grilles asymétriques, shadows longs et doux (`0 20px 60px -10px rgba(0,0,0,0.15)`).
>
> ### 2. Créer le projet Stitch
>
> - Appeler `mcp__stitch__create_project` nom = "Vérone Concept Store 2026".
> - Puis `mcp__stitch__apply_design_system` pour lier le DS au projet.
>
> ### 3. Générer les écrans prioritaires (`mcp__stitch__generate_screen_from_text`)
>
> Dans cet ordre, UN PAR UN (chaque écran en version **mobile 390px + desktop 1440px**) :
>
> **Écran 1 — Homepage**
> Sections dans l'ordre :
>
> 1. **Hero plein écran 100vh** — fond noir avec une photo produit immersive (format 4/5) qui se décompose en fragments au scroll (éclatement du meuble → chaise ou vase → pieds, assise, dossier qui se séparent légèrement comme un exploded view). Titre Playfair géant "Des trouvailles qui changent tout" en blanc cassé sur l'image. Sous-titre Inter fin. 2 CTA : "Découvrir la sélection" (bouton blanc fond noir) + "Notre histoire" (lien texte souligné). Kicker amber "Concept Store" en haut. Indicateur de scroll animé en bas.
> 2. **Bandeau éditorial horizontal** — 3 cartes verticales "Mobilier / Décoration / Objets" format 3/4 avec photos moody, titre Playfair en overlay bas, hover : légère élévation + underline animé.
> 3. **Section "Nos trouvailles"** — grille asymétrique 6 produits (pas 3x2 basique → genre masonry éditorial : 1 large + 2 petits + 1 moyen + 2 petits). Chaque carte : photo 4/5, nom Playfair, prix Inter, badge discret "Nouveau" ou "-20%" en amber si applicable. Hover : zoom image 1.05 + apparition bouton "Ajouter" en bas.
> 4. **Storytelling visuel plein écran** — bannière inspiration 100vh type magazine, photo lifestyle + citation en overlay, CTA "Voir la collection".
> 5. **Philosophie fond noir** — 4 piliers (Sourcing créatif / Qualité-prix / Sélection curatée / Service attentif) avec icônes ligne fines SVG (PAS d'emoji), titres Playfair blancs, descriptions gris-400.
> 6. **Collections thématiques** — 3 cartes horizontales larges (pas en grille carrée), chaque carte = photo ambiance + nom collection + "Découvrir →".
> 7. **Avis clients** — témoignages en slider cinématique, une citation immense en Playfair italic, nom en Inter petit.
> 8. **Newsletter** — fond gris-50, input minimaliste ligne unique underline, bouton noir.
> 9. **Footer** — 4 colonnes sobres + socials.
>
> **Écran 2 — Page Catalogue `/catalogue`**
>
> - Sidebar gauche desktop avec filtres (catégorie, prix, couleur, matière, disponibilité) en accordéons épurés.
> - Sur mobile : filtres en drawer bottom-sheet swipe-up type app native.
> - Grille 2 cols mobile / 3 cols tablet / 4 cols desktop.
> - Tri en select discret haut droite.
> - Cards produits avec transitions au hover : image 1.03, overlay dégradé bas + CTA "Voir".
>
> **Écran 3 — Page Produit `/produit/[id]`**
>
> - Layout 2 colonnes desktop : galerie photos gauche (format portrait 4/5, 5-8 photos, thumbnails verticaux à gauche de la photo principale) / infos droite.
> - Mobile : galerie pleine largeur avec dots indicator + swipe horizontal.
> - Zone infos : kicker catégorie amber, titre Playfair, prix, description, sélecteur variantes (couleur en pastilles, taille en boutons), bouton "Ajouter au panier" plein noir, lien wishlist cœur.
> - Sous-section **"Détails"** en accordéons : dimensions, matériaux, entretien, livraison.
> - Sous-section **"Décomposition"** — animation scroll-triggered où le produit se décompose en ses composants (image + annotations fines sur côté).
> - **"Vous aimerez aussi"** — 4 produits similaires.
>
> **Écran 4 — Collections `/collections/[slug]`**
>
> - Hero collection : photo moodboard plein écran + titre Playfair + description éditoriale.
> - Grid produits de la collection.
> - CTA "Voir toutes les collections" en fin.
>
> **Écran 5 — Panier `/panier` + Checkout**
>
> - Panier : slide-over drawer à droite desktop, modal fullscreen mobile.
> - Checkout : 3 étapes claires (Adresse / Livraison / Paiement), barre de progression minimaliste en haut, récap panier fixe à droite desktop.
>
> **Écran 6 — Mega Menu Header**
>
> - Au hover sur catégorie : panneau 100% largeur qui descend avec sous-catégories en colonnes + visuel produit vedette à droite.
> - Mobile : drawer plein écran avec nav accordéon + icônes recherche/panier/compte en haut.
>
> ### 4. Animations à spécifier dans chaque écran
>
> - **Scroll-triggered reveals** : chaque section apparaît en `translateY(30px) + opacity 0 → 1` quand elle entre en viewport (IntersectionObserver, pas de lib lourde).
> - **Parallax léger** sur les hero images (translateY au scroll, 0.3x vitesse).
> - **Décomposition produit** (Nano Banana → générer des images où un meuble/objet est "éclaté" en ses composants). 3-4 frames par produit, diffusion au scroll via `<picture>` + opacity crossfade.
> - **Cursor custom** desktop : petit cercle noir qui devient plus gros + texte "Voir" au survol des cards produit.
> - **Transitions de page** : fade blanc rapide entre routes (150ms).
> - **Micro-interactions** : underline qui se trace gauche→droite sur les liens, boutons avec shine effect amber discret au hover.
>
> ### 5. Assets Nano Banana à prévoir
>
> Lister dans chaque écran les images à générer via Nano Banana avec des prompts précis, par exemple :
>
> - "Exploded view d'une chaise scandinave en chêne clair, fond blanc studio, composants flottants légèrement séparés, éclairage doux directionnel, ultra réaliste, ratio 4/5"
> - "Moodboard lifestyle concept store parisien : vase céramique, lampe design années 70, livre d'art ouvert, sur table en marbre blanc, lumière latérale dorée, ambiance éditoriale Kinfolk, ratio 3/2"
> - "Décomposition d'une lampe de table : pied en laiton, tige, douille, abat-jour lin écru, pièces alignées verticalement, fond gris #FAFAFA, ratio portrait 4/5"
> - "Vue macro texture bois massif de noyer, lumière rasante, ratio 1/1, fond beige papier"
> - "Détail fibre lin naturel, plis doux, lumière du matin, ratio 16/9"
>
> ### 6. Variantes à générer
>
> Pour chaque écran, appeler `mcp__stitch__generate_variants` pour avoir 3 propositions (une sage, une osée, une éditoriale-magazine).
>
> ### 7. Livrable final
>
> - Pour chaque écran : image desktop + mobile, liste des composants nouveaux à créer, liste des animations Framer Motion / CSS à implémenter, liste des prompts Nano Banana.
> - Rapport de synthèse dans `docs/scratchpad/stitch-redesign-report-2026-04-17.md` avec liens vers les fichiers Stitch.
>
> ### 8. Contraintes techniques NON-NÉGOCIABLES
>
> - Respecter EXACTEMENT la charte `verone-*` (couleurs + fonts Playfair/Inter ci-dessus).
> - Positionnement **concept store**, JAMAIS "luxe/haut de gamme/artisans d'excellence".
> - Mobile-first : chaque design doit fonctionner à 390px AVANT 1440px.
> - Accessibilité AA : contraste 4.5:1 minimum sur texte, focus ring visible, `prefers-reduced-motion` respecté.
> - Performance : LCP < 2.5s — privilégier Next.js `<Image>` avec `priority` sur hero, lazy sur le reste.
> - Composants à créer dans `apps/site-internet/src/components/` (PAS dans `packages/@verone/` pour l'instant, on factorisera après validation).
> - Zéro emoji dans l'UI finale.
>
> **Commence par l'écran 1 (Homepage mobile + desktop) et attends ma validation avant de passer à l'écran 2.**

---

## WORKFLOW RECOMMANDÉ EN NOUVELLE CONVERSATION

1. Ouvre une nouvelle conversation Claude Code dans ce repo.
2. Copie-colle la section "PROMPT À DONNER À STITCH" ci-dessus.
3. Claude appellera les outils `mcp__stitch__*` un par un.
4. Valide écran par écran avant de passer au suivant.
5. Une fois les designs validés, nouvelle conversation pour l'implémentation React/Tailwind.

## FICHIERS DE RÉFÉRENCE À CITER DANS LA NOUVELLE CONVERSATION

- Charte : `apps/site-internet/tailwind.config.js`
- Homepage actuelle : `apps/site-internet/src/app/page.tsx`
- Hero actuel : `apps/site-internet/src/components/home/HeroSection.tsx`
- Règles projet : `CLAUDE.md` + `apps/site-internet/CLAUDE.md`
- Index site : `docs/current/INDEX-SITE-INTERNET-COMPLET.md`
