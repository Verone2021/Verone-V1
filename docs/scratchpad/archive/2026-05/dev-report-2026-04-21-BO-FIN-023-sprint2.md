# Dev Report — BO-FIN-023 Sprint 2

**Date** : 2026-04-21
**Task ID** : [BO-FIN-023]
**Branche** : feat/BO-FIN-023-cascade-order-docs

---

## Fichier créé

`apps/back-office/src/app/api/sales-orders/[id]/cancel/route.ts`
~ 258 lignes (lint-reformatées par prettier dans le hook pre-commit)

---

## Résultat type-check / lint

- `pnpm --filter @verone/back-office type-check` : **0 erreur** (exit 0)
- `pnpm --filter @verone/back-office lint --max-warnings=0` : **0 warning** (exit 0)
- Pre-commit hook (lint-staged + prettier) : **PASS**
- Pre-push hook : **PASS**

---

## Hash commit + push

`84968cbd9` — `[BO-FIN-023] feat: POST /api/sales-orders/[id]/cancel with cascade`
Poussé sur `origin/feat/BO-FIN-023-cascade-order-docs`

---

## Architecture de la route

### Patterns respectés

- Auth via `createServerClient` + `auth.getUser()` → HTTP 401 si absent (pattern de `qonto/quotes/by-order/[orderId]/regenerate/route.ts`)
- `createAdminClient` pour toutes les requêtes DB métier (lecture commande, update status, stock_reservations)
- Validation Zod sur le body `{ force?: boolean }`
- UUID guard sur le path param `id`
- Zero `any` — types explicites sur toutes les branches

### Table de routage verdicts

| Verdict   | force | HTTP | Corps                                                              |
| --------- | ----- | ---- | ------------------------------------------------------------------ |
| `proceed` | n/a   | 200  | `{ success: true, cancelled: true, docsDeleted: N }`               |
| `confirm` | false | 409  | `{ requireConfirm: true, reason, docsToDelete: [...] }`            |
| `confirm` | true  | 200  | `{ success: true, cancelled: true, docsDeleted: N, forced: true }` |
| `refuse`  | n/a   | 400  | `{ success: false, error: reason }`                                |

### Ordre des opérations (garantie d'atomicité partielle)

1. `executeCascade(docsToDelete)` — si échoue → pas de mise à jour status
2. `cancelOrderInDb(orderId)` — update `status = 'cancelled'`
3. `releaseStockReservations(orderId, userId)` — non-bloquant (log si erreur)

Le status `sales_orders` n'est JAMAIS mis à jour si `executeCascade` lève une exception. En cas d'erreur partielle, la réponse 500 inclut `partiallyDeletedDocs` (IDs attendus) pour visibilité frontend.

### Libération stock_reservations

Copie exacte du pattern `use-sales-orders-mutations.ts:165-176` :

- `.eq('reference_type', 'sales_order')`
- `.eq('reference_id', orderId)`
- `.is('released_at', null)`
- `released_by = userId` depuis la session auth serveur (jamais depuis le body)

Non-bloquant intentionnellement : les triggers DB gèrent le rollback stock prévisionnel (`rollback_forecasted_out_on_so_devalidation`).

---

## Edge cases pensés

1. **Body vide ou non-JSON** : try/catch sur `request.json()` → fallback `{}` → `force = false` par défaut. Pas d'erreur 400 inutile.
2. **Commande déjà annulée** : bloqué par le guard `status !== 'draft'` → HTTP 400 avec message explicite.
3. **planCascadeCancel lève une exception** (ex: Qonto down) : capturé, HTTP 500, le status commande n'est pas touché.
4. **executeCascade échoue à mi-parcours** : `cancelOrderInDb` n'est pas appelé → commande reste `draft`. La réponse 500 expose les IDs attendus pour le log.
5. **stock_reservations inexistantes** : `.is('released_at', null)` + aucune ligne = no-op, pas d'erreur.
6. **UUID invalide dans le path** : rejeté avant toute requête DB.
7. **Dévis 404 Qonto** : géré dans `executeCascade` (côté sprint 1) → soft-delete local uniquement.

---

## Ce qui n'est PAS fait (scope sprint 3)

- Hook client `use-sales-order-actions.ts` : appel HTTP + gestion du 409 (modal confirmation)
- UI modal confirmation pour le cas `confirm` + `force=true`
