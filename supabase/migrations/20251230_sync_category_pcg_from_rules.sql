-- Migration: Synchroniser category_pcg depuis matching_rules
-- Date: 2025-12-30
-- Problème: Les transactions avec applied_rule_id ont category_pcg = NULL
-- Solution: Copier default_category de la règle vers category_pcg
-- Note: Utilise set_config pour bypasser le trigger check_rule_lock

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Activer le contexte d'application de règle (bypass trigger)
  PERFORM set_config('app.apply_rule_context', 'true', true);

  -- Synchroniser category_pcg depuis les règles
  WITH updated AS (
    UPDATE bank_transactions bt
    SET category_pcg = mr.default_category
    FROM matching_rules mr
    WHERE bt.applied_rule_id = mr.id
      AND mr.default_category IS NOT NULL
      AND (bt.category_pcg IS NULL OR bt.category_pcg = '')
    RETURNING bt.id
  )
  SELECT COUNT(*) INTO v_count FROM updated;

  -- Désactiver le contexte
  PERFORM set_config('app.apply_rule_context', 'false', true);

  RAISE NOTICE '✅ % transactions synchronisées avec leur règle', v_count;
END;
$$;

-- Vérification
SELECT
  mr.match_value,
  mr.default_category,
  COUNT(*) as total_tx,
  COUNT(*) FILTER (WHERE bt.category_pcg = mr.default_category) as synced,
  COUNT(*) FILTER (WHERE bt.category_pcg IS NULL OR bt.category_pcg = '') as not_synced
FROM bank_transactions bt
JOIN matching_rules mr ON bt.applied_rule_id = mr.id
GROUP BY mr.id, mr.match_value, mr.default_category
ORDER BY total_tx DESC;
