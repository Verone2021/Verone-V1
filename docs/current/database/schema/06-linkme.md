# Domaine : Linkme

**Description :** Plateforme affiliation B2B2C — affilies, selections, commissions, demandes paiement.

**Tables (10) :** `linkme_affiliates`, `linkme_channel_suppliers`, `linkme_commissions`, `linkme_info_requests`, `linkme_onboarding_progress`, `linkme_page_configurations`, `linkme_payment_request_items`, `linkme_payment_requests`, `linkme_selection_items`, `linkme_selections`

---

### `linkme_affiliates`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `id`                     | `uuid`        | NO       |
| `organisation_id`        | `uuid`        | YES      |
| `enseigne_id`            | `uuid`        | YES      |
| `affiliate_type`         | `text`        | NO       |
| `display_name`           | `text`        | NO       |
| `slug`                   | `text`        | NO       |
| `status`                 | `text`        | YES      |
| `default_margin_rate`    | `numeric`     | YES      |
| `linkme_commission_rate` | `numeric`     | YES      |
| `tva_rate`               | `numeric`     | YES      |
| `primary_color`          | `varchar`     | YES      |
| `price_display_mode`     | `varchar`     | YES      |
| `order_code`             | `text`        | YES      |
| `created_at`             | `timestamptz` | YES      |

**Relations (FK) :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `linkme_affiliates_staff_all` (ALL)
- `linkme_affiliates_own` (ALL)
- `linkme_affiliates_public_read` (SELECT)

**Triggers :**

- `linkme_affiliates_updated_at` (BEFORE UPDATE)

---

### `linkme_channel_suppliers`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `supplier_id`           | `uuid`        | NO       |
| `channel_id`            | `uuid`        | NO       |
| `is_visible_as_partner` | `bool`        | NO       |
| `display_order`         | `int`         | YES      |
| `created_at`            | `timestamptz` | NO       |

**Relations (FK) :**

- `channel_id` → `sales_channels.id`
- `supplier_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_linkme_channel_suppliers` (ALL)
- `linkme_channel_suppliers_select_authenticated` (SELECT)

**Triggers :**

- `trg_linkme_channel_suppliers_updated_at` (BEFORE UPDATE)

---

### `linkme_commissions`

| Colonne                | Type          | Nullable |
| ---------------------- | ------------- | -------- |
| `id`                   | `uuid`        | NO       |
| `affiliate_id`         | `uuid`        | NO       |
| `selection_id`         | `uuid`        | YES      |
| `order_id`             | `uuid`        | NO       |
| `order_item_id`        | `uuid`        | YES      |
| `order_amount_ht`      | `numeric`     | NO       |
| `affiliate_commission` | `numeric`     | NO       |
| `linkme_commission`    | `numeric`     | NO       |
| `margin_rate_applied`  | `numeric`     | NO       |
| `status`               | `text`        | YES      |
| `total_payout_ht`      | `numeric`     | YES      |
| `total_payout_ttc`     | `numeric`     | YES      |
| `payment_request_id`   | `uuid`        | YES      |
| `created_at`           | `timestamptz` | YES      |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`
- `order_id` → `sales_orders.id`
- `order_item_id` → `sales_order_items.id`
- `payment_request_id` → `linkme_payment_requests.id`
- `selection_id` → `linkme_selections.id`

**RLS policies :**

- `staff_manage_linkme_commissions` (ALL)
- `affiliates_view_own_commissions` (SELECT)

**Triggers :**

- `trg_linkme_commission_ttc` (BEFORE UPDATE)

---

### `linkme_info_requests`

| Colonne            | Type          | Nullable |
| ------------------ | ------------- | -------- |
| `id`               | `uuid`        | NO       |
| `sales_order_id`   | `uuid`        | NO       |
| `requested_fields` | `jsonb`       | NO       |
| `token`            | `uuid`        | NO       |
| `token_expires_at` | `timestamptz` | NO       |
| `recipient_email`  | `text`        | NO       |
| `recipient_type`   | `text`        | NO       |
| `sent_at`          | `timestamptz` | NO       |
| `completed_at`     | `timestamptz` | YES      |
| `submitted_data`   | `jsonb`       | YES      |
| `created_at`       | `timestamptz` | YES      |

**Relations (FK) :**

- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `staff_full_access_linkme_info_requests` (ALL)

**Triggers :**

- `set_linkme_info_requests_updated_at` (BEFORE UPDATE)
- `trg_notify_linkme_info_request_completed` (AFTER UPDATE)
- `trg_notify_linkme_info_request_sent` (AFTER INSERT)

---

### `linkme_onboarding_progress`

| Colonne        | Type          | Nullable |
| -------------- | ------------- | -------- |
| `id`           | `uuid`        | NO       |
| `user_id`      | `uuid`        | NO       |
| `step_id`      | `text`        | NO       |
| `completed_at` | `timestamptz` | YES      |
| `created_at`   | `timestamptz` | YES      |

**RLS policies :**

- `staff_full_access_onboarding` (ALL)
- `affiliate_delete_own_onboarding` (DELETE)
- `affiliate_insert_own_onboarding` (INSERT)
- `affiliate_read_own_onboarding` (SELECT)

---

### `linkme_page_configurations`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `page_id`       | `text`        | NO       |
| `page_name`     | `text`        | NO       |
| `globe_enabled` | `bool`        | NO       |
| `config`        | `jsonb`       | NO       |
| `created_at`    | `timestamptz` | NO       |
| `updated_at`    | `timestamptz` | NO       |

**RLS policies :**

- `staff_full_access_linkme_page_configurations` (ALL)
- `public_read_linkme_page_configurations` (SELECT)

**Triggers :**

- `trigger_linkme_page_configurations_updated_at` (BEFORE UPDATE)

---

### `linkme_payment_request_items`

| Colonne                 | Type          | Nullable |
| ----------------------- | ------------- | -------- |
| `id`                    | `uuid`        | NO       |
| `payment_request_id`    | `uuid`        | NO       |
| `commission_id`         | `uuid`        | NO       |
| `commission_amount_ttc` | `numeric`     | NO       |
| `created_at`            | `timestamptz` | YES      |

**Relations (FK) :**

- `commission_id` → `linkme_commissions.id`
- `payment_request_id` → `linkme_payment_requests.id`

**RLS policies :**

- `staff_delete_request_items` (DELETE)
- `staff_create_request_items` (INSERT)
- `staff_view_all_request_items` (SELECT)
- `affiliate_view_own_request_items` (SELECT)

---

### `linkme_payment_requests`

| Colonne            | Type          | Nullable |
| ------------------ | ------------- | -------- |
| `id`               | `uuid`        | NO       |
| `affiliate_id`     | `uuid`        | NO       |
| `request_number`   | `varchar`     | NO       |
| `total_amount_ht`  | `numeric`     | NO       |
| `total_amount_ttc` | `numeric`     | NO       |
| `status`           | `varchar`     | NO       |
| `invoice_file_url` | `varchar`     | YES      |
| `paid_at`          | `timestamptz` | YES      |
| `created_at`       | `timestamptz` | YES      |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`

**RLS policies :**

- `staff_delete_payment_requests` (DELETE)
- `staff_create_payment_requests` (INSERT)
- `staff_view_all_payment_requests` (SELECT)
- `affiliate_view_own_payment_requests` (SELECT)

**Triggers :**

- `trigger_generate_payment_request_number` (BEFORE INSERT)
- `trigger_sync_commissions_on_payment` (AFTER UPDATE)
- `trigger_update_payment_request_timestamp` (BEFORE UPDATE)

---

### `linkme_selection_items`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `selection_id`       | `uuid`        | NO       |
| `product_id`         | `uuid`        | NO       |
| `base_price_ht`      | `numeric`     | NO       |
| `margin_rate`        | `numeric`     | NO       |
| `selling_price_ht`   | `numeric`     | YES      |
| `display_order`      | `int`         | YES      |
| `is_featured`        | `bool`        | YES      |
| `is_hidden_by_staff` | `bool`        | NO       |
| `created_at`         | `timestamptz` | YES      |

**Relations (FK) :**

- `product_id` → `products.id`
- `selection_id` → `linkme_selections.id`

**RLS policies :**

- `staff_manage_linkme_selection_items` (ALL)
- `linkme_selection_items_affiliate_delete` (DELETE)
- `linkme_selection_items_affiliate_insert` (INSERT)
- `linkme_selection_items_affiliate_select` (SELECT)
- `linkme_selection_items_affiliate_update` (UPDATE)
- `public_read_selection_items` (SELECT)

**Triggers :**

- `check_enseigne_product_selection` (BEFORE UPDATE)
- `linkme_selection_items_count` (AFTER INSERT)
- `linkme_selection_items_updated_at` (BEFORE UPDATE)
- `trg_validate_linkme_margin` (BEFORE UPDATE)

---

### `linkme_selections`

| Colonne          | Type          | Nullable |
| ---------------- | ------------- | -------- |
| `id`             | `uuid`        | NO       |
| `affiliate_id`   | `uuid`        | NO       |
| `name`           | `text`        | NO       |
| `slug`           | `text`        | NO       |
| `share_token`    | `text`        | YES      |
| `products_count` | `int`         | YES      |
| `views_count`    | `int`         | YES      |
| `orders_count`   | `int`         | YES      |
| `total_revenue`  | `numeric`     | YES      |
| `published_at`   | `timestamptz` | YES      |
| `archived_at`    | `timestamptz` | YES      |
| `created_at`     | `timestamptz` | YES      |

**Relations (FK) :**

- `affiliate_id` → `linkme_affiliates.id`

**RLS policies :**

- `linkme_selections_affiliate_own` (ALL)
- `staff_manage_linkme_selections` (ALL)
- `linkme_selections_public_read` (SELECT)

**Triggers :**

- `linkme_selections_updated_at` (BEFORE UPDATE)

---
