-- =====================================================
-- MIGRATION: allow_multiple_categories pour règles
-- Date: 2025-12-31
-- Description: Permet de définir par règle si la catégorie
--              est modifiable individuellement ou verrouillée
-- =====================================================

-- =====================================================
-- 1. AJOUTER LA COLONNE
-- =====================================================

ALTER TABLE matching_rules
ADD COLUMN IF NOT EXISTS allow_multiple_categories BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN matching_rules.allow_multiple_categories IS
  'Si TRUE, les transactions peuvent avoir des catégories différentes de la règle. Si FALSE (défaut), la catégorie est verrouillée.';

-- =====================================================
-- 2. METTRE QONTO EN MODE SOUPLE
-- =====================================================

UPDATE matching_rules
SET allow_multiple_categories = true
WHERE LOWER(match_value) LIKE '%qonto%';

-- =====================================================
-- 3. MODIFIER LE TRIGGER check_rule_lock
-- =====================================================

CREATE OR REPLACE FUNCTION check_rule_lock()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
  v_is_apply_context BOOLEAN;
BEGIN
  -- Vérifier si on est dans le contexte d'application de règle
  v_is_apply_context := COALESCE(current_setting('app.apply_rule_context', true), 'false') = 'true';

  -- Si c'est un contexte d'application de règle, autoriser
  IF v_is_apply_context THEN
    RETURN NEW;
  END IF;

  -- Si la transaction a un applied_rule_id
  IF OLD.applied_rule_id IS NOT NULL THEN
    -- Récupérer la règle
    SELECT * INTO v_rule FROM matching_rules WHERE id = OLD.applied_rule_id AND enabled = true;

    IF FOUND THEN
      -- Si la règle impose category_pcg et qu'on essaie de le changer
      -- NOUVEAU: Vérifier allow_multiple_categories
      IF v_rule.default_category IS NOT NULL
         AND v_rule.allow_multiple_categories = FALSE  -- ← NOUVELLE CONDITION
         AND NEW.category_pcg IS DISTINCT FROM OLD.category_pcg THEN
        RAISE EXCEPTION 'category_pcg verrouillé par règle "%" (id: %). Modifiez la règle pour changer la catégorie.',
          v_rule.match_value, v_rule.id;
      END IF;

      -- Si la règle impose organisation_id et qu'on essaie de le changer
      IF v_rule.organisation_id IS NOT NULL
         AND NEW.counterparty_organisation_id IS DISTINCT FROM OLD.counterparty_organisation_id THEN
        RAISE EXCEPTION 'organisation verrouillée par règle "%" (id: %). Modifiez la règle pour changer l''organisation.',
          v_rule.match_value, v_rule.id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_rule_lock IS 'Trigger qui empêche la modification manuelle des champs verrouillés par une règle active, sauf si allow_multiple_categories=TRUE.';

-- =====================================================
-- 4. RECRÉER LA VUE v_matching_rules_with_org
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
  mr.allow_multiple_categories,  -- ← NOUVEAU
  mr.created_at,
  mr.created_by,
  o.legal_name AS organisation_name,
  o.type AS organisation_type,
  -- Compter combien de dépenses cette règle a classées
  (SELECT COUNT(*) FROM bank_transactions bt
   WHERE bt.applied_rule_id = mr.id
  ) AS matched_expenses_count
FROM matching_rules mr
LEFT JOIN organisations o ON mr.organisation_id = o.id
ORDER BY mr.priority ASC, mr.created_at DESC;

-- =====================================================
-- 5. GRANTS
-- =====================================================

GRANT SELECT ON v_matching_rules_with_org TO authenticated;
GRANT SELECT ON v_matching_rules_with_org TO service_role;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
