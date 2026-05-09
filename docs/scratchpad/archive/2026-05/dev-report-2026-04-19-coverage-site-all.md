# Dev Report — Site-internet Responsive Coverage (Tier 2 + Tier 3)

**Date** : 2026-04-19
**Branch** : feat/responsive-complete-coverage
**Type-check** : exit 0

---

## Perimetre analyse

17 pages dans scope. Analyse individuelle de chaque page avant modification.

---

## Pages SKIP (deja responsives)

| Page                   | Raison                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| `auth/forgot-password` | max-w-md, px-6, full-width inputs, OK mobile                            |
| `auth/login`           | idem, GoogleAuthButton fluide, OK                                       |
| `checkout/cancel`      | flex-col sm:flex-row deja present                                       |
| `checkout/success`     | flex-col sm:flex-row deja present                                       |
| `collections/page`     | grid-cols-1 md:grid-cols-2 lg:grid-cols-3 deja present, px-6 lg:px-8 OK |
| `cgv`                  | CmsPageContent (corrige ci-dessous)                                     |
| `faq`                  | CmsPageContent (corrige ci-dessous)                                     |
| `livraison`            | CmsPageContent (corrige ci-dessous)                                     |
| `mentions-legales`     | CmsPageContent (corrige ci-dessous)                                     |
| `retours`              | CmsPageContent (corrige ci-dessous)                                     |

---

## Pages MODIFIEES

### 1. `collections/[slug]/page.tsx`

**Problemes identifies** :

- Grille produits `grid-cols-1 md:grid-cols-3 lg:grid-cols-4` sans breakpoint sm (saut brutal 1->3 cols)
- Skeleton identique sans sm
- Padding image overlay `p-8` fixe sur mobile
- Conteneur `px-6 py-12` sans optimisation mobile

**Corrections** :

- `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8` (skeleton + grille produits)
- `p-4 md:p-8` sur overlay image de collection
- `px-4 sm:px-6 lg:px-8 py-8 md:py-12` sur les deux conteneurs

### 2. `compte/page.tsx`

**Problemes identifies** :

- Cards commandes : `flex items-center justify-between` — sur mobile, un order_number long + badge deborde
- Padding principal `px-6 py-12` trop genereux sur mobile

**Corrections** :

- `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3` sur card commande
- `self-start sm:self-center` sur le badge statut (alignement)
- `px-4 sm:px-6 lg:px-8 py-8 md:py-12` sur conteneur principal

### 3. `compte/favoris/page.tsx`

**Problemes identifies** :

- Grille `grid-cols-1 md:grid-cols-3` sans sm (saut 1->3 colonnes brutal)
- Padding `px-6 py-24` trop large sur mobile (cas non-auth)

**Corrections** :

- `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8` (skeleton + grille)
- `px-4 sm:px-6 lg:px-8 py-8 md:py-12` conteneur principal
- `px-4 sm:px-6 lg:px-8 py-16 md:py-24` cas non-auth

### 4. `confidentialite/page.tsx`

**Problemes identifies** :

- H1 `text-4xl` sans breakpoint mobile (trop grand sur 375px)
- Padding `px-6 py-16` sans optimisation mobile
- Marge h1 `mb-12` trop grande sur mobile

**Corrections** :

- `text-3xl md:text-4xl mb-8 md:mb-12`
- `px-4 sm:px-6 lg:px-8 py-10 md:py-16`

### 5. `politique-de-confidentialite/page.tsx`

**Memes corrections** que confidentialite.

### 6. `cookies/page.tsx`

**Memes corrections** que confidentialite.

### 7. `a-propos/page.tsx`

**Problemes identifies** :

- H1 `text-4xl md:text-5xl` sans breakpoint sm (manque une etape entre 375 et 768)
- Section promesse `p-8` fixe sur mobile
- Padding `px-6 py-16`

**Corrections** :

- `text-3xl sm:text-4xl md:text-5xl`
- `p-4 md:p-8` sur la section promesse
- `px-4 sm:px-6 lg:px-8 py-10 md:py-16`

### 8. `components/cms/CmsPageContent.tsx`

**Problemes identifies** :

- H1 `text-4xl` sans breakpoint mobile
- Padding `px-6 py-16` sans optimisation mobile
- Affect toutes les pages CMS (cgv, faq, livraison, mentions-legales, retours)

**Corrections** :

- `text-3xl md:text-4xl mb-8 md:mb-12`
- `px-4 sm:px-6 lg:px-8 py-10 md:py-16`

---

## Fichiers modifies

- `apps/site-internet/src/app/collections/[slug]/page.tsx`
- `apps/site-internet/src/app/compte/page.tsx`
- `apps/site-internet/src/app/compte/favoris/page.tsx`
- `apps/site-internet/src/app/confidentialite/page.tsx`
- `apps/site-internet/src/app/politique-de-confidentialite/page.tsx`
- `apps/site-internet/src/app/cookies/page.tsx`
- `apps/site-internet/src/app/a-propos/page.tsx`
- `apps/site-internet/src/components/cms/CmsPageContent.tsx`

---

## Verification

```
pnpm --filter @verone/site-internet type-check → exit 0
```

---

## Techniques responsives appliquees

| Technique                                                   | Pages concernees                                                                 |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Grille responsive (sm: breakpoint manquant)                 | collections/[slug], compte/favoris                                               |
| H1/H2 text responsive (text-3xl mobile → text-4xl+ desktop) | a-propos, confidentialite, politique-de-confidentialite, cookies, CmsPageContent |
| Padding fluide (px-4 sm:px-6 lg:px-8)                       | tous les conteneurs corriges                                                     |
| Padding vertical fluide (py-10 md:py-16)                    | pages legales + CmsPageContent                                                   |
| Flex column on mobile → row on sm (commandes compte)        | compte/page.tsx                                                                  |
