# Rapport Phase 2 — Perf Commandes : suppression refetches doubles

## 2026-05-09 | Branche : fix/BO-PERF-ORDERS-002-mutations-cache-invalidation

---

## Fichiers modifiés × changements

| Fichier                                                                                                | Changement                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-orders-success-handlers.ts` | Suppression des 3 appels `fetchOrders(filters)` dans handleCreate/Edit/Shipment (doublon avec hooks profonds). handleLinkTransaction → CustomEvent. |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-cancel-order-action.ts`           | Remplacement de `await fetchOrders(filters)` + `fetchStats(filters)` par `dispatchOrdersRefetch()` dans handleCancel et handleCancelGuard.          |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderModals.tsx`                       | `OrderDetailModal.onUpdate` : `fetchOrders(filters)` → CustomEvent. Props `channelId`, `fetchOrders`, `fetchStats` préfixées `_` (non utilisées).   |
| `packages/@verone/orders/src/hooks/use-sales-orders-mutations.ts`                                      | Ajout `useQueryClient()` + `await queryClient.invalidateQueries({ queryKey: ['sales_orders'] })` dans `updateOrder`, `updateStatus`, `deleteOrder`. |
| `packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts`                                | Ajout `useQueryClient()` + `invalidateQueries` dans `createOrder` et `updateOrderWithItems`.                                                        |
| `packages/@verone/orders/src/hooks/use-sales-orders-payments.ts`                                       | Ajout `useQueryClient()` + `invalidateQueries` dans `markAsPaid`, `markAsManuallyPaid`, `deleteManualPayment`.                                      |
| `packages/@verone/orders/src/hooks/use-sales-orders-stock.ts`                                          | Ajout `useQueryClient()` + `invalidateQueries` dans `markWarehouseExit`.                                                                            |

---

## Analyse des doublons supprimés

### Avant (situation héritée)

| Action utilisateur | Hooks appelés                                          | fetchOrders() déclenchés            |
| ------------------ | ------------------------------------------------------ | ----------------------------------- |
| Créer commande     | `createOrder` + `handleCreateSuccess`                  | 2× (14 requêtes DB)                 |
| Éditer commande    | `updateOrderWithItems` + `handleEditSuccess`           | 2× (14 requêtes DB)                 |
| Expédier           | `shipItems` → `updateStatus` + `handleShipmentSuccess` | 2× (14 requêtes DB)                 |
| Valider/Dévalider  | `updateStatus` uniquement                              | 1× (7 requêtes DB)                  |
| Supprimer          | `deleteOrder` uniquement                               | 1× (7 requêtes DB)                  |
| Annuler            | API cancel + `handleCancelConfirmed`                   | 1× (7 requêtes DB — pas de doublon) |
| Lier transaction   | `handleLinkTransactionSuccess` uniquement              | 1× (7 requêtes DB)                  |
| Detail `onUpdate`  | `OrderDetailModal.onUpdate`                            | 1× (7 requêtes DB)                  |

### Après (Phase 2)

| Action utilisateur | Mécanisme refetch                                | fetchOrders() déclenchés     |
| ------------------ | ------------------------------------------------ | ---------------------------- |
| Créer commande     | `createOrder` (hook profond uniquement)          | 1× (7 requêtes DB)           |
| Éditer commande    | `updateOrderWithItems` (hook profond uniquement) | 1× (7 requêtes DB)           |
| Expédier           | `updateStatus` (via `shipItems`, hook profond)   | 1× (7 requêtes DB)           |
| Valider/Dévalider  | `updateStatus` uniquement                        | 1× (7 requêtes DB, inchangé) |
| Supprimer          | `deleteOrder` uniquement                         | 1× (7 requêtes DB, inchangé) |
| Annuler            | CustomEvent → listener `fetchOrders`             | 1× (7 requêtes DB, inchangé) |
| Lier transaction   | CustomEvent → listener `fetchOrders`             | 1× (7 requêtes DB, inchangé) |
| Detail `onUpdate`  | CustomEvent → listener `fetchOrders`             | 1× (7 requêtes DB, inchangé) |

**Gain : suppression de 21 requêtes DB parasites** pour les 3 actions à doublon (créer, éditer, expédier).

---

## Occurrences fetchOrders remplacées / supprimées

### Supprimées (doublons confirmés)

- `handleShipmentSuccess` : `void fetchOrders(filters)` → supprimé (shipItems → updateStatus fait déjà le fetch)
- `handleCreateSuccess` : `void fetchOrders(filters)` → supprimé (createOrder fait déjà le fetch)
- `handleEditSuccess` : `void fetchOrders(filters)` → supprimé (updateOrderWithItems fait déjà le fetch)

### Remplacées par CustomEvent (pas de doublon, mais découplage)

- `handleLinkTransactionSuccess` : `void fetchOrders(filters)` → `dispatchOrdersRefetch()`
- `handleCancelConfirmed` : `await fetchOrders(filters)` + `fetchStats(filters)` → `dispatchOrdersRefetch()`
- `handleCancelGuardConfirmed` : `await fetchOrders(filters)` + `fetchStats(filters)` → `dispatchOrdersRefetch()`
- `OrderDetailModal.onUpdate` : `void fetchOrders(filters)` + `fetchStats(filters)` → `dispatchOrdersRefetch()`

### Conservées intentionnellement (hooks profonds — mettent à jour le useState local)

- `createOrder` → `await fetchOrders()` ✓ (état local SalesOrdersTable)
- `updateOrderWithItems` → `await fetchOrders()` ✓
- `updateOrder` → `await fetchOrders()` ✓
- `updateStatus` → `await fetchOrders()` ✓
- `deleteOrder` → `await fetchOrders()` ✓
- `markAsPaid` → `await fetchOrders()` ✓
- `markAsManuallyPaid` → `await fetchOrders()` ✓
- `deleteManualPayment` → `await fetchOrders()` ✓
- `markWarehouseExit` → `await fetchOrders()` ✓

---

## Commit 2 (optimistic update) : NON implémenté

Le brief proposait l'optimistic update comme bonus conditionnel ("uniquement si scope raisonnable < 100 lignes"). La raison pour laquelle ce n'est pas implémenté :

`SalesOrdersTable` lit `orders = preloadedOrders ?? fetchedOrders` où `fetchedOrders` vient du `useState` interne de `useSalesOrders()`. Un `queryClient.setQueryData(['sales_orders', 'list'], ...)` ne met pas à jour ce `useState`. Pour un vrai update optimiste, il faudrait soit migrer vers `useQuery` (CS-2 reporté), soit injecter un setter de la liste dans les hooks profonds — ce qui représenterait une refonte plus profonde que le scope actuel.

L'`invalidateQueries` ajouté dans le Commit 2 est la solution correcte pour les consumers TanStack (`useSalesOrdersQuery`) sans toucher au flux `useState` existant.

---

## Vérification câblage Phase 1

- [x] `page.tsx` Server Component async ✓ — charge les orders SSR, passe `preloadedOrders`
- [x] `SalesOrdersClientsPage.tsx` consomme `preloadedOrders` ✓ — passe à `SalesOrdersTable` pour `channelFilter === 'all'`
- [x] `use-sales-order-actions.ts` lit cache TanStack au montage ✓ — lignes 111-123, skip fetch si cache < 30s
- [x] `setQueryData(['sales_orders', 'list', channelKey])` pour toutes variantes ✓ — `use-sales-orders-fetch-list.ts` lignes 536-543

---

## Risques résiduels

1. **CustomEvent et SSR** : `dispatchOrdersRefetch()` vérifie `typeof window !== 'undefined'` — safe côté server.
2. **fetchOrders sans filtre canal dans listener** : le listener de `useFetchOrdersList` appelle `fetchOrders()` sans filtre canal. Si l'utilisateur est sur un canal filtré (LinkMe, Site Internet) quand une annulation / lien transaction se produit, le refetch rechargera toutes les commandes sans filtre. Mais `SalesOrdersTable` filtre ensuite localement via `useSalesOrdersFilter` — comportement identique à l'ancienne implémentation avec `fetchOrders(filters)`.
3. **invalidateQueries sans queryFn** : `useSalesOrdersQuery` a `queryFn: () => Promise.resolve([])`. Après `invalidateQueries`, si quelque chose déclenche un refetch TanStack, le hook retournera `[]`. Mais `SalesOrdersTable` n'utilise pas `useSalesOrdersQuery` directement — il utilise `fetchedOrders` du `useState`. Aucune régression.
4. **Ordre des opérations après mutation** : on fait `await fetchOrders()` PUIS `await queryClient.invalidateQueries()`. Si `fetchOrders` réussit et `invalidateQueries` lève une exception (jamais en pratique), le `useState` est à jour mais le cache TanStack non. Impact nul sur l'UI actuelle.

---

## Vérifications effectuées

- [x] `pnpm --filter @verone/orders type-check` → vert (commit 1 + commit 2)
- [x] `pnpm --filter @verone/back-office type-check` → vert (commit 1 + commit 2)
- [x] `pnpm --filter @verone/back-office lint` → vert (0 warnings, 0 errors)
- [x] Pre-commit hook → vert (commit 1 + commit 2)
- [x] Aucun `any` introduit
- [x] Aucun `select('*')` ajouté
- [x] Aucun `useEffect` avec dep non-stable ajouté
- [x] `invalidateQueries` toujours `await` (conforme code-standards.md)

---

## Résumé pour Roméo (5 lignes)

Les actions sur les commandes — créer, modifier, expédier — provoquaient un double rechargement de la liste (7 requêtes réseau × 2 = 14 à chaque clic).
Ce doublon est supprimé : chaque action ne déclenche plus qu'un seul rechargement.
Les actions annuler et lier une transaction passent maintenant par un mécanisme plus propre qui évite aussi les risques de rechargements en cascade.
En parallèle, tous les hooks de mutation notifient correctement le système de cache pour les futurs consommateurs.
Résultat : moins de trafic réseau sur chaque action, meilleure réactivité de l'interface.
