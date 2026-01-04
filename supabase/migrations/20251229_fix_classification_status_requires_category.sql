-- =====================================================================
-- Migration: Fix classification status - only classified if category set
-- Date: 2025-12-29
-- Description: Fix apply_matching_rule to only set status='classified'
--              when a category is actually provided. Organisation-only
--              linking should keep status='unclassified'
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_matching_rule(
  p_rule_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_rule RECORD;
  v_classified_count INTEGER := 0;
  v_counterparty_type TEXT;
  v_new_status TEXT;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id AND enabled = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Déterminer le type de contrepartie
  IF v_rule.organisation_id IS NOT NULL THEN
    v_counterparty_type := 'organisation';
  ELSIF v_rule.individual_customer_id IS NOT NULL THEN
    v_counterparty_type := 'individual';
  ELSE
    v_counterparty_type := NULL;
  END IF;

  -- Déterminer le nouveau statut: classified SEULEMENT si catégorie définie
  v_new_status := CASE
    WHEN v_rule.default_category IS NOT NULL AND v_rule.default_category != '' THEN 'classified'
    ELSE 'unclassified'
  END;

  -- ===============================================
  -- Appliquer selon le type de matching
  -- ===============================================

  IF v_rule.match_type = 'label_contains' THEN
    -- 1. Mettre à jour bank_transactions (SOURCE DE VÉRITÉ)
    UPDATE bank_transactions bt
    SET
      matching_status = 'auto_matched',
      category_pcg = CASE
        WHEN LENGTH(v_rule.default_category) <= 10 THEN v_rule.default_category
        ELSE NULL
      END,
      counterparty_organisation_id = v_rule.organisation_id,
      counterparty_individual_customer_id = v_rule.individual_customer_id,
      counterparty_type = v_counterparty_type,
      updated_at = NOW()
    WHERE (bt.label ILIKE '%' || v_rule.match_value || '%' OR bt.counterparty_name ILIKE '%' || v_rule.match_value || '%')
      AND bt.matching_status = 'unmatched';

    GET DIAGNOSTICS v_classified_count = ROW_COUNT;

    -- 2. Mettre à jour expenses (pour compatibilité avec l'ancien système)
    -- IMPORTANT: Ne passe à 'classified' que si catégorie définie
    UPDATE expenses e
    SET
      organisation_id = v_rule.organisation_id,
      category = v_rule.default_category,
      role_type = v_rule.default_role_type,
      status = v_new_status,
      classified_at = CASE WHEN v_new_status = 'classified' THEN NOW() ELSE NULL END,
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
      counterparty_individual_customer_id = v_rule.individual_customer_id,
      counterparty_type = v_counterparty_type,
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
      status = v_new_status,
      classified_at = CASE WHEN v_new_status = 'classified' THEN NOW() ELSE NULL END,
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
      counterparty_individual_customer_id = v_rule.individual_customer_id,
      counterparty_type = v_counterparty_type,
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
      status = v_new_status,
      classified_at = CASE WHEN v_new_status = 'classified' THEN NOW() ELSE NULL END,
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
      counterparty_individual_customer_id = v_rule.individual_customer_id,
      counterparty_type = v_counterparty_type,
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
      status = v_new_status,
      classified_at = CASE WHEN v_new_status = 'classified' THEN NOW() ELSE NULL END,
      updated_at = NOW()
    FROM bank_transactions bt
    WHERE e.transaction_id = bt.id
      AND e.status = 'unclassified'
      AND LOWER(TRIM(bt.counterparty_name)) = LOWER(TRIM(v_rule.match_value));
  END IF;

  RETURN v_classified_count;
END;
$$ LANGUAGE plpgsql;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Fixed apply_matching_rule: status=classified only when category is set';
END $$;
