# dev-report — BO-PERF-TANSTACK-001 — Migration TanStack Query

**Date** : 2026-05-08
**Branche** : `fix/BO-PERF-COMPLETE-001-quickwins-and-tanstack`
**Commits** : 4 commits (hooks #1, #2, #3, bonus)

---

## Brief utilisateur final (5 lignes max)

Trois changements concrets pour Roméo après ce sprint :

1. **Fiche produit** : modifier un champ (nom, poids, description) ne fait plus clignoter toute la page — le changement est visible instantanément, la sauvegarde DB se fait en arrière-plan.
2. **Page factures** : passer de l'onglet "Factures" à "Devis" puis "Avoirs" ne relance plus trois appels réseau — les données restent en mémoire 60 secondes.
3. **Détail d'une facture/devis** : naviguer vers la même facture depuis un lien recharge depuis le cache, pas depuis Qonto.

---

## Hooks migrés

### Hook #1 — `use-product-detail.tsx`

**Fichier** : `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/hooks/use-product-detail.tsx`

**QueryKeys définies** :

- `['product', productId]` — produit avec toutes ses relations (staleTime 30s)

**Pattern** :

- `useQuery` remplace `useState<Product>` + `useEffect(() => fetchProduct())`
- `useMutation` avec `onMutate` optimistic update : le cache est mis à jour AVANT la réponse DB → 0 clignotement visuel
- `onError` rollback du cache si l'update DB échoue
- Champs FK (subcategory_id, supplier_id, enseigne_id, assigned_client_id) déclenchent un `invalidateQueries` pour recharger les objets joints
- `fetchProduct()` exposé comme shim de compatibilité → appelle `invalidateQueries`

**Consumers non modifiés** :

- `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/page.tsx` — API publique identique
- `apps/back-office/src/app/(protected)/canaux-vente/site-internet/produits/[id]/page.tsx` — non impacté (hook différent `use-product-detail.ts`)

---

### Hook #2 — `use-sales-orders-fetch-list.ts` + `use-sales-orders-query.ts`

**Fichiers** :

- `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts`
- `packages/@verone/orders/src/hooks/use-sales-orders-query.ts` (nouveau)
- `packages/@verone/orders/src/hooks/index.ts` (export ajouté)

**QueryKeys définies** :

- `['sales_orders', 'list']` — liste complète sans filtres

**Stratégie** : Refactoring profond impossible sans toucher 7+ fichiers (sous-hooks mutations, payments, stock reçoivent `fetchOrders` et `setOrders` en deps). Approche adoptée :

- `useFetchOrdersList` appelle maintenant `queryClient.setQueryData(['sales_orders', 'list'])` après chaque fetch non-filtré → le cache TanStack est alimenté sans changer l'architecture interne
- Nouveau hook `useSalesOrdersQuery` : consomme le cache `['sales_orders', 'list']` en lecture seule pour les futurs consumers qui n'ont pas besoin de mutations
- Les mutations existantes continuent d'appeler `await fetchOrders()` → re-peuple le cache en même temps que le setState local

**Consumers non modifiés** :

- `SalesOrdersTable.tsx`, `OrganisationSalesOrdersSection.tsx`, `OrderDetailModal.tsx`, `use-sales-order-submit.ts`, `use-factures-page.ts`, `use-consultation-detail.ts` — API publique de `useSalesOrders()` identique

---

### Hook #3 — `use-document-detail.ts`

**Fichier** : `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts`

**QueryKeys définies** :

- `['financial_document', id, typeParam]` — document Qonto via API route (staleTime 60s)
- `['document_order_customer', salesOrderId]` — données client liées (staleTime 60s, enabled si orderLink est set)

**Pattern** :

- 2 `useEffect` remplacés par 2 `useQuery` dépendants (query #2 enabled seulement si `orderLink` existe)
- Noms partenaire : priorité aux données de l'API route (`localData`), fallback sur `customer` de la commande
- `orderContacts` et `organisationId` dérivés du cache query #2

**Impact** : naviguer entre `/factures/[id1]` et `/factures/[id2]` et revenir sur `id1` → cache hit si < 60s

**Consumers non modifiés** :

- `apps/back-office/src/app/(protected)/factures/[id]/page.tsx` — API publique identique

---

### BONUS — `use-factures-fetch.ts` + `use-factures-page.ts`

**Fichiers** :

- `apps/back-office/src/app/(protected)/factures/hooks/use-factures-fetch.ts`
- `apps/back-office/src/app/(protected)/factures/hooks/use-factures-page.ts`

**QueryKeys définies** :

- `['invoices', 'list']` — factures Qonto (staleTime 60s)
- `['quotes', 'list']` — devis Qonto (staleTime 60s)
- `['credit_notes', 'list']` — avoirs Qonto (staleTime 60s)

**Pattern** :

- 3x `useState + useCallback fetch` → 3x `useQuery`
- `fetchXxxAsync()` deviennent des `queryClient.invalidateQueries()` — API publique préservée
- `handleDeleteQuote` utilise `invalidateQueries` au lieu de `void fetchQontoQuotesAsync()`
- `use-factures-page.ts` : suppression des 2 `useEffect` avec `loaded` flags (devenus inutiles)
- Les 3 queries fetchent au mount → switch d'onglet = cache hit (0 requête réseau si < 60s)

---

## Mesures avant/après (estimation via pattern)

| Scénario                                | Avant                       | Après                           |
| --------------------------------------- | --------------------------- | ------------------------------- |
| Modifier champ produit + voir résultat  | 1 re-render cascade (flash) | 0 flash — cache update immédiat |
| Switch onglet factures → devis → avoirs | 3 fetch réseau              | 0 fetch (cache hit < 60s)       |
| Revenir sur une fiche facture déjà vue  | 1 fetch API route           | 0 fetch (cache hit < 60s)       |
| Revenir sur une fiche produit déjà vue  | 1 fetch Supabase            | 0 fetch (cache hit 30s)         |

---

## Type-checks

- `pnpm --filter @verone/orders type-check` : ✅ 0 erreur
- `pnpm --filter @verone/back-office type-check` : ✅ 0 erreur (après chaque commit)

---

## Changelog entry

`docs/logs/2026-05-08.md` — voir entrée dédiée.

---

## Fichiers modifiés

1. `apps/back-office/src/app/(protected)/produits/catalogue/[productId]/_components/hooks/use-product-detail.tsx`
2. `apps/back-office/src/app/(protected)/factures/[id]/use-document-detail.ts`
3. `apps/back-office/src/app/(protected)/factures/hooks/use-factures-fetch.ts`
4. `apps/back-office/src/app/(protected)/factures/hooks/use-factures-page.ts`
5. `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts`
6. `packages/@verone/orders/src/hooks/use-sales-orders-query.ts` (nouveau)
7. `packages/@verone/orders/src/hooks/index.ts`
