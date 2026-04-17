# Domaine Organisations & Contacts — Schema Base de Donnees

_Generated: 2026-04-17 23:01_

**Tables : 8**

| Table | Colonnes | FK | RLS | Triggers |
|-------|----------|----|-----|----------|
| [addresses](#addresses) | 27 | 0 | 5 | 2 |
| [contacts](#contacts) | 30 | 2 | 4 | 4 |
| [counterparty_bank_accounts](#counterparty-bank-accounts) | 10 | 1 | 5 | 0 |
| [customer_addresses](#customer-addresses) | 13 | 0 | 2 | 0 |
| [enseignes](#enseignes) | 11 | 0 | 2 | 4 |
| [individual_customers](#individual-customers) | 35 | 3 | 4 | 1 |
| [organisation_families](#organisation-families) | 4 | 2 | 1 | 0 |
| [organisations](#organisations) | 78 | 3 | 5 | 10 |

## addresses

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| owner_type | varchar | NO |  |
| owner_id | uuid | NO |  |
| address_type | varchar | NO |  |
| source_app | varchar | YES | 'linkme'::character varying |
| label | varchar | YES |  |
| legal_name | varchar | YES |  |
| trade_name | varchar | YES |  |
| siret | varchar | YES |  |
| vat_number | varchar | YES |  |
| address_line1 | varchar | NO |  |
| address_line2 | varchar | YES |  |
| postal_code | varchar | NO |  |
| city | varchar | NO |  |
| region | varchar | YES |  |
| country | varchar | YES | 'FR'::character varying |
| latitude | numeric | YES |  |
| longitude | numeric | YES |  |
| contact_name | varchar | YES |  |
| contact_email | varchar | YES |  |
| contact_phone | varchar | YES |  |
| is_default | boolean | YES | false |
| is_active | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| created_by | uuid | YES |  |
| updated_at | timestamptz | YES | now() |
| archived_at | timestamptz | YES |  |

**RLS :** 5 policies
- `backoffice_full_access_addresses` : ALL — authenticated
- `addresses_delete_policy` : DELETE — public
- `addresses_insert_policy` : INSERT — public
- `addresses_select_policy` : SELECT — public
- `addresses_update_policy` : UPDATE — public

**Triggers :** 2
- `trg_addresses_updated_at` : BEFORE UPDATE
- `trg_manage_default_address` : BEFORE INSERT

---

## contacts

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| organisation_id | uuid | YES |  |
| first_name | varchar | NO |  |
| last_name | varchar | NO |  |
| title | varchar | YES |  |
| department | varchar | YES |  |
| email | varchar | NO |  |
| phone | varchar | YES |  |
| mobile | varchar | YES |  |
| secondary_email | varchar | YES |  |
| direct_line | varchar | YES |  |
| is_primary_contact | boolean | YES | false |
| is_billing_contact | boolean | YES | false |
| is_technical_contact | boolean | YES | false |
| is_commercial_contact | boolean | YES | true |
| preferred_communication_method | varchar | YES | 'email'::character varying |
| accepts_marketing | boolean | YES | true |
| accepts_notifications | boolean | YES | true |
| language_preference | varchar | YES | 'fr'::character varying |
| notes | text | YES |  |
| is_active | boolean | YES | true |
| last_contact_date | timestamptz | YES |  |
| created_by | uuid | YES |  |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| enseigne_id | uuid | YES |  |
| owner_type | varchar | YES | 'organisation'::character varying |
| user_id | uuid | YES |  |
| contact_type | varchar | YES |  |
| is_delivery_only | boolean | YES | false |

**Relations :**
- `organisation_id` → `organisations.id`
- `enseigne_id` → `enseignes.id`

**RLS :** 4 policies
- `backoffice_full_access_contacts` : ALL — authenticated
- `linkme_insert_contacts` : INSERT — authenticated
- `linkme_select_contacts` : SELECT — authenticated
- `linkme_update_contacts` : UPDATE — authenticated

**Triggers :** 4
- `trg_notify_billing_contact_change` : AFTER INSERT
- `trigger_contacts_updated_at` : BEFORE UPDATE
- `trigger_set_contact_owner_type` : BEFORE INSERT
- `trigger_validate_contact_constraints` : BEFORE INSERT

---

## counterparty_bank_accounts

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| organisation_id | uuid | NO |  |
| iban | text | NO |  |
| bic | text | YES |  |
| bank_name | text | YES |  |
| account_holder_name | text | YES |  |
| is_primary | boolean | YES | false |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| created_by | uuid | YES |  |

**Relations :**
- `organisation_id` → `organisations.id`

**RLS :** 5 policies
- `backoffice_full_access_counterparty_bank_accounts` : ALL — authenticated
- `Authenticated users can delete bank accounts` : DELETE — authenticated
- `Authenticated users can insert bank accounts` : INSERT — authenticated
- `Authenticated users can read bank accounts` : SELECT — authenticated
- `Authenticated users can update bank accounts` : UPDATE — authenticated

---

## customer_addresses

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| label | text | NO | 'Domicile'::text |
| first_name | text | NO |  |
| last_name | text | NO |  |
| address | text | NO |  |
| postal_code | text | NO |  |
| city | text | NO |  |
| country | text | NO | 'FR'::text |
| phone | text | YES |  |
| is_default | boolean | NO | false |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**RLS :** 2 policies
- `users_own_addresses` : ALL — authenticated
- `staff_read_addresses` : SELECT — authenticated

---

## enseignes

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | varchar | NO |  |
| description | text | YES |  |
| logo_url | text | YES |  |
| member_count | integer | NO | 0 |
| is_active | boolean | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| created_by | uuid | YES |  |
| show_on_linkme_globe | boolean | YES | false |
| payment_delay_days | integer | YES | 0 |

**RLS :** 2 policies
- `enseignes_modify_staff` : ALL — authenticated
- `enseignes_select_all` : SELECT — authenticated

**Triggers :** 4
- `trg_create_linkme_profile_enseigne` : AFTER INSERT
- `trg_propagate_enseigne_logo_on_update` : AFTER UPDATE
- `trg_propagate_enseigne_payment_delay` : AFTER UPDATE
- `trigger_enseignes_updated_at` : BEFORE UPDATE

---

## individual_customers

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| first_name | text | NO |  |
| last_name | text | NO |  |
| email | text | YES |  |
| phone | text | YES |  |
| address_line1 | text | YES |  |
| address_line2 | text | YES |  |
| postal_code | text | YES |  |
| city | text | YES |  |
| region | text | YES |  |
| country | text | YES | 'France'::text |
| billing_address_line1 | text | YES |  |
| billing_address_line2 | text | YES |  |
| billing_postal_code | text | YES |  |
| billing_city | text | YES |  |
| billing_region | text | YES |  |
| billing_country | text | YES |  |
| has_different_billing_address | boolean | YES | false |
| language_preference | text | YES | 'fr'::text |
| accepts_marketing | boolean | YES | false |
| accepts_notifications | boolean | YES | true |
| notes | text | YES |  |
| is_active | boolean | YES | true |
| created_by | uuid | YES |  |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| abby_contact_id | text | YES |  |
| payment_terms_type | enum:payment_terms_type | YES | 'IMMEDIATE'::payment_terms_type |
| payment_terms_notes | text | YES |  |
| enseigne_id | uuid | YES |  |
| source_type | enum:customer_source_type | YES | 'internal'::customer_source_type |
| source_affiliate_id | uuid | YES |  |
| organisation_id | uuid | YES |  |
| pending_approval | boolean | YES | false |
| auth_user_id | uuid | YES |  |

**Relations :**
- `enseigne_id` → `enseignes.id`
- `source_affiliate_id` → `linkme_affiliates.id`
- `organisation_id` → `organisations.id`

**RLS :** 4 policies
- `backoffice_full_access_individual_customers` : ALL — authenticated
- `individual_customers_insert_self` : INSERT — authenticated
- `linkme_users_read_individual_customers` : SELECT — authenticated
- `customer_read_own_profile` : SELECT — authenticated

**Triggers :** 1
- `trigger_individual_customers_updated_at` : BEFORE UPDATE

---

## organisation_families

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| organisation_id | uuid | NO |  |
| family_id | uuid | NO |  |
| created_at | timestamptz | YES | now() |

**Relations :**
- `organisation_id` → `organisations.id`
- `family_id` → `families.id`

**RLS :** 1 policy
- `staff_full_access` : ALL — authenticated

---

## organisations

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | uuid_generate_v4() |
| legal_name | varchar | NO |  |
| type | enum:organisation_type | YES | 'internal'::organisation_type |
| email | varchar | YES |  |
| country | varchar | YES | 'FR'::character varying |
| is_active | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| created_by | uuid | YES |  |
| archived_at | timestamptz | YES |  |
| phone | varchar | YES |  |
| website | text | YES |  |
| secondary_email | varchar | YES |  |
| address_line1 | text | YES |  |
| address_line2 | text | YES |  |
| postal_code | varchar | YES |  |
| city | varchar | YES |  |
| region | varchar | YES |  |
| siret | varchar | YES |  |
| vat_number | varchar | YES |  |
| legal_form | varchar | YES |  |
| industry_sector | varchar | YES |  |
| supplier_segment | enum:supplier_segment_type | YES |  |
| payment_terms | varchar | YES |  |
| delivery_time_days | integer | YES |  |
| minimum_order_amount | numeric | YES |  |
| currency | varchar | YES | 'EUR'::character varying |
| rating | numeric | YES |  |
| certification_labels | text[] | YES |  |
| preferred_supplier | boolean | YES | false |
| notes | text | YES |  |
| customer_type | text | YES |  |
| prepayment_required | boolean | YES | false |
| billing_address_line1 | text | YES |  |
| billing_address_line2 | text | YES |  |
| billing_postal_code | varchar | YES |  |
| billing_city | varchar | YES |  |
| billing_region | varchar | YES |  |
| billing_country | varchar | YES | 'FR'::character varying |
| shipping_address_line1 | text | YES |  |
| shipping_address_line2 | text | YES |  |
| shipping_postal_code | varchar | YES |  |
| shipping_city | varchar | YES |  |
| shipping_region | varchar | YES |  |
| shipping_country | varchar | YES | 'FR'::character varying |
| has_different_shipping_address | boolean | YES | false |
| abby_customer_id | text | YES |  |
| default_channel_id | uuid | YES |  |
| logo_url | text | YES |  |
| trade_name | varchar | YES |  |
| has_different_trade_name | boolean | NO | false |
| siren | varchar | YES |  |
| payment_terms_type | enum:payment_terms_type | YES |  |
| payment_terms_notes | text | YES |  |
| enseigne_id | uuid | YES |  |
| is_enseigne_parent | boolean | NO | false |
| source_type | enum:customer_source_type | YES | 'internal'::customer_source_type |
| source_affiliate_id | uuid | YES |  |
| linkme_code | varchar | YES |  |
| is_service_provider | boolean | YES | false |
| source | text | YES | 'manual'::text |
| approval_status | text | YES | 'approved'::text |
| approved_at | timestamptz | YES |  |
| approved_by | uuid | YES |  |
| show_on_linkme_globe | boolean | YES | false |
| ownership_type | enum:organisation_ownership_type | YES |  |
| latitude | numeric | YES |  |
| longitude | numeric | YES |  |
| default_vat_rate | numeric | YES | 0.20 |
| kbis_url | text | YES |  |
| preferred_comm_channel | text | YES |  |
| wechat_id | text | YES |  |
| whatsapp_number | text | YES |  |
| alibaba_store_url | text | YES |  |
| supplier_specialties | text[] | YES |  |
| supplier_reliability_score | integer | YES |  |
| communication_language | text | YES | 'fr'::text |
| supplier_timezone | text | YES |  |

**Relations :**
- `source_affiliate_id` → `linkme_affiliates.id`
- `enseigne_id` → `enseignes.id`
- `default_channel_id` → `sales_channels.id`

**RLS :** 5 policies
- `organisations_modify_staff` : ALL — authenticated
- `linkme_users_insert_organisations` : INSERT — authenticated
- `organisations_anon_read_published_enseigne` : SELECT — anon
- `organisations_select_all` : SELECT — authenticated
- `linkme_users_update_organisations` : UPDATE — authenticated

**Triggers :** 10
- `audit_organisations` : AFTER INSERT
- `trg_calculate_default_vat_rate` : BEFORE INSERT
- `trg_generate_organisation_code` : BEFORE INSERT
- `trg_notify_affiliate_archive` : AFTER UPDATE
- `trg_org_inherit_enseigne_logo` : BEFORE INSERT
- `trg_organisation_approval_notification` : AFTER INSERT
- `trg_sync_ownership_type_payment` : BEFORE UPDATE
- `trg_sync_trade_name_from_legal_name` : BEFORE INSERT
- `trigger_enseigne_member_count` : AFTER INSERT
- `trigger_update_organisations_updated_at` : BEFORE UPDATE

---
