# Domaine Notifications & Formulaires — Schema Base de Donnees

_Generated: 2026-04-17 22:31_

**Tables : 9**

| Table | Colonnes | FK | RLS | Triggers |
|-------|----------|----|-----|----------|
| [email_templates](#email-templates) | 10 | 0 | 4 | 1 |
| [form_submission_messages](#form-submission-messages) | 11 | 1 | 2 | 0 |
| [form_submissions](#form-submissions) | 30 | 0 | 3 | 3 |
| [form_types](#form-types) | 17 | 0 | 2 | 1 |
| [newsletter_subscribers](#newsletter-subscribers) | 6 | 0 | 2 | 0 |
| [notifications](#notifications) | 11 | 0 | 3 | 1 |
| [site_contact_messages](#site-contact-messages) | 8 | 0 | 3 | 0 |
| [site_content](#site-content) | 5 | 0 | 2 | 0 |
| [user_notification_preferences](#user-notification-preferences) | 13 | 0 | 2 | 0 |

## email_templates

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| slug | text | NO |  |
| subject | text | NO |  |
| html_body | text | NO |  |
| variables | jsonb | YES | '[]'::jsonb |
| category | text | YES | 'general'::text |
| active | boolean | YES | true |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 4 policies
- `backoffice_full_access_email_templates` : ALL — authenticated
- `Authenticated users can insert email templates` : INSERT — authenticated
- `Authenticated users can read email templates` : SELECT — authenticated
- `Authenticated users can update email templates` : UPDATE — authenticated

**Triggers :** 1
- `trigger_email_templates_updated_at` : BEFORE UPDATE

---

## form_submission_messages

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| form_submission_id | uuid | NO |  |
| author_type | text | NO |  |
| author_user_id | uuid | YES |  |
| author_name | text | YES |  |
| message_body | text | NO |  |
| message_type | text | YES | 'reply'::text |
| sent_via | text | YES | 'internal'::text |
| email_id | text | YES |  |
| email_sent_at | timestamptz | YES |  |
| created_at | timestamptz | YES | now() |

**Relations :**
- `form_submission_id` → `form_submissions.id`

**RLS :** 2 policies
- `Back-office full access to messages` : ALL — public
- `LinkMe view messages for own requests` : SELECT — public

---

## form_submissions

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| form_type | text | NO |  |
| source | text | NO |  |
| source_reference_id | uuid | YES |  |
| source_reference_name | text | YES |  |
| first_name | text | NO |  |
| last_name | text | NO |  |
| email | text | NO |  |
| phone | text | NO |  |
| company_name | text | YES |  |
| role | text | YES |  |
| subject | text | YES |  |
| message | text | NO |  |
| primary_category | text | YES |  |
| tags | text[] | YES |  |
| status | text | YES | 'new'::text |
| priority | text | YES | 'medium'::text |
| assigned_to | uuid | YES |  |
| sla_deadline | timestamptz | YES |  |
| internal_notes | text | YES |  |
| converted_to_type | text | YES |  |
| converted_to_id | uuid | YES |  |
| converted_at | timestamptz | YES |  |
| metadata | jsonb | YES | '{}'::jsonb |
| created_at | timestamptz | YES | now() |
| read_at | timestamptz | YES |  |
| first_reply_at | timestamptz | YES |  |
| closed_at | timestamptz | YES |  |
| created_by | uuid | YES |  |
| updated_at | timestamptz | YES | now() |

**RLS :** 3 policies
- `Back-office full access to form_submissions` : ALL — public
- `Public can insert form_submissions` : INSERT — public
- `LinkMe view own selection requests` : SELECT — public

**Triggers :** 3
- `trg_calculate_sla` : BEFORE INSERT
- `trg_notify_form_submission` : AFTER INSERT
- `trg_update_form_submission_timestamp` : BEFORE UPDATE

---

## form_types

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| code | text | NO |  |
| label | text | NO |  |
| description | text | YES |  |
| enabled | boolean | YES | true |
| icon | text | YES |  |
| color | text | YES |  |
| default_category | text | YES |  |
| default_priority | text | YES |  |
| sla_hours | integer | YES |  |
| required_fields | jsonb | YES | '["first_name", "last_name", "email", "p |
| optional_fields | jsonb | YES | '["company", "role", "subject"]'::jsonb |
| routing_rules | jsonb | YES | '{}'::jsonb |
| conversion_config | jsonb | YES | '{}'::jsonb |
| display_order | integer | YES | 0 |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 2 policies
- `Back-office full access to form_types` : ALL — public
- `Public read enabled form_types` : SELECT — public

**Triggers :** 1
- `trg_update_form_types_timestamp` : BEFORE UPDATE

---

## newsletter_subscribers

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| email | text | NO |  |
| source | text | NO | 'site-internet'::text |
| is_active | boolean | YES | true |
| subscribed_at | timestamptz | YES | now() |
| unsubscribed_at | timestamptz | YES |  |

**RLS :** 2 policies
- `staff_read_newsletter` : ALL — authenticated
- `anon_insert_newsletter` : INSERT — anon,authenticated

---

## notifications

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| type | text | NO |  |
| severity | text | NO |  |
| title | text | NO |  |
| message | text | NO |  |
| action_url | text | YES |  |
| action_label | text | YES |  |
| user_id | uuid | YES |  |
| read | boolean | NO | false |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 3 policies
- `backoffice_full_access_notifications` : ALL — authenticated
- `users_own_notifications` : ALL — authenticated
- `notifications_insert_system` : INSERT — public

**Triggers :** 1
- `notifications_updated_at` : BEFORE UPDATE

---

## site_contact_messages

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| name | text | NO |  |
| email | text | NO |  |
| subject | text | NO |  |
| message | text | NO |  |
| status | text | NO | 'new'::text |
| created_at | timestamptz | NO | now() |
| updated_at | timestamptz | NO | now() |

**RLS :** 3 policies
- `anon_insert_contact_messages` : INSERT — anon,authenticated
- `staff_read_contact_messages` : SELECT — authenticated
- `staff_update_contact_messages` : UPDATE — authenticated

---

## site_content

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| content_key | text | NO |  |
| content_value | jsonb | NO | '{}'::jsonb |
| updated_at | timestamptz | NO | now() |
| updated_by | uuid | YES |  |

**RLS :** 2 policies
- `staff_manage_site_content` : ALL — authenticated
- `public_read_site_content` : SELECT — anon,authenticated

---

## user_notification_preferences

| Colonne | Type | Nullable | Default |
|---------|------|----------|---------|
| id | uuid | NO | gen_random_uuid() |
| user_id | uuid | NO |  |
| notify_business | boolean | NO | true |
| notify_operations | boolean | NO | true |
| notify_system | boolean | NO | true |
| notify_catalog | boolean | NO | true |
| notify_performance | boolean | NO | true |
| notify_maintenance | boolean | NO | true |
| min_severity | text | NO | 'info'::text |
| email_enabled | boolean | NO | false |
| email_urgent_only | boolean | NO | true |
| created_at | timestamptz | YES | now() |
| updated_at | timestamptz | YES | now() |

**RLS :** 2 policies
- `user_own_prefs` : ALL — authenticated
- `staff_full_access_notification_prefs` : ALL — authenticated

---
