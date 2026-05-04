# [SI-PROD-001] Bulk actions catalogue — Rapport d'implémentation

**Branche** : `feat/SI-PROD-001-bulk-actions`
**Worktree** : `/Users/romeodossantos/verone-prod-001`
**PR** : #876 (draft)
**Date** : 2026-05-02

---

## Résumé

Implémentation des actions en masse sur la page `/produits/catalogue` du back-office.
2 commits sur la branche après rebase staging :

1. `cb6cbdab` (avant rebase) → `0bb4883b` (après rebase) `chore: scaffold task plan`
2. `0beda6d6` (avant rebase) `feat: bulk actions catalogue produits + extraction ProductRow`

---

## Livré

### Sélection multi-lignes

- `use-bulk-selection.ts` — hook Set-based avec `toggle/toggleAll/clear/all/some`
- Checkbox par ligne dans la vue liste, état highlight `selected`
- Checkbox header avec état `all/none/indeterminate`
- Checkbox carte mobile (touch target lg)

### Barre d'actions en masse (`CatalogueBulkActionsBar`)

Sticky en haut de liste, apparaît dès qu'au moins un produit est sélectionné.
Actions :

- ✅ **Publier** sur le site internet (`is_published_online = true`)
- ✅ **Dépublier** du site internet (`is_published_online = false`)
- ✅ **Statut** (modal `BulkStatusDialog`) : active / draft / preorder / discontinued
- ✅ **Prix** (modal `BulkPriceEditDialog`) :
  - Mode "Remplacer par X €"
  - Mode "Ajuster en %" (positif/négatif, arrondi 2 décimales)
- ✅ **Archiver** avec `confirm()` natif

### Hook mutations (`use-bulk-actions.ts`)

- Toutes les mutations passent par Supabase (`update().in('id', ids)`)
- `setPublished`, `setStatus`, `setPriceFlat`, `adjustPriceByPercent`, `archive`
- Toast succès/erreur après chaque mutation
- Refresh automatique de `loadCatalogueData` + onglet courant
- Clear sélection après mutation

### Pagination + tri

Déjà complets via BO-PROD-002. Audit confirmé :

- `CataloguePagination` : prev/next, page numbers (1, 2, ..., last), ellipsis
- `SortableHeader` : 9 colonnes triables (name, supplier, subcategory, weight, stock_real, cost_price, margin_percentage, completion_percentage, product_status)
- `CatalogueResultsInfo` : "Affichage X-Y sur Z" déjà présent
  Aucune modification nécessaire.

### Refactor

- `CatalogueListView.tsx` était à 502 lignes après ajout des checkboxes (limit 500)
- Extraction de `ProductRow` (~230 lignes) dans `CatalogueProductRow.tsx`
- `CatalogueListView.tsx` redescend à ~245 lignes (sous le seuil)

---

## Hors scope (sécurité, expressément exclu)

### Bulk stock direct → REFUSÉ

**Raison** : `.claude/rules/stock-triggers-protected.md` interdit la modification directe de
`products.stock_real` qui doit toujours passer par `stock_movements` (triggers protégés).

L'ajout d'un bulk stock nécessiterait :

- Modal qui demande le **nouveau stock cible** par produit (pas un delta unique pour tous)
- INSERT dans `stock_movements` avec `type='manual_adjustment'` et `delta = new - current`
- Triggers se chargent du recalcul

Trop de surface de bug pour un sprint "scope limité". À traiter dans un sprint dédié
`BO-STOCK-BULK-001` plus tard.

### Bulk delete → REFUSÉ

Le delete passe via `archive` d'abord. Si Roméo veut supprimer définitivement après
archivage, il peut le faire à la main (action existante par produit). Pas de bulk delete
direct pour limiter le risque.

### Import CSV → hors scope (futur sprint)

### Cross-sell / upsell → hors scope (futur sprint)

### Bouton Dupliquer → couvert par PR #875 (SI-SEO-001)

---

## Coordination multi-agents

### PR #875 (SI-SEO-001 — autre agent)

- Prévoit le bouton "Dupliquer produit" dans le catalogue BO (commit 2 de leur PR)
- Touche `CatalogueListView.tsx` (dans une zone différente : ajout de menu ligne)
- Conflit potentiel limité, rebase trivial attendu

J'ai SKIP la duplication pour ne pas faire double travail.

### Branche

- Créée immédiatement depuis `origin/staging` à jour
- Worktree isolé `/Users/romeodossantos/verone-prod-001`
- PR draft poussée tout de suite (#876)
- Rebase sur staging avant push final ✅

---

## Validations

| Étape                                           | Résultat  |
| ----------------------------------------------- | --------- |
| `pnpm --filter @verone/back-office type-check`  | ✅ vert   |
| `pnpm --filter @verone/back-office lint`        | ✅ vert   |
| `pnpm --filter @verone/back-office build` (8GB) | ✅ vert   |
| Rebase sur `origin/staging`                     | ✅ propre |
| `git push --force-with-lease`                   | ✅        |

Note build : nécessite `NODE_OPTIONS='--max-old-space-size=8192'` localement
(le Next.js build mange beaucoup de RAM, comportement habituel sur ce monorepo).
La CI GitHub a sa propre config.

---

## Test plan runtime (à valider Roméo)

Aller sur `/produits/catalogue`, vue **Liste** (toggle "view mode" si actuellement Grille) :

1. **Sélection** : cocher 3 produits → barre bleue apparaît "3 produits sélectionnés"
2. **Master checkbox** : cliquer le checkbox header → tout se coche / décoche
3. **Publier** : sélectionner 2-3 produits non publiés → bouton "Publier" → toast OK
4. **Dépublier** : sélectionner produits publiés → "Dépublier" → toast OK
5. **Statut** : cliquer "Statut" → modal avec 4 radio (active/draft/preorder/discontinued) → "Appliquer" → toast OK
6. **Prix (remplacement)** : cliquer "Prix" → mode "Remplacer par" → entrer 99.99 → "Appliquer" → toast OK
7. **Prix (ajustement %)** : cliquer "Prix" → mode "Ajuster en %" → entrer 10 → "Appliquer" → tous les prix sélectionnés × 1.1
8. **Archiver** : cliquer "Archiver" → confirm → toast OK → produits disparaissent de "Actifs", visibles dans "Archivés"
9. **Effacer sélection** : cliquer X → barre disparaît
10. **Pagination** : naviguer page 1 → page 2 → la sélection se vide automatiquement (UX simple)

Console DevTools : aucune erreur attendue.

---

## Estimation impact

- Bundle size /produits/catalogue : 21.6 kB (avant : ~21.5 kB) — +0.1 kB pour 4 nouveaux composants + 2 modals.
- Pas de migration SQL.
- Pas de régénération types.
- Aucune modification de routes API.

---

## Statut

PR #876 prête à être promue draft → ready après vert CI.
