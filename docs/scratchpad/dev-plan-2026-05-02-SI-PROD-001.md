# [SI-PROD-001] Bulk actions + pagination + tri sur catalogue produits

**Branche** : `feat/SI-PROD-001-bulk-actions`
**Worktree** : `/Users/romeodossantos/verone-prod-001`
**Date démarrage** : 2026-05-02

---

## Audit existant (avant codage)

### Déjà fait sur `/produits/catalogue`

- ✅ Pagination via `CataloguePagination` (composant dédié + state dans `useCatalogue`)
- ✅ Tri colonne par colonne via `SortableHeader` (state local `CatalogueListView`)
  - Colonnes triables : name, supplier, subcategory, weight, stock_real, cost_price, margin_percentage, completion_percentage, product_status
- ✅ Quick-edit individuel : prix, fournisseur, poids, dimensions, sous-cat, photo
- ✅ Onglets `active` / `incomplete` / `archived`
- ✅ Vues sauvegardées (BO-CATALOG-VIEWS-001)
- ✅ Recherche multi-critères (BO-CATALOG-SEARCH-001)
- ❌ Sélection multi-lignes (checkboxes)
- ❌ Barre actions en masse
- ❌ Bulk publier / dépublier site internet (`is_published_online`)
- ❌ Bulk changement statut produit (draft / active / inactive)
- ❌ Bulk update prix
- ❌ Bulk archiver / désarchiver
- ❌ Bulk supprimer

### Coordination avec PR #875 SI-SEO-001 (autre agent)

PR #875 prévoit dans son commit 2 : "Bouton Dupliquer produit dans catalogue BO". Files annoncés :
- `apps/back-office/src/app/(protected)/produits/actions/duplicate-product.ts` (nouveau)
- `édit : page liste catalogue produits BO (ajout action Dupliquer)`

Action prévue : intégration du bouton dans `CatalogueListView` (ou un menu d'action ligne).

**Conflit potentiel** : `CatalogueListView.tsx` édité des deux côtés.

**Stratégie** :
- Je SKIP la duplication (déjà dans le scope de PR #875).
- Mes éditions sur `CatalogueListView.tsx` se concentrent sur la colonne checkbox (en première position) et n'ajoutent pas de bouton "Dupliquer". Si conflit, rebase trivial.
- Mon scope ne touche pas à `actions/duplicate-product.ts`.

### Contraintes

- `stock_real` : NE JAMAIS mettre à jour directement par UPDATE — passe par `stock_movements` (triggers protégés). → Bulk stock **EXCLU** du sprint, hors scope.
- Mise à jour prix : `cost_price` est le prix d'achat HT, modifiable directement (pas de trigger métier critique). Le prix de vente est calculé.
- Migration SQL : aucune nécessaire (toutes colonnes existent déjà).

---

## Scope retenu (3 commits, 1 PR)

### Commit 1 — Sélection multi-lignes infrastructure

**Fichiers** :
- édit `apps/back-office/src/app/(protected)/produits/catalogue/types.ts` — type `Selection`
- édit `apps/back-office/src/app/(protected)/produits/catalogue/use-catalogue-page.ts` — state selectedIds, handlers toggle/clear/all
- édit `apps/back-office/src/app/(protected)/produits/catalogue/CatalogueListView.tsx` — colonne checkbox + checkbox header
- édit `apps/back-office/src/app/(protected)/produits/catalogue/CatalogueProductCardMobile.tsx` — checkbox carte mobile
- édit `apps/back-office/src/app/(protected)/produits/catalogue/CatalogueGridView.tsx` — checkbox grille

### Commit 2 — Barre d'actions en masse + mutations

**Fichiers** :
- nouveau `apps/back-office/src/app/(protected)/produits/catalogue/CatalogueBulkActionsBar.tsx` — barre publier/dépublier/statut/prix/archiver/supprimer
- nouveau `apps/back-office/src/app/(protected)/produits/catalogue/modals/BulkPriceEditDialog.tsx` — modal édition prix en masse
- nouveau `apps/back-office/src/app/(protected)/produits/catalogue/modals/BulkStatusDialog.tsx` — modal changement statut
- nouveau `apps/back-office/src/app/(protected)/produits/catalogue/use-bulk-actions.ts` — hook mutations (Supabase update batch)
- édit `apps/back-office/src/app/(protected)/produits/catalogue/page.tsx` — intégration bar + dialogs

### Commit 3 — Pagination + tri (vérif & polish)

**Fichiers** :
- édit `apps/back-office/src/app/(protected)/produits/catalogue/catalogue-list-helpers.tsx` — ajout colonne `created_at` triable si pertinent
- édit `apps/back-office/src/app/(protected)/produits/catalogue/CataloguePagination.tsx` — affichage de "X-Y sur Z" si manquant

---

## Mutations en masse (détails)

### Publier / dépublier
```ts
supabase.from('products')
  .update({ is_published_online: true | false })
  .in('id', selectedIds)
```
Effet : propagation au site-internet via fetch `is_published_online = true`.

### Changement statut
```ts
supabase.from('products')
  .update({ product_status: 'active' | 'draft' | 'inactive' })
  .in('id', selectedIds)
```

### Édition prix
```ts
supabase.from('products')
  .update({ cost_price: newPrice })
  .in('id', selectedIds)
```
**UX** : modal avec choix "remplacer par X €" / "augmenter de X %" / "diminuer de X %".

### Archiver / désarchiver
Itère `archiveProduct(id)` / `unarchiveProduct(id)` (déjà existant dans `useCatalogue`).

### Supprimer
Itère `deleteProduct(id)` (déjà existant dans `useCatalogue`).

### EXCLU du sprint
- Bulk stock direct : violerait les triggers stock protégés. À traiter dans un sprint dédié via `stock_movements`.
- Import CSV : hors scope.
- Cross-sell/upsell : hors scope.

---

## Test plan

- [ ] Type-check `@verone/back-office` vert
- [ ] Build `@verone/back-office` vert
- [ ] Test runtime Playwright : sélection 3 produits, bulk publier, vérification toast + refresh liste
- [ ] Test runtime : sélection master toggle (cocher tout / décocher tout)
- [ ] Test runtime : changement statut → produit passe en inactif
- [ ] Sélection préservée après changement de page ? Non — clear sur changement page (UX simple)

## Hors scope (futur sprint)

- Bulk stock (via stock_movements adjustment)
- Import CSV produits
- Cross-sell / upsell
- Bouton Dupliquer (couvert par PR #875 SI-SEO-001)
