# Plan BO-SHIP-003 — Édition shipment manuelle + PO reception manuelle

**Date** : 2026-04-17
**Branche** : `feat/BO-SHIP-003-edit-shipment-and-reception-manual`
**Base** : staging

## Contexte métier

Lors d'une expédition manuelle (non-Packlink), le staff peut ne pas avoir tous les infos au moment de la validation (transporteur, numéro de suivi, coût transport). Actuellement, **aucune édition a posteriori n'est possible**. Romeo doit ressaisir ces infos directement en DB (risqué).

Même problème côté PO reception : pas d'édition supplier / tracking / coût achat sur une réception déjà validée.

Critique pour le calcul de marge réelle = prix vente − prix achat − frais achat − frais expédition.

## Scope

### Côté SO (Shipment)

Page ou modal d'édition pour un shipment **déjà validé** (existant en DB) :

- **Champs éditables** : `carrier_name`, `tracking_number`, `tracking_url`, `shipping_cost`, `notes`
- **Champs non-éditables** : `quantity_shipped` (stock déjà décrémenté), `delivery_method`, `shipped_at`, `shipped_by`, colonnes Packlink (`packlink_*`)
- **Condition d'édition** : `delivery_method = 'manual'` **uniquement**. Packlink auto via webhook, pas de modification humaine.

### Côté PO (Reception)

Mêmes champs éditables a posteriori sur `purchase_order_receptions` :

- Colonnes à vérifier dans le schéma DB : `batch_number`, `notes`, `received_at`, `received_by`
- Cas supplier tracking / cost achat : à vérifier dans `purchase_orders` (pas `purchase_order_receptions`)

**Note** : le schéma PO reception n'a pas `carrier_name` ni `shipping_cost` — ces infos sont au niveau `purchase_orders` (coût achat + frais achat au niveau PO, pas réception). Donc l'édition PO porte surtout sur `batch_number` + `notes` côté reception, et sur les champs frais de la PO parent.

## Fichiers concernés

### Backend (Server Actions)

- **`packages/@verone/orders/src/actions/sales-shipments.ts`** — créer `updateSalesShipment(payload)` :
  - Validation Zod stricte
  - Fetch shipment existant
  - Vérifier `delivery_method === 'manual'` (sinon 403)
  - UPDATE sales_order_shipments
  - `revalidatePath` des pages concernées

- **`packages/@verone/orders/src/actions/`** — nouvelle action `updatePurchaseReception(payload)` si colonnes éditables côté reception

### Composant UI

- **`packages/@verone/orders/src/components/modals/EditShipmentModal.tsx`** (nouveau) :
  - Props : `shipmentId`, `isOpen`, `onClose`, `onSuccess`
  - Fetch initial du shipment via hook
  - Form avec 5 champs éditables
  - Bouton Save → call Server Action
  - Toast succès/erreur
  - Si `delivery_method !== 'manual'` : afficher message d'avertissement, désactiver form

- **`packages/@verone/orders/src/hooks/use-sales-shipments/use-shipment-edit.ts`** (nouveau) — hook `updateShipment`

- Intégration : bouton "Modifier" sur chaque ligne de l'historique expédition (`expeditions-history-modal.tsx`) visible uniquement si `delivery_method === 'manual'`

### RLS / Triggers DB

- Vérifier que `sales_order_shipments` a une policy UPDATE pour staff (déjà là via `backoffice_full_access_sales_order_shipments`)
- Le trigger `trigger_before_update_shipment` (BO-STOCK-002 Phase 1) s'occupe des changements de `quantity_shipped` — mais ici on n'édite PAS la quantité donc le trigger ne fait rien.

## Contraintes CLAUDE.md à respecter

- Zéro `any` TypeScript, zéro `as any`, zéro `eslint-disable`
- Validation Zod sur Server Actions
- `void` + `.catch()` pour promesses flottantes
- `await queryClient.invalidateQueries()` dans `onSuccess`
- Fichier > 400 lignes = refactor
- Pas de `router.push()` après `signOut()` (N/A ici)

## Étapes d'implémentation

1. **Schema DB check** : confirmer les colonnes éditables et les RLS policies
2. **Server Action** `updateSalesShipment` : validation Zod + guard `delivery_method='manual'` + UPDATE + revalidate
3. **Hook** `use-shipment-edit.ts` : appel Server Action + gestion loading/error
4. **Modal** `EditShipmentModal.tsx` : form React Hook Form + Zod, 5 champs
5. **Intégration** dans `expeditions-history-modal.tsx` : bouton "Modifier" par ligne (filtré delivery_method manual)
6. **Tests manuels** : ouvrir un shipment manuel existant, modifier, sauvegarder, vérifier DB
7. **Type-check** : `pnpm --filter @verone/orders type-check` + `pnpm --filter @verone/back-office type-check`

### Scope v1 (cette PR)

- Édition shipment manuel uniquement (côté SO)
- Intégration dans modal historique existante

### Scope v2 (PR suivante si besoin)

- Édition reception PO (batch_number, notes)
- Édition champs frais sur la PO parente
- Édition des champs "frais expédition Verone paie" au niveau shipment si différent de carrier_name

## Tests manuels requis

- [ ] Ouvrir `/stocks/expeditions` → onglet Historique → Voir détails
- [ ] Bouton "Modifier" visible pour un shipment `delivery_method = 'manual'`
- [ ] Bouton "Modifier" NON visible pour un shipment Packlink
- [ ] Modifier transporteur, tracking, coût transport, notes → sauvegarder
- [ ] Vérifier DB : valeurs mises à jour, `updated_at` renouvelé
- [ ] Stock_real inchangé (on n'a pas touché à `quantity_shipped`)

## Risques

- **Confusion coûts** : `shipping_cost` dans `sales_order_shipments` = coût Verone paye au transporteur (achat), différent des frais expédition client. Bien clarifier dans l'UI.
- **Tracking URL validation** : si l'utilisateur saisit une URL mal formée, Zod doit rejeter ou laisser passer ?
- **Concurrency** : si 2 staff modifient le même shipment simultanément, dernier writer wins (pas de lock optimiste). Acceptable v1.

## Estimation

Total : **~1h30**

- Server Action + hook : 20 min
- Modal + form : 30 min
- Intégration historique : 15 min
- Tests manuels + type-check : 15 min
- Audit reviewer + corrections : 10 min
