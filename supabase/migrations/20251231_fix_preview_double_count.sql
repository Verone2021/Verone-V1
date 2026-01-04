-- =====================================================
-- Fix: preview_apply_matching_rule - Double count bug
-- Date: 2025-12-31
-- Problème: Le COUNT doublait les transactions à cause du LATERAL unnest
-- Solution: COUNT(DISTINCT id) et ajout de already_applied_count/pending_count
-- =====================================================

DROP TYPE IF EXISTS preview_match_result CASCADE;

CREATE TYPE preview_match_result AS (
  normalized_label_group TEXT,
  sample_labels TEXT[],
  transaction_count INTEGER,
  total_amount NUMERIC,
  first_seen DATE,
  last_seen DATE,
  counterparty_hint TEXT,
  confidence TEXT,
  confidence_score INTEGER,
  reasons TEXT[],
  sample_transaction_ids UUID[],
  already_applied_count INTEGER,
  pending_count INTEGER
);

CREATE OR REPLACE FUNCTION preview_apply_matching_rule(p_rule_id UUID)
RETURNS SETOF preview_match_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_match_normalized TEXT;
  v_result preview_match_result;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  -- Normaliser le match_value
  v_match_normalized := normalize_label(v_rule.match_value);
  IF v_match_normalized = '' OR v_match_normalized IS NULL THEN
    RAISE EXCEPTION 'match_value invalide (vide après normalisation): "%"', v_rule.match_value;
  END IF;

  -- Retourner les groupes de transactions qui matchent
  FOR v_result IN
    WITH matching_transactions AS (
      SELECT
        bt.id,
        bt.label,
        normalize_label(bt.label) AS label_normalized,
        bt.counterparty_name,
        bt.amount,
        bt.emitted_at::date AS tx_date,
        bt.applied_rule_id,
        bt.category_pcg,
        -- Score de confiance
        CASE
          WHEN normalize_label(bt.label) = v_match_normalized THEN 100
          WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' THEN 90
          WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' THEN 80
          WHEN normalize_label(bt.counterparty_name) = v_match_normalized THEN 85
          WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 70
          ELSE 0
        END AS base_score,
        -- Est-ce que cette transaction est déjà appliquée par CETTE règle?
        CASE WHEN bt.applied_rule_id = p_rule_id THEN TRUE ELSE FALSE END AS is_already_applied,
        -- Est-ce que la catégorie correspond à celle de la règle?
        CASE WHEN bt.category_pcg = v_rule.default_category THEN TRUE ELSE FALSE END AS has_correct_category
      FROM bank_transactions bt
      WHERE bt.side = 'debit'
        -- Inclure les non-classifiées OU déjà classifiées par CETTE règle
        AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
        AND (
          normalize_label(bt.label) LIKE '%' || v_match_normalized || '%'
          OR normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%'
        )
    ),
    grouped AS (
      SELECT
        label_normalized,
        array_agg(DISTINCT label ORDER BY label) FILTER (WHERE label IS NOT NULL) AS all_labels,
        COUNT(DISTINCT id)::INTEGER AS tx_count,  -- FIX: COUNT DISTINCT pour éviter doublons
        SUM(ABS(amount)) AS total_amt,
        MIN(tx_date) AS first_date,
        MAX(tx_date) AS last_date,
        MODE() WITHIN GROUP (ORDER BY counterparty_name) AS top_counterparty,
        MAX(base_score) AS max_score,
        array_agg(DISTINCT id ORDER BY id) AS all_ids,
        -- Compteurs séparés
        COUNT(DISTINCT id) FILTER (WHERE is_already_applied AND has_correct_category)::INTEGER AS fully_applied,
        COUNT(DISTINCT id) FILTER (WHERE is_already_applied AND NOT has_correct_category)::INTEGER AS needs_update,
        COUNT(DISTINCT id) FILTER (WHERE NOT is_already_applied)::INTEGER AS not_applied
      FROM matching_transactions
      GROUP BY label_normalized
    )
    SELECT
      g.label_normalized,
      (g.all_labels)[1:3],  -- Top 3 labels
      g.tx_count::INTEGER,
      g.total_amt,
      g.first_date,
      g.last_date,
      g.top_counterparty,
      CASE
        WHEN g.max_score >= 80 THEN 'HIGH'
        WHEN g.max_score >= 60 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      g.max_score + CASE WHEN g.tx_count >= 3 THEN 10 WHEN g.tx_count >= 2 THEN 5 ELSE 0 END,
      -- Reasons avec comptages clairs
      ARRAY_REMOVE(ARRAY[
        CASE WHEN g.fully_applied > 0 THEN 'déjà appliqué (' || g.fully_applied || ')' END,
        CASE WHEN g.needs_update > 0 THEN 'à mettre à jour (' || g.needs_update || ')' END,
        CASE WHEN g.not_applied > 0 THEN 'à appliquer (' || g.not_applied || ')' END
      ], NULL),
      (g.all_ids)[1:5],  -- Top 5 IDs
      g.fully_applied::INTEGER AS already_applied_count,
      (g.needs_update + g.not_applied)::INTEGER AS pending_count
    FROM grouped g
    ORDER BY
      -- Prioriser ceux qui ont des transactions à appliquer
      CASE WHEN g.not_applied + g.needs_update > 0 THEN 0 ELSE 1 END,
      CASE WHEN g.max_score >= 80 THEN 1 WHEN g.max_score >= 60 THEN 2 ELSE 3 END,
      g.tx_count DESC
  LOOP
    RETURN NEXT v_result;
  END LOOP;

  RETURN;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION preview_apply_matching_rule(UUID) TO authenticated;
