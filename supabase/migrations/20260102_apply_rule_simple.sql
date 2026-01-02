-- =====================================================================
-- Migration: RPC simple pour appliquer une règle
-- Date: 2026-01-02
-- Description: Applique automatiquement une règle à toutes les transactions
--              correspondantes. Remplace le workflow preview/confirm.
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_rule_to_all_matching(p_rule_id UUID)
RETURNS TABLE (nb_updated INT, message TEXT)
AS $$
DECLARE
  v_rule RECORD;
  v_pattern TEXT;
  v_count INT := 0;
  v_temp_count INT := 0;
BEGIN
  -- Récupérer la règle
  SELECT id, match_type, match_value, match_patterns, default_category,
         organisation_id, default_vat_rate, vat_breakdown
  INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id AND is_active = true AND enabled = true;

  IF v_rule.id IS NULL THEN
    RETURN QUERY SELECT 0, 'Règle non trouvée ou inactive'::TEXT;
    RETURN;
  END IF;

  -- Appliquer avec multi-patterns si disponible
  IF v_rule.match_patterns IS NOT NULL AND array_length(v_rule.match_patterns, 1) > 0 THEN
    FOREACH v_pattern IN ARRAY v_rule.match_patterns LOOP
      UPDATE bank_transactions
      SET
        category_pcg = COALESCE(v_rule.default_category, category_pcg),
        counterparty_organisation_id = COALESCE(v_rule.organisation_id, counterparty_organisation_id),
        vat_rate = COALESCE(v_rule.default_vat_rate, vat_rate),
        vat_breakdown = COALESCE(v_rule.vat_breakdown, vat_breakdown),
        applied_rule_id = v_rule.id,
        matching_status = 'auto_matched',
        updated_at = NOW()
      WHERE side = 'debit'
        AND label ILIKE '%' || v_pattern || '%'
        AND (applied_rule_id IS NULL OR applied_rule_id = v_rule.id);

      GET DIAGNOSTICS v_temp_count = ROW_COUNT;
      v_count := v_count + v_temp_count;
    END LOOP;
  ELSE
    -- Fallback: utiliser match_value
    UPDATE bank_transactions
    SET
      category_pcg = COALESCE(v_rule.default_category, category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, counterparty_organisation_id),
      vat_rate = COALESCE(v_rule.default_vat_rate, vat_rate),
      vat_breakdown = COALESCE(v_rule.vat_breakdown, vat_breakdown),
      applied_rule_id = v_rule.id,
      matching_status = 'auto_matched',
      updated_at = NOW()
    WHERE side = 'debit'
      AND label ILIKE '%' || v_rule.match_value || '%'
      AND (applied_rule_id IS NULL OR applied_rule_id = v_rule.id);

    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  RETURN QUERY SELECT v_count, ('Règle appliquée à ' || v_count || ' transactions')::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant access
GRANT EXECUTE ON FUNCTION apply_rule_to_all_matching(UUID) TO authenticated;

COMMENT ON FUNCTION apply_rule_to_all_matching IS
'Applique une règle à toutes les transactions correspondantes. Retourne le nombre de transactions mises à jour.';
