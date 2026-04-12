# Domaine Finance & Comptabilite — Schema Base de Donnees

_Generated: 2026-04-12 16:31_

**Tables : 13**

| Table                                                                     | Colonnes | FK  | RLS | Triggers |
| ------------------------------------------------------------------------- | -------- | --- | --- | -------- |
| [bank_transactions](#bank-transactions)                                   | 42       | 4   | 1   | 7        |
| [bank_transactions_enrichment_audit](#bank-transactions-enrichment-audit) | 10       | 1   | 3   | 0        |
| [finance_settings](#finance-settings)                                     | 4        | 0   | 3   | 0        |
| [financial_document_items](#financial-document-items)                     | 18       | 3   | 1   | 0        |
| [financial_documents](#financial-documents)                               | 64       | 12  | 2   | 3        |
| [fiscal_obligations_done](#fiscal-obligations-done)                       | 5        | 0   | 1   | 0        |
| [fixed_asset_depreciations](#fixed-asset-depreciations)                   | 8        | 1   | 1   | 0        |
| [fixed_assets](#fixed-assets)                                             | 20       | 0   | 1   | 1        |
| [matching_rules](#matching-rules)                                         | 20       | 2   | 2   | 0        |
| [mcp_resolution_queue](#mcp-resolution-queue)                             | 16       | 0   | 2   | 1        |
| [mcp_resolution_strategies](#mcp-resolution-strategies)                   | 11       | 0   | 2   | 0        |
| [pcg_categories](#pcg-categories)                                         | 10       | 0   | 2   | 1        |
| [transaction_document_links](#transaction-document-links)                 | 11       | 4   | 5   | 3        |

## bank_transactions

| Colonne                             | Type                  | Nullable | Default                      |
| ----------------------------------- | --------------------- | -------- | ---------------------------- |
| id                                  | uuid                  | NO       | gen_random_uuid()            |
| transaction_id                      | text                  | NO       |                              |
| bank_provider                       | enum:bank_provider    | NO       |                              |
| bank_account_id                     | text                  | NO       |                              |
| amount                              | numeric               | NO       |                              |
| currency                            | text                  | NO       | 'EUR'::text                  |
| side                                | enum:transaction_side | NO       |                              |
| operation_type                      | text                  | YES      |                              |
| label                               | text                  | NO       |                              |
| note                                | text                  | YES      |                              |
| reference                           | text                  | YES      |                              |
| counterparty_name                   | text                  | YES      |                              |
| counterparty_iban                   | text                  | YES      |                              |
| settled_at                          | timestamptz           | YES      |                              |
| emitted_at                          | timestamptz           | NO       |                              |
| matching_status                     | enum:matching_status  | NO       | 'unmatched'::matching_status |
| confidence_score                    | integer               | YES      |                              |
| match_reason                        | text                  | YES      |                              |
| raw_data                            | jsonb                 | NO       |                              |
| created_at                          | timestamptz           | NO       | now()                        |
| updated_at                          | timestamptz           | NO       | now()                        |
| matched_document_id                 | uuid                  | YES      |                              |
| counterparty_organisation_id        | uuid                  | YES      |                              |
| justification_optional              | boolean               | YES      | false                        |
| vat_rate                            | numeric               | YES      | NULL::numeric                |
| payment_method                      | varchar               | YES      | NULL::character varying      |
| category_pcg                        | varchar               | YES      | NULL::character varying      |
| nature                              | varchar               | YES      | NULL::character varying      |
| amount_ht                           | numeric               | YES      | NULL::numeric                |
| amount_vat                          | numeric               | YES      | NULL::numeric                |
| attachment_ids                      | text[]                | YES      |                              |
| ignored_at                          | timestamptz           | YES      |                              |
| ignored_by                          | uuid                  | YES      |                              |
| ignore_reason                       | text                  | YES      |                              |
| counterparty_individual_customer_id | uuid                  | YES      |                              |
| counterparty_type                   | text                  | YES      |                              |
| applied_rule_id                     | uuid                  | YES      |                              |
| vat_breakdown                       | jsonb                 | YES      |                              |
| has_attachment                      | boolean               | YES      |                              |
| vat_source                          | text                  | YES      |                              |
| local_pdf_path                      | text                  | YES      |                              |
| pdf_stored_at                       | timestamptz           | YES      |                              |

**Relations :**

- `applied_rule_id` → `matching_rules.id`
- `matched_document_id` → `financial_documents.id`
- `counterparty_individual_customer_id` → `individual_customers.id`
- `counterparty_organisation_id` → `organisations.id`

**RLS :** 1 policy

- `staff_manage_bank_transactions` : ALL — authenticated

**Triggers :** 7

- `enforce_fiscal_lock_on_bank_transactions` : BEFORE UPDATE
- `set_bank_transactions_updated_at` : BEFORE UPDATE
- `trg_auto_classify_bank_transaction` : BEFORE INSERT
- `trg_calculate_ht_vat` : BEFORE INSERT
- `trg_check_rule_lock` : BEFORE UPDATE
- `trg_notify_bank_transaction` : AFTER INSERT
- `trg_sync_vat_breakdown_to_lines` : AFTER INSERT

---

## bank_transactions_enrichment_audit

| Colonne        | Type        | Nullable | Default           |
| -------------- | ----------- | -------- | ----------------- |
| id             | uuid        | NO       | gen_random_uuid() |
| transaction_id | uuid        | NO       |                   |
| before_json    | jsonb       | NO       | '{}'::jsonb       |
| after_json     | jsonb       | NO       | '{}'::jsonb       |
| action         | text        | NO       |                   |
| fields_changed | text[]      | NO       | '{}'::text[]      |
| changed_by     | uuid        | YES      |                   |
| changed_at     | timestamptz | NO       | now()             |
| reason         | text        | YES      |                   |
| source         | text        | YES      | 'manual'::text    |

**Relations :**

- `transaction_id` → `bank_transactions.id`

**RLS :** 3 policies

- `backoffice_full_access_bank_transactions_enrichment_audit` : ALL — authenticated
- `bte_audit_insert` : INSERT — authenticated
- `bte_audit_select` : SELECT — authenticated

---

## finance_settings

| Colonne            | Type        | Nullable | Default           |
| ------------------ | ----------- | -------- | ----------------- |
| id                 | uuid        | NO       | gen_random_uuid() |
| closed_fiscal_year | integer     | YES      |                   |
| updated_at         | timestamptz | YES      | now()             |
| updated_by         | uuid        | YES      |                   |

**RLS :** 3 policies

- `backoffice_full_access_finance_settings` : ALL — authenticated
- `finance_settings_read` : SELECT — public
- `finance_settings_update` : UPDATE — public

---

## financial_document_items

| Colonne                  | Type        | Nullable | Default           |
| ------------------------ | ----------- | -------- | ----------------- |
| id                       | uuid        | NO       | gen_random_uuid() |
| document_id              | uuid        | NO       |                   |
| product_id               | uuid        | YES      |                   |
| description              | text        | NO       |                   |
| quantity                 | numeric     | NO       | 1                 |
| unit_price_ht            | numeric     | NO       | 0                 |
| total_ht                 | numeric     | NO       | 0                 |
| tva_rate                 | numeric     | NO       | 20                |
| tva_amount               | numeric     | NO       | 0                 |
| total_ttc                | numeric     | NO       | 0                 |
| sort_order               | integer     | NO       | 0                 |
| created_at               | timestamptz | NO       | now()             |
| updated_at               | timestamptz | NO       | now()             |
| discount_percentage      | numeric     | YES      | 0                 |
| eco_tax                  | numeric     | YES      | 0                 |
| linkme_selection_item_id | uuid        | YES      |                   |
| base_price_ht            | numeric     | YES      |                   |
| retrocession_rate        | numeric     | YES      |                   |

**Relations :**

- `linkme_selection_item_id` → `linkme_selection_items.id`
- `document_id` → `financial_documents.id`
- `product_id` → `products.id`

**RLS :** 1 policy

- `staff_manage_financial_document_items` : ALL — authenticated

---

## financial_documents

| Colonne                  | Type                    | Nullable | Default                  |
| ------------------------ | ----------------------- | -------- | ------------------------ |
| id                       | uuid                    | NO       | gen_random_uuid()        |
| document_type            | enum:document_type      | NO       |                          |
| document_direction       | enum:document_direction | NO       |                          |
| partner_id               | uuid                    | NO       |                          |
| partner_type             | text                    | NO       |                          |
| document_number          | text                    | NO       |                          |
| document_date            | date                    | NO       |                          |
| due_date                 | date                    | YES      |                          |
| total_ht                 | numeric                 | NO       |                          |
| total_ttc                | numeric                 | NO       |                          |
| tva_amount               | numeric                 | NO       |                          |
| amount_paid              | numeric                 | NO       | 0                        |
| status                   | enum:document_status    | NO       | 'draft'::document_status |
| abby_invoice_id          | text                    | YES      |                          |
| abby_invoice_number      | text                    | YES      |                          |
| abby_pdf_url             | text                    | YES      |                          |
| abby_public_url          | text                    | YES      |                          |
| synced_to_abby_at        | timestamptz             | YES      |                          |
| last_synced_from_abby_at | timestamptz             | YES      |                          |
| sync_errors              | jsonb                   | YES      |                          |
| uploaded_file_url        | text                    | YES      |                          |
| uploaded_file_name       | text                    | YES      |                          |
| sales_order_id           | uuid                    | YES      |                          |
| purchase_order_id        | uuid                    | YES      |                          |
| description              | text                    | YES      |                          |
| notes                    | text                    | YES      |                          |
| created_at               | timestamptz             | NO       | now()                    |
| updated_at               | timestamptz             | NO       | now()                    |
| created_by               | uuid                    | NO       |                          |
| deleted_at               | timestamptz             | YES      |                          |
| invoice_source           | text                    | YES      |                          |
| upload_status            | text                    | YES      |                          |
| qonto_attachment_id      | text                    | YES      |                          |
| uploaded_at              | timestamptz             | YES      |                          |
| uploaded_by              | uuid                    | YES      |                          |
| pcg_code                 | varchar                 | YES      |                          |
| synchronized_at          | timestamptz             | YES      | now()                    |
| finalized_at             | timestamptz             | YES      |                          |
| sent_at                  | timestamptz             | YES      |                          |
| finalized_by             | uuid                    | YES      |                          |
| qonto_invoice_id         | text                    | YES      |                          |
| qonto_pdf_url            | text                    | YES      |                          |
| qonto_public_url         | text                    | YES      |                          |
| local_pdf_path           | text                    | YES      |                          |
| local_pdf_url            | text                    | YES      |                          |
| pdf_stored_at            | timestamptz             | YES      |                          |
| billing_address          | jsonb                   | YES      |                          |
| shipping_address         | jsonb                   | YES      |                          |
| shipping_cost_ht         | numeric                 | YES      | 0                        |
| handling_cost_ht         | numeric                 | YES      | 0                        |
| insurance_cost_ht        | numeric                 | YES      | 0                        |
| fees_vat_rate            | numeric                 | YES      | 0.2                      |
| billing_contact_id       | uuid                    | YES      |                          |
| delivery_contact_id      | uuid                    | YES      |                          |
| responsable_contact_id   | uuid                    | YES      |                          |
| validity_date            | date                    | YES      |                          |
| quote_status             | text                    | YES      | 'draft'::text            |
| converted_to_invoice_id  | uuid                    | YES      |                          |
| channel_id               | uuid                    | YES      |                          |
| individual_customer_id   | uuid                    | YES      |                          |
| customer_type            | text                    | YES      |                          |
| linkme_selection_id      | uuid                    | YES      |                          |
| linkme_affiliate_id      | uuid                    | YES      |                          |
| consultation_id          | uuid                    | YES      |                          |

**Relations :**

- `linkme_selection_id` → `linkme_selections.id`
- `linkme_affiliate_id` → `linkme_affiliates.id`
- `billing_contact_id` → `contacts.id`
- `delivery_contact_id` → `contacts.id`
- `responsable_contact_id` → `contacts.id`
- `consultation_id` → `client_consultations.id`
- `partner_id` → `organisations.id`
- `sales_order_id` → `sales_orders.id`
- `purchase_order_id` → `purchase_orders.id`
- `converted_to_invoice_id` → `financial_documents.id`
- `channel_id` → `sales_channels.id`
- `individual_customer_id` → `individual_customers.id`

**RLS :** 2 policies

- `staff_manage_financial_documents` : ALL — authenticated
- `linkme_affiliates_read_own_invoices` : SELECT — authenticated

**Triggers :** 3

- `trg_clean_order_quote_on_delete` : AFTER DELETE
- `trg_clean_order_quote_on_soft_delete` : AFTER UPDATE
- `trigger_financial_documents_updated_at` : BEFORE UPDATE

---

## fiscal_obligations_done

| Colonne       | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| obligation_id | text        | NO       |                   |
| completed_at  | timestamptz | NO       | now()             |
| completed_by  | uuid        | YES      |                   |
| notes         | text        | YES      |                   |

**RLS :** 1 policy

- `staff_full_access_fiscal_done` : ALL — authenticated

---

## fixed_asset_depreciations

| Colonne             | Type        | Nullable | Default           |
| ------------------- | ----------- | -------- | ----------------- |
| id                  | uuid        | NO       | gen_random_uuid() |
| fixed_asset_id      | uuid        | NO       |                   |
| fiscal_year         | integer     | NO       |                   |
| depreciation_amount | numeric     | NO       |                   |
| cumulative_amount   | numeric     | NO       |                   |
| net_book_value      | numeric     | NO       |                   |
| is_computed         | boolean     | NO       | true              |
| created_at          | timestamptz | NO       | now()             |

**Relations :**

- `fixed_asset_id` → `fixed_assets.id`

**RLS :** 1 policy

- `staff_full_access_depreciations` : ALL — authenticated

---

## fixed_assets

| Colonne                     | Type        | Nullable | Default                   |
| --------------------------- | ----------- | -------- | ------------------------- |
| id                          | uuid        | NO       | gen_random_uuid()         |
| label                       | text        | NO       |                           |
| description                 | text        | YES      |                           |
| pcg_account                 | varchar     | NO       | '218'::character varying  |
| pcg_amortissement           | varchar     | NO       | '2818'::character varying |
| asset_category              | text        | NO       | 'corporel'::text          |
| acquisition_date            | date        | NO       |                           |
| acquisition_amount          | numeric     | NO       |                           |
| supplier_name               | text        | YES      |                           |
| invoice_reference           | text        | YES      |                           |
| depreciation_method         | text        | NO       | 'lineaire'::text          |
| depreciation_duration_years | integer     | NO       | 5                         |
| residual_value              | numeric     | NO       | 0                         |
| total_depreciated           | numeric     | NO       | 0                         |
| status                      | text        | NO       | 'active'::text            |
| disposal_date               | date        | YES      |                           |
| disposal_amount             | numeric     | YES      |                           |
| created_at                  | timestamptz | NO       | now()                     |
| updated_at                  | timestamptz | NO       | now()                     |
| created_by                  | uuid        | YES      |                           |

**RLS :** 1 policy

- `staff_full_access_fixed_assets` : ALL — authenticated

**Triggers :** 1

- `set_updated_at_fixed_assets` : BEFORE UPDATE

---

## matching_rules

| Colonne                   | Type                         | Nullable | Default                         |
| ------------------------- | ---------------------------- | -------- | ------------------------------- |
| id                        | uuid                         | NO       | gen_random_uuid()               |
| priority                  | integer                      | NO       | 100                             |
| enabled                   | boolean                      | NO       | true                            |
| match_type                | text                         | NO       |                                 |
| match_value               | text                         | NO       |                                 |
| default_category          | text                         | YES      |                                 |
| default_role_type         | text                         | YES      |                                 |
| created_at                | timestamptz                  | YES      | now()                           |
| created_by                | uuid                         | YES      |                                 |
| organisation_id           | uuid                         | YES      |                                 |
| display_label             | text                         | YES      |                                 |
| is_active                 | boolean                      | YES      | true                            |
| disabled_at               | timestamptz                  | YES      |                                 |
| counterparty_type         | text                         | YES      |                                 |
| individual_customer_id    | uuid                         | YES      |                                 |
| allow_multiple_categories | boolean                      | YES      | false                           |
| match_patterns            | text[]                       | YES      |                                 |
| applies_to_side           | enum:transaction_side_filter | NO       | 'both'::transaction_side_filter |
| default_vat_rate          | numeric                      | YES      |                                 |
| justification_optional    | boolean                      | YES      | false                           |

**Relations :**

- `organisation_id` → `organisations.id`
- `individual_customer_id` → `individual_customers.id`

**RLS :** 2 policies

- `Authenticated users full access matching_rules` : ALL — authenticated
- `backoffice_full_access_matching_rules` : ALL — authenticated

---

## mcp_resolution_queue

| Colonne                    | Type        | Nullable | Default                      |
| -------------------------- | ----------- | -------- | ---------------------------- |
| id                         | uuid        | NO       | gen_random_uuid()            |
| error_report_id            | uuid        | NO       |                              |
| mcp_tools                  | jsonb       | NO       | '[]'::jsonb                  |
| status                     | varchar     | NO       | 'pending'::character varying |
| execution_log              | jsonb       | NO       | '[]'::jsonb                  |
| retry_count                | integer     | NO       | 0                            |
| max_retries                | integer     | NO       | 3                            |
| priority                   | integer     | NO       | 5                            |
| estimated_duration_seconds | integer     | YES      | 300                          |
| processor_id               | varchar     | YES      |                              |
| started_at                 | timestamptz | YES      |                              |
| completed_at               | timestamptz | YES      |                              |
| created_at                 | timestamptz | NO       | now()                        |
| processed_at               | timestamptz | YES      |                              |
| created_by                 | uuid        | YES      | auth.uid()                   |
| updated_at                 | timestamptz | NO       | now()                        |

**RLS :** 2 policies

- `backoffice_full_access_mcp_resolution_queue` : ALL — authenticated
- `mcp_queue_authenticated_all` : ALL — authenticated

**Triggers :** 1

- `update_mcp_queue_timestamp_trigger` : BEFORE UPDATE

---

## mcp_resolution_strategies

| Colonne          | Type        | Nullable | Default           |
| ---------------- | ----------- | -------- | ----------------- |
| id               | uuid        | NO       | gen_random_uuid() |
| strategy_name    | varchar     | NO       |                   |
| error_pattern    | text        | NO       |                   |
| mcp_tools        | jsonb       | NO       | '[]'::jsonb       |
| resolution_steps | jsonb       | NO       | '[]'::jsonb       |
| confidence       | numeric     | NO       |                   |
| estimated_time   | varchar     | NO       |                   |
| success_rate     | numeric     | YES      | 0.00              |
| is_active        | boolean     | NO       | true              |
| created_at       | timestamptz | NO       | now()             |
| updated_at       | timestamptz | NO       | now()             |

**RLS :** 2 policies

- `backoffice_full_access_mcp_resolution_strategies` : ALL — authenticated
- `staff_read_resolution_strategies` : SELECT — authenticated

---

## pcg_categories

| Colonne       | Type        | Nullable | Default           |
| ------------- | ----------- | -------- | ----------------- |
| id            | uuid        | NO       | gen_random_uuid() |
| code          | varchar     | NO       |                   |
| label         | varchar     | NO       |                   |
| parent_code   | varchar     | YES      |                   |
| level         | integer     | NO       | 1                 |
| description   | text        | YES      |                   |
| is_active     | boolean     | YES      | true              |
| display_order | integer     | YES      | 0                 |
| created_at    | timestamptz | YES      | now()             |
| updated_at    | timestamptz | YES      | now()             |

**RLS :** 2 policies

- `backoffice_full_access_pcg_categories` : ALL — authenticated
- `pcg_categories_read_all` : SELECT — public

**Triggers :** 1

- `trigger_pcg_categories_updated_at` : BEFORE UPDATE

---

## transaction_document_links

| Colonne           | Type        | Nullable | Default                       |
| ----------------- | ----------- | -------- | ----------------------------- |
| id                | uuid        | NO       | gen_random_uuid()             |
| transaction_id    | uuid        | NO       |                               |
| document_id       | uuid        | YES      |                               |
| sales_order_id    | uuid        | YES      |                               |
| purchase_order_id | uuid        | YES      |                               |
| link_type         | varchar     | NO       | 'document'::character varying |
| allocated_amount  | numeric     | NO       | 0                             |
| notes             | text        | YES      |                               |
| created_at        | timestamptz | YES      | now()                         |
| created_by        | uuid        | YES      |                               |
| updated_at        | timestamptz | YES      | now()                         |

**Relations :**

- `transaction_id` → `bank_transactions.id`
- `document_id` → `financial_documents.id`
- `sales_order_id` → `sales_orders.id`
- `purchase_order_id` → `purchase_orders.id`

**RLS :** 5 policies

- `backoffice_full_access_transaction_document_links` : ALL — authenticated
- `transaction_document_links_delete` : DELETE — authenticated
- `transaction_document_links_insert` : INSERT — authenticated
- `transaction_document_links_select` : SELECT — authenticated
- `transaction_document_links_update` : UPDATE — authenticated

**Triggers :** 3

- `trg_transaction_document_links_updated_at` : BEFORE UPDATE
- `trg_update_purchase_order_payment_status_v2` : AFTER INSERT
- `trg_update_sales_order_payment_status_v2` : AFTER INSERT

---
