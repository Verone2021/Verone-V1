# Domaine : Stock

**Description :** Mouvements de stock, alertes, reservations, stockage affilies, facturation stockage.

**Tables (9) :** `stock_movements`, `stock_alert_tracking`, `stock_reservations`, `storage_allocations`, `storage_billing_events`, `storage_pricing_tiers`, `affiliate_storage_allocations`, `affiliate_storage_requests`, `affiliate_archive_requests`

---

### `stock_movements`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `id`                     | `uuid`        | NO       |
| `product_id`             | `uuid`        | NO       |
| `warehouse_id`           | `uuid`        | YES      |
| `movement_type`          | `enum`        | NO       |
| `quantity_change`        | `int`         | NO       |
| `quantity_before`        | `int`         | NO       |
| `quantity_after`         | `int`         | NO       |
| `reference_type`         | `text`        | YES      |
| `reference_id`           | `uuid`        | YES      |
| `affects_forecast`       | `bool`        | YES      |
| `forecast_type`          | `text`        | YES      |
| `purchase_order_item_id` | `uuid`        | YES      |
| `performed_by`           | `uuid`        | NO       |
| `performed_at`           | `timestamptz` | NO       |
| `created_at`             | `timestamptz` | NO       |

**Relations (FK) :**

- `channel_id` → `sales_channels.id`
- `performed_by` → `user_profiles.user_id`
- `product_id` → `products.id`
- `purchase_order_item_id` → `purchase_order_items.id`

**RLS policies :**

- `users_own_stock_movements` (ALL)
- `backoffice_full_access_stock_movements` (ALL)
- `system_triggers_can_insert_stock_movements` (INSERT)
- `stock_movements_select_authenticated` (SELECT)
- `stock_movements_update_authenticated` (UPDATE)

**Triggers :**

- `audit_stock_movements` (AFTER INSERT)
- `stock_movements_updated_at` (BEFORE UPDATE)
- `trg_reverse_stock_on_movement_delete` (BEFORE DELETE)
- `trg_sync_product_stock_after_movement` (AFTER INSERT)
- `trg_update_stock_alert` (AFTER UPDATE)

---

### `stock_alert_tracking`

| Colonne                | Type          | Nullable |
| ---------------------- | ------------- | -------- |
| `id`                   | `uuid`        | NO       |
| `product_id`           | `uuid`        | NO       |
| `supplier_id`          | `uuid`        | NO       |
| `alert_type`           | `text`        | NO       |
| `alert_priority`       | `int`         | NO       |
| `stock_real`           | `int`         | NO       |
| `stock_forecasted_out` | `int`         | NO       |
| `stock_forecasted_in`  | `int`         | NO       |
| `min_stock`            | `int`         | NO       |
| `shortage_quantity`    | `int`         | NO       |
| `validated`            | `bool`        | NO       |
| `draft_order_id`       | `uuid`        | YES      |
| `created_at`           | `timestamptz` | NO       |
| `updated_at`           | `timestamptz` | NO       |

**Relations (FK) :**

- `draft_order_id` → `purchase_orders.id`
- `product_id` → `products.id`
- `supplier_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_stock_alert_tracking` (ALL)
- `stock_alert_tracking_delete_policy` (DELETE)
- `stock_alert_tracking_insert_policy` (INSERT)
- `stock_alert_tracking_select_policy` (SELECT)
- `stock_alert_tracking_update_policy` (UPDATE)

**Triggers :**

- `trigger_create_notification_on_stock_alert_insert` (AFTER INSERT)
- `trigger_create_notification_on_stock_alert_update` (AFTER UPDATE)

---

### `stock_reservations`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `product_id`        | `uuid`        | NO       |
| `reserved_quantity` | `int`         | NO       |
| `reference_type`    | `text`        | NO       |
| `reference_id`      | `uuid`        | NO       |
| `reserved_by`       | `uuid`        | NO       |
| `reserved_at`       | `timestamptz` | NO       |
| `expires_at`        | `timestamptz` | YES      |
| `released_at`       | `timestamptz` | YES      |
| `created_at`        | `timestamptz` | NO       |

**Relations (FK) :**

- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_stock_reservations` (ALL)
- `stock_reservations_delete_authenticated` (DELETE)
- `stock_reservations_insert_authenticated` (INSERT)
- `stock_reservations_select_authenticated` (SELECT)
- `stock_reservations_update_authenticated` (UPDATE)

**Triggers :**

- `stock_reservations_updated_at` (BEFORE UPDATE)

---

### `storage_allocations`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `product_id`            | `uuid`        | NO       |
| `owner_enseigne_id`     | `uuid`        | YES      |
| `owner_organisation_id` | `uuid`        | YES      |
| `stock_quantity`        | `int`         | NO       |
| `billable_in_storage`   | `bool`        | NO       |
| `allocated_at`          | `timestamptz` | NO       |
| `storage_start_date`    | `date`        | YES      |
| `is_visible`            | `bool`        | NO       |
| `updated_at`            | `timestamptz` | NO       |

**Relations (FK) :**

- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_storage_allocations` (ALL)

**Triggers :**

- `trg_storage_allocation_updated_at` (BEFORE UPDATE)
- `trg_storage_billing_event` (AFTER DELETE)

---

### `storage_billing_events`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `owner_enseigne_id`     | `uuid`        | YES      |
| `owner_organisation_id` | `uuid`        | YES      |
| `product_id`            | `uuid`        | NO       |
| `qty_change`            | `int`         | NO       |
| `volume_m3_change`      | `numeric`     | NO       |
| `billable`              | `bool`        | NO       |
| `happened_at`           | `timestamptz` | NO       |
| `source`                | `text`        | NO       |
| `reference_id`          | `uuid`        | YES      |
| `created_at`            | `timestamptz` | NO       |

**Relations (FK) :**

- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_storage_billing_events` (ALL)
- `Admin view all storage events` (SELECT)
- `LinkMe view own enseigne events` (SELECT)

---

### `storage_pricing_tiers`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `min_volume_m3` | `numeric`     | NO       |
| `max_volume_m3` | `numeric`     | YES      |
| `price_per_m3`  | `numeric`     | NO       |
| `label`         | `varchar`     | YES      |
| `is_active`     | `bool`        | YES      |
| `created_at`    | `timestamptz` | YES      |

**RLS policies :**

- `staff_manage_storage_pricing` (ALL)
- `storage_pricing_select` (SELECT)

**Triggers :**

- `trigger_storage_pricing_updated_at` (BEFORE UPDATE)

---

### `affiliate_storage_allocations`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `product_id`            | `uuid`        | NO       |
| `owner_enseigne_id`     | `uuid`        | YES      |
| `owner_organisation_id` | `uuid`        | YES      |
| `stock_quantity`        | `int`         | NO       |
| `billable_in_storage`   | `bool`        | NO       |
| `allocated_at`          | `timestamptz` | NO       |
| `updated_at`            | `timestamptz` | NO       |

**Relations (FK) :**

- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_affiliate_storage_allocations` (ALL)
- `Admin manage storage` (ALL)
- `Affiliate view own storage` (SELECT)
- `Affiliate manage own storage` (INSERT)

**Triggers :**

- `trg_storage_allocation_updated_at` (BEFORE UPDATE)
- `trg_storage_billing_event` (AFTER INSERT)

---

### `affiliate_storage_requests`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `product_id`            | `uuid`        | NO       |
| `affiliate_id`          | `uuid`        | NO       |
| `owner_enseigne_id`     | `uuid`        | YES      |
| `owner_organisation_id` | `uuid`        | YES      |
| `quantity`              | `int`         | NO       |
| `status`                | `text`        | NO       |
| `reception_id`          | `uuid`        | YES      |
| `created_at`            | `timestamptz` | NO       |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`
- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `product_id` → `products.id`
- `reception_id` → `purchase_order_receptions.id`

**RLS policies :**

- `staff_full_access` (ALL)
- `affiliate_insert_own` (INSERT)
- `affiliate_read_own` (SELECT)
- `affiliate_update_own` (UPDATE)

**Triggers :**

- `trg_notify_storage_request_approved` (AFTER UPDATE)
- `trg_notify_storage_request_rejected` (AFTER UPDATE)
- `trigger_storage_request_updated_at` (BEFORE UPDATE)

---

### `affiliate_archive_requests`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `organisation_id` | `uuid`        | NO       |
| `affiliate_id`    | `uuid`        | NO       |
| `action`          | `text`        | NO       |
| `status`          | `text`        | NO       |
| `created_at`      | `timestamptz` | NO       |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `Back-office full access on affiliate_archive_requests` (ALL)

---
