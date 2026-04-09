# Domaine : Notifications

**Description :** Notifications in-app, preferences, templates email, newsletter, formulaires site.

**Tables (9) :** `notifications`, `user_notification_preferences`, `email_templates`, `newsletter_subscribers`, `form_submissions`, `form_submission_messages`, `form_types`, `site_contact_messages`, `site_content`

---

### `notifications`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `type`       | `text`        | NO       |
| `severity`   | `text`        | NO       |
| `title`      | `text`        | NO       |
| `message`    | `text`        | NO       |
| `action_url` | `text`        | YES      |
| `user_id`    | `uuid`        | YES      |
| `read`       | `bool`        | NO       |
| `created_at` | `timestamptz` | YES      |

**RLS policies :**

- `users_own_notifications` (ALL)
- `backoffice_full_access_notifications` (ALL)
- `notifications_insert_system` (INSERT)

**Triggers :**

- `notifications_updated_at` (BEFORE UPDATE)

---

### `user_notification_preferences`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `user_id`           | `uuid`        | NO       |
| `notify_business`   | `bool`        | NO       |
| `notify_operations` | `bool`        | NO       |
| `notify_system`     | `bool`        | NO       |
| `min_severity`      | `text`        | NO       |
| `email_enabled`     | `bool`        | NO       |
| `created_at`        | `timestamptz` | YES      |

**RLS policies :**

- `staff_full_access_notification_prefs` (ALL)
- `user_own_prefs` (ALL)

---

### `email_templates`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `name`       | `text`        | NO       |
| `slug`       | `text`        | NO       |
| `subject`    | `text`        | NO       |
| `html_body`  | `text`        | NO       |
| `variables`  | `jsonb`       | YES      |
| `category`   | `text`        | YES      |
| `active`     | `bool`        | YES      |
| `created_at` | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_email_templates` (ALL)
- `Authenticated users can insert email templates` (INSERT)
- `Authenticated users can read email templates` (SELECT)
- `Authenticated users can update email templates` (UPDATE)

**Triggers :**

- `trigger_email_templates_updated_at` (BEFORE UPDATE)

---

### `newsletter_subscribers`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `email`           | `text`        | NO       |
| `source`          | `text`        | NO       |
| `is_active`       | `bool`        | YES      |
| `subscribed_at`   | `timestamptz` | YES      |
| `unsubscribed_at` | `timestamptz` | YES      |

**RLS policies :**

- `staff_read_newsletter` (ALL)
- `anon_insert_newsletter` (INSERT)

---

### `form_submissions`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `form_type`         | `text`        | NO       |
| `source`            | `text`        | NO       |
| `first_name`        | `text`        | NO       |
| `last_name`         | `text`        | NO       |
| `email`             | `text`        | NO       |
| `phone`             | `text`        | NO       |
| `message`           | `text`        | NO       |
| `status`            | `text`        | YES      |
| `priority`          | `text`        | YES      |
| `assigned_to`       | `uuid`        | YES      |
| `converted_to_type` | `text`        | YES      |
| `converted_to_id`   | `uuid`        | YES      |
| `created_at`        | `timestamptz` | YES      |

**RLS policies :**

- `Back-office full access to form_submissions` (ALL)
- `Public can insert form_submissions` (INSERT)
- `LinkMe view own selection requests` (SELECT)

**Triggers :**

- `trg_calculate_sla` (BEFORE INSERT)
- `trg_notify_form_submission` (AFTER INSERT)
- `trg_update_form_submission_timestamp` (BEFORE UPDATE)

---

### `form_submission_messages`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `form_submission_id` | `uuid`        | NO       |
| `author_type`        | `text`        | NO       |
| `author_user_id`     | `uuid`        | YES      |
| `message_body`       | `text`        | NO       |
| `message_type`       | `text`        | YES      |
| `sent_via`           | `text`        | YES      |
| `created_at`         | `timestamptz` | YES      |

**Relations (FK) :**

- `form_submission_id` → `form_submissions.id`

**RLS policies :**

- `Back-office full access to messages` (ALL)
- `LinkMe view messages for own requests` (SELECT)

---

### `form_types`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `code`            | `text`        | NO       |
| `label`           | `text`        | NO       |
| `enabled`         | `bool`        | YES      |
| `sla_hours`       | `int`         | YES      |
| `required_fields` | `jsonb`       | YES      |
| `created_at`      | `timestamptz` | YES      |

**RLS policies :**

- `Back-office full access to form_types` (ALL)
- `Public read enabled form_types` (SELECT)

**Triggers :**

- `trg_update_form_types_timestamp` (BEFORE UPDATE)

---

### `site_contact_messages`

| Colonne      | Type          | Nullable |
| ------------ | ------------- | -------- |
| `id`         | `uuid`        | NO       |
| `name`       | `text`        | NO       |
| `email`      | `text`        | NO       |
| `subject`    | `text`        | NO       |
| `message`    | `text`        | NO       |
| `status`     | `text`        | NO       |
| `created_at` | `timestamptz` | NO       |

**RLS policies :**

- `anon_insert_contact_messages` (INSERT)
- `staff_read_contact_messages` (SELECT)
- `staff_update_contact_messages` (UPDATE)

---

### `site_content`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `content_key`   | `text`        | NO       |
| `content_value` | `jsonb`       | NO       |
| `updated_at`    | `timestamptz` | NO       |
| `updated_by`    | `uuid`        | YES      |

**RLS policies :**

- `staff_manage_site_content` (ALL)
- `public_read_site_content` (SELECT)

---
