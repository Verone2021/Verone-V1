-- Fix: v_unique_unclassified_labels doit utiliser 'label' au lieu de 'counterparty_name'
-- Le champ counterparty_name est vide pour les transactions non classées
-- Le champ label contient les vrais libellés des transactions

CREATE OR REPLACE VIEW v_unique_unclassified_labels AS
SELECT
  e.label AS label,
  count(*) AS transaction_count,
  sum(abs(e.amount)) AS total_amount,
  min(e.emitted_at) AS first_seen,
  max(e.emitted_at) AS last_seen,
  array_agg(DISTINCT e.id) AS expense_ids
FROM expenses e
WHERE e.status = 'unclassified'
  AND e.label IS NOT NULL
  AND e.label <> ''
GROUP BY e.label
ORDER BY count(*) DESC;

-- Grant access
GRANT SELECT ON v_unique_unclassified_labels TO authenticated;
GRANT SELECT ON v_unique_unclassified_labels TO anon;
