# Finance — Règles métier devis / factures / proformas

Règles du domaine finance (devis, factures, proformas, rattachement commandes). Centralisées ici pour éviter la dispersion.

Portée : back-office (`@verone/finance`, routes `/api/qonto/*`, pages `/factures`, `/devis`, `/commandes/clients`). Hors LinkMe et site-internet.

---

## R1 — Zéro discordance entre commande et document lié

**Règle** : Le total TTC d'une commande doit être **strictement égal** au total TTC de chaque devis et facture qui lui est lié. Zéro centime d'écart toléré.

**Pourquoi** : un écart entre commande et facture génère immédiatement une discordance comptable, un doute client, et bloque la réconciliation automatique avec les paiements Qonto.

**Routes / fichiers concernés** :

- Trigger DB `recalc_sales_order_on_charges_change` (calcul `sales_orders.total_ttc`)
- `apps/back-office/src/app/api/qonto/invoices/route.ts` (calcul `financial_documents.total_ttc` côté from-order)
- `apps/back-office/src/app/api/qonto/invoices/service/route.ts` (facture de service)
- `apps/back-office/src/app/api/qonto/quotes/route.ts` (devis from-order)
- `packages/@verone/integrations/src/qonto/client.ts` (envoi items Qonto)

**Cause racine connue (2026-04-16)** : DB utilise `ROUND(SUM(line_ttc_float), 2)` (round-per-total) ; Qonto utilise `SUM(ROUND(line_ttc, 2))` (round-per-line). Écart de 1 centime systématique. Fix programmé dans BO-FIN-009 Phase 1.

---

## R2 — Modification prix items verrouillée dans les modals devis/facture liés

**Règle** : Dans les modals `QuoteCreateFromOrderModal`, `InvoiceCreateFromOrderModal` et leurs modals d'édition, les champs `unit_price_ht`, `quantity`, `tax_rate` des items issus d'une commande sont **en readonly**. Pour changer un prix, l'utilisateur doit modifier la commande.

**Pourquoi** : la commande est la source de vérité métier (prix négocié, conditions LinkMe, commission affiliés). Autoriser l'édition dans le modal facture crée une dérive silencieuse qui viole R1.

**Exception** : les `customLines` (lignes libres ajoutées dans le modal, hors produits commande) restent éditables car elles ne proviennent pas de la commande.

**Routes / fichiers concernés** :

- `packages/@verone/finance/src/components/QuoteCreateFromOrderModal/QuoteItemsTable.tsx`
- `packages/@verone/finance/src/components/InvoiceCreateFromOrderModal/InvoiceItemsSection.tsx`
- Tous les modals d'édition devis/facture dans `@verone/finance`

---

## R3 — Détection auto modification commande → régénération documents liés

**Règle** : Quand on modifie une commande qui a au moins un devis ou une facture **draft** lié, le système doit :

1. Détecter la modification (total_ttc, items, frais)
2. Afficher un modal : "Un devis/facture lié existe. Regénérer avec les nouveaux montants ?"
3. OUI par défaut (préserve R1)
4. Si la commande a **plusieurs documents draft liés** (ex: 1 devis + 1 facture) → **regénérer les deux** en cascade

**Pourquoi** : sans cette détection, modifier une commande après création du devis/facture produit une désynchronisation silencieuse. L'utilisateur ne peut pas être responsable de mémoriser qu'il faut régénérer manuellement.

**Hors périmètre** : documents finalisés/envoyés/payés (status ≠ draft) ne sont jamais régénérés — ils sont gelés (voir R6).

**Routes / fichiers concernés** :

- À créer dans BO-FIN-009 Phase 4
- Hook `useSalesOrder` côté détection
- Route `/api/qonto/quotes/by-order/[id]/regenerate` (à créer)
- Route `/api/qonto/invoices/by-order/[id]/regenerate` (à créer)

---

## R4 — Régénération = écrasement du draft existant

**Règle** : Régénérer un devis ou une facture draft sur une commande déjà couverte signifie :

1. Supprimer le document Qonto existant (API Qonto `deleteClientInvoice` / `deleteClientQuote`)
2. Soft-delete le `financial_documents` correspondant (`deleted_at = now()`)
3. Créer le nouveau document avec les montants à jour

**Pourquoi** : une seule proforma/devis active par commande. Pas de versioning (pas de v2, v3, …). L'ancien devis/proforma est considéré périmé dès qu'il est régénéré.

**État actuel (2026-04-16)** : implémenté pour les proformas dans `apps/back-office/src/app/api/qonto/invoices/route.ts:311-375` (guard écrasement ajouté lors du fix BO-FIN-005). À étendre aux devis dans BO-FIN-009.

**Protection comptable** : si un document **finalisé** ou **payé** (status != draft) existe, la régénération est **refusée** (HTTP 409), pas d'écrasement silencieux.

---

## R5 — Source de vérité unique = commande

**Règle** : Un devis ou une facture ne peut exister que si une commande préexiste, **sauf** pour les documents de type "service" (lignes libres).

**Distinction** :

- Document `from-order` : `sales_order_id NOT NULL`, créé via `QuoteCreateFromOrderModal` / `InvoiceCreateFromOrderModal`
- Document `service` : `sales_order_id IS NULL`, `invoice_source = 'crm'`, créé via `QuoteFormModal` / `InvoiceCreateServiceModal`

**Pourquoi** : les documents liés à une commande doivent suivre la commande (R1/R3). Les documents de service sont des prestations sans commande associée, par nature indépendants.

**À verrouiller (BO-FIN-009 Phase 5)** : route POST `/api/qonto/quotes` autorise encore le cas `standalone` (customer sans salesOrderId) pour les devis non-service. À bloquer en ajoutant un flag `kind: 'from-order' | 'service'` explicite.

---

## R6 — Verrouillage par statut commande

**Règle absolue** :

- **Commande status `draft`** : **entièrement modifiable** (articles, adresses, contacts, notes, frais, date livraison, client, tout).
- **Commande status `validated` ou supérieur** (`partially_shipped`, `shipped`, `delivered`) : **AUCUN champ modifiable**. La commande est gelée. Devis/factures associés non modifiables non plus.

**Workflow obligatoire pour corriger une commande validée** :

1. **Dévalider** la commande (`validated → draft`) — le système rollback automatiquement en cascade :
   - Stock prévisionnel (`stock_forecasted_out`) via trigger `rollback_forecasted_out_on_so_devalidation`
   - Prix lockés (`base_price_ht_locked`, `selling_price_ht_locked`, `price_locked_at`) via trigger `lock_prices_on_order_validation` (branche inverse)
   - Commission LinkMe (`linkme_commissions`) via trigger `create_linkme_commission_on_order_update` (DELETE si hors validated/shipped)
   - Stock movements forecast (DELETE automatique)
   - Sync `stock_alert_tracking`
2. **Modifier** les champs nécessaires (hook `updateOrderWithItems` / `updateOrder` autorisés uniquement en `draft`).
3. **Revalider** la commande (`draft → validated`) — les cascades sont ré-appliquées automatiquement.

**Dévalidation bloquée si** :

- Items déjà expédiés (`quantity_shipped > 0`) → contrôle côté `updateStatus`
- Facture liée `sent` ou `paid` → créer un avoir d'abord

**Annulation directe `validated → cancelled` : bloquée** par le trigger DB `prevent_so_direct_cancellation`. Workflow obligatoire : dévalider d'abord, puis annuler depuis `draft`.

**Pourquoi ce verrouillage total** : une commande validée déclenche des effets en cascade (stock, prix, commission, notifications). Toute modification directe désynchronise les données en aval (facture Qonto émise, commission LinkMe déjà calculée, stock réservé sur un prix obsolète). Le workflow "dévalider → modifier → revalider" garantit que toutes les cascades sont rejouées proprement.

**Implémentation** :

- Hook `updateOrderWithItems` (`@verone/orders`) : rejet si `status !== 'draft'` avec message explicite. ✅ BO-FIN-009 Phase 3.
- Hook `updateOrder` (`@verone/orders`) : rejet si `status !== 'draft'` avec message explicite. ✅ BO-FIN-009 Phase 3.
- Hook LinkMe `updateDraftOrder` (`apps/linkme/src/lib/hooks/use-update-draft-order.ts`) : guard déjà en place historiquement.
- UI `SalesOrderFormModal` mode édition : bouton "Dévalider pour modifier" (scope Phase 3.2 à venir).

---

## R7 — Factures libres sans commande = normales, jamais à rattraper

**Règle** : Une `financial_documents` avec `sales_order_id IS NULL` et `invoice_source = 'crm'` est **parfaitement normale**. Elle représente une facture (ou devis) de service créée via :

- Page `/factures/nouvelle` → option "Facture de service"
- Page `/devis/nouveau` → option "Devis de service"

**Ne JAMAIS** :

- Considérer ces documents comme un bug
- Tenter de les rattacher à une commande
- Les signaler dans un audit de cohérence comme "orphelins"
- Les supprimer dans un script de nettoyage

**Pourquoi** : historiquement, le code `sync-invoices` et certains scripts de cohérence ont confondu "orphelin Qonto" (sans trace locale) avec "facture de service légitime" (trace locale avec `sales_order_id NULL`). La présence de `invoice_source='crm'` différencie les deux cas.

**Signal de détection correct** :

- Facture libre légitime : `sales_order_id IS NULL AND invoice_source = 'crm' AND partner_id IS NOT NULL`
- Proforma orpheline (bug) : proforma côté Qonto sans ligne `financial_documents` du tout (détectable via GET `/api/qonto/invoices?status=draft` ↔ `financial_documents.qonto_invoice_id`)

---

## Tracking

| Sprint     | Règles couvertes                         | Statut                        |
| ---------- | ---------------------------------------- | ----------------------------- |
| BO-FIN-014 | R4 (guard écrasement proforma)           | En cours (PR pending)         |
| BO-FIN-009 | R1 à R6 (alignement + verrouillages)     | À faire, prio haute, 6 phases |
| BO-FIN-010 | R5 / R7 (badges visuels différenciation) | À faire                       |
| BO-FIN-011 | R1 (badge alerte discordance)            | À faire, filet sécurité       |
