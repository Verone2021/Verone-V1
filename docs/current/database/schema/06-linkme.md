# Domaine LinkMe & Affiliation — Schema Base de Donnees

_Generated: 2026-04-19 01:20_

**Tables : 10**

| Table                                                         | Colonnes | FK  | RLS | Triggers |
| ------------------------------------------------------------- | -------- | --- | --- | -------- |
| [linkme_affiliates](#linkme-affiliates)                       | 26       | 2   | 3   | 1        |
| [linkme_channel_suppliers](#linkme-channel-suppliers)         | 7        | 2   | 2   | 1        |
| [linkme_commissions](#linkme-commissions)                     | 26       | 5   | 2   | 1        |
| [linkme_info_requests](#linkme-info-requests)                 | 18       | 1   | 1   | 3        |
| [linkme_onboarding_progress](#linkme-onboarding-progress)     | 5        | 0   | 4   | 0        |
| [linkme_page_configurations](#linkme-page-configurations)     | 11       | 0   | 2   | 1        |
| [linkme_payment_request_items](#linkme-payment-request-items) | 5        | 2   | 4   | 0        |
| [linkme_payment_requests](#linkme-payment-requests)           | 17       | 1   | 4   | 3        |
| [linkme_selection_items](#linkme-selection-items)             | 12       | 2   | 6   | 4        |
| [linkme_selections](#linkme-selections)                       | 16       | 1   | 3   | 1        |

## linkme_affiliates

| Colonne                | Type        | Nullable | Default                      |
| ---------------------- | ----------- | -------- | ---------------------------- |
| id                     | uuid        | NO       | gen_random_uuid()            |
| organisation_id        | uuid        | YES      |                              |
| affiliate_type         | text        | NO       |                              |
| display_name           | text        | NO       |                              |
| slug                   | text        | NO       |                              |
| logo_url               | text        | YES      |                              |
| bio                    | text        | YES      |                              |
| default_margin_rate    | numeric     | YES      | 10.00                        |
| linkme_commission_rate | numeric     | YES      | 5.00                         |
| status                 | text        | YES      | 'pending'::text              |
| verified_at            | timestamptz | YES      |                              |
| verified_by            | uuid        | YES      |                              |
| email                  | text        | YES      |                              |
| phone                  | text        | YES      |                              |
| created_at             | timestamptz | YES      | now()                        |
| updated_at             | timestamptz | YES      | now()                        |
| created_by             | uuid        | YES      |                              |
| enseigne_id            | uuid        | YES      |                              |
| tva_rate               | numeric     | YES      | 20.00                        |
| primary_color          | varchar     | YES      | '#5DBEBB'::character varying |
| secondary_color        | varchar     | YES      | '#3976BB'::character varying |
| accent_color           | varchar     | YES      | '#7E84C0'::character varying |
| text_color             | varchar     | YES      | '#183559'::character varying |
| background_color       | varchar     | YES      | '#FFFFFF'::character varying |
| price_display_mode     | varchar     | YES      | 'TTC'::character varying     |
| order_code             | text        | YES      |                              |

**Relations :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS :** 3 policies

- `linkme_affiliates_own` : ALL — public
- `linkme_affiliates_staff_all` : ALL — authenticated
- `linkme_affiliates_public_read` : SELECT — public

**Triggers :** 1

- `linkme_affiliates_updated_at` : BEFORE UPDATE

---

## linkme_channel_suppliers

| Colonne               | Type        | Nullable | Default           |
| --------------------- | ----------- | -------- | ----------------- |
| id                    | uuid        | NO       | gen_random_uuid() |
| supplier_id           | uuid        | NO       |                   |
| channel_id            | uuid        | NO       |                   |
| is_visible_as_partner | boolean     | NO       | true              |
| display_order         | integer     | YES      | 0                 |
| created_at            | timestamptz | NO       | now()             |
| updated_at            | timestamptz | NO       | now()             |

**Relations :**

- `supplier_id` → `organisations.id`
- `channel_id` → `sales_channels.id`

**RLS :** 2 policies

- `backoffice_full_access_linkme_channel_suppliers` : ALL — authenticated
- `linkme_channel_suppliers_select_authenticated` : SELECT — authenticated

**Triggers :** 1

- `trg_linkme_channel_suppliers_updated_at` : BEFORE UPDATE

---

## linkme_commissions

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| affiliate_id             | uuid        | NO       |                   |
| selection_id             | uuid        | YES      |                   |
| order_id                 | uuid        | NO       |                   |
| order_item_id            | uuid        | YES      |                   |
| order_amount_ht          | numeric     | NO       |                   |
| affiliate_commission     | numeric     | NO       |                   |
| linkme_commission        | numeric     | NO       |                   |
| margin_rate_applied      | numeric     | NO       |                   |
| linkme_rate_applied      | numeric     | NO       |                   |
| status                   | text        | YES      | 'pending'::text   |
| validated_at             | timestamptz | YES      |                   |
| validated_by             | uuid        | YES      |                   |
| paid_at                  | timestamptz | YES      |                   |
| paid_by                  | uuid        | YES      |                   |
| payment_reference        | text        | YES      |                   |
| payment_method           | text        | YES      |                   |
| notes                    | text        | YES      |                   |
| created_at               | timestamptz | YES      | now()             |
| tax_rate                 | numeric     | YES      | 0.2               |
| affiliate_commission_ttc | numeric     | YES      |                   |
| order_number             | varchar     | YES      |                   |
| payment_request_id       | uuid        | YES      |                   |
| updated_at               | timestamptz | YES      | now()             |
| total_payout_ht          | numeric     | YES      | 0                 |
| total_payout_ttc         | numeric     | YES      | 0                 |

**Relations :**

- `payment_request_id` → `linkme_payment_requests.id`
- `affiliate_id` → `linkme_affiliates.id`
- `selection_id` → `linkme_selections.id`
- `order_id` → `sales_orders.id`
- `order_item_id` → `sales_order_items.id`

**RLS :** 2 policies

- `staff_manage_linkme_commissions` : ALL — authenticated
- `affiliates_view_own_commissions` : SELECT — authenticated

**Triggers :** 1

- `trg_linkme_commission_ttc` : BEFORE INSERT

---

## linkme_info_requests

| Colonne            | Type        | Nullable | Default                       |
| ------------------ | ----------- | -------- | ----------------------------- |
| id                 | uuid        | NO       | gen_random_uuid()             |
| sales_order_id     | uuid        | NO       |                               |
| requested_fields   | jsonb       | NO       |                               |
| custom_message     | text        | YES      |                               |
| token              | uuid        | NO       | gen_random_uuid()             |
| token_expires_at   | timestamptz | NO       | (now() + '30 days'::interval) |
| recipient_email    | text        | NO       |                               |
| recipient_name     | text        | YES      |                               |
| recipient_type     | text        | NO       |                               |
| sent_at            | timestamptz | NO       | now()                         |
| sent_by            | uuid        | YES      |                               |
| completed_at       | timestamptz | YES      |                               |
| completed_by_email | text        | YES      |                               |
| submitted_data     | jsonb       | YES      |                               |
| cancelled_at       | timestamptz | YES      |                               |
| cancelled_reason   | text        | YES      |                               |
| created_at         | timestamptz | YES      | now()                         |
| updated_at         | timestamptz | YES      | now()                         |

**Relations :**

- `sales_order_id` → `sales_orders.id`

**RLS :** 1 policy

- `staff_full_access_linkme_info_requests` : ALL — authenticated

**Triggers :** 3

- `set_linkme_info_requests_updated_at` : BEFORE UPDATE
- `trg_notify_linkme_info_request_completed` : AFTER UPDATE
- `trg_notify_linkme_info_request_sent` : AFTER INSERT

---

## linkme_onboarding_progress

| Colonne      | Type        | Nullable | Default           |
| ------------ | ----------- | -------- | ----------------- |
| id           | uuid        | NO       | gen_random_uuid() |
| user_id      | uuid        | NO       |                   |
| step_id      | text        | NO       |                   |
| completed_at | timestamptz | YES      | now()             |
| created_at   | timestamptz | YES      | now()             |

**RLS :** 4 policies

- `staff_full_access_onboarding` : ALL — authenticated
- `affiliate_delete_own_onboarding` : DELETE — authenticated
- `affiliate_insert_own_onboarding` : INSERT — authenticated
- `affiliate_read_own_onboarding` : SELECT — authenticated

---

## linkme_page_configurations

| Colonne              | Type        | Nullable | Default           |
| -------------------- | ----------- | -------- | ----------------- |
| id                   | uuid        | NO       | gen_random_uuid() |
| page_id              | text        | NO       |                   |
| page_name            | text        | NO       |                   |
| page_description     | text        | YES      |                   |
| page_icon            | text        | YES      |                   |
| globe_enabled        | boolean     | NO       | true              |
| globe_rotation_speed | numeric     | NO       | 0.003             |
| config               | jsonb       | NO       | '{}'::jsonb       |
| created_at           | timestamptz | NO       | now()             |
| updated_at           | timestamptz | NO       | now()             |
| updated_by           | uuid        | YES      |                   |

**RLS :** 2 policies

- `staff_full_access_linkme_page_configurations` : ALL — authenticated
- `public_read_linkme_page_configurations` : SELECT — authenticated

**Triggers :** 1

- `trigger_linkme_page_configurations_updated_at` : BEFORE UPDATE

---

## linkme_payment_request_items

| Colonne               | Type        | Nullable | Default           |
| --------------------- | ----------- | -------- | ----------------- |
| id                    | uuid        | NO       | gen_random_uuid() |
| payment_request_id    | uuid        | NO       |                   |
| commission_id         | uuid        | NO       |                   |
| commission_amount_ttc | numeric     | NO       |                   |
| created_at            | timestamptz | YES      | now()             |

**Relations :**

- `payment_request_id` → `linkme_payment_requests.id`
- `commission_id` → `linkme_commissions.id`

**RLS :** 4 policies

- `staff_delete_request_items` : DELETE — authenticated
- `staff_create_request_items` : INSERT — authenticated
- `staff_view_all_request_items` : SELECT — authenticated
- `staff_update_request_items` : UPDATE — authenticated

---

## linkme_payment_requests

| Colonne             | Type        | Nullable | Default                      |
| ------------------- | ----------- | -------- | ---------------------------- |
| id                  | uuid        | NO       | gen_random_uuid()            |
| affiliate_id        | uuid        | NO       |                              |
| request_number      | varchar     | NO       |                              |
| total_amount_ht     | numeric     | NO       | 0                            |
| total_amount_ttc    | numeric     | NO       | 0                            |
| tax_rate            | numeric     | YES      | 0.20                         |
| status              | varchar     | NO       | 'pending'::character varying |
| invoice_file_url    | varchar     | YES      |                              |
| invoice_file_name   | varchar     | YES      |                              |
| invoice_received_at | timestamptz | YES      |                              |
| paid_at             | timestamptz | YES      |                              |
| paid_by             | uuid        | YES      |                              |
| payment_reference   | varchar     | YES      |                              |
| payment_proof_url   | varchar     | YES      |                              |
| notes               | text        | YES      |                              |
| created_at          | timestamptz | YES      | now()                        |
| updated_at          | timestamptz | YES      | now()                        |

**Relations :**

- `affiliate_id` → `linkme_affiliates.id`

**RLS :** 4 policies

- `staff_delete_payment_requests` : DELETE — authenticated
- `staff_create_payment_requests` : INSERT — authenticated
- `staff_view_all_payment_requests` : SELECT — authenticated
- `staff_update_payment_requests` : UPDATE — authenticated

**Triggers :** 3

- `trigger_generate_payment_request_number` : BEFORE INSERT
- `trigger_sync_commissions_on_payment` : AFTER UPDATE
- `trigger_update_payment_request_timestamp` : BEFORE UPDATE

---

## linkme_selection_items

| Colonne            | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| selection_id       | uuid        | NO       |                   |
| product_id         | uuid        | NO       |                   |
| base_price_ht      | numeric     | NO       |                   |
| margin_rate        | numeric     | NO       |                   |
| display_order      | integer     | YES      | 0                 |
| custom_description | text        | YES      |                   |
| is_featured        | boolean     | YES      | false             |
| created_at         | timestamptz | YES      | now()             |
| updated_at         | timestamptz | YES      | now()             |
| is_hidden_by_staff | boolean     | NO       | false             |
| selling_price_ht   | numeric     | YES      |                   |

**Relations :**

- `selection_id` → `linkme_selections.id`
- `product_id` → `products.id`

**RLS :** 6 policies

- `staff_manage_linkme_selection_items` : ALL — authenticated
- `linkme_selection_items_affiliate_delete` : DELETE — authenticated
- `linkme_selection_items_affiliate_insert` : INSERT — authenticated
- `linkme_selection_items_public_read` : SELECT — anon,authenticated
- `linkme_selection_items_affiliate_select` : SELECT — authenticated
- `linkme_selection_items_affiliate_update` : UPDATE — authenticated

**Triggers :** 4

- `check_enseigne_product_selection` : BEFORE INSERT
- `linkme_selection_items_count` : AFTER INSERT
- `linkme_selection_items_updated_at` : BEFORE UPDATE
- `trg_validate_linkme_margin` : BEFORE INSERT

---

## linkme_selections

| Colonne            | Type        | Nullable | Default                                  |
| ------------------ | ----------- | -------- | ---------------------------------------- |
| id                 | uuid        | NO       | gen_random_uuid()                        |
| affiliate_id       | uuid        | NO       |                                          |
| name               | text        | NO       |                                          |
| slug               | text        | NO       |                                          |
| description        | text        | YES      |                                          |
| image_url          | text        | YES      |                                          |
| share_token        | text        | YES      | encode(gen_random_bytes(16), 'hex'::text |
| products_count     | integer     | YES      | 0                                        |
| views_count        | integer     | YES      | 0                                        |
| orders_count       | integer     | YES      | 0                                        |
| total_revenue      | numeric     | YES      | 0                                        |
| published_at       | timestamptz | YES      |                                          |
| created_at         | timestamptz | YES      | now()                                    |
| updated_at         | timestamptz | YES      | now()                                    |
| archived_at        | timestamptz | YES      |                                          |
| price_display_mode | text        | YES      | 'TTC'::text                              |

**Relations :**

- `affiliate_id` → `linkme_affiliates.id`

**RLS :** 3 policies

- `linkme_selections_affiliate_own` : ALL — public
- `staff_manage_linkme_selections` : ALL — authenticated
- `linkme_selections_public_read` : SELECT — anon,authenticated

**Triggers :** 1

- `linkme_selections_updated_at` : BEFORE UPDATE

---
