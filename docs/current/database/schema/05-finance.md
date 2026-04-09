# Domaine : Finance

**Description :** Factures, avoirs, devis, transactions bancaires, rapprochement, immobilisations, PCG.

**Tables (13) :** `financial_documents`, `financial_document_items`, `bank_transactions`, `bank_transactions_enrichment_audit`, `transaction_document_links`, `fixed_assets`, `fixed_asset_depreciations`, `fiscal_obligations_done`, `finance_settings`, `pcg_categories`, `matching_rules`, `mcp_resolution_queue`, `mcp_resolution_strategies`

---

### `financial_documents`

| Colonne                  | Type          | Nullable |
| ------------------------ | ------------- | -------- |
| `id`                     | `uuid`        | NO       |
| `document_type`          | `enum`        | NO       |
| `document_direction`     | `enum`        | NO       |
| `partner_id`             | `uuid`        | NO       |
| `partner_type`           | `text`        | NO       |
| `document_number`        | `text`        | NO       |
| `document_date`          | `date`        | NO       |
| `due_date`               | `date`        | YES      |
| `total_ht`               | `numeric`     | NO       |
| `total_ttc`              | `numeric`     | NO       |
| `tva_amount`             | `numeric`     | NO       |
| `amount_paid`            | `numeric`     | NO       |
| `status`                 | `enum`        | NO       |
| `sales_order_id`         | `uuid`        | YES      |
| `purchase_order_id`      | `uuid`        | YES      |
| `linkme_selection_id`    | `uuid`        | YES      |
| `linkme_affiliate_id`    | `uuid`        | YES      |
| `consultation_id`        | `uuid`        | YES      |
| `individual_customer_id` | `uuid`        | YES      |
| `channel_id`             | `uuid`        | YES      |
| `qonto_invoice_id`       | `text`        | YES      |
| `local_pdf_path`         | `text`        | YES      |
| `created_by`             | `uuid`        | NO       |
| `created_at`             | `timestamptz` | NO       |
| `updated_at`             | `timestamptz` | NO       |

**Relations (FK) :**

- `billing_contact_id` → `contacts.id`
- `channel_id` → `sales_channels.id`
- `consultation_id` → `client_consultations.id`
- `converted_to_invoice_id` → `financial_documents.id`
- `delivery_contact_id` → `contacts.id`
- `individual_customer_id` → `individual_customers.id`
- `linkme_affiliate_id` → `linkme_affiliates.id`
- `linkme_selection_id` → `linkme_selections.id`
- `partner_id` → `organisations.id`
- `purchase_order_id` → `purchase_orders.id`
- `responsable_contact_id` → `contacts.id`
- `sales_order_id` → `sales_orders.id`

**RLS policies :**

- `staff_manage_financial_documents` (ALL)
- `linkme_affiliates_read_own_invoices` (SELECT)

**Triggers :**

- `trigger_financial_documents_updated_at` (BEFORE UPDATE)

---

### `financial_document_items`

| Colonne                    | Type          | Nullable |
| -------------------------- | ------------- | -------- |
| `id`                       | `uuid`        | NO       |
| `document_id`              | `uuid`        | NO       |
| `product_id`               | `uuid`        | YES      |
| `description`              | `text`        | NO       |
| `quantity`                 | `numeric`     | NO       |
| `unit_price_ht`            | `numeric`     | NO       |
| `total_ht`                 | `numeric`     | NO       |
| `tva_rate`                 | `numeric`     | NO       |
| `tva_amount`               | `numeric`     | NO       |
| `total_ttc`                | `numeric`     | NO       |
| `eco_tax`                  | `numeric`     | YES      |
| `linkme_selection_item_id` | `uuid`        | YES      |
| `retrocession_rate`        | `numeric`     | YES      |
| `created_at`               | `timestamptz` | NO       |

**Relations (FK) :**

- `document_id` → `financial_documents.id`
- `linkme_selection_item_id` → `linkme_selection_items.id`
- `product_id` → `products.id`

**RLS policies :**

- `staff_manage_financial_document_items` (ALL)

---

### `bank_transactions`

| Colonne                        | Type          | Nullable |
| ------------------------------ | ------------- | -------- |
| `id`                           | `uuid`        | NO       |
| `transaction_id`               | `text`        | NO       |
| `bank_provider`                | `enum`        | NO       |
| `bank_account_id`              | `text`        | NO       |
| `amount`                       | `numeric`     | NO       |
| `currency`                     | `text`        | NO       |
| `side`                         | `enum`        | NO       |
| `label`                        | `text`        | NO       |
| `counterparty_name`            | `text`        | YES      |
| `counterparty_iban`            | `text`        | YES      |
| `emitted_at`                   | `timestamptz` | NO       |
| `settled_at`                   | `timestamptz` | YES      |
| `matching_status`              | `enum`        | NO       |
| `matched_document_id`          | `uuid`        | YES      |
| `counterparty_organisation_id` | `uuid`        | YES      |
| `vat_rate`                     | `numeric`     | YES      |
| `amount_ht`                    | `numeric`     | YES      |
| `applied_rule_id`              | `uuid`        | YES      |
| `created_at`                   | `timestamptz` | NO       |

**Relations (FK) :**

- `applied_rule_id` → `matching_rules.id`
- `counterparty_individual_customer_id` → `individual_customers.id`
- `counterparty_organisation_id` → `organisations.id`
- `matched_document_id` → `financial_documents.id`

**RLS policies :**

- `staff_manage_bank_transactions` (ALL)

**Triggers :**

- `enforce_fiscal_lock_on_bank_transactions` (BEFORE UPDATE)
- `set_bank_transactions_updated_at` (BEFORE UPDATE)
- `trg_auto_classify_bank_transaction` (BEFORE INSERT)
- `trg_calculate_ht_vat` (BEFORE UPDATE)
- `trg_check_rule_lock` (BEFORE UPDATE)
- `trg_notify_bank_transaction` (AFTER INSERT)
- `trg_sync_vat_breakdown_to_lines` (AFTER INSERT)

---

### `bank_transactions_enrichment_audit`

| Colonne          | Type          | Nullable |
| ---------------- | ------------- | -------- |
| `id`             | `uuid`        | NO       |
| `transaction_id` | `uuid`        | NO       |
| `before_json`    | `jsonb`       | NO       |
| `after_json`     | `jsonb`       | NO       |
| `action`         | `text`        | NO       |
| `fields_changed` | `ARRAY`       | NO       |
| `changed_by`     | `uuid`        | YES      |
| `changed_at`     | `timestamptz` | NO       |

**Relations (FK) :**

- `transaction_id` → `bank_transactions.id`

**RLS policies :**

- `backoffice_full_access_bank_transactions_enrichment_audit` (ALL)
- `bte_audit_insert` (INSERT)
- `bte_audit_select` (SELECT)

---

### `transaction_document_links`

| Colonne             | Type          | Nullable |
| ------------------- | ------------- | -------- |
| `id`                | `uuid`        | NO       |
| `transaction_id`    | `uuid`        | NO       |
| `document_id`       | `uuid`        | YES      |
| `sales_order_id`    | `uuid`        | YES      |
| `purchase_order_id` | `uuid`        | YES      |
| `link_type`         | `varchar`     | NO       |
| `allocated_amount`  | `numeric`     | NO       |
| `created_at`        | `timestamptz` | YES      |

**Relations (FK) :**

- `document_id` → `financial_documents.id`
- `purchase_order_id` → `purchase_orders.id`
- `sales_order_id` → `sales_orders.id`
- `transaction_id` → `bank_transactions.id`

**RLS policies :**

- `backoffice_full_access_transaction_document_links` (ALL)
- `transaction_document_links_delete` (DELETE)
- `transaction_document_links_insert` (INSERT)
- `transaction_document_links_select` (SELECT)
- `transaction_document_links_update` (UPDATE)

**Triggers :**

- `trg_transaction_document_links_updated_at` (BEFORE UPDATE)
- `trg_update_purchase_order_payment_status_v2` (AFTER UPDATE)
- `trg_update_sales_order_payment_status_v2` (AFTER INSERT)

---

### `fixed_assets`

| Colonne                       | Type          | Nullable |
| ----------------------------- | ------------- | -------- |
| `id`                          | `uuid`        | NO       |
| `label`                       | `text`        | NO       |
| `pcg_account`                 | `varchar`     | NO       |
| `asset_category`              | `text`        | NO       |
| `acquisition_date`            | `date`        | NO       |
| `acquisition_amount`          | `numeric`     | NO       |
| `depreciation_method`         | `text`        | NO       |
| `depreciation_duration_years` | `int`         | NO       |
| `total_depreciated`           | `numeric`     | NO       |
| `status`                      | `text`        | NO       |
| `created_at`                  | `timestamptz` | NO       |

**RLS policies :**

- `staff_full_access_fixed_assets` (ALL)

**Triggers :**

- `set_updated_at_fixed_assets` (BEFORE UPDATE)

---

### `fixed_asset_depreciations`

| Colonne               | Type          | Nullable |
| --------------------- | ------------- | -------- |
| `id`                  | `uuid`        | NO       |
| `fixed_asset_id`      | `uuid`        | NO       |
| `fiscal_year`         | `int`         | NO       |
| `depreciation_amount` | `numeric`     | NO       |
| `cumulative_amount`   | `numeric`     | NO       |
| `net_book_value`      | `numeric`     | NO       |
| `created_at`          | `timestamptz` | NO       |

**Relations (FK) :**

- `fixed_asset_id` → `fixed_assets.id`

**RLS policies :**

- `staff_full_access_depreciations` (ALL)

---

### `fiscal_obligations_done`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `obligation_id` | `text`        | NO       |
| `completed_at`  | `timestamptz` | NO       |
| `completed_by`  | `uuid`        | YES      |

**RLS policies :**

- `staff_full_access_fiscal_done` (ALL)

---

### `finance_settings`

| Colonne              | Type          | Nullable |
| -------------------- | ------------- | -------- |
| `id`                 | `uuid`        | NO       |
| `closed_fiscal_year` | `int`         | YES      |
| `updated_at`         | `timestamptz` | YES      |
| `updated_by`         | `uuid`        | YES      |

**RLS policies :**

- `backoffice_full_access_finance_settings` (ALL)
- `finance_settings_read` (SELECT)
- `finance_settings_update` (UPDATE)

---

### `pcg_categories`

| Colonne       | Type          | Nullable |
| ------------- | ------------- | -------- |
| `id`          | `uuid`        | NO       |
| `code`        | `varchar`     | NO       |
| `label`       | `varchar`     | NO       |
| `parent_code` | `varchar`     | YES      |
| `level`       | `int`         | NO       |
| `is_active`   | `bool`        | YES      |
| `created_at`  | `timestamptz` | YES      |

**RLS policies :**

- `backoffice_full_access_pcg_categories` (ALL)
- `pcg_categories_read_all` (SELECT)

**Triggers :**

- `trigger_pcg_categories_updated_at` (BEFORE UPDATE)

---

### `matching_rules`

| Colonne            | Type          | Nullable |
| ------------------ | ------------- | -------- |
| `id`               | `uuid`        | NO       |
| `priority`         | `int`         | NO       |
| `enabled`          | `bool`        | NO       |
| `match_type`       | `text`        | NO       |
| `match_value`      | `text`        | NO       |
| `default_category` | `text`        | YES      |
| `organisation_id`  | `uuid`        | YES      |
| `is_active`        | `bool`        | YES      |
| `created_at`       | `timestamptz` | YES      |

**Relations (FK) :**

- `individual_customer_id` → `individual_customers.id`
- `organisation_id` → `organisations.id`

**RLS policies :**

- `backoffice_full_access_matching_rules` (ALL)
- `Authenticated users full access matching_rules` (ALL)

---

### `mcp_resolution_queue`

| Colonne           | Type          | Nullable |
| ----------------- | ------------- | -------- |
| `id`              | `uuid`        | NO       |
| `error_report_id` | `uuid`        | NO       |
| `mcp_tools`       | `jsonb`       | NO       |
| `status`          | `varchar`     | NO       |
| `execution_log`   | `jsonb`       | NO       |
| `priority`        | `int`         | NO       |
| `created_at`      | `timestamptz` | NO       |

**RLS policies :**

- `backoffice_full_access_mcp_resolution_queue` (ALL)
- `mcp_queue_authenticated_all` (ALL)

**Triggers :**

- `update_mcp_queue_timestamp_trigger` (BEFORE UPDATE)

---

### `mcp_resolution_strategies`

| Colonne         | Type          | Nullable |
| --------------- | ------------- | -------- |
| `id`            | `uuid`        | NO       |
| `strategy_name` | `varchar`     | NO       |
| `error_pattern` | `text`        | NO       |
| `mcp_tools`     | `jsonb`       | NO       |
| `confidence`    | `numeric`     | NO       |
| `success_rate`  | `numeric`     | YES      |
| `is_active`     | `bool`        | NO       |
| `created_at`    | `timestamptz` | NO       |

**RLS policies :**

- `backoffice_full_access_mcp_resolution_strategies` (ALL)
- `staff_read_resolution_strategies` (SELECT)

---
