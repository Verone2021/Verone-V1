-- Migration: Fonction RPC de resynchronisation stock_real depuis mouvements
-- Date: 2025-11-03
-- Auteur: Claude Code
-- Context: Garantir stock_real = SUM(quantity_change) des mouvements réels
--
-- Problème: Fauteuil Milo Ocre a 58 unités en BDD mais 8 attendues (3 mouvements: -3, +5, +6)
-- Cause: Migration 20251014_004 a copié stock_quantity (valeur legacy) vers stock_real
-- Solution: Recalculer stock_real pour TOUS les produits depuis mouvements réels

BEGIN;

-- =============================================
-- FONCTION : resync_all_product_stocks()
-- Recalcule stock_real pour TOUS les produits actifs
-- Retourne liste des produits corrigés pour audit
-- =============================================

CREATE OR REPLACE FUNCTION resync_all_product_stocks()
RETURNS TABLE(
  product_id uuid,
  sku VARCHAR(100),
  product_name VARCHAR(200),
  old_stock_real integer,
  new_stock_real bigint,
  ecart bigint,
  nb_mouvements_reels bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH recalculated AS (
    SELECT
      p.id,
      p.sku,
      p.name,
      p.stock_real AS old_value,
      COALESCE(
        (SELECT SUM(sm.quantity_change)
         FROM stock_movements sm
         WHERE sm.product_id = p.id
           AND sm.affects_forecast = false),  -- Mouvements réels uniquement
        0
      ) AS new_value,
      (SELECT COUNT(*)
       FROM stock_movements sm
       WHERE sm.product_id = p.id
         AND sm.affects_forecast = false) AS nb_movements
    FROM products p
    WHERE p.archived_at IS NULL
  )
  UPDATE products p
  SET
    stock_real = r.new_value,
    stock_quantity = r.new_value,  -- Maintenir compatibilité legacy
    updated_at = NOW()
  FROM recalculated r
  WHERE p.id = r.id
    AND p.stock_real != r.new_value  -- Uniquement si écart détecté
  RETURNING
    p.id,
    r.sku,
    r.name,
    r.old_value,
    r.new_value,
    (r.new_value - r.old_value),
    r.nb_movements;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER;  -- Exécuter avec permissions owner

-- Commentaire fonction
COMMENT ON FUNCTION resync_all_product_stocks() IS
'Resynchronise stock_real pour tous les produits actifs en recalculant depuis les mouvements réels.
Retourne la liste des produits corrigés avec ancien/nouveau stock et écart.
Idempotente : peut être exécutée sans risque plusieurs fois.
Usage: SELECT * FROM resync_all_product_stocks();';

-- =============================================
-- EXÉCUTION IMMÉDIATE : Correction données
-- =============================================

-- Sauvegarder résultats dans log
DO $$
DECLARE
  v_correction_record RECORD;
  v_total_corrections INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RESYNCHRONISATION stock_real depuis mouvements';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Exécuter resync et logger chaque correction
  FOR v_correction_record IN
    SELECT * FROM resync_all_product_stocks()
  LOOP
    v_total_corrections := v_total_corrections + 1;

    RAISE NOTICE '✅ Produit corrigé: % (%)',
      v_correction_record.product_name,
      v_correction_record.sku;
    RAISE NOTICE '   Stock avant: % unités',
      v_correction_record.old_stock_real;
    RAISE NOTICE '   Stock après: % unités (calculé depuis % mouvements)',
      v_correction_record.new_stock_real,
      v_correction_record.nb_mouvements_reels;
    RAISE NOTICE '   Écart: % unités',
      v_correction_record.ecart;
    RAISE NOTICE '';
  END LOOP;

  IF v_total_corrections = 0 THEN
    RAISE NOTICE '✅ Aucun écart détecté - Tous les produits sont déjà synchronisés';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RESYNCHRONISATION TERMINÉE';
    RAISE NOTICE '   Produits corrigés: %', v_total_corrections;
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- Vérification finale : écarts restants = 0
DO $$
DECLARE
  v_ecarts_restants INTEGER;
BEGIN
  WITH stock_from_movements AS (
    SELECT
      product_id,
      COALESCE(SUM(quantity_change), 0) AS calculated_stock_real
    FROM stock_movements
    WHERE affects_forecast = false
    GROUP BY product_id
  )
  SELECT COUNT(*) INTO v_ecarts_restants
  FROM products p
  LEFT JOIN stock_from_movements sfm ON sfm.product_id = p.id
  WHERE p.archived_at IS NULL
    AND p.stock_real != COALESCE(sfm.calculated_stock_real, 0);

  IF v_ecarts_restants > 0 THEN
    RAISE EXCEPTION '❌ ERREUR: % écarts restants après resynchronisation', v_ecarts_restants;
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ VÉRIFICATION FINALE: 0 écarts restants';
    RAISE NOTICE '   Tous les produits sont maintenant synchronisés';
  END IF;
END $$;

COMMIT;
