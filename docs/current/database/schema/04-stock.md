# Domaine Stock & Stockage — Schema Base de Donnees

_Generated: 2026-04-17 21:51_

**Tables : 9**

| Table | Colonnes | FK | RLS | Triggers |
|-------|----------|----|-----|----------|
| [affiliate_archive_requests](#affiliate-archive-requests) | 10 | 2 | 1 | 0 |
| [affiliate_storage_allocations](#affiliate-storage-allocations) | 8 | 3 | 4 | 2 |
| [affiliate_storage_requests](#affiliate-storage-requests) | 14 | 5 | 4 | 3 |
| [stock_alert_tracking](#stock-alert-tracking) | 20 | 3 | 5 | 2 |
| [stock_movements](#stock-movements) | 25 | 4 | 5 | 5 |
| [stock_reservations](#stock-reservations) | 13 | 1 | 5 | 1 |
| [storage_allocations](#storage-allocations) | 10 | 3 | 1 | 2 |
| [storage_billing_events](#storage-billing-events) | 12 | 3 | 3 | 0 |
| [storage_pricing_tiers](#storage-pricing-tiers) | 8 | 0 | 2 | 1 |

## affiliate_archive_requests

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| organisation_id | uuid | NO |  |
| affiliate_id | uuid | NO |  |
| action | text | NO |  |
| status | text | NO | 'pending'::text |
| affiliate_note | text | YES |  |
| admin_note | text | YES |  |
| created_at | timestamptz | NO | now() |
| reviewed_at | timestamptz | YES |  |
| reviewed_by | uuid | YES |  |

**Relations :**
- `organisation_id` → `organisations.id`
- `affiliate_id` → `linkme_affiliates.id`

**RLS :** 1 policy
- `Back-office full access on affiliate_archive_requests` : ALL — public

---

## affiliate_storage_allocations

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| owner_enseigne_id | uuid | YES |  |
| owner_organisation_id | uuid | YES |  |
| stock_quantity | integer | NO | 0 |
| billable_in_storage | boolean | NO | true |
| allocated_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Relations :**
- `product_id` → `products.id`
- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`

**RLS :** 4 policies
- `Admin manage storage` : ALL — public
- `backoffice_full_access_affiliate_storage_allocations` : ALL — authenticated
- `Affiliate view own storage` : SELECT — public
- `Admin view all storage` : SELECT — public

**Triggers :** 2
- `trg_storage_allocation_updated_at` : BEFORE UPDATE
- `trg_storage_billing_event` : AFTER INSERT

---

## affiliate_storage_requests

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| affiliate_id | uuid | NO |  |
| owner_enseigne_id | uuid | YES |  |
| owner_organisation_id | uuid | YES |  |
| quantity | integer | NO |  |
| notes | text | YES |  |
| status | text | NO | 'pending'::text |
| reviewed_by | uuid | YES |  |
| reviewed_at | timestamptz | YES |  |
| rejection_reason | text | YES |  |
| reception_id | uuid | YES |  |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Relations :**
- `product_id` → `products.id`
- `affiliate_id` → `linkme_affiliates.id`
- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `reception_id` → `purchase_order_receptions.id`

**RLS :** 4 policies
- `staff_full_access` : ALL — authenticated
- `affiliate_insert_own` : INSERT — authenticated
- `affiliate_read_own` : SELECT — authenticated
- `affiliate_cancel_own` : UPDATE — authenticated

**Triggers :** 3
- `trg_notify_storage_request_approved` : AFTER UPDATE
- `trg_notify_storage_request_rejected` : AFTER UPDATE
- `trigger_storage_request_updated_at` : BEFORE UPDATE

---

## stock_alert_tracking

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| product_id | uuid | NO |  |
| supplier_id | uuid | NO |  |
| alert_type | text | NO |  |
| alert_priority | integer | NO |  |
| stock_real | integer | NO | 0 |
| stock_forecasted_out | integer | NO | 0 |
| min_stock | integer | NO | 0 |
| shortage_quantity | integer | NO | 0 |
| draft_order_id | uuid | YES |  |
| quantity_in_draft | integer | YES | 0 |
| added_to_draft_at | timestamptz | YES |  |
| validated | boolean | NO | false |
| validated_at | timestamptz | YES |  |
| validated_by | uuid | YES |  |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| notes | text | YES |  |
| stock_forecasted_in | integer | NO | 0 |
| draft_order_number | varchar | YES |  |

**Relations :**
- `product_id` → `products.id`
- `supplier_id` → `organisations.id`
- `draft_order_id` → `purchase_orders.id`

**RLS :** 5 policies
- `backoffice_full_access_stock_alert_tracking` : ALL — authenticated
- `stock_alert_tracking_delete_policy` : DELETE — authenticated
- `stock_alert_tracking_insert_policy` : INSERT — authenticated
- `stock_alert_tracking_select_policy` : SELECT — authenticated
- `stock_alert_tracking_update_policy` : UPDATE — authenticated

**Triggers :** 2
- `trigger_create_notification_on_stock_alert_insert` : AFTER INSERT
- `trigger_create_notification_on_stock_alert_update` : AFTER UPDATE

---

## stock_movements

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| product_id | uuid | NO |  |
| warehouse_id | uuid | YES |  |
| movement_type | enum:movement_type | NO |  |
| quantity_change | integer | NO |  |
| quantity_before | integer | NO |  |
| quantity_after | integer | NO |  |
| unit_cost | numeric | YES |  |
| reference_type | text | YES |  |
| reference_id | uuid | YES |  |
| notes | text | YES |  |
| performed_by | uuid | NO |  |
| performed_at | timestamptz | NO | now() |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| reason_code | enum:stock_reason_code | YES |  |
| affects_forecast | boolean | YES | false |
| forecast_type | text | YES |  |
| purchase_order_item_id | uuid | YES |  |
| channel_id | uuid | YES |  |
| carrier_name | text | YES |  |
| tracking_number | text | YES |  |
| delivery_note | text | YES |  |
| received_by_name | text | YES |  |
| shipped_by_name | text | YES |  |

**Relations :**
- `product_id` → `products.id`
- `performed_by` → `user_profiles.user_id`
- `purchase_order_item_id` → `purchase_order_items.id`
- `channel_id` → `sales_channels.id`

**RLS :** 5 policies
- `users_own_stock_movements` : ALL — authenticated
- `backoffice_full_access_stock_movements` : ALL — authenticated
- `system_triggers_can_insert_stock_movements` : INSERT — public
- `authenticated_users_can_view_stock_movements` : SELECT — authenticated
- `Utilisateurs peuvent consulter les mouvements de stock` : SELECT — public

**Triggers :** 5
- `audit_stock_movements` : AFTER INSERT
- `stock_movements_updated_at` : BEFORE UPDATE
- `trg_reverse_stock_on_movement_delete` : BEFORE DELETE
- `trg_sync_product_stock_after_movement` : AFTER INSERT
- `trg_update_stock_alert` : AFTER INSERT

---

## stock_reservations

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| product_id | uuid | NO |  |
| reserved_quantity | integer | NO |  |
| reference_type | text | NO |  |
| reference_id | uuid | NO |  |
| reserved_by | uuid | NO |  |
| reserved_at | timestamptz | NO | now() |
| expires_at | timestamptz | YES |  |
| released_at | timestamptz | YES |  |
| released_by | uuid | YES |  |
| notes | text | YES |  |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**Relations :**
- `product_id` → `products.id`

**RLS :** 5 policies
- `backoffice_full_access_stock_reservations` : ALL — authenticated
- `stock_reservations_delete_authenticated` : DELETE — authenticated
- `stock_reservations_insert_authenticated` : INSERT — authenticated
- `stock_reservations_select_authenticated` : SELECT — authenticated
- `stock_reservations_update_authenticated` : UPDATE — authenticated

**Triggers :** 1
- `stock_reservations_updated_at` : BEFORE UPDATE

---

## storage_allocations

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| product_id | uuid | NO |  |
| owner_enseigne_id | uuid | YES |  |
| owner_organisation_id | uuid | YES |  |
| stock_quantity | integer | NO | 0 |
| billable_in_storage | boolean | NO | true |
| allocated_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| storage_start_date | date | YES |  |
| is_visible | boolean | NO | true |

**Relations :**
- `product_id` → `products.id`
- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`

**RLS :** 1 policy
- `backoffice_full_access_storage_allocations` : ALL — authenticated

**Triggers :** 2
- `trg_storage_allocation_updated_at` : BEFORE UPDATE
- `trg_storage_billing_event` : AFTER INSERT

---

## storage_billing_events

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| owner_enseigne_id | uuid | YES |  |
| owner_organisation_id | uuid | YES |  |
| product_id | uuid | NO |  |
| qty_change | integer | NO |  |
| volume_m3_change | numeric | NO |  |
| billable | boolean | NO | true |
| happened_at | timestamptz | NO | now() |
| source | text | NO |  |
| reference_id | uuid | YES |  |
| created_at | timestamptz | NO | now() |
| created_by | uuid | YES |  |

**Relations :**
- `owner_enseigne_id` → `enseignes.id`
- `owner_organisation_id` → `organisations.id`
- `product_id` → `products.id`

**RLS :** 3 policies
- `backoffice_full_access_storage_billing_events` : ALL — authenticated
- `Admin view all storage events` : SELECT — public
- `LinkMe view own enseigne events` : SELECT — public

---

## storage_pricing_tiers

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| min_volume_m3 | numeric | NO | 0 |
| max_volume_m3 | numeric | YES |  |
| price_per_m3 | numeric | NO | 0 |
| label | varchar | YES |  |
| is_active | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 2 policies
- `staff_manage_storage_pricing` : ALL — authenticated
- `storage_pricing_select` : SELECT — authenticated

**Triggers :** 1
- `trigger_storage_pricing_updated_at` : BEFORE UPDATE

---
