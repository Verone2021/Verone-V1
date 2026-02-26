# Triggers & Stock Reference

**Last consolidated**: 2026-02-26
**Sources**: Audits 2025-11-12, 2025-11-23, 2025-11-25, 2025-11-28
**Total triggers audited**: 48 (across 9 tables)

---

## Stock Workflow Overview

```
PO validated  --> forecasted_in +    (trigger_po_update_forecasted_in)
PO received   --> stock_real +, forecasted_in -  (trigger_reception_update_stock)
PO cancelled  --> forecasted_in -    (trigger_po_cancellation_rollback)

SO validated  --> forecasted_out +   (trigger_so_update_forecasted_out)
SO shipped    --> stock_real -, forecasted_out -  (trigger_shipment_update_stock)
SO cancelled  --> forecasted_out -   (trigger_so_cancellation_rollback)

Stock change  --> alert check        (trigger_sync_stock_alert_tracking_v4)
PO validated  --> alert validated    (trigger_validate_stock_alerts_on_po)
```

**Forecasted stock formula**: `stock_real + forecasted_in - forecasted_out`

---

## 1. Stock Domain Triggers

### Table: `products` (11 triggers)

| Trigger                                           | Function                                | Event                      | Status      | Description                                                      |
| ------------------------------------------------- | --------------------------------------- | -------------------------- | ----------- | ---------------------------------------------------------------- |
| `products_updated_at`                             | `update_updated_at()`                   | BEFORE UPDATE              | ENABLED     | Timestamp auto-update                                            |
| `trg_generate_product_slug_on_insert`             | `trigger_generate_product_slug()`       | BEFORE INSERT              | ENABLED     | SEO slug generation                                              |
| `trg_update_variant_group_count`                  | `update_variant_group_product_count()`  | AFTER INSERT/UPDATE/DELETE | ENABLED     | Variant group counter                                            |
| `trigger_calculate_completion`                    | `calculate_product_completion_status()` | BEFORE INSERT/UPDATE       | ENABLED     | Product sheet completion %                                       |
| `trigger_log_sample_requirement_changes_products` | `log_sample_requirement_changes()`      | AFTER UPDATE               | ENABLED     | Sample requirement logging                                       |
| `trigger_products_search_vector_update`           | `products_search_vector_update()`       | BEFORE INSERT/UPDATE       | ENABLED     | Full-text search vector                                          |
| `trigger_set_product_sku`                         | `trigger_generate_product_sku()`        | BEFORE INSERT              | ENABLED     | SKU auto-generation                                              |
| `trigger_sync_item_group_id`                      | `sync_item_group_id()`                  | BEFORE INSERT/UPDATE       | ENABLED     | Variant group sync                                               |
| **`trigger_sync_stock_alert_tracking_v4`**        | **`sync_stock_alert_tracking_v4()`**    | **AFTER INSERT/UPDATE**    | **ENABLED** | **Core: creates/updates stock alerts based on forecasted stock** |
| `trigger_sync_suitable_rooms_on_product`          | `sync_variant_group_suitable_rooms()`   | AFTER INSERT/UPDATE        | ENABLED     | Suitable rooms sync                                              |
| `trigger_validate_custom_product_assignment`      | `validate_custom_product_assignment()`  | BEFORE INSERT/UPDATE       | ENABLED     | Custom product validation                                        |

### Table: `stock_alert_tracking` (2 triggers)

| Trigger                                             | Function                               | Event        | Status   | Description                                       |
| --------------------------------------------------- | -------------------------------------- | ------------ | -------- | ------------------------------------------------- |
| `trigger_create_notification_on_stock_alert_insert` | `create_notification_on_stock_alert()` | AFTER INSERT | ENABLED  | Notification on new alert                         |
| `trigger_create_notification_on_stock_alert_update` | `create_notification_on_stock_alert()` | AFTER UPDATE | DISABLED | Kept disabled: too noisy, INSERT trigger suffices |

### Table: `stock_movements` (3 triggers)

| Trigger                      | Function                           | Event                      | Status  | Description                                 |
| ---------------------------- | ---------------------------------- | -------------------------- | ------- | ------------------------------------------- |
| `audit_stock_movements`      | `audit_trigger_function()`         | AFTER INSERT/UPDATE/DELETE | ENABLED | Audit trail                                 |
| `stock_movements_updated_at` | `update_updated_at()`              | BEFORE UPDATE              | ENABLED | Timestamp                                   |
| `trg_update_stock_alert`     | `update_stock_alert_on_movement()` | AFTER INSERT/UPDATE/DELETE | ENABLED | Potentially redundant with v4 alert trigger |

---

## 2. Purchase Orders Domain Triggers

### Table: `purchase_orders` (9 triggers)

| Trigger                                    | Function                              | Event                               | Status      | Description                                                        |
| ------------------------------------------ | ------------------------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------ |
| `audit_purchase_orders`                    | `audit_trigger_function()`            | AFTER INSERT/UPDATE/DELETE          | ENABLED     | Audit trail                                                        |
| `purchase_orders_updated_at`               | `update_updated_at()`                 | BEFORE UPDATE                       | ENABLED     | Timestamp                                                          |
| **`trigger_po_update_forecasted_in`**      | **`update_po_forecasted_in()`**       | **AFTER UPDATE (draft->validated)** | **ENABLED** | **Increases forecasted_in on validation**                          |
| **`trigger_po_cancellation_rollback`**     | **`rollback_po_forecasted()`**        | **AFTER UPDATE (->cancelled)**      | **DELETED** | **Removed: triple redundancy with other PO cancellation triggers** |
| **`trigger_validate_stock_alerts_on_po`**  | **`validate_stock_alerts_on_po()`**   | **AFTER UPDATE (draft->validated)** | **ENABLED** | **Marks alerts as validated=true**                                 |
| `trigger_handle_po_deletion`               | `handle_po_deletion()`                | --                                  | ENABLED     | Rollback stock + alerts if PO deleted (reactivated 2025-11-28)     |
| `trigger_po_created_notification`          | `notify_po_created()`                 | AFTER INSERT                        | DISABLED    | Kept disabled: too noisy                                           |
| `trigger_po_delayed_notification`          | `notify_po_delayed()`                 | AFTER UPDATE                        | ENABLED     | Notification: PO delayed                                           |
| `trigger_po_received_notification`         | `notify_po_received()`                | AFTER UPDATE                        | ENABLED     | Notification: full reception                                       |
| `trigger_po_partial_received_notification` | `notify_po_partial_received()`        | AFTER UPDATE                        | ENABLED     | Notification: partial reception                                    |
| `trigger_purchase_orders_updated_at`       | `update_purchase_orders_updated_at()` | BEFORE UPDATE                       | DELETED     | Removed: duplicate of `purchase_orders_updated_at`                 |
| `purchase_order_status_change_trigger`     | --                                    | --                                  | DELETED     | Removed: duplicate of `trg_po_validation_forecasted_stock`         |

### Table: `purchase_order_items` (8 triggers)

| Trigger                                            | Function                                     | Event                                   | Status      | Description                                                  |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------------- | ----------- | ------------------------------------------------------------ |
| `purchase_order_items_updated_at`                  | `update_updated_at()`                        | BEFORE UPDATE                           | ENABLED     | Timestamp                                                    |
| `recalculate_purchase_order_totals_trigger`        | `recalculate_purchase_order_totals()`        | AFTER INSERT/UPDATE/DELETE              | ENABLED     | PO totals recalculation                                      |
| `trigger_check_sample_archive`                     | `check_sample_archive_allowed()`             | BEFORE UPDATE (archived_at)             | ENABLED     | Sample archiving validation                                  |
| `trigger_handle_po_item_quantity_change_confirmed` | `handle_po_item_quantity_change_confirmed()` | AFTER UPDATE (quantity)                 | ENABLED     | Adjusts forecasted_in on qty change                          |
| `trigger_track_product_added_to_draft`             | `track_product_added_to_draft()`             | AFTER INSERT                            | ENABLED     | UI tracking: product added to draft                          |
| `trigger_track_product_quantity_updated_in_draft`  | `track_product_quantity_updated_in_draft()`  | AFTER UPDATE (quantity)                 | ENABLED     | UI tracking: qty updated in draft                            |
| `trigger_track_product_removed_from_draft`         | `track_product_removed_from_draft()`         | AFTER DELETE                            | ENABLED     | UI tracking: product removed from draft                      |
| **`trigger_update_cost_price_from_po`**            | **`update_product_cost_price_from_po()`**    | **AFTER INSERT/UPDATE (unit_price_ht)** | **ENABLED** | **Updates product cost_price (LPP). Reactivated 2025-11-28** |

### Table: `purchase_order_receptions` (1 trigger)

| Trigger                              | Function                          | Event            | Status      | Description                       |
| ------------------------------------ | --------------------------------- | ---------------- | ----------- | --------------------------------- |
| **`trigger_reception_update_stock`** | **`update_stock_on_reception()`** | **AFTER INSERT** | **ENABLED** | **stock_real +, forecasted_in -** |

---

## 3. Sales Orders Domain Triggers

### Table: `sales_orders` (8 triggers)

| Trigger                                 | Function                         | Event                               | Status      | Description                                          |
| --------------------------------------- | -------------------------------- | ----------------------------------- | ----------- | ---------------------------------------------------- |
| `audit_sales_orders`                    | `audit_trigger_function()`       | AFTER INSERT/UPDATE/DELETE          | ENABLED     | Audit trail                                          |
| `sales_orders_updated_at`               | `update_updated_at()`            | BEFORE UPDATE                       | ENABLED     | Timestamp                                            |
| **`trigger_so_update_forecasted_out`**  | **`update_so_forecasted_out()`** | **AFTER UPDATE (draft->validated)** | **ENABLED** | **Increases forecasted_out on validation**           |
| **`trigger_so_cancellation_rollback`**  | **`rollback_so_forecasted()`**   | **AFTER UPDATE (->cancelled)**      | **ENABLED** | **Rollback forecasted_out**                          |
| `sales_order_shipment_trigger`          | `handle_sales_order_shipment()`  | --                                  | ENABLED     | Creates stock OUT movements (reactivated 2025-11-28) |
| `trigger_order_confirmed_notification`  | `notify_order_confirmed()`       | AFTER UPDATE                        | ENABLED     | Notification: order confirmed                        |
| `trigger_order_shipped_notification`    | `notify_order_shipped()`         | AFTER UPDATE                        | ENABLED     | Notification: order shipped                          |
| `trigger_order_cancelled_notification`  | `notify_order_cancelled()`       | AFTER UPDATE                        | ENABLED     | Notification: order cancelled                        |
| `trigger_payment_received_notification` | `notify_payment_received()`      | AFTER UPDATE                        | ENABLED     | Notification: payment received                       |

### Table: `sales_order_items` (4 triggers)

| Trigger                                                | Function                                         | Event                       | Status      | Description                                                      |
| ------------------------------------------------------ | ------------------------------------------------ | --------------------------- | ----------- | ---------------------------------------------------------------- |
| `recalculate_sales_order_totals_trigger`               | `recalculate_sales_order_totals()`               | AFTER INSERT/UPDATE/DELETE  | ENABLED     | SO totals recalculation                                          |
| `sales_order_items_updated_at`                         | `update_updated_at()`                            | BEFORE UPDATE               | ENABLED     | Timestamp                                                        |
| `trg_calculate_retrocession`                           | `calculate_retrocession_amount()`                | BEFORE INSERT/UPDATE        | ENABLED     | Retrocession calculation                                         |
| **`trigger_handle_so_item_quantity_change_confirmed`** | **`handle_so_item_quantity_change_confirmed()`** | **AFTER UPDATE (quantity)** | **ENABLED** | **Adjusts forecasted_out on qty change. Reactivated 2025-11-28** |

### Table: `sales_order_shipments` (1 trigger)

| Trigger                             | Function                         | Event            | Status      | Description                        |
| ----------------------------------- | -------------------------------- | ---------------- | ----------- | ---------------------------------- |
| **`trigger_shipment_update_stock`** | **`update_stock_on_shipment()`** | **AFTER INSERT** | **ENABLED** | **stock_real -, forecasted_out -** |

---

## 4. Notification Principle (ERP Best Practice)

Based on Odoo/SAP patterns:

| Level     | Icon   | Meaning                   | Appears in bell  | Examples                          |
| --------- | ------ | ------------------------- | ---------------- | --------------------------------- |
| Urgent    | RED    | Immediate action required | YES              | New stock alert, PO delayed       |
| Important | ORANGE | Key business info         | YES              | PO received, PO partial reception |
| Info      | BLUE   | Traceability only         | NO (audit trail) | PO created, alert updated         |

**Rule**: "Too many notifications kill the information" (Odoo). Only Urgent and Important go to the notification bell.

---

## 5. Key Decisions Log

### Triggers Reactivated (2025-11-28)

| Trigger                                            | Why reactivated                                        |
| -------------------------------------------------- | ------------------------------------------------------ |
| `trigger_update_cost_price_from_po`                | Critical: auto-updates product cost_price from PO      |
| `trigger_handle_po_deletion`                       | Critical: rollback stock + alerts when PO deleted      |
| `trigger_handle_so_item_quantity_change_confirmed` | Critical: adjusts forecasted_out on SO item qty change |
| `sales_order_shipment_trigger`                     | Critical: creates stock OUT movements on shipment      |

### Triggers Deleted (2025-11-27/28)

| Trigger                                | Why deleted                                           |
| -------------------------------------- | ----------------------------------------------------- |
| `purchase_order_status_change_trigger` | Duplicate of `trg_po_validation_forecasted_stock`     |
| `trigger_po_cancellation_rollback`     | Triple redundancy with other PO cancellation handling |
| `trigger_purchase_orders_updated_at`   | Duplicate of `purchase_orders_updated_at`             |

### Triggers Kept Disabled

| Trigger                                             | Why disabled                     |
| --------------------------------------------------- | -------------------------------- |
| `trigger_po_created_notification`                   | Too noisy, not business-critical |
| `trigger_create_notification_on_stock_alert_update` | INSERT trigger is sufficient     |

---

## 6. Known Gaps (from audits)

1. **No stock_movements traceability on reception/shipment**: `update_stock_on_reception()` and `update_stock_on_shipment()` update `products.stock_real` but do NOT insert rows into `stock_movements` table.
2. **`trg_update_stock_alert` on stock_movements**: Potentially redundant with `trigger_sync_stock_alert_tracking_v4` on products. Needs investigation.

---

## 7. Tables Covered

| Table                       | Trigger Count  | Domain          |
| --------------------------- | -------------- | --------------- |
| `products`                  | 11             | Stock / Product |
| `purchase_orders`           | 9 (2 deleted)  | Purchase Orders |
| `purchase_order_items`      | 8              | Purchase Orders |
| `purchase_order_receptions` | 1              | Purchase Orders |
| `sales_orders`              | 8              | Sales Orders    |
| `sales_order_items`         | 4              | Sales Orders    |
| `sales_order_shipments`     | 1              | Sales Orders    |
| `stock_alert_tracking`      | 2 (1 disabled) | Stock Alerts    |
| `stock_movements`           | 3              | Stock Movements |
