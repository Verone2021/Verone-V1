# Dev Plan — BO-CATALOG-VARIANTS-001 Variantes groupées + ménage DB

**Date** : 2026-04-30
**Statut** : **PARTIAL — phase 1 livrée (filtre + types)**, phases 2-3 reportées en PRs séparées

---

## Audit DB préalable

| Table                                | Lignes | Statut                                                   |
| ------------------------------------ | -----: | -------------------------------------------------------- |
| `variant_groups`                     |      1 | ✅ Système retenu                                        |
| `products.variant_group_id NOT NULL` |     11 | ✅ 11 produits déjà liés                                 |
| `product_groups`                     |  **0** | 🔴 Table dette (non utilisée — feature jamais finalisée) |
| `product_group_members`              |  **0** | 🔴 Table dette                                           |

## Audit code consommateurs `product_groups`

2 fichiers utilisent encore `from('product_groups')` :

- `packages/@verone/ui-business/src/components/sections/RelationsEditSection.tsx` (lignes 23, 111, 379-396) — section UI éditeur produit
- `apps/back-office/src/app/api/exports/google-merchant-excel/route.ts` (lignes 59-60) — export feed Google Merchant

Ces deux usages retournent **toujours rien** (table = 0 lignes). Ils sont du code mort en pratique mais TypeScript fait référence aux tables → impossible de DROP sans refacto.

---

## Phase 1 — LIVRÉE dans cette PR (#851)

### 1.1 Nouveau filtre `variantStatus` dans CatalogueFilters

- `'all' | 'with_variants' | 'without_variants'`
- Type ajouté dans `catalogue-types.ts`
- Logique branchée dans `loadProducts` :
  ```typescript
  if (filters.variantStatus === 'with_variants') {
    query = query.not('variant_group_id', 'is', null);
  } else if (filters.variantStatus === 'without_variants') {
    query = query.is('variant_group_id', null);
  }
  ```

UI panel à venir dans une PR future (toggle dropdown dans `CatalogueExtraFilters`).

---

## Phase 2 — Reportée : UI variantes groupées (~2 jours)

### Catalogue principal `/produits/catalogue`

Toggle `[Groupé] | [À plat]` dans le toolbar. État via param URL `?variants=flat`.

**Mode groupé (par défaut)** :

- 1 carte/ligne par groupe de variantes
- Carte mère affiche : image du produit primaire (`primary_product_id`), nom du groupe, nombre de variantes, fourchette de prix min-max
- Au clic sur la carte → navigation vers `/produits/catalogue/variantes/<group_id>`
- Au survol/expand → miniatures des variantes cliquables

**Mode à plat** :

- Comportement actuel (1 ligne par produit)

**Implémentation** :

- Côté DB : aucun changement nécessaire (`variant_group_id` est déjà sur `products`)
- Côté front : nouveau hook `useGroupedProducts(products: Product[]): GroupedProduct[]` qui regroupe les produits par `variant_group_id` côté client
- Nouveau composant `CatalogueGroupedView` (équivalent de `CatalogueGridView` mais pour les groupes)

### Page `/produits/catalogue/variantes`

Déjà existante dans `apps/back-office/src/app/(protected)/produits/catalogue/variantes/`. Vérifier qu'elle utilise bien `variant_groups` (probable, à confirmer).

Améliorations UX possibles :

- Vue grille par groupe avec miniatures cliquables
- Édition simultanée des variantes (changer le prix de toutes les couleurs en 1 clic)
- Image héro du produit primaire + thumbnails des autres

---

## Phase 3 — Reportée : Ménage DB `product_groups` (~3h)

**ATTENTION** : nécessite refacto code AVANT le DROP. Sinon la migration casse la prod.

### Étape 1 — Refacto `RelationsEditSection.tsx`

La section UI affiche actuellement `product.product_groups.{name, description, subcategories.categories.families.name}`.

Refacto : remplacer par `variant_groups` :

```typescript
// Avant
.from('product_groups')
.select('id, name, description, ...')

// Après
.from('variant_groups')
.select('id, name, ...')
```

Et adapter le rendu JSX (les 7 références aux `product.product_groups` lignes 379-396).

### Étape 2 — Refacto `google-merchant-excel/route.ts`

Le route fait :

```typescript
.from('products')
.select(`
  ...,
  variant_group:product_group_members(
    group:product_groups(...)
  )
`)
```

Refacto en utilisant le `variant_group_id` direct sur `products` :

```typescript
.from('products')
.select(`
  ...,
  variant_group:variant_groups!variant_group_id(*)
`)
```

### Étape 3 — Migration SQL

```sql
BEGIN;

-- Vérifier que les tables sont bien vides (safety net)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM public.product_groups) > 0 THEN
    RAISE EXCEPTION 'product_groups n''est pas vide — abort';
  END IF;
  IF (SELECT COUNT(*) FROM public.product_group_members) > 0 THEN
    RAISE EXCEPTION 'product_group_members n''est pas vide — abort';
  END IF;
END $$;

-- Drop dans l'ordre des dépendances
DROP TABLE public.product_group_members;
DROP TABLE public.product_groups;

COMMIT;
```

### Étape 4 — Régénération types Supabase

```bash
pnpm run generate:types
git add packages/@verone/types/src/supabase.ts
```

### Étape 5 — Tests Playwright

- Page éditeur produit (RelationsEditSection) : section "Relations" charge sans erreur
- Export Google Merchant Excel : feed généré sans erreur

---

## Hors scope définitif

- Édition simultanée multi-variantes (UX avancée — sprint dédié)
- Migration des produits existants vers les groupes (11 produits déjà liés via `variant_group_id`)
- Image héro automatique du primary_product_id (UI dédiée)
