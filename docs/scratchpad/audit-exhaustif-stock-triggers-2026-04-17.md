# Audit exhaustif — Stock, triggers, alertes (2026-04-17)

**Scope** : cartographie complète du système stock/commandes vs documentation officielle.
**Mode** : read-only — aucune modification DB, aucun fix appliqué.
**Branche** : `feat/BO-STOCK-001-fix-shipment-trigger-rls` (commit `0441c4f99` en local).

---

## TL;DR

Le bug RLS silencieux (BO-STOCK-001) n'était **que la pointe de l'iceberg**. L'audit révèle :

1. **2 bugs critiques** de logique métier (forecasted_out non incrémenté pour les SOs créées direct-validated, couverture RLS incomplète)
2. **~15 fonctions sans `SECURITY DEFINER`** dont plusieurs dans des chaînes de triggers — risque silent fail à chaque mise à jour staff
3. **2 triggers en doublon** sur `purchase_order_items` (recalcul effectué 2×)
4. **2 triggers manquants** sur `sales_order_shipments` et `purchase_order_receptions` (UPDATE quantity non propagé)
5. **7 produits** avec `stock_real` désynchronisé de `SUM(stock_movements)` (delta de +103 à ±1)
6. **12 produits** avec `stock_forecasted_out` incohérent (SO-00124 + SO-00131)
7. **~20+ docs supprimées** dans 2 gros commits de nettoyage (mars 2026) — perte du référentiel "état sain"

Aucun stock négatif, aucune alerte fantôme, RLS products/movements/alerts OK.

---

## 1. État documenté (workflow attendu)

Source : `docs/current/database/triggers-stock-reference.md`, `docs/current/modules/stock-module-reference.md`, `docs/current/serena/stock-orders-logic.md`.

### 1.1 Flux forecasted

```
PO draft -> validated      : forecasted_in +=  qty       (trigger_po_update_forecasted_in)
PO validated -> received   : forecasted_in -=, stock_real +=  (trigger_reception_update_stock)
PO validated -> cancelled  : forecasted_in -=            (trigger_po_cancellation_rollback)
SO draft -> validated      : forecasted_out += qty       (trigger_so_update_forecasted_out)
SO validated -> shipped    : forecasted_out -=, stock_real -=  (trigger_shipment_update_stock)
SO validated -> cancelled  : forecasted_out -=           (trigger_so_cancellation_rollback)
```

### 1.2 Formule stock prévisionnel

`stock_previsionnel = stock_real + stock_forecasted_in - stock_forecasted_out`

### 1.3 Alertes 3 états

- **ROUGE** : `low_stock` (stock_real < min_stock) OU `out_of_stock` (previsionnel < 0)
- **VERT** : PO validée couvre le besoin (`validated = true`)
- **DISPARUE** : stock reçu, `stock_real >= min_stock`

---

## 2. État réel en DB

### 2.1 Fonctions SQL — manque de `SECURITY DEFINER`

Source : `pg_proc WHERE proname LIKE '%stock%' OR ...` — 78 fonctions scannées.

| Fonction                                     | SECURITY DEFINER      | search_path | Criticité                                                           |
| -------------------------------------------- | --------------------- | ----------- | ------------------------------------------------------------------- |
| `update_stock_on_shipment`                   | ✅ (fix BO-STOCK-001) | ✓           | —                                                                   |
| `confirm_packlink_shipment_stock`            | ✅ (fix BO-STOCK-001) | ✓           | —                                                                   |
| `handle_shipment_deletion`                   | ✅ (fix BO-STOCK-001) | ✓           | —                                                                   |
| `update_forecasted_out_on_so_validation`     | ✅                    | ✓           | —                                                                   |
| `update_forecasted_stock_on_po_validation`   | ✅                    | ✓           | —                                                                   |
| `update_stock_on_reception`                  | ✅                    | ✓           | —                                                                   |
| `update_product_stock_after_movement`        | ✅                    | ✓           | —                                                                   |
| `sync_stock_alert_tracking_v4`               | ✅                    | ✓           | —                                                                   |
| `rollback_po_forecasted`                     | ✅                    | ✓           | —                                                                   |
| `rollback_so_forecasted`                     | ✅                    | ✓           | —                                                                   |
| `rollback_forecasted_out_on_so_devalidation` | ✅                    | ✓           | —                                                                   |
| **`update_stock_alert_on_movement`**         | ❌                    | ✓           | **HAUTE** (trigger AFTER INSERT/UPDATE/DELETE stock_movements)      |
| **`validate_stock_alerts_on_po`**            | ❌                    | ✓           | **HAUTE** (trigger AFTER UPDATE PO draft→validated)                 |
| **`reverse_stock_on_movement_delete`**       | ❌                    | ✓           | **HAUTE** (trigger BEFORE DELETE stock_movements — UPDATE products) |
| **`handle_reception_deletion`**              | ❌                    | ✓           | **HAUTE** (trigger BEFORE DELETE receptions)                        |
| `reset_stock_alerts_on_po_cancel`            | ❌                    | ✓           | MOYENNE                                                             |
| `revalidate_alerts_on_reception`             | ❌                    | ✓           | MOYENNE                                                             |
| `recalculate_sales_order_totals`             | ❌                    | ✓           | BASSE (recalcul totaux, pas stock)                                  |
| `recalculate_purchase_order_totals`          | ❌                    | ✓           | BASSE                                                               |
| `recalc_sales_order_on_charges_change`       | ❌                    | ✓           | BASSE                                                               |
| `recalc_purchase_order_on_charges_change`    | ❌                    | ✓           | BASSE                                                               |
| `calculate_stock_forecasted`                 | ❌                    | ✓           | BASSE (getter)                                                      |
| `calculate_stock_status`                     | ❌                    | ✓           | BASSE (getter)                                                      |
| `sync_stock_status`                          | ❌                    | ✓           | BASSE                                                               |
| `sync_stock_quantity_from_stock_real`        | ❌                    | ✓           | BASSE                                                               |
| `recalculate_forecasted_stock`               | ❌                    | ✓           | BASSE                                                               |
| `recalculate_product_stock`                  | ❌                    | ✓           | BASSE                                                               |
| **`update_sales_order_affiliate_totals`**    | ❌                    | **❌ NULL** | MOYENNE (search_path non fixé = faille sécurité)                    |
| `manage_sales_order_stock`                   | ❌                    | ✓           | —                                                                   |

**Analyse** : les triggers marqués HAUTE sont ceux qui tournent en cascade d'actions staff et font des UPDATE sur des tables dont les policies RLS peuvent ne pas couvrir le caller. Silent fail possible (même pattern que le bug SECURITY DEFINER qu'on vient de fixer).

### 2.2 Triggers actifs — vs doc

Source : `pg_trigger` sur 9 tables stock.

#### ✅ Conformes à la doc

- `sales_orders` (17 triggers) : tous présents et ENABLED, sauf `sales_order_shipment_trigger` (supprimé le 2025-11-28, OK)
- `sales_order_items` : les 4 triggers attendus présents
- `sales_order_shipments` : 4 triggers (update_stock, packlink_confirm, notify, **trigger_before_delete_shipment restauré par BO-STOCK-001**)
- `purchase_orders` : triggers PO validation/cancellation/delayed/received/partial/handle_deletion/prevent_direct_cancellation/reset_alerts/rollback_validated tous ENABLED
- `purchase_order_receptions` : 4 triggers (validation, delete, update_stock, affiliate)
- `stock_movements` : 5 triggers (audit, updated_at, reverse, sync, alert)
- `stock_alert_tracking` : 2 triggers (insert notification ENABLED, update DISABLED attendu)
- `products` : 17 triggers dont `sync_stock_alert_tracking_v4` ENABLED

#### ⚠️ Anomalies

**DOUBLON sur `purchase_order_items`** — non documenté :

```
recalculate_purchase_order_totals_trigger  AFTER INSERT/DELETE/UPDATE -> recalculate_purchase_order_totals()
trig_recalc_po_totals                      AFTER INSERT/DELETE/UPDATE -> recalculate_purchase_order_totals()
```

Même fonction appelée par 2 triggers → **recalcul effectué 2×** à chaque modification d'item.

**DISABLED** (probablement voulu) :

- `trigger_stock_negative_forecast_notification` (products) — trop bruyant
- `trigger_create_notification_on_stock_alert_update` (stock_alert_tracking) — confirmé dans doc
- `trigger_po_created_notification` (purchase_orders) — confirmé dans doc

#### ❌ Triggers MANQUANTS (vs `stock-module-reference.md` section 5)

- **`trigger_before_update_shipment`** / `handle_shipment_quantity_update()` — BEFORE UPDATE sur `sales_order_shipments`. Doit ajuster stock quand quantity_shipped change. **Absent en DB.**
- **`trigger_before_update_reception`** / `handle_reception_quantity_update()` — BEFORE UPDATE sur `purchase_order_receptions`. Idem. **Absent en DB.**

Ces triggers étaient créés par `20251124_004_trigger_update_shipment_adjust_stock.sql` (fonction existe toujours en migrations). Ils ont disparu de la DB à une date inconnue.

### 2.3 RLS policies — couverture staff

Source : `pg_policies` sur 9 tables.

| Table                       | SELECT staff                              | INSERT staff                    | UPDATE staff               | DELETE staff    |
| --------------------------- | ----------------------------------------- | ------------------------------- | -------------------------- | --------------- |
| `products`                  | ✅ (backoffice_full_access)               | ✅                              | ✅                         | ✅              |
| `sales_orders`              | ✅ staff_select                           | ✅ Public can create            | ✅ staff_update            | ✅ staff_delete |
| **`sales_order_items`**     | ✅ staff_select                           | ✅ Public can create            | **❌ AUCUNE policy staff** | ✅ staff_delete |
| `sales_order_shipments`     | ✅ (backoffice_full_access)               | ✅                              | ✅                         | ✅              |
| `purchase_orders`           | ✅ staff_manage ALL                       | ✅                              | ✅                         | ✅              |
| `purchase_order_items`      | ✅ staff_manage ALL                       | ✅                              | ✅                         | ✅              |
| `purchase_order_receptions` | ✅ (backoffice_full_access)               | ✅                              | ✅                         | ✅              |
| `stock_movements`           | ✅ (backoffice_full_access)               | ✅ + system_triggers_can_insert | ✅                         | ✅              |
| `stock_alert_tracking`      | ✅ (backoffice_full_access + permissives) | ✅                              | ✅                         | ✅              |

**⚠️ Trou confirmé** : `sales_order_items` n'a aucune policy UPDATE pour staff. Les seuls UPDATE sont permis via `linkme_users_update_own_order_items` (affilié LinkMe + draft). Le staff ne peut modifier `quantity_shipped` ou `quantity` qu'à travers un trigger en `SECURITY DEFINER` — ce qui est maintenant le cas pour les triggers shipment, mais **pas encore pour les autres scénarios** (modification manuelle de qty par ex. depuis l'UI — à vérifier quel flux existe côté app).

---

## 3. Écarts de données

### 3.1 `stock_forecasted_out` — 12 produits incohérents

Attendu : `SUM(soi.quantity - soi.quantity_shipped)` sur SOs `validated`/`partially_shipped`.

| SKU      | Produit               | actual | expected | delta   | SO concernée  |
| -------- | --------------------- | ------ | -------- | ------- | ------------- |
| PLA-0002 | Plateau bois 30x40 cm | 0      | 30       | **-30** | SO-2026-00124 |
| SUS-0006 | Suspension raphia 6   | 0      | 6        | -6      | SO-2026-00124 |
| SUS-0009 | Suspension frange n°3 | 0      | 5        | -5      | SO-2026-00124 |
| SUS-0003 | Suspension paille     | 0      | 4        | -4      | SO-2026-00124 |
| COU-0006 | Coussin Évasion Bleu  | 0      | 3        | -3      | SO-2026-00124 |
| COU-0005 | Coussin Rose Sérénité | 0      | 3        | -3      | SO-2026-00124 |
| COU-0001 | Coussin Rêveur        | 0      | 3        | -3      | SO-2026-00124 |
| DEC-0004 | Rond paille M         | 0      | 1        | -1      | SO-2026-00124 |
| DEC-0003 | Rond paille L         | 0      | 1        | -1      | SO-2026-00124 |
| SUS-0005 | Suspension raphia 5   | 0      | 1        | -1      | SO-2026-00124 |
| DEC-0002 | Rond paille S         | 0      | 1        | -1      | SO-2026-00124 |
| DEC-0001 | Miroir XL             | 0      | 1        | -1      | SO-2026-00124 |

**Total manquant** : -59 pour SO-2026-00124 (12 produits). **-1 supplémentaire** attendu sur un produit de SO-2026-00131 (qty=1, status validated) — non-visible parce que forecasted_out=0 pour ce produit aussi.

**Racine** : voir §4.1.

### 3.2 `stock_forecasted_in` — cohérent ✅

Aucune divergence. Tous les produits ont `forecasted_in = SUM(poi.quantity - quantity_received)` des POs `validated`/`partially_received`.

### 3.3 `stock_real` vs `SUM(stock_movements)` — 7 produits désynchronisés

| SKU      | Produit                           | stock_real | computed | delta    |
| -------- | --------------------------------- | ---------- | -------- | -------- |
| PLA-0001 | Plateau bois 20x30 cm             | 829        | 726      | **+103** |
| COU-0001 | Coussin Rêveur                    | 41         | 40       | +1       |
| VAS-0008 | Vase ceramic Anse terracotta      | 17         | 18       | -1       |
| VAS-0016 | Vase terracota Pluriel            | 41         | 42       | -1       |
| VAS-0017 | Vase ceramic Titi bleu            | 17         | 18       | -1       |
| VAS-0020 | Vase ceramic Double blanc texturé | 23         | 24       | -1       |
| VAS-0019 | Vase ceramic boule terracotta     | 35         | 36       | -1       |

**Interprétation** :

- PLA-0001 : +103 = très probablement backfill Bubble sans stock_movement associé (import initial)
- Les 6 autres à ±1 : probable migration `20260223170045_backfill_shipments_legacy_orders.sql` qui désactivait le trigger → stock physique enregistré dans sales_order_shipments mais pas dans stock_movements. Delta négatif (-1) = shipment existe dans `sales_order_shipments` mais pas dans `stock_movements`.

**Pas urgent** : ce sont des écarts hérités (legacy), pas de perte d'intégrité.

### 3.4 `stock_alert_tracking` — vide ✅

Table vide en ce moment. Cohérent avec §3.5 : un seul produit a `min_stock > 0` et il n'est pas en rupture.

### 3.5 Alertes manquantes — aucune ✅

Seul 1 produit a `min_stock > 0` (non identifié par la requête). Aucun produit avec `stock_real < min_stock` n'est sans alerte.

**Remarque** : 231/232 produits ont `min_stock = 0` → **aucune surveillance d'alerte automatique** sur eux. C'est un choix métier à valider.

### 3.6 Rond paille S — spécifique

- `stock_real = 1`, `min_stock = 0` → **pas d'alerte attendue** ✅
- Mouvements : ADJUST +1 (23:31:50 le 2026-04-16) + OUT -1 (23:36:34, shipment SO-00124 → supprimé au cleanup)
- Après cleanup complet : stock_real=1 (préservé l'ajustement de Romeo)

Cohérent avec ce que Romeo attendait.

### 3.7 SOs validated actuelles

| SO            | Status    | qty_ordered | qty_shipped | créée            | forecasted_out contribue ?     |
| ------------- | --------- | ----------- | ----------- | ---------------- | ------------------------------ |
| SO-2026-00124 | validated | 59          | 0           | 2026-03-11 14:52 | ❌ NON (trigger pas déclenché) |
| SO-2026-00131 | validated | 1           | 0           | 2026-03-19 13:50 | ❌ NON (trigger pas déclenché) |

---

## 4. Transitions cassées

### 4.1 SO created-directly-validated — trigger non déclenché ❌

La fonction `update_forecasted_out_on_so_validation()` contient :

```sql
IF OLD.status = 'draft' AND NEW.status = 'validated' THEN
  ...
END IF;
```

Le trigger est sur `AFTER UPDATE OF status`. Si une SO est **INSÉRÉE directement en status `validated`** (via import, backfill, création programmatique), l'UPDATE ne se produit jamais et le trigger ne se déclenche pas.

**SOs affectées** : SO-2026-00124 (2026-03-11) et SO-2026-00131 (2026-03-19) — les 2 seules actuellement en `validated`.

**Fix attendu** : soit ajouter un trigger `AFTER INSERT` avec condition `NEW.status = 'validated'`, soit modifier la fonction pour gérer les deux cas. Alternative : imposer via Server Action le pattern "créer en draft → valider" (mais contrainte UI).

### 4.2 SO validated → shipped — ✅ FIXÉ (BO-STOCK-001)

Le bug silent RLS a été corrigé. La transition fonctionne maintenant pour les staff. Non testé en live ce soir.

### 4.3 SO validated → cancelled — à vérifier

`trigger_so_cancellation_rollback` appelle `rollback_so_forecasted()` (SECURITY DEFINER ✅). Chaîne logique OK mais **non testée**.

### 4.4 SO validated → draft (dévalidation) — à vérifier

`trg_so_devalidation_forecasted_stock` appelle `rollback_forecasted_out_on_so_devalidation()` (SECURITY DEFINER ✅). Le trigger tourne sur `AFTER UPDATE` sans filtrer OLD/NEW dans le WHEN, donc il se déclenche à chaque UPDATE — la fonction doit filtrer en interne. **À vérifier** que la fonction ne double-rollback pas.

### 4.5 Changement de `quantity` sur items confirmés — à vérifier

`trigger_handle_so_item_quantity_change_confirmed` / `handle_so_item_quantity_change_confirmed()` : SECURITY DEFINER à vérifier. Tourne sur `AFTER UPDATE OF quantity` si OLD != NEW.

### 4.6 PO transitions — à vérifier

- `trg_po_validation_forecasted_stock` → `update_forecasted_stock_on_po_validation()` SECURITY DEFINER ✅
- `trigger_validate_stock_alerts_on_po` → `validate_stock_alerts_on_po()` **SECURITY INVOKER ❌** (risque silent fail sur stock_alert_tracking)
- `trigger_rollback_validated_to_draft` → `rollback_validated_to_draft_tracking()` SECURITY DEFINER ✅
- `trigger_reset_alerts_on_po_cancel` → `reset_stock_alerts_on_po_cancel()` **SECURITY INVOKER ❌**
- `trg_stock_alert_tracking_rollback_on_po_cancel` → `rollback_stock_alert_tracking_on_po_cancel()` SECURITY DEFINER ✅

### 4.7 DELETE shipment — ✅ FIXÉ (BO-STOCK-001)

Trigger restauré.

### 4.8 DELETE reception — à vérifier

`trigger_before_delete_reception` → `handle_reception_deletion()` **SECURITY INVOKER ❌**. Risque silent fail.

### 4.9 UPDATE shipment quantity — MANQUANT

Trigger `trigger_before_update_shipment` ABSENT. Si un staff modifie `quantity_shipped` (via SQL ou UI future), le stock ne suivra pas.

### 4.10 UPDATE reception quantity — MANQUANT

Trigger `trigger_before_update_reception` ABSENT. Idem.

---

## 5. Timeline des casses

### Commits critiques (ordre chronologique)

| Date       | Commit                                                                     | Impact                                                                                                                                              |
| ---------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2025-11-24 | `deb4508f3` feat(shipments): Système expéditions SO complet                | ✅ État sain initial                                                                                                                                |
| 2025-11-24 | migration `20251124_004_trigger_update_shipment_adjust_stock.sql`          | Crée `trigger_before_update_shipment` (plus tard disparu)                                                                                           |
| 2025-11-27 | migration `20251127_003_fix_stock_movement_trigger_affects_forecast.sql`   | Fix trigger                                                                                                                                         |
| 2025-11-28 | `f730a6ced` fix(triggers): Suppression trigger doublon expéditions SO      | ⚠️ Supprime `sales_order_shipment_trigger` + `handle_sales_order_shipment()` (légitime mais transfère tout le poids sur `update_stock_on_shipment`) |
| 2026-02-23 | migration `20260223170045_backfill_shipments_legacy_orders.sql`            | Crée 22 shipments legacy sans décrémenter stock_real (trigger désactivé temporairement)                                                             |
| 2026-03-14 | **`f48d059bd`** [DEPLOY] Repo cleanup                                      | **HARD DELETE** de ~25 docs stock/workflow recovered                                                                                                |
| 2026-03-23 | **migration `20260323100000_packlink_deferred_stock.sql`**                 | 🔥 **Redéfinit `update_stock_on_shipment()` SANS SECURITY DEFINER** — origine du bug principal                                                      |
| 2026-03-27 | **`2abd93328`** chore: repository cleanup + complete documentation rewrite | **HARD DELETE** docs business-rules alerts/backorders/traceability + serena snapshots                                                               |
| 2026-04-07 | (non versionné)                                                            | Backfill manuel SOs shipped pour camoufler le bug forecasted_out — toutes `updated_at=2026-04-07 13:01:46`                                          |
| 2026-04-09 | `2322780e0` chore: remove Serena MCP                                       | Supprime `stock-orders-logic.md` et autres serena docs                                                                                              |
| 2026-04-15 | `2171a4a7d` chore: Phase 6 — Nettoyage fichiers orphelins                  | Supprime `.claude/rules/dev/stock-triggers-protected.md`                                                                                            |
| 2026-04-16 | incident SO-2026-00124                                                     | 12 shipments silent-fail observés                                                                                                                   |
| 2026-04-17 | `0441c4f99` [BO-STOCK-001] fix: shipment trigger RLS silent failure        | ✅ Fix 3 fonctions shipment + restore trigger DELETE + backfill 22 SOs legacy                                                                       |

### Docs perdues dans les 2 gros commits

**`f48d059bd` (2026-03-14)** supprime :

- `docs/database/triggers.md`, `docs/database/triggers-hooks.md`
- `docs/workflows/stock-movements.md`, `docs/workflows/orders-lifecycle.md`
- `docs/modules/stocks.md`
- `docs/recovered/serena-snapshots/sales-orders-stock-logic-complete-2025-11-27.md`
- `docs/recovered/serena-snapshots/purchase-orders-validated-workflow-2025-11-19.md`
- `docs/recovered/serena-snapshots/triggers-audit-cleanup-2025-11-28.md`
- `docs/recovered/serena-snapshots/triggers-reactivation-plan-2025-11-25.md`
- `docs/recovered/audits-backoffice-2026-01/05-stocks.md`
- `docs/recovered/explorations/exploration-stock-movements-manual-vs-automatic.md`
- `docs/recovered/explorations/stock-alerts-system-exploration.md`
- `docs/recovered/archive-2026-01/compta-workflows.md`
- `docs/recovered/archive-2026-01/owner-daily-workflow.md`
- `docs/audits/workflow-audit-2026.md`
- `docs/claude/eslint-test-workflow-validation.md`

**`2abd93328` (2026-03-27)** supprime :

- `docs/business-rules/06-stocks/alertes/guide-configuration-seuils.md`
- `docs/business-rules/06-stocks/alertes/stock-alert-tracking-system.md`
- `docs/business-rules/06-stocks/backorders/BACKORDERS-POLICY.md`
- `docs/business-rules/06-stocks/movements/real-vs-forecast-separation.md`
- `docs/business-rules/06-stocks/movements/stock-traceability-rules.md`
- `docs/business-rules/07-commandes/clients/sales-order-cancellation-workflow.md`
- `docs/business-rules/07-commandes/notifications-workflow.md`
- `docs/workflows/orders-lifecycle.md`
- `docs/workflows/stock-movements.md`
- `docs/metrics/database-triggers.md`

Ces docs existent toujours dans git et peuvent être récupérées via `git show <commit>^:<path>`.

---

## 6. Plan de fix en phases — PROPOSITION (NON EXÉCUTÉ)

### Phase 1 — Stabilisation triggers (priorité HAUTE)

Migration `20260418_fix_remaining_security_invoker_triggers.sql` :

1. Ajouter `SECURITY DEFINER` + `SET search_path = public` à :
   - `update_stock_alert_on_movement()`
   - `validate_stock_alerts_on_po()`
   - `reverse_stock_on_movement_delete()`
   - `handle_reception_deletion()`
   - `reset_stock_alerts_on_po_cancel()`
   - `revalidate_alerts_on_reception()`
   - `update_sales_order_affiliate_totals()` (+ fix search_path NULL)

2. Restaurer `trigger_before_update_shipment` et `trigger_before_update_reception` (migrations `20251124_003/004` existent, les ré-appliquer avec `SECURITY DEFINER`)

3. Supprimer le doublon `trig_recalc_po_totals` (garder `recalculate_purchase_order_totals_trigger`)

### Phase 2 — Fix création SO direct-validated (priorité HAUTE)

Migration `20260418_fix_so_direct_validated_forecast.sql` :

Option A — Ajouter trigger `AFTER INSERT` sur `sales_orders` quand `NEW.status = 'validated'` : appelle la même logique que `update_forecasted_out_on_so_validation()`.

Option B — Convertir le trigger existant en `AFTER INSERT OR UPDATE` avec condition combinée.

### Phase 3 — Backfill données incohérentes (priorité MOYENNE)

Migration `20260418_backfill_forecasted_out_current_validated.sql` :

Pour chaque SO actuellement en `validated`/`partially_shipped` avec `quantity_shipped < quantity` :

- Recalculer et UPDATE `products.stock_forecasted_out` pour retrouver la cohérence.

Requête idempotente avec WHERE filter strict.

### Phase 4 — Backfill stock_real legacy (priorité BASSE)

Pour les 7 produits désynchronisés `stock_real` vs `SUM(movements)` :

- Audit manuel : créer des `stock_movements` d'ajustement historique pour combler les deltas
- OU accepter l'écart comme inventaire initial non tracé

### Phase 5 — Restauration documentation (priorité BASSE)

Re-extraire les docs supprimées depuis git et les placer dans `docs/current/` :

- `docs/current/workflows/orders-lifecycle.md`
- `docs/current/workflows/stock-movements.md`
- `docs/current/business-rules/06-stocks/alertes/stock-alert-tracking-system.md`
- `docs/current/business-rules/06-stocks/movements/real-vs-forecast-separation.md`
- `docs/current/serena/stock-orders-logic.md` (déjà présent partiellement)

### Phase 6 — Tests E2E (priorité MOYENNE)

- Test SO draft → validated : vérifier forecasted_out +=
- Test SO create-direct-validated : vérifier forecasted_out += (après Phase 2)
- Test SO validated → shipped : vérifier forecasted_out -=, stock_real -=, quantity_shipped, status
- Test SO shipped → DELETE shipment : vérifier rollback complet
- Test SO validated → cancelled : vérifier rollback forecasted_out
- Test PO draft → validated : vérifier forecasted_in +=
- Test PO validated → received : vérifier stock_real +=, forecasted_in -=
- Test PO validated → cancelled : vérifier rollback
- Test alerte : ajustement sous min_stock → alerte créée → +1 → alerte résolue

---

## 7. Questions ouvertes pour Romeo

1. **Création direct-validated** : les SOs SO-00124 et SO-00131 ont été créées/importées directement en `validated`. C'est un cas d'usage (import Bubble, création via script) ou un bug de l'UI ? Si c'est voulu → Phase 2 nécessaire. Si c'est un bug UI → corriger le flux en amont.

2. **`min_stock = 0` sur 231/232 produits** : la surveillance automatique des alertes est de fait désactivée. Intentionnel (chaque produit doit être configuré manuellement) ou bug de seed/migration ?

3. **Stock_real PLA-0001 +103** : c'est un vieux stock non tracé (Bubble initial) ? Garder tel quel ou créer un stock_movement d'ajustement historique ?

4. **Doublon `trig_recalc_po_totals`** : supprimer le doublon OK pour toi ?

5. **Trigger AFTER INSERT pour SO direct-validated** : OK pour Phase 2 option A (nouveau trigger) ou tu préfères forcer le workflow "draft puis validate" côté UI ?

6. **Ordre d'exécution des phases** : je propose Phase 1 → Phase 2 → Phase 3 (backfill forecasted_out) → tests → Phase 4-5-6. OK ?

---

## 8. Scope actuel de la branche BO-STOCK-001

**Commit `0441c4f99` (déjà local, non pushé)** :

- ✅ Fix SECURITY DEFINER sur 3 fonctions shipment
- ✅ Restauration trigger DELETE shipment
- ✅ Backfill 22 SOs legacy

Cet audit propose des fix additionnels. Décider si on :

- **Option A** : tout bundle dans la même branche BO-STOCK-001 (un seul gros fix)
- **Option B** : créer BO-STOCK-002 pour les nouvelles phases, garder BO-STOCK-001 minimal

Recommandation : **Option B** pour faciliter review et rollback indépendant.

---

_Fin de l'audit. Aucune modification DB effectuée. Scratchpad seul fichier créé._
