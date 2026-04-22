# Dev report — BO-SHIP-FIX-001 : fiabilisation shipment Packlink

**Date** : 2026-04-22
**Branche** : `fix/BO-SHIP-FIX-001-shipment-integrity`
**Base** : `staging` (tête `e50016a12`)
**Status** : implémentation livrée, avant review/verify/Playwright

---

## Résultats validation locale (dev-agent)

- `pnpm --filter @verone/orders type-check` : **PASS** (0 erreur)
- `pnpm --filter @verone/back-office type-check` : **PASS** (0 erreur)
- `pnpm --filter @verone/orders lint` : **PASS** (0 erreur, 0 warning)
- Règle 400 lignes max : **respectée sur tous les fichiers**

---

## Fichiers créés (6 nouveaux)

| Fichier                                                                                 | Lignes | Rôle                                                                                                                                                                  |
| --------------------------------------------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/handle-create-draft.ts`    | 325    | Factory `useCreateDraftHandlers` — les 3 handlers `handleCreateDraft`, `handleRetryDbSave`, `handleCancelPacklink` avec les 3 guards (auth / items vides / DB failed) |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/StepError.tsx`             | 86     | Écran step 8 : réf Packlink + message erreur + 3 actions (retry DB / cancel Packlink / fermer). Touch 44px `h-11 md:h-9`                                              |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/use-fetch-dropoffs.ts`     | 72     | Extrait de `useShipmentWizard` pour alléger le hook principal                                                                                                         |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/use-previous-shipments.ts` | 73     | Extrait — charge expéditions précédentes pour commandes partiellement expédiées                                                                                       |
| `packages/@verone/orders/src/components/modals/order-detail/use-shipment-history.ts`    | 104    | Hook léger sans dépendance `SalesOrder`, utilisé par `site-internet/OrderDetailModal`                                                                                 |
| `apps/back-office/src/app/api/packlink/shipment/[ref]/cancel/route.ts`                  | 37     | Endpoint `POST /api/packlink/shipment/[ref]/cancel` — proxifie `client.deleteShipment(ref)`                                                                           |

---

## Fichiers modifiés (10 éditions)

| Fichier                                                                                           | Delta            | Nature                                                                                                                          |
| ------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts`                | **517 → 371 L**  | Délègue aux 3 hooks extraits, expose `dbError`, `pendingPacklinkRef`, `retryingDb`, `handleRetryDbSave`, `handleCancelPacklink` |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/types.ts`                            | +7 L             | Ajout de 5 champs/actions dans `ShipmentWizardState`                                                                            |
| `packages/@verone/orders/src/components/forms/ShipmentWizard/index.tsx`                           | +18 L            | Router `state.step === 8 → <StepError>`                                                                                         |
| `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentHistoryCard.tsx`         | +7 / -2          | Champ `packlink_shipment_id` dans `ShipmentHistoryItem` + URL spécifique `/shipments/{id}/create/address`                       |
| `packages/@verone/orders/src/components/modals/order-detail/OrderShipmentStatusCard.tsx`          | +54 / -17        | Prop `onOpenShipmentModal`, bouton activé « Nouvelle expédition », URL Packlink spécifique                                      |
| `packages/@verone/orders/src/components/modals/order-detail/useOrderDetailData.ts`                | +3 L             | `packlink_shipment_id` dans `.select(...)` + mapping                                                                            |
| `packages/@verone/orders/src/components/modals/order-detail/index.ts`                             | +2 L             | Export `useShipmentHistory`                                                                                                     |
| `packages/@verone/orders/src/components/modals/OrderDetailModal.tsx`                              | +3 L             | Propage `onOpenShipmentModal` à `<OrderShipmentStatusCard>`                                                                     |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderModals.tsx`                  | +8 L             | Appelle `setOrderToShip(selectedOrder)` + `setShowShipmentModal(true)`                                                          |
| `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx` | **+40 / -161 L** | Suppression query/state/useEffect inline, réutilise `<OrderShipmentHistoryCard>` + `useShipmentHistory`                         |

Solde net fichiers tracked : **-213 lignes** (+152 / -365).

---

## Ce qui est corrigé

### R1 — Wizard silencieux (P0)

Dans `handle-create-draft.ts`, les 3 branches silencieuses sont maintenant des guards explicites :

1. `!user?.id` → `dbError` + `pendingPacklinkRef` + `setStep(8)`, **pas** de setStep(7)
2. `itemsToShip.length === 0` → idem
3. `!dbResult.success` → idem avec message d'erreur DB

Step 8 affiche `<StepError>` avec 3 actions :

- « Réessayer l'enregistrement » → `handleRetryDbSave()` re-INSERT sans refaire l'appel Packlink
- « Annuler côté Packlink » → `handleCancelPacklink()` appelle `POST /api/packlink/shipment/{ref}/cancel` → `client.deleteShipment(ref)` → reset wizard step 1
- « Fermer (traiter plus tard) » → `onClose()` + garde la ref Packlink dans un état pour retraitement ultérieur

### R4 — Bouton « Gérer expédition » activé (P1)

`OrderShipmentStatusCard.tsx` : suppression du `disabled` + tooltip "en cours de développement". Bouton conditionné sur `onOpenShipmentModal?` (si prop absente, pas de bouton — rétro-compatible).

### R5 — Lien Packlink spécifique (P1)

Remplacement `https://pro.packlink.fr/private/shipments` par `https://pro.packlink.fr/private/shipments/{packlink_shipment_id}/create/address` dans `OrderShipmentStatusCard` + `OrderShipmentHistoryCard`. Fallback sur URL générique si pas de ref.

### R3 — Déduplication site-internet (P1)

`site-internet/OrderDetailModal.tsx` : suppression de 161 L de code dupliqué (query, state, useEffect, rendering ad-hoc avec badge coloré hardcodé). Réutilisation du composant `OrderShipmentHistoryCard` via nouveau hook léger `useShipmentHistory(orderId, open)` qui évite la dépendance à `SalesOrder` requise par `useOrderDetailData`.

---

## Contraintes règles Verone respectées

- ✅ Triggers protégés intacts : `update_stock_on_shipment`, `confirm_packlink_shipment_stock`, `handle_shipment_deletion`, `handle_shipment_quantity_update`, `notify_shipment_created`
- ✅ Webhook `/api/webhooks/packlink` non touché
- ✅ Routes Qonto / emails / middleware non touchées
- ✅ Zéro `any` — casts via `as unknown as Type` documentés
- ✅ 400 lignes max respectée (max = 371 sur useShipmentWizard après refactor)
- ✅ Touch 44px mobile (`h-11 md:h-9`) sur boutons StepError
- ✅ `useCallback` sur handlers avant deps useEffect (pattern anti-piège production 16 avril)
- ✅ Aucune migration DB
- ✅ Aucun nouveau composant dans `apps/` (tout dans `packages/@verone/*`)

---

## Corrections review round 1 (2026-04-22)

Reviewer-agent FAIL — 2 CRITICAL + 2 MAJOR + 1 LINT. Corrections appliquées.

### CRITICAL 1 — Auth check manquant (résolu)

**Fichier** : `apps/back-office/src/app/api/packlink/shipment/[ref]/cancel/route.ts`

Suppression du commentaire trompeur « Auth enforced by middleware ». Ajout de l'auth check réel via `createServerClient()` + `supabase.auth.getUser()` AVANT l'appel `deleteShipment`. Retourne `401` si pas d'utilisateur authentifié. Pattern aligné sur `apps/back-office/src/app/api/ambassadors/create-auth/route.ts`.

### CRITICAL 2 — Régression `qtyOrdered` (résolu — Option A)

**Fichier** : `packages/@verone/orders/src/components/modals/order-detail/use-shipment-history.ts`

`useShipmentHistory` retourne maintenant un objet `{ shipmentHistory, salesOrderItems }` au lieu d'un tableau brut. Seconde query `sales_order_items` ajoutée en parallèle dans le `useEffect` pour charger `{ id, quantity, products(sku) }` de la commande. Le cast `as unknown as SalesOrder` avec `sales_order_items: []` dans `site-internet/OrderDetailModal.tsx` est remplacé par un cast propre avec les données réelles.

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx`

Destructuration du retour de `useShipmentHistory` + passage de `salesOrderItems as SalesOrder['sales_order_items']` dans le `order` prop de `<OrderShipmentHistoryCard>`.

**Fichier** : `packages/@verone/orders/src/components/modals/order-detail/index.ts`

Export des nouveaux types `ShipmentHistoryResult` et `OrderItemSummary`.

### MAJOR 1 — eslint-disable non documentés (résolu)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/handle-create-draft.ts`

Ajout de commentaires justificatifs au-dessus des 3 occurrences de `eslint-disable-next-line react-hooks/exhaustive-deps` (lignes ~237, ~287, ~321). Chaque commentaire explique que `deps` est recréé à chaque render, que les primitives instables sont listées individuellement, et que les setters React sont intentionnellement omis car stables par garantie React.

### MAJOR 2 — `supabase` instable dans deps useEffect (résolu)

**Fichier** : `packages/@verone/orders/src/components/forms/ShipmentWizard/useShipmentWizard.ts`

`createClient()` stabilisé via `useMemo(() => createClient(), [])`. Garantit une ref stable pour `usePreviousShipments` et `useCreateDraftHandlers` qui reçoivent `supabase` en arg.

### MINOR 1 — Renommage sémantique `retryingDb` → `pendingAction` (résolu)

Renommage dans tous les fichiers concernés :

- `types.ts` : champ `retryingDb: boolean` → `pendingAction: boolean`
- `handle-create-draft.ts` : `setRetryingDb` → `setPendingAction` dans l'interface + tous les appels
- `useShipmentWizard.ts` : state `retryingDb`/`setRetryingDb` → `pendingAction`/`setPendingAction`, return object, prop passée à `useCreateDraftHandlers`
- `index.tsx` : `state.retryingDb` → `state.pendingAction`

### LINT FAIL (résolu)

**Fichier** : `apps/back-office/src/app/(protected)/canaux-vente/site-internet/components/OrderDetailModal.tsx`

- Suppression import `type OrderItemSummary` inutilisé (no-unused-vars)
- Reformatage Prettier de la longue ligne du cast (retour ligne sur `sales_order_items:`)

### Validation finale round 1

- `pnpm --filter @verone/orders type-check` : **PASS** (0 erreur)
- `pnpm --filter @verone/back-office type-check` : **PASS** (0 erreur)
- `pnpm --filter @verone/orders lint` : **PASS** (0 erreur, 0 warning)
- `pnpm --filter @verone/back-office lint` : **PASS** (exit code 0)

---

## Prochaines étapes

1. **Reviewer-agent round 2** sur le diff complet
2. **Tests Playwright MCP lane-2** : 5 scénarios du dev-plan section 12, aux 5 tailles responsive (375/768/1024/1440/1920)
3. Si toutes les validations PASS → commit `[BO-SHIP-FIX-001] fix: ...` + push + PR DRAFT vers `staging`
4. Validation Romeo → PR ready → CI → merge squash

Pas de deploy staging → main dans cette PR (release séparée).
