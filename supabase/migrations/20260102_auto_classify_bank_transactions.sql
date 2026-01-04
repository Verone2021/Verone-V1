-- =====================================================================
-- Migration: Auto-classification des transactions bancaires
-- Date: 2026-01-02
-- Description: Restaure l'auto-classification supprimée par la migration
--              20251231_expenses_table_to_view_single_source_of_truth.sql
--
-- Contenu:
-- 1. Trigger BEFORE INSERT sur bank_transactions (nouvelles transactions)
-- 2. RPC auto_classify_all_unmatched() (rattrapage transactions existantes)
-- =====================================================================

-- =====================================================
-- PARTIE 1: Trigger BEFORE INSERT
-- =====================================================

CREATE OR REPLACE FUNCTION auto_classify_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_rule RECORD;
BEGIN
  -- Seulement pour les débits (dépenses) et si pas déjà classé
  IF NEW.side = 'debit' AND (NEW.matching_status IS NULL OR NEW.matching_status = 'unmatched') THEN
    -- Parcourir les règles actives par priorité
    FOR v_rule IN
      SELECT id, match_type, match_value, default_category, organisation_id, default_vat_rate
      FROM matching_rules
      WHERE is_active = true AND enabled = true
      ORDER BY priority ASC
    LOOP
      -- Match label_contains (case insensitive)
      IF v_rule.match_type = 'label_contains'
         AND NEW.label ILIKE '%' || v_rule.match_value || '%' THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        -- Note: default_vat_rate sera appliqué via la vue expenses
        RETURN NEW;
      END IF;

      -- Match label_exact (case insensitive)
      IF v_rule.match_type = 'label_exact'
         AND LOWER(NEW.label) = LOWER(v_rule.match_value) THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        RETURN NEW;
      END IF;

      -- Match label_regex
      IF v_rule.match_type = 'label_regex'
         AND NEW.label ~* v_rule.match_value THEN
        NEW.category_pcg := v_rule.default_category;
        NEW.counterparty_organisation_id := v_rule.organisation_id;
        NEW.applied_rule_id := v_rule.id;
        NEW.matching_status := 'auto_matched';
        RETURN NEW;
      END IF;
    END LOOP;

    -- Aucune règle trouvée, marquer comme unmatched
    IF NEW.matching_status IS NULL THEN
      NEW.matching_status := 'unmatched';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_auto_classify_bank_transaction ON bank_transactions;

-- Créer le trigger BEFORE INSERT
CREATE TRIGGER trg_auto_classify_bank_transaction
BEFORE INSERT ON bank_transactions
FOR EACH ROW
EXECUTE FUNCTION auto_classify_bank_transaction();

COMMENT ON FUNCTION auto_classify_bank_transaction() IS
'Applique automatiquement les règles de matching aux nouvelles transactions (BEFORE INSERT).';

-- =====================================================
-- PARTIE 2: RPC pour rattrapage des transactions existantes
-- =====================================================

CREATE OR REPLACE FUNCTION auto_classify_all_unmatched()
RETURNS JSON AS $$
DECLARE
  v_rule RECORD;
  v_updated INTEGER := 0;
  v_total INTEGER := 0;
  v_rule_count INTEGER;
BEGIN
  -- Pour chaque règle active, par ordre de priorité
  FOR v_rule IN
    SELECT id, match_type, match_value, default_category, organisation_id
    FROM matching_rules
    WHERE is_active = true AND enabled = true
    ORDER BY priority ASC
  LOOP
    -- Appliquer la règle aux transactions non matchées
    WITH updated AS (
      UPDATE bank_transactions bt
      SET
        category_pcg = v_rule.default_category,
        counterparty_organisation_id = v_rule.organisation_id,
        applied_rule_id = v_rule.id,
        matching_status = 'auto_matched'
      WHERE (bt.matching_status = 'unmatched' OR bt.matching_status IS NULL)
        AND bt.side = 'debit'
        AND bt.applied_rule_id IS NULL
        AND (
          (v_rule.match_type = 'label_contains' AND bt.label ILIKE '%' || v_rule.match_value || '%')
          OR (v_rule.match_type = 'label_exact' AND LOWER(bt.label) = LOWER(v_rule.match_value))
          OR (v_rule.match_type = 'label_regex' AND bt.label ~* v_rule.match_value)
        )
      RETURNING 1
    )
    SELECT count(*) INTO v_rule_count FROM updated;

    v_total := v_total + v_rule_count;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'classified_count', v_total,
    'message', format('%s transaction(s) classée(s) automatiquement', v_total)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access
GRANT EXECUTE ON FUNCTION auto_classify_all_unmatched() TO authenticated;

COMMENT ON FUNCTION auto_classify_all_unmatched() IS
'Applique toutes les règles de matching aux transactions non classées existantes. Retourne le nombre de transactions classées.';
