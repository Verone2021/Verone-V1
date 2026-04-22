# Dev Report — BO-SHIP-FEAT-001 (Email tracking manuel)

**Date** : 2026-04-22
**Branche** : fix/BO-SHIP-FEAT-001-email-backorder
**Statut** : Review round 1 corrections appliquées — PRÊT pour round 2

---

## Périmètre final de la PR

**F5 uniquement** : envoi manuel de l'email de suivi de livraison au client (modal `SendShippingTrackingModal`).

**F8 retirée** : clôture commande backorder — reportée dans PR séparée `BO-SHIP-BACKORDER-001` (voir dev-plan dédié).

---

## Corrections review round 1 (2026-04-22)

### F8 retirée de cette PR — FEU ROUGE trigger stock

Raison : le trigger DB qui libère `stock_forecasted_out` sur transition `partially_shipped → closed` n'existe pas. Créer ce trigger = FEU ROUGE selon `.claude/rules/stock-triggers-protected.md`. Sans ce trigger, mettre le status à `closed` n'aurait aucun effet sur le stock prévisionnel — la feature serait silencieusement cassée.

Fichiers nettoyés :

- `packages/@verone/orders/src/components/modals/order-detail/OrderActionsCard.tsx` — retrait du bouton "Clôturer", de l'AlertDialog, des states `showCloseConfirm` / `closeReason` / `closing`, de `handleConfirmClose`, de `onOrderUpdated?`, et des imports `AlertDialog*`, `Textarea`, `PackageX`, `createClient`, `Database`, `toast`, `useToast`
- `packages/@verone/orders/src/components/modals/OrderDetailModal.tsx` — retrait de la prop `onOrderUpdated` passée à `OrderActionsCard`

### CRITICAL 2 — Champ CC retiré de SendShippingTrackingModal

Le champ CC était affiché dans l'UI mais jamais envoyé à l'endpoint `/api/emails/shipping-notification` (endpoint ne le supporte pas). Promesse UI non tenue.

Fichier modifié : `packages/@verone/orders/src/components/modals/SendShippingTrackingModal.tsx`

- Suppression du state `cc` / setter `setCc`
- Suppression de la `Textarea` CC (import `Textarea` retiré)
- Suppression du bloc `<div>` CC dans le rendu

### MAJOR 1 — `isOrderLocked` inclut désormais `closed`

Fichier modifié : `packages/@verone/orders/src/validators/order-status.ts` ligne ~202

- Ajout de `'closed'` dans le tableau de `isOrderLocked`
- Reformatage Prettier (tableau multi-lignes pour respecter les 80 cols)

### MAJOR 2 — Import `SalesOrderStatus` au lieu de redéfinition locale

Fichier modifié : `apps/back-office/src/app/actions/sales-orders.ts`

- Suppression de la définition locale `export type SalesOrderStatus = ...` (8 valeurs)
- Remplacement par `import type { SalesOrderStatus } from '@verone/orders/hooks'` + `export type { SalesOrderStatus }`
- Source unique : `packages/@verone/orders/src/hooks/types/sales-order.types.ts` via re-export `use-sales-orders.ts` → `hooks/index.ts`

---

## Validation

| Commande                                       | Résultat |
| ---------------------------------------------- | -------- |
| `pnpm --filter @verone/orders type-check`      | PASS     |
| `pnpm --filter @verone/back-office type-check` | PASS     |
| `pnpm --filter @verone/orders lint`            | PASS     |
| `pnpm --filter @verone/back-office lint`       | PASS     |

---

## Fichiers modifiés dans cette PR (scope final)

- `packages/@verone/orders/src/components/modals/order-detail/OrderActionsCard.tsx`
- `packages/@verone/orders/src/components/modals/SendShippingTrackingModal.tsx`
- `packages/@verone/orders/src/components/modals/OrderDetailModal.tsx`
- `packages/@verone/orders/src/validators/order-status.ts`
- `apps/back-office/src/app/actions/sales-orders.ts`
