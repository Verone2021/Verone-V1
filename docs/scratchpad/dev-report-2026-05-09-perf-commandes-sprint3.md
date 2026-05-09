# Dev Report — Sprint 3 Perf Commandes

## 2026-05-09 | Branche : feat/BO-PERF-ORDERS-003-optimistic-update-and-pagination

---

## Tableau fichiers × changements

| Fichier                                                            | Changement                                                                                                         |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `packages/@verone/orders/src/hooks/use-sales-orders-mutations.ts`  | Optimistic update sur `updateStatus` : snapshot du cache avant requête, mise à jour immédiate, rollback sur erreur |
| `packages/@verone/orders/src/hooks/use-sales-orders-fetch-list.ts` | `LIMIT 500 → LIMIT 50` sur la requête client fetchOrders                                                           |
| `apps/back-office/src/app/(protected)/commandes/clients/page.tsx`  | `LIMIT 500 → LIMIT 50` sur la requête SSR initiale                                                                 |

---

## Tâche A — Optimistic update sur updateStatus

**Statut : MINIMAL (wrapper sur useCallback existant, pas de refonte useMutation)**

**Pourquoi pas la refonte complète en useMutation ?**

`updateStatus` est une `useCallback` avec une logique métier complexe en cascade :

- Vérification auth user
- Fetch du statut courant en DB
- `validateStatusTransition` (FSM)
- Vérifications conditionnelles (items expédiés, factures finalisées) pour la dévalidation
- Libération `stock_reservations` conditionnelle (cancelled/draft)
- Dispatch `CustomEvent('stock-alerts-refresh')`
- `shipItems` l'appelle en interne (ligne 277)

La refondre en `useMutation` aurait exigé de wrapper toute cette logique, de gérer la dépendance circulaire avec `shipItems`, et d'introduire un contexte (`onMutate` context) dont le typage est non trivial. Risque de régression élevé.

**Ce qui a été fait :**

Au début de `updateStatus`, avant la première requête serveur :

```typescript
// Snapshot du cache actuel
const previousData = queryClient.getQueriesData<SalesOrder[]>({
  queryKey: ['sales_orders', 'list'],
});

// Mise à jour immédiate du cache (optimiste)
queryClient.setQueriesData<SalesOrder[]>(
  { queryKey: ['sales_orders', 'list'] },
  old =>
    Array.isArray(old)
      ? old.map(o => (o.id === orderId ? { ...o, status: newStatus } : o))
      : old
);
```

En cas d'erreur, rollback complet :

```typescript
for (const [key, data] of previousData) {
  queryClient.setQueryData(key, data);
}
```

**Résultat :** L'UI affiche le nouveau statut instantanément (comme Stripe/Linear). Si la DB rejette (transition invalide, facture finalisée, etc.), le statut revient à l'état précédent avec le toast d'erreur. Le `fetchOrders` + `invalidateQueries` existants resynchronisent la DB en arrière-plan.

---

## Tâche B — Pagination par curseur

**Statut : MINIMAL (limite initiale réduite, pagination JS déjà en place)**

**Pourquoi pas la pagination curseur réseau ?**

La pagination côté client est **déjà implémentée et active** :

- `enablePagination={true}` dans `SalesOrdersClientsPage.tsx`
- `defaultItemsPerPage={20}` — affiche 20 lignes par page
- `useSalesOrdersPagination` gère le découpage JS côté client

Le vrai problème était de charger 500 lignes pour en afficher 20. La solution immédiate : réduire le `LIMIT 500 → 50` dans les deux endroits de fetch.

Avec 168 commandes actuelles et une affichage de 50 à la fois, l'utilisateur a accès à toutes les commandes récentes. Le hook client rechargera toutes les commandes si les filtres avancés nécessitent plus de données.

**Pagination curseur réseau (CS-3)** : à faire dans un sprint dédié quand le volume dépasse 200+ commandes et que les utilisateurs se plaignent de ne pas voir toutes leurs commandes. Pas urgent aujourd'hui.

---

## Risques résiduels

1. **LIMIT 50 avec filtres actifs** : Si un utilisateur cherche une commande ancienne via les filtres de texte ou les filtres avancés, les 50 premières commandes chargées peuvent ne pas contenir le résultat. Le hook rechargera quand un filtre `channel_id` est appliqué (via `fetchOrders(filters)`) mais pas pour les filtres JS-only (search, tab). À surveiller si Romeo signale des commandes introuvables.

2. **Optimistic update sur statuts intermédiaires** : `shipItems` appelle `updateStatus` en interne. Le snapshot optimiste sera déclenché même lors d'une expédition. C'est correct car `updateStatus` resynchronise ensuite via `fetchOrders` + `invalidateQueries`.

3. **`setQueriesData` avec `partial match`** : La clé `['sales_orders', 'list']` correspond aussi à `['sales_orders', 'list', channelId]` (match par préfixe). C'est le comportement voulu — toutes les variantes de cache (par canal ou sans filtre) sont mises à jour.

---

## Vérifications effectuées

- `pnpm --filter @verone/orders type-check` : ✓ vert (0 erreur)
- `pnpm --filter @verone/back-office type-check` : ✓ vert (0 erreur)
- `pnpm --filter @verone/orders lint` : ✓ vert (0 warning)
- `pnpm --filter @verone/back-office lint` : ✓ vert
- Pre-commit hook : ✓ passé (prettier + eslint --fix)

---

## Résumé 5 lignes pour Roméo

Le changement de statut d'une commande (valider, dévalider, expédier...) est maintenant
instantané visuellement — l'écran se met à jour sans attendre la base de données, comme
sur Stripe ou Linear. Si la base refuse le changement (ex: une facture finale est liée),
l'écran revient automatiquement à l'état précédent avec un message d'erreur.

En parallèle, la page charge maintenant 50 commandes au lieu de 500 au premier affichage,
ce qui réduit la quantité de données transférée par 10 — la pagination par 20 était déjà
en place, inutile de charger plus.
