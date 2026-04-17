# Domaine Utilisateurs & Securite — Schema Base de Donnees

_Generated: 2026-04-17 23:01_

**Tables : 8**

| Table | Colonnes | FK | RLS | Triggers |
|-------|----------|----|-----|----------|
| [app_settings](#app-settings) | 8 | 0 | 2 | 1 |
| [audit_logs](#audit-logs) | 11 | 0 | 2 | 0 |
| [user_activity_logs](#user-activity-logs) | 16 | 2 | 3 | 1 |
| [user_app_roles](#user-app-roles) | 12 | 2 | 7 | 4 |
| [user_profiles](#user-profiles) | 17 | 3 | 2 | 4 |
| [user_sessions](#user-sessions) | 16 | 2 | 3 | 1 |
| [webhook_configs](#webhook-configs) | 9 | 0 | 5 | 1 |
| [webhook_logs](#webhook-logs) | 8 | 1 | 3 | 0 |

## app_settings

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| setting_key | text | NO |  |
| setting_value | jsonb | NO |  |
| setting_description | text | YES |  |
| category | text | YES |  |
| is_public | boolean | YES | false |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 2 policies
- `Back-office full access to app_settings` : ALL — public
- `Public read public settings` : SELECT — public

**Triggers :** 1
- `trg_update_app_settings_timestamp` : BEFORE UPDATE

---

## audit_logs

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES |  |
| action | text | NO |  |
| table_name | text | YES |  |
| record_id | uuid | YES |  |
| old_data | jsonb | YES |  |
| new_data | jsonb | YES |  |
| ip_address | inet | YES |  |
| user_agent | text | YES |  |
| severity | text | YES |  |
| created_at | timestamptz | YES | now() |

**RLS :** 2 policies
- `backoffice_full_access_audit_logs` : ALL — authenticated
- `audit_logs_system_insert` : INSERT — authenticated

---

## user_activity_logs

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | YES |  |
| organisation_id | uuid | YES |  |
| action | text | NO |  |
| table_name | text | YES |  |
| record_id | text | YES |  |
| old_data | jsonb | YES |  |
| new_data | jsonb | YES |  |
| severity | text | YES | 'info'::text |
| metadata | jsonb | YES | '{}'::jsonb |
| session_id | text | YES |  |
| page_url | text | YES |  |
| user_agent | text | YES |  |
| ip_address | text | YES |  |
| created_at | timestamptz | YES | now() |
| app_source | text | YES | 'back-office'::text |

**Relations :**
- `user_id` → `user_profiles.user_id`
- `organisation_id` → `organisations.id`

**RLS :** 3 policies
- `backoffice_full_access_user_activity_logs` : ALL — authenticated
- `service_insert_activity` : INSERT — public
- `users_view_own_user_activity_logs` : SELECT — authenticated

**Triggers :** 1
- `trigger_update_session_on_activity` : AFTER INSERT

---

## user_app_roles

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| app | enum:app_type | NO |  |
| role | text | NO |  |
| enseigne_id | uuid | YES |  |
| organisation_id | uuid | YES |  |
| permissions | text[] | YES | '{}'::text[] |
| is_active | boolean | NO | true |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |
| created_by | uuid | YES |  |
| default_margin_rate | numeric | YES | 15.00 |

**Relations :**
- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS :** 7 policies
- `owner_delete_roles` : DELETE — authenticated
- `Enseigne admins can insert roles for their enseigne` : INSERT — public
- `owner_insert_roles` : INSERT — authenticated
- `Users can view their own roles` : SELECT — authenticated
- `Enseigne admins can view their enseigne roles` : SELECT — public
- `privileged_view_all_roles` : SELECT — authenticated
- `owner_update_roles` : UPDATE — authenticated

**Triggers :** 4
- `prevent_last_owner_deletion_trigger` : BEFORE DELETE
- `prevent_last_owner_role_change_trigger` : BEFORE UPDATE
- `set_updated_at_user_app_roles` : BEFORE UPDATE
- `trg_sync_linkme_user_contact` : AFTER INSERT

---

## user_profiles

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| user_id | uuid | NO |  |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| first_name | text | YES |  |
| last_name | text | YES |  |
| phone | text | YES |  |
| job_title | text | YES |  |
| last_sign_in_at | timestamptz | YES |  |
| avatar_url | text | YES |  |
| individual_customer_id | uuid | YES |  |
| organisation_id | uuid | YES |  |
| partner_id | uuid | YES |  |
| user_type | enum:user_type | YES | 'staff'::user_type |
| client_type | enum:client_type | YES |  |
| app_source | enum:app_type | YES | 'back-office'::app_type |
| parent_user_id | uuid | YES |  |
| email | text | YES |  |

**Relations :**
- `individual_customer_id` → `individual_customers.id`
- `organisation_id` → `organisations.id`
- `parent_user_id` → `user_profiles.user_id`

**RLS :** 2 policies
- `backoffice_full_access_user_profiles` : ALL — authenticated
- `users_own_user_profiles` : ALL — authenticated

**Triggers :** 4
- `audit_user_profiles` : AFTER INSERT
- `set_updated_at_user_profiles` : BEFORE UPDATE
- `sync_email_on_profile_insert` : BEFORE INSERT
- `trigger_auto_assign_organisation` : BEFORE INSERT

---

## user_sessions

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| session_id | text | NO |  |
| user_id | uuid | YES |  |
| organisation_id | uuid | YES |  |
| session_start | timestamptz | NO |  |
| session_end | timestamptz | YES |  |
| last_activity | timestamptz | NO |  |
| pages_visited | integer | YES | 0 |
| actions_count | integer | YES | 0 |
| time_per_module | jsonb | YES | '{}'::jsonb |
| engagement_score | integer | YES | 0 |
| user_agent | text | YES |  |
| ip_address | text | YES |  |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |
| app_source | text | YES | 'back-office'::text |

**Relations :**
- `user_id` → `user_profiles.user_id`
- `organisation_id` → `organisations.id`

**RLS :** 3 policies
- `backoffice_full_access_user_sessions` : ALL — authenticated
- `service_manage_sessions` : ALL — public
- `users_view_own_user_sessions` : SELECT — authenticated

**Triggers :** 1
- `trigger_sessions_updated_at` : BEFORE UPDATE

---

## webhook_configs

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| url | text | NO |  |
| events | text[] | YES | '{}'::text[] |
| secret | text | NO |  |
| active | boolean | YES | true |
| description | text | YES |  |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 5 policies
- `backoffice_full_access_webhook_configs` : ALL — authenticated
- `Authenticated users can delete webhook configs` : DELETE — authenticated
- `Authenticated users can insert webhook configs` : INSERT — authenticated
- `Authenticated users can read webhook configs` : SELECT — authenticated
- `Authenticated users can update webhook configs` : UPDATE — authenticated

**Triggers :** 1
- `trigger_webhook_configs_updated_at` : BEFORE UPDATE

---

## webhook_logs

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| webhook_id | uuid | YES |  |
| event | text | NO |  |
| payload | jsonb | YES |  |
| status_code | integer | YES |  |
| response_body | text | YES |  |
| error_message | text | YES |  |
| created_at | timestamptz | YES | now() |

**Relations :**
- `webhook_id` → `webhook_configs.id`

**RLS :** 3 policies
- `backoffice_full_access_webhook_logs` : ALL — authenticated
- `Service role can insert webhook logs` : INSERT — authenticated
- `Authenticated users can read webhook logs` : SELECT — authenticated

---
