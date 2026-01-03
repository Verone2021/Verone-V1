-- =====================================================================
-- Migration: Propager TVA lors de l'application des règles
-- Date: 2026-01-01
-- Description: Modifie apply_matching_rule_confirm pour propager
--              default_vat_rate et vat_breakdown aux transactions.
--              Ajoute aussi un trigger pour propager les changements.
-- =====================================================================

-- =====================================================================
-- 1. Fonction helper: Calculer TVA à partir du TTC et taux
-- =====================================================================

CREATE OR REPLACE FUNCTION calculate_vat_from_ttc(
  p_amount_ttc NUMERIC,
  p_vat_rate NUMERIC
)
RETURNS TABLE (
  amount_ht NUMERIC,
  amount_vat NUMERIC
)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p_vat_rate IS NULL OR p_vat_rate = 0 THEN
    RETURN QUERY SELECT p_amount_ttc, 0::NUMERIC;
  ELSE
    RETURN QUERY SELECT
      ROUND(p_amount_ttc / (1 + p_vat_rate / 100), 2) AS amount_ht,
      ROUND(p_amount_ttc - (p_amount_ttc / (1 + p_vat_rate / 100)), 2) AS amount_vat;
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_vat_from_ttc IS
'Calcule montant HT et TVA à partir du TTC et du taux TVA.';

-- =====================================================================
-- 2. Fonction helper: Construire vat_breakdown à partir d'un taux unique
-- =====================================================================

CREATE OR REPLACE FUNCTION build_single_vat_breakdown(
  p_amount_ttc NUMERIC,
  p_vat_rate NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_ht NUMERIC;
  v_vat NUMERIC;
BEGIN
  IF p_vat_rate IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_ht, v_vat FROM calculate_vat_from_ttc(p_amount_ttc, p_vat_rate);

  RETURN jsonb_build_array(
    jsonb_build_object(
      'tva_rate', p_vat_rate,
      'amount_ht', v_ht,
      'tva_amount', v_vat,
      'description', 'TVA ' || p_vat_rate || '%'
    )
  );
END;
$$;

COMMENT ON FUNCTION build_single_vat_breakdown IS
'Construit un vat_breakdown JSONB à partir d''un taux unique.';

-- =====================================================================
-- 3. Fonction helper: Appliquer vat_breakdown multi-taux
-- =====================================================================

CREATE OR REPLACE FUNCTION apply_multi_vat_breakdown(
  p_amount_ttc NUMERIC,
  p_rule_breakdown JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_item JSONB;
  v_result JSONB := '[]'::JSONB;
  v_percent NUMERIC;
  v_tva_rate NUMERIC;
  v_line_ttc NUMERIC;
  v_line_ht NUMERIC;
  v_line_vat NUMERIC;
BEGIN
  IF p_rule_breakdown IS NULL OR jsonb_array_length(p_rule_breakdown) = 0 THEN
    RETURN NULL;
  END IF;

  -- Parcourir chaque ligne du breakdown
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_rule_breakdown)
  LOOP
    v_percent := COALESCE((v_item->>'percent')::NUMERIC, 100);
    v_tva_rate := COALESCE((v_item->>'tva_rate')::NUMERIC, 20);

    -- Calculer le montant TTC pour cette ligne
    v_line_ttc := ROUND(p_amount_ttc * v_percent / 100, 2);

    -- Calculer HT et TVA
    SELECT * INTO v_line_ht, v_line_vat
    FROM calculate_vat_from_ttc(v_line_ttc, v_tva_rate);

    -- Ajouter au résultat
    v_result := v_result || jsonb_build_array(
      jsonb_build_object(
        'tva_rate', v_tva_rate,
        'percent', v_percent,
        'amount_ht', v_line_ht,
        'tva_amount', v_line_vat,
        'description', 'TVA ' || v_tva_rate || '% (' || v_percent || '%)'
      )
    );
  END LOOP;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION apply_multi_vat_breakdown IS
'Applique un vat_breakdown multi-taux et calcule les montants pour chaque ligne.';

-- =====================================================================
-- 4. Mise à jour de apply_matching_rule_confirm
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
  -- Récupérer la règle (incluant les nouvelles colonnes TVA)
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

  -- Appliquer aux transactions avec TVA
  WITH updated AS (
    UPDATE bank_transactions bt
    SET
      applied_rule_id = p_rule_id,
      category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
      matching_status = 'auto_matched',
      match_reason = 'Règle confirmée: ' || v_rule.match_value,
      -- NOUVEAU: Propagation TVA
      vat_rate = CASE
        -- Si multi-taux, on prend le premier taux comme référence
        WHEN v_rule.vat_breakdown IS NOT NULL AND jsonb_array_length(v_rule.vat_breakdown) > 0
          THEN (v_rule.vat_breakdown->0->>'tva_rate')::NUMERIC
        -- Sinon on utilise le taux unique
        WHEN v_rule.default_vat_rate IS NOT NULL
          THEN v_rule.default_vat_rate
        ELSE bt.vat_rate
      END,
      amount_ht = CASE
        WHEN v_rule.vat_breakdown IS NOT NULL AND jsonb_array_length(v_rule.vat_breakdown) > 0
          THEN (SELECT SUM((item->>'amount_ht')::NUMERIC)
                FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), v_rule.vat_breakdown)) item)
        WHEN v_rule.default_vat_rate IS NOT NULL
          THEN (SELECT amt.amount_ht FROM calculate_vat_from_ttc(ABS(bt.amount), v_rule.default_vat_rate) amt)
        ELSE bt.amount_ht
      END,
      amount_vat = CASE
        WHEN v_rule.vat_breakdown IS NOT NULL AND jsonb_array_length(v_rule.vat_breakdown) > 0
          THEN (SELECT SUM((item->>'tva_amount')::NUMERIC)
                FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), v_rule.vat_breakdown)) item)
        WHEN v_rule.default_vat_rate IS NOT NULL
          THEN (SELECT amt.amount_vat FROM calculate_vat_from_ttc(ABS(bt.amount), v_rule.default_vat_rate) amt)
        ELSE bt.amount_vat
      END,
      vat_breakdown = CASE
        WHEN v_rule.vat_breakdown IS NOT NULL AND jsonb_array_length(v_rule.vat_breakdown) > 0
          THEN apply_multi_vat_breakdown(ABS(bt.amount), v_rule.vat_breakdown)
        WHEN v_rule.default_vat_rate IS NOT NULL
          THEN build_single_vat_breakdown(ABS(bt.amount), v_rule.default_vat_rate)
        ELSE bt.vat_breakdown
      END,
      updated_at = NOW()
    WHERE bt.side = 'debit'
      AND (
        -- Nouvelles transactions non classées
        bt.applied_rule_id IS NULL
        -- OU transactions déjà liées à CETTE règle (mise à jour catégorie/TVA)
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
'Applique une règle aux labels sélectionnés. Propage catégorie, organisation ET TVA.';

-- =====================================================================
-- 5. Trigger: Propager changements de TVA aux transactions existantes
-- =====================================================================

CREATE OR REPLACE FUNCTION propagate_rule_vat_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  -- Si default_vat_rate ou vat_breakdown a changé
  IF OLD.default_vat_rate IS DISTINCT FROM NEW.default_vat_rate
     OR OLD.vat_breakdown IS DISTINCT FROM NEW.vat_breakdown THEN

    -- Mettre à jour toutes les transactions liées à cette règle
    UPDATE bank_transactions bt
    SET
      vat_rate = CASE
        WHEN NEW.vat_breakdown IS NOT NULL AND jsonb_array_length(NEW.vat_breakdown) > 0
          THEN (NEW.vat_breakdown->0->>'tva_rate')::NUMERIC
        ELSE NEW.default_vat_rate
      END,
      amount_ht = CASE
        WHEN NEW.vat_breakdown IS NOT NULL AND jsonb_array_length(NEW.vat_breakdown) > 0
          THEN (SELECT SUM((item->>'amount_ht')::NUMERIC)
                FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), NEW.vat_breakdown)) item)
        WHEN NEW.default_vat_rate IS NOT NULL
          THEN (SELECT amt.amount_ht FROM calculate_vat_from_ttc(ABS(bt.amount), NEW.default_vat_rate) amt)
        ELSE bt.amount_ht
      END,
      amount_vat = CASE
        WHEN NEW.vat_breakdown IS NOT NULL AND jsonb_array_length(NEW.vat_breakdown) > 0
          THEN (SELECT SUM((item->>'tva_amount')::NUMERIC)
                FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), NEW.vat_breakdown)) item)
        WHEN NEW.default_vat_rate IS NOT NULL
          THEN (SELECT amt.amount_vat FROM calculate_vat_from_ttc(ABS(bt.amount), NEW.default_vat_rate) amt)
        ELSE bt.amount_vat
      END,
      vat_breakdown = CASE
        WHEN NEW.vat_breakdown IS NOT NULL AND jsonb_array_length(NEW.vat_breakdown) > 0
          THEN apply_multi_vat_breakdown(ABS(bt.amount), NEW.vat_breakdown)
        WHEN NEW.default_vat_rate IS NOT NULL
          THEN build_single_vat_breakdown(ABS(bt.amount), NEW.default_vat_rate)
        ELSE bt.vat_breakdown
      END,
      updated_at = NOW()
    WHERE bt.applied_rule_id = NEW.id;

    RAISE NOTICE 'Propagated VAT rate % to transactions with rule %',
      COALESCE(NEW.default_vat_rate::TEXT, 'multi-taux'), NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_propagate_rule_vat ON matching_rules;

-- Créer le trigger
CREATE TRIGGER trigger_propagate_rule_vat
AFTER UPDATE OF default_vat_rate, vat_breakdown ON matching_rules
FOR EACH ROW
EXECUTE FUNCTION propagate_rule_vat_to_transactions();

COMMENT ON FUNCTION propagate_rule_vat_to_transactions IS
'Propage automatiquement les changements de TVA aux transactions existantes.';

-- Grant pour les fonctions helper
GRANT EXECUTE ON FUNCTION calculate_vat_from_ttc TO authenticated;
GRANT EXECUTE ON FUNCTION build_single_vat_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION apply_multi_vat_breakdown TO authenticated;
