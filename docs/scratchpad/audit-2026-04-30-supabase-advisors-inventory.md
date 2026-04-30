# Inventaire Supabase Security Advisors — 2026-04-30

## Résumé chiffré

- **Total brut** : 722 advisors
- **ERROR** : 14 / **WARN** : 708 / **INFO** : 0
- **Issues uniques** (par règle) : 10
- **Timestamp audit** : 2026-04-30 (après remédiation 2026-04-29)

## Par règle (top 20 par count, par level)

| Règle                                                | Count | Level | Remediation                                                      |
| ---------------------------------------------------- | ----: | ----- | ---------------------------------------------------------------- |
| `anon_security_definer_function_executable`          |   314 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `authenticated_security_definer_function_executable` |   314 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `rls_policy_always_true`                             |    48 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `function_search_path_mutable`                       |    21 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `security_definer_view`                              |    13 | ERROR | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `public_bucket_allows_listing`                       |     5 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `materialized_view_in_api`                           |     3 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `extension_in_public`                                |     2 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `auth_users_exposed`                                 |     1 | ERROR | [Doc](https://supabase.com/docs/guides/database/database-linter) |
| `auth_leaked_password_protection`                    |     1 | WARN  | [Doc](https://supabase.com/docs/guides/database/database-linter) |

## Détail ERROR (14 total)

### `auth_users_exposed` (1 instances)

**Title**: Exposed Auth Users

**Description**: Detects if auth.users is exposed to anon or authenticated roles via a view or materialized view in schemas exposed to PostgREST, potentially compromising user data security.

**Level**: ERROR

**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0002_auth_users_exposed

**Instances**:

1. View/Materialized View "v_linkme_users" in the public schema may expose \`auth.users\` data to anon or authenticated roles.
   - Metadata: {
     "name": "v_linkme_users",
     "type": "view",
     "schema": "public",
     "exposed_to": [
     "anon"
     ]
     }

### `security_definer_view` (13 instances)

**Title**: Security Definer View

**Description**: Detects views defined with the SECURITY DEFINER property. These views enforce Postgres permissions and row level security policies (RLS) of the view creator, rather than that of the querying user

**Level**: ERROR

**Remediation**: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view

**Instances**:

1. View \`public.v_linkme_users\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "v_linkme_users",
     "type": "view",
     "schema": "public"
     }
2. View \`public.linkme_orders_enriched\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "linkme_orders_enriched",
     "type": "view",
     "schema": "public"
     }
3. View \`public.v_transactions_unified\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "v_transactions_unified",
     "type": "view",
     "schema": "public"
     }
4. View \`public.stock_alerts_unified_view\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "stock_alerts_unified_view",
     "type": "view",
     "schema": "public"
     }
5. View \`public.v_transaction_documents\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "v_transaction_documents",
     "type": "view",
     "schema": "public"
     }
6. View \`public.linkme_order_items_enriched\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "linkme_order_items_enriched",
     "type": "view",
     "schema": "public"
     }
7. View \`public.v_library_missing_documents\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "v_library_missing_documents",
     "type": "view",
     "schema": "public"
     }
8. View \`public.linkme_orders_with_margins\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "linkme_orders_with_margins",
     "type": "view",
     "schema": "public"
     }
9. View \`public.v_library_documents\` is defined with the SECURITY DEFINER property
   - Metadata: {
     "name": "v_library_documents",
     "type": "view",
     "schema": "public"
     }
10. View \`public.v_all_payments\` is defined with the SECURITY DEFINER property

- Metadata: {
  "name": "v_all_payments",
  "type": "view",
  "schema": "public"
  }

11. View \`public.linkme_globe_items\` is defined with the SECURITY DEFINER property

- Metadata: {
  "name": "linkme_globe_items",
  "type": "view",
  "schema": "public"
  }

12. View \`public.affiliate_pending_orders\` is defined with the SECURITY DEFINER property

- Metadata: {
  "name": "affiliate_pending_orders",
  "type": "view",
  "schema": "public"
  }

13. View \`public.v_matching_rules_with_org\` is defined with the SECURITY DEFINER property

- Metadata: {
  "name": "v_matching_rules_with_org",
  "type": "view",
  "schema": "public"
  }

## SECURITY DEFINER VIEWS (13 total)

Vues utilisant SECURITY DEFINER (risque d'escalade RLS):

1.  `affiliate_pending_orders`
2.  `linkme_globe_items`
3.  `linkme_order_items_enriched`
4.  `linkme_orders_enriched`
5.  `linkme_orders_with_margins`
6.  `stock_alerts_unified_view`
7.  `v_all_payments`
8.  `v_library_documents`
9.  `v_library_missing_documents`
10. `v_linkme_users`
11. `v_matching_rules_with_org`
12. `v_transaction_documents`
13. `v_transactions_unified`

**Analyse d'impact**:

- Ces 13 vues exécutent avec les permissions du créateur (généralement `postgres`), contournant les RLS du rôle requêtant
- Ils sont tous en schéma `public` donc accessibles à `anon` et `authenticated`
- Remédiation: Recréer sans SECURITY DEFINER + renforcer RLS, ou utiliser des fonctions RPC restrictives

## SECURITY DEFINER FUNCTIONS (628 total : 314 anon + 314 authenticated)

**Total unique function names**: 309

### Top 30 noms par ordre alphabétique

1.  `acquire_sync_lock                                           ` (anon: 1, auth: 1)
2.  `add_product_to_selection                                    ` (anon: 1, auth: 1)
3.  `apply_matching_rule_confirm                                 ` (anon: 1, auth: 1)
4.  `apply_rule_simple                                           ` (anon: 1, auth: 1)
5.  `approve_affiliate_product                                   ` (anon: 1, auth: 1)
6.  `approve_storage_request                                     ` (anon: 1, auth: 1)
7.  `archive_address                                             ` (anon: 1, auth: 1)
8.  `assign_linkme_display_number                                ` (anon: 1, auth: 1)
9.  `audit_trigger_function                                      ` (anon: 1, auth: 1)
10. `auto_add_sourcing_product_to_linkme                         ` (anon: 1, auth: 1)
11. `auto_assign_organisation_on_user_create                     ` (anon: 1, auth: 1)
12. `auto_classify_all_unmatched                                 ` (anon: 1, auth: 1)
13. `auto_lock_section_if_complete                               ` (anon: 1, auth: 1)
14. `auto_match_bank_transaction                                 ` (anon: 2, auth: 2)
15. `auto_validate_alerts_on_order_confirmed                     ` (anon: 1, auth: 1)
16. `backfill_order_affiliate_from_items                         ` (anon: 1, auth: 1)
17. `batch_add_google_merchant_products                          ` (anon: 1, auth: 1)
18. `batch_add_meta_commerce_products                            ` (anon: 1, auth: 1)
19. `calculate_affiliate_product_price                           ` (anon: 1, auth: 1)
20. `calculate_annual_revenue_bfa                                ` (anon: 1, auth: 1)
21. `calculate_package_price                                     ` (anon: 1, auth: 1)
22. `calculate_product_price_old                                 ` (anon: 1, auth: 1)
23. `calculate_retrocession_amount                               ` (anon: 1, auth: 1)
24. `calculate_sla_deadline                                      ` (anon: 1, auth: 1)
25. `cancel_affiliate_remainder                                  ` (anon: 1, auth: 1)
26. `cancel_order_forecast_movements                             ` (anon: 1, auth: 1)
27. `check_incomplete_catalog_products                           ` (anon: 1, auth: 1)
28. `check_late_shipments                                        ` (anon: 1, auth: 1)
29. `check_linkme_access_by_email                                ` (anon: 1, auth: 1)
30. `check_linkme_affiliate_access                               ` (anon: 1, auth: 1)

### Distribution par préfixe (tous 309 fonctions uniques)

| Préfixe       | Count | Type probable           |
| ------------- | ----: | ----------------------- |
| `get`         |    71 | RPC publique (SELECT)   |
| `notify`      |    27 | Notification/Signal     |
| `update`      |    23 | RPC publique (UPDATE)   |
| `create`      |    15 | RPC publique (INSERT)   |
| `is`          |    15 | Vérification (logique)  |
| `handle`      |    12 | Trigger interne         |
| `check`       |     9 | Vérification (logique)  |
| `auto`        |     6 | Trigger interne (auto-) |
| `calculate`   |     6 | Calcul (trigger?)       |
| `validate`    |     6 | Vérification (logique)  |
| `log`         |     5 | Logging (trigger)       |
| `reset`       |     5 | Maintenance (trigger?)  |
| `rollback`    |     5 | Inconnu                 |
| `track`       |     5 | Inconnu                 |
| `cleanup`     |     4 | Nettoyage (trigger?)    |
| `increment`   |     4 | Inconnu                 |
| `mark`        |     4 | Inconnu                 |
| `recalculate` |     4 | Inconnu                 |
| `sync`        |     4 | Inconnu                 |
| `generate`    |     3 | Inconnu                 |

**⚠️ Analyse critique**:

- ~71 fonctions `get_*` → RPC publiques (SELECT direct, probable impact anon)
- ~27 `notify_*` → Notifications (moins critique mais checker les données exposées)
- ~23 `update_*` + ~15 `create_*` → Modifications publiques (TRÈS CRITIQUE)
- ~40 fonctions trigger internes (`auto_*`, `handle_*`) → Exposées par erreur, vérifier leur nécessité en RPC

## RLS POLICY ALWAYS_TRUE (48 policies sur ~20 tables)

| Table          | Commande | Policy Name                                           | Risque        |
| -------------- | -------- | ----------------------------------------------------- | ------------- |
| `public.table` | ALL      | Back-office full access on affiliate_archive_requests | 🔴🔴 CRITIQUE |
| `public.table` | INSERT   | audit_logs_system_insert                              | 🔴 CRITIQUE   |
| `public.table` | INSERT   | bte_audit_insert                                      | 🔴 CRITIQUE   |
| `public.table` | DELETE   | channel_product_metadata_delete_policy                | 🔴 CRITIQUE   |
| `public.table` | INSERT   | channel_product_metadata_insert_policy                | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | channel_product_metadata_update_policy                | 🔴 CRITIQUE   |
| `public.table` | DELETE   | collection_images_delete_authenticated                | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | collection_images_update_authenticated                | 🔴 CRITIQUE   |
| `public.table` | DELETE   | collection_shares_delete                              | 🔴 CRITIQUE   |
| `public.table` | INSERT   | collection_shares_insert                              | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | collection_shares_update                              | 🔴 CRITIQUE   |
| `public.table` | DELETE   | consultation_images_delete                            | 🔴 CRITIQUE   |
| `public.table` | INSERT   | consultation_images_insert                            | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | consultation_images_update                            | 🔴 CRITIQUE   |
| `public.table` | DELETE   | Authenticated users can delete bank accounts          | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Authenticated users can insert bank accounts          | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | Authenticated users can update bank accounts          | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Authenticated users can insert email templates        | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | Authenticated users can update email templates        | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | finance_settings_update                               | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Public can insert form_submissions                    | 🔴 CRITIQUE   |
| `public.table` | INSERT   | individual_customers_insert_self                      | 🔴 CRITIQUE   |
| `public.table` | ALL      | Authenticated users full access matching_rules        | 🔴🔴 CRITIQUE |
| `public.table` | ALL      | mcp_queue_authenticated_all                           | 🔴🔴 CRITIQUE |
| `public.table` | INSERT   | anon_insert_newsletter                                | 🔴 CRITIQUE   |
| `public.table` | INSERT   | notifications_insert_system                           | 🔴 CRITIQUE   |
| `public.table` | INSERT   | product_colors_insert_authenticated                   | 🔴 CRITIQUE   |
| `public.table` | INSERT   | product_packages_insert_authenticated                 | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | product_packages_update_authenticated                 | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Public can create sales_order_items                   | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Public can create sales_orders                        | 🔴 CRITIQUE   |
| `public.table` | INSERT   | anon_insert_contact_messages                          | 🔴 CRITIQUE   |
| `public.table` | DELETE   | stock_alert_tracking_delete_policy                    | 🔴 CRITIQUE   |
| `public.table` | INSERT   | stock_alert_tracking_insert_policy                    | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | stock_alert_tracking_update_policy                    | 🔴 CRITIQUE   |
| `public.table` | INSERT   | system_triggers_can_insert_stock_movements            | 🔴 CRITIQUE   |
| `public.table` | DELETE   | stock_reservations_delete_authenticated               | 🔴 CRITIQUE   |
| `public.table` | INSERT   | stock_reservations_insert_authenticated               | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | stock_reservations_update_authenticated               | 🔴 CRITIQUE   |
| `public.table` | DELETE   | transaction_document_links_delete                     | 🔴 CRITIQUE   |
| `public.table` | INSERT   | transaction_document_links_insert                     | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | transaction_document_links_update                     | 🔴 CRITIQUE   |
| `public.table` | INSERT   | service_insert_activity                               | 🔴 CRITIQUE   |
| `public.table` | ALL      | service_manage_sessions                               | 🔴🔴 CRITIQUE |
| `public.table` | DELETE   | Authenticated users can delete webhook configs        | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Authenticated users can insert webhook configs        | 🔴 CRITIQUE   |
| `public.table` | UPDATE   | Authenticated users can update webhook configs        | 🔴 CRITIQUE   |
| `public.table` | INSERT   | Service role can insert webhook logs                  | 🔴 CRITIQUE   |

**Tables affectées par ALWAYS_TRUE**:

1.  `table`

**⚠️ Criticité**:

- 3 policies `ALL` → Accès complet (`affiliate_archive_requests`, `matching_rules`, `mcp_queue_authenticated_all`)
- 45 policies INSERT/UPDATE/DELETE → Risque de corruption/exposition données

## PUBLIC BUCKETS AVEC LISTING ACTIVÉ (5 buckets)

1. `affiliate-products` - Permet listing public de tous les fichiers
2. `collection-images` - Permet listing public de tous les fichiers
3. `linkme-delivery-forms` - Permet listing public de tous les fichiers
4. `organisation-logos` - Permet listing public de tous les fichiers
5. `product-images` - Permet listing public de tous les fichiers

Remédiation: Retirer les policies SELECT broadscope, garder uniquement Storage token-based access

## AUTRES WARN CRITIQUES

### Materialized Views Exposées (3)

- `product_prices_summary` (anon/authenticated accessible)
- `google_merchant_stats` (anon/authenticated accessible)
- `stock_snapshot` (anon/authenticated accessible)

### Extensions en schéma public (2)

- `pg_trgm` → Déplacer vers schéma `extensions`
- `unaccent` → Déplacer vers schéma `extensions`

### Auth: Leaked Password Protection (1)

- Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org. Enable this feature to enhance security.

### Function Search Path Mutable (21)

Risque: Pollution du search_path → Injection SQL (préfixer les appels à types/fonctions)

## SIGNAUX NOUVEAUX vs AUDIT 2026-04-29

**Ancien**: 14 ERROR + 708 WARN, 80 issues uniques
**Nouveau**: 14 ERROR + 708 WARN (identique)

### ✅ Pas de changement sur:

- Nombre total d'advisors
- Répartition ERROR/WARN
- Fonctions `anon_security_definer_function_executable` (314)
- Fonctions `authenticated_security_definer_function_executable` (314)

### ⚠️ À vérifier:

- La métrique 'issues uniques après dédoublonnage' du 2026-04-29 (80) ne correspond pas à 10 règles distinctes → confirmation que dédoublonnage = par (rule, target object)
- `v_linkme_users` expose toujours `auth.users` à `anon` → CRITIQUE

## PLAN DE REMÉDIATION PROPOSÉ (3 PRs sequentielles)

### PR 1: STOP-THE-BLEED (Immédiat)

- Supprimer ou restricter les 3 policies `ALL` qui bypassed RLS
- Désactiver listing sur 5 public buckets
- Fixer `auth_users_exposed` sur `v_linkme_users`
- Estim: 1-2 jours

### PR 2: SECURITY DEFINER (2-3 semaines)

- Recréer 13 vues sans SECURITY DEFINER + renforcer RLS
- Vérifier 309 fonctions: trigger internes (keep) vs RPC publiques (restructure)
- Estim: 10-15 jours

### PR 3: CLEANUP (3-4 semaines)

- Fixer 45 policies `always_true` (une par une, vérifier impact)
- Fixer `function_search_path_mutable` (21 fonctions)
- Déplacer extensions hors public
- Estim: 15-20 jours
