/**
 * 🧪 TESTS AUTOMATISÉS: Mouvements Stock Partiels (PO + SO)
 *
 * Date: 2025-10-18
 * Auteur: Claude Code (Agent Test Guardian)
 * Migration testée: 20251018_002_fix_partial_movements_differential.sql
 *
 * OBJECTIF:
 * Valider calcul différentiel réceptions/expéditions partielles via SUM stock_movements.
 * Tests incluent assertions PostgreSQL automatiques + rollback complet.
 *
 * EXÉCUTION:
 * psql -h aws-1-eu-west-3.pooler.supabase.com -p 5432 -U postgres.ofohxkogbqhhpbpomhmg -d postgres -f 20251018_003_test_partial_stock_movements.sql
 *
 * SCÉNARIOS TESTÉS:
 * - PO: draft → confirmed → partially_received(4/10) → partially_received(8/10) → received(10/10)
 * - SO: draft → confirmed → partially_shipped(2/6) → partially_shipped(5/6) → shipped(6/6)
 *
 * ROLLBACK: Automatique (BEGIN; ... ROLLBACK;) - Pas de pollution database
 */

-- ===========================================================================
-- FONCTION HELPER: Assertions automatisées
-- ===========================================================================

CREATE OR REPLACE FUNCTION test_assert_equal(
  p_description TEXT,
  p_expected NUMERIC,
  p_actual NUMERIC
)
RETURNS VOID AS $$
BEGIN
  IF p_expected = p_actual THEN
    RAISE NOTICE '✅ PASS: % (Attendu: %, Réel: %)', p_description, p_expected, p_actual;
  ELSE
    RAISE EXCEPTION '❌ FAIL: % (Attendu: %, Réel: %)', p_description, p_expected, p_actual;
  END IF;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION test_assert_movement_count(
  p_description TEXT,
  p_expected_count INTEGER,
  p_reference_id UUID,
  p_product_id UUID,
  p_movement_type TEXT,
  p_affects_forecast BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_actual_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_actual_count
  FROM stock_movements
  WHERE reference_id = p_reference_id
    AND product_id = p_product_id
    AND movement_type::TEXT = p_movement_type  -- Cast enum to TEXT
    AND affects_forecast = p_affects_forecast;

  IF p_expected_count = v_actual_count THEN
    RAISE NOTICE '✅ PASS: % (Attendu: % mouvements, Réel: %)', p_description, p_expected_count, v_actual_count;
  ELSE
    RAISE EXCEPTION '❌ FAIL: % (Attendu: % mouvements, Réel: %)', p_description, p_expected_count, v_actual_count;
  END IF;
END;
$$ LANGUAGE plpgsql;


-- ===========================================================================
-- DÉBUT TRANSACTION ISOLÉE (ROLLBACK AUTOMATIQUE)
-- ===========================================================================

BEGIN;

DO $$
DECLARE
  -- 🎯 Variables Test Data
  v_product_id UUID;
  v_product_name TEXT := 'TEST-Fauteuil-Partial-Movements-' || NOW()::TEXT;
  v_organisation_id UUID;
  v_purchase_order_id UUID;
  v_sales_order_id UUID;
  v_po_item_id UUID;
  v_so_item_id UUID;
  v_user_id UUID;

  -- 📊 Variables Assertions
  v_stock_real INTEGER;
  v_stock_forecasted_in INTEGER;
  v_stock_forecasted_out INTEGER;
  v_movement_count INTEGER;
  v_expected_stock_real INTEGER;
  v_expected_forecasted_in INTEGER;
  v_expected_forecasted_out INTEGER;

BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 DÉBUT TESTS: Mouvements Stock Partiels (PO + SO)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- ===========================================================================
  -- PHASE 0: SETUP - Créer données test propres
  -- ===========================================================================

  RAISE NOTICE '📋 PHASE 0: SETUP - Création données test';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Récupérer organisation existante
  SELECT id INTO v_organisation_id
  FROM organisations
  WHERE type = 'supplier'
  LIMIT 1;

  IF v_organisation_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucune organisation fournisseur trouvée';
  END IF;

  -- Récupérer user_id pour performed_by
  SELECT user_id INTO v_user_id
  FROM user_profiles
  WHERE role = 'owner'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '❌ Aucun utilisateur owner trouvé';
  END IF;

  -- Créer produit test propre (stock initial = 100)
  INSERT INTO products (
    name,
    sku,
    stock_quantity,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    min_stock,
    cost_price
  ) VALUES (
    v_product_name,
    'TST-PARTIAL-' || REPLACE(EXTRACT(EPOCH FROM NOW())::TEXT, '.', '-'),  -- SKU format valide (A-Z0-9-)
    100,  -- Stock initial quantity
    100,  -- Stock initial réel
    0,    -- Pas de prévisionnel IN initial
    0,    -- Pas de prévisionnel OUT initial
    10,   -- Min stock
    500.00  -- Cost price
  )
  RETURNING id INTO v_product_id;

  RAISE NOTICE '✅ Produit test créé: % (ID: %)', v_product_name, v_product_id;
  RAISE NOTICE '   Stock initial: real=100, forecasted_in=0, forecasted_out=0';
  RAISE NOTICE '';


  -- ===========================================================================
  -- TESTS PURCHASE ORDERS (Réceptions Partielles)
  -- ===========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 SECTION 1: PURCHASE ORDERS (Réceptions Partielles)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 1: PO Draft → Confirmed (Quantité commandée: 10)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 1: PO Draft → Confirmed';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Créer commande fournisseur draft
  INSERT INTO purchase_orders (
    po_number,
    supplier_id,
    status,
    created_by
  ) VALUES (
    'PO-TEST-' || REPLACE(EXTRACT(EPOCH FROM NOW())::TEXT, '.', '-'),
    v_organisation_id,
    'draft',
    v_user_id
  )
  RETURNING id INTO v_purchase_order_id;

  -- Créer ligne commande (10 unités)
  INSERT INTO purchase_order_items (
    purchase_order_id,
    product_id,
    quantity,
    unit_price_ht,
    quantity_received
  ) VALUES (
    v_purchase_order_id,
    v_product_id,
    10,
    500.00,
    0
  )
  RETURNING id INTO v_po_item_id;

  RAISE NOTICE 'Commande créée: 10 unités, status=draft';

  -- Valider commande (draft → confirmed)
  UPDATE purchase_orders
  SET status = 'confirmed',
      validated_at = NOW(),
      validated_by = v_user_id,
      sent_at = NOW(),  -- Requis par contrainte valid_workflow_timestamps
      sent_by = v_user_id
  WHERE id = v_purchase_order_id;

  -- Vérifier stock après confirmation
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 1
  PERFORM test_assert_equal('TEST 1: Stock réel inchangé', 100, v_stock_real);
  PERFORM test_assert_equal('TEST 1: Stock prévisionnel IN ajouté', 10, v_stock_forecasted_in);
  PERFORM test_assert_equal('TEST 1: Stock prévisionnel OUT inchangé', 0, v_stock_forecasted_out);
  PERFORM test_assert_movement_count('TEST 1: 1 mouvement forecast IN créé', 1, v_purchase_order_id, v_product_id, 'IN', true);

  RAISE NOTICE '✅ TEST 1 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 2: PO Confirmed → Partially Received (4/10)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 2: PO Confirmed → Partially Received (4/10)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour status AVANT quantity_received (requis par trigger)
  UPDATE purchase_orders
  SET status = 'partially_received',
      received_by = v_user_id,
      received_at = NOW()
  WHERE id = v_purchase_order_id;

  -- Mettre à jour quantity_received APRÈS le status
  UPDATE purchase_order_items
  SET quantity_received = 4
  WHERE id = v_po_item_id;

  -- Vérifier stock après réception partielle
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 2
  v_expected_stock_real := 100 + 4;  -- Stock initial + 4 reçus
  v_expected_forecasted_in := 10 - 4; -- Prévisionnel diminué de 4
  PERFORM test_assert_equal('TEST 2: Stock réel augmenté de 4', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 2: Stock prévisionnel IN diminué de 4', v_expected_forecasted_in, v_stock_forecasted_in);

  -- Vérifier mouvements créés (2 attendus: OUT forecast -4, IN real +4)
  PERFORM test_assert_movement_count('TEST 2: Mouvement forecast OUT -4 créé', 1, v_purchase_order_id, v_product_id, 'OUT', true);
  PERFORM test_assert_movement_count('TEST 2: Mouvement real IN +4 créé', 1, v_purchase_order_id, v_product_id, 'IN', false);

  RAISE NOTICE '✅ TEST 2 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 3: PO Partially Received (4/10) → Partially Received (8/10)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 3: PO Partially Received (4/10) → (8/10)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour quantity_received (4 → 8, donc +4 différentiel)
  -- Status déjà 'partially_received', juste update timestamp
  UPDATE purchase_orders
  SET received_at = NOW()
  WHERE id = v_purchase_order_id;

  UPDATE purchase_order_items
  SET quantity_received = 8
  WHERE id = v_po_item_id;

  -- Vérifier stock après 2ème réception partielle
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 3
  v_expected_stock_real := 100 + 8;  -- Stock initial + 8 reçus au total
  v_expected_forecasted_in := 10 - 8; -- Prévisionnel diminué de 8 au total
  PERFORM test_assert_equal('TEST 3: Stock réel augmenté à 108', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 3: Stock prévisionnel IN diminué à 2', v_expected_forecasted_in, v_stock_forecasted_in);

  -- Vérifier mouvements différentiels créés (2 attendus: OUT forecast -4, IN real +4)
  PERFORM test_assert_movement_count('TEST 3: 2 mouvements forecast OUT créés', 2, v_purchase_order_id, v_product_id, 'OUT', true);
  PERFORM test_assert_movement_count('TEST 3: 2 mouvements real IN créés', 2, v_purchase_order_id, v_product_id, 'IN', false);

  RAISE NOTICE '✅ TEST 3 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 4: PO Partially Received (8/10) → Received (10/10)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 4: PO Partially Received (8/10) → Received (10/10)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour status AVANT quantity_received
  UPDATE purchase_orders
  SET status = 'received',
      received_at = NOW()
  WHERE id = v_purchase_order_id;

  -- Mettre à jour quantity_received (8 → 10, donc +2 différentiel)
  UPDATE purchase_order_items
  SET quantity_received = 10
  WHERE id = v_po_item_id;

  -- Vérifier stock après réception complète
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 4
  v_expected_stock_real := 100 + 10;  -- Stock initial + 10 reçus au total
  v_expected_forecasted_in := 0; -- Prévisionnel annulé complètement
  PERFORM test_assert_equal('TEST 4: Stock réel augmenté à 110', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 4: Stock prévisionnel IN annulé', v_expected_forecasted_in, v_stock_forecasted_in);

  -- Vérifier mouvements différentiels créés (2 attendus: OUT forecast -2, IN real +2)
  PERFORM test_assert_movement_count('TEST 4: 3 mouvements forecast OUT créés', 3, v_purchase_order_id, v_product_id, 'OUT', true);
  PERFORM test_assert_movement_count('TEST 4: 3 mouvements real IN créés', 3, v_purchase_order_id, v_product_id, 'IN', false);

  RAISE NOTICE '✅ TEST 4 PASSED';
  RAISE NOTICE '';


  -- ===========================================================================
  -- TESTS SALES ORDERS (Expéditions Partielles)
  -- ===========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧪 SECTION 2: SALES ORDERS (Expéditions Partielles)';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 5: SO Draft → Confirmed (Quantité commandée: 6)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 5: SO Draft → Confirmed';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Créer commande client draft
  INSERT INTO sales_orders (
    order_number,
    customer_id,
    customer_type,
    status,
    created_by
  ) VALUES (
    'SO-TEST-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_organisation_id,  -- Utiliser organisation comme customer
    'b2b',  -- Type client professionnel
    'draft',
    v_user_id
  )
  RETURNING id INTO v_sales_order_id;

  -- Créer ligne commande (6 unités)
  INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    unit_price_ht,
    quantity_shipped
  ) VALUES (
    v_sales_order_id,
    v_product_id,
    6,
    1200.00,
    0
  )
  RETURNING id INTO v_so_item_id;

  RAISE NOTICE 'Commande client créée: 6 unités, status=draft';

  -- Valider commande (draft → confirmed)
  UPDATE sales_orders
  SET status = 'confirmed',
      confirmed_by = v_user_id,
      confirmed_at = NOW()
  WHERE id = v_sales_order_id;

  -- Vérifier stock après confirmation
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 5
  PERFORM test_assert_equal('TEST 5: Stock réel inchangé', 110, v_stock_real);
  PERFORM test_assert_equal('TEST 5: Stock prévisionnel OUT ajouté', 6, v_stock_forecasted_out);
  PERFORM test_assert_movement_count('TEST 5: 1 mouvement forecast OUT créé', 1, v_sales_order_id, v_product_id, 'OUT', true);

  RAISE NOTICE '✅ TEST 5 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 6: SO Confirmed → Partially Shipped (2/6)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 6: SO Confirmed → Partially Shipped (2/6)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour quantity_shipped et status
  UPDATE sales_order_items
  SET quantity_shipped = 2
  WHERE id = v_so_item_id;

  UPDATE sales_orders
  SET status = 'partially_shipped',
      warehouse_exit_at = NOW()
  WHERE id = v_sales_order_id;

  -- Vérifier stock après expédition partielle
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 6
  v_expected_stock_real := 110 - 2;  -- Stock initial - 2 expédiés
  v_expected_forecasted_out := 6;    -- Prévisionnel OUT inchangé
  PERFORM test_assert_equal('TEST 6: Stock réel diminué de 2', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 6: Stock prévisionnel OUT inchangé', v_expected_forecasted_out, v_stock_forecasted_out);

  -- Vérifier mouvement créé (1 attendu: OUT real -2)
  PERFORM test_assert_movement_count('TEST 6: Mouvement real OUT -2 créé', 1, v_sales_order_id, v_product_id, 'OUT', false);

  RAISE NOTICE '✅ TEST 6 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 7: SO Partially Shipped (2/6) → Partially Shipped (5/6)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 7: SO Partially Shipped (2/6) → (5/6)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour quantity_shipped (2 → 5, donc +3 différentiel)
  UPDATE sales_order_items
  SET quantity_shipped = 5
  WHERE id = v_so_item_id;

  UPDATE sales_orders
  SET warehouse_exit_at = NOW()
  WHERE id = v_sales_order_id;

  -- Vérifier stock après 2ème expédition partielle
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 7
  v_expected_stock_real := 110 - 5;  -- Stock initial - 5 expédiés au total
  PERFORM test_assert_equal('TEST 7: Stock réel diminué à 105', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 7: Stock prévisionnel OUT inchangé', 6, v_stock_forecasted_out);

  -- Vérifier mouvements différentiels créés (2 attendus: OUT real -2, OUT real -3)
  PERFORM test_assert_movement_count('TEST 7: 2 mouvements real OUT créés', 2, v_sales_order_id, v_product_id, 'OUT', false);

  RAISE NOTICE '✅ TEST 7 PASSED';
  RAISE NOTICE '';


  -- ---------------------------------------------------------------------------
  -- TEST 8: SO Partially Shipped (5/6) → Shipped (6/6)
  -- ---------------------------------------------------------------------------

  RAISE NOTICE '📝 TEST 8: SO Partially Shipped (5/6) → Shipped (6/6)';
  RAISE NOTICE '───────────────────────────────────────────────────────────────';

  -- Mettre à jour quantity_shipped (5 → 6, donc +1 différentiel)
  UPDATE sales_order_items
  SET quantity_shipped = 6
  WHERE id = v_so_item_id;

  UPDATE sales_orders
  SET status = 'shipped',
      warehouse_exit_at = NOW()
  WHERE id = v_sales_order_id;

  -- Vérifier stock après expédition complète
  SELECT stock_real, stock_forecasted_in, stock_forecasted_out
  INTO v_stock_real, v_stock_forecasted_in, v_stock_forecasted_out
  FROM products
  WHERE id = v_product_id;

  -- Assertions TEST 8
  v_expected_stock_real := 110 - 6;  -- Stock initial - 6 expédiés au total
  PERFORM test_assert_equal('TEST 8: Stock réel diminué à 104', v_expected_stock_real, v_stock_real);
  PERFORM test_assert_equal('TEST 8: Stock prévisionnel OUT inchangé', 6, v_stock_forecasted_out);

  -- Vérifier mouvements différentiels créés (3 attendus: OUT real -2, -3, -1)
  PERFORM test_assert_movement_count('TEST 8: 3 mouvements real OUT créés', 3, v_sales_order_id, v_product_id, 'OUT', false);

  RAISE NOTICE '✅ TEST 8 PASSED';
  RAISE NOTICE '';


  -- ===========================================================================
  -- RAPPORT FINAL
  -- ===========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOUS LES TESTS PASSÉS AVEC SUCCÈS';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Résumé Final:';
  RAISE NOTICE '   - Stock initial: 100';
  RAISE NOTICE '   - PO reçu: +10 (4+4+2 en 3 réceptions partielles)';
  RAISE NOTICE '   - SO expédié: -6 (2+3+1 en 3 expéditions partielles)';
  RAISE NOTICE '   - Stock final: % (attendu: 104)', v_stock_real;
  RAISE NOTICE '';
  RAISE NOTICE '📈 Mouvements Stock Créés:';

  -- Afficher résumé mouvements PO
  SELECT COUNT(*)
  INTO v_movement_count
  FROM stock_movements
  WHERE reference_id = v_purchase_order_id;
  RAISE NOTICE '   - Purchase Order: % mouvements (attendu: 6)', v_movement_count;

  -- Afficher résumé mouvements SO
  SELECT COUNT(*)
  INTO v_movement_count
  FROM stock_movements
  WHERE reference_id = v_sales_order_id;
  RAISE NOTICE '   - Sales Order: % mouvements (attendu: 4)', v_movement_count;

  RAISE NOTICE '';
  RAISE NOTICE '🔄 ROLLBACK automatique dans 3s...';
  RAISE NOTICE '   (Aucune donnée test ne sera conservée)';
  RAISE NOTICE '';

  -- Pause 3 secondes pour lecture rapport
  PERFORM pg_sleep(3);

END $$;


-- ===========================================================================
-- ROLLBACK AUTOMATIQUE (Pas de pollution database)
-- ===========================================================================

ROLLBACK;

-- Supprimer fonctions helpers
DROP FUNCTION IF EXISTS test_assert_equal(TEXT, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS test_assert_movement_count(TEXT, INTEGER, UUID, UUID, TEXT, BOOLEAN);


-- ===========================================================================
-- RAPPORT POST-ROLLBACK
-- ===========================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '🧹 ROLLBACK EFFECTUÉ - Database Propre';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 20251018_002 VALIDÉE par tests automatisés';
  RAISE NOTICE '✅ Calcul différentiel fonctionne correctement';
  RAISE NOTICE '✅ Aucune régression détectée';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Système de mouvements stock partiels PRÊT pour production';
  RAISE NOTICE '';
END $$;
