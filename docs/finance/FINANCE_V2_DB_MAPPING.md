# Finance v2 - DB Mapping (Source de Verite)

**Date**: 2025-12-27
**Version**: 2.0
**Statut**: Reference unique pour le module Finance

---

## 1. Table Principale: `bank_transactions`

### Champs Immutables (Qonto - NE PAS MODIFIER)

| Colonne             | Type          | Description                                     |
| ------------------- | ------------- | ----------------------------------------------- |
| `id`                | UUID          | PK interne                                      |
| `transaction_id`    | TEXT          | ID Qonto (unique)                               |
| `bank_provider`     | TEXT          | 'qonto'                                         |
| `bank_account_id`   | TEXT          | ID compte Qonto                                 |
| `amount`            | NUMERIC(12,2) | Montant TTC (signe = sens)                      |
| `amount_cents`      | INTEGER       | Montant en centimes                             |
| `currency`          | TEXT          | 'EUR'                                           |
| `side`              | ENUM          | 'credit' / 'debit'                              |
| `operation_type`    | TEXT          | 'transfer', 'card', 'direct_debit', 'qonto_fee' |
| `label`             | TEXT          | Libelle transaction                             |
| `reference`         | TEXT          | Reference virement                              |
| `counterparty_name` | TEXT          | Nom contrepartie                                |
| `counterparty_iban` | TEXT          | IBAN contrepartie                               |
| `counterparty_bic`  | TEXT          | BIC contrepartie                                |
| `emitted_at`        | TIMESTAMPTZ   | Date emission                                   |
| `settled_at`        | TIMESTAMPTZ   | Date reglement                                  |
| `status`            | TEXT          | 'pending', 'completed', 'declined'              |
| `attachment_ids`    | TEXT[]        | IDs pieces jointes Qonto                        |
| `raw_data`          | JSONB         | Payload Qonto complet                           |
| `synced_at`         | TIMESTAMPTZ   | Derniere sync                                   |

### Champs Enrichissement (Modifiables)

| Colonne                        | Type          | Description                 | Statut v2      |
| ------------------------------ | ------------- | --------------------------- | -------------- |
| `category_pcg`                 | VARCHAR(10)   | Code PCG (ex: '607', '627') | **ACTIF**      |
| `counterparty_organisation_id` | UUID          | FK organisations            | **ACTIF**      |
| `matching_status`              | ENUM          | Statut unifie               | **ACTIF**      |
| `matched_document_id`          | UUID          | FK financial_documents      | **ACTIF**      |
| `matched_at`                   | TIMESTAMPTZ   | Date rapprochement          | **ACTIF**      |
| `matched_by`                   | UUID          | User qui a matche           | **ACTIF**      |
| `confidence_score`             | INTEGER       | Score auto-match (0-100)    | **ACTIF**      |
| `match_reason`                 | TEXT          | Raison du match             | **ACTIF**      |
| `vat_rate`                     | DECIMAL(4,2)  | Taux TVA (0, 5.5, 10, 20)   | **ACTIF**      |
| `payment_method`               | VARCHAR(50)   | Methode paiement            | **ACTIF**      |
| `nature`                       | VARCHAR(50)   | bic, bnc, prestation        | **ACTIF**      |
| `amount_ht`                    | DECIMAL(12,2) | Montant HT (calcule)        | **ACTIF**      |
| `amount_vat`                   | DECIMAL(12,2) | Montant TVA (calcule)       | **ACTIF**      |
| `has_attachment`               | BOOLEAN       | A un justificatif           | **ACTIF**      |
| `justification_optional`       | BOOLEAN       | Justif non requis           | **ACTIF**      |
| `category`                     | TEXT          | Ancienne categorie          | **DEPRECATED** |
| `note`                         | TEXT          | Note utilisateur            | **ACTIF**      |

---

## 2. Statuts Unifies (`matching_status`)

| Valeur            | Definition       | Condition                           |
| ----------------- | ---------------- | ----------------------------------- |
| `unmatched`       | A traiter        | Aucun enrichissement                |
| `auto_matched`    | Rapproche auto   | Via regle + confidence >= 80        |
| `manual_matched`  | Rapproche manuel | Valide par utilisateur              |
| `partial_matched` | Partiellement    | Montant matche < montant tx         |
| `ignored`         | Ignore           | Frais bancaires, virements internes |

### Statut Derive "CCA" (Compte Courant Associe)

Pas de valeur enum - detecte via:

```sql
category_pcg = '455' -- Compte courant associe
```

### Statut Derive "Classifie"

Transaction classifiee = a un `category_pcg` mais pas de `matched_document_id`.

---

## 3. Relations FK

### bank_transactions -> organisations

```
bank_transactions.counterparty_organisation_id -> organisations.id
```

L'organisation peut avoir plusieurs roles via `organisation_roles`:

- `customer` - Client
- `supplier_goods` - Fournisseur marchandises
- `supplier_services` - Fournisseur services (prestataire)
- `affiliate_partner` - Partenaire affilie

### bank_transactions -> financial_documents

```
bank_transactions.matched_document_id -> financial_documents.id
```

### bank_transactions -> bank_transaction_matches (multi-match)

```
bank_transaction_matches.bank_transaction_id -> bank_transactions.id
bank_transaction_matches.sales_order_id -> sales_orders.id
```

Permet 1 transaction -> N commandes (split paiement).

---

## 4. Table Regles: `matching_rules`

| Colonne             | Type    | Description                                           |
| ------------------- | ------- | ----------------------------------------------------- |
| `id`                | UUID    | PK                                                    |
| `priority`          | INT     | Plus bas = plus prioritaire                           |
| `enabled`           | BOOLEAN | Regle active                                          |
| `match_type`        | TEXT    | 'iban', 'name_exact', 'label_contains', 'label_regex' |
| `match_value`       | TEXT    | Valeur a matcher                                      |
| `counterparty_id`   | UUID    | FK counterparties (DEPRECATED)                        |
| `default_category`  | TEXT    | Categorie par defaut                                  |
| `default_role_type` | TEXT    | 'supplier', 'customer', etc.                          |

### Migration v2: Lier a organisations

La table `matching_rules` reference actuellement `counterparties` (deprecated).
Migration necessaire vers `organisations`:

```sql
-- A faire en Phase A
ALTER TABLE matching_rules
ADD COLUMN organisation_id UUID REFERENCES organisations(id);
```

---

## 5. Table Audit: `bank_transactions_enrichment_audit`

**A CREER** - Pour reset non-destructif:

```sql
CREATE TABLE bank_transactions_enrichment_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES bank_transactions(id),

  -- Snapshot avant/apres
  before_json JSONB NOT NULL,  -- Valeurs avant modification
  after_json JSONB NOT NULL,   -- Valeurs apres modification

  -- Action
  action TEXT NOT NULL CHECK (action IN ('reset', 'classify', 'link_org', 'match', 'ignore')),

  -- Audit
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT
);

CREATE INDEX idx_bte_audit_transaction ON bank_transactions_enrichment_audit(transaction_id);
CREATE INDEX idx_bte_audit_date ON bank_transactions_enrichment_audit(changed_at DESC);
```

---

## 6. Vue Unifiee: `v_transactions_unified`

**A CREER** - Source unique pour UI:

```sql
CREATE OR REPLACE VIEW v_transactions_unified AS
SELECT
  bt.id,
  bt.transaction_id,
  bt.emitted_at,
  bt.settled_at,
  bt.label,
  bt.amount,
  bt.side,
  bt.counterparty_name,
  bt.counterparty_iban,

  -- Enrichissement
  bt.category_pcg,
  bt.counterparty_organisation_id,
  o.name AS organisation_name,
  o.type AS organisation_type,

  -- Justificatif
  bt.has_attachment,
  COALESCE(array_length(bt.attachment_ids, 1), 0) AS attachment_count,

  -- Rapprochement
  bt.matching_status,
  bt.matched_document_id,
  fd.document_number AS matched_document_number,

  -- Statut unifie calcule
  CASE
    WHEN bt.category_pcg = '455' THEN 'cca'
    WHEN bt.matching_status = 'ignored' THEN 'ignored'
    WHEN bt.matched_document_id IS NOT NULL THEN 'matched'
    WHEN bt.category_pcg IS NOT NULL THEN 'classified'
    ELSE 'to_process'
  END AS unified_status,

  -- Montants
  bt.vat_rate,
  bt.amount_ht,
  bt.amount_vat,

  -- Metadata
  bt.operation_type,
  bt.raw_data,
  bt.created_at,
  bt.updated_at

FROM bank_transactions bt
LEFT JOIN organisations o ON bt.counterparty_organisation_id = o.id
LEFT JOIN financial_documents fd ON bt.matched_document_id = fd.id
WHERE bt.status = 'completed';
```

---

## 7. Suggestions et Rules

### Ou vivent les suggestions?

Les suggestions sont **calculees a la volee** par la fonction `find_matching_suggestions()`:

```sql
-- Fonction existante: trouve les suggestions pour une transaction
SELECT * FROM find_matching_suggestions(transaction_id);
```

### Ou vivent les rules?

Table `matching_rules` avec types:

- `iban` - Match sur IBAN exact
- `name_exact` - Match sur nom contrepartie exact
- `label_contains` - Label contient pattern
- `label_regex` - Label match regex

### Auto-apply vs Suggest-only

**v2 = Suggest-only**

Les regles suggerent mais n'appliquent PAS automatiquement.
L'utilisateur valide chaque suggestion.

Log des suggestions appliquees dans `bank_transactions_enrichment_audit`.

---

## 8. Tables Deprecated (Ne pas utiliser)

| Table                        | Raison                     | Alternative         |
| ---------------------------- | -------------------------- | ------------------- |
| `counterparties`             | Remplace par organisations | `organisations`     |
| `counterparty_bank_accounts` | Remplace                   | `organisations`     |
| `expenses`                   | Doublon bank_transactions  | `bank_transactions` |

---

## 9. Calcul KPIs (Source Unique)

```sql
-- Stats unifiees
SELECT
  COUNT(*) FILTER (WHERE unified_status = 'to_process') AS to_process,
  COUNT(*) FILTER (WHERE unified_status = 'classified') AS classified,
  COUNT(*) FILTER (WHERE unified_status = 'matched') AS matched,
  COUNT(*) FILTER (WHERE unified_status = 'ignored') AS ignored,
  COUNT(*) FILTER (WHERE unified_status = 'cca') AS cca,
  COUNT(*) FILTER (WHERE has_attachment = true) AS with_attachment,
  COUNT(*) FILTER (WHERE has_attachment = false OR has_attachment IS NULL) AS without_attachment,
  SUM(ABS(amount)) AS total_amount,
  SUM(ABS(amount)) FILTER (WHERE unified_status = 'to_process') AS to_process_amount
FROM v_transactions_unified;
```

---

_Document genere le 2025-12-27 - Reference unique module Finance v2_
