# 🔍 AUDIT COMPLET TRIGGERS STOCK - 2025-11-23

**Date** : 2025-11-23
**Demandé par** : Romeo Dos Santos
**Objectif** : Lister TOUS les triggers liés au stock et identifier ce qui manque

---

## 📊 SECTION A : TRIGGERS ACTUELS (48 identifiés)

### 1️⃣ TABLE `products` (11 triggers)

| #   | Trigger                                           | Fonction                                | Événement                  | Description                |
| --- | ------------------------------------------------- | --------------------------------------- | -------------------------- | -------------------------- |
| 1   | `products_updated_at`                             | `update_updated_at()`                   | BEFORE UPDATE              | Mise à jour timestamp      |
| 2   | `trg_generate_product_slug_on_insert`             | `trigger_generate_product_slug()`       | BEFORE INSERT              | Génération slug SEO        |
| 3   | `trg_update_variant_group_count`                  | `update_variant_group_product_count()`  | AFTER INSERT/UPDATE/DELETE | Compteur variantes         |
| 4   | `trigger_calculate_completion`                    | `calculate_product_completion_status()` | BEFORE INSERT/UPDATE       | Statut complétude fiche    |
| 5   | `trigger_log_sample_requirement_changes_products` | `log_sample_requirement_changes()`      | AFTER UPDATE               | Log échantillons           |
| 6   | `trigger_products_search_vector_update`           | `products_search_vector_update()`       | BEFORE INSERT/UPDATE       | Recherche texte            |
| 7   | `trigger_set_product_sku`                         | `trigger_generate_product_sku()`        | BEFORE INSERT              | Génération SKU             |
| 8   | `trigger_sync_item_group_id`                      | `sync_item_group_id()`                  | BEFORE INSERT/UPDATE       | Sync variant_group         |
| 9   | **⭐ `trigger_sync_stock_alert_tracking_v4`**     | **`sync_stock_alert_tracking_v4()`**    | **AFTER INSERT/UPDATE**    | **Gestion alertes stock**  |
| 10  | `trigger_sync_suitable_rooms_on_product`          | `sync_variant_group_suitable_rooms()`   | AFTER INSERT/UPDATE        | Pièces applicables         |
| 11  | `trigger_validate_custom_product_assignment`      | `validate_custom_product_assignment()`  | BEFORE INSERT/UPDATE       | Validation produits custom |

### 2️⃣ TABLE `purchase_orders` (10 triggers)

| #   | Trigger                                      | Fonction                              | Événement                               | Description                       |
| --- | -------------------------------------------- | ------------------------------------- | --------------------------------------- | --------------------------------- |
| 1   | `audit_purchase_orders`                      | `audit_trigger_function()`            | AFTER INSERT/UPDATE/DELETE              | Audit trail                       |
| 2   | `purchase_orders_updated_at`                 | `update_updated_at()`                 | BEFORE UPDATE                           | Timestamp                         |
| 3   | **⭐ `trigger_po_cancellation_rollback`**    | **`rollback_po_forecasted()`**        | **AFTER UPDATE status→cancelled**       | **Rollback forecasted_in**        |
| 4   | `trigger_po_created_notification`            | `notify_po_created()`                 | AFTER INSERT                            | Notification création             |
| 5   | `trigger_po_delayed_notification`            | `notify_po_delayed()`                 | AFTER UPDATE                            | Notification retard               |
| 6   | `trigger_po_partial_received_notification`   | `notify_po_partial_received()`        | AFTER UPDATE                            | Notification réception partielle  |
| 7   | `trigger_po_received_notification`           | `notify_po_received()`                | AFTER UPDATE                            | Notification réception complète   |
| 8   | **⭐ `trigger_po_update_forecasted_in`**     | **`update_po_forecasted_in()`**       | **AFTER UPDATE status draft→validated** | **Augmente forecasted_in**        |
| 9   | `trigger_purchase_orders_updated_at`         | `update_purchase_orders_updated_at()` | BEFORE UPDATE                           | Timestamp                         |
| 10  | **⭐ `trigger_validate_stock_alerts_on_po`** | **`validate_stock_alerts_on_po()`**   | **AFTER UPDATE status draft→validated** | **Marque alertes validated=true** |

### 3️⃣ TABLE `purchase_order_items` (7 triggers)

| #   | Trigger                                            | Fonction                                     | Événement                             | Description                       |
| --- | -------------------------------------------------- | -------------------------------------------- | ------------------------------------- | --------------------------------- |
| 1   | `purchase_order_items_updated_at`                  | `update_updated_at()`                        | BEFORE UPDATE                         | Timestamp                         |
| 2   | `recalculate_purchase_order_totals_trigger`        | `recalculate_purchase_order_totals()`        | AFTER INSERT/UPDATE/DELETE            | Calcul totaux PO                  |
| 3   | `trigger_check_sample_archive`                     | `check_sample_archive_allowed()`             | BEFORE UPDATE archived_at             | Validation archivage échantillons |
| 4   | `trigger_handle_po_item_quantity_change_confirmed` | `handle_po_item_quantity_change_confirmed()` | AFTER UPDATE quantity                 | Gestion changement quantité       |
| 5   | `trigger_track_product_added_to_draft`             | `track_product_added_to_draft()`             | AFTER INSERT                          | Tracking ajout produit            |
| 6   | `trigger_track_product_quantity_updated_in_draft`  | `track_product_quantity_updated_in_draft()`  | AFTER UPDATE quantity                 | Tracking modif quantité           |
| 7   | `trigger_track_product_removed_from_draft`         | `track_product_removed_from_draft()`         | AFTER DELETE                          | Tracking suppression              |
| 8   | **⭐ `trigger_update_cost_price_from_po`**         | **`update_product_cost_price_from_po()`**    | **AFTER INSERT/UPDATE unit_price_ht** | **MAJ prix achat produit**        |

### 4️⃣ TABLE `purchase_order_receptions` (1 trigger)

| #   | Trigger                                 | Fonction                          | Événement        | Description                       |
| --- | --------------------------------------- | --------------------------------- | ---------------- | --------------------------------- |
| 1   | **⭐ `trigger_reception_update_stock`** | **`update_stock_on_reception()`** | **AFTER INSERT** | **Stock real +, forecasted_in -** |

### 5️⃣ TABLE `sales_orders` (9 triggers)

| #   | Trigger                                   | Fonction                         | Événement                               | Description                 |
| --- | ----------------------------------------- | -------------------------------- | --------------------------------------- | --------------------------- |
| 1   | `audit_sales_orders`                      | `audit_trigger_function()`       | AFTER INSERT/UPDATE/DELETE              | Audit trail                 |
| 2   | `sales_orders_updated_at`                 | `update_updated_at()`            | BEFORE UPDATE                           | Timestamp                   |
| 3   | `trigger_order_cancelled_notification`    | `notify_order_cancelled()`       | AFTER UPDATE                            | Notification annulation     |
| 4   | `trigger_order_confirmed_notification`    | `notify_order_confirmed()`       | AFTER UPDATE                            | Notification confirmation   |
| 5   | `trigger_order_shipped_notification`      | `notify_order_shipped()`         | AFTER UPDATE                            | Notification expédition     |
| 6   | `trigger_payment_received_notification`   | `notify_payment_received()`      | AFTER UPDATE                            | Notification paiement       |
| 7   | **⭐ `trigger_so_cancellation_rollback`** | **`rollback_so_forecasted()`**   | **AFTER UPDATE status→cancelled**       | **Rollback forecasted_out** |
| 8   | **⭐ `trigger_so_update_forecasted_out`** | **`update_so_forecasted_out()`** | **AFTER UPDATE status draft→validated** | **Augmente forecasted_out** |

### 6️⃣ TABLE `sales_order_items` (4 triggers)

| #   | Trigger                                            | Fonction                                     | Événement                  | Description                 |
| --- | -------------------------------------------------- | -------------------------------------------- | -------------------------- | --------------------------- |
| 1   | `recalculate_sales_order_totals_trigger`           | `recalculate_sales_order_totals()`           | AFTER INSERT/UPDATE/DELETE | Calcul totaux SO            |
| 2   | `sales_order_items_updated_at`                     | `update_updated_at()`                        | BEFORE UPDATE              | Timestamp                   |
| 3   | `trg_calculate_retrocession`                       | `calculate_retrocession_amount()`            | BEFORE INSERT/UPDATE       | Calcul rétrocession         |
| 4   | `trigger_handle_so_item_quantity_change_confirmed` | `handle_so_item_quantity_change_confirmed()` | AFTER UPDATE quantity      | Gestion changement quantité |

### 7️⃣ TABLE `sales_order_shipments` (1 trigger)

| #   | Trigger                                | Fonction                         | Événement        | Description                        |
| --- | -------------------------------------- | -------------------------------- | ---------------- | ---------------------------------- |
| 1   | **⭐ `trigger_shipment_update_stock`** | **`update_stock_on_shipment()`** | **AFTER INSERT** | **Stock real -, forecasted_out -** |

### 8️⃣ TABLE `stock_alert_tracking` (2 triggers)

| #   | Trigger                                             | Fonction                               | Événement                         | Description                    |
| --- | --------------------------------------------------- | -------------------------------------- | --------------------------------- | ------------------------------ |
| 1   | `trigger_create_notification_on_stock_alert_insert` | `create_notification_on_stock_alert()` | AFTER INSERT                      | Notification nouvelle alerte   |
| 2   | `trigger_create_notification_on_stock_alert_update` | `create_notification_on_stock_alert()` | AFTER UPDATE validated/stock_real | Notification changement alerte |

### 9️⃣ TABLE `stock_movements` (3 triggers)

| #   | Trigger                      | Fonction                           | Événement                  | Description            |
| --- | ---------------------------- | ---------------------------------- | -------------------------- | ---------------------- |
| 1   | `audit_stock_movements`      | `audit_trigger_function()`         | AFTER INSERT/UPDATE/DELETE | Audit trail            |
| 2   | `stock_movements_updated_at` | `update_updated_at()`              | BEFORE UPDATE              | Timestamp              |
| 3   | `trg_update_stock_alert`     | `update_stock_alert_on_movement()` | AFTER INSERT/UPDATE/DELETE | ⚠️ Trigger redondant ? |

---

## ❌ SECTION B : CE QUI MANQUE (Problèmes Identifiés)

### Problème 1 : ❌ AUCUN MOUVEMENT STOCK CRÉÉ AUTOMATIQUEMENT

**Constat** :

- ✅ Table `stock_movements` existe (25 colonnes)
- ✅ Triggers `update_stock_on_reception()` et `update_stock_on_shipment()` modifient `products.stock_real`
- ❌ **MAIS** ces triggers ne créent PAS de ligne dans `stock_movements` pour traçabilité

**Impact** :

- Aucun historique des mouvements physiques de stock
- Impossible de tracer qui a reçu/expédié quoi et quand
- Table `stock_movements` vide malgré réceptions/expéditions

**Code actuel `update_stock_on_reception()`** :

```sql
-- Ligne 248-252 migration 20251120163000
UPDATE products
SET
    stock_real = stock_real + NEW.quantity_received,
    stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
WHERE id = NEW.product_id;

-- ❌ MANQUE : INSERT INTO stock_movements ici
```

**Code actuel `update_stock_on_shipment()`** :

```sql
-- Ligne 381-385 migration 20251120163000
UPDATE products
SET
    stock_real = stock_real - NEW.quantity_shipped,
    stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
WHERE id = NEW.product_id;

-- ❌ MANQUE : INSERT INTO stock_movements ici
```

### Problème 2 : ❌ ALERTES NE DEVIENNENT PAS VERTES VISUELLEMENT

**Constat** :

- ✅ Database : `validated = true` set correctement (trigger `validate_stock_alerts_on_po`)
- ❌ Frontend : Badges restent ROUGES malgré `validated = true`

**Cause** : Page `apps/back-office/src/app/stocks/alertes/page.tsx` ne lit pas le champ `validated`

### Problème 3 : ❌ AUCUN ONGLET HISTORIQUE

**Constat** :

- Page `/stocks/alertes` affiche TOUTES les alertes (actives + résolues)
- Aucun moyen de filtrer "Alertes actives" vs "Historique"

### Problème 4 : ❌ MODAL DÉTAILS RÉCEPTION MANQUANT

**Constat** : Page `/stocks/receptions` n'a pas de modal historique réceptions par produit

---

## ✅ SECTION C : CE QUI FONCTIONNE

### Workflow Stock Prévisionnel ✅

1. **PO Validation** → `trigger_po_update_forecasted_in()` :

   ```sql
   UPDATE products
   SET stock_forecasted_in = stock_forecasted_in + v_item.quantity
   WHERE id = v_item.product_id;
   ```

2. **PO Réception** → `trigger_reception_update_stock()` :

   ```sql
   UPDATE products
   SET stock_real = stock_real + NEW.quantity_received,
       stock_forecasted_in = stock_forecasted_in - NEW.quantity_received
   WHERE id = NEW.product_id;
   ```

3. **Sync Alertes** → `trigger_sync_stock_alert_tracking_v4()` :

   ```sql
   v_previsionnel := NEW.stock_real + NEW.stock_forecasted_in - NEW.stock_forecasted_out;

   IF NEW.stock_real < NEW.min_stock THEN
       v_is_validated := v_previsionnel >= NEW.min_stock;
       -- INSERT/UPDATE alerte low_stock
   END IF;
   ```

4. **Validation Alertes** → `trigger_validate_stock_alerts_on_po()` :
   ```sql
   UPDATE stock_alert_tracking
   SET validated = true, validated_at = NOW()
   WHERE product_id = v_item.product_id;
   ```

### Workflow SO (Expéditions) ✅

1. **SO Validation** → `trigger_so_update_forecasted_out()` :

   ```sql
   UPDATE products
   SET stock_forecasted_out = stock_forecasted_out + v_item.quantity
   WHERE id = v_item.product_id;
   ```

2. **SO Expédition** → `trigger_shipment_update_stock()` :
   ```sql
   UPDATE products
   SET stock_real = stock_real - NEW.quantity_shipped,
       stock_forecasted_out = stock_forecasted_out - NEW.quantity_shipped
   WHERE id = NEW.product_id;
   ```

### Rollback Annulation ✅

1. **PO Annulation** → `trigger_po_cancellation_rollback()` :

   ```sql
   UPDATE products
   SET stock_forecasted_in = stock_forecasted_in - v_item.quantity
   WHERE id = v_item.product_id;
   ```

2. **SO Annulation** → `trigger_so_cancellation_rollback()` :
   ```sql
   UPDATE products
   SET stock_forecasted_out = stock_forecasted_out - v_item.quantity
   WHERE id = v_item.product_id;
   ```

---

## 📋 SECTION D : RÉSUMÉ EXÉCUTIF

### ✅ Triggers Fonctionnels (6/8 workflow stock)

1. ✅ Calcul stock prévisionnel (`trigger_sync_stock_alert_tracking_v4`)
2. ✅ PO validation → forecasted_in (`trigger_po_update_forecasted_in`)
3. ✅ PO réception → stock_real + (`trigger_reception_update_stock`)
4. ✅ PO annulation → rollback (`trigger_po_cancellation_rollback`)
5. ✅ SO validation → forecasted_out (`trigger_so_update_forecasted_out`)
6. ✅ SO expédition → stock_real - (`trigger_shipment_update_stock`)
7. ✅ SO annulation → rollback (`trigger_so_cancellation_rollback`)
8. ✅ Validation alertes GREEN (`trigger_validate_stock_alerts_on_po`)

### ❌ Triggers Manquants (2 critiques)

1. ❌ **CREATE stock_movement ON reception** (traçabilité)
2. ❌ **CREATE stock_movement ON shipment** (traçabilité)

### ❌ Frontend Incomplet (3 problèmes)

1. ❌ Badges alertes ne lisent pas `validated` (restent ROUGES)
2. ❌ Pas d'onglets Actives/Historique
3. ❌ Modal détails réception manquant (page `/stocks/receptions`)

---

## 🔧 PROCHAINES ACTIONS RECOMMANDÉES

1. **Créer migration** `20251123_001_add_stock_movements_traceability.sql`
2. **Corriger page alertes** : Badges GREEN/RED + Tabs Actives/Historique
3. **Vérifier modal réceptions** : Existe-t-il inline ? Si non, créer
4. **Tester workflow complet** avec MCP Playwright
5. **Demander autorisation commit**

---

**Généré le** : 2025-11-23
**Triggers analysés** : 48
**Tables auditées** : 9 (products, purchase_orders, purchase_order_items, purchase_order_receptions, sales_orders, sales_order_items, sales_order_shipments, stock_alert_tracking, stock_movements)
