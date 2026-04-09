# Domaine : Utilisateurs

**Description :** Roles applicatifs, profils utilisateurs, sessions, logs activite, audit, webhooks.

**Tables (8) :** `user_app_roles`, `user_profiles`, `user_sessions`, `user_activity_logs`, `audit_logs`, `app_settings`, `webhook_configs`, `webhook_logs`

---

### `user_app_roles`

| Colonne               | Type          | Nullable |
| --------------------- | ------------- | -------- |
| `id`                  | `uuid`        | NO       |
| `user_id`             | `uuid`        | NO       |
| `app`                 | `enum`        | NO       |
| `role`                | `text`        | NO       |
| `enseigne_id`         | `uuid`        | YES      |
| `organisation_id`     | `uuid`        | YES      |
| `permissions`         | `ARRAY`       | YES      |
| `is_active`           | `bool`        | NO       |
| `default_margin_rate` | `numeric`     | YES      |
| `created_at`          | `timestamptz` | NO       |

**Relations (FK) :**

- `enseigne_id` → `enseignes.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `owner_delete_roles` (DELETE)
- `Enseigne admins can insert roles for their enseigne` (INSERT)
- `owner_insert_roles` (INSERT)
- `staff_insert_roles` (INSERT)
- `owner_select_roles` (SELECT)
- `staff_select_roles` (SELECT)
- `owner_update_roles` (UPDATE)

**Triggers :**

- `prevent_last_owner_deletion_trigger` (BEFORE UPDATE)
- `prevent_last_owner_role_change_trigger` (BEFORE UPDATE)
- `set_updated_at_user_app_roles` (BEFORE UPDATE)
- `trg_sync_linkme_user_contact` (AFTER INSERT)

---

### `user_profiles`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `user_id`                | `uuid`        | NO       |
| `first_name`             | `text`        | YES      |
| `last_name`              | `text`        | YES      |
| `phone`                  | `text`        | YES      |
| `job_title`              | `text`        | YES      |
| `email`                  | `text`        | YES      |
| `avatar_url`             | `text`        | YES      |
| `user_type`              | `enum`        | YES      |
| `client_type`            | `enum`        | YES      |
| `app_source`             | `enum`        | YES      |
| `individual_customer_id` | `uuid`        | YES      |
| `organisation_id`        | `uuid`        | YES      |
| `created_at`             | `timestamptz` | YES      |

**Relations (FK) :**

- `individual_customer_id` → `individual_customers.id`
- `organisation_id` → `organisations.id`
- `parent_user_id` → `user_profiles.user_id`

**RLS policies :**

- `users_own_user_profiles` (ALL)
- `backoffice_full_access_user_profiles` (ALL)

**Triggers :**

- `audit_user_profiles` (AFTER DELETE)
- `set_updated_at_user_profiles` (BEFORE UPDATE)
- `sync_email_on_profile_insert` (BEFORE INSERT)
- `trigger_auto_assign_organisation` (BEFORE INSERT)

---

### `user_sessions`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `session_id`      | `text`        | NO       |
| `user_id`         | `uuid`        | YES      |
| `organisation_id` | `uuid`        | YES      |
| `session_start`   | `timestamptz` | NO       |
| `session_end`     | `timestamptz` | YES      |
| `last_activity`   | `timestamptz` | NO       |
| `pages_visited`   | `int`         | YES      |
| `app_source`      | `text`        | YES      |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `organisation_id` → `organisations.id`
- `user_id` → `user_profiles.user_id`

**RLS policies :**

- `service_manage_sessions` (ALL)
- `backoffice_full_access_user_sessions` (ALL)
- `users_view_own_user_sessions` (SELECT)

**Triggers :**

- `trigger_sessions_updated_at` (BEFORE UPDATE)

---

### `user_activity_logs`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `user_id`         | `uuid`        | YES      |
| `organisation_id` | `uuid`        | YES      |
| `action`          | `text`        | NO       |
| `table_name`      | `text`        | YES      |
| `record_id`       | `text`        | YES      |
| `old_data`        | `jsonb`       | YES      |
| `new_data`        | `jsonb`       | YES      |
| `app_source`      | `text`        | YES      |
| `created_at`      | `timestamptz` | YES      |

**Relations (FK) :**

- `organisation_id` → `organisations.id`
- `user_id` → `user_profiles.user_id`

**RLS policies :**

- `backoffice_full_access_user_activity_logs` (ALL)
- `service_insert_activity` (INSERT)
- `users_view_own_user_activity_logs` (SELECT)

**Triggers :**

- `trigger_update_session_on_activity` (AFTER INSERT)

---

### `audit_logs`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `user_id`    | `uuid`        | YES      |
| `action`     | `text`        | NO       |
| `table_name` | `text`        | YES      |
| `record_id`  | `uuid`        | YES      |
| `old_data`   | `jsonb`       | YES      |
| `new_data`   | `jsonb`       | YES      |
| `severity`   | `text`        | YES      |
| `created_at` | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_audit_logs` (ALL)
- `audit_logs_system_insert` (INSERT)

---

### `app_settings`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `setting_key`   | `text`        | NO       |
| `setting_value` | `jsonb`       | NO       |
| `category`      | `text`        | YES      |
| `is_public`     | `bool`        | YES      |
| `created_at`    | `timestamptz` | YES      |

**RLS policies :**

- `Back-office full access to app_settings` (ALL)
- `Public read public settings` (SELECT)

**Triggers :**

- `trg_update_app_settings_timestamp` (BEFORE UPDATE)

---

### `webhook_configs`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `name`       | `text`        | NO       |
| `url`        | `text`        | NO       |
| `events`     | `ARRAY`       | YES      |
| `secret`     | `text`        | NO       |
| `active`     | `bool`        | YES      |
| `created_at` | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_webhook_configs` (ALL)
- `Authenticated users can delete webhook configs` (DELETE)
- `Authenticated users can insert webhook configs` (INSERT)
- `Authenticated users can read webhook configs` (SELECT)
- `Authenticated users can update webhook configs` (UPDATE)

**Triggers :**

- `trigger_webhook_configs_updated_at` (BEFORE UPDATE)

---

### `webhook_logs`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `webhook_id`    | `uuid`        | YES      |
| `event`         | `text`        | NO       |
| `payload`       | `jsonb`       | YES      |
| `status_code`   | `int`         | YES      |
| `error_message` | `text`        | YES      |
| `created_at`    | `timestamptz` | YES      |

**Relations (FK) :**

- `webhook_id` → `webhook_configs.id`

**RLS policies :**

- `backoffice_full_access_webhook_logs` (ALL)
- `Service role can insert webhook logs` (INSERT)
- `Authenticated users can read webhook logs` (SELECT)

---
