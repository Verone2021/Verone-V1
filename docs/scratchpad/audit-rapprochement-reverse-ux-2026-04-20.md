# Audit UX Rapprochement — Flux inverse 1 document → N transactions

**Date** : 2026-04-20
**Task ID proposé** : BO-RAPPROCHEMENT-002

## Contexte métier (Romeo)

Un client peut payer **en plusieurs fois** la même facture (ex: 2 virements partiels). Il peut aussi payer **en groupé** plusieurs factures via une seule transaction.

## État actuel

### ✅ Schéma DB supporte déjà N-N

Table `transaction_document_links` :

- `transaction_id` + `document_id` (ou `sales_order_id` / `purchase_order_id`)
- `allocated_amount` (paiement partiel)
- `link_type`, `notes`

Plusieurs lignes peuvent exister pour un même `document_id` → **1 doc → N transactions techniquement OK**.

### ✅ Flux 1 transaction → N documents : implémenté

`packages/@verone/finance/src/components/RapprochementModal/` :

- Part d'une `transactionId`
- Onglets : Documents / Orders / PurchaseOrders
- Permet de lier plusieurs fois (`SuccessScreen` propose "Ajouter un autre lien" via `onAddAnother`)
- RPC `link_transaction_to_document` crée une ligne dans `transaction_document_links`

### ❌ Flux inverse 1 document → N transactions : UX absente

**Ce qui manque** :

- Pas de modal qui part d'un `documentId` / `orderId`
- Pas de liste "transactions disponibles pour ce client"
- Pas de boucle UX "ajouter N transactions"

### Comportement actuel côté page détail facture / commande

`apps/back-office/src/app/(protected)/factures/page.tsx:323` : `onRapprochement={invoice => handleRapprochement(invoice)}` → ouvre `RapprochementModal` mais attend **un transaction ID** en entrée. Le user doit donc :

1. Aller sur la page transactions
2. Trouver la bonne transaction
3. Cliquer "Rapprocher"
4. Choisir la facture

Pour 2 transactions → 1 facture, il doit répéter 2 fois en partant de chaque transaction.

## Proposition scope BO-RAPPROCHEMENT-002

### Nouveau composant `DocumentReverseRapprochementModal`

**Props** : `documentId` ou `orderId` + `documentTotalTtc` + `counterpartyId` (customer/supplier) + `alreadyLinkedAmount` + `onSuccess`.

**Flow** :

1. Header : montant doc, montant déjà rapproché, reste à rapprocher
2. Liste `ExistingLinksPanel` (déjà existe) : transactions déjà liées (N lignes)
3. Bouton "Ajouter un rapprochement" → ouvre sous-panneau :
   - Liste `bank_transactions` filtrée par `counterparty_organisation_id` ou `counterparty_individual_customer_id`, signe cohérent (positive=entrée si facture client, négative=sortie si facture fournisseur), pas encore entièrement allouée
   - Input montant à allouer (avec `remainingAmount` en max)
   - Bouton Lier
4. Chaque lien créé → ligne ajoutée dans `ExistingLinksPanel`, reste à rapprocher se met à jour

### Implémentation

- `useReverseRapprochement(documentId)` : fetch `transaction_document_links` existants + `bank_transactions` disponibles pour cette contrepartie
- RPC `link_transaction_to_document` : déjà existe (réutilisation)
- UX `SuccessScreen` : adapter pour afficher "rapprochement ajouté" + proposer "Ajouter encore"

### Point d'intégration

- `apps/back-office/src/app/(protected)/factures/page.tsx` : remplacer `onRapprochement(invoice)` → ouvrir `DocumentReverseRapprochementModal`
- `packages/@verone/orders/src/components/modals/order-detail/OrderPaymentSummaryCard.tsx` (ou `OrderReconciliationCard`) : ajouter bouton "Ajouter un rapprochement"
- Pages détail PO (`PurchaseOrderDetailModal/POPaymentDialog`) : remplacer idem

### Effort estimé

- Nouveau composant modal : ~300L
- Hook `useReverseRapprochement` : ~150L
- Adaptation des 3 appelants : ~50L
- **Total** : ~500L / 3-4h

## Recommandation

**Scope séparé BO-RAPPROCHEMENT-002**. Pas inclus dans cette session "finitions priorité moyenne" car :

- Nécessite conception UX (gérer cas partiel + retry + montant restant)
- Nouvelle query SQL filtrée par contrepartie + signe
- Tests manuels sur plusieurs scénarios (1+1=total, 2×0.5=total, partiels, etc.)
- Risque de régression sur workflow rapprochement existant si mal testé

À planifier comme sprint dédié avec Romeo.

## État des priorités moyennes restantes

- ✅ BO-FIN-009 Phase 3.2 (PR #688)
- ✅ BO-ORD-003 (PR #689)
- ⏸ BO-RAPPROCHEMENT-002 (ce ticket, scope séparé — documenté)
- ⏭ BO-AUDIT-001 audit formulaires dupliqués — next
