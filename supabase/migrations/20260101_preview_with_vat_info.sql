-- =====================================================================
-- Migration: Ajouter info TVA dans la prévisualisation des règles
-- Date: 2026-01-01
-- Description: Modifie preview_apply_matching_rule pour afficher
--              l'état TVA des transactions dans le champ 'reasons'
-- =====================================================================

-- Recréer la fonction preview avec info TVA
-- L'info TVA est ajoutée dans le champ 'reasons' existant
CREATE OR REPLACE FUNCTION preview_apply_matching_rule(
  p_rule_id UUID,
  p_new_category TEXT DEFAULT NULL,
  p_new_vat_rate NUMERIC DEFAULT NULL -- NOUVEAU: TVA à prévisualiser
)
RETURNS SETOF preview_match_result
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule RECORD;
  v_match_normalized TEXT;
  v_effective_category TEXT;
  v_effective_vat_rate NUMERIC;
  v_result preview_match_result;
BEGIN
  SELECT * INTO v_rule FROM matching_rules WHERE id = p_rule_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  v_effective_category := COALESCE(p_new_category, v_rule.default_category);
  -- Utiliser la TVA passée en paramètre, sinon celle de la règle
  v_effective_vat_rate := COALESCE(p_new_vat_rate, v_rule.default_vat_rate);

  v_match_normalized := normalize_label(v_rule.match_value);
  IF v_match_normalized = '' OR v_match_normalized IS NULL THEN
    RAISE EXCEPTION 'match_value invalide: %', v_rule.match_value;
  END IF;

  FOR v_result IN
    WITH matching_transactions AS (
      SELECT
        bt.id,
        bt.label,
        normalize_label(bt.label) AS label_normalized,
        bt.counterparty_name,
        bt.amount,
        bt.emitted_at::date AS tx_date,
        bt.applied_rule_id,
        bt.category_pcg,
        bt.vat_rate, -- TVA actuelle de la transaction
        CASE
          WHEN normalize_label(bt.label) = v_match_normalized THEN 100
          WHEN normalize_label(bt.label) LIKE v_match_normalized || '%' THEN 90
          WHEN normalize_label(bt.label) LIKE '%' || v_match_normalized || '%' THEN 80
          WHEN normalize_label(bt.counterparty_name) = v_match_normalized THEN 85
          WHEN normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%' THEN 70
          ELSE 0
        END AS base_score,
        CASE WHEN bt.applied_rule_id = p_rule_id THEN TRUE ELSE FALSE END AS is_already_applied,
        CASE WHEN bt.category_pcg = v_effective_category THEN TRUE ELSE FALSE END AS has_correct_category,
        -- Vérifier si TVA correcte
        CASE
          WHEN v_effective_vat_rate IS NULL THEN TRUE -- Pas de TVA à appliquer
          WHEN bt.vat_rate = v_effective_vat_rate THEN TRUE
          ELSE FALSE
        END AS has_correct_vat,
        -- TVA manquante?
        CASE WHEN bt.vat_rate IS NULL THEN TRUE ELSE FALSE END AS vat_is_missing
      FROM bank_transactions bt
      WHERE bt.side = 'debit'
        AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
        AND (
          normalize_label(bt.label) LIKE '%' || v_match_normalized || '%'
          OR normalize_label(bt.counterparty_name) LIKE '%' || v_match_normalized || '%'
        )
    ),
    grouped AS (
      SELECT
        label_normalized,
        array_agg(DISTINCT label ORDER BY label) FILTER (WHERE label IS NOT NULL) AS all_labels,
        COUNT(DISTINCT id)::INTEGER AS tx_count,
        SUM(ABS(amount)) AS total_amt,
        MIN(tx_date) AS first_date,
        MAX(tx_date) AS last_date,
        MODE() WITHIN GROUP (ORDER BY counterparty_name) AS top_counterparty,
        MAX(base_score) AS max_score,
        array_agg(DISTINCT id ORDER BY id) AS all_ids,
        -- Déjà appliqué avec catégorie ET TVA corrects
        COUNT(DISTINCT id) FILTER (WHERE is_already_applied AND has_correct_category AND has_correct_vat)::INTEGER AS fully_applied,
        -- Déjà appliqué mais besoin de mise à jour (catégorie OU TVA incorrecte)
        COUNT(DISTINCT id) FILTER (WHERE is_already_applied AND (NOT has_correct_category OR NOT has_correct_vat))::INTEGER AS needs_update,
        -- Pas encore appliqué
        COUNT(DISTINCT id) FILTER (WHERE NOT is_already_applied)::INTEGER AS not_applied,
        -- TVA manquante (pour info)
        COUNT(DISTINCT id) FILTER (WHERE vat_is_missing)::INTEGER AS vat_missing_count,
        -- TVA incorrecte (différente de celle attendue)
        COUNT(DISTINCT id) FILTER (WHERE NOT has_correct_vat AND NOT vat_is_missing)::INTEGER AS vat_wrong_count
      FROM matching_transactions
      GROUP BY label_normalized
    )
    SELECT
      g.label_normalized,
      (g.all_labels)[1:3],
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
      g.max_score + CASE WHEN g.tx_count >= 3 THEN 10 WHEN g.tx_count >= 2 THEN 5 ELSE 0 END,
      -- Reasons: inclure info TVA
      ARRAY_REMOVE(ARRAY[
        CASE WHEN g.fully_applied > 0 THEN '✓ déjà OK (' || g.fully_applied || ')' END,
        CASE WHEN g.needs_update > 0 THEN '↻ à mettre à jour (' || g.needs_update || ')' END,
        CASE WHEN g.not_applied > 0 THEN '+ à appliquer (' || g.not_applied || ')' END,
        -- Info TVA
        CASE WHEN g.vat_missing_count > 0 AND v_effective_vat_rate IS NOT NULL
             THEN '⚠ TVA manquante (' || g.vat_missing_count || ' → ' || v_effective_vat_rate || '%)' END,
        CASE WHEN g.vat_wrong_count > 0 AND v_effective_vat_rate IS NOT NULL
             THEN '↻ TVA à corriger (' || g.vat_wrong_count || ' → ' || v_effective_vat_rate || '%)' END
      ], NULL),
      (g.all_ids)[1:5],
      g.fully_applied::INTEGER,
      (g.needs_update + g.not_applied)::INTEGER
    FROM grouped g
    ORDER BY
      CASE WHEN g.not_applied + g.needs_update > 0 THEN 0 ELSE 1 END,
      CASE WHEN g.max_score >= 80 THEN 1 WHEN g.max_score >= 60 THEN 2 ELSE 3 END,
      g.tx_count DESC
  LOOP
    RETURN NEXT v_result;
  END LOOP;

  RETURN;
END;
$$;

COMMENT ON FUNCTION preview_apply_matching_rule IS
'Prévisualise l''application d''une règle. Inclut maintenant info TVA dans reasons.
Paramètres:
- p_rule_id: ID de la règle
- p_new_category: Nouvelle catégorie (optionnel)
- p_new_vat_rate: Nouveau taux TVA (optionnel, pour voir combien seront mis à jour)

Le champ reasons inclut maintenant:
- TVA manquante (X → Y%): transactions sans TVA qui recevront le taux Y%
- TVA à corriger (X → Y%): transactions avec mauvais taux qui seront corrigées';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Preview avec info TVA: migration appliquée';
END $$;
