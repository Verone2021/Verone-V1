-- ============================================================================
-- Migration: Fix Purchase Order Status - Fully Received
-- Date: 2025-10-19
-- Bug: PO-2025-00004 has status 'partially_received' but 100% received (2/2)
-- ============================================================================
-- PROBLÈME:
--   Certaines POs ont status='partially_received' alors que 100% des quantités
--   ont été reçues (quantity_received = quantity pour tous les items).
--   Cela crée des incohérences dans les filtres, rapports et dashboards.
--
-- CAUSE PROBABLE:
--   - Réceptions faites avant que l'API /api/purchase-receptions/validate existe
--   - Workflow manuel/ancien qui ne mettait pas à jour le statut automatiquement
--   - Données historiques migrées d'un ancien système
--
-- SOLUTION:
--   Créer une requête UPDATE qui:
--   1. Identifie toutes les POs avec status IN ('confirmed', 'partially_received')
--   2. Vérifie si TOUS les items sont 100% reçus (quantity_received >= quantity)
--   3. Met à jour status='received' si condition remplie
--
-- IMPACT:
--   - PO-2025-00004 passera de 'partially_received' à 'received' ✅
--   - Toute autre PO dans le même cas sera corrigée automatiquement
--   - Dashboard et filtres afficheront les bonnes données
-- ============================================================================

DO $$
DECLARE
  v_po RECORD;
  v_all_items_received BOOLEAN;
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 Migration 20251019_005: Fix PO Status';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Parcourir toutes les POs avec status 'confirmed' ou 'partially_received'
  FOR v_po IN
    SELECT
      po.id,
      po.po_number,
      po.status
    FROM purchase_orders po
    WHERE po.status IN ('confirmed', 'partially_received')
  LOOP
    -- Vérifier si TOUS les items de cette PO sont 100% reçus
    SELECT
      BOOL_AND(COALESCE(poi.quantity_received, 0) >= poi.quantity)
    INTO v_all_items_received
    FROM purchase_order_items poi
    WHERE poi.purchase_order_id = v_po.id;

    -- Si tous items reçus, mettre status='received'
    IF v_all_items_received THEN
      UPDATE purchase_orders
      SET status = 'received'
      WHERE id = v_po.id;

      v_updated_count := v_updated_count + 1;

      RAISE NOTICE '✅ PO % : % → received (100%% reçu)',
        v_po.po_number, v_po.status;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 Résultat Migration';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  - POs corrigées: %', v_updated_count;

  IF v_updated_count > 0 THEN
    RAISE NOTICE '  - Statut mis à jour: partially_received → received ✅';
  ELSE
    RAISE NOTICE '  - Aucune correction nécessaire ✅';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VALIDATION POST-MIGRATION
-- ============================================================================

DO $$
DECLARE
  v_validation RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 VALIDATION Migration 20251019_005';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- Vérifier PO-2025-00004 spécifiquement
  SELECT
    po.po_number,
    po.status,
    COUNT(poi.id) as total_items,
    SUM(poi.quantity) as total_ordered,
    SUM(COALESCE(poi.quantity_received, 0)) as total_received
  INTO v_validation
  FROM purchase_orders po
  LEFT JOIN purchase_order_items poi ON poi.purchase_order_id = po.id
  WHERE po.po_number = 'PO-2025-00004'
  GROUP BY po.id, po.po_number, po.status;

  IF v_validation.po_number IS NOT NULL THEN
    RAISE NOTICE '📦 PO-2025-00004:';
    RAISE NOTICE '  - Status: %', v_validation.status;
    RAISE NOTICE '  - Items: %', v_validation.total_items;
    RAISE NOTICE '  - Commandé: %', v_validation.total_ordered;
    RAISE NOTICE '  - Reçu: %', v_validation.total_received;

    IF v_validation.status = 'received' AND
       v_validation.total_received = v_validation.total_ordered THEN
      RAISE NOTICE '  - ✅ VALIDATION OK: Status correct (received)';
    ELSE
      RAISE WARNING '  - ⚠️ ATTENTION: Status ou quantités incohérents';
    END IF;
  ELSE
    RAISE NOTICE '  - PO-2025-00004 non trouvée';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- RECOMMANDATIONS POST-MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📚 Recommandations';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration appliquée avec succès';
  RAISE NOTICE '';
  RAISE NOTICE '📌 Vérifications à faire:';
  RAISE NOTICE '  1. Tester dashboard /stocks/receptions';
  RAISE NOTICE '  2. Vérifier filtres "Partiellement reçu" (doit exclure PO-2025-00004)';
  RAISE NOTICE '  3. Vérifier métriques KPIs (should reflect correct counts)';
  RAISE NOTICE '';
  RAISE NOTICE '📌 À l''avenir:';
  RAISE NOTICE '  - TOUJOURS utiliser API /api/purchase-receptions/validate';
  RAISE NOTICE '  - Éviter updates manuels de purchase_orders.status';
  RAISE NOTICE '  - Le code API calcule automatiquement le bon statut ✅';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
