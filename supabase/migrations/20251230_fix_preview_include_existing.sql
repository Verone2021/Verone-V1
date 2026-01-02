-- Migration: Fix preview_apply_matching_rule pour inclure transactions existantes
-- Date: 2025-12-30
-- Problème: Les transactions déjà classifiées par une règle n'apparaissent plus
--           dans la prévisualisation, empêchant la mise à jour de leur catégorie.
-- Solution: Inclure les transactions déjà classifiées par CETTE règle spécifique.

-- =====================================================
-- FIX 1: preview_apply_matching_rule
-- Inclure les transactions déjà classifiées par CETTE règle
-- =====================================================

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

  -- GARDE-FOU: Si match_value normalisé est vide, erreur
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
        normalize_label(bt.counterparty_name) AS counterparty_normalized,
        bt.counterparty_iban,
        bt.amount,
        bt.emitted_at::date AS tx_date,
        bt.applied_rule_id,
        -- Calcul du score
        CASE
          -- Match exact label
          WHEN normalize_label(bt.label) = v_match_normalized THEN 100
          -- Label contient le match (début)
          WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' THEN 90
          -- Label contient le match
          WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' THEN 80
          -- Counterparty match exact
          WHEN normalize_label(bt.counterparty_name) = v_match_normalized THEN 85
          -- Counterparty contient
          WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 70
          ELSE 0
        END AS base_score,
        -- Raisons
        ARRAY_REMOVE(ARRAY[
          CASE WHEN normalize_label(bt.label) = v_match_normalized THEN 'label exact' END,
          CASE WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' AND normalize_label(bt.label) != v_match_normalized THEN 'label commence par' END,
          CASE WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' AND normalize_label(bt.label) NOT LIKE v_match_normalized || '%' THEN 'label contient' END,
          CASE WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 'contrepartie similaire' END,
          -- Nouvelle raison: déjà classifié par cette règle
          CASE WHEN bt.applied_rule_id = p_rule_id THEN 'déjà classifié' END
        ], NULL) AS match_reasons
      FROM bank_transactions bt
      WHERE bt.side = 'debit'
        -- FIX: Inclure les transactions non classifiées OU déjà classifiées par CETTE règle
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
        COUNT(*) AS tx_count,
        SUM(ABS(amount)) AS total_amt,
        MIN(tx_date) AS first_date,
        MAX(tx_date) AS last_date,
        MODE() WITHIN GROUP (ORDER BY counterparty_name) AS top_counterparty,
        MAX(base_score) AS max_score,
        array_agg(DISTINCT unnest_reason) AS all_reasons,
        array_agg(id ORDER BY tx_date DESC) AS all_ids,
        -- Compter combien sont déjà classifiées
        COUNT(*) FILTER (WHERE applied_rule_id = p_rule_id) AS already_classified_count
      FROM matching_transactions,
           LATERAL unnest(match_reasons) AS unnest_reason
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
      -- Bonus pour récurrence
      g.max_score + CASE WHEN g.tx_count >= 3 THEN 10 WHEN g.tx_count >= 2 THEN 5 ELSE 0 END,
      g.all_reasons,
      (g.all_ids)[1:5]  -- Top 5 IDs
    FROM grouped g
    ORDER BY
      CASE WHEN g.max_score >= 80 THEN 1 WHEN g.max_score >= 60 THEN 2 ELSE 3 END,
      g.tx_count DESC
  LOOP
    RETURN NEXT v_result;
  END LOOP;

  RETURN;
END;
$$;

-- =====================================================
-- FIX 2: apply_matching_rule_confirm
-- Permettre la mise à jour des transactions déjà classifiées par CETTE règle
-- =====================================================

CREATE OR REPLACE FUNCTION apply_matching_rule_confirm(
  p_rule_id UUID,
  p_selected_normalized_labels TEXT[]
)
RETURNS TABLE (
  nb_updated INTEGER,
  updated_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_updated_count INTEGER := 0;
  v_updated_ids UUID[];
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  -- Vérifier que des labels ont été sélectionnés
  IF p_selected_normalized_labels IS NULL OR array_length(p_selected_normalized_labels, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun label sélectionné pour application';
  END IF;

  -- Marquer la session comme "apply_rule_context" pour le trigger
  PERFORM set_config('app.apply_rule_context', 'true', true);

  -- Appliquer aux transactions dont le label normalisé est dans la sélection
  -- FIX: Inclure les transactions déjà classifiées par CETTE règle (pour mise à jour catégorie)
  WITH updated AS (
    UPDATE bank_transactions bt
    SET
      applied_rule_id = p_rule_id,
      category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
      matching_status = 'auto_matched',
      match_reason = 'Règle confirmée: ' || v_rule.match_value,
      updated_at = NOW()
    WHERE bt.side = 'debit'
      -- FIX: Inclure non classifiées OU déjà classifiées par CETTE règle
      AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
      AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
    RETURNING bt.id
  )
  SELECT COUNT(*)::INTEGER, array_agg(id)
  INTO v_updated_count, v_updated_ids
  FROM updated;

  -- Remettre le contexte à false
  PERFORM set_config('app.apply_rule_context', 'false', true);

  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$$;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION preview_apply_matching_rule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_matching_rule_confirm(UUID, TEXT[]) TO authenticated;
