# Domaine Autres — Schema Base de Donnees

_Generated: 2026-04-19 18:55_

**Tables : 51**

| Table                                                                       | Colonnes | FK  | RLS | Triggers |
| --------------------------------------------------------------------------- | -------- | --- | --- | -------- |
| [affiliate_pending_orders](#affiliate-pending-orders)                       | 61       | 0   | 0   | 0        |
| [ambassador_attributions](#ambassador-attributions)                         | 14       | 3   | 2   | 2        |
| [ambassador_codes](#ambassador-codes)                                       | 8        | 2   | 2   | 0        |
| [channel_price_lists](#channel-price-lists)                                 | 17       | 2   | 2   | 2        |
| [channel_pricing](#channel-pricing)                                         | 35       | 2   | 2   | 4        |
| [channel_pricing_history](#channel-pricing-history)                         | 16       | 3   | 2   | 0        |
| [channel_product_metadata](#channel-product-metadata)                       | 14       | 2   | 5   | 1        |
| [cms_pages](#cms-pages)                                                     | 9        | 0   | 2   | 0        |
| [customer_groups](#customer-groups)                                         | 13       | 0   | 2   | 1        |
| [customer_pricing](#customer-pricing)                                       | 19       | 1   | 2   | 1        |
| [customer_samples_view](#customer-samples-view)                             | 31       | 0   | 0   | 0        |
| [document_emails](#document-emails)                                         | 14       | 0   | 1   | 0        |
| [enseignes_with_stats](#enseignes-with-stats)                               | 12       | 0   | 0   | 0        |
| [expenses](#expenses)                                                       | 28       | 0   | 0   | 0        |
| [feed_configs](#feed-configs)                                               | 16       | 0   | 1   | 1        |
| [google_merchant_syncs](#google-merchant-syncs)                             | 18       | 1   | 5   | 1        |
| [group_price_lists](#group-price-lists)                                     | 9        | 2   | 2   | 0        |
| [linkme_globe_items](#linkme-globe-items)                                   | 4        | 0   | 0   | 0        |
| [linkme_order_items_enriched](#linkme-order-items-enriched)                 | 19       | 0   | 0   | 0        |
| [linkme_orders_enriched](#linkme-orders-enriched)                           | 21       | 0   | 0   | 0        |
| [linkme_orders_with_margins](#linkme-orders-with-margins)                   | 23       | 0   | 0   | 0        |
| [linkme_selection_items_with_pricing](#linkme-selection-items-with-pricing) | 14       | 0   | 0   | 0        |
| [meta_commerce_syncs](#meta-commerce-syncs)                                 | 18       | 1   | 1   | 1        |
| [order_discount_targets](#order-discount-targets)                           | 5        | 1   | 2   | 0        |
| [price_list_history](#price-list-history)                                   | 15       | 1   | 1   | 0        |
| [price_list_items](#price-list-items)                                       | 21       | 2   | 2   | 4        |
| [price_lists](#price-lists)                                                 | 18       | 0   | 2   | 2        |
| [promotion_usages](#promotion-usages)                                       | 6        | 3   | 2   | 0        |
| [sales_channels](#sales-channels)                                           | 22       | 0   | 2   | 1        |
| [site_ambassadors](#site-ambassadors)                                       | 26       | 0   | 3   | 1        |
| [sourcing_candidate_suppliers](#sourcing-candidate-suppliers)               | 11       | 2   | 1   | 1        |
| [sourcing_communications](#sourcing-communications)                         | 15       | 2   | 1   | 1        |
| [sourcing_photos](#sourcing-photos)                                         | 9        | 1   | 1   | 0        |
| [sourcing_price_history](#sourcing-price-history)                           | 9        | 2   | 1   | 0        |
| [sourcing_urls](#sourcing-urls)                                             | 6        | 1   | 1   | 0        |
| [stock_alerts_unified_view](#stock-alerts-unified-view)                     | 23       | 0   | 0   | 0        |
| [stock_alerts_view](#stock-alerts-view)                                     | 8        | 0   | 0   | 0        |
| [sync_runs](#sync-runs)                                                     | 27       | 0   | 1   | 0        |
| [v_all_payments](#v-all-payments)                                           | 23       | 0   | 0   | 0        |
| [v_expenses_with_details](#v-expenses-with-details)                         | 37       | 0   | 0   | 0        |
| [v_library_documents](#v-library-documents)                                 | 13       | 0   | 0   | 0        |
| [v_library_missing_documents](#v-library-missing-documents)                 | 12       | 0   | 0   | 0        |
| [v_linkme_users](#v-linkme-users)                                           | 18       | 0   | 0   | 0        |
| [v_matching_rules_with_org](#v-matching-rules-with-org)                     | 23       | 0   | 0   | 0        |
| [v_pcg_categories_tree](#v-pcg-categories-tree)                             | 10       | 0   | 0   | 0        |
| [v_pending_invoice_uploads](#v-pending-invoice-uploads)                     | 9        | 0   | 0   | 0        |
| [v_transaction_documents](#v-transaction-documents)                         | 25       | 0   | 0   | 0        |
| [v_transactions_missing_invoice](#v-transactions-missing-invoice)           | 20       | 0   | 0   | 0        |
| [v_transactions_unified](#v-transactions-unified)                           | 43       | 0   | 0   | 0        |
| [v_unique_unclassified_labels](#v-unique-unclassified-labels)               | 6        | 0   | 0   | 0        |
| [wishlist_items](#wishlist-items)                                           | 4        | 1   | 4   | 0        |

## affiliate_pending_orders

| Colonne                     | Type                    | Nullable | Default |
| --------------------------- | ----------------------- | -------- | ------- |
| id                          | uuid                    | YES      |         |
| order_number                | varchar                 | YES      |         |
| customer_id                 | uuid                    | YES      |         |
| currency                    | varchar                 | YES      |         |
| tax_rate                    | numeric                 | YES      |         |
| total_ht                    | numeric                 | YES      |         |
| total_ttc                   | numeric                 | YES      |         |
| expected_delivery_date      | date                    | YES      |         |
| shipping_address            | jsonb                   | YES      |         |
| billing_address             | jsonb                   | YES      |         |
| payment_terms               | varchar                 | YES      |         |
| notes                       | text                    | YES      |         |
| created_by                  | uuid                    | YES      |         |
| confirmed_by                | uuid                    | YES      |         |
| shipped_by                  | uuid                    | YES      |         |
| delivered_by                | uuid                    | YES      |         |
| confirmed_at                | timestamptz             | YES      |         |
| shipped_at                  | timestamptz             | YES      |         |
| delivered_at                | timestamptz             | YES      |         |
| cancelled_at                | timestamptz             | YES      |         |
| created_at                  | timestamptz             | YES      |         |
| updated_at                  | timestamptz             | YES      |         |
| paid_amount                 | numeric                 | YES      |         |
| paid_at                     | timestamptz             | YES      |         |
| warehouse_exit_at           | timestamptz             | YES      |         |
| warehouse_exit_by           | uuid                    | YES      |         |
| ready_for_shipment          | boolean                 | YES      |         |
| cancellation_reason         | text                    | YES      |         |
| customer_type               | text                    | YES      |         |
| channel_id                  | uuid                    | YES      |         |
| applied_discount_codes      | text[]                  | YES      |         |
| total_discount_amount       | numeric                 | YES      |         |
| cancelled_by                | uuid                    | YES      |         |
| eco_tax_total               | numeric                 | YES      |         |
| eco_tax_vat_rate            | numeric                 | YES      |         |
| closed_at                   | timestamptz             | YES      |         |
| closed_by                   | uuid                    | YES      |         |
| payment_terms_type          | enum:payment_terms_type | YES      |         |
| payment_terms_notes         | text                    | YES      |         |
| shipping_cost_ht            | numeric                 | YES      |         |
| insurance_cost_ht           | numeric                 | YES      |         |
| handling_cost_ht            | numeric                 | YES      |         |
| affiliate_total_ht          | numeric                 | YES      |         |
| affiliate_total_ttc         | numeric                 | YES      |         |
| linkme_selection_id         | uuid                    | YES      |         |
| created_by_affiliate_id     | uuid                    | YES      |         |
| pending_admin_validation    | boolean                 | YES      |         |
| payment_status_v2           | varchar                 | YES      |         |
| fees_vat_rate               | numeric                 | YES      |         |
| responsable_contact_id      | uuid                    | YES      |         |
| billing_contact_id          | uuid                    | YES      |         |
| delivery_contact_id         | uuid                    | YES      |         |
| invoiced_at                 | timestamptz             | YES      |         |
| order_date                  | date                    | YES      |         |
| status                      | enum:sales_order_status | YES      |         |
| is_shopping_center_delivery | boolean                 | YES      |         |
| accepts_semi_truck          | boolean                 | YES      |         |
| affiliate_name              | text                    | YES      |         |
| affiliate_email             | text                    | YES      |         |
| affiliate_type              | text                    | YES      |         |
| selection_name              | text                    | YES      |         |

---

## ambassador_attributions

| Colonne             | Type        | Nullable | Default             |
| ------------------- | ----------- | -------- | ------------------- |
| id                  | uuid        | NO       | gen_random_uuid()   |
| order_id            | uuid        | NO       |                     |
| ambassador_id       | uuid        | NO       |                     |
| code_id             | uuid        | YES      |                     |
| order_total_ht      | numeric     | NO       |                     |
| commission_rate     | numeric     | NO       |                     |
| prime_amount        | numeric     | NO       |                     |
| status              | text        | NO       | 'pending'::text     |
| validation_date     | timestamptz | YES      |                     |
| validated_at        | timestamptz | YES      |                     |
| paid_at             | timestamptz | YES      |                     |
| cancellation_reason | text        | YES      |                     |
| attribution_method  | text        | NO       | 'coupon_code'::text |
| created_at          | timestamptz | NO       | now()               |

**Relations :**

- `order_id` → `sales_orders.id`
- `ambassador_id` → `site_ambassadors.id`
- `code_id` → `ambassador_codes.id`

**RLS :** 2 policies

- `staff_full_access_ambassador_attributions` : ALL — authenticated
- `ambassador_read_own_attributions` : SELECT — authenticated

**Triggers :** 2

- `trg_increment_ambassador_code_usage` : AFTER INSERT
- `trg_update_ambassador_counters` : AFTER INSERT

---

## ambassador_codes

| Colonne       | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| ambassador_id | uuid        | NO       |                   |
| discount_id   | uuid        | NO       |                   |
| code          | text        | NO       |                   |
| qr_code_url   | text        | YES      |                   |
| is_active     | boolean     | NO       | true              |
| usage_count   | integer     | NO       | 0                 |
| created_at    | timestamptz | NO       | now()             |

**Relations :**

- `ambassador_id` → `site_ambassadors.id`
- `discount_id` → `order_discounts.id`

**RLS :** 2 policies

- `staff_full_access_ambassador_codes` : ALL — authenticated
- `ambassador_read_own_codes` : SELECT — authenticated

---

## channel_price_lists

| Colonne              | Type        | Nullable | Default     |
| -------------------- | ----------- | -------- | ----------- |
| channel_id           | uuid        | NO       |             |
| price_list_id        | uuid        | NO       |             |
| priority             | integer     | YES      | 100         |
| valid_from           | date        | YES      |             |
| valid_until          | date        | YES      |             |
| is_active            | boolean     | YES      | true        |
| is_default           | boolean     | YES      | false       |
| target_segments      | text[]      | YES      |             |
| excluded_segments    | text[]      | YES      |             |
| applicable_regions   | text[]      | YES      |             |
| excluded_regions     | text[]      | YES      |             |
| min_order_value      | numeric     | YES      |             |
| max_discount_allowed | numeric     | YES      |             |
| config               | jsonb       | YES      | '{}'::jsonb |
| created_at           | timestamptz | YES      | now()       |
| updated_at           | timestamptz | YES      | now()       |
| created_by           | uuid        | YES      |             |

**Relations :**

- `price_list_id` → `price_lists.id`
- `channel_id` → `sales_channels.id`

**RLS :** 2 policies

- `backoffice_full_access_channel_price_lists` : ALL — authenticated
- `channel_price_lists_select` : SELECT — authenticated

**Triggers :** 2

- `channel_price_lists_updated_at` : BEFORE UPDATE
- `ensure_single_default_channel` : AFTER INSERT

---

## channel_pricing

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| product_id               | uuid        | NO       |                   |
| channel_id               | uuid        | NO       |                   |
| custom_price_ht          | numeric     | YES      |                   |
| discount_rate            | numeric     | YES      |                   |
| markup_rate              | numeric     | YES      |                   |
| min_quantity             | integer     | YES      | 1                 |
| valid_from               | date        | YES      |                   |
| valid_until              | date        | YES      |                   |
| is_active                | boolean     | YES      | true              |
| notes                    | text        | YES      |                   |
| created_at               | timestamptz | YES      | now()             |
| updated_at               | timestamptz | YES      | now()             |
| created_by               | uuid        | YES      |                   |
| eco_participation_amount | numeric     | YES      | 0.00              |
| requires_assembly        | boolean     | YES      | false             |
| assembly_price           | numeric     | YES      | 0.00              |
| delivery_delay_weeks_min | integer     | YES      |                   |
| delivery_delay_weeks_max | integer     | YES      |                   |
| min_margin_rate          | numeric     | YES      | NULL::numeric     |
| max_margin_rate          | numeric     | YES      | NULL::numeric     |
| suggested_margin_rate    | numeric     | YES      | NULL::numeric     |
| channel_commission_rate  | numeric     | NO       | 0                 |
| is_public_showcase       | boolean     | YES      | false             |
| is_featured              | boolean     | YES      | false             |
| show_supplier            | boolean     | YES      | false             |
| views_count              | integer     | YES      | 0                 |
| selections_count         | integer     | YES      | 0                 |
| display_order            | integer     | YES      | 0                 |
| custom_title             | text        | YES      |                   |
| custom_description       | text        | YES      |                   |
| custom_selling_points    | text[]      | YES      |                   |
| public_price_ht          | numeric     | YES      |                   |
| buffer_rate              | numeric     | YES      | 0.05              |
| propagate_to_selections  | boolean     | YES      | false             |

**Relations :**

- `product_id` → `products.id`
- `channel_id` → `sales_channels.id`

**RLS :** 2 policies

- `backoffice_full_access_channel_pricing` : ALL — authenticated
- `channel_pricing_select_authenticated` : SELECT — authenticated

**Triggers :** 4

- `channel_pricing_updated_at` : BEFORE UPDATE
- `trg_auto_add_supplier_to_linkme` : AFTER INSERT
- `trg_sync_channel_pricing_to_selections` : BEFORE UPDATE
- `trg_track_channel_pricing_changes` : AFTER UPDATE

---

## channel_pricing_history

| Colonne             | Type        | Nullable | Default           |
| ------------------- | ----------- | -------- | ----------------- |
| id                  | uuid        | NO       | gen_random_uuid() |
| channel_pricing_id  | uuid        | NO       |                   |
| product_id          | uuid        | NO       |                   |
| channel_id          | uuid        | NO       |                   |
| old_custom_price_ht | numeric     | YES      |                   |
| old_discount_rate   | numeric     | YES      |                   |
| old_markup_rate     | numeric     | YES      |                   |
| new_custom_price_ht | numeric     | YES      |                   |
| new_discount_rate   | numeric     | YES      |                   |
| new_markup_rate     | numeric     | YES      |                   |
| change_type         | varchar     | NO       |                   |
| change_reason       | text        | YES      |                   |
| change_percentage   | numeric     | YES      |                   |
| changed_at          | timestamptz | NO       | now()             |
| changed_by          | uuid        | YES      |                   |
| metadata            | jsonb       | YES      | '{}'::jsonb       |

**Relations :**

- `channel_pricing_id` → `channel_pricing.id`
- `product_id` → `products.id`
- `channel_id` → `sales_channels.id`

**RLS :** 2 policies

- `backoffice_full_access_channel_pricing_history` : ALL — authenticated
- `channel_pricing_history_select_authenticated` : SELECT — authenticated

---

## channel_product_metadata

| Colonne                      | Type        | Nullable | Default           |
| ---------------------------- | ----------- | -------- | ----------------- |
| id                           | uuid        | NO       | gen_random_uuid() |
| product_id                   | uuid        | NO       |                   |
| channel_id                   | uuid        | NO       |                   |
| custom_title                 | text        | YES      |                   |
| custom_description           | text        | YES      |                   |
| metadata                     | jsonb       | YES      | '{}'::jsonb       |
| created_at                   | timestamptz | YES      | now()             |
| updated_at                   | timestamptz | YES      | now()             |
| created_by                   | uuid        | YES      |                   |
| updated_by                   | uuid        | YES      |                   |
| custom_description_long      | text        | YES      |                   |
| custom_technical_description | text        | YES      |                   |
| custom_brand                 | varchar     | YES      |                   |
| custom_selling_points        | jsonb       | YES      | '[]'::jsonb       |

**Relations :**

- `product_id` → `products.id`
- `channel_id` → `sales_channels.id`

**RLS :** 5 policies

- `backoffice_full_access_channel_product_metadata` : ALL — authenticated
- `channel_product_metadata_delete_policy` : DELETE — authenticated
- `channel_product_metadata_insert_policy` : INSERT — authenticated
- `channel_product_metadata_select_policy` : SELECT — authenticated
- `channel_product_metadata_update_policy` : UPDATE — authenticated

**Triggers :** 1

- `trigger_channel_product_metadata_updated_at` : BEFORE UPDATE

---

## cms_pages

| Colonne          | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| slug             | text        | NO       |                   |
| title            | text        | NO       |                   |
| content          | text        | NO       | ''::text          |
| meta_title       | text        | YES      |                   |
| meta_description | text        | YES      |                   |
| is_published     | boolean     | NO       | true              |
| updated_at       | timestamptz | NO       | now()             |
| updated_by       | uuid        | YES      |                   |

**RLS :** 2 policies

- `staff_full_access_cms_pages` : ALL — authenticated
- `public_read_published_cms_pages` : SELECT — anon,authenticated

---

## customer_groups

| Colonne               | Type        | Nullable | Default           |
| --------------------- | ----------- | -------- | ----------------- |
| id                    | uuid        | NO       | gen_random_uuid() |
| code                  | varchar     | NO       |                   |
| name                  | varchar     | NO       |                   |
| description           | text        | YES      |                   |
| group_type            | varchar     | NO       |                   |
| auto_assignment_rules | jsonb       | YES      | '{}'::jsonb       |
| min_annual_revenue    | numeric     | YES      |                   |
| min_orders_per_year   | integer     | YES      |                   |
| is_active             | boolean     | YES      | true              |
| member_count          | integer     | YES      | 0                 |
| created_at            | timestamptz | YES      | now()             |
| updated_at            | timestamptz | YES      | now()             |
| created_by            | uuid        | YES      |                   |

**RLS :** 2 policies

- `backoffice_full_access_customer_groups` : ALL — authenticated
- `customer_groups_select` : SELECT — authenticated

**Triggers :** 1

- `customer_groups_updated_at` : BEFORE UPDATE

---

## customer_pricing

| Colonne            | Type        | Nullable | Default                      |
| ------------------ | ----------- | -------- | ---------------------------- |
| id                 | uuid        | NO       | gen_random_uuid()            |
| customer_id        | uuid        | NO       |                              |
| customer_type      | varchar     | NO       |                              |
| product_id         | uuid        | NO       |                              |
| custom_price_ht    | numeric     | YES      |                              |
| discount_rate      | numeric     | YES      |                              |
| contract_reference | varchar     | YES      |                              |
| min_quantity       | integer     | YES      | 1                            |
| valid_from         | date        | NO       |                              |
| valid_until        | date        | YES      |                              |
| is_active          | boolean     | YES      | true                         |
| notes              | text        | YES      |                              |
| approval_status    | varchar     | YES      | 'pending'::character varying |
| approved_by        | uuid        | YES      |                              |
| approved_at        | timestamptz | YES      |                              |
| created_at         | timestamptz | YES      | now()                        |
| updated_at         | timestamptz | YES      | now()                        |
| created_by         | uuid        | YES      |                              |
| retrocession_rate  | numeric     | YES      | 0.00                         |

**Relations :**

- `product_id` → `products.id`

**RLS :** 2 policies

- `backoffice_full_access_customer_pricing` : ALL — authenticated
- `customer_pricing_select_authenticated` : SELECT — authenticated

**Triggers :** 1

- `customer_pricing_updated_at` : BEFORE UPDATE

---

## customer_samples_view

| Colonne                 | Type        | Nullable | Default |
| ----------------------- | ----------- | -------- | ------- |
| sample_id               | uuid        | YES      |         |
| purchase_order_id       | uuid        | YES      |         |
| product_id              | uuid        | YES      |         |
| sample_type             | text        | YES      |         |
| quantity                | integer     | YES      |         |
| unit_price_ht           | numeric     | YES      |         |
| sample_notes            | text        | YES      |         |
| archived_at             | timestamptz | YES      |         |
| sample_created_at       | timestamptz | YES      |         |
| sample_updated_at       | timestamptz | YES      |         |
| sample_status           | text        | YES      |         |
| product_sku             | varchar     | YES      |         |
| product_name            | varchar     | YES      |         |
| product_description     | text        | YES      |         |
| product_image           | text        | YES      |         |
| po_number               | varchar     | YES      |         |
| po_status               | text        | YES      |         |
| supplier_id             | uuid        | YES      |         |
| expected_delivery_date  | date        | YES      |         |
| po_created_at           | timestamptz | YES      |         |
| supplier_name           | varchar     | YES      |         |
| supplier_trade_name     | varchar     | YES      |         |
| customer_org_id         | uuid        | YES      |         |
| customer_org_legal_name | varchar     | YES      |         |
| customer_org_trade_name | varchar     | YES      |         |
| customer_ind_id         | uuid        | YES      |         |
| customer_ind_first_name | text        | YES      |         |
| customer_ind_last_name  | text        | YES      |         |
| customer_ind_email      | text        | YES      |         |
| customer_display_name   | varchar     | YES      |         |
| customer_type           | text        | YES      |         |

---

## document_emails

| Colonne         | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| document_type   | text        | NO       |                   |
| document_id     | text        | NO       |                   |
| document_number | text        | YES      |                   |
| recipient_email | text        | NO       |                   |
| subject         | text        | NO       |                   |
| message_body    | text        | YES      |                   |
| attachments     | jsonb       | YES      | '[]'::jsonb       |
| sent_at         | timestamptz | YES      | now()             |
| sent_by         | uuid        | YES      |                   |
| resend_email_id | text        | YES      |                   |
| status          | text        | NO       | 'sent'::text      |
| error_message   | text        | YES      |                   |
| created_at      | timestamptz | NO       | now()             |

**RLS :** 1 policy

- `staff_full_access` : ALL — authenticated

---

## enseignes_with_stats

| Colonne             | Type        | Nullable | Default |
| ------------------- | ----------- | -------- | ------- |
| id                  | uuid        | YES      |         |
| name                | varchar     | YES      |         |
| description         | text        | YES      |         |
| logo_url            | text        | YES      |         |
| member_count        | integer     | YES      |         |
| is_active           | boolean     | YES      |         |
| created_at          | timestamptz | YES      |         |
| updated_at          | timestamptz | YES      |         |
| created_by          | uuid        | YES      |         |
| active_member_count | bigint      | YES      |         |
| parent_company_name | varchar     | YES      |         |
| parent_company_id   | uuid        | YES      |         |

---

## expenses

| Colonne           | Type                  | Nullable | Default |
| ----------------- | --------------------- | -------- | ------- |
| id                | uuid                  | YES      |         |
| transaction_id    | uuid                  | YES      |         |
| counterparty_id   | uuid                  | YES      |         |
| organisation_id   | uuid                  | YES      |         |
| category          | varchar               | YES      |         |
| status            | text                  | YES      |         |
| role_type         | text                  | YES      |         |
| notes             | text                  | YES      |         |
| classified_at     | timestamptz           | YES      |         |
| classified_by     | uuid                  | YES      |         |
| created_at        | timestamptz           | YES      |         |
| updated_at        | timestamptz           | YES      |         |
| amount            | numeric               | YES      |         |
| currency          | text                  | YES      |         |
| label             | text                  | YES      |         |
| counterparty_name | text                  | YES      |         |
| counterparty_iban | text                  | YES      |         |
| side              | enum:transaction_side | YES      |         |
| emitted_at        | timestamptz           | YES      |         |
| settled_at        | timestamptz           | YES      |         |
| category_pcg      | varchar               | YES      |         |
| applied_rule_id   | uuid                  | YES      |         |
| matching_status   | enum:matching_status  | YES      |         |
| raw_data          | jsonb                 | YES      |         |
| vat_rate          | numeric               | YES      |         |
| amount_ht         | numeric               | YES      |         |
| amount_vat        | numeric               | YES      |         |
| vat_breakdown     | jsonb                 | YES      |         |

---

## feed_configs

| Colonne            | Type                         | Nullable | Default                           |
| ------------------ | ---------------------------- | -------- | --------------------------------- |
| id                 | uuid                         | NO       | uuid_generate_v4()                |
| name               | varchar                      | NO       |                                   |
| platform           | enum:feed_platform_type      | NO       |                                   |
| language           | enum:language_type           | NO       |                                   |
| format             | enum:feed_format_type        | YES      | 'csv'::feed_format_type           |
| schedule_frequency | enum:schedule_frequency_type | YES      | 'manual'::schedule_frequency_type |
| schedule_day       | integer                      | YES      |                                   |
| schedule_hour      | integer                      | YES      | 6                                 |
| filters            | jsonb                        | YES      | '{}'::jsonb                       |
| access_token       | varchar                      | NO       |                                   |
| webhook_url        | text                         | YES      |                                   |
| is_active          | boolean                      | YES      | true                              |
| last_export_at     | timestamptz                  | YES      |                                   |
| created_at         | timestamptz                  | YES      | now()                             |
| updated_at         | timestamptz                  | YES      | now()                             |
| created_by         | uuid                         | NO       |                                   |

**RLS :** 1 policy

- `backoffice_full_access_feed_configs` : ALL — authenticated

**Triggers :** 1

- `trigger_update_feed_configs_updated_at` : BEFORE UPDATE

---

## google_merchant_syncs

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| product_id               | uuid        | NO       |                   |
| google_product_id        | text        | NO       |                   |
| merchant_id              | text        | NO       |                   |
| sync_status              | text        | NO       |                   |
| sync_operation           | text        | NO       |                   |
| google_status            | text        | YES      |                   |
| google_status_detail     | jsonb       | YES      |                   |
| impressions              | integer     | YES      | 0                 |
| clicks                   | integer     | YES      | 0                 |
| conversions              | integer     | YES      | 0                 |
| revenue_ht               | numeric     | YES      | 0                 |
| synced_at                | timestamptz | YES      | now()             |
| google_status_checked_at | timestamptz | YES      |                   |
| error_message            | text        | YES      |                   |
| response_data            | jsonb       | YES      |                   |
| created_at               | timestamptz | YES      | now()             |
| updated_at               | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 5 policies

- `backoffice_full_access_google_merchant_syncs` : ALL — authenticated
- `google_merchant_syncs_delete_policy` : DELETE — service_role
- `google_merchant_syncs_insert_policy` : INSERT — service_role
- `google_merchant_syncs_select_policy` : SELECT — authenticated
- `google_merchant_syncs_update_policy` : UPDATE — service_role

**Triggers :** 1

- `trigger_google_merchant_syncs_updated_at` : BEFORE UPDATE

---

## group_price_lists

| Colonne       | Type        | Nullable | Default |
| ------------- | ----------- | -------- | ------- |
| group_id      | uuid        | NO       |         |
| price_list_id | uuid        | NO       |         |
| priority      | integer     | YES      | 100     |
| valid_from    | date        | YES      |         |
| valid_until   | date        | YES      |         |
| is_active     | boolean     | YES      | true    |
| is_default    | boolean     | YES      | false   |
| created_at    | timestamptz | YES      | now()   |
| created_by    | uuid        | YES      |         |

**Relations :**

- `group_id` → `customer_groups.id`
- `price_list_id` → `price_lists.id`

**RLS :** 2 policies

- `backoffice_full_access_group_price_lists` : ALL — authenticated
- `group_price_lists_select` : SELECT — authenticated

---

## linkme_globe_items

| Colonne   | Type    | Nullable | Default |
| --------- | ------- | -------- | ------- |
| item_type | text    | YES      |         |
| id        | text    | YES      |         |
| name      | varchar | YES      |         |
| image_url | text    | YES      |         |

---

## linkme_order_items_enriched

| Colonne                   | Type    | Nullable | Default |
| ------------------------- | ------- | -------- | ------- |
| id                        | uuid    | YES      |         |
| sales_order_id            | uuid    | YES      |         |
| product_id                | uuid    | YES      |         |
| quantity                  | integer | YES      |         |
| unit_price_ht             | numeric | YES      |         |
| total_ht                  | numeric | YES      |         |
| linkme_selection_item_id  | uuid    | YES      |         |
| tax_rate                  | numeric | YES      |         |
| product_name              | varchar | YES      |         |
| product_sku               | varchar | YES      |         |
| product_image_url         | text    | YES      |         |
| base_price_ht             | numeric | YES      |         |
| margin_rate               | numeric | YES      |         |
| commission_rate           | numeric | YES      |         |
| selling_price_ht          | numeric | YES      |         |
| affiliate_margin          | numeric | YES      |         |
| retrocession_rate         | numeric | YES      |         |
| created_by_affiliate      | uuid    | YES      |         |
| affiliate_commission_rate | numeric | YES      |         |

---

## linkme_orders_enriched

| Colonne              | Type                    | Nullable | Default |
| -------------------- | ----------------------- | -------- | ------- |
| id                   | uuid                    | YES      |         |
| order_number         | varchar                 | YES      |         |
| status               | enum:sales_order_status | YES      |         |
| payment_status       | varchar                 | YES      |         |
| total_ht             | numeric                 | YES      |         |
| total_ttc            | numeric                 | YES      |         |
| customer_type        | text                    | YES      |         |
| customer_id          | uuid                    | YES      |         |
| created_at           | timestamptz             | YES      |         |
| updated_at           | timestamptz             | YES      |         |
| channel_id           | uuid                    | YES      |         |
| customer_name        | varchar                 | YES      |         |
| customer_address     | text                    | YES      |         |
| customer_postal_code | text                    | YES      |         |
| customer_city        | text                    | YES      |         |
| customer_email       | text                    | YES      |         |
| customer_phone       | text                    | YES      |         |
| affiliate_name       | text                    | YES      |         |
| affiliate_type       | text                    | YES      |         |
| selection_name       | text                    | YES      |         |
| selection_id         | uuid                    | YES      |         |

---

## linkme_orders_with_margins

| Colonne                | Type                    | Nullable | Default |
| ---------------------- | ----------------------- | -------- | ------- |
| id                     | uuid                    | YES      |         |
| order_number           | varchar                 | YES      |         |
| status                 | enum:sales_order_status | YES      |         |
| payment_status         | varchar                 | YES      |         |
| total_ht               | numeric                 | YES      |         |
| total_ttc              | numeric                 | YES      |         |
| customer_type          | text                    | YES      |         |
| customer_id            | uuid                    | YES      |         |
| created_at             | timestamptz             | YES      |         |
| updated_at             | timestamptz             | YES      |         |
| channel_id             | uuid                    | YES      |         |
| customer_name          | varchar                 | YES      |         |
| customer_address       | text                    | YES      |         |
| customer_postal_code   | text                    | YES      |         |
| customer_city          | text                    | YES      |         |
| customer_email         | text                    | YES      |         |
| customer_phone         | text                    | YES      |         |
| affiliate_name         | text                    | YES      |         |
| affiliate_type         | text                    | YES      |         |
| selection_name         | text                    | YES      |         |
| selection_id           | uuid                    | YES      |         |
| total_affiliate_margin | numeric                 | YES      |         |
| items_count            | bigint                  | YES      |         |

---

## linkme_selection_items_with_pricing

| Colonne           | Type    | Nullable | Default |
| ----------------- | ------- | -------- | ------- |
| id                | uuid    | YES      |         |
| selection_id      | uuid    | YES      |         |
| product_id        | uuid    | YES      |         |
| product_name      | varchar | YES      |         |
| product_sku       | varchar | YES      |         |
| product_image     | text    | YES      |         |
| base_price_ht     | numeric | YES      |         |
| selling_price_ht  | numeric | YES      |         |
| selling_price_ttc | numeric | YES      |         |
| margin_rate       | numeric | YES      |         |
| category_name     | varchar | YES      |         |
| subcategory_id    | uuid    | YES      |         |
| subcategory_name  | varchar | YES      |         |
| display_order     | integer | YES      |         |

---

## meta_commerce_syncs

| Colonne                | Type        | Nullable | Default                  |
| ---------------------- | ----------- | -------- | ------------------------ |
| id                     | uuid        | NO       | gen_random_uuid()        |
| product_id             | uuid        | NO       |                          |
| catalog_id             | text        | NO       | '1223749196006844'::text |
| meta_product_id        | text        | YES      |                          |
| sync_status            | text        | NO       | 'pending'::text          |
| sync_operation         | text        | NO       | 'insert'::text           |
| meta_status            | text        | YES      | 'pending'::text          |
| meta_status_detail     | jsonb       | YES      |                          |
| impressions            | integer     | YES      | 0                        |
| clicks                 | integer     | YES      | 0                        |
| conversions            | integer     | YES      | 0                        |
| revenue_ht             | numeric     | YES      | 0                        |
| meta_status_checked_at | timestamptz | YES      |                          |
| error_message          | text        | YES      |                          |
| response_data          | jsonb       | YES      |                          |
| synced_at              | timestamptz | YES      | now()                    |
| created_at             | timestamptz | YES      | now()                    |
| updated_at             | timestamptz | YES      | now()                    |

**Relations :**

- `product_id` → `products.id`

**RLS :** 1 policy

- `staff_full_access_meta_commerce_syncs` : ALL — authenticated

**Triggers :** 1

- `set_meta_commerce_syncs_updated_at` : BEFORE UPDATE

---

## order_discount_targets

| Colonne     | Type        | Nullable | Default           |
| ----------- | ----------- | -------- | ----------------- |
| id          | uuid        | NO       | gen_random_uuid() |
| discount_id | uuid        | NO       |                   |
| target_type | text        | NO       |                   |
| target_id   | uuid        | NO       |                   |
| created_at  | timestamptz | NO       | now()             |

**Relations :**

- `discount_id` → `order_discounts.id`

**RLS :** 2 policies

- `staff_full_access_order_discount_targets` : ALL — authenticated
- `authenticated_read_order_discount_targets` : SELECT — authenticated

---

## price_list_history

| Colonne            | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| price_list_item_id | uuid        | YES      |                   |
| price_list_id      | uuid        | NO       |                   |
| product_id         | uuid        | NO       |                   |
| price_ht_before    | numeric     | YES      |                   |
| price_ht_after     | numeric     | NO       |                   |
| change_type        | varchar     | NO       |                   |
| change_reason      | text        | YES      |                   |
| min_quantity       | integer     | YES      |                   |
| max_quantity       | integer     | YES      |                   |
| changed_at         | timestamptz | YES      | now()             |
| changed_by         | uuid        | YES      |                   |
| ip_address         | inet        | YES      |                   |
| user_agent         | text        | YES      |                   |
| source             | varchar     | YES      |                   |

**Relations :**

- `price_list_item_id` → `price_list_items.id`

**RLS :** 1 policy

- `backoffice_full_access_price_list_history` : ALL — authenticated

---

## price_list_items

| Colonne                | Type        | Nullable | Default           |
| ---------------------- | ----------- | -------- | ----------------- |
| id                     | uuid        | NO       | gen_random_uuid() |
| price_list_id          | uuid        | NO       |                   |
| product_id             | uuid        | NO       |                   |
| price_ht               | numeric     | NO       |                   |
| cost_price             | numeric     | YES      |                   |
| suggested_retail_price | numeric     | YES      |                   |
| min_quantity           | integer     | YES      | 1                 |
| max_quantity           | integer     | YES      |                   |
| currency               | varchar     | YES      |                   |
| discount_rate          | numeric     | YES      |                   |
| margin_rate            | numeric     | YES      |                   |
| valid_from             | date        | YES      |                   |
| valid_until            | date        | YES      |                   |
| is_active              | boolean     | YES      | true              |
| notes                  | text        | YES      |                   |
| tags                   | text[]      | YES      |                   |
| attributes             | jsonb       | YES      | '{}'::jsonb       |
| created_at             | timestamptz | YES      | now()             |
| updated_at             | timestamptz | YES      | now()             |
| created_by             | uuid        | YES      |                   |
| updated_by             | uuid        | YES      |                   |

**Relations :**

- `price_list_id` → `price_lists.id`
- `product_id` → `products.id`

**RLS :** 2 policies

- `backoffice_full_access_price_list_items` : ALL — authenticated
- `price_items_select_authenticated` : SELECT — authenticated

**Triggers :** 4

- `log_price_changes` : AFTER INSERT
- `price_list_items_updated_at` : BEFORE UPDATE
- `trigger_refresh_prices_on_items` : AFTER INSERT
- `update_product_count` : AFTER INSERT

---

## price_lists

| Colonne           | Type        | Nullable | Default                  |
| ----------------- | ----------- | -------- | ------------------------ |
| id                | uuid        | NO       | gen_random_uuid()        |
| code              | varchar     | NO       |                          |
| name              | varchar     | NO       |                          |
| description       | text        | YES      |                          |
| list_type         | varchar     | NO       |                          |
| priority          | integer     | NO       | 100                      |
| currency          | varchar     | YES      | 'EUR'::character varying |
| includes_tax      | boolean     | YES      | false                    |
| valid_from        | date        | YES      |                          |
| valid_until       | date        | YES      |                          |
| is_active         | boolean     | YES      | true                     |
| requires_approval | boolean     | YES      | false                    |
| config            | jsonb       | YES      | '{}'::jsonb              |
| product_count     | integer     | YES      | 0                        |
| created_at        | timestamptz | YES      | now()                    |
| updated_at        | timestamptz | YES      | now()                    |
| created_by        | uuid        | YES      |                          |
| updated_by        | uuid        | YES      |                          |

**RLS :** 2 policies

- `backoffice_full_access_price_lists` : ALL — authenticated
- `price_lists_select_authenticated` : SELECT — authenticated

**Triggers :** 2

- `price_lists_updated_at` : BEFORE UPDATE
- `trigger_refresh_prices_on_lists` : AFTER UPDATE

---

## promotion_usages

| Colonne         | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| discount_id     | uuid        | NO       |                   |
| order_id        | uuid        | NO       |                   |
| customer_id     | uuid        | YES      |                   |
| discount_amount | numeric     | NO       |                   |
| used_at         | timestamptz | NO       | now()             |

**Relations :**

- `discount_id` → `order_discounts.id`
- `order_id` → `sales_orders.id`
- `customer_id` → `individual_customers.id`

**RLS :** 2 policies

- `staff_full_access_promotion_usages` : ALL — authenticated
- `staff_read_promotion_usages` : SELECT — authenticated

---

## sales_channels

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| code                     | varchar     | NO       |                   |
| name                     | varchar     | NO       |                   |
| description              | text        | YES      |                   |
| default_discount_rate    | numeric     | YES      |                   |
| is_active                | boolean     | YES      | true              |
| requires_approval        | boolean     | YES      | false             |
| min_order_value          | numeric     | YES      |                   |
| display_order            | integer     | YES      | 0                 |
| icon_name                | varchar     | YES      |                   |
| created_at               | timestamptz | YES      | now()             |
| updated_at               | timestamptz | YES      | now()             |
| created_by               | uuid        | YES      |                   |
| domain_url               | text        | YES      |                   |
| site_name                | text        | YES      |                   |
| site_logo_url            | text        | YES      |                   |
| default_meta_title       | text        | YES      |                   |
| default_meta_description | text        | YES      |                   |
| meta_keywords            | text[]      | YES      |                   |
| contact_email            | text        | YES      |                   |
| contact_phone            | text        | YES      |                   |
| config                   | jsonb       | YES      | '{}'::jsonb       |

**RLS :** 2 policies

- `backoffice_full_access_sales_channels` : ALL — authenticated
- `sales_channels_select_authenticated` : SELECT — authenticated

**Triggers :** 1

- `sales_channels_updated_at` : BEFORE UPDATE

---

## site_ambassadors

| Colonne               | Type        | Nullable | Default           |
| --------------------- | ----------- | -------- | ----------------- |
| id                    | uuid        | NO       | gen_random_uuid() |
| first_name            | text        | NO       |                   |
| last_name             | text        | NO       |                   |
| email                 | text        | NO       |                   |
| phone                 | text        | YES      |                   |
| auth_user_id          | uuid        | YES      |                   |
| iban                  | text        | YES      |                   |
| bic                   | text        | YES      |                   |
| bank_name             | text        | YES      |                   |
| account_holder_name   | text        | YES      |                   |
| siret                 | text        | YES      |                   |
| commission_rate       | numeric     | NO       | 10.00             |
| discount_rate         | numeric     | NO       | 10.00             |
| is_active             | boolean     | NO       | true              |
| cgu_accepted_at       | timestamptz | YES      |                   |
| cgu_version           | text        | YES      |                   |
| total_sales_generated | numeric     | NO       | 0                 |
| total_primes_earned   | numeric     | NO       | 0                 |
| total_primes_paid     | numeric     | NO       | 0                 |
| current_balance       | numeric     | NO       | 0                 |
| annual_earnings_ytd   | numeric     | NO       | 0                 |
| siret_required        | boolean     | NO       | false             |
| notes                 | text        | YES      |                   |
| created_by            | uuid        | YES      |                   |
| created_at            | timestamptz | NO       | now()             |
| updated_at            | timestamptz | NO       | now()             |

**RLS :** 3 policies

- `staff_full_access_site_ambassadors` : ALL — authenticated
- `ambassador_read_own_profile` : SELECT — authenticated
- `ambassador_update_own_profile` : UPDATE — authenticated

**Triggers :** 1

- `trg_set_updated_at_site_ambassadors` : BEFORE UPDATE

---

## sourcing_candidate_suppliers

| Colonne          | Type        | Nullable | Default            |
| ---------------- | ----------- | -------- | ------------------ |
| id               | uuid        | NO       | gen_random_uuid()  |
| product_id       | uuid        | NO       |                    |
| supplier_id      | uuid        | NO       |                    |
| status           | text        | YES      | 'identified'::text |
| response_date    | timestamptz | YES      |                    |
| quoted_price     | numeric     | YES      |                    |
| quoted_moq       | integer     | YES      |                    |
| quoted_lead_days | integer     | YES      |                    |
| notes            | text        | YES      |                    |
| created_at       | timestamptz | YES      | now()              |
| updated_at       | timestamptz | YES      | now()              |

**Relations :**

- `product_id` → `products.id`
- `supplier_id` → `organisations.id`

**RLS :** 1 policy

- `staff_full_access_sourcing_candidates` : ALL — authenticated

**Triggers :** 1

- `trigger_sourcing_candidates_updated_at` : BEFORE UPDATE

---

## sourcing_communications

| Colonne         | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| product_id      | uuid        | NO       |                   |
| supplier_id     | uuid        | YES      |                   |
| channel         | text        | NO       |                   |
| direction       | text        | NO       |                   |
| summary         | text        | NO       |                   |
| contact_name    | text        | YES      |                   |
| attachments     | jsonb       | YES      | '[]'::jsonb       |
| next_action     | text        | YES      |                   |
| follow_up_date  | date        | YES      |                   |
| is_resolved     | boolean     | YES      | false             |
| communicated_at | timestamptz | NO       | now()             |
| logged_by       | uuid        | YES      |                   |
| created_at      | timestamptz | YES      | now()             |
| updated_at      | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`
- `supplier_id` → `organisations.id`

**RLS :** 1 policy

- `staff_full_access_sourcing_comms` : ALL — authenticated

**Triggers :** 1

- `trigger_sourcing_comms_updated_at` : BEFORE UPDATE

---

## sourcing_photos

| Colonne      | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| product_id   | uuid        | NO       |                   |
| storage_path | text        | NO       |                   |
| public_url   | text        | YES      |                   |
| photo_type   | text        | NO       |                   |
| caption      | text        | YES      |                   |
| sort_order   | integer     | YES      | 0                 |
| created_by   | uuid        | YES      |                   |
| created_at   | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 1 policy

- `staff_full_access_sourcing_photos` : ALL — authenticated

---

## sourcing_price_history

| Colonne       | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| product_id    | uuid        | NO       |                   |
| supplier_id   | uuid        | YES      |                   |
| price         | numeric     | NO       |                   |
| currency      | text        | YES      | 'USD'::text       |
| quantity      | integer     | YES      |                   |
| proposed_by   | text        | YES      |                   |
| notes         | text        | YES      |                   |
| negotiated_at | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`
- `supplier_id` → `organisations.id`

**RLS :** 1 policy

- `staff_full_access_sourcing_prices` : ALL — authenticated

---

## sourcing_urls

| Colonne    | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| product_id | uuid        | NO       |                   |
| url        | text        | NO       |                   |
| platform   | text        | YES      |                   |
| label      | text        | YES      |                   |
| created_at | timestamptz | YES      | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 1 policy

- `staff_full_access_sourcing_urls` : ALL — authenticated

---

## stock_alerts_unified_view

| Colonne                       | Type        | Nullable | Default |
| ----------------------------- | ----------- | -------- | ------- |
| id                            | uuid        | YES      |         |
| product_id                    | uuid        | YES      |         |
| product_name                  | varchar     | YES      |         |
| sku                           | varchar     | YES      |         |
| stock_real                    | integer     | YES      |         |
| stock_forecasted_in           | integer     | YES      |         |
| stock_forecasted_out          | integer     | YES      |         |
| min_stock                     | integer     | YES      |         |
| stock_previsionnel            | integer     | YES      |         |
| stock_previsionnel_avec_draft | integer     | YES      |         |
| draft_order_id                | uuid        | YES      |         |
| draft_order_number            | varchar     | YES      |         |
| quantity_in_draft             | integer     | YES      |         |
| validated                     | boolean     | YES      |         |
| validated_at                  | timestamptz | YES      |         |
| supplier_id                   | uuid        | YES      |         |
| product_image_url             | text        | YES      |         |
| alert_type                    | text        | YES      |         |
| alert_priority                | integer     | YES      |         |
| shortage_quantity             | integer     | YES      |         |
| alert_color                   | text        | YES      |         |
| severity                      | text        | YES      |         |
| is_in_draft                   | boolean     | YES      |         |

---

## stock_alerts_view

| Colonne          | Type    | Nullable | Default |
| ---------------- | ------- | -------- | ------- |
| product_id       | uuid    | YES      |         |
| product_name     | varchar | YES      |         |
| sku              | varchar | YES      |         |
| stock_quantity   | integer | YES      |         |
| min_stock        | integer | YES      |         |
| has_been_ordered | boolean | YES      |         |
| alert_status     | text    | YES      |         |
| alert_priority   | integer | YES      |         |

---

## sync_runs

| Colonne                    | Type                 | Nullable | Default                    |
| -------------------------- | -------------------- | -------- | -------------------------- |
| id                         | uuid                 | NO       | gen_random_uuid()          |
| sync_type                  | enum:sync_type       | NO       |                            |
| status                     | enum:sync_run_status | NO       | 'pending'::sync_run_status |
| cursor                     | text                 | YES      |                            |
| page_size                  | integer              | YES      | 100                        |
| current_page               | integer              | YES      | 0                          |
| total_pages                | integer              | YES      |                            |
| sync_from                  | timestamptz          | YES      |                            |
| sync_to                    | timestamptz          | YES      |                            |
| last_synced_transaction_id | text                 | YES      |                            |
| items_fetched              | integer              | YES      | 0                          |
| items_created              | integer              | YES      | 0                          |
| items_updated              | integer              | YES      | 0                          |
| items_skipped              | integer              | YES      | 0                          |
| items_failed               | integer              | YES      | 0                          |
| errors                     | jsonb                | YES      | '[]'::jsonb                |
| last_error                 | text                 | YES      |                            |
| lock_token                 | uuid                 | YES      |                            |
| locked_at                  | timestamptz          | YES      |                            |
| lock_expires_at            | timestamptz          | YES      |                            |
| started_at                 | timestamptz          | YES      |                            |
| completed_at               | timestamptz          | YES      |                            |
| duration_ms                | integer              | YES      |                            |
| triggered_by               | text                 | YES      | 'manual'::text             |
| triggered_by_user_id       | uuid                 | YES      |                            |
| created_at                 | timestamptz          | NO       | now()                      |
| updated_at                 | timestamptz          | NO       | now()                      |

**RLS :** 1 policy

- `backoffice_full_access_sync_runs` : ALL — authenticated

---

## v_all_payments

| Colonne                | Type        | Nullable | Default |
| ---------------------- | ----------- | -------- | ------- |
| payment_id             | uuid        | YES      |         |
| payment_source         | text        | YES      |         |
| order_type             | text        | YES      |         |
| order_id               | uuid        | YES      |         |
| order_number           | varchar     | YES      |         |
| order_total_ttc        | numeric     | YES      |         |
| order_payment_status   | varchar     | YES      |         |
| partner_id             | uuid        | YES      |         |
| partner_name           | varchar     | YES      |         |
| amount                 | numeric     | YES      |         |
| payment_date           | timestamptz | YES      |         |
| payment_type           | text        | YES      |         |
| reference              | text        | YES      |         |
| note                   | text        | YES      |         |
| bank_transaction_id    | uuid        | YES      |         |
| bank_transaction_label | text        | YES      |         |
| bank_settled_at        | timestamptz | YES      |         |
| bank_counterparty_name | text        | YES      |         |
| document_id            | uuid        | YES      |         |
| document_number        | text        | YES      |         |
| document_type          | text        | YES      |         |
| created_by             | uuid        | YES      |         |
| created_at             | timestamptz | YES      |         |

---

## v_expenses_with_details

| Colonne                        | Type                   | Nullable | Default |
| ------------------------------ | ---------------------- | -------- | ------- |
| id                             | uuid                   | YES      |         |
| transaction_id                 | uuid                   | YES      |         |
| counterparty_id                | uuid                   | YES      |         |
| organisation_id                | uuid                   | YES      |         |
| category                       | varchar                | YES      |         |
| status                         | text                   | YES      |         |
| role_type                      | text                   | YES      |         |
| notes                          | text                   | YES      |         |
| classified_at                  | timestamptz            | YES      |         |
| classified_by                  | uuid                   | YES      |         |
| created_at                     | timestamptz            | YES      |         |
| updated_at                     | timestamptz            | YES      |         |
| amount                         | numeric                | YES      |         |
| currency                       | text                   | YES      |         |
| label                          | text                   | YES      |         |
| transaction_counterparty_name  | text                   | YES      |         |
| transaction_iban               | text                   | YES      |         |
| side                           | enum:transaction_side  | YES      |         |
| emitted_at                     | timestamptz            | YES      |         |
| settled_at                     | timestamptz            | YES      |         |
| category_pcg                   | varchar                | YES      |         |
| applied_rule_id                | uuid                   | YES      |         |
| raw_data                       | jsonb                  | YES      |         |
| vat_rate                       | numeric                | YES      |         |
| vat_breakdown                  | jsonb                  | YES      |         |
| amount_ht                      | numeric                | YES      |         |
| amount_vat                     | numeric                | YES      |         |
| vat_source                     | text                   | YES      |         |
| justification_optional         | boolean                | YES      |         |
| counterparty_display_name      | text                   | YES      |         |
| counterparty_name_normalized   | text                   | YES      |         |
| organisation_name              | varchar                | YES      |         |
| organisation_type              | enum:organisation_type | YES      |         |
| has_attachment                 | boolean                | YES      |         |
| rule_match_value               | text                   | YES      |         |
| rule_display_label             | text                   | YES      |         |
| rule_allow_multiple_categories | boolean                | YES      |         |

---

## v_library_documents

| Colonne            | Type        | Nullable | Default |
| ------------------ | ----------- | -------- | ------- |
| id                 | uuid        | YES      |         |
| source_table       | text        | YES      |         |
| document_type      | text        | YES      |         |
| document_direction | text        | YES      |         |
| document_number    | text        | YES      |         |
| document_date      | date        | YES      |         |
| partner_name       | varchar     | YES      |         |
| total_ht           | numeric     | YES      |         |
| total_ttc          | numeric     | YES      |         |
| status             | text        | YES      |         |
| pdf_url            | text        | YES      |         |
| pcg_code           | text        | YES      |         |
| created_at         | timestamptz | YES      |         |

---

## v_library_missing_documents

| Colonne            | Type        | Nullable | Default |
| ------------------ | ----------- | -------- | ------- |
| id                 | uuid        | YES      |         |
| source_table       | text        | YES      |         |
| document_type      | text        | YES      |         |
| document_direction | text        | YES      |         |
| document_number    | text        | YES      |         |
| document_date      | date        | YES      |         |
| partner_name       | varchar     | YES      |         |
| total_ht           | numeric     | YES      |         |
| total_ttc          | numeric     | YES      |         |
| status             | text        | YES      |         |
| pcg_code           | text        | YES      |         |
| created_at         | timestamptz | YES      |         |

---

## v_linkme_users

| Colonne             | Type        | Nullable | Default |
| ------------------- | ----------- | -------- | ------- |
| user_id             | uuid        | YES      |         |
| user_role_id        | uuid        | YES      |         |
| email               | varchar     | YES      |         |
| first_name          | text        | YES      |         |
| last_name           | text        | YES      |         |
| avatar_url          | text        | YES      |         |
| phone               | text        | YES      |         |
| linkme_role         | text        | YES      |         |
| enseigne_id         | uuid        | YES      |         |
| organisation_id     | uuid        | YES      |         |
| permissions         | text[]      | YES      |         |
| is_active           | boolean     | YES      |         |
| role_created_at     | timestamptz | YES      |         |
| default_margin_rate | numeric     | YES      |         |
| enseigne_name       | varchar     | YES      |         |
| enseigne_logo       | text        | YES      |         |
| organisation_name   | varchar     | YES      |         |
| organisation_logo   | text        | YES      |         |

---

## v_matching_rules_with_org

| Colonne                   | Type                         | Nullable | Default |
| ------------------------- | ---------------------------- | -------- | ------- |
| id                        | uuid                         | YES      |         |
| match_type                | text                         | YES      |         |
| match_value               | text                         | YES      |         |
| match_patterns            | text[]                       | YES      |         |
| display_label             | text                         | YES      |         |
| default_category          | text                         | YES      |         |
| default_vat_rate          | numeric                      | YES      |         |
| default_role_type         | text                         | YES      |         |
| organisation_id           | uuid                         | YES      |         |
| individual_customer_id    | uuid                         | YES      |         |
| counterparty_type         | text                         | YES      |         |
| is_active                 | boolean                      | YES      |         |
| priority                  | integer                      | YES      |         |
| allow_multiple_categories | boolean                      | YES      |         |
| justification_optional    | boolean                      | YES      |         |
| applies_to_side           | enum:transaction_side_filter | YES      |         |
| created_at                | timestamptz                  | YES      |         |
| created_by                | uuid                         | YES      |         |
| enabled                   | boolean                      | YES      |         |
| organisation_name         | varchar                      | YES      |         |
| organisation_type         | enum:organisation_type       | YES      |         |
| category_label            | text                         | YES      |         |
| matched_expenses_count    | integer                      | YES      |         |

---

## v_pcg_categories_tree

| Colonne       | Type    | Nullable | Default |
| ------------- | ------- | -------- | ------- |
| id            | uuid    | YES      |         |
| code          | varchar | YES      |         |
| label         | varchar | YES      |         |
| parent_code   | varchar | YES      |         |
| level         | integer | YES      |         |
| description   | text    | YES      |         |
| is_active     | boolean | YES      |         |
| display_order | integer | YES      |         |
| parent_label  | varchar | YES      |         |
| full_path     | varchar | YES      |         |

---

## v_pending_invoice_uploads

| Colonne        | Type               | Nullable | Default |
| -------------- | ------------------ | -------- | ------- |
| id             | uuid               | YES      |         |
| document_type  | enum:document_type | YES      |         |
| file_name      | text               | YES      |         |
| file_url       | text               | YES      |         |
| amount_ttc     | numeric            | YES      |         |
| status         | text               | YES      |         |
| created_at     | timestamptz        | YES      |         |
| uploader_name  | text               | YES      |         |
| uploader_email | text               | YES      |         |

---

## v_transaction_documents

| Colonne               | Type                       | Nullable | Default |
| --------------------- | -------------------------- | -------- | ------- |
| link_id               | uuid                       | YES      |         |
| transaction_id        | uuid                       | YES      |         |
| document_id           | uuid                       | YES      |         |
| sales_order_id        | uuid                       | YES      |         |
| purchase_order_id     | uuid                       | YES      |         |
| link_type             | varchar                    | YES      |         |
| allocated_amount      | numeric                    | YES      |         |
| notes                 | text                       | YES      |         |
| created_at            | timestamptz                | YES      |         |
| transaction_label     | text                       | YES      |         |
| transaction_amount    | numeric                    | YES      |         |
| transaction_date      | timestamptz                | YES      |         |
| transaction_side      | enum:transaction_side      | YES      |         |
| document_type         | enum:document_type         | YES      |         |
| document_number       | text                       | YES      |         |
| document_amount       | numeric                    | YES      |         |
| document_date         | date                       | YES      |         |
| document_status       | enum:document_status       | YES      |         |
| organisation_name     | varchar                    | YES      |         |
| sales_order_number    | varchar                    | YES      |         |
| sales_order_amount    | numeric                    | YES      |         |
| sales_order_status    | enum:sales_order_status    | YES      |         |
| purchase_order_number | varchar                    | YES      |         |
| purchase_order_amount | numeric                    | YES      |         |
| purchase_order_status | enum:purchase_order_status | YES      |         |

---

## v_transactions_missing_invoice

| Colonne               | Type                  | Nullable | Default |
| --------------------- | --------------------- | -------- | ------- |
| id                    | uuid                  | YES      |         |
| transaction_id        | text                  | YES      |         |
| amount                | numeric               | YES      |         |
| currency              | text                  | YES      |         |
| side                  | enum:transaction_side | YES      |         |
| label                 | text                  | YES      |         |
| counterparty_name     | text                  | YES      |         |
| emitted_at            | timestamptz           | YES      |         |
| settled_at            | timestamptz           | YES      |         |
| matching_status       | enum:matching_status  | YES      |         |
| matched_document_id   | uuid                  | YES      |         |
| has_attachment        | boolean               | YES      |         |
| financial_document_id | uuid                  | YES      |         |
| document_number       | text                  | YES      |         |
| invoice_source        | text                  | YES      |         |
| upload_status         | text                  | YES      |         |
| qonto_attachment_id   | text                  | YES      |         |
| sales_order_id        | uuid                  | YES      |         |
| order_number          | varchar               | YES      |         |
| customer_id           | uuid                  | YES      |         |

---

## v_transactions_unified

| Colonne                        | Type                  | Nullable | Default |
| ------------------------------ | --------------------- | -------- | ------- |
| id                             | uuid                  | YES      |         |
| transaction_id                 | text                  | YES      |         |
| emitted_at                     | timestamptz           | YES      |         |
| settled_at                     | timestamptz           | YES      |         |
| label                          | text                  | YES      |         |
| amount                         | numeric               | YES      |         |
| side                           | enum:transaction_side | YES      |         |
| operation_type                 | text                  | YES      |         |
| counterparty_name              | text                  | YES      |         |
| counterparty_iban              | text                  | YES      |         |
| reference                      | text                  | YES      |         |
| category_pcg                   | varchar               | YES      |         |
| counterparty_organisation_id   | uuid                  | YES      |         |
| organisation_name              | varchar               | YES      |         |
| has_attachment                 | boolean               | YES      |         |
| attachment_count               | integer               | YES      |         |
| attachment_ids                 | text[]                | YES      |         |
| justification_optional         | boolean               | YES      |         |
| matching_status                | enum:matching_status  | YES      |         |
| matched_document_id            | uuid                  | YES      |         |
| matched_document_number        | text                  | YES      |         |
| matched_document_type          | enum:document_type    | YES      |         |
| confidence_score               | integer               | YES      |         |
| match_reason                   | text                  | YES      |         |
| applied_rule_id                | uuid                  | YES      |         |
| rule_match_value               | text                  | YES      |         |
| rule_display_label             | text                  | YES      |         |
| rule_allow_multiple_categories | boolean               | YES      |         |
| unified_status                 | text                  | YES      |         |
| vat_rate                       | numeric               | YES      |         |
| amount_ht                      | numeric               | YES      |         |
| amount_vat                     | numeric               | YES      |         |
| vat_breakdown                  | jsonb                 | YES      |         |
| vat_source                     | text                  | YES      |         |
| payment_method                 | varchar               | YES      |         |
| nature                         | varchar               | YES      |         |
| note                           | text                  | YES      |         |
| year                           | integer               | YES      |         |
| month                          | integer               | YES      |         |
| raw_data                       | jsonb                 | YES      |         |
| created_at                     | timestamptz           | YES      |         |
| updated_at                     | timestamptz           | YES      |         |
| bank_provider                  | enum:bank_provider    | YES      |         |

---

## v_unique_unclassified_labels

| Colonne           | Type        | Nullable | Default |
| ----------------- | ----------- | -------- | ------- |
| label             | text        | YES      |         |
| transaction_count | bigint      | YES      |         |
| total_amount      | numeric     | YES      |         |
| first_seen        | timestamptz | YES      |         |
| last_seen         | timestamptz | YES      |         |
| expense_ids       | uuid[]      | YES      |         |

---

## wishlist_items

| Colonne    | Type        | Nullable | Default           |
| ---------- | ----------- | -------- | ----------------- |
| id         | uuid        | NO       | gen_random_uuid() |
| user_id    | uuid        | NO       |                   |
| product_id | uuid        | NO       |                   |
| created_at | timestamptz | NO       | now()             |

**Relations :**

- `product_id` → `products.id`

**RLS :** 4 policies

- `users_delete_own_wishlist` : DELETE — authenticated
- `users_insert_own_wishlist` : INSERT — authenticated
- `staff_read_all_wishlists` : SELECT — authenticated
- `users_read_own_wishlist` : SELECT — authenticated

---
