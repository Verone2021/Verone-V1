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

**Règle** :

- **Commande status `draft`** : modifiable. Devis/factures associés modifiables via régénération auto (R3).
- **Commande status `validated` ou supérieur (partially_shipped, shipped, delivered)** : **non modifiable** sauf champs exempts. Devis/factures associés non modifiables non plus.

**Champs exempts** (éditables même sur commande validée) :

- `notes`
- `expected_delivery_date`
- Champs tracking expédition (packlink*\*, shipping*\*)
- `billing_contact_id`, `delivery_contact_id`, `responsable_contact_id`

**Verrous stricts** (non éditables une fois validée) :

- `sales_order_items` (items, quantités, prix, remises, TVA)
- `shipping_cost_ht`, `handling_cost_ht`, `insurance_cost_ht`, `fees_vat_rate`
- `billing_address`, `shipping_address`
- Client (`customer_id`, `customer_type`)

**Seule action possible sur commande validée avec erreur** : annulation (status `cancelled`).

**Pourquoi** : une commande validée a déclenché des effets de bord (stock prévisionnel, commissions LinkMe, envoi fournisseurs). Modifier ses items sans annulation préalable casse l'intégrité de la chaîne.

**À implémenter** : BO-FIN-009 Phase 3 (hook `updateOrderWithItems` + UI désactivation boutons).

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
