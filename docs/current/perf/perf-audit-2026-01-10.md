# Audit Performance Back-Office — 2026-01-10

## Résumé Exécutif

**Symptômes signalés :**

- Toutes les pages du back-office chargent lentement
- Scroll qui freeze / saute
- Navigation : clic 1 = refresh sans changement, clic 2 = ok

**Top 3 causes identifiées :**

1. **Configuration anti-cache globale** : `force-dynamic` + `revalidate: 0` dans `layout.tsx` + 3× appels auth séquentiels par navigation
2. **N+1 Queries récurrents** : images produits (50 produits = 50 queries), comptage fournisseurs, commandes sans pagination
3. **Race condition navigation** : debounced hover (150ms) cause re-render des Links pendant clic → navigation annulée

---

## Baseline DEV vs PROD

| Page       | DEV (temps) | PROD (temps) | Conclusion              |
| ---------- | ----------- | ------------ | ----------------------- |
| /commandes | ~3-4s       | ~2-3s        | App lente (pas tooling) |
| /produits  | ~4-5s       | ~3-4s        | N+1 queries images      |
| /clients   | ~2-3s       | ~1.5-2s      | Modéré                  |

**Conclusion :** PROD lente aussi → problème dans l'app (UI/data/DB), pas le tooling dev.

---

## Findings par Lane

### LANE A — Data Layer

**Agent:** data-layer-auditor
**Statut:** ✅ Complété

#### Problèmes Critiques

1. **`force-dynamic` global** (`layout.tsx:28`)
   - Impact: **100% des pages** sans cache Next.js
   - Preuve: `export const dynamic = 'force-dynamic'; export const revalidate = 0;`

2. **3× `getSession()` par navigation**
   - `middleware.ts:68` → 1er appel
   - `middleware.ts:97` → 2ème appel (`getUser()`)
   - `auth-wrapper.tsx:42` → 3ème appel
   - Impact: +300-500ms par navigation

3. **N+1 Query Images Produits**
   - `page.tsx:551` : hook `useProductImages` dans boucle map
   - 50 produits = 50 requêtes individuelles
   - Impact: +2-4s sur catalogue

4. **RPC `get_linkme_orders` sans pagination**
   - `page.tsx:96` : toutes les commandes en une fois
   - Impact: +500ms-1s si >100 commandes

#### Fixes Proposés

| Fix                     | Impact | Effort | Fichier                             |
| ----------------------- | ------ | ------ | ----------------------------------- |
| Retirer `force-dynamic` | HAUT   | 1h     | `layout.tsx`                        |
| Session Context unique  | HAUT   | 2h     | `auth-wrapper.tsx`, `middleware.ts` |
| Batch fetch images      | HAUT   | 2h     | `use-product-images.ts`             |
| Pagination RPC          | MOYEN  | 1h     | `get_linkme_orders` RPC             |

---

### LANE B — DB Performance

**Agent:** database-architect
**Statut:** ✅ Complété

#### Index Manquants (Top 10)

| #   | Table                | Colonne(s)                    | Usage              | SQL Proposé                                                                                                                                                    |
| --- | -------------------- | ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `sales_orders`       | `channel_id, created_at`      | Queries LinkMe     | `CREATE INDEX CONCURRENTLY idx_sales_orders_channel_created ON sales_orders(channel_id, created_at DESC)`                                                      |
| 2   | `sales_order_items`  | `linkme_selection_item_id`    | Trigger commission | `CREATE INDEX CONCURRENTLY idx_sales_order_items_linkme_selection ON sales_order_items(linkme_selection_item_id) WHERE linkme_selection_item_id IS NOT NULL`   |
| 3   | `linkme_commissions` | `order_id`                    | Check doublons     | `CREATE UNIQUE INDEX CONCURRENTLY idx_linkme_commissions_order ON linkme_commissions(order_id)`                                                                |
| 4   | `products`           | `enseigne_id`                 | RLS policy         | `CREATE INDEX CONCURRENTLY idx_products_enseigne ON products(enseigne_id) WHERE enseigne_id IS NOT NULL`                                                       |
| 5   | `products`           | `created_by_affiliate`        | RLS policy         | `CREATE INDEX CONCURRENTLY idx_products_created_by_affiliate ON products(created_by_affiliate) WHERE created_by_affiliate IS NOT NULL`                         |
| 6   | `sales_orders`       | `customer_id, created_at`     | Page client        | `CREATE INDEX CONCURRENTLY idx_sales_orders_customer_created ON sales_orders(customer_id, created_at DESC)`                                                    |
| 7   | `organisations`      | `approval_status, created_at` | Dashboard admin    | `CREATE INDEX CONCURRENTLY idx_organisations_pending_approval ON organisations(approval_status, created_at DESC) WHERE approval_status = 'pending_validation'` |

#### Triggers Suspects

| Trigger                         | Table               | Risque       | Raison                                                                        |
| ------------------------------- | ------------------- | ------------ | ----------------------------------------------------------------------------- |
| `trg_create_linkme_commission`  | `sales_orders`      | 🔴 DANGEREUX | Jointure 3 niveaux sur CHAQUE update status, pas d'early exit pour non-LinkMe |
| `calculate_retrocession_amount` | `sales_order_items` | ✅ SAFE      | Calcul simple, pas de sous-requêtes                                           |
| `sync_contacts`                 | `organisations`     | ⚠️ À AUDITER | Potentiellement lourd si cascade                                              |

#### RLS Coûteuses

1. **`products` - "Affiliate view own created products"**
   - Sous-requête EXISTS avec JOIN sur CHAQUE SELECT
   - Manque index sur `enseigne_id`, `created_by_affiliate`

2. **`products` - "Affiliate create products"**
   - 3 sous-requêtes EXISTS sur INSERT

---

### LANE C — UI Performance

**Agent:** frontend-architect
**Statut:** ✅ Complété

#### Top 3 Pages Problématiques

| #   | Page                                | Problème Principal                          | Impact                           |
| --- | ----------------------------------- | ------------------------------------------- | -------------------------------- |
| 1   | `/produits/catalogue`               | Hook `useProductImages` dans map (N×render) | ~100 hooks actifs, freeze scroll |
| 2   | `/contacts-organisations/customers` | 1010 lignes, pas de virtualisation          | Chargement lent                  |
| 3   | `/stocks/mouvements`                | Recalcul complet quantités à chaque render  | 100 mouvements × recalcul        |

#### Anti-Patterns Détectés

1. **Hook dans loop** (`page.tsx:549`)

   ```tsx
   {currentProducts.map(product => {
     const ProductListItem = () => {
       const { primaryImage } = useProductImages({...}); // ❌
   ```

2. **Absence de virtualisation** : Toutes les listes/grilles

3. **États dupliqués** : `searchInput` + `filters.search` dans catalogue

4. **Pas de memoization** sur `MovementsTable`

#### Plan d'Unification (3 PR)

| PR  | Contenu                                        | Effort |
| --- | ---------------------------------------------- | ------ |
| #1  | Fixes critiques catalogue (mémo, batch images) | 2-3h   |
| #2  | Composant `<DataTable>` unifié                 | 4-5h   |
| #3  | Hook `useDataFetch` unifié + cache             | 3-4h   |

---

### LANE D — Bug Navigation

**Agent:** verone-debug-investigator
**Statut:** ✅ Complété

#### Root Cause Identifiée

**Bug:** Clic 1 = refresh sans navigation, Clic 2 = OK

**Cause:** Race condition entre `debouncedSetOpen` (150ms) et clic navigation

**Timeline:**

- T=0ms: Souris entre sidebar → `debouncedSetOpen(true)` schedulé T=150ms
- T=50ms: User clique sur Link
- T=150ms: `setOpen(true)` → React re-render Links → navigation annulée

**Pourquoi clic 2 fonctionne:** Sidebar déjà expanded, pas de re-render prévu.

#### Fix Proposé

**Fichier:** `apps/back-office/src/components/layout/app-sidebar.tsx`

```tsx
// AVANT (lignes 598-599)
<aside
  onMouseEnter={() => debouncedSetOpen(true)}
  onMouseLeave={() => debouncedSetOpen(false)}

// APRÈS
<aside
  onMouseEnter={() => setOpen(true)}  // Immédiat
  onMouseLeave={() => debouncedSetOpen(false)}  // Garde debounce
```

---

### LANE E — Governance

**Agent:** audit-governor
**Statut:** ✅ Complété

#### Checklist PR "Perf"

Pour toute PR touchant perf/UI/data/DB :

- [ ] Preuve avant/après (mesure reproductible)
- [ ] `npm run type-check` = 0 erreurs
- [ ] `npm run build` = succeeded
- [ ] Si DB touchée : SQL listé + plan test + rollback

#### Budgets Performance

| Métrique                | Budget                       | Mesure               |
| ----------------------- | ---------------------------- | -------------------- |
| Page critique (3 pages) | < 2s chargement              | Avant: 3-5s          |
| Requêtes listing        | Pagination obligatoire       | Plusieurs sans LIMIT |
| RLS policy              | Index sur colonnes utilisées | 3 manquants          |

---

## Plan d'Action Priorisé

### Quick Wins (1-2h)

1. **Fix navigation bug** : `onMouseEnter={() => setOpen(true)}` immédiat
2. **Réduire `ITEMS_PER_PAGE`** : 50 → 24 dans catalogue
3. **Supprimer `searchInput` dupliqué** dans catalogue

### Medium (1-2j)

1. **Retirer `force-dynamic`** + Session Context unique
2. **Batch fetch images** : `useProductImagesBatch(productIds)`
3. **Créer indexes P0** (4 indexes critiques)

### Structural (1-2 semaines)

1. **Refactoriser trigger `trg_create_linkme_commission`** avec early exits
2. **Unifier composant `<DataTable>`**
3. **Ajouter virtualisation** (react-window)

---

## PR Candidates (max 5)

| #   | Titre                                         | Impact   | Effort | Fichiers                                          |
| --- | --------------------------------------------- | -------- | ------ | ------------------------------------------------- |
| 1   | fix: navigation double-click bug              | CRITIQUE | 30min  | `app-sidebar.tsx`                                 |
| 2   | perf: retirer force-dynamic + session context | HAUT     | 2h     | `layout.tsx`, `auth-wrapper.tsx`, `middleware.ts` |
| 3   | perf: batch fetch images produits             | HAUT     | 2h     | `use-product-images.ts`, `page.tsx`               |
| 4   | perf: indexes DB P0                           | HAUT     | 1h     | Migration SQL                                     |
| 5   | perf: optimisations catalogue UI              | MOYEN    | 3h     | `page.tsx`, hooks                                 |

---

## Risques & Non-Goals

### Risques

- **Retrait `force-dynamic`** : Tester auth complète (login, logout, session)
- **Indexes CONCURRENTLY** : 1-5min par table (pas de lock mais CPU)
- **Refacto trigger** : Risque si logique commission mal comprise

### Non-Goals (ce qu'on ne touche pas maintenant)

- Migration vers React Query (trop structural)
- Virtualisation complète (après stabilisation)
- Refonte architecture auth (trop risqué)

---

## Gains Estimés Après Fixes

| Métrique                   | Avant     | Après (estimé) |
| -------------------------- | --------- | -------------- |
| Temps chargement catalogue | 4-5s      | 1.5-2s (-60%)  |
| Queries par page           | 50-100    | 10-20 (-80%)   |
| Bug navigation             | 50% échec | 0% échec       |
| Scroll freeze              | Fréquent  | Rare           |

---

_Rapport généré par verone-orchestrator — Audit complété 2026-01-10_
