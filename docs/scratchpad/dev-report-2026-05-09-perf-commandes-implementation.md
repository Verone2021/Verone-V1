# Rapport Implémentation — Perf Commandes Vague 1 + Vague 2

## 2026-05-09 | Branche : fix/BO-PERF-ORDERS-001-list-detail-optimization

---

## Fichiers modifiés

| Fichier                                                                                      | Type de changement  | Impact                                                                       |
| -------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts`                           | Commit 1 + Commit 5 | Retrait colonnes stock (4 colonnes × 498 items) + setQueryData multi-filtres |
| `packages/@verone/orders/src/hooks/use-sales-orders-fetch.ts`                                | Commit 2            | Promise.all sur 4 appels séquentiels (org/individual/creator/transactions)   |
| `packages/@verone/orders/src/components/modals/use-universal-order-header.ts`                | Commit 2            | Promise.all sur 3 appels séquentiels (org/individual/creator)                |
| `packages/@verone/orders/src/hooks/use-order-items.ts`                                       | Commit 3            | useMemo(createClient) + select explicite (×3 occurrences)                    |
| `apps/back-office/src/app/(protected)/commandes/clients/page.tsx`                            | Commit 4            | Transformation en Server Component async                                     |
| `apps/back-office/src/app/(protected)/commandes/clients/SalesOrdersClientsPage.tsx`          | Commit 4            | Nouveau Client Component extrait                                             |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-order-actions.ts` | Commit 5            | Cache TanStack check au montage (skip fetch si < 30s)                        |

---

## Commits livrés

1. **Commit 1** `2015d98f` — Retrait stock de la requête liste  
   Supprime `stock_quantity, stock_real, stock_forecasted_in, stock_forecasted_out` des 498 items chargés en liste. Confirmé non-utilisé dans `SalesOrderTableRow`, `SalesOrderStatsCards`, `SalesOrderDataTable` par grep exhaustif.

2. **Commit 2** `ad8eb11a` — Parallélisation fetchOrder  
   `use-sales-orders-fetch.ts` + `use-universal-order-header.ts` : org/individual/creator/transactions passent de 3-4 appels séquentiels à un `Promise.all`. Gain estimé -300 à -500ms à chaque ouverture de fiche. `individual_customer_id` ajouté au select de `use-universal-order-header.ts` (manquant, nécessaire pour le fetch individual parallèle).

3. **Commit 3** `868b783a` — Stabilisation createClient + select explicite useOrderItems  
   `createClient()` dans le corps du hook → `useMemo(() => createClient(), [])` : prévient une boucle infinie de render (même vecteur que l'incident prod du 16 avril 2026). 3 occurrences de `select('*')` remplacées par des selects explicites différenciés sales/purchase (les tables n'ont pas les mêmes colonnes : `tax_rate`, `quantity_shipped`, `retrocession_*` n'existent que sur `sales_order_items`).

4. **Commit 4** `3475622e` — Migration Server Component  
   `page.tsx` devient `async` Server Component. Le fetch initial (liste sans items) se fait côté serveur. HTML pré-rendu envoyé au navigateur = zéro aller-retour réseau au premier affichage pour le canal "all". Les hooks interactifs (router, searchParams, modals) extraits dans `SalesOrdersClientsPage.tsx` (Client Component). `preloadedOrders` passé uniquement pour `channelFilter === 'all'` (évite les données périmées lors des changements de filtre canal).

5. **Commit 5** `aae5d4be` — Cache TanStack  
   `fetchOrders` alimente maintenant le cache pour toutes les variantes de filtre canal (`['sales_orders', 'list', channelId]`). Au remontage du composant, si les données ont moins de 30s, `fetchOrders` est skippé — zéro appels réseau lors d'une navigation retour-avant dans la fenêtre de 30 secondes.

---

## Quick wins livrés vs reportés

### Livrés (Vague 1 + Vague 2)

| ID                              | Priorité originale | Statut                                                             |
| ------------------------------- | ------------------ | ------------------------------------------------------------------ |
| QW-1 Retrait stock liste        | HAUT               | ✅ Livré                                                           |
| QW-2 Parallélisation fetchOrder | HAUT               | ✅ Livré                                                           |
| QW-3 createClient useMemo       | MOYEN              | ✅ Livré                                                           |
| QW-4 Cache TanStack montage     | MOYEN              | ✅ Livré (fondations)                                              |
| QW-5 select('\*') useOrderItems | BAS                | ✅ Livré                                                           |
| CS-1 Server Components liste    | TRÈS HAUT          | ✅ Livré                                                           |
| CS-2 Refonte hook useQuery      | HAUT               | ⚠️ Fondations posées (cache lu + écrit), refonte complète reportée |

### Reporté

**CS-2 refonte complète** : les mutations (`use-sales-orders-success-handlers.ts` × 4, `use-sales-orders-mutations.ts` × N) appellent encore `fetchOrders()` directement au lieu de `queryClient.invalidateQueries()`. Ce serait le gain le plus impactant sur les actions (valider, expédier, lier transaction) mais touche ~15 appels dans 4 fichiers avec risque de régression élevé. Reporté à un sprint dédié `[BO-PERF-ORDERS-002]`.

**CS-3 pagination curseur** : non urgent (168 commandes), à faire à 500+ commandes.

---

## Mesures avant/après (estimations basées sur l'audit EXPLAIN ANALYZE)

| Scénario                             | Avant                                   | Après (estimé)                       |
| ------------------------------------ | --------------------------------------- | ------------------------------------ |
| Chargement liste initial (canal all) | ~300-600ms (7 requêtes)                 | ~0ms (HTML pré-rendu SSR)            |
| Remontage liste (< 30s)              | ~300-600ms (7 requêtes)                 | ~0ms (cache TanStack)                |
| Ouverture fiche commande             | ~350-600ms (3-4 requêtes séquentielles) | ~150-200ms (Promise.all)             |
| Payload items × liste                | 498 items × 7 colonnes stock            | 498 items × 3 colonnes (id/name/sku) |

---

## Risques résiduels

1. **preloadedOrders SSR sans enrichissements** : les colonnes `creator`, `invoice_status`, `has_pending_packlink`, `is_matched`, `has_desync_draft` etc. ne sont PAS dans le fetch SSR. `SalesOrdersTable` les affichera vides au premier rendu, puis fetchOrders côté client les remplira. L'UI peut clignoter légèrement (badges absents puis présents). Acceptable comme premier chargement ; corrigeable en ajoutant ces colonnes au fetch SSR si besoin.

2. **Cache TanStack et filtres canal** : si l'utilisateur change de filtre canal dans les 30s, les données SSR (canal "all") ne sont pas passées en `preloadedOrders` pour les autres canaux, donc fetchOrders se déclenche normalement — pas de régression.

3. **useOrderItems deps** : `itemsSelect` ajouté aux deps de `useCallback`. Comme `itemsSelect` dérive de `orderType` (stable string), aucune boucle possible.

---

## Résumé pour Roméo (5 lignes)

Les pages commandes sont maintenant plus rapides de plusieurs façons.
Quand tu ouvres la liste, le contenu de base s'affiche immédiatement (plus d'attente réseau au premier chargement).
Quand tu rouvres la liste moins de 30 secondes après l'avoir quittée, elle s'affiche instantanément depuis la mémoire.
Quand tu ouvres une fiche commande, les infos client et créateur chargent en parallèle au lieu d'attendre l'une après l'autre (gain d'environ une demi-seconde).
Un bug latent qui aurait pu provoquer des rechargements en boucle (comme l'incident d'avril) a été corrigé au passage.

---

## Log changelog

```
## 2026-05-09 — [BO-PERF-ORDERS-001] Vague 1 + Vague 2 optimisation commandes
- **Fichiers** : 7 fichiers (voir tableau ci-dessus)
- **Type** : perf + fix
- **Description** : Retrait stock inutile en liste, parallélisation fetches détail,
  stabilisation createClient, select explicite, migration SSR page liste,
  cache TanStack au remontage.
- **Responsive** : N/A (optimisations réseau/rendu, pas de changement UI)
```
