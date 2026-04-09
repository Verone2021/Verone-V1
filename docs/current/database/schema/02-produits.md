# Domaine : Produits

**Description :** Catalogue produits, images, couleurs, groupes, collections, tarifs historiques.

**Tables (17) :** `products`, `product_images`, `product_colors`, `product_groups`, `product_group_members`, `product_packages`, `product_purchase_history`, `product_reviews`, `product_commission_history`, `categories`, `subcategories`, `families`, `variant_groups`, `collections`, `collection_images`, `collection_products`, `collection_shares`

---

### `products`

| Colonne                      | Type          | Nullable |
| ---------------------------- | ------------- | -------- |
| `id`                         | `uuid`        | NO       |
| `sku`                        | `varchar`     | NO       |
| `name`                       | `varchar`     | NO       |
| `slug`                       | `varchar`     | YES      |
| `condition`                  | `varchar`     | YES      |
| `variant_attributes`         | `jsonb`       | YES      |
| `dimensions`                 | `jsonb`       | YES      |
| `weight`                     | `numeric`     | YES      |
| `video_url`                  | `text`        | YES      |
| `stock_quantity`             | `int`         | YES      |
| `stock_real`                 | `int`         | YES      |
| `stock_forecasted_in`        | `int`         | YES      |
| `stock_forecasted_out`       | `int`         | YES      |
| `supplier_id`                | `uuid`        | YES      |
| `subcategory_id`             | `uuid`        | YES      |
| `brand`                      | `varchar`     | YES      |
| `supplier_reference`         | `varchar`     | YES      |
| `supplier_page_url`          | `text`        | YES      |
| `gtin`                       | `varchar`     | YES      |
| `margin_percentage`          | `numeric`     | YES      |
| `created_at`                 | `timestamptz` | YES      |
| `updated_at`                 | `timestamptz` | YES      |
| `description`                | `text`        | YES      |
| `technical_description`      | `text`        | YES      |
| `selling_points`             | `jsonb`       | YES      |
| `min_stock`                  | `int`         | YES      |
| `reorder_point`              | `int`         | YES      |
| `availability_type`          | `enum`        | YES      |
| `target_margin_percentage`   | `numeric`     | YES      |
| `product_type`               | `varchar`     | YES      |
| `assigned_client_id`         | `uuid`        | YES      |
| `creation_mode`              | `varchar`     | YES      |
| `requires_sample`            | `bool`        | YES      |
| `archived_at`                | `timestamptz` | YES      |
| `sourcing_type`              | `varchar`     | YES      |
| `variant_group_id`           | `uuid`        | YES      |
| `variant_position`           | `int`         | YES      |
| `completion_status`          | `text`        | YES      |
| `completion_percentage`      | `int`         | YES      |
| `suitable_rooms`             | `ARRAY`       | YES      |
| `item_group_id`              | `varchar`     | YES      |
| `rejection_reason`           | `text`        | YES      |
| `cost_price`                 | `numeric`     | YES      |
| `eco_tax_default`            | `numeric`     | YES      |
| `search_vector`              | `tsvector`    | YES      |
| `stock_status`               | `enum`        | NO       |
| `product_status`             | `enum`        | NO       |
| `supplier_moq`               | `int`         | YES      |
| `meta_title`                 | `text`        | YES      |
| `meta_description`           | `text`        | YES      |
| `is_published_online`        | `bool`        | YES      |
| `publication_date`           | `timestamptz` | YES      |
| `unpublication_date`         | `timestamptz` | YES      |
| `enseigne_id`                | `uuid`        | YES      |
| `article_type`               | `enum`        | NO       |
| `affiliate_approval_status`  | `enum`        | YES      |
| `affiliate_payout_ht`        | `numeric`     | YES      |
| `affiliate_commission_rate`  | `numeric`     | YES      |
| `affiliate_approved_at`      | `timestamptz` | YES      |
| `affiliate_approved_by`      | `uuid`        | YES      |
| `created_by_affiliate`       | `uuid`        | YES      |
| `affiliate_rejection_reason` | `text`        | YES      |
| `store_at_verone`            | `bool`        | YES      |
| `style`                      | `text`        | YES      |
| `show_on_linkme_globe`       | `bool`        | YES      |
| `cost_price_avg`             | `numeric`     | YES      |
| `cost_price_min`             | `numeric`     | YES      |
| `cost_price_max`             | `numeric`     | YES      |
| `cost_price_last`            | `numeric`     | YES      |
| `cost_price_count`           | `int`         | NO       |
| `cost_net_avg`               | `numeric`     | YES      |
| `cost_net_min`               | `numeric`     | YES      |
| `cost_net_max`               | `numeric`     | YES      |
| `cost_net_last`              | `numeric`     | YES      |
| `has_images`                 | `bool`        | NO       |
| `internal_notes`             | `text`        | YES      |
| `sourcing_channel`           | `text`        | YES      |
| `shipping_cost_estimate`     | `numeric`     | YES      |
| `shipping_class`             | `text`        | YES      |

**Relations (FK) :**

- `assigned_client_id` → `organisations.id`
- `created_by_affiliate` → `linkme_affiliates.id`
- `enseigne_id` → `enseignes.id`
- `subcategory_id` → `subcategories.id`
- `supplier_id` → `organisations.id`
- `variant_group_id` → `variant_groups.id`

**RLS policies :**

- `backoffice_full_access_products` (ALL)
- `linkme_users_view_catalog_products` (SELECT)
- `Allow anon read products on LinkMe globe` (SELECT)

**Triggers :**

- `products_auto_sku_trigger` (BEFORE INSERT)
- `products_updated_at` (BEFORE UPDATE)
- `trg_generate_product_slug_on_insert` (BEFORE INSERT)
- `trg_log_product_commission_change` (AFTER UPDATE)
- `trg_product_approval_notification` (AFTER UPDATE)
- `trg_sync_stock_quantity` (BEFORE UPDATE)
- `trg_sync_stock_status` (BEFORE UPDATE)
- `trg_update_variant_group_count` (AFTER UPDATE)
- `trigger_auto_add_sourcing_to_linkme` (AFTER INSERT)
- `trigger_calculate_completion` (BEFORE INSERT)
- `trigger_products_search_vector_update` (BEFORE UPDATE)
- `trigger_sync_stock_alert_tracking_v4` (AFTER UPDATE)
- `trigger_sync_suitable_rooms_on_product` (AFTER UPDATE)

---

### `product_images`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `product_id`    | `uuid`        | NO       |
| `storage_path`  | `text`        | NO       |
| `public_url`    | `text`        | YES      |
| `display_order` | `int`         | YES      |
| `is_primary`    | `bool`        | YES      |
| `image_type`    | `enum`        | YES      |
| `alt_text`      | `text`        | YES      |
| `width`         | `int`         | YES      |
| `height`        | `int`         | YES      |
| `file_size`     | `bigint`      | YES      |
| `format`        | `text`        | YES      |
| `created_by`    | `uuid`        | YES      |
| `created_at`    | `timestamptz` | YES      |
| `updated_at`    | `timestamptz` | YES      |

**Relations (FK) :**

- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_product_images` (ALL)
- `product_images_select_authenticated` (SELECT)
- `public_read_product_images` (SELECT)
- `product_images_insert_authenticated` (INSERT)

**Triggers :**

- `product_images_generate_url` (BEFORE UPDATE)
- `product_images_single_primary` (AFTER INSERT)
- `trg_update_product_has_images` (AFTER DELETE)
- `trigger_recalculate_completion_images` (AFTER DELETE)

---

### `product_colors`

| Colonne         | Type                          | Nullable |
| --------------- | ----------------------------- | -------- |
| `id`            | `uuid`                        | NO       |
| `name`          | `varchar`                     | NO       |
| `hex_code`      | `varchar`                     | YES      |
| `is_predefined` | `bool`                        | YES      |
| `created_at`    | `timestamp without time zone` | YES      |
| `updated_at`    | `timestamp without time zone` | YES      |

**RLS policies :**

- `backoffice_full_access_product_colors` (ALL)
- `product_colors_insert_authenticated` (INSERT)
- `product_colors_select_authenticated` (SELECT)
- `product_colors_update_authenticated` (UPDATE)

**Triggers :**

- `trg_product_colors_updated_at` (BEFORE UPDATE)

---

### `product_groups`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `name`               | `varchar`     | NO       |
| `description`        | `text`        | YES      |
| `item_group_id`      | `varchar`     | NO       |
| `group_type`         | `varchar`     | YES      |
| `primary_product_id` | `uuid`        | YES      |
| `is_active`          | `bool`        | YES      |
| `created_at`         | `timestamptz` | YES      |
| `updated_at`         | `timestamptz` | YES      |

**Relations (FK) :**

- `primary_product_id` → `products.id`

**RLS policies :**

- `product_groups_admin_policy` (ALL)
- `backoffice_full_access_product_groups` (ALL)
- `product_groups_public_read` (SELECT)

**Triggers :**

- `trigger_product_groups_updated_at` (BEFORE UPDATE)

---

### `product_group_members`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `product_id` | `uuid`        | NO       |
| `group_id`   | `uuid`        | NO       |
| `is_primary` | `bool`        | YES      |
| `sort_order` | `int`         | YES      |
| `added_at`   | `timestamptz` | YES      |

**Relations (FK) :**

- `group_id` → `product_groups.id`
- `product_id` → `products.id`

**RLS policies :**

- `product_group_members_admin_policy` (ALL)
- `backoffice_full_access_product_group_members` (ALL)
- `product_group_members_public_read` (SELECT)

**Triggers :**

- `trigger_ensure_single_primary_product` (AFTER UPDATE)

---

### `product_packages`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `product_id`         | `uuid`        | NO       |
| `name`               | `varchar`     | NO       |
| `type`               | `enum`        | NO       |
| `base_quantity`      | `int`         | NO       |
| `discount_rate`      | `numeric`     | YES      |
| `unit_price_ht`      | `numeric`     | YES      |
| `min_order_quantity` | `int`         | YES      |
| `description`        | `text`        | YES      |
| `is_default`         | `bool`        | YES      |
| `is_active`          | `bool`        | YES      |
| `display_order`      | `int`         | YES      |
| `created_at`         | `timestamptz` | YES      |
| `updated_at`         | `timestamptz` | YES      |

**Relations (FK) :**

- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_product_packages` (ALL)
- `product_packages_insert_authenticated` (INSERT)
- `product_packages_select_authenticated` (SELECT)
- `product_packages_update_authenticated` (UPDATE)

**Triggers :**

- `product_packages_single_default` (AFTER INSERT)
- `product_packages_updated_at` (BEFORE UPDATE)

---

### `product_purchase_history`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `id`                     | `uuid`        | NO       |
| `product_id`             | `uuid`        | NO       |
| `purchase_order_id`      | `uuid`        | NO       |
| `purchase_order_item_id` | `uuid`        | NO       |
| `unit_price_ht`          | `numeric`     | NO       |
| `quantity`               | `int`         | NO       |
| `purchased_at`           | `timestamptz` | NO       |
| `created_at`             | `timestamptz` | NO       |
| `unit_cost_net`          | `numeric`     | YES      |

**Relations (FK) :**

- `product_id` → `products.id`
- `purchase_order_id` → `purchase_orders.id`
- `purchase_order_item_id` → `purchase_order_items.id`

**RLS policies :**

- `staff_manage_purchase_history` (ALL)

---

### `product_reviews`

| Colonne       | Type          | Nullable |
| ------------- | ------------- | -------- |
| `id`          | `uuid`        | NO       |
| `product_id`  | `uuid`        | NO       |
| `user_id`     | `uuid`        | YES      |
| `author_name` | `text`        | NO       |
| `rating`      | `int`         | NO       |
| `title`       | `text`        | YES      |
| `comment`     | `text`        | YES      |
| `status`      | `text`        | NO       |
| `created_at`  | `timestamptz` | NO       |
| `updated_at`  | `timestamptz` | NO       |

**Relations (FK) :**

- `product_id` → `products.id`

**RLS policies :**

- `staff_delete_reviews` (DELETE)
- `users_insert_reviews` (INSERT)
- `public_read_approved_reviews` (SELECT)
- `staff_update_reviews` (UPDATE)

---

### `product_commission_history`

| Colonne               | Type          | Nullable |
| --------------------- | ------------- | -------- |
| `id`                  | `uuid`        | NO       |
| `product_id`          | `uuid`        | NO       |
| `old_commission_rate` | `numeric`     | YES      |
| `old_payout_ht`       | `numeric`     | YES      |
| `new_commission_rate` | `numeric`     | YES      |
| `new_payout_ht`       | `numeric`     | YES      |
| `change_reason`       | `text`        | YES      |
| `modified_by`         | `uuid`        | YES      |
| `modified_at`         | `timestamptz` | NO       |
| `change_type`         | `text`        | NO       |

**Relations (FK) :**

- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_product_commission_history` (ALL)
- `product_commission_history_insert_admin` (INSERT)
- `product_commission_history_select_admin` (SELECT)

---

### `categories`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `name`               | `varchar`     | NO       |
| `slug`               | `varchar`     | NO       |
| `level`              | `int`         | YES      |
| `google_category_id` | `int`         | YES      |
| `facebook_category`  | `varchar`     | YES      |
| `description`        | `text`        | YES      |
| `image_url`          | `text`        | YES      |
| `is_active`          | `bool`        | YES      |
| `display_order`      | `int`         | YES      |
| `created_at`         | `timestamptz` | YES      |
| `updated_at`         | `timestamptz` | YES      |
| `family_id`          | `uuid`        | YES      |
| `meta_title`         | `text`        | YES      |
| `meta_description`   | `text`        | YES      |
| `is_visible_menu`    | `bool`        | YES      |

**Relations (FK) :**

- `family_id` → `families.id`

**RLS policies :**

- `backoffice_full_access_categories` (ALL)
- `public_read_categories` (SELECT)

**Triggers :**

- `trigger_categories_updated_at` (BEFORE UPDATE)

---

### `subcategories`

| Colonne            | Type          | Nullable |
| ------------------ | ------------- | -------- |
| `id`               | `uuid`        | NO       |
| `category_id`      | `uuid`        | NO       |
| `name`             | `varchar`     | NO       |
| `slug`             | `varchar`     | NO       |
| `description`      | `text`        | YES      |
| `image_url`        | `text`        | YES      |
| `display_order`    | `int`         | YES      |
| `is_active`        | `bool`        | YES      |
| `meta_title`       | `varchar`     | YES      |
| `meta_description` | `text`        | YES      |
| `created_at`       | `timestamptz` | YES      |
| `updated_at`       | `timestamptz` | YES      |

**Relations (FK) :**

- `category_id` → `categories.id`

**RLS policies :**

- `backoffice_full_access_subcategories` (ALL)
- `public_read_subcategories` (SELECT)

**Triggers :**

- `trigger_subcategories_updated_at` (BEFORE UPDATE)

---

### `families`

| Colonne            | Type          | Nullable |
| ------------------ | ------------- | -------- |
| `id`               | `uuid`        | NO       |
| `name`             | `varchar`     | NO       |
| `slug`             | `varchar`     | NO       |
| `description`      | `text`        | YES      |
| `image_url`        | `text`        | YES      |
| `display_order`    | `int`         | YES      |
| `is_active`        | `bool`        | YES      |
| `meta_title`       | `varchar`     | YES      |
| `meta_description` | `text`        | YES      |
| `created_at`       | `timestamptz` | YES      |
| `updated_at`       | `timestamptz` | YES      |
| `created_by`       | `uuid`        | YES      |

**RLS policies :**

- `backoffice_full_access_families` (ALL)

**Triggers :**

- `trigger_families_updated_at` (BEFORE UPDATE)

---

### `variant_groups`

| Colonne                 | Type                          | Nullable |
| ----------------------- | ----------------------------- | -------- |
| `id`                    | `uuid`                        | NO       |
| `name`                  | `varchar`                     | NO       |
| `subcategory_id`        | `uuid`                        | NO       |
| `dimensions_length`     | `numeric`                     | YES      |
| `dimensions_width`      | `numeric`                     | YES      |
| `dimensions_height`     | `numeric`                     | YES      |
| `dimensions_unit`       | `varchar`                     | YES      |
| `product_count`         | `int`                         | YES      |
| `created_at`            | `timestamp without time zone` | YES      |
| `updated_at`            | `timestamp without time zone` | YES      |
| `variant_type`          | `varchar`                     | YES      |
| `common_dimensions`     | `jsonb`                       | YES      |
| `common_weight`         | `numeric`                     | YES      |
| `auto_name_pattern`     | `text`                        | YES      |
| `style`                 | `text`                        | YES      |
| `suitable_rooms`        | `ARRAY`                       | YES      |
| `base_sku`              | `varchar`                     | NO       |
| `supplier_id`           | `uuid`                        | YES      |
| `has_common_supplier`   | `bool`                        | NO       |
| `archived_at`           | `timestamp without time zone` | YES      |
| `has_common_weight`     | `bool`                        | NO       |
| `has_common_cost_price` | `bool`                        | NO       |
| `common_cost_price`     | `numeric`                     | YES      |
| `common_eco_tax`        | `numeric`                     | YES      |

**Relations (FK) :**

- `subcategory_id` → `subcategories.id`
- `supplier_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_variant_groups` (ALL)
- `variant_groups_select_authenticated` (SELECT)

**Triggers :**

- `trigger_sync_suitable_rooms_on_group` (AFTER UPDATE)

---

### `collections`

| Colonne       | Type          | Nullable |
| ------------- | ------------- | -------- |
| `id`          | `uuid`        | NO       |
| `name`        | `text`        | NO       |
| `slug`        | `text`        | NO       |
| `description` | `text`        | YES      |
| `image_url`   | `text`        | YES      |
| `is_active`   | `bool`        | YES      |
| `is_public`   | `bool`        | YES      |
| `created_at`  | `timestamptz` | YES      |
| `updated_at`  | `timestamptz` | YES      |
| `created_by`  | `uuid`        | YES      |

**RLS policies :**

- `backoffice_full_access_collections` (ALL)
- `public_read_published_collections` (SELECT)

**Triggers :**

- `collections_auto_slug` (BEFORE INSERT)
- `trigger_collections_updated_at` (BEFORE UPDATE)

---

### `collection_images`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `collection_id` | `uuid`        | NO       |
| `storage_path`  | `text`        | NO       |
| `public_url`    | `text`        | YES      |
| `display_order` | `int`         | YES      |
| `is_primary`    | `bool`        | YES      |
| `created_at`    | `timestamptz` | YES      |

**Relations (FK) :**

- `collection_id` → `collections.id`

**RLS policies :**

- `backoffice_full_access_collection_images` (ALL)
- `collection_images_delete_authenticated` (DELETE)
- `collection_images_select_authenticated` (SELECT)
- `collection_images_insert_authenticated` (INSERT)

**Triggers :**

- `collection_images_generate_url` (BEFORE UPDATE)
- `collection_images_single_primary` (AFTER INSERT)
- `trigger_update_collection_images_updated_at` (BEFORE UPDATE)

---

### `collection_products`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `collection_id` | `uuid`        | NO       |
| `product_id`    | `uuid`        | NO       |
| `display_order` | `int`         | YES      |
| `added_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `collection_id` → `collections.id`
- `product_id` → `products.id`

**RLS policies :**

- `backoffice_full_access_collection_products` (ALL)
- `staff_delete_collection_products` (DELETE)
- `staff_write_collection_products` (INSERT)
- `public_read_collection_products` (SELECT)
- `staff_update_collection_products` (UPDATE)

**Triggers :**

- `trigger_collection_product_count` (AFTER DELETE)

---

### `collection_shares`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `collection_id`     | `uuid`        | NO       |
| `shared_with_email` | `text`        | NO       |
| `shared_at`         | `timestamptz` | YES      |
| `created_by`        | `uuid`        | YES      |

**Relations (FK) :**

- `collection_id` → `collections.id`

**RLS policies :**

- `backoffice_full_access_collection_shares` (ALL)
- `collection_shares_delete` (DELETE)
- `collection_shares_insert` (INSERT)
- `collection_shares_select` (SELECT)
- `collection_shares_update` (UPDATE)

**Triggers :**

- `trigger_update_collection_shared_count` (AFTER INSERT)

---
