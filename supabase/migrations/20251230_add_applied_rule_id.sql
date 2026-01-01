-- Migration: Ajouter applied_rule_id sur bank_transactions
-- Date: 2025-12-30
-- SLICE 3: Verrouillage UI quand règle active
--
-- Objectif: Tracer quelle règle a classé une transaction
-- pour permettre le verrouillage UI et la navigation vers la règle

-- =====================================================
-- 1. AJOUTER LA COLONNE applied_rule_id
-- =====================================================

ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS applied_rule_id UUID REFERENCES matching_rules(id) ON DELETE SET NULL;

-- Index pour requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_bank_transactions_applied_rule
ON bank_transactions(applied_rule_id) WHERE applied_rule_id IS NOT NULL;

COMMENT ON COLUMN bank_transactions.applied_rule_id IS
'ID de la règle qui a classé cette transaction. Si présent, les boutons de classification/liaison sont verrouillés.';

-- =====================================================
-- 2. METTRE À JOUR LA RPC apply_matching_rule
-- =====================================================

-- Recréer la fonction pour qu'elle stocke applied_rule_id
CREATE OR REPLACE FUNCTION apply_matching_rule(p_rule_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_rule RECORD;
  v_updated_count INTEGER := 0;
  v_matched_ids UUID[];
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id AND enabled = true;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Trouver les transactions qui matchent
  IF v_rule.match_type = 'label_contains' THEN
    SELECT ARRAY_AGG(bt.id) INTO v_matched_ids
    FROM bank_transactions bt
    WHERE bt.side = 'debit'
      AND (
        normalize_label(bt.label) ILIKE '%' || normalize_label(v_rule.match_value) || '%'
        OR normalize_label(bt.counterparty_name) ILIKE '%' || normalize_label(v_rule.match_value) || '%'
      );

  ELSIF v_rule.match_type = 'label_exact' THEN
    SELECT ARRAY_AGG(bt.id) INTO v_matched_ids
    FROM bank_transactions bt
    WHERE bt.side = 'debit'
      AND (
        normalize_label(bt.label) = normalize_label(v_rule.match_value)
        OR normalize_label(bt.counterparty_name) = normalize_label(v_rule.match_value)
      );

  ELSIF v_rule.match_type = 'iban' THEN
    SELECT ARRAY_AGG(bt.id) INTO v_matched_ids
    FROM bank_transactions bt
    WHERE bt.side = 'debit'
      AND bt.counterparty_iban = v_rule.match_value;
  END IF;

  -- Si pas de match, retourner 0
  IF v_matched_ids IS NULL OR array_length(v_matched_ids, 1) IS NULL THEN
    RETURN 0;
  END IF;

  -- Mettre à jour bank_transactions avec la catégorie PCG si définie
  -- SLICE 3: Stocker aussi applied_rule_id
  IF v_rule.default_category IS NOT NULL THEN
    UPDATE bank_transactions
    SET
      category_pcg = v_rule.default_category,
      matching_status = 'auto_matched',
      match_reason = 'Règle: ' || v_rule.match_value,
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, counterparty_organisation_id),
      applied_rule_id = p_rule_id,  -- SLICE 3: Tracer la règle
      updated_at = NOW()
    WHERE id = ANY(v_matched_ids)
      AND (category_pcg IS NULL OR category_pcg = '');  -- Ne pas écraser si déjà classé

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  ELSE
    -- Pas de catégorie, juste lier l'organisation si définie
    IF v_rule.organisation_id IS NOT NULL THEN
      UPDATE bank_transactions
      SET
        counterparty_organisation_id = v_rule.organisation_id,
        matching_status = 'auto_matched',
        match_reason = 'Règle: ' || v_rule.match_value,
        applied_rule_id = p_rule_id,  -- SLICE 3: Tracer la règle
        updated_at = NOW()
      WHERE id = ANY(v_matched_ids)
        AND counterparty_organisation_id IS NULL;  -- Ne pas écraser

      GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    END IF;
  END IF;

  -- Mettre à jour aussi la table expenses si elle existe
  UPDATE expenses e
  SET
    category = COALESCE(v_rule.default_category, e.category),
    organisation_id = COALESCE(v_rule.organisation_id, e.organisation_id),
    status = CASE
      WHEN v_rule.default_category IS NOT NULL THEN 'classified'
      WHEN v_rule.organisation_id IS NOT NULL THEN 'classified'
      ELSE e.status
    END,
    classified_at = CASE
      WHEN v_rule.default_category IS NOT NULL OR v_rule.organisation_id IS NOT NULL THEN NOW()
      ELSE e.classified_at
    END,
    updated_at = NOW()
  WHERE e.transaction_id = ANY(v_matched_ids);

  -- Retourner le nombre de transactions mises à jour
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. METTRE À JOUR LA VUE v_expenses_with_details
-- =====================================================

-- Ajouter applied_rule_id à la vue
DROP VIEW IF EXISTS v_expenses_with_details CASCADE;

CREATE OR REPLACE VIEW v_expenses_with_details AS
SELECT
  e.id,
  e.transaction_id,
  e.counterparty_id,
  e.organisation_id,
  e.category,
  e.status,
  e.role_type,
  e.notes,
  e.classified_at,
  e.classified_by,
  e.created_at,
  e.updated_at,
  -- Transaction details
  bt.amount,
  bt.currency,
  bt.label,
  bt.counterparty_name AS transaction_counterparty_name,
  bt.counterparty_iban AS transaction_iban,
  bt.side,
  bt.emitted_at,
  bt.settled_at,
  bt.category_pcg,
  bt.applied_rule_id,  -- SLICE 3: Exposer la règle appliquée
  bt.raw_data,
  -- Counterparty details
  cp.display_name AS counterparty_display_name,
  cp.name_normalized AS counterparty_name_normalized,
  -- Organisation details (if linked)
  org.legal_name AS organisation_name,
  org.type AS organisation_type,
  -- Has attachment?
  (bt.raw_data->'attachments') IS NOT NULL
    AND jsonb_array_length(bt.raw_data->'attachments') > 0 AS has_attachment,
  -- SLICE 3: Info sur la règle si présente
  mr.match_value AS rule_match_value,
  mr.display_label AS rule_display_label
FROM expenses e
JOIN bank_transactions bt ON e.transaction_id = bt.id
LEFT JOIN counterparties cp ON e.counterparty_id = cp.id
LEFT JOIN organisations org ON e.organisation_id = org.id
LEFT JOIN matching_rules mr ON bt.applied_rule_id = mr.id;

-- Grant access to view
GRANT SELECT ON v_expenses_with_details TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
