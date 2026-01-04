-- Migration: Rules Workflow V2 avec garde-fous béton
-- Date: 2025-12-30
-- Objectif: Refonte complète du système de règles avec preview/confirm obligatoire
--
-- INVARIANTS:
-- 1. Une transaction = une catégorie PCG (unique)
-- 2. Si applied_rule_id est défini, les champs imposés sont verrouillés
-- 3. Aucun apply "large" sans confirmation explicite
-- 4. normalize_label ne peut jamais retourner '' pour un input non-vide valide

-- =====================================================
-- B1. NORMALISATION CORRIGÉE (LOWER en premier!)
-- =====================================================

CREATE OR REPLACE FUNCTION public.normalize_label(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
BEGIN
  -- 1. COALESCE + LOWER en premier (CRITIQUE!)
  result := LOWER(COALESCE(input_text, ''));

  -- 2. Retirer les accents (unaccent-like sans extension)
  result := translate(result,
    'àâäáãåæçèéêëìíîïñòóôõöøùúûüýÿœ',
    'aaaaaaeceeeeiiiinooooooouuuuyyo');

  -- 3. Ponctuation → espaces
  result := regexp_replace(result, '[^a-z0-9 ]', ' ', 'g');

  -- 4. Espaces multiples → 1 espace
  result := regexp_replace(result, '\s+', ' ', 'g');

  -- 5. Trim
  result := trim(result);

  RETURN result;
END;
$$;

-- =====================================================
-- B1-SELFCHECK: Tests de validation normalize_label
-- =====================================================

DO $$
DECLARE
  test_result text;
BEGIN
  -- Test 1: GOCARDLESS ne doit pas être vide
  test_result := normalize_label('GOCARDLESS');
  IF test_result = '' OR test_result IS NULL THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label(GOCARDLESS) returned empty: "%"', test_result;
  END IF;
  IF test_result != 'gocardless' THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label(GOCARDLESS) = "%" (expected "gocardless")', test_result;
  END IF;
  RAISE NOTICE 'SELFCHECK 1 PASSED: normalize_label(GOCARDLESS) = "%"', test_result;

  -- Test 2: URSSAF ne contient pas gocardless
  test_result := normalize_label('URSSAF D''ILE DE FRANCE');
  IF test_result ILIKE '%gocardless%' THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label(URSSAF) contains gocardless: "%"', test_result;
  END IF;
  RAISE NOTICE 'SELFCHECK 2 PASSED: normalize_label(URSSAF) = "%" (no gocardless)', test_result;

  -- Test 3: LIBAN fonctionne
  test_result := normalize_label('Liban');
  IF test_result != 'liban' THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label(Liban) = "%" (expected "liban")', test_result;
  END IF;
  RAISE NOTICE 'SELFCHECK 3 PASSED: normalize_label(Liban) = "%"', test_result;

  -- Test 4: LÍBÂN avec accents = liban
  test_result := normalize_label('LÍBÂN');
  IF test_result != 'liban' THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label(LÍBÂN) = "%" (expected "liban")', test_result;
  END IF;
  RAISE NOTICE 'SELFCHECK 4 PASSED: normalize_label(LÍBÂN) = "%"', test_result;

  -- Test 5: String vide = vide
  test_result := normalize_label('');
  IF test_result != '' THEN
    RAISE EXCEPTION 'SELFCHECK FAILED: normalize_label() = "%" (expected "")', test_result;
  END IF;
  RAISE NOTICE 'SELFCHECK 5 PASSED: normalize_label() = "" (empty)';

  RAISE NOTICE '✅ ALL 5 SELFCHECKS PASSED for normalize_label()';
END;
$$;

-- =====================================================
-- B2. PREVIEW APPLY (OBLIGATOIRE - NE MODIFIE RIEN)
-- =====================================================

-- Type pour le retour de preview
DROP TYPE IF EXISTS preview_match_result CASCADE;
CREATE TYPE preview_match_result AS (
  normalized_label_group TEXT,
  sample_labels TEXT[],
  transaction_count INTEGER,
  total_amount DECIMAL(15,2),
  first_seen DATE,
  last_seen DATE,
  counterparty_hint TEXT,
  confidence TEXT,  -- 'HIGH', 'MEDIUM', 'LOW'
  confidence_score INTEGER,
  reasons TEXT[],
  sample_transaction_ids UUID[]
);

CREATE OR REPLACE FUNCTION preview_apply_matching_rule(p_rule_id UUID)
RETURNS SETOF preview_match_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_match_normalized TEXT;
  v_result preview_match_result;
BEGIN
  -- Récupérer la règle
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  -- Normaliser le match_value
  v_match_normalized := normalize_label(v_rule.match_value);

  -- GARDE-FOU: Si match_value normalisé est vide, erreur
  IF v_match_normalized = '' OR v_match_normalized IS NULL THEN
    RAISE EXCEPTION 'match_value invalide (vide après normalisation): "%"', v_rule.match_value;
  END IF;

  -- Retourner les groupes de transactions qui matchent
  FOR v_result IN
    WITH matching_transactions AS (
      SELECT
        bt.id,
        bt.label,
        normalize_label(bt.label) AS label_normalized,
        bt.counterparty_name,
        normalize_label(bt.counterparty_name) AS counterparty_normalized,
        bt.counterparty_iban,
        bt.amount,
        bt.emitted_at::date AS tx_date,
        -- Calcul du score
        CASE
          -- Match exact label
          WHEN normalize_label(bt.label) = v_match_normalized THEN 100
          -- Label contient le match (début)
          WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' THEN 90
          -- Label contient le match
          WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' THEN 80
          -- Counterparty match exact
          WHEN normalize_label(bt.counterparty_name) = v_match_normalized THEN 85
          -- Counterparty contient
          WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 70
          ELSE 0
        END AS base_score,
        -- Raisons
        ARRAY_REMOVE(ARRAY[
          CASE WHEN normalize_label(bt.label) = v_match_normalized THEN 'label exact' END,
          CASE WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' AND normalize_label(bt.label) != v_match_normalized THEN 'label commence par' END,
          CASE WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' AND normalize_label(bt.label) NOT LIKE v_match_normalized || '%' THEN 'label contient' END,
          CASE WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 'contrepartie similaire' END
        ], NULL) AS match_reasons
      FROM bank_transactions bt
      WHERE bt.side = 'debit'
        AND bt.applied_rule_id IS NULL  -- Pas déjà classé par une règle
        AND (
          normalize_label(bt.label) LIKE '%' || v_match_normalized || '%'
          OR normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%'
        )
    ),
    grouped AS (
      SELECT
        label_normalized,
        array_agg(DISTINCT label ORDER BY label) FILTER (WHERE label IS NOT NULL) AS all_labels,
        COUNT(*) AS tx_count,
        SUM(ABS(amount)) AS total_amt,
        MIN(tx_date) AS first_date,
        MAX(tx_date) AS last_date,
        MODE() WITHIN GROUP (ORDER BY counterparty_name) AS top_counterparty,
        MAX(base_score) AS max_score,
        array_agg(DISTINCT unnest_reason) AS all_reasons,
        array_agg(id ORDER BY tx_date DESC) AS all_ids
      FROM matching_transactions,
           LATERAL unnest(match_reasons) AS unnest_reason
      GROUP BY label_normalized
    )
    SELECT
      g.label_normalized,
      (g.all_labels)[1:3],  -- Top 3 labels
      g.tx_count::INTEGER,
      g.total_amt,
      g.first_date,
      g.last_date,
      g.top_counterparty,
      CASE
        WHEN g.max_score >= 80 THEN 'HIGH'
        WHEN g.max_score >= 60 THEN 'MEDIUM'
        ELSE 'LOW'
      END,
      -- Bonus pour récurrence
      g.max_score + CASE WHEN g.tx_count >= 3 THEN 10 WHEN g.tx_count >= 2 THEN 5 ELSE 0 END,
      g.all_reasons,
      (g.all_ids)[1:5]  -- Top 5 IDs
    FROM grouped g
    ORDER BY
      CASE WHEN g.max_score >= 80 THEN 1 WHEN g.max_score >= 60 THEN 2 ELSE 3 END,
      g.tx_count DESC
  LOOP
    RETURN NEXT v_result;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION preview_apply_matching_rule IS 'Preview des transactions qui matchent une règle. NE MODIFIE RIEN. Retourne groupes avec scoring HIGH/MEDIUM/LOW.';

-- =====================================================
-- B3. CONFIRM APPLY (SEULE PORTE D'ENTRÉE)
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

  -- Appliquer UNIQUEMENT aux transactions dont le label normalisé est dans la sélection
  UPDATE bank_transactions bt
  SET
    applied_rule_id = p_rule_id,
    category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
    counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
    matching_status = 'auto_matched',
    match_reason = 'Règle confirmée: ' || v_rule.match_value,
    updated_at = NOW()
  WHERE bt.side = 'debit'
    AND bt.applied_rule_id IS NULL  -- Pas déjà classé
    AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
  RETURNING bt.id INTO v_updated_ids;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Collecter les IDs mis à jour
  SELECT array_agg(id) INTO v_updated_ids
  FROM bank_transactions
  WHERE applied_rule_id = p_rule_id
    AND updated_at >= NOW() - INTERVAL '1 minute';

  -- Remettre le contexte à false
  PERFORM set_config('app.apply_rule_context', 'false', true);

  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$$;

COMMENT ON FUNCTION apply_matching_rule_confirm IS 'Applique une règle UNIQUEMENT aux labels normalisés sélectionnés. Seule porte d''entrée pour apply.';

-- =====================================================
-- B4. TRIGGER ANTI-CONTOURNEMENT (LOCK SERVEUR)
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
      IF v_rule.default_category IS NOT NULL
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

-- Supprimer le trigger s'il existe
DROP TRIGGER IF EXISTS trg_check_rule_lock ON bank_transactions;

-- Créer le trigger
CREATE TRIGGER trg_check_rule_lock
  BEFORE UPDATE ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_rule_lock();

COMMENT ON FUNCTION check_rule_lock IS 'Trigger qui empêche la modification manuelle des champs verrouillés par une règle active.';

-- =====================================================
-- SUPPRIMER L'ANCIENNE FONCTION apply_matching_rule
-- (elle permettait un apply sans confirmation)
-- =====================================================

DROP FUNCTION IF EXISTS apply_matching_rule(UUID);

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION normalize_label(text) TO authenticated;
GRANT EXECUTE ON FUNCTION preview_apply_matching_rule(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_matching_rule_confirm(UUID, TEXT[]) TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
