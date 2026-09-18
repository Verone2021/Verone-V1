# Audit — Cascades validation / dévalidation / annulation SO + PO

**Date** : 2026-04-20
**Sprint** : Préparation BO-FIN-009 Phase 3 (R6 finance.md)
**Objectif** : cartographier ce qui existe déjà côté DB/code et identifier les vrais manques avant de coder.
**Méthode** : interrogation directe de la DB (triggers actifs + fonctions), lecture de la documentation workflow officielle, vérification des hooks côté code.

---

## 1. Synthèse exécutive

**Le système est beaucoup plus complet que ce que suggérait la règle R6**. La dévalidation (`validated → draft`) déclenche déjà en cascade : rollback stock prévisionnel, delete commission LinkMe, rollback prices locked, sync stock_alert_tracking, delete stock_movements forecast. Les annulations directes depuis `validated` sont déjà bloquées au niveau trigger DB.

**Le seul vrai manque** : le hook `updateOrderWithItems` côté client ne vérifie PAS le statut de la commande avant d'UPDATE les items. Un utilisateur peut donc modifier quantités/prix/TVA directement sur une commande validée via l'UI d'édition, ce qui **désynchronise silencieusement** les prix lockés (`base_price_ht_locked`, `price_locked_at`).

**Scope Phase 3 recommandé** : 1 seule modification côté hook (guard statut) + correction du texte R6 dans finance.md. Pas de nouveau trigger DB, pas de migration.

---

## 2. Inventaire des triggers actifs (source DB)

### 2.1 Triggers sur `sales_orders`

| #     | Trigger                                      | Timing              | Événement                               | Fonction                                                                                                                                                | Rôle                                                |
| ----- | -------------------------------------------- | ------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| 1     | `trigger_so_update_forecasted_out`           | AFTER UPDATE        | draft → validated                       | `update_forecasted_out_on_so_validation`                                                                                                                | +forecasted_out                                     |
| 2     | `sales_order_status_change_trigger`          | AFTER UPDATE        | → validated                             | `handle_sales_order_confirmation`                                                                                                                       | crée stock_movements forecast                       |
| 3     | `trg_so_devalidation_forecasted_stock`       | AFTER UPDATE        | validated → draft                       | `rollback_forecasted_out_on_so_devalidation`                                                                                                            | -forecasted_out + delete movements + sync alerts    |
| 4     | `trigger_so_cancellation_rollback`           | AFTER UPDATE        | validated/partially_shipped → cancelled | `rollback_so_forecasted`                                                                                                                                | rollback complet                                    |
| 5     | `trigger_prevent_so_direct_cancellation`     | BEFORE UPDATE       | validated/shipped → cancelled           | `prevent_so_direct_cancellation`                                                                                                                        | **bloque annulation directe**                       |
| 6     | `trg_lock_prices_on_validation`              | AFTER UPDATE        | draft ↔ validated                      | `lock_prices_on_order_validation`                                                                                                                       | lock/unlock prices + retrocession                   |
| 7     | `trg_create_linkme_commission`               | AFTER INSERT/UPDATE | → validated ou shipped                  | `create_linkme_commission_on_order_update`                                                                                                              | upsert commission, delete si hors validated/shipped |
| 8     | `trg_sync_commission_on_payment`             | AFTER UPDATE        | payment_status_v2 → paid                | `sync_commission_status_on_payment`                                                                                                                     | commission pending → validated                      |
| 9     | `trig_so_charges_recalc`                     | BEFORE UPDATE       | shipping/handling/insurance changes     | `recalc_sales_order_on_charges_change`                                                                                                                  | recalc total_ttc (round-per-line)                   |
| 10    | `trg_recalculate_so_payment_on_total_change` | BEFORE UPDATE       | total_ttc change                        | `recalculate_so_payment_status_on_total_change`                                                                                                         | sync payment_status_v2                              |
| 11    | `trigger_so_insert_validated_forecast`       | AFTER INSERT        | insert status=validated                 | —                                                                                                                                                       | setup direct si SO créée en validated               |
| 12-16 | Notifications                                | AFTER UPDATE        | divers                                  | `notify_order_confirmed`, `notify_order_shipped`, `notify_order_cancelled`, `notify_payment_received`, `notify_so_delayed`, `notify_so_partial_shipped` | notifications métier                                |
| 17    | `audit_sales_orders`                         | AFTER I/U/D         | tous                                    | `audit_trigger_function`                                                                                                                                | audit log                                           |
| 18    | `sales_orders_updated_at`                    | BEFORE UPDATE       | tous                                    | `update_updated_at`                                                                                                                                     | timestamp                                           |

### 2.2 Triggers sur `sales_order_items`

| #   | Trigger                                            | Timing        | Rôle                                                     |
| --- | -------------------------------------------------- | ------------- | -------------------------------------------------------- |
| 1   | `recalculate_sales_order_totals_trigger`           | AFTER I/U/D   | recalcule totals commande parent                         |
| 2   | `trigger_handle_so_item_quantity_change_confirmed` | AFTER UPDATE  | adapte forecasted_out si qty change sur commande validée |
| 3   | `trg_calculate_retrocession`                       | BEFORE I/U    | calcule retrocession_amount (LinkMe)                     |
| 4   | `trg_update_affiliate_totals`                      | AFTER I/U/D   | recalc totals affilié                                    |
| 5   | `trg_backfill_order_affiliate`                     | AFTER INSERT  | lie SO à affilié LinkMe                                  |
| 6   | `sales_order_items_updated_at`                     | BEFORE UPDATE | timestamp                                                |

### 2.3 Triggers sur `purchase_orders`

| #     | Trigger                                          | Rôle                                                                 |
| ----- | ------------------------------------------------ | -------------------------------------------------------------------- |
| 1     | `trg_po_validation_forecasted_stock`             | +forecasted_in à validation, rollback à dévalidation et cancellation |
| 2     | `trigger_rollback_validated_to_draft`            | rollback alert tracking sur dévalidation                             |
| 3     | `trigger_validate_stock_alerts_on_po`            | passage alerte rouge → vert à validation                             |
| 4     | `trg_stock_alert_tracking_rollback_on_po_cancel` | rollback tracking à cancel                                           |
| 5     | `trigger_reset_alerts_on_po_cancel`              | reset alerts à cancel                                                |
| 6     | `trigger_prevent_po_direct_cancellation`         | bloque cancel direct                                                 |
| 7     | `trigger_handle_po_deletion`                     | rollback stock à DELETE                                              |
| 8     | `trg_update_pmp_on_po_received`                  | met à jour cost_price PMP                                            |
| 9     | `trig_po_charges_recalc`                         | recalc totals                                                        |
| 10    | `trigger_reallocate_po_fees_on_charges`          | réalloue frais sur items                                             |
| 11-14 | Notifications                                    | `notify_po_created/delayed/received/partial_received`                |
| 15    | `audit_purchase_orders`                          | audit log                                                            |

### 2.4 Triggers sur `purchase_order_items`

- `trigger_allocate_po_fees` — alloue frais sur unit_cost
- `trigger_handle_po_item_quantity_change_confirmed` — adapte forecasted_in si qty change sur PO validée
- `trigger_update_cost_price_pmp` — met à jour PMP produit à réception
- `trigger_check_sample_archive` — validation archivage échantillons
- `recalculate_purchase_order_totals_trigger` — recalc totals PO

### 2.5 Triggers sur `linkme_commissions`

- `trg_linkme_commission_ttc` — calcule `*_ttc` à INSERT/UPDATE

### 2.6 Triggers sur `financial_documents`

- `trg_clean_order_quote_on_delete` — nettoie lien devis/commande à DELETE
- `trg_clean_order_quote_on_soft_delete` — idem à soft delete
- `trigger_financial_documents_updated_at` — timestamp

---

## 3. Cartographie des cascades par transition

### 3.1 Transition `draft → validated` (validation SO)

**Déclencheurs automatiques** :

1. ✅ `update_forecasted_out_on_so_validation` → `products.stock_forecasted_out += quantity`
2. ✅ `handle_sales_order_confirmation` → `create_sales_order_forecast_movements(id)` crée les `stock_movements` forecast
3. ✅ `lock_prices_on_order_validation` → lock `base_price_ht_locked`, `selling_price_ht_locked`, `price_locked_at`, recalcule `retrocession_amount`
4. ✅ `create_linkme_commission_on_order_update` → upsert dans `linkme_commissions` si `channel_id = LinkMe`
5. ✅ Notifications : `notify_order_confirmed`
6. ✅ Stock alert tracking synchronisé

**Conclusion** : validation complète et sécurisée côté DB.

### 3.2 Transition `validated → draft` (dévalidation SO)

**Déclencheurs automatiques** :

1. ✅ `rollback_forecasted_out_on_so_devalidation` → `products.stock_forecasted_out -= (quantity - quantity_shipped)`, sync `stock_alert_tracking`, DELETE `stock_movements WHERE reference_type='sales_order_forecast'`
2. ✅ `lock_prices_on_order_validation` branche inverse → reset `base_price_ht_locked = NULL`, `price_locked_at = NULL`
3. ✅ `create_linkme_commission_on_order_update` → **DELETE FROM linkme_commissions WHERE order_id = NEW.id** (status hors validated/shipped)
4. ✅ Pas de notification dévalidation (pas jugé critique)

**Conclusion** : **dévalidation entièrement couverte en cascade**. Romeo s'inquiétait à tort sur la commission — elle est bien gérée.

### 3.3 Transition `validated → cancelled` (annulation directe)

**BLOQUÉE** par `prevent_so_direct_cancellation` (trigger BEFORE UPDATE) qui lève :

> "Impossible d'annuler une commande client validée. Veuillez d'abord la dévalider (remettre en brouillon)."

**Exception** : commandes site-internet (channel `0c2639e9-…`) peuvent passer de `validated → cancelled` directement (Stripe gère le remboursement).

### 3.4 Transition `draft → cancelled` (annulation brouillon)

**Aucune cascade stock** nécessaire (pas de réservation). Annulation directe autorisée.

### 3.5 Transitions `partially_shipped/shipped/delivered → cancelled`

**BLOQUÉES** par `prevent_so_direct_cancellation` (hors site-internet) avec messages explicites.

### 3.6 Transitions PO (achats)

- `draft → validated` : +forecasted_in + validation alerts (rouge → vert)
- `validated → draft` : -forecasted_in + rollback alert tracking (vert → rouge)
- `validated → cancelled` : bloqué direct, branche cancelled gérée comme dévalidation pour le stock
- Réception : différentiel `quantity_received` → déplace forecast vers réel + PMP

**Note sur le statut `sent`** : le champ existe dans l'enum historiquement mais **ne doit jamais être utilisé pour les PO** (voir `docs/current/modules/orders-workflow-reference.md`). Les PO ont 5 statuts effectifs : `draft`, `validated`, `partially_received`, `received`, `cancelled`. Pas de statut "envoyé au fournisseur" distinct — l'envoi email passe par un autre mécanisme (colonnes `supplier_notified_at` ou équivalent, à vérifier si nécessaire).

---

## 4. Diagnostic — Ce qui existe vs ce qui manque

### 4.1 Ce qui fonctionne déjà

| Domaine                                                | Statut | Mécanisme                                                            |
| ------------------------------------------------------ | ------ | -------------------------------------------------------------------- |
| Stock prévisionnel SO validation                       | ✅     | Trigger `update_forecasted_out_on_so_validation`                     |
| Stock prévisionnel SO dévalidation                     | ✅     | Trigger `rollback_forecasted_out_on_so_devalidation`                 |
| Stock prévisionnel PO validation/dévalidation/cancel   | ✅     | Trigger `update_forecasted_stock_on_po_validation` (3 branches)      |
| Stock alert tracking sync                              | ✅     | Migration `20260407150000`                                           |
| Prices locked (base/selling/timestamp)                 | ✅     | Trigger `lock_prices_on_order_validation` (2 sens)                   |
| Commission LinkMe création                             | ✅     | Trigger `create_linkme_commission_on_order_update`                   |
| Commission LinkMe **rollback dévalidation**            | ✅     | Même trigger, branche DELETE si status hors validated/shipped        |
| Commission LinkMe sync paiement                        | ✅     | Trigger `sync_commission_status_on_payment`                          |
| Anti-cancellation directe SO validated                 | ✅     | Trigger `prevent_so_direct_cancellation`                             |
| Anti-cancellation directe PO validated                 | ✅     | Trigger `prevent_po_direct_cancellation`                             |
| Stock movements forecast cleanup                       | ✅     | Dans la fonction de dévalidation                                     |
| Retrocession recalc automatique                        | ✅     | Trigger `trg_calculate_retrocession` + `trg_update_affiliate_totals` |
| PMP produit sur réception PO                           | ✅     | Trigger `trg_update_pmp_on_po_received`                              |
| Notification order confirmed/cancelled/shipped/payment | ✅     | 4 triggers de notification                                           |

### 4.2 Ce qui manque vraiment (gaps Phase 3)

| #      | Gap                                                                                                               | Impact                                                                                                                                                             | Scope                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **G1** | Hook `updateOrderWithItems` (code client) **n'empêche pas** la modification des items d'une commande `validated+` | **Risque critique** : user peut UPDATE `unit_price_ht`, `quantity`, `tax_rate` via UI → prix lockés désynchronisés, totals incohérents avec la facture Qonto émise | 1 fichier à modifier (`packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts`) |
| **G2** | Règle R6 dans `.claude/rules/finance.md` dit _"annulation"_ au lieu de _"dévalidation"_                           | Confusion documentaire ; risque d'erreur future des agents                                                                                                         | 1 fichier à corriger                                                                           |
| **G3** | Pas de trigger DB qui bloque `UPDATE sales_order_items` si parent SO `status != 'draft'`                          | Filet de sécurité côté DB absent. Si un autre hook ou un script SQL direct UPDATE, aucune protection                                                               | 1 migration (optionnel, filet de sécurité)                                                     |
| **G4** | Pas d'UI explicite "Dévalider pour modifier" dans `SalesOrderFormModal` en mode édition                           | UX sous-optimale. L'utilisateur tente de sauvegarder puis reçoit un toast d'erreur                                                                                 | Scope UI séparé (Phase 3.2)                                                                    |

### 4.3 Ce qui n'est pas à faire (fausses inquiétudes)

- ❌ Créer un trigger rollback commission → **existe déjà** (branche DELETE dans `create_linkme_commission_on_order_update`)
- ❌ Créer un trigger rollback envoi fournisseur → **pas de statut `sent` en usage PO** (voir §3.6)
- ❌ Forcer l'annulation pour modifier → workflow réel = dévalider pour modifier (R6 mal formulée)
- ❌ Créer un mécanisme pour `payment_status_v1` → **déjà supprimé**, seul `payment_status_v2` existe

---

## 5. Scope Phase 3 recommandé

### 5.1 Périmètre minimal (recommandé)

**Objectif** : fermer le gap G1 (le seul qui crée un vrai risque métier).

**Modification 1 — hook `updateOrderWithItems`** :

- Fetch `status` dans la query existante (ligne 247 de `use-sales-orders-mutations-write.ts`)
- Si `status !== 'draft'` → throw immédiat avec message clair :
  > "Commande validée : dévalidez-la d'abord (retour en brouillon) pour modifier les articles, puis revalidez après modification."
- Le reste du hook inchangé

**Modification 2 — règle R6 `.claude/rules/finance.md`** :

- Remplacer "Seule action possible sur commande validée avec erreur : annulation."
- Par : "Seule action possible sur commande validée avec erreur : dévalidation (`validated → draft`), puis modification, puis revalidation. L'annulation directe est bloquée par trigger DB."

### 5.2 Périmètre étendu (optionnel — à discuter après minimal)

**G3 — filet DB** (si Romeo veut une sécurité belt-and-suspenders) :

- Trigger BEFORE UPDATE sur `sales_order_items` : si parent SO `status != 'draft'` → RAISE EXCEPTION
- Avantage : protège contre UPDATEs via SQL direct, scripts de maintenance, autres hooks
- Risque : casse `trigger_handle_so_item_quantity_change_confirmed` (qui fait UPDATE legitime sur items de SO validée pour adapter forecasted_out)
- Donc **trigger DB déconseillé** sans refonte complète

**G4 — UI "Dévalider pour modifier"** (Phase 3.2 séparée) :

- Détecter `order.status !== 'draft'` dans `SalesOrderFormModal` mode édition
- Afficher un bandeau : "Cette commande est validée. [Bouton : Dévalider pour modifier]"
- Rend les inputs readonly jusqu'à clic sur Dévalider
- Scope UI, à traiter après validation utilisateur du scope minimal

---

## 6. Risques et précautions

### 6.1 Risques du scope minimal

- **Faible** : une seule modification côté hook, 1 seul appelant (`use-sales-order-submit.ts:282`)
- Test : créer commande en draft → valider → essayer de modifier article → doit échouer avec message clair
- Test : dévalider → modifier article → revalider → doit passer

### 6.2 Ce qui NE doit PAS être fait

- ❌ Toucher aux triggers stock (`stock-triggers-protected.md`)
- ❌ Modifier la Server Action `updateSalesOrderStatus` (elle fonctionne)
- ❌ Modifier `lock_prices_on_order_validation` (gère déjà les deux sens)
- ❌ Modifier `create_linkme_commission_on_order_update` (gère déjà le rollback)

### 6.3 Points d'attention

- `trigger_handle_so_item_quantity_change_confirmed` fait des UPDATEs légitimes sur `sales_order_items` de commandes validées (pour adapter forecasted_out sur changement de qty). **Ne pas le casser** avec un guard DB trop strict.
- Site-internet : les commandes Stripe passent directement en `validated`. Le hook `updateOrderWithItems` ne devrait probablement pas être appelé pour ces commandes (elles ne sont pas modifiables côté BO). À vérifier qu'aucun flow BO n'essaie.

---

## 7. Documentation à corriger post-Phase 3

1. **`.claude/rules/finance.md` R6** : remplacer "annulation" par "dévalidation" (gap G2)
2. **`docs/current/modules/orders-workflow-reference.md`** : la matrice "Editability Rules" ligne `confirmed + not paid: products/quantities with restrictions; addresses and notes editable; prices locked` **contredit** la règle R6/Romeo. La doc devrait dire : `confirmed: fully locked, use devalidation to edit`. À mettre à jour pour cohérence.
3. **`docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md`** : doc déjà correcte, pas de changement.

---

## 8. Plan d'action proposé (à valider)

### Étape 1 — Phase 3 minimale (cette session)

- [ ] Modifier `use-sales-orders-mutations-write.ts` : ajouter guard statut dans `updateOrderWithItems`
- [ ] Corriger R6 dans `.claude/rules/finance.md`
- [ ] Corriger matrice éditabilité dans `docs/current/modules/orders-workflow-reference.md`
- [ ] Type-check + push + PR draft
- [ ] Test manuel Vercel Preview après merge

### Étape 2 — Phase 3.2 UI (session séparée, après validation Phase 3.1)

- [ ] UX "Dévalider pour modifier" dans `SalesOrderFormModal`
- [ ] Test 5 tailles Playwright

### Étape 3 — Documentation (au fil de l'eau)

- [ ] Aligner tous les docs sur le vrai workflow "dévalider pour modifier"

---

## 9. Sources consultées

- Base de données live (triggers + définitions fonctions via `mcp__supabase__execute_sql`)
- `docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md` (v2.0.0, 2025-10-14)
- `docs/current/modules/orders-workflow-reference.md` (v2.0, 2026-02-26)
- `docs/current/finance/AUDIT-WORKFLOW-COMMANDES-DEVIS-FACTURES.md` (2026-04-11)
- `supabase/migrations/20260407150000_fix_stock_forecast_rollback_on_devalidation_and_cancellation.sql`
- `supabase/migrations/20260223161237_fix_tva_rate_and_commission_trigger.sql`
- `supabase/migrations/20251128_001_trigger_so_devalidation_stock_rollback.sql`
- `apps/back-office/src/app/actions/sales-orders.ts`
- `packages/@verone/orders/src/hooks/use-sales-orders-mutations-write.ts`
- `.claude/rules/finance.md` (règles R1–R7)
- `.claude/rules/stock-triggers-protected.md`

---

**Conclusion** : le système est déjà robuste. Le vrai scope Phase 3 est **très petit** (1 hook + 2 docs) mais critique pour empêcher la désynchronisation silencieuse. Prêt à coder dès validation du scope minimal par Romeo.
