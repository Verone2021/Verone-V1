-- =====================================================================
-- Migration: Fix apply_matching_rule to update bank_transactions
-- Date: 2025-12-27
-- Description: Les règles de classification mettaient à jour uniquement
--              la table expenses, mais pas bank_transactions.
--              Cette migration corrige la fonction RPC pour synchroniser
--              les deux tables correctement.
-- =====================================================================

-- =====================================================================
-- PHASE 1: Recréer la fonction apply_matching_rule
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_matching_rule(
  p_rule_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rule RECORD;
  v_classified_count INTEGER := 0;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id AND enabled = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- ===============================================
  -- Appliquer selon le type de matching
  -- ===============================================

  IF v_rule.match_type = 'label_contains' THEN
    -- 1. Mettre à jour bank_transactions (SOURCE DE VÉRITÉ)
    -- Note: On matche sur LABEL (pas counterparty_name qui est souvent NULL)
    -- category_pcg n'est mis à jour que si c'est un code PCG valide (<=10 chars)
    UPDATE bank_transactions bt
    SET
      matching_status = 'auto_matched',
      category_pcg = CASE
        WHEN LENGTH(v_rule.default_category) <= 10 THEN v_rule.default_category
        ELSE NULL
      END,
      counterparty_organisation_id = v_rule.organisation_id,
      updated_at = NOW()
    WHERE (bt.label ILIKE '%' || v_rule.match_value || '%' OR bt.counterparty_name ILIKE '%' || v_rule.match_value || '%')
      AND bt.matching_status = 'unmatched';

    GET DIAGNOSTICS v_classified_count = ROW_COUNT;

    -- 2. Mettre à jour expenses (pour compatibilité avec l'ancien système)
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND (bt.label ILIKE '%' || v_rule.match_value || '%' OR bt.counterparty_name ILIKE '%' || v_rule.match_value || '%');

  ELSIF v_rule.match_type = 'label_exact' THEN
    -- 1. Mettre à jour bank_transactions (SOURCE DE VÉRITÉ)
    UPDATE bank_transactions bt
    SET
      matching_status = 'auto_matched',
      category_pcg = CASE
        WHEN LENGTH(v_rule.default_category) <= 10 THEN v_rule.default_category
        ELSE NULL
      END,
      counterparty_organisation_id = v_rule.organisation_id,
      updated_at = NOW()
    WHERE (LOWER(TRIM(bt.label)) = LOWER(TRIM(v_rule.match_value)) OR LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value)))
      AND bt.matching_status = 'unmatched';

    GET DIAGNOSTICS v_classified_count = ROW_COUNT;

    -- 2. Mettre à jour expenses (pour compatibilité)
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND (LOWER(TRIM(bt.label)) = LOWER(TRIM(v_rule.match_value)) OR LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value)));

  ELSIF v_rule.match_type = 'iban' THEN
    -- 1. Mettre à jour bank_transactions par IBAN
    UPDATE bank_transactions bt
    SET
      matching_status = 'auto_matched',
      category_pcg = CASE
        WHEN LENGTH(v_rule.default_category) <= 10 THEN v_rule.default_category
        ELSE NULL
      END,
      counterparty_organisation_id = v_rule.organisation_id,
      updated_at = NOW()
    WHERE bt.counterparty_iban = v_rule.match_value
      AND bt.matching_status = 'unmatched';

    GET DIAGNOSTICS v_classified_count = ROW_COUNT;

    -- 2. Mettre à jour expenses
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND bt.counterparty_iban = v_rule.match_value;

  ELSIF v_rule.match_type = 'name_exact' THEN
    -- 1. Mettre à jour bank_transactions par nom exact
    UPDATE bank_transactions bt
    SET
      matching_status = 'auto_matched',
      category_pcg = CASE
        WHEN LENGTH(v_rule.default_category) <= 10 THEN v_rule.default_category
        ELSE NULL
      END,
      counterparty_organisation_id = v_rule.organisation_id,
      updated_at = NOW()
    WHERE LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value))
      AND bt.matching_status = 'unmatched';

    GET DIAGNOSTICS v_classified_count = ROW_COUNT;

    -- 2. Mettre à jour expenses
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = 'classified',
      classified_at = NOW(),
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value));
  END IF;

  RETURN v_classified_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PHASE 2: Mettre à jour la fonction apply_all_matching_rules
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_all_matching_rules()
RETURNS TABLE(rules_applied INTEGER, expenses_classified INTEGER) AS $$
DECLARE
  v_rule RECORD;
  v_total_classified INTEGER := 0;
  v_rules_count INTEGER := 0;
  v_rule_classified INTEGER;
BEGIN
  FOR v_rule IN
    SELECT * FROM matching_rules
    WHERE enabled = true
    ORDER BY priority ASC
  LOOP
    v_rules_count := v_rules_count + 1;

    -- Appliquer la règle (maintenant met à jour bank_transactions ET expenses)
    SELECT apply_matching_rule(v_rule.id) INTO v_rule_classified;
    v_total_classified := v_total_classified + COALESCE(v_rule_classified, 0);
  END LOOP;

  RETURN QUERY SELECT v_rules_count, v_total_classified;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- PHASE 3: Commentaires
-- =====================================================================

COMMENT ON FUNCTION apply_matching_rule(UUID) IS
'Applique une règle de classification à toutes les transactions non classées.
Met à jour à la fois bank_transactions (source de vérité) et expenses (compatibilité).
Retourne le nombre de transactions classifiées.';

COMMENT ON FUNCTION apply_all_matching_rules() IS
'Applique toutes les règles de classification actives par ordre de priorité.
Retourne le nombre de règles appliquées et le total de transactions classifiées.';
