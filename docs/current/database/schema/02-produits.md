# Domaine Produits & Catalogue — Schema Base de Donnees

_Generated: 2026-04-12 16:31_

**Tables : 17**

| Table                                                     | Colonnes | FK  | RLS | Triggers |
| --------------------------------------------------------- | -------- | --- | --- | -------- |
| [categories](#categories)                                 | 16       | 1   | 2   | 1        |
| [collection_images](#collection-images)                   | 15       | 1   | 4   | 3        |
| [collection_products](#collection-products)               | 6        | 2   | 5   | 1        |
| [collection_shares](#collection-shares)                   | 6        | 1   | 5   | 1        |
| [collections](#collections)                               | 33       | 0   | 2   | 2        |
| [families](#families)                                     | 12       | 0   | 1   | 1        |
| [product_colors](#product-colors)                         | 6        | 0   | 4   | 1        |
| [product_commission_history](#product-commission-history) | 10       | 1   | 3   | 0        |
| [product_group_members](#product-group-members)           | 6        | 2   | 3   | 1        |
| [product_groups](#product-groups)                         | 9        | 1   | 3   | 1        |
| [product_images](#product-images)                         | 15       | 1   | 4   | 4        |
| [product_packages](#product-packages)                     | 14       | 1   | 4   | 2        |
| [product_purchase_history](#product-purchase-history)     | 9        | 3   | 1   | 0        |
| [product_reviews](#product-reviews)                       | 10       | 1   | 4   | 0        |
| [products](#products)                                     | 79       | 6   | 3   | 18       |
| [subcategories](#subcategories)                           | 12       | 1   | 2   | 1        |
| [variant_groups](#variant-groups)                         | 24       | 2   | 2   | 1        |

## categories

| Colonne            | Type        | Nullable | Default            |
| ------------------ | ----------- | -------- | ------------------ |
| id                 | uuid        | NO       | uuid_generate_v4() |
| name               | varchar     | NO       |                    |
| slug               | varchar     | NO       |                    |
| level              | integer     | YES      | 0                  |
| google_category_id | integer     | YES      |                    |
| facebook_category  | varchar     | YES      |                    |
| description        | text        | YES      |                    |
| image_url          | text        | YES      |                    |
| is_active          | boolean     | YES      | true               |
| display_order      | integer     | YES      | 0                  |
| created_at         | timestamptz | YES      | now()              |
| updated_at         | timestamptz | YES      | now()              |
| family_id          | uuid        | YES      |                    |
| meta_title         | text        | YES      |                    |
| meta_description   | text        | YES      |                    |
| is_visible_menu    | boolean     | YES      | true               |

**Relations :**

- `family_id` → `families.id`

**RLS :** 2 policies

- `backoffice_full_access_categories` : ALL — authenticated
- `public_read_categories` : SELECT — anon,authenticated

**Triggers :** 1

- `trigger_categories_updated_at` : BEFORE UPDATE

---

## collection_images

| Colonne       | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| collection_id | uuid        | NO       |                   |
| storage_path  | text        | NO       |                   |
| public_url    | text        | YES      |                   |
| display_order | integer     | NO       | 1                 |
| is_primary    | boolean     | NO       | false             |
| image_type    | text        | YES      | 'cover'::text     |
| alt_text      | text        | YES      |                   |
| file_name     | text        | YES      |                   |
| file_size     | integer     | YES      |                   |
| mime_type     | text        | YES      |                   |
| width         | integer     | YES      |                   |
| height        | integer     | YES      |                   |
| created_at    | timestamptz | YES      | now()             |
| updated_at    | timestamptz | YES      | now()             |

**Relations :**

- `collection_id` → `collections.id`

**RLS :** 4 policies

- `backoffice_full_access_collection_images` : ALL — authenticated
- `collection_images_delete_authenticated` : DELETE — authenticated
- `collection_images_select_authenticated` : SELECT — authenticated
- `collection_images_update_authenticated` : UPDATE — authenticated

**Triggers :** 3

- `collection_images_generate_url` : BEFORE INSERT
- `collection_images_single_primary` : AFTER INSERT
- `trigger_update_collection_images_updated_at` : BEFORE UPDATE

---

## collection_products

| Colonne       | Type        | Nullable | Default            |
| ------------- | ----------- | -------- | ------------------ |
| id            | uuid        | NO       | uuid_generate_v4() |
| collection_id | uuid        | NO       |                    |
| product_id    | uuid        | NO       |                    |
| position      | integer     | NO       | 0                  |
| created_at    | timestamptz | YES      | now()              |
| created_by    | uuid        | YES      |                    |

**Relations :**

- `collection_id` → `collections.id`
- `product_id` → `products.id`

**RLS :** 5 policies

- `backoffice_full_access_collection_products` : ALL — authenticated
- `staff_delete_collection_products` : DELETE — authenticated
- `staff_write_collection_products` : INSERT — authenticated
- `public_read_published_collection_products` : SELECT — anon,authenticated
- `staff_update_collection_products` : UPDATE — authenticated

**Triggers :** 1

- `trigger_collection_product_count` : AFTER INSERT

---

## collection_shares

| Colonne         | Type        | Nullable | Default                   |
| --------------- | ----------- | -------- | ------------------------- |
| id              | uuid        | NO       | uuid_generate_v4()        |
| collection_id   | uuid        | NO       |                           |
| share_type      | varchar     | NO       | 'link'::character varying |
| recipient_email | varchar     | YES      |                           |
| shared_at       | timestamptz | NO       | now()                     |
| shared_by       | uuid        | YES      |                           |

**Relations :**

- `collection_id` → `collections.id`

**RLS :** 5 policies

- `backoffice_full_access_collection_shares` : ALL — authenticated
- `collection_shares_delete` : DELETE — public
- `collection_shares_insert` : INSERT — public
- `collection_shares_read` : SELECT — public
- `collection_shares_update` : UPDATE — public

**Triggers :** 1

- `trigger_update_collection_shared_count` : AFTER INSERT

---

## collections

| Colonne             | Type             | Nullable | Default                      |
| ------------------- | ---------------- | -------- | ---------------------------- |
| id                  | uuid             | NO       | uuid_generate_v4()           |
| name                | varchar          | NO       |                              |
| description         | text             | YES      |                              |
| is_featured         | boolean          | YES      | false                        |
| created_by          | uuid             | NO       |                              |
| created_at          | timestamptz      | YES      | now()                        |
| updated_at          | timestamptz      | YES      | now()                        |
| is_active           | boolean          | YES      | true                         |
| visibility          | varchar          | NO       | 'private'::character varying |
| shared_link_token   | varchar          | YES      |                              |
| product_count       | integer          | YES      | 0                            |
| shared_count        | integer          | YES      | 0                            |
| last_shared         | timestamptz      | YES      |                              |
| style               | varchar          | YES      |                              |
| theme_tags          | text[]           | YES      | '{}'::text[]                 |
| display_order       | integer          | YES      | 0                            |
| meta_title          | varchar          | YES      |                              |
| meta_description    | text             | YES      |                              |
| image_url           | text             | YES      |                              |
| color_theme         | varchar          | YES      |                              |
| archived_at         | timestamptz      | YES      |                              |
| suitable_rooms      | text[]           | YES      |                              |
| visible_channels    | uuid[]           | YES      |                              |
| slug                | text             | YES      |                              |
| is_published_online | boolean          | YES      | false                        |
| publication_date    | timestamptz      | YES      |                              |
| unpublication_date  | timestamptz      | YES      |                              |
| brand_id            | uuid             | YES      |                              |
| season              | enum:season_type | YES      | 'all_year'::season_type      |
| event_tags          | text[]           | YES      | '{}'::text[]                 |
| sort_order_site     | integer          | YES      | 100                          |
| description_long    | text             | YES      |                              |
| selling_points      | text[]           | YES      | '{}'::text[]                 |

**RLS :** 2 policies

- `backoffice_full_access_collections` : ALL — authenticated
- `public_read_published_collections` : SELECT — anon,authenticated

**Triggers :** 2

- `collections_auto_slug` : BEFORE INSERT
- `trigger_collections_updated_at` : BEFORE UPDATE

---

## families

| Colonne          | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| name             | varchar     | NO       |                   |
| slug             | varchar     | NO       |                   |
| description      | text        | YES      |                   |
| image_url        | text        | YES      |                   |
| display_order    | integer     | YES      | 0                 |
| is_active        | boolean     | YES      | true              |
| meta_title       | varchar     | YES      |                   |
| meta_description | text        | YES      |                   |
| created_at       | timestamptz | YES      | now()             |
| updated_at       | timestamptz | YES      | now()             |
| created_by       | uuid        | YES      |                   |

**RLS :** 1 policy

- `backoffice_full_access_families` : ALL — authenticated

**Triggers :** 1

- `trigger_families_updated_at` : BEFORE UPDATE

---

## product_colors

| Colonne       | Type      | Nullable | Default            |
| ------------- | --------- | -------- | ------------------ |
| id            | uuid      | NO       | uuid_generate_v4() |
| name          | varchar   | NO       |                    |
| hex_code      | varchar   | YES      |                    |
| is_predefined | boolean   | YES      | false              |
| created_at    | timestamp | YES      | now()              |
| updated_at    | timestamp | YES      | now()              |

**RLS :** 4 policies

- `backoffice_full_access_product_colors` : ALL — authenticated
- `product_colors_insert_authenticated` : INSERT — authenticated
- `product_colors_select_authenticated` : SELECT — authenticated
- `product_colors_update_admin` : UPDATE — authenticated

**Triggers :** 1

- `trg_product_colors_updated_at` : BEFORE UPDATE

---

## product_commission_history

| Colonne             | Type        | Nullable | Default           |
| ------------------- | ----------- | -------- | ----------------- |
| id                  | uuid        | NO       | gen_random_uuid() |
| product_id          | uuid        | NO       |                   |
| old_commission_rate | numeric     | YES      |                   |
| old_payout_ht       | numeric     | YES      |                   |
| new_commission_rate | numeric     | YES      |                   |
| new_payout_ht       | numeric     | YES      |                   |
| change_reason       | text        | YES      |                   |
| modified_by         | uuid        | YES      |                   |
| modified_at         | timestamptz | NO       | now()             |
| change_type         | text        | NO       |                   |

**Relations :**

- `product_id` → `products.id`

**RLS :** 3 policies

- `backoffice_full_access_product_commission_history` : ALL — authenticated
- `product_commission_history_insert_admin` : INSERT — authenticated
- `product_commission_history_select_admin` : SELECT — authenticated

---

## product_group_members

| Colonne    | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| product_id | uuid        | NO       |                   |
| group_id   | uuid        | NO       |                   |
| is_primary | boolean     | YES      | false             |
| sort_order | integer     | YES      | 0                 |
| added_at   | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`
- `group_id` → `product_groups.id`

**RLS :** 3 policies

- `backoffice_full_access_product_group_members` : ALL — authenticated
- `product_group_members_admin_policy` : ALL — public
- `product_group_members_public_read` : SELECT — public

**Triggers :** 1

- `trigger_ensure_single_primary_product` : AFTER INSERT

---

## product_groups

| Colonne            | Type        | Nullable | Default                      |
| ------------------ | ----------- | -------- | ---------------------------- |
| id                 | uuid        | NO       | gen_random_uuid()            |
| name               | varchar     | NO       |                              |
| description        | text        | YES      |                              |
| item_group_id      | varchar     | NO       |                              |
| group_type         | varchar     | YES      | 'variant'::character varying |
| primary_product_id | uuid        | YES      |                              |
| is_active          | boolean     | YES      | true                         |
| created_at         | timestamptz | YES      | now()                        |
| updated_at         | timestamptz | YES      | now()                        |

**Relations :**

- `primary_product_id` → `products.id`

**RLS :** 3 policies

- `product_groups_admin_policy` : ALL — public
- `backoffice_full_access_product_groups` : ALL — authenticated
- `product_groups_public_read` : SELECT — public

**Triggers :** 1

- `trigger_product_groups_updated_at` : BEFORE UPDATE

---

## product_images

| Colonne       | Type                 | Nullable | Default                    |
| ------------- | -------------------- | -------- | -------------------------- |
| id            | uuid                 | NO       | gen_random_uuid()          |
| product_id    | uuid                 | NO       |                            |
| storage_path  | text                 | NO       |                            |
| public_url    | text                 | YES      |                            |
| display_order | integer              | YES      | 0                          |
| is_primary    | boolean              | YES      | false                      |
| image_type    | enum:image_type_enum | YES      | 'gallery'::image_type_enum |
| alt_text      | text                 | YES      |                            |
| width         | integer              | YES      |                            |
| height        | integer              | YES      |                            |
| file_size     | bigint               | YES      |                            |
| format        | text                 | YES      |                            |
| created_by    | uuid                 | YES      |                            |
| created_at    | timestamptz          | YES      | now()                      |
| updated_at    | timestamptz          | YES      | now()                      |

**Relations :**

- `product_id` → `products.id`

**RLS :** 4 policies

- `backoffice_full_access_product_images` : ALL — authenticated
- `customers_read_active_product_images` : SELECT — public
- `public_read_product_images` : SELECT — anon
- `product_images_select_authenticated` : SELECT — authenticated

**Triggers :** 4

- `product_images_generate_url` : BEFORE INSERT
- `product_images_single_primary` : AFTER INSERT
- `trg_update_product_has_images` : AFTER INSERT
- `trigger_recalculate_completion_images` : AFTER INSERT

---

## product_packages

| Colonne            | Type              | Nullable | Default           |
| ------------------ | ----------------- | -------- | ----------------- |
| id                 | uuid              | NO       | gen_random_uuid() |
| product_id         | uuid              | NO       |                   |
| name               | varchar           | NO       |                   |
| type               | enum:package_type | NO       |                   |
| base_quantity      | integer           | NO       | 1                 |
| discount_rate      | numeric           | YES      |                   |
| unit_price_ht      | numeric           | YES      |                   |
| min_order_quantity | integer           | YES      | 1                 |
| description        | text              | YES      |                   |
| is_default         | boolean           | YES      | false             |
| is_active          | boolean           | YES      | true              |
| display_order      | integer           | YES      | 0                 |
| created_at         | timestamptz       | YES      | now()             |
| updated_at         | timestamptz       | YES      | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 4 policies

- `backoffice_full_access_product_packages` : ALL — authenticated
- `product_packages_insert_authenticated` : INSERT — authenticated
- `product_packages_select_authenticated` : SELECT — authenticated
- `product_packages_update_authenticated` : UPDATE — authenticated

**Triggers :** 2

- `product_packages_single_default` : AFTER INSERT
- `product_packages_updated_at` : BEFORE UPDATE

---

## product_purchase_history

| Colonne                | Type        | Nullable | Default           |
| ---------------------- | ----------- | -------- | ----------------- |
| id                     | uuid        | NO       | gen_random_uuid() |
| product_id             | uuid        | NO       |                   |
| purchase_order_id      | uuid        | NO       |                   |
| purchase_order_item_id | uuid        | NO       |                   |
| unit_price_ht          | numeric     | NO       |                   |
| quantity               | integer     | NO       |                   |
| purchased_at           | timestamptz | NO       |                   |
| created_at             | timestamptz | NO       | now()             |
| unit_cost_net          | numeric     | YES      |                   |

**Relations :**

- `product_id` → `products.id`
- `purchase_order_id` → `purchase_orders.id`
- `purchase_order_item_id` → `purchase_order_items.id`

**RLS :** 1 policy

- `staff_manage_purchase_history` : ALL — authenticated

---

## product_reviews

| Colonne     | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| product_id  | uuid        | NO       |                   |
| user_id     | uuid        | YES      |                   |
| author_name | text        | NO       |                   |
| rating      | integer     | NO       |                   |
| title       | text        | YES      |                   |
| comment     | text        | YES      |                   |
| status      | text        | NO       | 'pending'::text   |
| created_at  | timestamptz | NO       | now()             |
| updated_at  | timestamptz | NO       | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 4 policies

- `staff_delete_reviews` : DELETE — authenticated
- `users_insert_reviews` : INSERT — authenticated
- `public_read_approved_reviews` : SELECT — anon,authenticated
- `staff_update_reviews` : UPDATE — authenticated

---

## products

| Colonne                    | Type                                   | Nullable | Default                               |
| -------------------------- | -------------------------------------- | -------- | ------------------------------------- |
| id                         | uuid                                   | NO       | gen_random_uuid()                     |
| sku                        | varchar                                | NO       |                                       |
| name                       | varchar                                | NO       |                                       |
| slug                       | varchar                                | YES      |                                       |
| condition                  | varchar                                | YES      | 'new'::character varying              |
| variant_attributes         | jsonb                                  | YES      | '{}'::jsonb                           |
| dimensions                 | jsonb                                  | YES      | '{}'::jsonb                           |
| weight                     | numeric                                | YES      |                                       |
| video_url                  | text                                   | YES      |                                       |
| stock_quantity             | integer                                | YES      | 0                                     |
| supplier_id                | uuid                                   | YES      |                                       |
| subcategory_id             | uuid                                   | YES      |                                       |
| brand                      | varchar                                | YES      |                                       |
| supplier_reference         | varchar                                | YES      |                                       |
| supplier_page_url          | text                                   | YES      |                                       |
| gtin                       | varchar                                | YES      |                                       |
| margin_percentage          | numeric                                | YES      |                                       |
| created_at                 | timestamptz                            | YES      | now()                                 |
| updated_at                 | timestamptz                            | YES      | now()                                 |
| stock_real                 | integer                                | YES      | 0                                     |
| stock_forecasted_in        | integer                                | YES      | 0                                     |
| stock_forecasted_out       | integer                                | YES      | 0                                     |
| description                | text                                   | YES      |                                       |
| technical_description      | text                                   | YES      |                                       |
| selling_points             | jsonb                                  | YES      |                                       |
| min_stock                  | integer                                | YES      | 0                                     |
| reorder_point              | integer                                | YES      | 10                                    |
| availability_type          | enum:availability_type_enum            | YES      | 'normal'::availability_type_enum      |
| target_margin_percentage   | numeric                                | YES      |                                       |
| product_type               | varchar                                | YES      | 'standard'::character varying         |
| assigned_client_id         | uuid                                   | YES      |                                       |
| creation_mode              | varchar                                | YES      | 'complete'::character varying         |
| requires_sample            | boolean                                | YES      | false                                 |
| archived_at                | timestamptz                            | YES      |                                       |
| sourcing_type              | varchar                                | YES      |                                       |
| variant_group_id           | uuid                                   | YES      |                                       |
| variant_position           | integer                                | YES      |                                       |
| completion_status          | text                                   | YES      | 'draft'::text                         |
| completion_percentage      | integer                                | YES      | 0                                     |
| suitable_rooms             | room_type[]                            | YES      | '{}'::room_type[]                     |
| item_group_id              | varchar                                | YES      |                                       |
| rejection_reason           | text                                   | YES      |                                       |
| cost_price                 | numeric                                | YES      | NULL::numeric                         |
| eco_tax_default            | numeric                                | YES      | 0                                     |
| search_vector              | tsvector                               | YES      |                                       |
| stock_status               | enum:stock_status_type                 | NO       | 'out_of_stock'::stock_status_type     |
| product_status             | enum:product_status_type               | NO       | 'active'::product_status_type         |
| supplier_moq               | integer                                | YES      | 1                                     |
| meta_title                 | text                                   | YES      |                                       |
| meta_description           | text                                   | YES      |                                       |
| is_published_online        | boolean                                | YES      | false                                 |
| publication_date           | timestamptz                            | YES      |                                       |
| unpublication_date         | timestamptz                            | YES      |                                       |
| enseigne_id                | uuid                                   | YES      |                                       |
| article_type               | enum:article_type                      | NO       | 'vente_de_marchandises'::article_type |
| affiliate_approval_status  | enum:affiliate_product_approval_status | YES      |                                       |
| affiliate_payout_ht        | numeric                                | YES      | NULL::numeric                         |
| affiliate_commission_rate  | numeric                                | YES      | NULL::numeric                         |
| affiliate_approved_at      | timestamptz                            | YES      |                                       |
| affiliate_approved_by      | uuid                                   | YES      |                                       |
| created_by_affiliate       | uuid                                   | YES      |                                       |
| affiliate_rejection_reason | text                                   | YES      |                                       |
| store_at_verone            | boolean                                | YES      | false                                 |
| style                      | text                                   | YES      |                                       |
| show_on_linkme_globe       | boolean                                | YES      | false                                 |
| cost_price_avg             | numeric                                | YES      |                                       |
| cost_price_min             | numeric                                | YES      |                                       |
| cost_price_max             | numeric                                | YES      |                                       |
| cost_price_last            | numeric                                | YES      |                                       |
| cost_price_count           | integer                                | NO       | 0                                     |
| cost_net_avg               | numeric                                | YES      |                                       |
| cost_net_min               | numeric                                | YES      |                                       |
| cost_net_max               | numeric                                | YES      |                                       |
| cost_net_last              | numeric                                | YES      |                                       |
| has_images                 | boolean                                | NO       | false                                 |
| internal_notes             | text                                   | YES      |                                       |
| sourcing_channel           | text                                   | YES      |                                       |
| shipping_cost_estimate     | numeric                                | YES      |                                       |
| shipping_class             | text                                   | YES      | 'standard'::text                      |

**Relations :**

- `variant_group_id` → `variant_groups.id`
- `supplier_id` → `organisations.id`
- `subcategory_id` → `subcategories.id`
- `enseigne_id` → `enseignes.id`
- `created_by_affiliate` → `linkme_affiliates.id`
- `assigned_client_id` → `organisations.id`

**RLS :** 3 policies

- `backoffice_full_access_products` : ALL — authenticated
- `linkme_users_view_catalog_products` : SELECT — authenticated
- `Allow anon read products on LinkMe globe` : SELECT — anon

**Triggers :** 18

- `products_auto_sku_trigger` : BEFORE INSERT
- `products_updated_at` : BEFORE UPDATE
- `trg_generate_product_slug_on_insert` : BEFORE INSERT
- `trg_log_product_commission_change` : AFTER UPDATE
- `trg_product_approval_notification` : AFTER UPDATE
- `trg_sync_stock_quantity` : BEFORE UPDATE
- `trg_sync_stock_status` : BEFORE UPDATE
- `trg_update_variant_group_count` : AFTER INSERT
- `trigger_auto_add_sourcing_to_linkme` : AFTER INSERT
- `trigger_calculate_completion` : BEFORE INSERT
- `trigger_log_sample_requirement_changes_products` : AFTER UPDATE
- `trigger_products_search_vector_update` : BEFORE INSERT
- `trigger_set_product_sku` : BEFORE INSERT
- `trigger_stock_negative_forecast_notification` : AFTER UPDATE
- `trigger_sync_item_group_id` : BEFORE INSERT
- `trigger_sync_stock_alert_tracking_v4` : AFTER INSERT
- `trigger_sync_suitable_rooms_on_product` : AFTER INSERT
- `trigger_validate_custom_product_assignment` : BEFORE INSERT

---

## subcategories

| Colonne          | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| category_id      | uuid        | NO       |                   |
| name             | varchar     | NO       |                   |
| slug             | varchar     | NO       |                   |
| description      | text        | YES      |                   |
| image_url        | text        | YES      |                   |
| display_order    | integer     | YES      | 0                 |
| is_active        | boolean     | YES      | true              |
| meta_title       | varchar     | YES      |                   |
| meta_description | text        | YES      |                   |
| created_at       | timestamptz | YES      | now()             |
| updated_at       | timestamptz | YES      | now()             |

**Relations :**

- `category_id` → `categories.id`

**RLS :** 2 policies

- `backoffice_full_access_subcategories` : ALL — authenticated
- `public_read_subcategories` : SELECT — anon,authenticated

**Triggers :** 1

- `trigger_subcategories_updated_at` : BEFORE UPDATE

---

## variant_groups

| Colonne               | Type        | Nullable | Default                                |
| --------------------- | ----------- | -------- | -------------------------------------- |
| id                    | uuid        | NO       | uuid_generate_v4()                     |
| name                  | varchar     | NO       |                                        |
| subcategory_id        | uuid        | NO       |                                        |
| dimensions_length     | numeric     | YES      |                                        |
| dimensions_width      | numeric     | YES      |                                        |
| dimensions_height     | numeric     | YES      |                                        |
| dimensions_unit       | varchar     | YES      | 'cm'::character varying                |
| product_count         | integer     | YES      | 0                                      |
| created_at            | timestamp   | YES      | now()                                  |
| updated_at            | timestamp   | YES      | now()                                  |
| variant_type          | varchar     | YES      |                                        |
| common_dimensions     | jsonb       | YES      |                                        |
| common_weight         | numeric     | YES      | NULL::numeric                          |
| auto_name_pattern     | text        | YES      | '{group_name} - {variant_value}'::text |
| style                 | text        | YES      |                                        |
| suitable_rooms        | room_type[] | YES      |                                        |
| base_sku              | varchar     | NO       |                                        |
| supplier_id           | uuid        | YES      |                                        |
| has_common_supplier   | boolean     | NO       | false                                  |
| archived_at           | timestamp   | YES      |                                        |
| has_common_weight     | boolean     | NO       | false                                  |
| has_common_cost_price | boolean     | NO       | false                                  |
| common_cost_price     | numeric     | YES      |                                        |
| common_eco_tax        | numeric     | YES      | 0                                      |

**Relations :**

- `supplier_id` → `organisations.id`
- `subcategory_id` → `subcategories.id`

**RLS :** 2 policies

- `backoffice_full_access_variant_groups` : ALL — authenticated
- `variant_groups_select_authenticated` : SELECT — authenticated

**Triggers :** 1

- `trigger_sync_suitable_rooms_on_group` : AFTER UPDATE

---
