-- =====================================================
-- Migration: Fix margin_rate for affiliate products
-- Date: 2026-01-09
-- Description: Corrige le margin_rate des produits AFFILIES (created_by_affiliate NOT NULL)
--              qui ont incorrectement margin_rate = 15% au lieu de 0%
--
-- REGLE METIER:
-- - Produits CATALOGUE: margin_rate > 0 (affilié GAGNE une marge)
-- - Produits AFFILIES: margin_rate = 0 (Vérone DEDUIT sa commission du prix)
--
-- AUDIT: 29 violations identifiées le 2026-01-09
-- =====================================================

-- 1. AUDIT AVANT CORRECTION
-- Identifier tous les items de sélection avec produits affiliés et margin_rate != 0
DO $$
DECLARE
  violation_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO violation_count
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  WHERE p.created_by_affiliate IS NOT NULL
    AND lsi.margin_rate != 0;

  RAISE NOTICE '=== AUDIT AVANT CORRECTION ===';
  RAISE NOTICE 'Nombre de violations (produits affiliés avec margin_rate != 0): %', violation_count;
END $$;

-- 2. LISTE DETAILLEE DES VIOLATIONS (pour audit)
-- Cette requête affiche les détails mais ne modifie rien
DO $$
DECLARE
  rec RECORD;
BEGIN
  RAISE NOTICE '=== DETAILS DES VIOLATIONS ===';
  FOR rec IN
    SELECT
      lsi.id AS item_id,
      lsi.margin_rate,
      p.name AS product_name,
      p.sku,
      p.created_by_affiliate,
      ls.name AS selection_name
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    JOIN linkme_selections ls ON ls.id = lsi.selection_id
    WHERE p.created_by_affiliate IS NOT NULL
      AND lsi.margin_rate != 0
    ORDER BY ls.name, p.name
  LOOP
    RAISE NOTICE 'Selection: %, Product: % (%), margin_rate: %',
      rec.selection_name, rec.product_name, rec.sku, rec.margin_rate;
  END LOOP;
END $$;

-- 3. CORRECTION
-- Mettre margin_rate = 0 pour tous les produits créés par des affiliés
UPDATE linkme_selection_items lsi
SET
  margin_rate = 0,
  updated_at = NOW()
FROM products p
WHERE p.id = lsi.product_id
  AND p.created_by_affiliate IS NOT NULL
  AND lsi.margin_rate != 0;

-- 4. AUDIT APRES CORRECTION
DO $$
DECLARE
  remaining_violations INTEGER;
  corrected_count INTEGER;
BEGIN
  -- Compter les violations restantes (devrait être 0)
  SELECT COUNT(*) INTO remaining_violations
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  WHERE p.created_by_affiliate IS NOT NULL
    AND lsi.margin_rate != 0;

  -- Compter les items avec margin_rate = 0 pour produits affiliés
  SELECT COUNT(*) INTO corrected_count
  FROM linkme_selection_items lsi
  JOIN products p ON p.id = lsi.product_id
  WHERE p.created_by_affiliate IS NOT NULL
    AND lsi.margin_rate = 0;

  RAISE NOTICE '=== AUDIT APRES CORRECTION ===';
  RAISE NOTICE 'Violations restantes: % (attendu: 0)', remaining_violations;
  RAISE NOTICE 'Items affiliés avec margin_rate = 0: %', corrected_count;

  IF remaining_violations > 0 THEN
    RAISE EXCEPTION 'ERREUR: % violations non corrigées!', remaining_violations;
  END IF;
END $$;

-- =====================================================
-- DOCUMENTATION METIER
--
-- Cette migration applique la règle métier suivante:
--
-- | Type Produit | created_by_affiliate | margin_rate | Calcul Commission |
-- |--------------|---------------------|-------------|-------------------|
-- | CATALOGUE    | NULL                | 1-15%       | prix_base × rate  |
-- | AFFILIÉ      | NOT NULL            | 0%          | via affiliate_commission_rate |
--
-- Pour les produits AFFILIÉS:
-- - Le prix catalogue EST le prix de vente final
-- - Vérone DÉDUIT sa commission (affiliate_commission_rate, ex: 15%)
-- - L'affilié reçoit le reste (payout = prix - commission)
--
-- Exemple Pokawa:
-- - Prix catalogue: 500€
-- - Commission Vérone: 500€ × 15% = 75€
-- - Payout Pokawa: 500€ - 75€ = 425€
-- =====================================================
