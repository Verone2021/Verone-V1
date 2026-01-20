# Table vs View Audit

**Generated:** 2026-01-20  
**Context:** Phase 4.1 - Resolving Dashboard 101 vs Phase 2A 112 ambiguity  
**Status:** ✅ Mystery Solved

---

## Executive Summary

**Dashboard Supabase shows "101 tables"** - This count represents **TABLES ONLY** (excludes views).

**Actual Database State (from TypeScript types):**
- Public tables: **101**
- Public views: **23**
- **Total public objects: 124**

**Git Migrations State:**
- CREATE TABLE: **37** (excludes backup tables like `_backup_*`, `_stock_audit_`)
- CREATE VIEW: **23**
- **Total Git objects: 60**

**Key Findings:**
1. ✅ Dashboard count of 101 = **tables only** (not including views)
2. ❌ **Base schema drift: 75 tables** not in Git migrations
3. ⚠️ **11 tables** in Git but not in DB (likely renamed/dropped/converted)
4. ℹ️ **Views mostly aligned**: 19/23 common between DB and Git

---

## Source 1: TypeScript Types

**File:** `packages/@verone/types/src/supabase.ts`

**Structure:**
```typescript
Database['public']['Tables']  // 101 tables
Database['public']['Views']   // 23 views
```

### Tables in Database (101)

<details>
<summary>Click to expand full list</summary>

```
affiliate_archive_requests
affiliate_storage_allocations
app_settings
audit_logs
bank_transactions
bank_transactions_enrichment_audit
categories
category_translations
channel_price_lists
channel_pricing
channel_pricing_history
channel_product_metadata
channel_product_pricing
client_consultations
collection_images
collection_products
collection_shares
collection_translations
collections
consultation_images
consultation_products
contacts
counterparty_bank_accounts
customer_group_members
customer_groups
customer_price_lists
customer_pricing
email_templates
enseignes
families
feed_configs
feed_exports
feed_performance_metrics
finance_settings
financial_document_lines
financial_documents
financial_payments
form_submission_messages
form_submissions
form_types
google_merchant_syncs
group_price_lists
individual_customers
invoice_status_history
invoices
linkme_affiliates
linkme_channel_suppliers
linkme_commissions
linkme_page_configurations
linkme_payment_request_items
linkme_payment_requests
linkme_selection_items
linkme_selections
linkme_tracking
matching_rules
mcp_resolution_queue
mcp_resolution_strategies
notifications
order_discounts
organisations
payments
pcg_categories
price_list_history
price_list_items
price_lists
product_colors
product_commission_history
product_drafts
product_group_members
product_groups
product_images
product_packages
product_status_changes
products
purchase_order_items
purchase_order_receptions
purchase_orders
sales_channels
sales_order_items
sales_order_linkme_details
sales_order_shipments
sales_orders
sample_order_items
sample_orders
stock_alert_tracking
stock_movements
stock_reservations
storage_allocations
storage_billing_events
storage_pricing_tiers
subcategories
sync_runs
transaction_document_links
user_activity_logs
user_app_roles
user_dashboard_preferences
user_profiles
user_sessions
variant_groups
webhook_configs
webhook_logs
```

</details>

### Views in Database (23)

```
affiliate_pending_orders
customer_samples_view
enseignes_with_stats
expenses
google_merchant_stats
linkme_globe_items
linkme_order_items_enriched
linkme_orders_enriched
linkme_orders_with_margins
product_prices_summary
stock_alerts_unified_view
stock_alerts_view
stock_snapshot
v_expenses_with_details
v_linkme_users
v_matching_rules_with_org
v_pcg_categories_tree
v_pending_invoice_uploads
v_transaction_documents
v_transactions_missing_invoice
v_transactions_unified
v_unique_unclassified_labels
v_users_with_roles
```

---

## Source 2: Git Migrations

**Directory:** `supabase/migrations/*.sql`

**Extraction Command:**
```bash
# Tables
grep -Eoh "CREATE\s+TABLE(\s+IF\s+NOT\s+EXISTS)?\s+(public\.)?[a-z_]+" supabase/migrations/*.sql \
  | awk '{print $NF}' | grep -v "^_" | grep -v "^public\." | sort -u

# Views
grep -Eoh "CREATE(\s+OR\s+REPLACE)?\s+VIEW(\s+IF\s+NOT\s+EXISTS)?\s+(public\.)?[a-z_]+" supabase/migrations/*.sql \
  | awk '{print $NF}' | sed 's/^public\.//' | sort -u
```

### Tables in Git (37)

<details>
<summary>Click to expand full list</summary>

```
affiliate_archive_requests
affiliate_storage_allocations
app_settings
bank_transaction_matches
bank_transactions
bank_transactions_enrichment_audit
counterparties
counterparty_bank_accounts
email_templates
expenses
finance_settings
financial_document_items
financial_documents
financial_payments
form_submission_messages
form_submissions
form_types
linkme_catalog_products
linkme_contact_requests
linkme_page_configurations
linkme_payment_request_items
linkme_payment_requests
linkme_showcase_collection_items
linkme_showcase_collections
matching_rules
organisation_roles
pcg_categories
product_commission_history
qonto_clients
qonto_sync_logs
sales_order_linkme_details
storage_billing_events
storage_pricing_tiers
sync_runs
transaction_document_links
webhook_configs
webhook_logs
```

**Note:** Excludes backup tables (`_backup_linkme_commissions_`, `_backup_products_`, `_backup_sales_order_items_`, `_stock_audit_`)

</details>

### Views in Git (23)

```
accrual_journal
affiliate_pending_orders
cash_movements
customer_samples_view
expenses
linkme_globe_items
linkme_order_items_enriched
linkme_orders_enriched
linkme_orders_with_margins
order_margin_summary
organisations_with_roles
stock_alerts_unified_view
stock_alerts_view
v_expenses_with_details
v_linkme_users
v_matching_rules_with_org
v_pcg_categories_tree
v_pending_invoice_uploads
v_transaction_documents
v_transactions_missing_invoice
v_transactions_unified
v_unique_unclassified_labels
v_users_with_roles
```

---

## Set-Diff Analysis

### Tables in DB but NOT in Git (75) - **BASE SCHEMA DRIFT**

<details>
<summary>Click to expand list of 75 missing tables</summary>

```
audit_logs
categories
category_translations
channel_price_lists
channel_pricing
channel_pricing_history
channel_product_metadata
channel_product_pricing
client_consultations
collection_images
collection_products
collection_shares
collection_translations
collections
consultation_images
consultation_products
contacts
customer_group_members
customer_groups
customer_price_lists
customer_pricing
enseignes
families
feed_configs
feed_exports
feed_performance_metrics
financial_document_lines
google_merchant_syncs
group_price_lists
individual_customers
invoice_status_history
invoices
linkme_affiliates
linkme_channel_suppliers
linkme_commissions
linkme_selection_items
linkme_selections
linkme_tracking
mcp_resolution_queue
mcp_resolution_strategies
notifications
order_discounts
organisations
payments
price_list_history
price_list_items
price_lists
product_colors
product_drafts
product_group_members
product_groups
product_images
product_packages
product_status_changes
products
purchase_order_items
purchase_order_receptions
purchase_orders
sales_channels
sales_order_items
sales_order_shipments
sales_orders
sample_order_items
sample_orders
stock_alert_tracking
stock_movements
stock_reservations
storage_allocations
subcategories
user_activity_logs
user_app_roles
user_dashboard_preferences
user_profiles
user_sessions
variant_groups
```

</details>

**Interpretation:** These 75 tables are part of the **base schema** that was imported into the database but never committed to Git migrations.

**Impact:** Zero drift policy violated - cannot reproduce database from Git alone.

**Recommendation:** Create `20260120000000_base_schema.sql` migration to import these tables (see Phase 4.2 plan).

---

### Tables in Git but NOT in DB (11) - **DROPPED/RENAMED**

```
bank_transaction_matches
counterparties
expenses
financial_document_items
linkme_catalog_products
linkme_contact_requests
linkme_showcase_collection_items
linkme_showcase_collections
organisation_roles
qonto_clients
qonto_sync_logs
```

**Interpretation:**
- `expenses` - Converted to VIEW (exists in `Database['public']['Views']`)
- `organisation_roles` - Likely renamed or merged
- `linkme_showcase_*` - Possibly renamed to `collection_*` tables
- `qonto_*` - Possibly dropped or renamed
- `counterparties`, `bank_transaction_matches`, `financial_document_items`, `linkme_catalog_products`, `linkme_contact_requests` - Investigate

**Action Required:** Document table lifecycle (renames, drops, conversions) in migration comments.

---

### Views in DB but NOT in Git (4)

```
enseignes_with_stats
google_merchant_stats
product_prices_summary
stock_snapshot
```

**Interpretation:** These 4 views were created directly in the database without Git migrations.

**Action Required:** Reverse-engineer and add to Git migrations.

---

### Views in Git but NOT in DB (4)

```
accrual_journal
cash_movements
order_margin_summary
organisations_with_roles
```

**Interpretation:** These 4 views were in migrations but have been dropped from the database.

**Action Required:** Clean up migrations or re-create views if needed.

---

## Conclusion

### Dashboard Mystery Solved ✅

**Original Question:** "Dashboard shows 101 tables, but Phase 2A counted 112 objects. Why?"

**Answer:**
1. Dashboard shows **tables only** (101) - does NOT include views in that count
2. Phase 2A counted **all objects** (tables + views + functions + enums)
3. Actual DB state: **101 tables + 23 views = 124 public objects**
4. Phase 2A parsing likely counted differently or at a different snapshot

### Key Metrics

| Metric | Count |
|--------|-------|
| DB Tables (actual) | 101 |
| DB Views (actual) | 23 |
| **DB Total Objects** | **124** |
| Git Tables | 37 |
| Git Views | 23 |
| **Base Schema Drift (tables)** | **75** |
| Tables in Git not in DB | 11 |
| Views in DB not in Git | 4 |
| Views in Git not in DB | 4 |

### Revised Drift Analysis

**Previous Phase 2A estimate:** 71-73 tables missing from Git (INCORRECT - included views)

**Correct Phase 4.1 count:** **75 tables** missing from Git migrations (base schema)

**Impact:**
- Cannot reproduce database from Git alone
- Onboarding requires manual base schema import
- Zero drift policy violated

### Next Steps (Phase 4.2)

1. ✅ **STOP GATE:** Present this audit to user for validation
2. ⏸️ **Phase 4.2:** Create drift resolution plan (Option A: import base schema to Git)
3. ⏸️ **Phase 4.3:** Document artifacts cleanup policy
4. ⏸️ **Phase 4.4:** Document known issues (StockKPICard)

---

## Reproduction Commands

To reproduce this audit:

```bash
# Extract tables from TypeScript types
sed -n '16,8417p' packages/@verone/types/src/supabase.ts \
  | grep -E "^      [a-z_]+: \{$" \
  | sed 's/^      \([a-z_]*\): {$/\1/' \
  | sort

# Extract views from TypeScript types
sed -n '8418,9559p' packages/@verone/types/src/supabase.ts \
  | grep -E "^      [a-z_]+: \{$" \
  | sed 's/^      \([a-z_]*\): {$/\1/' \
  | sort

# Extract tables from Git migrations (exclude backups)
grep -Eoh "CREATE\s+TABLE(\s+IF\s+NOT\s+EXISTS)?\s+(public\.)?[a-z_]+" supabase/migrations/*.sql \
  | awk '{print $NF}' \
  | grep -v "^_" \
  | grep -v "^public\." \
  | sort -u

# Extract views from Git migrations
grep -Eoh "CREATE(\s+OR\s+REPLACE)?\s+VIEW(\s+IF\s+NOT\s+EXISTS)?\s+(public\.)?[a-z_]+" supabase/migrations/*.sql \
  | awk '{print $NF}' \
  | sed 's/^public\.//' \
  | sort -u
```

---

**Report Generated:** 2026-01-20  
**Phase:** 4.1 (BLOQUANT - await user validation)
