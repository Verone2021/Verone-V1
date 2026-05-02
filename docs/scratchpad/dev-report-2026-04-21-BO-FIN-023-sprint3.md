# Dev Report — BO-FIN-023 Sprint 3

**Date** : 2026-04-21
**Branche** : `feat/BO-FIN-023-cascade-order-docs`
**Commit** : `8064494f4`

---

## Fichiers modifies

| Fichier                                                                                      | Lignes      | Type    |
| -------------------------------------------------------------------------------------------- | ----------- | ------- |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderConfirmDialogs.tsx`     | +55 lignes  | feature |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrderModals.tsx`             | +20 lignes  | feature |
| `packages/@verone/orders/src/components/sales-orders-table/SalesOrdersTable.tsx`             | +8 lignes   | feature |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-order-actions.ts` | +120 lignes | feature |
| `packages/@verone/orders/src/components/sales-orders-table/hooks/use-sales-orders-modals.ts` | +21 lignes  | feature |

---

## Ce qui a ete fait

### 3.1 SalesOrderConfirmDialogs.tsx

- Ajout interface `CancelGuardDoc` (exportee)
- Ajout de 5 nouvelles props dans `SalesOrderConfirmDialogsProps` : `showCancelGuardDialog`, `onCancelGuardChange`, `onCancelGuardConfirmed`, `guardReason`, `docsToDelete`
- Ajout du dialog garde-fou apres le dialog annulation :
  - Titre rouge (`text-red-600`) : "Attention — action critique"
  - Corps : `guardReason` + liste `docsToDelete` avec bullet rouge
  - Boutons : "Retour" (AlertDialogCancel) + "Annuler quand meme" (`bg-red-600 hover:bg-red-700`)
  - `AlertDialogDescription asChild` avec `<div>` pour contenir la liste

### 3.2 use-sales-orders-modals.ts

- Ajout interfaces `CancelGuardDoc` et `CancelGuardData` (exportees)
- Ajout etats : `showCancelGuardDialog` (boolean), `cancelGuardData` (CancelGuardData | null)
- Exposes dans le return du hook

### 3.3 use-sales-order-actions.ts

- Ajout types stricts `CancelApiDoc` et union `CancelApiResponse` (zero any)
- Ajout params `setShowCancelGuardDialog` et `setCancelGuardData` dans l'interface
- Remplacement complet de `handleCancelConfirmed` :
  - Appel `POST /api/sales-orders/[id]/cancel` avec `{ force: false }`
  - Status 409 → ouvre le modal garde-fou avec les donnees du body
  - Status 400/401/404 → toast erreur
  - Succes → toast avec compte rendu + refresh liste
- Ajout `handleCancelGuardConfirmed` :
  - Appel `POST /api/sales-orders/[id]/cancel` avec `{ force: true }`
  - Succes → toast + refresh liste
  - Nettoyage : `showCancelGuardDialog=false`, `cancelGuardData=null`, `orderToCancel=null`
- `handleCancelGuardConfirmed` expose dans le return du hook

### 3.4 SalesOrderModals.tsx

- Import `CancelGuardDoc` depuis `SalesOrderConfirmDialogs`
- Ajout props interface : `showCancelGuardDialog`, `cancelGuardData`, `setShowCancelGuardDialog`, `handleCancelGuardConfirmed`
- Passage des nouvelles props a `SalesOrderConfirmDialogs` avec `void + .catch()` sur le handler async

### 3.5 SalesOrdersTable.tsx

- Passage de `setShowCancelGuardDialog` et `setCancelGuardData` a `useSalesOrderActions`
- Passage de `showCancelGuardDialog`, `cancelGuardData`, `setShowCancelGuardDialog`, `handleCancelGuardConfirmed` a `SalesOrderModals`

---

## Verification

- `pnpm --filter @verone/back-office type-check` : VERT (0 erreur)
- `pnpm --filter @verone/back-office lint` : VERT (0 warning)
- Pre-commit hook : PASSE (prettier + eslint auto-fix)

---

## Flux complet (texte)

### Cas 1 : Commande draft sans document lie

Utilisateur clique "Annuler" → dialog confirmation standard → confirme → `POST /cancel { force: false }` → route retourne `{ docsDeleted: 0 }` → toast "Commande annulee avec succes" → refresh liste.

### Cas 2 : Commande avec devis draft lie

Utilisateur clique "Annuler" → dialog confirmation standard → confirme → `POST /cancel { force: false }` → route retourne `{ docsDeleted: 1 }` → toast "Commande annulee. 1 document(s) Qonto supprime(s)." → refresh liste.

### Cas 3 : Commande avec devis accepte (garde-fou)

Utilisateur clique "Annuler" → dialog confirmation standard → confirme → `POST /cancel { force: false }` → route retourne HTTP 409 `{ reason: "Le devis DEV-XXX a ete accepte...", docsToDelete: [...] }` → dialog garde-fou s'ouvre avec reason + liste docs. Utilisateur peut :

- "Retour" : ferme le garde-fou, commande non annulee
- "Annuler quand meme" : `POST /cancel { force: true }` → succes → toast + refresh

### Cas 4 : Commande avec facture emise (refus)

Utilisateur clique "Annuler" → dialog confirmation standard → confirme → `POST /cancel { force: false }` → route retourne HTTP 400 `{ error: "Impossible d'annuler... Creez un avoir d'abord" }` → toast destructive avec le message d'erreur.

---

## Hash commit + push

- Commit : `8064494f4`
- Push : `feat/BO-FIN-023-cascade-order-docs` → remote OK
