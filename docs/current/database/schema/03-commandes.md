# Domaine : Commandes

**Description :** Commandes clients (SO), fournisseurs (PO), expeditions, receptions, consultations, paniers.

**Tables (17) :** `sales_orders`, `sales_order_items`, `sales_order_events`, `sales_order_shipments`, `sales_order_linkme_details`, `purchase_orders`, `purchase_order_items`, `purchase_order_receptions`, `order_discounts`, `order_payments`, `sample_orders`, `sample_order_items`, `shopping_carts`, `client_consultations`, `consultation_emails`, `consultation_images`, `consultation_products`

---

### `sales_orders`

| Colonne                   | Type          | Nullable |
| ------------------------- | ------------- | -------- |
| `id`                      | `uuid`        | NO       |
| `order_number`            | `varchar`     | NO       |
| `customer_id`             | `uuid`        | YES      |
| `status`                  | `enum`        | NO       |
| `customer_type`           | `text`        | NO       |
| `currency`                | `varchar`     | NO       |
| `total_ht`                | `numeric`     | NO       |
| `total_ttc`               | `numeric`     | NO       |
| `shipping_cost_ht`        | `numeric`     | YES      |
| `payment_status_v2`       | `varchar`     | YES      |
| `linkme_selection_id`     | `uuid`        | YES      |
| `created_by_affiliate_id` | `uuid`        | YES      |
| `channel_id`              | `uuid`        | YES      |
| `individual_customer_id`  | `uuid`        | YES      |
| `consultation_id`         | `uuid`        | YES      |
| `created_by`              | `uuid`        | YES      |
| `created_at`              | `timestamptz` | NO       |
| `updated_at`              | `timestamptz` | NO       |

**Relations (FK) :**

- `billing_contact_id` → `contacts.id`
- `channel_id` → `sales_channels.id`
- `consultation_id` → `client_consultations.id`
- `created_by_affiliate_id` → `linkme_affiliates.id`
- `customer_id` → `organisations.id`
- `delivery_contact_id` → `contacts.id`
- `individual_customer_id` → `individual_customers.id`
- `linkme_selection_id` → `linkme_selections.id`
- `responsable_contact_id` → `contacts.id`

**RLS policies :**

- `staff_delete_sales_orders` (DELETE)
- `LinkMe users can create sales_orders` (INSERT)
- `Public can create sales_orders` (INSERT)
- `staff_create_sales_orders` (INSERT)
- `public_read_sales_orders` (SELECT)
- `staff_select_sales_orders` (SELECT)
- `staff_update_sales_orders` (UPDATE)

**Triggers :**

- `audit_sales_orders` (AFTER INSERT)
- `sales_order_status_change_trigger` (AFTER UPDATE)
- `sales_orders_updated_at` (BEFORE UPDATE)
- `trg_assign_linkme_display_number` (BEFORE INSERT)
- `trg_create_linkme_commission` (AFTER UPDATE)
- `trg_lock_prices_on_validation` (AFTER UPDATE)
- `trg_so_devalidation_forecasted_stock` (AFTER UPDATE)
- `trigger_order_cancelled_notification` (AFTER UPDATE)
- `trigger_order_confirmed_notification` (AFTER UPDATE)
- `trigger_order_shipped_notification` (AFTER UPDATE)
- `trigger_prevent_so_direct_cancellation` (BEFORE UPDATE)
- `trigger_so_cancellation_rollback` (AFTER UPDATE)
- `trigger_so_update_forecasted_out` (AFTER UPDATE)

---

### `sales_order_items`

| Colonne                    | Type          | Nullable |
| -------------------------- | ------------- | -------- |
| `id`                       | `uuid`        | NO       |
| `sales_order_id`           | `uuid`        | NO       |
| `product_id`               | `uuid`        | NO       |
| `quantity`                 | `int`         | NO       |
| `unit_price_ht`            | `numeric`     | NO       |
| `discount_percentage`      | `numeric`     | NO       |
| `total_ht`                 | `numeric`     | YES      |
| `quantity_shipped`         | `int`         | NO       |
| `retrocession_rate`        | `numeric`     | YES      |
| `eco_tax`                  | `numeric`     | NO       |
| `linkme_selection_item_id` | `uuid`        | YES      |
| `created_at`               | `timestamptz` | NO       |

**Relations (FK) :**

- `linkme_selection_item_id` → `linkme_selection_items.id`
- `product_id` → `products.id`
- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `linkme_users_delete_own_order_items` (DELETE)
- `staff_delete_sales_order_items` (DELETE)
- `Public can create sales_order_items` (INSERT)
- `staff_create_sales_order_items` (INSERT)
- `public_read_sales_order_items` (SELECT)
- `staff_update_sales_order_items` (UPDATE)

**Triggers :**

- `recalculate_sales_order_totals_trigger` (AFTER UPDATE)
- `sales_order_items_updated_at` (BEFORE UPDATE)
- `trg_backfill_order_affiliate` (AFTER INSERT)
- `trg_calculate_retrocession` (BEFORE INSERT)
- `trg_update_affiliate_totals` (AFTER INSERT)
- `trigger_handle_so_item_quantity_change_confirmed` (AFTER UPDATE)

---

### `sales_order_events`

| Colonne          | Type          | Nullable |
| ---------------- | ------------- | -------- |
| `id`             | `uuid`        | NO       |
| `sales_order_id` | `uuid`        | NO       |
| `event_type`     | `text`        | NO       |
| `metadata`       | `jsonb`       | YES      |
| `created_by`     | `uuid`        | YES      |
| `created_at`     | `timestamptz` | NO       |

**Relations (FK) :**

- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `staff_full_access` (ALL)
- `anon_insert_confirmation_events` (INSERT)

**Triggers :**

- `trigger_notify_sales_order_event` (AFTER INSERT)

---

### `sales_order_shipments`

| Colonne                | Type          | Nullable |
| ---------------------- | ------------- | -------- |
| `id`                   | `uuid`        | NO       |
| `sales_order_id`       | `uuid`        | NO       |
| `product_id`           | `uuid`        | NO       |
| `quantity_shipped`     | `int`         | NO       |
| `shipped_at`           | `timestamptz` | NO       |
| `tracking_number`      | `text`        | YES      |
| `packlink_shipment_id` | `text`        | YES      |
| `packlink_status`      | `text`        | YES      |
| `created_at`           | `timestamptz` | YES      |

**Relations (FK) :**

- `product_id` → `products.id`
- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `backoffice_full_access_sales_order_shipments` (ALL)

**Triggers :**

- `trigger_notify_shipment_created` (AFTER INSERT)
- `trigger_packlink_confirm_stock` (AFTER UPDATE)
- `trigger_shipment_update_stock` (AFTER INSERT)

---

### `sales_order_linkme_details`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `id`                     | `uuid`        | NO       |
| `sales_order_id`         | `uuid`        | NO       |
| `requester_name`         | `text`        | NO       |
| `requester_email`        | `text`        | NO       |
| `delivery_address`       | `text`        | YES      |
| `delivery_city`          | `text`        | YES      |
| `step4_token`            | `uuid`        | YES      |
| `ignored_missing_fields` | `jsonb`       | NO       |
| `created_at`             | `timestamptz` | YES      |

**Relations (FK) :**

- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `staff_can_insert_linkme_details` (INSERT)
- `affiliates_can_insert_own_linkme_details` (INSERT)
- `affiliates_select_own_order_linkme_details` (SELECT)
- `staff_select_linkme_details` (SELECT)
- `affiliates_update_own_linkme_details` (UPDATE)
- `staff_update_linkme_details` (UPDATE)

**Triggers :**

- `set_updated_at_sales_order_linkme_details` (BEFORE UPDATE)
- `trg_notify_linkme_step4_completed` (AFTER UPDATE)
- `trg_recalc_missing_fields` (BEFORE UPDATE)

---

### `purchase_orders`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `po_number`         | `varchar`     | NO       |
| `supplier_id`       | `uuid`        | NO       |
| `status`            | `enum`        | NO       |
| `currency`          | `varchar`     | NO       |
| `total_ht`          | `numeric`     | NO       |
| `total_ttc`         | `numeric`     | NO       |
| `shipping_cost_ht`  | `numeric`     | YES      |
| `payment_status_v2` | `varchar`     | YES      |
| `created_by`        | `uuid`        | NO       |
| `created_at`        | `timestamptz` | NO       |
| `updated_at`        | `timestamptz` | NO       |

**Relations (FK) :**

- `supplier_id` → `organisations.id`

**RLS policies :**

- `staff_manage_purchase_orders` (ALL)
- `Utilisateurs peuvent supprimer leurs commandes fournisseurs` (DELETE)
- `Utilisateurs peuvent voir leurs commandes fournisseurs` (SELECT)
- `Utilisateurs peuvent creer des commandes fournisseurs` (INSERT)

**Triggers :**

- `audit_purchase_orders` (AFTER DELETE)
- `purchase_orders_updated_at` (BEFORE UPDATE)
- `trg_po_validation_forecasted_stock` (AFTER UPDATE)
- `trg_stock_alert_tracking_rollback_on_po_cancel` (AFTER UPDATE)
- `trg_update_pmp_on_po_received` (AFTER UPDATE)
- `trigger_handle_po_deletion` (BEFORE DELETE)
- `trigger_po_created_notification` (AFTER INSERT)
- `trigger_prevent_po_direct_cancellation` (BEFORE UPDATE)
- `trigger_rollback_validated_to_draft` (AFTER UPDATE)
- `trigger_validate_stock_alerts_on_po` (AFTER UPDATE)
- `trigger_reset_alerts_on_po_cancel` (AFTER UPDATE)

---

### `purchase_order_items`

| Colonne               | Type          | Nullable |
| --------------------- | ------------- | -------- |
| `id`                  | `uuid`        | NO       |
| `purchase_order_id`   | `uuid`        | NO       |
| `product_id`          | `uuid`        | NO       |
| `quantity`            | `int`         | NO       |
| `unit_price_ht`       | `numeric`     | NO       |
| `discount_percentage` | `numeric`     | NO       |
| `total_ht`            | `numeric`     | YES      |
| `quantity_received`   | `int`         | NO       |
| `eco_tax`             | `numeric`     | NO       |
| `unit_cost_net`       | `numeric`     | YES      |
| `created_at`          | `timestamptz` | NO       |

**Relations (FK) :**

- `customer_individual_id` → `individual_customers.id`
- `customer_organisation_id` → `organisations.id`
- `product_id` → `products.id`
- `purchase_order_id` → `purchase_orders.id`

**RLS policies :**

- `staff_manage_purchase_order_items` (ALL)
- `Utilisateurs peuvent voir les items de leurs commandes fourniss` (SELECT)

**Triggers :**

- `purchase_order_items_updated_at` (BEFORE UPDATE)
- `recalculate_purchase_order_totals_trigger` (AFTER UPDATE)
- `trig_recalc_po_totals` (AFTER DELETE)
- `trigger_allocate_po_fees` (BEFORE INSERT)
- `trigger_handle_po_item_quantity_change_confirmed` (AFTER UPDATE)
- `trigger_track_product_added_to_draft` (AFTER INSERT)
- `trigger_update_cost_price_pmp` (AFTER UPDATE)

---

### `purchase_order_receptions`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `purchase_order_id` | `uuid`        | YES      |
| `product_id`        | `uuid`        | NO       |
| `quantity_received` | `int`         | NO       |
| `received_at`       | `timestamptz` | NO       |
| `status`            | `text`        | YES      |
| `affiliate_id`      | `uuid`        | YES      |
| `created_at`        | `timestamptz` | YES      |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`
- `product_id` → `products.id`
- `purchase_order_id` → `purchase_orders.id`

**RLS policies :**

- `backoffice_full_access_purchase_order_receptions` (ALL)
- `Users can view all purchase receptions` (SELECT)

**Triggers :**

- `reception_validation_trigger` (AFTER UPDATE)
- `trigger_before_delete_reception` (BEFORE DELETE)
- `trigger_reception_update_stock` (AFTER INSERT)
- `trigger_stock_on_affiliate_reception` (BEFORE UPDATE)

---

### `order_discounts`

| Colonne          | Type          | Nullable |
| ---------------- | ------------- | -------- |
| `id`             | `uuid`        | NO       |
| `code`           | `varchar`     | NO       |
| `name`           | `varchar`     | NO       |
| `description`    | `text`        | YES      |
| `discount_type`  | `varchar`     | NO       |
| `discount_value` | `numeric`     | NO       |
| `valid_from`     | `date`        | NO       |
| `valid_until`    | `date`        | NO       |
| `is_active`      | `bool`        | YES      |
| `created_at`     | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_order_discounts` (ALL)
- `order_discounts_select_authenticated` (SELECT)

**Triggers :**

- `order_discounts_updated_at` (BEFORE UPDATE)

---

### `order_payments`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `sales_order_id`    | `uuid`        | YES      |
| `purchase_order_id` | `uuid`        | YES      |
| `payment_type`      | `enum`        | NO       |
| `amount`            | `numeric`     | NO       |
| `payment_date`      | `timestamptz` | NO       |
| `reference`         | `text`        | YES      |
| `created_at`        | `timestamptz` | YES      |

**Relations (FK) :**

- `purchase_order_id` → `purchase_orders.id`
- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `staff_full_access` (ALL)

---

### `sample_orders`

| Colonne                | Type          | Nullable |
| ---------------------- | ------------- | -------- |
| `id`                   | `uuid`        | NO       |
| `order_number`         | `text`        | NO       |
| `supplier_id`          | `uuid`        | NO       |
| `status`               | `text`        | NO       |
| `total_estimated_cost` | `numeric`     | YES      |
| `created_by`           | `uuid`        | YES      |
| `created_at`           | `timestamptz` | YES      |

**Relations (FK) :**

- `supplier_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_sample_orders` (ALL)

---

### `sample_order_items`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `sample_order_id`    | `uuid`        | NO       |
| `sample_description` | `text`        | NO       |
| `estimated_cost`     | `numeric`     | YES      |
| `quantity`           | `int`         | YES      |
| `item_status`        | `text`        | NO       |
| `created_at`         | `timestamptz` | YES      |

**Relations (FK) :**

- `sample_order_id` → `sample_orders.id`

**RLS policies :**

- `backoffice_full_access_sample_order_items` (ALL)

---

### `shopping_carts`

| Colonne          | Type          | Nullable |
| ---------------- | ------------- | -------- |
| `id`             | `uuid`        | NO       |
| `user_id`        | `uuid`        | YES      |
| `session_id`     | `text`        | YES      |
| `product_id`     | `uuid`        | NO       |
| `quantity`       | `int`         | NO       |
| `customer_email` | `text`        | YES      |
| `created_at`     | `timestamptz` | YES      |

**Relations (FK) :**

- `product_id` → `products.id`
- `variant_group_id` → `variant_groups.id`

**RLS policies :**

- `staff_full_access_shopping_carts` (ALL)
- `anon_cart_delete` (DELETE)
- `users_own_cart_delete` (DELETE)
- `anon_cart_insert` (INSERT)
- `users_own_cart_insert` (INSERT)
- `anon_cart_select` (SELECT)
- `users_own_cart_select` (SELECT)
- `anon_cart_update` (UPDATE)
- `users_own_cart_update` (UPDATE)

**Triggers :**

- `shopping_carts_updated_at` (BEFORE UPDATE)

---

### `client_consultations`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `client_email`    | `text`        | NO       |
| `descriptif`      | `text`        | NO       |
| `status`          | `text`        | YES      |
| `enseigne_id`     | `uuid`        | YES      |
| `organisation_id` | `uuid`        | YES      |
| `assigned_to`     | `uuid`        | YES      |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `staff_insert_consultations` (INSERT)
- `Consultations read access` (SELECT)
- `staff_update_consultations` (UPDATE)

**Triggers :**

- `trigger_consultations_updated_at` (BEFORE UPDATE)

---

### `consultation_emails`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `consultation_id` | `uuid`        | NO       |
| `recipient_email` | `text`        | NO       |
| `subject`         | `text`        | NO       |
| `status`          | `text`        | NO       |
| `created_at`      | `timestamptz` | NO       |

**Relations (FK) :**

- `consultation_id` → `client_consultations.id`

**RLS policies :**

- `staff_full_access` (ALL)

---

### `consultation_images`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `consultation_id` | `uuid`        | NO       |
| `storage_path`    | `text`        | NO       |
| `public_url`      | `text`        | YES      |
| `is_primary`      | `bool`        | YES      |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `consultation_id` → `client_consultations.id`

**RLS policies :**

- `backoffice_full_access_consultation_images` (ALL)
- `consultation_images_delete` (DELETE)
- `consultation_images_insert` (INSERT)
- `consultation_images_select` (SELECT)
- `consultation_images_update` (UPDATE)

**Triggers :**

- `trigger_manage_consultation_primary_image` (BEFORE UPDATE)
- `trigger_update_consultation_images_updated_at` (BEFORE UPDATE)

---

### `consultation_products`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `consultation_id` | `uuid`        | NO       |
| `product_id`      | `uuid`        | NO       |
| `proposed_price`  | `numeric`     | YES      |
| `status`          | `text`        | YES      |
| `quantity`        | `int`         | NO       |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `consultation_id` → `client_consultations.id`
- `product_id` → `products.id`

**RLS policies :**

- `staff_manage_consultation_products` (ALL)

---
