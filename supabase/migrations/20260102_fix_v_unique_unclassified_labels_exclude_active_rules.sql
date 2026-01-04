-- Fix: v_unique_unclassified_labels doit exclure les labels qui ont déjà une règle active
-- Problème: Les labels avec une règle active apparaissaient toujours dans "Libellés non classés"

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
  -- Exclure les labels qui matchent une règle active
  AND NOT EXISTS (
    SELECT 1 FROM matching_rules mr
    WHERE mr.is_active = true
    AND (
      -- label_exact: match exact (case insensitive)
      (mr.match_type = 'label_exact' AND LOWER(e.label) = LOWER(mr.match_value))
      -- label_contains: contient le pattern (case insensitive)
      OR (mr.match_type = 'label_contains' AND LOWER(e.label) LIKE '%' || LOWER(mr.match_value) || '%')
      -- label_regex: match regex
      OR (mr.match_type = 'label_regex' AND e.label ~* mr.match_value)
    )
  )
GROUP BY e.label
ORDER BY count(*) DESC;

-- Grant access
GRANT SELECT ON v_unique_unclassified_labels TO authenticated;
GRANT SELECT ON v_unique_unclassified_labels TO anon;
