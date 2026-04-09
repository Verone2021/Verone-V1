# Domaine : Organisations

**Description :** CRM — fournisseurs, partenaires, enseignes, clients, contacts, adresses.

**Tables (8) :** `organisations`, `contacts`, `enseignes`, `addresses`, `individual_customers`, `organisation_families`, `customer_addresses`, `counterparty_bank_accounts`

---

### `organisations`

| Colonne                    | Type          | Nullable |
| -------------------------- | ------------- | -------- |
| `id`                       | `uuid`        | NO       |
| `legal_name`               | `varchar`     | NO       |
| `type`                     | `enum`        | YES      |
| `email`                    | `varchar`     | YES      |
| `country`                  | `varchar`     | YES      |
| `is_active`                | `bool`        | YES      |
| `created_at`               | `timestamptz` | YES      |
| `updated_at`               | `timestamptz` | YES      |
| `created_by`               | `uuid`        | YES      |
| `archived_at`              | `timestamptz` | YES      |
| `phone`                    | `varchar`     | YES      |
| `website`                  | `text`        | YES      |
| `secondary_email`          | `varchar`     | YES      |
| `address_line1`            | `text`        | YES      |
| `address_line2`            | `text`        | YES      |
| `postal_code`              | `varchar`     | YES      |
| `city`                     | `varchar`     | YES      |
| `region`                   | `varchar`     | YES      |
| `siret`                    | `varchar`     | YES      |
| `vat_number`               | `varchar`     | YES      |
| `legal_form`               | `varchar`     | YES      |
| `industry_sector`          | `varchar`     | YES      |
| `supplier_segment`         | `enum`        | YES      |
| `payment_terms`            | `varchar`     | YES      |
| `delivery_time_days`       | `int`         | YES      |
| `minimum_order_amount`     | `numeric`     | YES      |
| `currency`                 | `varchar`     | YES      |
| `rating`                   | `numeric`     | YES      |
| `certification_labels`     | `ARRAY`       | YES      |
| `preferred_supplier`       | `bool`        | YES      |
| `notes`                    | `text`        | YES      |
| `customer_type`            | `text`        | YES      |
| `prepayment_required`      | `bool`        | YES      |
| `billing_address_line1`    | `text`        | YES      |
| `billing_address_line2`    | `text`        | YES      |
| `billing_postal_code`      | `varchar`     | YES      |
| `billing_city`             | `varchar`     | YES      |
| `billing_region`           | `varchar`     | YES      |
| `billing_country`          | `varchar`     | YES      |
| `shipping_address_line1`   | `text`        | YES      |
| `shipping_address_line2`   | `text`        | YES      |
| `shipping_postal_code`     | `varchar`     | YES      |
| `shipping_city`            | `varchar`     | YES      |
| `abby_customer_id`         | `text`        | YES      |
| `default_channel_id`       | `uuid`        | YES      |
| `logo_url`                 | `text`        | YES      |
| `trade_name`               | `varchar`     | YES      |
| `has_different_trade_name` | `bool`        | NO       |
| `siren`                    | `varchar`     | YES      |
| `payment_terms_type`       | `enum`        | YES      |
| `payment_terms_notes`      | `text`        | YES      |
| `enseigne_id`              | `uuid`        | YES      |
| `is_enseigne_parent`       | `bool`        | NO       |
| `source_type`              | `enum`        | YES      |
| `source_affiliate_id`      | `uuid`        | YES      |
| `linkme_code`              | `varchar`     | YES      |
| `is_service_provider`      | `bool`        | YES      |
| `source`                   | `text`        | YES      |
| `approval_status`          | `text`        | YES      |
| `approved_at`              | `timestamptz` | YES      |
| `approved_by`              | `uuid`        | YES      |
| `show_on_linkme_globe`     | `bool`        | YES      |
| `ownership_type`           | `enum`        | YES      |
| `latitude`                 | `numeric`     | YES      |
| `longitude`                | `numeric`     | YES      |
| `default_vat_rate`         | `numeric`     | YES      |
| `kbis_url`                 | `text`        | YES      |

**Relations (FK) :**

- `default_channel_id` → `sales_channels.id`
- `enseigne_id` → `enseignes.id`
- `source_affiliate_id` → `linkme_affiliates.id`

**RLS policies :**

- `organisations_modify_staff` (ALL)
- `linkme_users_insert_organisations` (INSERT)
- `organisations_anon_read_published_enseigne` (SELECT)
- `linkme_users_select_organisations` (SELECT)
- `linkme_users_update_own_organisation` (UPDATE)

**Triggers :**

- `audit_organisations` (AFTER INSERT)
- `trg_calculate_default_vat_rate` (BEFORE INSERT)
- `trg_generate_organisation_code` (BEFORE INSERT)
- `trg_notify_affiliate_archive` (AFTER UPDATE)
- `trg_org_inherit_enseigne_logo` (BEFORE INSERT)
- `trg_organisation_approval_notification` (AFTER INSERT)
- `trg_sync_ownership_type_payment` (BEFORE UPDATE)
- `trg_sync_trade_name_from_legal_name` (BEFORE INSERT)
- `trigger_enseigne_member_count` (AFTER INSERT)
- `trigger_update_organisations_updated_at` (BEFORE UPDATE)

---

### `contacts`

| Colonne                          | Type          | Nullable |
| -------------------------------- | ------------- | -------- |
| `id`                             | `uuid`        | NO       |
| `organisation_id`                | `uuid`        | YES      |
| `first_name`                     | `varchar`     | NO       |
| `last_name`                      | `varchar`     | NO       |
| `title`                          | `varchar`     | YES      |
| `department`                     | `varchar`     | YES      |
| `email`                          | `varchar`     | NO       |
| `phone`                          | `varchar`     | YES      |
| `mobile`                         | `varchar`     | YES      |
| `secondary_email`                | `varchar`     | YES      |
| `direct_line`                    | `varchar`     | YES      |
| `is_primary_contact`             | `bool`        | YES      |
| `is_billing_contact`             | `bool`        | YES      |
| `is_technical_contact`           | `bool`        | YES      |
| `is_commercial_contact`          | `bool`        | YES      |
| `preferred_communication_method` | `varchar`     | YES      |
| `accepts_marketing`              | `bool`        | YES      |
| `accepts_notifications`          | `bool`        | YES      |
| `language_preference`            | `varchar`     | YES      |
| `notes`                          | `text`        | YES      |
| `is_active`                      | `bool`        | YES      |
| `last_contact_date`              | `timestamptz` | YES      |
| `created_by`                     | `uuid`        | YES      |
| `created_at`                     | `timestamptz` | YES      |
| `updated_at`                     | `timestamptz` | YES      |
| `enseigne_id`                    | `uuid`        | YES      |
| `owner_type`                     | `varchar`     | YES      |
| `user_id`                        | `uuid`        | YES      |
| `contact_type`                   | `varchar`     | YES      |
| `is_delivery_only`               | `bool`        | YES      |

**Relations (FK) :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_contacts` (ALL)
- `linkme_insert_contacts` (INSERT)
- `linkme_select_contacts` (SELECT)
- `linkme_update_contacts` (UPDATE)

**Triggers :**

- `trg_notify_billing_contact_change` (AFTER INSERT)
- `trigger_contacts_updated_at` (BEFORE UPDATE)
- `trigger_set_contact_owner_type` (BEFORE UPDATE)
- `trigger_validate_contact_constraints` (BEFORE UPDATE)

---

### `enseignes`

| Colonne                | Type          | Nullable |
| ---------------------- | ------------- | -------- |
| `id`                   | `uuid`        | NO       |
| `name`                 | `varchar`     | NO       |
| `description`          | `text`        | YES      |
| `logo_url`             | `text`        | YES      |
| `member_count`         | `int`         | NO       |
| `is_active`            | `bool`        | NO       |
| `created_at`           | `timestamptz` | NO       |
| `updated_at`           | `timestamptz` | NO       |
| `created_by`           | `uuid`        | YES      |
| `show_on_linkme_globe` | `bool`        | YES      |
| `payment_delay_days`   | `int`         | YES      |

**RLS policies :**

- `enseignes_modify_staff` (ALL)
- `enseignes_select_all` (SELECT)

**Triggers :**

- `trg_create_linkme_profile_enseigne` (AFTER INSERT)
- `trg_propagate_enseigne_logo_on_update` (AFTER UPDATE)
- `trg_propagate_enseigne_payment_delay` (AFTER UPDATE)
- `trigger_enseignes_updated_at` (BEFORE UPDATE)

---

### `addresses`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `owner_type`    | `varchar`     | NO       |
| `owner_id`      | `uuid`        | NO       |
| `address_type`  | `varchar`     | NO       |
| `source_app`    | `varchar`     | YES      |
| `label`         | `varchar`     | YES      |
| `legal_name`    | `varchar`     | YES      |
| `trade_name`    | `varchar`     | YES      |
| `siret`         | `varchar`     | YES      |
| `vat_number`    | `varchar`     | YES      |
| `address_line1` | `varchar`     | NO       |
| `address_line2` | `varchar`     | YES      |
| `postal_code`   | `varchar`     | NO       |
| `city`          | `varchar`     | NO       |
| `region`        | `varchar`     | YES      |
| `country`       | `varchar`     | YES      |
| `latitude`      | `numeric`     | YES      |
| `longitude`     | `numeric`     | YES      |
| `contact_name`  | `varchar`     | YES      |
| `contact_email` | `varchar`     | YES      |
| `contact_phone` | `varchar`     | YES      |
| `is_default`    | `bool`        | YES      |
| `is_active`     | `bool`        | YES      |
| `created_at`    | `timestamptz` | YES      |
| `created_by`    | `uuid`        | YES      |
| `updated_at`    | `timestamptz` | YES      |
| `archived_at`   | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_addresses` (ALL)
- `addresses_delete_policy` (DELETE)
- `addresses_insert_policy` (INSERT)
- `addresses_select_policy` (SELECT)
- `addresses_update_policy` (UPDATE)

**Triggers :**

- `trg_addresses_updated_at` (BEFORE UPDATE)
- `trg_manage_default_address` (BEFORE INSERT)

---

### `individual_customers`

| Colonne                         | Type          | Nullable |
| ------------------------------- | ------------- | -------- |
| `id`                            | `uuid`        | NO       |
| `first_name`                    | `text`        | NO       |
| `last_name`                     | `text`        | NO       |
| `email`                         | `text`        | YES      |
| `phone`                         | `text`        | YES      |
| `address_line1`                 | `text`        | YES      |
| `address_line2`                 | `text`        | YES      |
| `postal_code`                   | `text`        | YES      |
| `city`                          | `text`        | YES      |
| `region`                        | `text`        | YES      |
| `country`                       | `text`        | YES      |
| `billing_address_line1`         | `text`        | YES      |
| `billing_address_line2`         | `text`        | YES      |
| `billing_postal_code`           | `text`        | YES      |
| `billing_city`                  | `text`        | YES      |
| `billing_region`                | `text`        | YES      |
| `billing_country`               | `text`        | YES      |
| `has_different_billing_address` | `bool`        | YES      |
| `language_preference`           | `text`        | YES      |
| `accepts_marketing`             | `bool`        | YES      |
| `accepts_notifications`         | `bool`        | YES      |
| `notes`                         | `text`        | YES      |
| `is_active`                     | `bool`        | YES      |
| `created_by`                    | `uuid`        | YES      |
| `created_at`                    | `timestamptz` | YES      |
| `updated_at`                    | `timestamptz` | YES      |
| `abby_contact_id`               | `text`        | YES      |
| `payment_terms_type`            | `enum`        | YES      |
| `payment_terms_notes`           | `text`        | YES      |
| `enseigne_id`                   | `uuid`        | YES      |
| `source_type`                   | `enum`        | YES      |
| `source_affiliate_id`           | `uuid`        | YES      |
| `organisation_id`               | `uuid`        | YES      |
| `pending_approval`              | `bool`        | YES      |

**Relations (FK) :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`
- `source_affiliate_id` → `linkme_affiliates.id`

**RLS policies :**

- `backoffice_full_access_individual_customers` (ALL)
- `individual_customers_insert_self` (INSERT)
- `linkme_users_read_individual_customers` (SELECT)

**Triggers :**

- `trigger_individual_customers_updated_at` (BEFORE UPDATE)

---

### `organisation_families`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `organisation_id` | `uuid`        | NO       |
| `family_id`       | `uuid`        | NO       |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `family_id` → `families.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `staff_full_access` (ALL)

---

### `customer_addresses`

| Colonne       | Type          | Nullable |
| ------------- | ------------- | -------- |
| `id`          | `uuid`        | NO       |
| `user_id`     | `uuid`        | NO       |
| `label`       | `text`        | NO       |
| `first_name`  | `text`        | NO       |
| `last_name`   | `text`        | NO       |
| `address`     | `text`        | NO       |
| `postal_code` | `text`        | NO       |
| `city`        | `text`        | NO       |
| `country`     | `text`        | NO       |
| `phone`       | `text`        | YES      |
| `is_default`  | `bool`        | NO       |
| `created_at`  | `timestamptz` | NO       |
| `updated_at`  | `timestamptz` | NO       |

**RLS policies :**

- `users_own_addresses` (ALL)
- `staff_read_addresses` (SELECT)

---

### `counterparty_bank_accounts`

| Colonne               | Type          | Nullable |
| --------------------- | ------------- | -------- |
| `id`                  | `uuid`        | NO       |
| `organisation_id`     | `uuid`        | NO       |
| `iban`                | `text`        | NO       |
| `bic`                 | `text`        | YES      |
| `bank_name`           | `text`        | YES      |
| `account_holder_name` | `text`        | YES      |
| `is_primary`          | `bool`        | YES      |
| `created_at`          | `timestamptz` | YES      |
| `updated_at`          | `timestamptz` | YES      |
| `created_by`          | `uuid`        | YES      |

**Relations (FK) :**

- `organisation_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_counterparty_bank_accounts` (ALL)
- `Authenticated users can delete bank accounts` (DELETE)
- `Authenticated users can insert bank accounts` (INSERT)
- `Authenticated users can read bank accounts` (SELECT)
- `Authenticated users can update bank accounts` (UPDATE)

---
