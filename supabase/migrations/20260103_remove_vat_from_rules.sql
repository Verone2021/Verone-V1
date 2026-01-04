-- =====================================================================
-- Migration: Retirer COMPLÈTEMENT la TVA des règles de dépenses
-- Date: 2026-01-03
-- Description: La TVA ne peut pas être une règle car le pourcentage change
--              à chaque facture selon la consommation. La TVA doit venir
--              UNIQUEMENT de Qonto OCR ou de la saisie manuelle.
--
-- Actions:
-- 1. Supprimer trigger de propagation TVA
-- 2. Supprimer fonctions helper TVA
-- 3. Modifier RPC pour ne plus appliquer TVA
-- 4. Modifier vue pour ne plus exposer colonnes TVA
-- 5. Supprimer colonnes TVA de matching_rules
-- 6. Nettoyer vat_breakdown des transactions (sauf Qonto OCR/manuel)
-- =====================================================================

-- =====================================================================
-- ÉTAPE 1: Supprimer le trigger de propagation TVA
-- =====================================================================

DROP TRIGGER IF EXISTS trigger_propagate_rule_vat ON matching_rules;
DROP FUNCTION IF EXISTS propagate_rule_vat_to_transactions();

-- =====================================================================
-- ÉTAPE 2: Supprimer les fonctions helper TVA
-- (Note: on les garde car elles peuvent être utilisées ailleurs)
-- =====================================================================

-- On NE supprime PAS ces fonctions car elles sont utiles pour d'autres calculs
-- DROP FUNCTION IF EXISTS calculate_vat_from_ttc(NUMERIC, NUMERIC);
-- DROP FUNCTION IF EXISTS build_single_vat_breakdown(NUMERIC, NUMERIC);
-- DROP FUNCTION IF EXISTS apply_multi_vat_breakdown(NUMERIC, JSONB);

-- =====================================================================
-- ÉTAPE 3: Modifier apply_rule_to_all_matching - NE PLUS TOUCHER À LA TVA
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
  -- Récupérer la règle (SANS colonnes TVA)
  SELECT id, match_type, match_value, match_patterns, default_category, organisation_id
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
        -- PLUS DE TVA: vat_rate, vat_breakdown ne sont plus touchés
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
      -- PLUS DE TVA: vat_rate, vat_breakdown ne sont plus touchés
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

COMMENT ON FUNCTION apply_rule_to_all_matching IS
'Applique une règle à toutes les transactions correspondantes. NE TOUCHE PAS À LA TVA.';

-- =====================================================================
-- ÉTAPE 4: Modifier apply_matching_rule_confirm - NE PLUS TOUCHER À LA TVA
-- =====================================================================

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
  -- Récupérer la règle (SANS colonnes TVA)
  SELECT id, match_value, default_category, organisation_id
  INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  IF p_selected_normalized_labels IS NULL OR array_length(p_selected_normalized_labels, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun label sélectionné pour application';
  END IF;

  PERFORM set_config('app.apply_rule_context', 'true', true);

  -- Appliquer SANS toucher à la TVA
  WITH updated AS (
    UPDATE bank_transactions bt
    SET
      applied_rule_id = p_rule_id,
      category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
      matching_status = 'auto_matched',
      match_reason = 'Règle confirmée: ' || v_rule.match_value,
      -- PLUS DE TVA: on ne touche plus à vat_rate, amount_ht, amount_vat, vat_breakdown
      updated_at = NOW()
    WHERE bt.side = 'debit'
      AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
      AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
    RETURNING bt.id
  )
  SELECT COUNT(*)::INTEGER, array_agg(id)
  INTO v_updated_count, v_updated_ids
  FROM updated;

  PERFORM set_config('app.apply_rule_context', 'false', true);

  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION apply_matching_rule_confirm IS
'Applique une règle aux labels sélectionnés. Propage catégorie et organisation SEULEMENT (pas la TVA).';

-- =====================================================================
-- ÉTAPE 5: Modifier auto_classify_bank_transaction - Retirer SELECT default_vat_rate
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
BEGIN
  IF NEW.side = 'debit' AND (NEW.matching_status IS NULL OR NEW.matching_status = 'unmatched') THEN
    -- Parcourir les règles actives (SANS default_vat_rate)
    FOR v_rule IN
      SELECT id, match_type, match_value, default_category, organisation_id
      FROM matching_rules
      WHERE is_active = true AND enabled = true
      ORDER BY priority ASC
    LOOP
      IF v_rule.match_type = 'label_contains'
         AND NEW.label ILIKE '%' || v_rule.match_value || '%' THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        -- TVA vient de Qonto OCR ou saisie manuelle
        RETURN NEW;
      END IF;

      IF v_rule.match_type = 'label_exact'
         AND LOWER(NEW.label) = LOWER(v_rule.match_value) THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        RETURN NEW;
      END IF;

      IF v_rule.match_type = 'label_regex'
         AND NEW.label ~* v_rule.match_value THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        RETURN NEW;
      END IF;
    END LOOP;

    IF NEW.matching_status IS NULL THEN
      NEW.matching_status := 'unmatched';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_classify_bank_transaction() IS
'Applique automatiquement les règles de matching (catégorie seulement, PAS la TVA).';

-- =====================================================================
-- ÉTAPE 6: Recréer la vue v_matching_rules_with_org SANS colonnes TVA
-- =====================================================================

DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE VIEW v_matching_rules_with_org AS
SELECT
    mr.id,
    mr.priority,
    mr.enabled,
    mr.is_active,
    mr.match_type,
    mr.match_value,
    mr.display_label,
    mr.organisation_id,
    mr.individual_customer_id,
    mr.counterparty_type,
    mr.default_category,
    mr.default_role_type,
    mr.allow_multiple_categories,
    -- PLUS DE COLONNES TVA: default_vat_rate et vat_breakdown retirés
    mr.created_at,
    mr.created_by,
    o.legal_name AS organisation_name,
    o.type AS organisation_type,
    (SELECT count(*) FROM bank_transactions bt WHERE bt.applied_rule_id = mr.id) AS matched_expenses_count
FROM matching_rules mr
LEFT JOIN organisations o ON mr.organisation_id = o.id
ORDER BY mr.priority, mr.created_at DESC;

GRANT SELECT ON v_matching_rules_with_org TO authenticated;
GRANT SELECT ON v_matching_rules_with_org TO anon;

COMMENT ON VIEW v_matching_rules_with_org IS
'Vue des règles de matching SANS colonnes TVA (TVA vient de Qonto OCR ou saisie manuelle).';

-- =====================================================================
-- ÉTAPE 7: Nettoyer les données - Effacer TVA des règles existantes
-- =====================================================================

UPDATE matching_rules
SET
  default_vat_rate = NULL,
  vat_breakdown = NULL
WHERE default_vat_rate IS NOT NULL OR vat_breakdown IS NOT NULL;

-- =====================================================================
-- ÉTAPE 8: Nettoyer les transactions qui ont eu TVA via règles
-- (Garder celles de Qonto OCR et saisie manuelle)
-- =====================================================================

UPDATE bank_transactions
SET vat_breakdown = NULL
WHERE vat_breakdown IS NOT NULL
  AND (vat_source IS NULL OR vat_source NOT IN ('qonto_ocr', 'manual'));

-- =====================================================================
-- ÉTAPE 9: Supprimer les colonnes de matching_rules
-- =====================================================================

ALTER TABLE matching_rules DROP COLUMN IF EXISTS default_vat_rate;
ALTER TABLE matching_rules DROP COLUMN IF EXISTS vat_breakdown;

-- =====================================================================
-- FIN DE LA MIGRATION
-- TVA retirée des règles de dépenses.
-- La TVA vient maintenant UNIQUEMENT de Qonto OCR ou saisie manuelle.
-- =====================================================================
