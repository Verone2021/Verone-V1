-- Migration: Fix apply_matching_rule_confirm for multiple rows
-- Date: 2025-12-30
-- Problem: RETURNING ... INTO fails when UPDATE affects multiple rows
-- Solution: Use array_agg() to collect all updated IDs

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

  -- Appliquer UNIQUEMENT aux transactions dont le label normalisé est dans la sélection
  -- FIX: Use WITH ... RETURNING + array_agg instead of RETURNING INTO for multiple rows
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
      AND bt.applied_rule_id IS NULL  -- Pas déjà classé
      AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
    RETURNING bt.id
  )
  SELECT COUNT(*)::INTEGER, array_agg(id)
  INTO v_updated_count, v_updated_ids
  FROM updated;

  -- Remettre le contexte à false
  PERFORM set_config('app.apply_rule_context', 'false', true);

  -- Retourner le résultat (limité à 20 IDs pour éviter payload trop gros)
  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION apply_matching_rule_confirm IS 'Applique une règle UNIQUEMENT aux labels normalisés sélectionnés. Fixed for multiple rows.';
