# Domaine Commandes & Consultations — Schema Base de Donnees

_Generated: 2026-04-18 23:03_

**Tables : 17**

| Table                                                     | Colonnes | FK  | RLS | Triggers |
| --------------------------------------------------------- | -------- | --- | --- | -------- |
| [client_consultations](#client-consultations)             | 26       | 2   | 3   | 1        |
| [consultation_emails](#consultation-emails)               | 12       | 1   | 1   | 0        |
| [consultation_images](#consultation-images)               | 15       | 1   | 5   | 2        |
| [consultation_products](#consultation-products)           | 15       | 2   | 1   | 0        |
| [order_discounts](#order-discounts)                       | 24       | 0   | 2   | 1        |
| [order_payments](#order-payments)                         | 10       | 2   | 1   | 0        |
| [purchase_order_items](#purchase-order-items)             | 21       | 4   | 2   | 9        |
| [purchase_order_receptions](#purchase-order-receptions)   | 14       | 3   | 2   | 5        |
| [purchase_orders](#purchase-orders)                       | 34       | 1   | 4   | 17       |
| [sales_order_events](#sales-order-events)                 | 6        | 1   | 2   | 1        |
| [sales_order_items](#sales-order-items)                   | 22       | 3   | 7   | 6        |
| [sales_order_linkme_details](#sales-order-linkme-details) | 51       | 1   | 6   | 3        |
| [sales_order_shipments](#sales-order-shipments)           | 20       | 2   | 1   | 5        |
| [sales_orders](#sales-orders)                             | 68       | 10  | 7   | 23       |
| [sample_order_items](#sample-order-items)                 | 13       | 2   | 1   | 0        |
| [sample_orders](#sample-orders)                           | 17       | 1   | 1   | 0        |
| [shopping_carts](#shopping-carts)                         | 11       | 2   | 9   | 1        |

## client_consultations

| Colonne                 | Type        | Nullable | Default            |
| ----------------------- | ----------- | -------- | ------------------ |
| id                      | uuid        | NO       | gen_random_uuid()  |
| client_email            | text        | NO       |                    |
| client_phone            | text        | YES      |                    |
| descriptif              | text        | NO       |                    |
| image_url               | text        | YES      |                    |
| tarif_maximum           | numeric     | YES      |                    |
| status                  | text        | YES      | 'en_attente'::text |
| assigned_to             | uuid        | YES      |                    |
| notes_internes          | text        | YES      |                    |
| priority_level          | integer     | YES      | 2                  |
| source_channel          | text        | YES      | 'website'::text    |
| estimated_response_date | date        | YES      |                    |
| created_at              | timestamptz | YES      | now()              |
| updated_at              | timestamptz | YES      | now()              |
| created_by              | uuid        | YES      |                    |
| responded_at            | timestamptz | YES      |                    |
| responded_by            | uuid        | YES      |                    |
| validated_at            | timestamptz | YES      |                    |
| validated_by            | uuid        | YES      |                    |
| archived_at             | timestamptz | YES      |                    |
| archived_by             | uuid        | YES      |                    |
| deleted_at              | timestamptz | YES      |                    |
| deleted_by              | uuid        | YES      |                    |
| enseigne_id             | uuid        | YES      |                    |
| organisation_id         | uuid        | YES      |                    |
| tva_rate                | numeric     | YES      | 20                 |

**Relations :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS :** 3 policies

- `staff_insert_consultations` : INSERT — authenticated
- `Consultations read access` : SELECT — authenticated
- `staff_update_consultations` : UPDATE — authenticated

**Triggers :** 1

- `trigger_consultations_updated_at` : BEFORE UPDATE

---

## consultation_emails

| Colonne         | Type        | Nullable | Default           |
| --------------- | ----------- | -------- | ----------------- |
| id              | uuid        | NO       | gen_random_uuid() |
| consultation_id | uuid        | NO       |                   |
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

**Relations :**

- `consultation_id` → `client_consultations.id`

**RLS :** 1 policy

- `staff_full_access` : ALL — authenticated

---

## consultation_images

| Colonne         | Type                 | Nullable | Default                    |
| --------------- | -------------------- | -------- | -------------------------- |
| id              | uuid                 | NO       | gen_random_uuid()          |
| consultation_id | uuid                 | NO       |                            |
| storage_path    | text                 | NO       |                            |
| public_url      | text                 | YES      |                            |
| display_order   | integer              | YES      | 0                          |
| is_primary      | boolean              | YES      | false                      |
| image_type      | enum:image_type_enum | YES      | 'gallery'::image_type_enum |
| alt_text        | text                 | YES      |                            |
| width           | integer              | YES      |                            |
| height          | integer              | YES      |                            |
| file_size       | bigint               | YES      |                            |
| format          | text                 | YES      |                            |
| created_by      | uuid                 | YES      |                            |
| created_at      | timestamptz          | YES      | now()                      |
| updated_at      | timestamptz          | YES      | now()                      |

**Relations :**

- `consultation_id` → `client_consultations.id`

**RLS :** 5 policies

- `backoffice_full_access_consultation_images` : ALL — authenticated
- `consultation_images_delete` : DELETE — public
- `consultation_images_insert` : INSERT — public
- `consultation_images_read` : SELECT — public
- `consultation_images_update` : UPDATE — public

**Triggers :** 2

- `trigger_manage_consultation_primary_image` : BEFORE INSERT
- `trigger_update_consultation_images_updated_at` : BEFORE UPDATE

---

## consultation_products

| Colonne                | Type        | Nullable | Default           |
| ---------------------- | ----------- | -------- | ----------------- |
| id                     | uuid        | NO       | gen_random_uuid() |
| consultation_id        | uuid        | NO       |                   |
| product_id             | uuid        | NO       |                   |
| proposed_price         | numeric     | YES      |                   |
| notes                  | text        | YES      |                   |
| is_primary_proposal    | boolean     | YES      | false             |
| created_at             | timestamptz | YES      | now()             |
| created_by             | uuid        | YES      |                   |
| status                 | text        | YES      | 'pending'::text   |
| quantity               | integer     | NO       | 1                 |
| is_free                | boolean     | YES      | false             |
| shipping_cost          | numeric     | YES      | 0                 |
| shipping_cost_currency | text        | YES      | 'EUR'::text       |
| cost_price_override    | numeric     | YES      |                   |
| is_sample              | boolean     | YES      | false             |

**Relations :**

- `product_id` → `products.id`
- `consultation_id` → `client_consultations.id`

**RLS :** 1 policy

- `staff_manage_consultation_products` : ALL — authenticated

---

## order_discounts

| Colonne                   | Type        | Nullable | Default           |
| ------------------------- | ----------- | -------- | ----------------- |
| id                        | uuid        | NO       | gen_random_uuid() |
| code                      | varchar     | YES      |                   |
| name                      | varchar     | NO       |                   |
| description               | text        | YES      |                   |
| discount_type             | varchar     | NO       |                   |
| discount_value            | numeric     | NO       |                   |
| min_order_amount          | numeric     | YES      |                   |
| max_discount_amount       | numeric     | YES      |                   |
| applicable_channels       | uuid[]      | YES      |                   |
| applicable_customer_types | varchar[]   | YES      |                   |
| valid_from                | date        | NO       |                   |
| valid_until               | date        | NO       |                   |
| max_uses_total            | integer     | YES      |                   |
| max_uses_per_customer     | integer     | YES      | 1                 |
| current_uses              | integer     | YES      | 0                 |
| is_active                 | boolean     | YES      | true              |
| requires_code             | boolean     | YES      | false             |
| is_combinable             | boolean     | YES      | false             |
| created_at                | timestamptz | YES      | now()             |
| updated_at                | timestamptz | YES      | now()             |
| created_by                | uuid        | YES      |                   |
| target_type               | text        | NO       | 'all'::text       |
| is_automatic              | boolean     | NO       | false             |
| exclude_sale_items        | boolean     | NO       | false             |

**RLS :** 2 policies

- `backoffice_full_access_order_discounts` : ALL — authenticated
- `order_discounts_select_authenticated` : SELECT — authenticated

**Triggers :** 1

- `order_discounts_updated_at` : BEFORE UPDATE

---

## order_payments

| Colonne           | Type                     | Nullable | Default           |
| ----------------- | ------------------------ | -------- | ----------------- |
| id                | uuid                     | NO       | gen_random_uuid() |
| sales_order_id    | uuid                     | YES      |                   |
| purchase_order_id | uuid                     | YES      |                   |
| payment_type      | enum:manual_payment_type | NO       |                   |
| amount            | numeric                  | NO       |                   |
| payment_date      | timestamptz              | NO       | now()             |
| reference         | text                     | YES      |                   |
| note              | text                     | YES      |                   |
| created_by        | uuid                     | YES      |                   |
| created_at        | timestamptz              | YES      | now()             |

**Relations :**

- `sales_order_id` → `sales_orders.id`
- `purchase_order_id` → `purchase_orders.id`

**RLS :** 1 policy

- `staff_full_access` : ALL — authenticated

---

## purchase_order_items

| Colonne                  | Type        | Nullable | Default                 |
| ------------------------ | ----------- | -------- | ----------------------- |
| id                       | uuid        | NO       | uuid_generate_v4()      |
| purchase_order_id        | uuid        | NO       |                         |
| product_id               | uuid        | NO       |                         |
| quantity                 | integer     | NO       |                         |
| unit_price_ht            | numeric     | NO       |                         |
| discount_percentage      | numeric     | NO       | 0                       |
| total_ht                 | numeric     | YES      |                         |
| quantity_received        | integer     | NO       | 0                       |
| expected_delivery_date   | date        | YES      |                         |
| notes                    | text        | YES      |                         |
| created_at               | timestamptz | NO       | now()                   |
| updated_at               | timestamptz | NO       | now()                   |
| sample_type              | varchar     | YES      | NULL::character varying |
| customer_organisation_id | uuid        | YES      |                         |
| customer_individual_id   | uuid        | YES      |                         |
| archived_at              | timestamptz | YES      |                         |
| eco_tax                  | numeric     | NO       | 0                       |
| allocated_shipping_ht    | numeric     | NO       | 0                       |
| allocated_customs_ht     | numeric     | NO       | 0                       |
| allocated_insurance_ht   | numeric     | NO       | 0                       |
| unit_cost_net            | numeric     | YES      |                         |

**Relations :**

- `product_id` → `products.id`
- `purchase_order_id` → `purchase_orders.id`
- `customer_organisation_id` → `organisations.id`
- `customer_individual_id` → `individual_customers.id`

**RLS :** 2 policies

- `staff_manage_purchase_order_items` : ALL — authenticated
- `Utilisateurs peuvent voir les items de leurs commandes fourniss` : SELECT — public

**Triggers :** 9

- `purchase_order_items_updated_at` : BEFORE UPDATE
- `recalculate_purchase_order_totals_trigger` : AFTER INSERT
- `trigger_allocate_po_fees` : BEFORE INSERT
- `trigger_check_sample_archive` : BEFORE UPDATE
- `trigger_handle_po_item_quantity_change_confirmed` : AFTER UPDATE
- `trigger_track_product_added_to_draft` : AFTER INSERT
- `trigger_track_product_quantity_updated_in_draft` : AFTER UPDATE
- `trigger_track_product_removed_from_draft` : AFTER DELETE
- `trigger_update_cost_price_pmp` : AFTER INSERT

---

## purchase_order_receptions

| Colonne           | Type        | Nullable | Default                |
| ----------------- | ----------- | -------- | ---------------------- |
| id                | uuid        | NO       | uuid_generate_v4()     |
| purchase_order_id | uuid        | YES      |                        |
| product_id        | uuid        | NO       |                        |
| quantity_received | integer     | NO       |                        |
| received_at       | timestamptz | NO       | now()                  |
| received_by       | uuid        | YES      |                        |
| batch_number      | varchar     | YES      |                        |
| notes             | text        | YES      |                        |
| created_at        | timestamptz | YES      | now()                  |
| updated_at        | timestamptz | YES      | now()                  |
| reference_type    | text        | YES      | 'purchase_order'::text |
| quantity_expected | integer     | YES      |                        |
| status            | text        | YES      | 'completed'::text      |
| affiliate_id      | uuid        | YES      |                        |

**Relations :**

- `purchase_order_id` → `purchase_orders.id`
- `product_id` → `products.id`
- `affiliate_id` → `linkme_affiliates.id`

**RLS :** 2 policies

- `backoffice_full_access_purchase_order_receptions` : ALL — authenticated
- `Users can view all purchase receptions` : SELECT — public

**Triggers :** 5

- `reception_validation_trigger` : AFTER UPDATE
- `trigger_before_delete_reception` : BEFORE DELETE
- `trigger_before_update_reception` : BEFORE UPDATE
- `trigger_reception_update_stock` : AFTER INSERT
- `trigger_stock_on_affiliate_reception` : BEFORE UPDATE

---

## purchase_orders

| Colonne                | Type                       | Nullable | Default                        |
| ---------------------- | -------------------------- | -------- | ------------------------------ |
| id                     | uuid                       | NO       | uuid_generate_v4()             |
| po_number              | varchar                    | NO       |                                |
| supplier_id            | uuid                       | NO       |                                |
| currency               | varchar                    | NO       | 'EUR'::character varying       |
| tax_rate               | numeric                    | NO       | 0.2000                         |
| total_ht               | numeric                    | NO       | 0                              |
| total_ttc              | numeric                    | NO       | 0                              |
| expected_delivery_date | date                       | YES      |                                |
| delivery_address       | jsonb                      | YES      |                                |
| payment_terms          | varchar                    | YES      |                                |
| notes                  | text                       | YES      |                                |
| created_by             | uuid                       | NO       |                                |
| validated_by           | uuid                       | YES      |                                |
| sent_by                | uuid                       | YES      |                                |
| received_by            | uuid                       | YES      |                                |
| validated_at           | timestamptz                | YES      |                                |
| sent_at                | timestamptz                | YES      |                                |
| received_at            | timestamptz                | YES      |                                |
| cancelled_at           | timestamptz                | YES      |                                |
| created_at             | timestamptz                | NO       | now()                          |
| updated_at             | timestamptz                | NO       | now()                          |
| eco_tax_total          | numeric                    | NO       | 0                              |
| eco_tax_vat_rate       | numeric                    | YES      | NULL::numeric                  |
| status                 | enum:purchase_order_status | NO       | 'draft'::purchase_order_status |
| payment_terms_type     | enum:payment_terms_type    | YES      |                                |
| payment_terms_notes    | text                       | YES      |                                |
| shipping_cost_ht       | numeric                    | YES      | 0                              |
| customs_cost_ht        | numeric                    | YES      | 0                              |
| insurance_cost_ht      | numeric                    | YES      | 0                              |
| payment_status_v2      | varchar                    | YES      | 'pending'::character varying   |
| fees_vat_rate          | numeric                    | YES      | 0.20                           |
| order_date             | date                       | YES      |                                |
| paid_amount            | numeric                    | YES      | 0                              |
| paid_at                | timestamptz                | YES      |                                |

**Relations :**

- `supplier_id` → `organisations.id`

**RLS :** 4 policies

- `staff_manage_purchase_orders` : ALL — authenticated
- `Utilisateurs peuvent supprimer leurs commandes fournisseurs` : DELETE — public
- `Utilisateurs peuvent voir leurs commandes fournisseurs` : SELECT — public
- `Utilisateurs peuvent modifier leurs commandes fournisseurs` : UPDATE — public

**Triggers :** 17

- `audit_purchase_orders` : AFTER INSERT
- `purchase_orders_updated_at` : BEFORE UPDATE
- `trg_po_validation_forecasted_stock` : AFTER UPDATE
- `trg_recalculate_po_payment_on_total_change` : BEFORE UPDATE
- `trg_stock_alert_tracking_rollback_on_po_cancel` : AFTER UPDATE
- `trg_update_pmp_on_po_received` : AFTER UPDATE
- `trig_po_charges_recalc` : BEFORE UPDATE
- `trigger_handle_po_deletion` : BEFORE DELETE
- `trigger_po_created_notification` : AFTER INSERT
- `trigger_po_delayed_notification` : AFTER UPDATE
- `trigger_po_partial_received_notification` : AFTER UPDATE
- `trigger_po_received_notification` : AFTER UPDATE
- `trigger_prevent_po_direct_cancellation` : BEFORE UPDATE
- `trigger_reallocate_po_fees_on_charges` : AFTER UPDATE
- `trigger_reset_alerts_on_po_cancel` : AFTER UPDATE
- `trigger_rollback_validated_to_draft` : AFTER UPDATE
- `trigger_validate_stock_alerts_on_po` : AFTER UPDATE

---

## sales_order_events

| Colonne        | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| sales_order_id | uuid        | NO       |                   |
| event_type     | text        | NO       |                   |
| metadata       | jsonb       | YES      | '{}'::jsonb       |
| created_by     | uuid        | YES      |                   |
| created_at     | timestamptz | NO       | now()             |

**Relations :**

- `sales_order_id` → `sales_orders.id`

**RLS :** 2 policies

- `staff_full_access` : ALL — authenticated
- `anon_insert_confirmation_events` : INSERT — anon

**Triggers :** 1

- `trigger_notify_sales_order_event` : AFTER INSERT

---

## sales_order_items

| Colonne                  | Type        | Nullable | Default            |
| ------------------------ | ----------- | -------- | ------------------ |
| id                       | uuid        | NO       | uuid_generate_v4() |
| sales_order_id           | uuid        | NO       |                    |
| product_id               | uuid        | NO       |                    |
| quantity                 | integer     | NO       |                    |
| unit_price_ht            | numeric     | NO       |                    |
| discount_percentage      | numeric     | NO       | 0                  |
| total_ht                 | numeric     | YES      |                    |
| quantity_shipped         | integer     | NO       | 0                  |
| expected_delivery_date   | date        | YES      |                    |
| notes                    | text        | YES      |                    |
| created_at               | timestamptz | NO       | now()              |
| updated_at               | timestamptz | NO       | now()              |
| tax_rate                 | numeric     | NO       | 0.2000             |
| retrocession_rate        | numeric     | YES      | 0.00               |
| retrocession_amount      | numeric     | YES      | 0.00               |
| eco_tax                  | numeric     | NO       | 0                  |
| is_sample                | boolean     | NO       | false              |
| linkme_selection_item_id | uuid        | YES      |                    |
| base_price_ht_locked     | numeric     | YES      |                    |
| selling_price_ht_locked  | numeric     | YES      |                    |
| price_locked_at          | timestamptz | YES      |                    |
| retrocession_amount_ttc  | numeric     | YES      |                    |

**Relations :**

- `sales_order_id` → `sales_orders.id`
- `product_id` → `products.id`
- `linkme_selection_item_id` → `linkme_selection_items.id`

**RLS :** 7 policies

- `linkme_users_delete_own_order_items` : DELETE — authenticated
- `staff_delete_sales_order_items` : DELETE — authenticated
- `Public can create sales_order_items` : INSERT — anon,authenticated
- `staff_select_sales_order_items` : SELECT — authenticated
- `affiliates_select_own_order_items` : SELECT — authenticated
- `staff_update_sales_order_items` : UPDATE — authenticated
- `linkme_users_update_own_order_items` : UPDATE — authenticated

**Triggers :** 6

- `recalculate_sales_order_totals_trigger` : AFTER INSERT
- `sales_order_items_updated_at` : BEFORE UPDATE
- `trg_backfill_order_affiliate` : AFTER INSERT
- `trg_calculate_retrocession` : BEFORE INSERT
- `trg_update_affiliate_totals` : AFTER INSERT
- `trigger_handle_so_item_quantity_change_confirmed` : AFTER UPDATE

---

## sales_order_linkme_details

| Colonne                         | Type        | Nullable | Default           |
| ------------------------------- | ----------- | -------- | ----------------- |
| id                              | uuid        | NO       | gen_random_uuid() |
| sales_order_id                  | uuid        | NO       |                   |
| requester_type                  | text        | NO       |                   |
| requester_name                  | text        | NO       |                   |
| requester_email                 | text        | NO       |                   |
| requester_phone                 | text        | YES      |                   |
| requester_position              | text        | YES      |                   |
| is_new_restaurant               | boolean     | NO       | false             |
| owner_type                      | text        | YES      |                   |
| owner_contact_same_as_requester | boolean     | YES      | false             |
| owner_name                      | text        | YES      |                   |
| owner_email                     | text        | YES      |                   |
| owner_phone                     | text        | YES      |                   |
| owner_company_legal_name        | text        | YES      |                   |
| owner_company_trade_name        | text        | YES      |                   |
| owner_kbis_url                  | text        | YES      |                   |
| billing_contact_source          | text        | YES      |                   |
| billing_name                    | text        | YES      |                   |
| billing_email                   | text        | YES      |                   |
| billing_phone                   | text        | YES      |                   |
| delivery_terms_accepted         | boolean     | NO       | false             |
| desired_delivery_date           | date        | YES      |                   |
| mall_form_required              | boolean     | YES      | false             |
| mall_form_email                 | text        | YES      |                   |
| step4_token                     | uuid        | YES      |                   |
| step4_token_expires_at          | timestamptz | YES      |                   |
| step4_completed_at              | timestamptz | YES      |                   |
| reception_contact_name          | text        | YES      |                   |
| reception_contact_email         | text        | YES      |                   |
| reception_contact_phone         | text        | YES      |                   |
| confirmed_delivery_date         | date        | YES      |                   |
| created_at                      | timestamptz | YES      | now()             |
| updated_at                      | timestamptz | YES      | now()             |
| delivery_contact_name           | text        | YES      |                   |
| delivery_contact_email          | text        | YES      |                   |
| delivery_contact_phone          | text        | YES      |                   |
| delivery_address                | text        | YES      |                   |
| delivery_postal_code            | text        | YES      |                   |
| delivery_city                   | text        | YES      |                   |
| delivery_latitude               | numeric     | YES      |                   |
| delivery_longitude              | numeric     | YES      |                   |
| delivery_date                   | date        | YES      |                   |
| is_mall_delivery                | boolean     | YES      | false             |
| mall_email                      | text        | YES      |                   |
| access_form_required            | boolean     | YES      | false             |
| access_form_url                 | text        | YES      |                   |
| semi_trailer_accessible         | boolean     | YES      | true              |
| delivery_notes                  | text        | YES      |                   |
| ignored_missing_fields          | jsonb       | NO       | '[]'::jsonb       |
| missing_fields_count            | integer     | YES      | 0                 |
| delivery_asap                   | boolean     | YES      | false             |

**Relations :**

- `sales_order_id` → `sales_orders.id`

**RLS :** 6 policies

- `staff_can_insert_linkme_details` : INSERT — authenticated
- `affiliates_can_insert_own_linkme_details` : INSERT — authenticated
- `affiliates_select_own_order_linkme_details` : SELECT — authenticated
- `staff_select_sales_order_linkme_details` : SELECT — authenticated
- `staff_can_update_linkme_details` : UPDATE — authenticated
- `linkme_users_update_own_linkme_details` : UPDATE — authenticated

**Triggers :** 3

- `set_updated_at_sales_order_linkme_details` : BEFORE UPDATE
- `trg_notify_linkme_step4_completed` : AFTER UPDATE
- `trg_recalc_missing_fields` : BEFORE INSERT

---

## sales_order_shipments

| Colonne               | Type        | Nullable | Default            |
| --------------------- | ----------- | -------- | ------------------ |
| id                    | uuid        | NO       | uuid_generate_v4() |
| sales_order_id        | uuid        | NO       |                    |
| product_id            | uuid        | NO       |                    |
| quantity_shipped      | integer     | NO       |                    |
| shipped_at            | timestamptz | NO       | now()              |
| shipped_by            | uuid        | NO       |                    |
| tracking_number       | text        | YES      |                    |
| notes                 | text        | YES      |                    |
| created_at            | timestamptz | YES      | now()              |
| updated_at            | timestamptz | YES      | now()              |
| delivery_method       | text        | YES      | 'parcel'::text     |
| carrier_name          | text        | YES      |                    |
| carrier_service       | text        | YES      |                    |
| shipping_cost         | numeric     | YES      |                    |
| tracking_url          | text        | YES      |                    |
| label_url             | text        | YES      |                    |
| estimated_delivery_at | timestamptz | YES      |                    |
| packlink_shipment_id  | text        | YES      |                    |
| packlink_label_url    | text        | YES      |                    |
| packlink_status       | text        | YES      |                    |

**Relations :**

- `sales_order_id` → `sales_orders.id`
- `product_id` → `products.id`

**RLS :** 1 policy

- `backoffice_full_access_sales_order_shipments` : ALL — authenticated

**Triggers :** 5

- `trigger_before_delete_shipment` : BEFORE DELETE
- `trigger_before_update_shipment` : BEFORE UPDATE
- `trigger_notify_shipment_created` : AFTER INSERT
- `trigger_packlink_confirm_stock` : AFTER UPDATE
- `trigger_shipment_update_stock` : AFTER INSERT

---

## sales_orders

| Colonne                     | Type                    | Nullable | Default                      |
| --------------------------- | ----------------------- | -------- | ---------------------------- |
| id                          | uuid                    | NO       | uuid_generate_v4()           |
| order_number                | varchar                 | NO       |                              |
| customer_id                 | uuid                    | YES      |                              |
| currency                    | varchar                 | NO       | 'EUR'::character varying     |
| tax_rate                    | numeric                 | NO       | 0.2000                       |
| total_ht                    | numeric                 | NO       | 0                            |
| total_ttc                   | numeric                 | NO       | 0                            |
| expected_delivery_date      | date                    | YES      |                              |
| shipping_address            | jsonb                   | YES      |                              |
| billing_address             | jsonb                   | YES      |                              |
| payment_terms               | varchar                 | YES      |                              |
| notes                       | text                    | YES      |                              |
| created_by                  | uuid                    | YES      |                              |
| confirmed_by                | uuid                    | YES      |                              |
| shipped_by                  | uuid                    | YES      |                              |
| delivered_by                | uuid                    | YES      |                              |
| confirmed_at                | timestamptz             | YES      |                              |
| shipped_at                  | timestamptz             | YES      |                              |
| delivered_at                | timestamptz             | YES      |                              |
| cancelled_at                | timestamptz             | YES      |                              |
| created_at                  | timestamptz             | NO       | now()                        |
| updated_at                  | timestamptz             | NO       | now()                        |
| paid_amount                 | numeric                 | YES      | 0                            |
| paid_at                     | timestamptz             | YES      |                              |
| warehouse_exit_at           | timestamptz             | YES      |                              |
| warehouse_exit_by           | uuid                    | YES      |                              |
| ready_for_shipment          | boolean                 | YES      | false                        |
| cancellation_reason         | text                    | YES      |                              |
| customer_type               | text                    | NO       |                              |
| channel_id                  | uuid                    | YES      |                              |
| applied_discount_codes      | text[]                  | YES      |                              |
| total_discount_amount       | numeric                 | YES      | 0                            |
| cancelled_by                | uuid                    | YES      |                              |
| eco_tax_total               | numeric                 | NO       | 0                            |
| eco_tax_vat_rate            | numeric                 | YES      | NULL::numeric                |
| closed_at                   | timestamptz             | YES      |                              |
| closed_by                   | uuid                    | YES      |                              |
| payment_terms_type          | enum:payment_terms_type | YES      |                              |
| payment_terms_notes         | text                    | YES      |                              |
| shipping_cost_ht            | numeric                 | YES      | 0                            |
| insurance_cost_ht           | numeric                 | YES      | 0                            |
| handling_cost_ht            | numeric                 | YES      | 0                            |
| affiliate_total_ht          | numeric                 | YES      | NULL::numeric                |
| affiliate_total_ttc         | numeric                 | YES      | NULL::numeric                |
| linkme_selection_id         | uuid                    | YES      |                              |
| created_by_affiliate_id     | uuid                    | YES      |                              |
| pending_admin_validation    | boolean                 | YES      | false                        |
| payment_status_v2           | varchar                 | YES      | 'pending'::character varying |
| fees_vat_rate               | numeric                 | YES      | 0.20                         |
| responsable_contact_id      | uuid                    | YES      |                              |
| billing_contact_id          | uuid                    | YES      |                              |
| delivery_contact_id         | uuid                    | YES      |                              |
| invoiced_at                 | timestamptz             | YES      |                              |
| order_date                  | date                    | YES      |                              |
| status                      | enum:sales_order_status | NO       | 'draft'::sales_order_status  |
| is_shopping_center_delivery | boolean                 | NO       | false                        |
| accepts_semi_truck          | boolean                 | NO       | true                         |
| individual_customer_id      | uuid                    | YES      |                              |
| linkme_display_number       | text                    | YES      |                              |
| consultation_id             | uuid                    | YES      |                              |
| quote_qonto_id              | text                    | YES      |                              |
| quote_number                | text                    | YES      |                              |
| stripe_session_id           | text                    | YES      |                              |
| stripe_payment_intent_id    | text                    | YES      |                              |
| stripe_invoice_id           | text                    | YES      |                              |
| applied_discount_id         | uuid                    | YES      |                              |
| applied_discount_code       | varchar                 | YES      |                              |
| applied_discount_amount     | numeric                 | YES      | 0                            |

**Relations :**

- `created_by_affiliate_id` → `linkme_affiliates.id`
- `responsable_contact_id` → `contacts.id`
- `billing_contact_id` → `contacts.id`
- `delivery_contact_id` → `contacts.id`
- `customer_id` → `organisations.id`
- `individual_customer_id` → `individual_customers.id`
- `linkme_selection_id` → `linkme_selections.id`
- `channel_id` → `sales_channels.id`
- `consultation_id` → `client_consultations.id`
- `applied_discount_id` → `order_discounts.id`

**RLS :** 7 policies

- `staff_delete_sales_orders` : DELETE — authenticated
- `Public can create sales_orders` : INSERT — anon,authenticated
- `LinkMe users can create sales_orders` : INSERT — authenticated
- `affiliates_select_own_orders` : SELECT — authenticated
- `staff_select_sales_orders` : SELECT — authenticated
- `linkme_users_update_own_draft_orders` : UPDATE — authenticated
- `staff_update_sales_orders` : UPDATE — authenticated

**Triggers :** 23

- `audit_sales_orders` : AFTER INSERT
- `sales_order_status_change_trigger` : AFTER UPDATE
- `sales_orders_updated_at` : BEFORE UPDATE
- `trg_assign_linkme_display_number` : BEFORE INSERT
- `trg_create_linkme_commission` : AFTER INSERT
- `trg_lock_prices_on_validation` : AFTER UPDATE
- `trg_notify_affiliate_order` : AFTER INSERT
- `trg_notify_affiliate_order_approved` : AFTER UPDATE
- `trg_notify_site_sales_order` : AFTER INSERT
- `trg_recalculate_so_payment_on_total_change` : BEFORE UPDATE
- `trg_so_devalidation_forecasted_stock` : AFTER UPDATE
- `trg_sync_commission_on_payment` : AFTER UPDATE
- `trig_so_charges_recalc` : BEFORE UPDATE
- `trigger_order_cancelled_notification` : AFTER UPDATE
- `trigger_order_confirmed_notification` : AFTER UPDATE
- `trigger_order_shipped_notification` : AFTER UPDATE
- `trigger_payment_received_notification` : AFTER UPDATE
- `trigger_prevent_so_direct_cancellation` : BEFORE UPDATE
- `trigger_so_cancellation_rollback` : AFTER UPDATE
- `trigger_so_delayed_notification` : AFTER UPDATE
- `trigger_so_insert_validated_forecast` : AFTER INSERT
- `trigger_so_partial_shipped_notification` : AFTER UPDATE
- `trigger_so_update_forecasted_out` : AFTER UPDATE

---

## sample_order_items

| Colonne            | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| sample_order_id    | uuid        | NO       |                   |
| sample_description | text        | NO       |                   |
| estimated_cost     | numeric     | YES      | 0                 |
| actual_cost        | numeric     | YES      | NULL::numeric     |
| quantity           | integer     | YES      | 1                 |
| item_status        | text        | NO       | 'pending'::text   |
| delivered_at       | timestamptz | YES      |                   |
| validated_at       | timestamptz | YES      |                   |
| validation_notes   | text        | YES      |                   |
| created_at         | timestamptz | YES      | now()             |
| updated_at         | timestamptz | YES      | now()             |
| product_id         | uuid        | YES      |                   |

**Relations :**

- `product_id` → `products.id`
- `sample_order_id` → `sample_orders.id`

**RLS :** 1 policy

- `backoffice_full_access_sample_order_items` : ALL — authenticated

---

## sample_orders

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- | --- | ------------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| order_number             | text        | NO       | ('SAMPLE-'::text  |     | (EXTRACT(epoch FROM |
| supplier_id              | uuid        | NO       |                   |
| status                   | text        | NO       | 'draft'::text     |
| total_estimated_cost     | numeric     | YES      | 0                 |
| actual_cost              | numeric     | YES      | NULL::numeric     |
| shipping_cost            | numeric     | YES      | 0                 |
| expected_delivery_date   | date        | YES      |                   |
| actual_delivery_date     | date        | YES      |                   |
| supplier_order_reference | text        | YES      |                   |
| tracking_number          | text        | YES      |                   |
| internal_notes           | text        | YES      |                   |
| supplier_notes           | text        | YES      |                   |
| created_by               | uuid        | YES      |                   |
| approved_by              | uuid        | YES      |                   |
| created_at               | timestamptz | YES      | now()             |
| updated_at               | timestamptz | YES      | now()             |

**Relations :**

- `supplier_id` → `organisations.id`

**RLS :** 1 policy

- `backoffice_full_access_sample_orders` : ALL — authenticated

---

## shopping_carts

| Colonne                      | Type        | Nullable | Default           |
| ---------------------------- | ----------- | -------- | ----------------- |
| id                           | uuid        | NO       | gen_random_uuid() |
| user_id                      | uuid        | YES      |                   |
| session_id                   | text        | YES      |                   |
| product_id                   | uuid        | NO       |                   |
| variant_group_id             | uuid        | YES      |                   |
| quantity                     | integer     | NO       | 1                 |
| include_assembly             | boolean     | NO       | false             |
| created_at                   | timestamptz | YES      | now()             |
| updated_at                   | timestamptz | YES      | now()             |
| customer_email               | text        | YES      |                   |
| abandoned_cart_email_sent_at | timestamptz | YES      |                   |

**Relations :**

- `product_id` → `products.id`
- `variant_group_id` → `variant_groups.id`

**RLS :** 9 policies

- `staff_full_access_shopping_carts` : ALL — authenticated
- `anon_cart_delete` : DELETE — anon
- `users_own_cart_delete` : DELETE — authenticated
- `anon_cart_insert` : INSERT — anon
- `users_own_cart_insert` : INSERT — authenticated
- `users_own_cart_select` : SELECT — authenticated
- `anon_cart_select` : SELECT — anon
- `users_own_cart_update` : UPDATE — authenticated
- `anon_cart_update` : UPDATE — anon

**Triggers :** 1

- `shopping_carts_updated_at` : BEFORE UPDATE

---
