# Finance & Accounting Reference

## PCG Categories (Source of Truth)

**Rule: One bank transaction = ONE PCG accounting category.**

Source file: `packages/@verone/finance/src/utils/pcg-categories.ts`
DB field: `bank_transactions.category_pcg`

### Main PCG Codes

| Code    | Label                  | Description           |
| ------- | ---------------------- | --------------------- |
| 401     | Fournisseurs           | Goods purchases       |
| 411     | Clients                | Sales                 |
| 455     | Compte courant associe | Partner contributions |
| 512     | Banque                 | Bank operations       |
| 601-606 | Achats                 | Purchases by type     |
| 701-707 | Ventes                 | Sales by type         |

---

## Matching Rules Engine (V2)

### Architecture

```
bank_transactions <-- matching_rules --> PCG category (auto)
  label                match_value        organisation linked
  applied_rule_id      default_category
                       organisation_id
```

### Table: `matching_rules`

| Column             | Type    | Description                             |
| ------------------ | ------- | --------------------------------------- |
| `match_type`       | VARCHAR | 'label_contains', 'label_exact', 'iban' |
| `match_value`      | TEXT    | Normalized label to match               |
| `default_category` | VARCHAR | PCG code (optional)                     |
| `organisation_id`  | UUID    | Linked organisation (optional)          |
| `enabled`          | BOOLEAN | Rule active or not                      |

### Label Normalization

Function `normalize_label()` in SQL:

1. LOWER() first (critical order)
2. Remove accents via translate()
3. Punctuation --> spaces
4. Multiple spaces --> single space
5. Trim

Example: `'GOCARDLESS SAS'` --> `'gocardless sas'`

### Preview/Confirm Workflow (Safeguards)

**No bulk modification without explicit confirmation.**

Step 1 - Preview (read-only):

```sql
SELECT * FROM preview_apply_matching_rule(p_rule_id);
```

Returns: `normalized_label_group`, `sample_labels`, `transaction_count`, `confidence` (HIGH/MEDIUM/LOW), `confidence_score` (0-100).

Step 2 - Confirm:

```sql
SELECT * FROM apply_matching_rule_confirm(
  p_rule_id,
  p_selected_normalized_labels  -- Labels chosen by user
);
```

### Anti-Bypass Trigger

Trigger `trg_check_rule_lock` prevents manual edits:

- If `applied_rule_id` is set AND rule defines `default_category` --> `category_pcg` is locked
- If `applied_rule_id` is set AND rule defines `organisation_id` --> organisation is locked
- Exception: RPCs use `set_config('app.apply_rule_context', 'true', true)`

---

## UI Locking Behavior

**If `applied_rule_id` is set --> manual modifications blocked.**

| Page                     | Locked Behavior                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| `/finance/depenses`      | "Classer" button replaced by "Voir la regle", badge "Auto" shown                         |
| `/finance/transactions`  | Side panel: "Classer PCG" and "Lier organisation" hidden, "Verrouille par regle" message |
| OrganisationLinkingModal | Save button disabled if rule defines organisation                                        |
| QuickClassificationModal | Organisation section hidden in edit mode                                                 |

User must modify the rule to change category or organisation.

---

## Bank Reconciliation (Multi-Doc)

### Principle

One transaction can be linked to N documents/orders. Sum of allocated amounts must match transaction amount.

### Table: `transaction_document_links`

| Column              | Type    | Description                                            |
| ------------------- | ------- | ------------------------------------------------------ |
| `transaction_id`    | UUID    | FK to bank_transactions                                |
| `document_id`       | UUID    | FK to financial_documents (opt)                        |
| `sales_order_id`    | UUID    | FK to sales_orders (opt)                               |
| `purchase_order_id` | UUID    | FK to purchase_orders (opt)                            |
| `link_type`         | VARCHAR | 'document', 'sales_order', 'purchase_order', 'partial' |
| `allocated_amount`  | DECIMAL | Amount allocated to this link                          |

### RPCs

- `link_transaction_to_document(...)` -- Create link
- `unlink_transaction_document(p_link_id)` -- Remove link
- `get_transaction_links(p_transaction_id)` -- List links

### CDRU Scoring (Auto-Suggestions)

| Factor        | Points | Condition                  |
| ------------- | ------ | -------------------------- |
| Exact amount  | +70    | Difference = 0             |
| Close amount  | +50    | Difference <= 10 EUR       |
| Client name   | +30    | First 10 chars match       |
| Close date    | +20    | <= 7 days                  |
| Close date    | +10    | <= 14 days                 |
| Shipped order | +15    | Status = shipped/delivered |
| Unpaid        | +10    | payment_status = unpaid    |

Minimum threshold: **40 points** to show a suggestion.

---

## Reconciliation Scenarios

### Scenario 1: Perfect Auto-Match (85% of cases)

Client pays with invoice reference in label --> 100% confidence --> automatic match. Payment created, invoice set to "paid", transaction set to "auto_matched". No admin action needed.

### Scenario 2: Fuzzy Auto-Match (10% of cases)

No invoice reference but amount + client name + date match --> 85% confidence suggestion. Admin validates in 10 seconds on `/finance/rapprochement`.

### Scenario 3: Manual Review (5% of cases)

No match or multiple candidates below 80% confidence. Admin selects invoices manually. Can match N invoices to 1 transaction (partial allocation).

### Edge Cases

- **Double payment**: System ignores auto-match on already-paid invoice, admin alerted
- **Partial payment**: Suggestion shown with "partial payment" warning, invoice set to "partial_matched"
- **Multiple invoices**: Admin manually selects N invoices totaling transaction amount

---

## Key Migrations

| Migration                                  | Purpose                                                   |
| ------------------------------------------ | --------------------------------------------------------- |
| `20251230_rules_workflow_v2_gardefous.sql` | normalize_label fix + preview/confirm RPCs + lock trigger |
| `20251230_add_applied_rule_id.sql`         | UI locking support                                        |
| `20251230_transaction_document_links.sql`  | Multi-doc reconciliation                                  |

---

## Key Components

| Component                  | Role                      | Package         |
| -------------------------- | ------------------------- | --------------- |
| `RuleModal`                | Create/edit matching rule | @verone/finance |
| `ApplyExistingWizard`      | Preview/confirm wizard    | @verone/finance |
| `QuickClassificationModal` | PCG classification        | @verone/finance |
| `OrganisationLinkingModal` | Link organisation         | @verone/finance |
| `RapprochementModal`       | Multi-doc reconciliation  | @verone/finance |

---

## Invariants (Non-Negotiable)

1. ONE PCG category per transaction
2. ONE source of truth: `pcg-categories.ts` + PCG DB fields
3. Rule creation ONLY via `RuleModal`
4. Locked transaction modification = modify the rule
5. No bulk apply without explicit confirmation (wizard)
6. `normalize_label` never returns '' for valid non-empty input

---

## Daily Reconciliation Checklist (5 min/day)

1. Open `/finance/rapprochement`
2. Check KPI "Manual review" (should be < 5)
3. Validate suggestions >= 85% confidence
4. Process transactions without suggestions (if < 3)
5. Ignore recurring bank fees
6. If overdue > 10 days --> follow up with client
7. Refresh page for new transactions

## Tips for Better Auto-Match Rate

- Ask clients to include invoice number in wire transfer label
- Standardize client names in CRM
- Follow up on overdue invoices quickly
- Review manual transactions for recurring patterns to create rules
