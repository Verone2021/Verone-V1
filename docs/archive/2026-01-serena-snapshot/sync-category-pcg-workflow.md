# Workflow: Synchroniser category_pcg depuis matching_rules

## Contexte

Quand une règle est appliquée via `apply_matching_rule_confirm`, la catégorie doit être copiée vers `bank_transactions.category_pcg`. Si ce n'est pas fait, la colonne "Catégorie" est vide dans la vue Dépenses.

## Diagnostic

```sql
-- Trouver les transactions avec règle mais sans catégorie
SELECT
  mr.match_value,
  mr.default_category,
  COUNT(*) as total_tx,
  COUNT(*) FILTER (WHERE bt.category_pcg IS NULL) as without_category
FROM bank_transactions bt
JOIN matching_rules mr ON bt.applied_rule_id = mr.id
GROUP BY mr.id, mr.match_value, mr.default_category;
```

## Correction (via API Supabase)

**IMPORTANT**: Le trigger `check_rule_lock` bloque les updates sur `category_pcg` si la transaction a un `applied_rule_id`. Il faut activer le contexte `app.apply_rule_context`.

```sql
DO $$
BEGIN
  PERFORM set_config('app.apply_rule_context', 'true', true);

  UPDATE bank_transactions bt
  SET category_pcg = mr.default_category
  FROM matching_rules mr
  WHERE bt.applied_rule_id = mr.id
    AND mr.default_category IS NOT NULL
    AND (bt.category_pcg IS NULL OR bt.category_pcg = '');

  PERFORM set_config('app.apply_rule_context', 'false', true);
END;
$$;
```

## Exécution via Node.js (recommandé)

```javascript
node << 'EOFJS';
const https = require('https');
const sql = `DO $$ ... $$;`;
const data = JSON.stringify({ query: sql });
// ... voir /supabase/migrations/20251230_sync_category_pcg_from_rules.sql
EOFJS;
```

## Date: 2025-12-30
