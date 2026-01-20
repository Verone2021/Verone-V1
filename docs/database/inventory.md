# Database Inventory

**Generated:** 2026-01-19
**Source:** Git migrations + TypeScript generated types
**Status:** ⚠️ DRIFT DETECTED

---

## Executive Summary

| Metric | Count | Notes |
|--------|-------|-------|
| **Tables in DB** (via TypeScript types) | **101** | Real database state |
| **Tables in Git migrations** | **39** | Incremental changes only |
| **Base schema tables** (not in Git) | **71** | ⚠️ Created outside Git |
| **Functions/RPCs** | 297 | Via migrations |
| **Views** | 58 | Via migrations |
| **RLS Policies** | 180 | Via migrations |
| **Triggers** | 87 | Via migrations |
| **Indexes** | 197 | Via migrations |

### 🚨 Critical Finding

**71 base schema tables exist in DB but NOT in Git migrations.**

**Impact:** Cannot reproduce database from Git alone. Initial schema was likely:
- Imported from database dump
- Created manually outside Git
- Migrated from legacy system

**Current state:** Only incremental changes (39 tables) are tracked in `supabase/migrations/`.

---

## Expected Database Structure

### App Schema (public.*)

**Tables:** 101 total
- **71 base tables** (created outside Git) - see [Base Schema Tables](#base-schema-tables-not-in-git)
- **39 incremental tables** (in Git migrations) - see [Incremental Tables](#incremental-tables-in-git)

### System Schemas (Supabase-managed, OK outside repo)

| Schema | Tables | Description |
|--------|--------|-------------|
| `auth.*` | ~15 | Supabase Auth (users, sessions, identities, refresh_tokens, etc.) |
| `storage.*` | ~8 | Supabase Storage (buckets, objects, migrations) |
| `realtime.*` | ~3 | Supabase Realtime (subscriptions, messages, presence) |
| `extensions.*` | ~5 | PostgreSQL extensions metadata |

**Total expected in real DB:** ~132 tables (101 app + 31 system)

---

## Drift Analysis

### Base Schema Tables NOT in Git

**Count:** 71 tables

These tables exist in production DB but are NOT declared in `supabase/migrations/`:

<details>
<summary><b>Core Business (7 tables)</b></summary>

- `products` - Product catalog (**190 code refs** - most used table)
- `organisations` - Customer/supplier orgs (**112 code refs**)
- `sales_orders` - Sales orders (**84 code refs**)
- `purchase_orders` - Purchase orders (**43 code refs**)
- `categories` - Product categories
- `subcategories` - Product subcategories
- `families` - Product families

</details>

<details>
<summary><b>LinkMe (13 tables)</b></summary>

- `linkme_affiliates` (**55 code refs**)
- `linkme_selections` (**46 code refs**)
- `linkme_selection_items`
- `linkme_commissions`
- `linkme_channel_suppliers`
- `linkme_tracking`
- `client_consultations`
- `consultation_images`
- `consultation_products`

</details>

<details>
<summary><b>Finance (5 tables)</b></summary>

- `invoices`
- `invoice_status_history`
- `payments`
- `financial_document_lines`

</details>

<details>
<summary><b>Stock Management (6 tables)</b></summary>

- `stock_movements` (**39 code refs**)
- `stock_reservations`
- `stock_alert_tracking`
- `storage_allocations`
- `purchase_order_receptions`
- `sales_order_shipments`

</details>

<details>
<summary><b>Pricing (9 tables)</b></summary>

- `channel_pricing`
- `channel_pricing_history`
- `customer_pricing`
- `price_lists`
- `price_list_items`
- `price_list_history`
- `channel_price_lists`
- `customer_price_lists`
- `group_price_lists`

</details>

<details>
<summary><b>Products Extended (11 tables)</b></summary>

- `product_images` (**44 code refs**)
- `product_colors`
- `product_drafts`
- `product_status_changes`
- `product_packages`
- `product_groups`
- `product_group_members`
- `variant_groups`
- `channel_product_metadata`
- `channel_product_pricing`

</details>

<details>
<summary><b>Collections & Content (6 tables)</b></summary>

- `collections`
- `collection_products`
- `collection_images`
- `collection_translations`
- `collection_shares`
- `category_translations`

</details>

<details>
<summary><b>Users & Auth (4 tables)</b></summary>

- `user_profiles` (**43 code refs**)
- `user_sessions`
- `user_activity_logs`
- `contacts`

</details>

<details>
<summary><b>Customers (4 tables)</b></summary>

- `individual_customers`
- `customer_groups`
- `customer_group_members`
- `enseignes`

</details>

<details>
<summary><b>Sample Orders (2 tables)</b></summary>

- `sample_orders`
- `sample_order_items`

</details>

<details>
<summary><b>Sales Channels (1 table)</b></summary>

- `sales_channels`

</details>

<details>
<summary><b>Integrations (3 tables)</b></summary>

- `google_merchant_syncs`
- `feed_configs`
- `feed_exports`
- `feed_performance_metrics`

</details>

<details>
<summary><b>Admin & System (3 tables)</b></summary>

- `audit_logs`
- `notifications`
- `mcp_resolution_queue`
- `mcp_resolution_strategies`

</details>

---

### Incremental Tables IN Git

**Count:** 39 tables (in `supabase/migrations/`)

These tables were added via migrations and ARE tracked in Git:

<details>
<summary><b>Finance (New) - 13 tables</b></summary>

- `bank_transactions` (**35 code refs**)
- `bank_transaction_matches`
- `bank_transactions_enrichment_audit`
- `financial_documents`
- `financial_document_items`
- `financial_payments`
- `finance_settings`
- `expenses`
- `counterparties`
- `counterparty_bank_accounts`
- `pcg_categories`
- `transaction_document_links`
- `matching_rules`

</details>

<details>
<summary><b>LinkMe (New) - 8 tables</b></summary>

- `linkme_catalog_products`
- `linkme_contact_requests`
- `linkme_page_configurations`
- `linkme_payment_requests`
- `linkme_payment_request_items`
- `linkme_showcase_collections`
- `linkme_showcase_collection_items`
- `sales_order_linkme_details`

</details>

<details>
<summary><b>Integrations (New) - 6 tables</b></summary>

- `qonto_clients`
- `qonto_sync_logs`
- `sync_runs`
- `webhook_configs`
- `webhook_logs`

</details>

<details>
<summary><b>Storage & Billing (New) - 3 tables</b></summary>

- `storage_allocations`
- `storage_billing_events`
- `storage_pricing_tiers`
- `affiliate_archive_requests`
- `affiliate_storage_allocations`

</details>

<details>
<summary><b>Users & Roles (New) - 3 tables</b></summary>

- `user_app_roles`
- `user_dashboard_preferences`
- `organisation_roles`

</details>

<details>
<summary><b>Forms (New) - 3 tables</b></summary>

- `form_types`
- `form_submissions`
- `form_submission_messages`

</details>

<details>
<summary><b>Settings & Config (New) - 3 tables</b></summary>

- `app_settings`
- `email_templates`

</details>

<details>
<summary><b>Products (New) - 1 table</b></summary>

- `product_commission_history`

</details>

---

## Table Categories by Domain

### Core Business (7 tables)
Most critical tables for business operations.

| Table | Code Refs | Category | In Git? |
|-------|-----------|----------|---------|
| `products` | 190 | Core | ❌ Base |
| `organisations` | 112 | Core | ❌ Base |
| `sales_orders` | 84 | Core | ❌ Base |
| `purchase_orders` | 43 | Core | ❌ Base |
| `categories` | - | Core | ❌ Base |
| `subcategories` | - | Core | ❌ Base |
| `families` | - | Core | ❌ Base |

### LinkMe Domain (21 tables)
Marketplace/affiliate platform.

| Table | Code Refs | In Git? |
|-------|-----------|---------|
| `linkme_affiliates` | 55 | ❌ Base |
| `linkme_selections` | 46 | ❌ Base |
| `linkme_catalog_products` | - | ✅ Incremental |
| `linkme_showcase_collections` | - | ✅ Incremental |
| `linkme_payment_requests` | - | ✅ Incremental |
| ... (16 more) | | |

### Finance (18 tables)
Financial documents, transactions, accounting.

| Table | Code Refs | In Git? |
|-------|-----------|---------|
| `bank_transactions` | 35 | ✅ Incremental |
| `financial_documents` | - | ✅ Incremental |
| `invoices` | - | ❌ Base |
| `payments` | - | ❌ Base |
| ... (14 more) | | |

### Stock Management (6 tables)

| Table | Code Refs | In Git? |
|-------|-----------|---------|
| `stock_movements` | 39 | ❌ Base |
| `stock_reservations` | - | ❌ Base |
| `storage_allocations` | - | ✅ Incremental |
| ... (3 more) | | |

### Users & Auth (5 tables)

| Table | Code Refs | In Git? |
|-------|-----------|---------|
| `user_profiles` | 43 | ❌ Base |
| `user_app_roles` | - | ✅ Incremental |
| `user_dashboard_preferences` | - | ✅ Incremental |
| ... (2 more) | | |

### Pricing (11 tables)
Multi-channel pricing engine.

All pricing tables are in **Base schema** (not in Git).

### Content & Collections (7 tables)

| Table | Code Refs | In Git? |
|-------|-----------|---------|
| `product_images` | 44 | ❌ Base |
| `collections` | - | ❌ Base |
| `collection_products` | - | ❌ Base |
| ... (4 more) | | |

### Integrations (9 tables)
Qonto, Google Merchant, webhooks.

Most integration tables are **Incremental** (6/9 in Git).

### Admin & System (7 tables)
Settings, audit logs, notifications.

Mixed: some Base, some Incremental.

---

## Most Referenced Tables in Code

**Top 10 tables by usage in TypeScript code:**

| Rank | Table | References | Category |
|------|-------|------------|----------|
| 1 | `products` | 190 | Core |
| 2 | `organisations` | 112 | Core |
| 3 | `sales_orders` | 84 | Core |
| 4 | `linkme_affiliates` | 55 | LinkMe |
| 5 | `linkme_selections` | 46 | LinkMe |
| 6 | `product_images` | 44 | Products |
| 7 | `user_profiles` | 43 | Users |
| 8 | `purchase_orders` | 43 | Core |
| 9 | `stock_movements` | 39 | Stock |
| 10 | `bank_transactions` | 35 | Finance |

**Analysis:**
- Core business tables (`products`, `organisations`, `sales_orders`) are most used
- All top 10 tables are actively used in code (not orphaned)
- Mix of Base schema (8/10) and Incremental (2/10: `bank_transactions` at #10)

---

## Most Called RPC Functions

**Top 5 functions called via `.rpc()` in code:**

| Rank | Function | Calls | Purpose |
|------|----------|-------|---------|
| 1 | `get_site_internet_products` | 7 | Product catalog for website |
| 2 | `set_current_user_id` | 3 | User context for RLS |
| 3 | `get_linkme_orders` | 3 | LinkMe orders query |
| 4 | `generate_so_number` | 3 | Sales order numbering |
| 5 | `search_organisations_unaccent` | 2 | Org search (accent-insensitive) |

**Note:** 297 functions total in migrations. Most are triggers, not RPC endpoints.

---

## Functions, Views, Triggers, Indexes

### Functions (297 total)

**By purpose:**
- **Trigger functions:** ~150 (audit logs, updated_at, validation, etc.)
- **RPC endpoints:** ~30 (called via `.rpc()` from code)
- **Helper functions:** ~117 (internal, used by other functions/views)

**Categories:**
- Audit & versioning
- Business logic (commission calculations, pricing, stock)
- Search & filtering (unaccent, full-text)
- Data transformations
- Validation

### Views (58 total)

**Categories:**
- Materialized views for reporting
- Simplified data access (joins, aggregations)
- Business KPIs (sales, stock, commissions)
- LinkMe analytics

**Note:** Views reference Base schema tables, so they depend on those 71 tables existing.

### Triggers (87 total)

**Categories:**
- `updated_at` timestamp automation (~40 triggers)
- Audit log creation (~20 triggers)
- Business rule enforcement (stock validation, pricing sync, etc.)
- Cascade updates

**Note:** Many triggers reference Base schema tables.

### Indexes (197 total)

**Categories:**
- Primary keys (101 indexes, 1 per table)
- Foreign keys (~60 indexes)
- Search optimization (GIN, GiST for full-text, JSON)
- Unique constraints
- Performance indexes (composite, partial)

---

## Issues Summary

### 🚨 Critical Issues

#### 1. Source of Truth Violation

**Severity:** CRITICAL
**Type:** Incomplete migration history
**Description:** 71 base schema tables exist in DB but NOT in Git migrations.

**Impact:**
- Cannot reproduce database from Git alone
- New developers cannot understand full schema from migrations
- Risk of drift between environments (local vs staging vs prod)
- No rollback capability for base schema

**Affected Tables:** 71 (see [Base Schema Tables](#base-schema-tables-not-in-git))

**Recommendation:**

**Option A (Recommended):** Export base schema to Git
1. Create a new migration `20260120000000_base_schema.sql`
2. Extract DDL for 71 base tables from prod DB
3. Include in migration:
   - CREATE TABLE statements
   - Indexes, constraints, foreign keys
   - Initial RLS policies
   - Triggers
4. Commit to Git
5. Future: All DB changes go through migrations

**Option B:** Document external schema source
1. Add `docs/database/base-schema-import.md`
2. Document:
   - Where base schema came from (dump, legacy system, manual creation)
   - Date of import
   - How to reproduce in new environment
3. Accept that base schema is external to Git
4. Only track incremental changes (current state)

**Decision needed:** Choose Option A or B with user/team.

---

### ⚠️ Warnings

#### 1. Incomplete Migration History

**Severity:** WARNING
**Type:** Documentation gap
**Description:** Migration history only shows incremental changes (39 tables), not complete schema.

**Impact:** New developers/environments need external schema source.

**Recommendation:** If choosing Option B above, create comprehensive documentation of base schema origin and reproduction steps.

---

### Performance

No critical performance issues detected in analysis.

**Note:** Cannot verify index usage without query logs. Recommend:
- Enable `pg_stat_statements` in Supabase
- Analyze slow queries
- Add indexes as needed

---

## SQL Verification Queries

To verify this inventory on real Postgres DB, run these queries:

### Count tables by schema
```sql
SELECT schemaname, COUNT(*)
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
GROUP BY schemaname
ORDER BY schemaname;
```

Expected output:
```
schemaname | count
-----------+------
auth       | 15
extensions | 5
public     | 101
realtime   | 3
storage    | 8
```

### List all public tables
```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: 101 tables

### Count RLS policies by table
```sql
SELECT tablename, COUNT(policyname) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

Expected: ~180 policies across tables

### Find tables without RLS
```sql
SELECT t.tablename
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
GROUP BY t.tablename;
```

Expected: Should be empty (all tables should have RLS)

### Find missing indexes on foreign keys
```sql
SELECT
  conrelid::regclass AS table_name,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_def
FROM pg_constraint
WHERE contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index
    WHERE indrelid = conrelid
      AND indkey::int[] @> conkey::int[]
  );
```

Expected: Should be empty or minimal (most FKs should have indexes)

---

## Next Steps

1. **Decision:** Choose Option A (export base schema) or Option B (document external source)
2. **If Option A:**
   - Schedule base schema export task
   - Create `20260120000000_base_schema.sql` migration
   - Test on fresh DB instance
   - Document migration convention update
3. **If Option B:**
   - Create `docs/database/base-schema-import.md`
   - Document schema provenance
   - Update onboarding docs for new devs
4. **Audit:** Run SQL verification queries on prod DB
5. **Monitor:** Set up drift detection (quarterly audits)
6. **Enforce:** All future DB changes MUST go through migrations

---

## Audit History

- **2026-01-19:** Initial inventory (Phase 2A) - Drift detected (71 base tables not in Git)
- **Next audit:** TBD (recommend quarterly or after major schema changes)

---

**End of Inventory**
