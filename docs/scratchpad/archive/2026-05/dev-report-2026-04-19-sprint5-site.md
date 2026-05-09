# Dev Report — Sprint 5 Site-Internet Responsive Tier 1

Date: 2026-04-19
Branche: feat/responsive-site

## Type-check final

```
pnpm --filter @verone/site-internet type-check → EXIT 0 (aucune erreur)
```

---

## Pages modifiées

### 1. `apps/site-internet/src/app/page.tsx` (landing)

**Problèmes corrigés :**

- Padding `px-6 py-24` sur les sections "Nos trouvailles", "Valeurs" et "Collections" → `px-4 md:px-6 py-12 md:py-24` (mobile-first, espace respirable sur 375px)

**Laisser tel quel :**

- `max-w-7xl mx-auto` intentionnel marketing
- Grilles `grid-cols-1 md:grid-cols-3` déjà mobile-first
- `text-4xl` sur titres de sections : acceptable sur mobile

---

### 2. `apps/site-internet/src/app/catalogue/page.tsx`

**Problèmes corrigés :**

- Container `px-6 py-12` → `px-4 md:px-6 py-8 md:py-12`
- H1 `text-5xl` sans responsive → `text-3xl md:text-5xl` (trop grand sur 375px)

**Déjà correct :**

- Sidebar cachée `hidden lg:block`, mobile filters drawer déjà implémenté
- Grille produits `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` déjà mobile-first
- Barre de recherche `flex-col md:flex-row` déjà responsive

---

### 3. `apps/site-internet/src/app/produit/[id]/page.tsx`

**Problèmes corrigés :**

- Padding-bottom `py-8` → `py-8 pb-28 lg:pb-8` : espace pour dégager la `StickyAddToCart` fixe sur mobile (bloqueur conversion — le footer était partiellement masqué)

**Déjà correct :**

- Layout `grid-cols-1 lg:grid-cols-[3fr_2fr]` déjà mobile-first
- `StickyAddToCart` déjà en `fixed bottom-0 lg:hidden`
- `ProductSidebar` avec `lg:sticky lg:top-20` (non-sticky sur mobile = correct)

---

### 4. `apps/site-internet/src/app/panier/page.tsx`

**Problèmes corrigés :**

- Container principal `px-6 py-8` → `px-4 md:px-6 py-6 md:py-8`
- Container panier vide `px-6` → `px-4 md:px-6`
- Boutons quantité `-` et `+` : `h-8 w-8` → `h-11 w-11 md:h-8 md:w-8` (touch target 44px mobile, règle Technique 4)
- Icônes des boutons : `h-3 w-3` → `h-4 w-4 md:h-3 md:w-3` pour correspondre au nouveau touch target
- Bouton supprimer : `text-verone-gray-400 self-end` → `h-11 w-11 md:h-auto md:w-auto flex items-center justify-center ... self-end` (touch target 44px mobile)

**Déjà correct :**

- Grid `grid-cols-1 lg:grid-cols-3` déjà mobile-first
- Récapitulatif sticky `sticky top-24` en col-1 sur mobile (positionnement correct)

---

### 5. `apps/site-internet/src/app/checkout/page.tsx`

**Problèmes corrigés (bloqueurs conversion) :**

- Container principal `px-6 py-12` → `px-4 md:px-6 py-8 md:py-12`
- Container panier vide `px-6 lg:px-8 py-12` → `px-4 md:px-6 lg:px-8 py-12`
- Grille Prénom/Nom `grid-cols-2` (sans prefix) → `grid-cols-1 sm:grid-cols-2` (champs trop étroits sur 375px)
- Grille CP/Ville/Pays livraison `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
- Grille CP/Ville/Pays facturation `grid-cols-3` → `grid-cols-1 sm:grid-cols-3`
- Progress bar : ajout `overflow-x-auto` + `min-w-[280px]` pour éviter le débordement sur 375px

**Déjà correct :**

- Grid form/récap `grid-cols-1 lg:grid-cols-5` déjà mobile-first
- Bouton submit `w-full` déjà pleine largeur

---

### 6. `apps/site-internet/src/app/auth/register/page.tsx`

**Problèmes corrigés :**

- Grille Prénom/Nom `grid grid-cols-2` (sans prefix) → `grid grid-cols-1 sm:grid-cols-2` (champs trop étroits sur 375px)

---

## Pages SKIP (déjà responsive)

### `apps/site-internet/src/app/auth/login/page.tsx`

Formulaire une colonne uniquement, padding correct, `max-w-md` centré. Aucun problème détecté.

---

## Composants inspectés non modifiés

- `StickyAddToCart.tsx` : déjà `fixed bottom-0 left-0 right-0 z-40 lg:hidden`. Bouton `py-3 px-5` ≈ 44px height. Correct.
- `ProductSidebar.tsx` : déjà `lg:sticky lg:top-20 lg:h-fit`. Mobile = flow normal. Correct.
- `HeroSection.tsx` : `grid-cols-1 lg:grid-cols-2`, image héro `hidden lg:block`. Correct.
- `CategoryTiles.tsx` : `grid-cols-2 lg:grid-cols-4` avec `sizes="(max-width: 768px) 50vw, 25vw"`. Correct.
- `CatalogueMobileFilters` : drawer mobile déjà implémenté, bouton `lg:hidden`.

---

## Bloquants non corrigés

Aucun bloquant résiduel. Les patterns identifiés ci-dessous sont délibérément laissés :

- `max-w-7xl mx-auto` sur toutes les sections : intentionnel B2C marketing, NE PAS modifier
- Sections `py-24` sur desktop : intentionnel design luxe, réduit uniquement sur mobile avec `md:py-24`

---

## Résultat type-check

```
pnpm --filter @verone/site-internet type-check
→ EXIT 0 — aucune erreur TypeScript
```
