# [BO-BRAND-004] Affichage badges marques sur fiche produit

**Date** : 2026-05-01
**Branche** : `feat/BO-BRAND-004-product-brand-badges`
**Worktree** : `/Users/romeodossantos/verone-bo-brand-004`
**Base** : `staging` (BO-BRAND-002 + BO-BRAND-003 + INFRA-RULES-003 mergées)
**Statut** : 🚧 1 commit, atomique, lecture seule.

---

## Scope

Afficher les marques internes Vérone Group (`products.brand_ids`) sur la fiche
produit, en lecture seule, dans la sidebar `GeneralRail` (visible sur tous les
onglets : Général / Tarification / Stock / Caractéristiques / Images /
Publication).

Pas de modification de schéma DB. Pas de toggle. Pas d'éditeur (le
`BrandsMultiSelect` existant reste pour l'édition dans le modal). C'est
l'affichage simple complémentaire qui manquait.

---

## Cohérence design des composants marque

**Source de vérité visuelle pour TOUT futur affichage de marques.**

### Composants existants (depuis BO-BRAND-002)

| Composant           | Fichier                                                                | Usage                                           |
| ------------------- | ---------------------------------------------------------------------- | ----------------------------------------------- |
| `BrandChip`         | `packages/@verone/products/src/components/badges/BrandChip.tsx`        | Badge unitaire (1 marque), réutilisable         |
| `BrandsMultiSelect` | `packages/@verone/products/src/components/forms/BrandsMultiSelect.tsx` | Sélecteur éditable multi-marques (mode édition) |

### Composant ajouté (BO-BRAND-004)

| Composant        | Fichier                                                              | Usage                                                         |
| ---------------- | -------------------------------------------------------------------- | ------------------------------------------------------------- |
| `BrandBadgeList` | `packages/@verone/products/src/components/badges/BrandBadgeList.tsx` | Liste de badges en lecture seule (mode affichage)             |
| `useBrands`      | `packages/@verone/products/src/hooks/use-brands.ts`                  | TanStack Query, fetch toutes les marques actives, cache 5 min |

### Règles de cohérence (à respecter dans tout futur affichage)

1. **Couleur** : `brand.brand_color` (pastille à gauche du badge). Fallback
   neutre si `NULL` (Romeo n'a pas encore défini les couleurs au 2026-05-01).
2. **Label** : `brand.name` (pas le slug, pas l'UUID). Toujours.
3. **Style** : `rounded-full`, `border border-slate-200`, `bg-white`,
   `text-slate-700`. Géré par `BrandChip` — ne pas dupliquer.
4. **Tailles** : `xs` (10px) pour les sidebars/rails, `sm` (12px) pour les
   contextes plus larges. 2 tailles seulement, pas plus.
5. **Lecture seule vs éditable** : utiliser `BrandBadgeList` pour l'affichage,
   `BrandsMultiSelect` pour l'édition. **Jamais inventer un 3e composant.**
6. **Vide** : si `brandIds` est `null/[]` → `BrandBadgeList` retourne `null`
   (pas de placeholder). Le parent contrôle la visibilité du label "Marques"
   selon ses besoins.

### Anti-patterns interdits

- ❌ Recréer un nouveau badge marque (utiliser `BrandChip`)
- ❌ Hardcoder les couleurs des marques (utiliser `brand_color` de la DB)
- ❌ Afficher le slug ou l'UUID à la place du `name`
- ❌ Variantes de taille autre que `xs` / `sm`
- ❌ Fetch direct dans le composant consommateur (utiliser `useBrands` —
  TanStack Query déduplique le cache)

---

## Fichiers modifiés (ce sprint)

### Nouveaux

- `packages/@verone/products/src/hooks/use-brands.ts` (38 lignes)
- `packages/@verone/products/src/components/badges/BrandBadgeList.tsx` (62 lignes)
- `docs/scratchpad/dev-plan-BO-BRAND-004.md` (ce fichier)

### Modifiés (barrel exports)

- `packages/@verone/products/src/components/badges/index.ts` (+1 ligne)
- `packages/@verone/products/src/hooks/index.ts` (+1 ligne)

### Modifiés (intégration)

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/_dashboard-blocks/GeneralRail.tsx` (+ prop `brandIds` + section "Marques" entre header et completion)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-general-dashboard.tsx` (+1 prop)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-pricing-dashboard.tsx` (+1 prop)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-stock-dashboard.tsx` (+1 prop)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-characteristics-dashboard.tsx` (+1 prop)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-images-dashboard.tsx` (+1 prop)
- `apps/back-office/.../produits/catalogue/[productId]/_components/product-publication-dashboard.tsx` (+1 prop)

11 fichiers touchés, 1 commit atomique. La section "Marques" est conditionnée par `brandIds.length > 0` → 0 régression sur les produits sans marques assignées (rétrocompat totale).

---

## Acceptance criteria

- [x] `pnpm --filter @verone/products type-check` PASS
- [x] `pnpm --filter @verone/back-office type-check` PASS
- [ ] CI 100% verte
- [ ] Aucune régression sur les produits `brand_ids = NULL/[]` (rendu identique avant/après)
- [ ] Visible sur tous les 6 onglets de la fiche produit (rail partagé)

---

## Hors scope

- ❌ Couleurs des marques (Romeo définira les `brand_color` plus tard via UI BO-BRAND-002 ou modal admin)
- ❌ Logos (`logo_url` est NULL pour les 4 marques en DB)
- ❌ Édition de l'assignation marques (déjà géré par `BrandsMultiSelect` ailleurs)
- ❌ Affichage marques dans la liste catalogue (`CatalogueListView.tsx`) — peut être ajouté plus tard avec `BrandBadgeList` réutilisé
- ❌ Tests Playwright (changement minimal, type-check + visual review suffisent)

---

## Référence

- Composants existants : `BrandChip`, `BrandsMultiSelect` (BO-BRAND-002)
- Données DB : table `brands` (4 lignes : Vérone, Boêmia, Solar, Flos), colonnes `id, slug, name, brand_color, logo_url, is_active, display_order`
- Roadmap : `.claude/work/BO-BRAND-MKT-roadmap-v3.md`
