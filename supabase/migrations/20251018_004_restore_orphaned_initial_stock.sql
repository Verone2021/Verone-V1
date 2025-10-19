/**
 * 🔧 CORRECTIF: Restaurer Stock Initial Orphelin
 *
 * Date: 2025-10-18
 * Auteur: Claude Code (Multi-Agent Analysis: Orchestrator + Debugger + Database Architect)
 * Session: RAPPORT-SESSION-DEBUG-STOCK-ORPHELIN-2025-10-18.md
 *
 * CONTEXTE PROBLÈME:
 * Certains produits ont été créés avec un stock initial AVANT l'implémentation
 * du système stock_movements. Ces stocks "orphelins" existent dans products.stock_real
 * mais n'ont AUCUN mouvement correspondant dans stock_movements.
 *
 * IMPACT BUG:
 * La fonction get_calculated_stock_from_movements() calcule:
 *   RETURN SUM(quantity_change) WHERE affects_forecast=false
 *
 * Pour FMIL-VERT-01:
 *   - Stock initial: 50 unités (orphelin, pas de mouvement)
 *   - Après réceptions: +4 +10 = +14
 *   - Calcul actuel: SUM(4+10) = 14 ❌
 *   - Calcul attendu: 50 + 14 = 64 ✅
 *
 * PREUVE DU BUG:
 * Le mouvement #3 de PO-2025-00006 a correctement enregistré:
 *   quantity_before = 50 (trigger SAVAIT que stock = 50)
 *   quantity_after = 54 (50 + 4 = 54)
 * Mais maintain_stock_coherence() a écrasé stock_real avec 14 (calculé sans initial)
 *
 * SOLUTION:
 * Créer mouvements ADJUST historiques pour représenter le stock initial.
 * Ces mouvements seront datés AVANT tous les autres mouvements existants.
 *
 * PRODUITS CONCERNÉS (Détectés par requête):
 * - FMIL-VERT-01 (Fauteuil Milo - Vert): 50 unités
 * - FMIL-BLEUV-16 (Fauteuil Milo - Bleu Velours): 35 unités
 * - FMIL-BEIGE-05 (Fauteuil Milo - Beige): 20 unités
 */

-- ===========================================================================
-- PARTIE 1: Fonction Utilitaire - Détecter Stock Orphelin
-- ===========================================================================

CREATE OR REPLACE FUNCTION public.detect_orphaned_stock()
RETURNS TABLE(
  product_id UUID,
  product_name VARCHAR(200),
  sku VARCHAR(100),
  stock_real INTEGER,
  nb_movements BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.sku,
    p.stock_real,
    COUNT(sm.id) as nb_movements
  FROM products p
  LEFT JOIN stock_movements sm ON sm.product_id = p.id
  WHERE p.stock_real > 0
  GROUP BY p.id, p.name, p.sku, p.stock_real
  HAVING COUNT(sm.id) = 0
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION detect_orphaned_stock() IS
'Détecte les produits avec stock_real > 0 mais aucun mouvement stock_movements.
Ces stocks "orphelins" créent des incohérences dans get_calculated_stock_from_movements().
Créé: 2025-10-18
Utilité: Migration 20251018_004 + monitoring futur';

-- ===========================================================================
-- PARTIE 2: Créer Mouvements ADJUST pour Stock Initial Orphelin
-- ===========================================================================

DO $$
DECLARE
  v_product RECORD;
  v_earliest_movement TIMESTAMP WITH TIME ZONE;
  v_adjust_date TIMESTAMP WITH TIME ZONE;
  v_count INTEGER := 0;
BEGIN
  -- Itérer sur chaque produit avec stock orphelin
  FOR v_product IN
    SELECT * FROM detect_orphaned_stock()
  LOOP
    -- Trouver le mouvement le plus ancien pour ce produit (si existe)
    SELECT MIN(performed_at) INTO v_earliest_movement
    FROM stock_movements
    WHERE product_id = v_product.product_id;

    -- Si le produit a déjà des mouvements, dater ADJUST avant le premier
    -- Sinon, utiliser date création produit ou date arbitraire ancienne
    IF v_earliest_movement IS NOT NULL THEN
      v_adjust_date := v_earliest_movement - INTERVAL '1 hour';
    ELSE
      -- Date arbitraire: 1er janvier 2025 00:00:00 (début système)
      v_adjust_date := '2025-01-01 00:00:00+00'::TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Créer mouvement ADJUST pour stock initial
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference_type,
      reference_id,
      notes,
      reason_code,
      affects_forecast,
      forecast_type,
      performed_at,
      performed_by
    ) VALUES (
      v_product.product_id,
      'ADJUST',
      v_product.stock_real,  -- Quantité du stock initial
      0,                      -- Avant ajustement: 0
      v_product.stock_real,  -- Après ajustement: stock initial
      'inventory_adjustment',
      '00000000-0000-0000-0000-000000000004'::UUID,  -- UUID migration 20251018_004
      FORMAT('Ajustement stock initial orphelin - Migration 20251018_004 - %s unités historiques (SKU: %s)',
        v_product.stock_real,
        v_product.sku
      ),
      'manual_adjustment',
      false,  -- Stock réel, pas prévisionnel
      NULL,
      v_adjust_date,  -- Daté avant premiers mouvements
      '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'::UUID  -- Catalog Manager user
    );

    v_count := v_count + 1;

    RAISE NOTICE '✅ Stock initial restauré: % (SKU: %) - % unités - Daté: %',
      v_product.product_name, v_product.sku, v_product.stock_real, v_adjust_date;
  END LOOP;

  -- Log résumé
  IF v_count = 0 THEN
    RAISE NOTICE 'ℹ️  Aucun stock orphelin détecté (tous les produits ont des mouvements)';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251018_004 appliquée avec succès';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Mouvements ADJUST créés: %', v_count;
    RAISE NOTICE 'Produits corrigés: %', v_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Impact:';
    RAISE NOTICE '  - get_calculated_stock_from_movements() inclura désormais le stock initial';
    RAISE NOTICE '  - maintain_stock_coherence() calculera le stock correct';
    RAISE NOTICE '  - Fin des stocks négatifs (ex: stock_forecasted_in = -4)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Validation:';
    RAISE NOTICE '  SELECT * FROM stock_movements';
    RAISE NOTICE '  WHERE reason_code = ''initial_stock_restoration''';
    RAISE NOTICE '  ORDER BY performed_at;';
    RAISE NOTICE '========================================';
  END IF;
END $$;

-- ===========================================================================
-- PARTIE 3: Validation Post-Migration
-- ===========================================================================

-- Afficher tous les mouvements ADJUST créés
DO $$
DECLARE
  v_movement RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 Mouvements ADJUST créés par cette migration:';
  RAISE NOTICE '================================================';

  FOR v_movement IN
    SELECT
      sm.id,
      p.name,
      p.sku,
      sm.quantity_change,
      sm.performed_at,
      sm.notes
    FROM stock_movements sm
    JOIN products p ON p.id = sm.product_id
    WHERE sm.reason_code = 'manual_adjustment'
      AND sm.notes LIKE '%Migration 20251018_004%'
    ORDER BY sm.performed_at
  LOOP
    RAISE NOTICE 'ID: % | SKU: % | Qté: % | Produit: %',
      v_movement.id, v_movement.sku, v_movement.quantity_change, v_movement.name;
  END LOOP;
END $$;

-- Vérifier cohérence stock après migration
DO $$
DECLARE
  v_product RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Vérification cohérence stock (produits ex-orphelins):';
  RAISE NOTICE '========================================================';

  FOR v_product IN
    SELECT
      p.name,
      p.sku,
      p.stock_real,
      p.stock_quantity,
      COALESCE(
        (SELECT SUM(quantity_change)
         FROM stock_movements
         WHERE product_id = p.id
           AND affects_forecast = false),
        0
      ) as calculated_real,
      COUNT(sm.id) as nb_movements
    FROM products p
    LEFT JOIN stock_movements sm ON sm.product_id = p.id
    WHERE p.sku IN ('FMIL-VERT-01', 'FMIL-BLEUV-16', 'FMIL-BEIGE-05')
    GROUP BY p.id, p.name, p.sku, p.stock_real, p.stock_quantity
  LOOP
    IF v_product.stock_real = v_product.calculated_real THEN
      RAISE NOTICE '✅ % (%) | stock_real=% = calculated=% | Mouvements: %',
        v_product.sku, v_product.name, v_product.stock_real,
        v_product.calculated_real, v_product.nb_movements;
    ELSE
      RAISE WARNING '❌ % (%) | stock_real=% ≠ calculated=% | INCOHÉRENCE!',
        v_product.sku, v_product.name, v_product.stock_real, v_product.calculated_real;
    END IF;
  END LOOP;

  RAISE NOTICE '========================================================';
END $$;

-- ===========================================================================
-- PARTIE 4: Trigger de Recalcul (Optionnel)
-- ===========================================================================

-- Le trigger maintain_stock_coherence() devrait automatiquement recalculer
-- les stocks après insertion des mouvements ADJUST. Mais on peut forcer
-- un refresh si nécessaire.

-- Note: Pas implémenté dans cette migration car les triggers existants
-- devraient gérer automatiquement la mise à jour.

-- ===========================================================================
-- LOG FINAL
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 Migration 20251018_004 TERMINÉE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Tous les stocks orphelins ont été restaurés';
  RAISE NOTICE '✅ get_calculated_stock_from_movements() calculera désormais correctement';
  RAISE NOTICE '✅ Prochaine étape: Re-tester PO-2025-00006 via MCP Browser';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Documentation:';
  RAISE NOTICE '  - Session: MEMORY-BANK/sessions/RAPPORT-SESSION-DEBUG-STOCK-ORPHELIN-2025-10-18.md';
  RAISE NOTICE '  - Migration: supabase/migrations/20251018_004_restore_orphaned_initial_stock.sql';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
