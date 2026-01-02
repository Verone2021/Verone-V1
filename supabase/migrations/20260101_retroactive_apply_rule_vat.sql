-- =====================================================================
-- Migration: Application rétroactive de la TVA des règles
-- Date: 2026-01-01
-- Description: Pour les transactions qui ont applied_rule_id mais pas
--              de TVA définie, récupère la TVA de la règle et l'applique.
-- =====================================================================

-- Cette migration applique la TVA des règles aux transactions existantes
-- qui n'ont pas encore de TVA définie.

-- NOTE: Cette migration ne fait rien car les règles existantes n'ont pas
-- encore de default_vat_rate défini (NULL par défaut).
-- Elle sera utile après que l'utilisateur ait défini les taux TVA
-- sur les règles existantes.

-- Script pour appliquer rétroactivement la TVA
-- À exécuter manuellement si besoin après avoir défini les taux TVA des règles:

/*
-- Appliquer TVA des règles aux transactions sans TVA
UPDATE bank_transactions bt
SET
  vat_rate = CASE
    WHEN mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0
      THEN (mr.vat_breakdown->0->>'tva_rate')::NUMERIC
    ELSE mr.default_vat_rate
  END,
  amount_ht = CASE
    WHEN mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0
      THEN (SELECT SUM((item->>'amount_ht')::NUMERIC)
            FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), mr.vat_breakdown)) item)
    WHEN mr.default_vat_rate IS NOT NULL
      THEN (SELECT amt.amount_ht FROM calculate_vat_from_ttc(ABS(bt.amount), mr.default_vat_rate) amt)
    ELSE bt.amount_ht
  END,
  amount_vat = CASE
    WHEN mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0
      THEN (SELECT SUM((item->>'tva_amount')::NUMERIC)
            FROM jsonb_array_elements(apply_multi_vat_breakdown(ABS(bt.amount), mr.vat_breakdown)) item)
    WHEN mr.default_vat_rate IS NOT NULL
      THEN (SELECT amt.amount_vat FROM calculate_vat_from_ttc(ABS(bt.amount), mr.default_vat_rate) amt)
    ELSE bt.amount_vat
  END,
  vat_breakdown = CASE
    WHEN mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0
      THEN apply_multi_vat_breakdown(ABS(bt.amount), mr.vat_breakdown)
    WHEN mr.default_vat_rate IS NOT NULL
      THEN build_single_vat_breakdown(ABS(bt.amount), mr.default_vat_rate)
    ELSE bt.vat_breakdown
  END,
  updated_at = NOW()
FROM matching_rules mr
WHERE bt.applied_rule_id = mr.id
  AND bt.vat_rate IS NULL
  AND (mr.default_vat_rate IS NOT NULL OR (mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0));
*/

-- Pour l'instant, on ne modifie rien automatiquement.
-- L'utilisateur devra:
-- 1. Définir les taux TVA sur les règles existantes via RuleModal
-- 2. Les triggers propageront automatiquement aux nouvelles transactions

-- Log
DO $$
DECLARE
  v_rules_with_vat INTEGER;
  v_transactions_to_update INTEGER;
BEGIN
  -- Compter les règles avec TVA définie
  SELECT COUNT(*) INTO v_rules_with_vat
  FROM matching_rules
  WHERE default_vat_rate IS NOT NULL
     OR (vat_breakdown IS NOT NULL AND jsonb_array_length(vat_breakdown) > 0);

  -- Compter les transactions sans TVA qui ont une règle
  SELECT COUNT(*) INTO v_transactions_to_update
  FROM bank_transactions bt
  JOIN matching_rules mr ON bt.applied_rule_id = mr.id
  WHERE bt.vat_rate IS NULL
    AND (mr.default_vat_rate IS NOT NULL OR (mr.vat_breakdown IS NOT NULL AND jsonb_array_length(mr.vat_breakdown) > 0));

  RAISE NOTICE 'Migration TVA rétroactive: % règles avec TVA, % transactions à mettre à jour',
    v_rules_with_vat, v_transactions_to_update;
END $$;

-- Commentaire
COMMENT ON TABLE matching_rules IS
'Règles de classification automatique des dépenses.
Inclut maintenant default_vat_rate et vat_breakdown pour appliquer automatiquement la TVA.';
