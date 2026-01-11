-- =====================================================
-- Migration: Fix linkme_selection_items margin_rate
-- Date: 2026-01-08
-- Description: Corrige le margin_rate du Séparateur Terrasse (produit CATALOGUE)
--              qui avait été migré incorrectement à 0% au lieu de 15%
--
-- IMPORTANT: Ne PAS corriger les produits AFFILIÉS (Poubelle, Meuble TABESTO)
--            car ils doivent rester à 0% (modèle payout inversé)
-- =====================================================

-- Audit avant correction
DO $$
DECLARE
  current_rate NUMERIC;
BEGIN
  SELECT margin_rate INTO current_rate
  FROM linkme_selection_items
  WHERE id = '41d7c2cc-a203-4760-8236-934080d4dfd3';

  RAISE NOTICE 'Séparateur Terrasse margin_rate avant: %', current_rate;
END $$;

-- Correction: UNIQUEMENT le Séparateur Terrasse (produit CATALOGUE)
-- - 41d7c2cc-a203-4760-8236-934080d4dfd3 (Séparateur Terrasse) → 15%
--
-- NE PAS TOUCHER (produits AFFILIÉS, doivent rester à 0%):
-- - c17e5b1f-8542-4636-a086-1e2023ae11a5 (Poubelle à POKAWA)
-- - 7ccef8c6-c37a-414b-9f54-d308f3df7d44 (Meuble TABESTO à POKAWA)

UPDATE linkme_selection_items
SET
  margin_rate = 15,
  updated_at = NOW()
WHERE id = '41d7c2cc-a203-4760-8236-934080d4dfd3'
AND margin_rate = 0;

-- Vérification après correction
DO $$
DECLARE
  new_rate NUMERIC;
BEGIN
  SELECT margin_rate INTO new_rate
  FROM linkme_selection_items
  WHERE id = '41d7c2cc-a203-4760-8236-934080d4dfd3';

  RAISE NOTICE 'Séparateur Terrasse margin_rate après: %', new_rate;
END $$;

-- =====================================================
-- LOGIQUE MÉTIER (Documentation)
--
-- Type de produit     | margin_rate | Raison
-- --------------------|-------------|--------------------------------
-- CATALOGUE           | 1-15%       | Affilié gagne une marge
-- AFFILIÉ             | 0%          | Modèle payout (affiliate_payout_ht)
-- CLIENT (sur mesure) | 0%          | Produit exclusif, pas de marge
--
-- Comment identifier le type:
-- - CATALOGUE: created_by_affiliate IS NULL
--              AND enseigne_id IS NULL
--              AND assigned_client_id IS NULL
-- - AFFILIÉ: created_by_affiliate IS NOT NULL
-- - CLIENT: enseigne_id IS NOT NULL OR assigned_client_id IS NOT NULL
-- =====================================================
