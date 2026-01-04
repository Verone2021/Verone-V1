-- Migration: Fix v_matching_rules_with_org + RPC apply_rule_to_existing_transactions
-- Date: 2025-12-30
-- Description:
--   1. Corrige le compteur matched_expenses_count (utilise label normalisé, pas counterparty_name)
--   2. Ajoute RPC robuste pour appliquer une règle à l'historique
-- SLICE 1 - Refactor Compta

-- =====================================================
-- 1. FONCTION DE NORMALISATION (si pas existante)
-- =====================================================

CREATE OR REPLACE FUNCTION normalize_label(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRIM(COALESCE(input_text, '')),
        '\s+', ' ', 'g'  -- Normalise espaces multiples
      ),
      '[^a-z0-9àâäéèêëïîôùûüÿçœæ ]', '', 'g'  -- Retire caractères spéciaux
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- 2. RECRÉER LA VUE AVEC COMPTEUR CORRIGÉ
-- =====================================================

DROP VIEW IF EXISTS v_matching_rules_with_org CASCADE;

CREATE OR REPLACE VIEW v_matching_rules_with_org AS
SELECT
  mr.id,
  mr.priority,
  mr.enabled,
  mr.match_type,
  mr.match_value,
  mr.display_label,
  mr.organisation_id,
  mr.individual_customer_id,
  mr.counterparty_type,
  mr.default_category,
  mr.default_role_type,
  mr.created_at,
  mr.created_by,
  o.legal_name AS organisation_name,
  o.type AS organisation_type,
  -- Compteur corrigé: compte les transactions matchées par cette règle
  -- Utilise le champ `label` (ou counterparty_name) avec normalisation
  (SELECT COUNT(*) FROM bank_transactions bt
   WHERE bt.side = 'debit'  -- Dépenses uniquement
     AND mr.enabled = true
     AND (
       -- label_contains: match sur label OU counterparty_name normalisé
       (mr.match_type = 'label_contains' AND (
         normalize_label(bt.label) ILIKE '%' || normalize_label(mr.match_value) || '%'
         OR normalize_label(bt.counterparty_name) ILIKE '%' || normalize_label(mr.match_value) || '%'
       ))
       -- label_exact: match exact normalisé
       OR (mr.match_type = 'label_exact' AND (
         normalize_label(bt.label) = normalize_label(mr.match_value)
         OR normalize_label(bt.counterparty_name) = normalize_label(mr.match_value)
       ))
       -- iban: match exact sur IBAN
       OR (mr.match_type = 'iban' AND bt.counterparty_iban = mr.match_value)
     )
  ) AS matched_expenses_count
FROM matching_rules mr
LEFT JOIN organisations o ON mr.organisation_id = o.id
ORDER BY mr.priority ASC, mr.created_at DESC;

-- Grant permissions
GRANT SELECT ON v_matching_rules_with_org TO authenticated;
GRANT SELECT ON v_matching_rules_with_org TO service_role;

-- =====================================================
-- 3. RPC: APPLIQUER UNE RÈGLE À L'HISTORIQUE (ROBUSTE)
-- =====================================================

-- Supprimer l'ancienne fonction si elle existe (signature différente)
DROP FUNCTION IF EXISTS apply_matching_rule(UUID);
DROP FUNCTION IF EXISTS apply_rule_to_existing_transactions(UUID);

-- Créer la nouvelle fonction (compatible avec le hook existant)
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
  IF v_rule.default_category IS NOT NULL THEN
    UPDATE bank_transactions
    SET
      category_pcg = v_rule.default_category,
      matching_status = 'auto_matched',
      match_reason = 'Règle: ' || v_rule.match_value,
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, counterparty_organisation_id),
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION apply_matching_rule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_matching_rule(UUID) TO service_role;

-- =====================================================
-- 4. SYNC TRIGGER: bank_transaction → expense
-- =====================================================
-- Quand category_pcg est mis à jour sur bank_transactions,
-- synchroniser vers expenses.category

CREATE OR REPLACE FUNCTION sync_bank_transaction_to_expense()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne rien faire si pas de changement de catégorie
  IF OLD.category_pcg IS NOT DISTINCT FROM NEW.category_pcg
     AND OLD.counterparty_organisation_id IS NOT DISTINCT FROM NEW.counterparty_organisation_id THEN
    RETURN NEW;
  END IF;

  -- Mettre à jour l'expense correspondante
  UPDATE expenses
  SET
    category = NEW.category_pcg,
    organisation_id = COALESCE(NEW.counterparty_organisation_id, organisation_id),
    status = CASE
      WHEN NEW.category_pcg IS NOT NULL THEN 'classified'
      ELSE status
    END,
    classified_at = CASE
      WHEN NEW.category_pcg IS NOT NULL AND OLD.category_pcg IS NULL THEN NOW()
      ELSE classified_at
    END,
    updated_at = NOW()
  WHERE transaction_id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trg_sync_bank_transaction_to_expense ON bank_transactions;
CREATE TRIGGER trg_sync_bank_transaction_to_expense
  AFTER UPDATE OF category_pcg, counterparty_organisation_id ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_bank_transaction_to_expense();

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
