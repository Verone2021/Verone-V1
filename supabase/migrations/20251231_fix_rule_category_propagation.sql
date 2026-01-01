-- =====================================================
-- MIGRATION: Propagation automatique de category_pcg
-- Date: 2025-12-31
-- Problème: Quand on modifie default_category d'une règle,
--           les transactions déjà liées ne sont pas mises à jour
-- Solution: Trigger sur matching_rules + correction apply_matching_rule_confirm
-- =====================================================

-- =====================================================
-- 1. TRIGGER: Propager default_category aux transactions existantes
-- =====================================================

CREATE OR REPLACE FUNCTION propagate_rule_category_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si default_category a changé et la nouvelle valeur n'est pas NULL
  IF OLD.default_category IS DISTINCT FROM NEW.default_category
     AND NEW.default_category IS NOT NULL THEN

    -- Mettre à jour toutes les transactions qui ont cette règle appliquée
    -- ET qui n'ont pas déjà une catégorie différente (sauf si allow_multiple_categories = FALSE)
    UPDATE bank_transactions
    SET
      category_pcg = NEW.default_category,
      updated_at = NOW()
    WHERE applied_rule_id = NEW.id
      AND (
        -- Mettre à jour si catégorie NULL
        category_pcg IS NULL
        -- OU si allow_multiple_categories = FALSE (verrouillage)
        OR NEW.allow_multiple_categories = FALSE
      );

    RAISE NOTICE 'Propagated category % to transactions with rule %', NEW.default_category, NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_propagate_rule_category ON matching_rules;

-- Créer le trigger
CREATE TRIGGER trigger_propagate_rule_category
AFTER UPDATE OF default_category ON matching_rules
FOR EACH ROW
EXECUTE FUNCTION propagate_rule_category_to_transactions();

COMMENT ON FUNCTION propagate_rule_category_to_transactions IS
  'Propage automatiquement les changements de default_category aux transactions existantes';

-- =====================================================
-- 2. FIX: apply_matching_rule_confirm doit aussi mettre à jour
--    les transactions déjà liées à CETTE règle
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

  -- Appliquer aux transactions:
  -- 1. Nouvelles (applied_rule_id IS NULL)
  -- 2. OU déjà liées à CETTE règle (pour mettre à jour la catégorie)
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
      AND (
        -- Nouvelles transactions non classées
        bt.applied_rule_id IS NULL
        -- OU transactions déjà liées à CETTE règle (mise à jour catégorie)
        OR bt.applied_rule_id = p_rule_id
      )
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

COMMENT ON FUNCTION apply_matching_rule_confirm IS
  'Applique une règle aux labels sélectionnés. Met aussi à jour les transactions déjà liées.';

-- =====================================================
-- 3. CORRECTION IMMÉDIATE: Mettre à jour les transactions
--    Claude qui ont applied_rule_id mais pas de catégorie
-- =====================================================

UPDATE bank_transactions bt
SET
  category_pcg = mr.default_category,
  updated_at = NOW()
FROM matching_rules mr
WHERE bt.applied_rule_id = mr.id
  AND bt.category_pcg IS NULL
  AND mr.default_category IS NOT NULL;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
