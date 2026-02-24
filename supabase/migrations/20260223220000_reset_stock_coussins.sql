-- ============================================================================
-- Migration: Reset + Recalcul stock réel — 3 coussins
--
-- Produits concernés :
--   COU-0001  Coussin Rêveur         (a7fee6f9-2a11-4dbd-9167-c192c3f85c10)
--   COU-0005  Coussin Rose Sérénité  (9fe6988a-1966-4c10-97e1-86bd1fbc033d)
--   COU-0006  Coussin Évasion Bleu   (40710cab-0da6-49f9-9038-8f5ed017d1c6)
--
-- Problème : stocks gonflés par ADJUST Airtable (import CSV 2025-12-15)
-- Solution : DELETE tous les mouvements existants + recréer depuis zéro
--   - Étape 1 : DELETE tous les mouvements (trigger reset stock_real → 0)
--   - Étape 2 : INSERT 4 mouvements IN (réceptions PO réelles)
--   - Étape 3 : INSERT 3 mouvements OUT (ventes agrégées LinkMe/F-25)
--
-- Stocks attendus après migration : COU-0001=42 | COU-0005=79 | COU-0006=67
--
-- SÉCURITÉ :
--   - Transaction atomique (tout ou rien)
--   - Garde-fou anti-doublon (vérifie si sales_aggregate existent déjà)
--   - Garde-fou vérification finale (stock_real confirmé)
--   - Le trigger trg_sync_product_stock_after_movement met à jour stock_real
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID := '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0';
  v_existing_aggregate_count INT;
  v_stock_cou0001 INT;
  v_stock_cou0005 INT;
  v_stock_cou0006 INT;
  v_stock INT;

  -- Product IDs
  v_pid_cou0001 UUID := 'a7fee6f9-2a11-4dbd-9167-c192c3f85c10'; -- COU-0001 Coussin Rêveur
  v_pid_cou0005 UUID := '9fe6988a-1966-4c10-97e1-86bd1fbc033d'; -- COU-0005 Coussin Rose Sérénité
  v_pid_cou0006 UUID := '40710cab-0da6-49f9-9038-8f5ed017d1c6'; -- COU-0006 Coussin Évasion Bleu

  -- Purchase Order IDs
  v_po_ali207 UUID := '75aace1b-632e-47a1-b513-0fe735c73b90'; -- ALI-207300830501022407
  v_po_ali216 UUID := 'b9d16d27-b675-48b4-98b7-18335122e568'; -- ALI-216371043501022407

  -- Purchase Order Item IDs
  v_poi_cou0001_ali207 UUID := '10f2f393-baaf-4646-b1e2-ec060eabfc85'; -- COU-0001 × PO ALI-207 (100u)
  v_poi_cou0001_ali216 UUID := '97e96a12-1b4b-4a56-af6c-7c6c16003e9b'; -- COU-0001 × PO ALI-216 (100u)
  v_poi_cou0005_ali216 UUID := 'cfda2d88-5ed6-42c0-983f-7f9913631b10'; -- COU-0005 × PO ALI-216 (150u)
  v_poi_cou0006_ali216 UUID := '8a18bcb9-568d-43d7-8eab-2cc22ce3e6f7'; -- COU-0006 × PO ALI-216 (150u)

BEGIN

  -- ========================================================================
  -- ÉTAPE 0 — GARDE-FOU ANTI-DOUBLON
  -- Vérifier qu'aucun mouvement 'sales_aggregate' n'existe déjà
  -- (indiquerait que la migration a déjà été appliquée)
  -- ========================================================================
  SELECT count(*) INTO v_existing_aggregate_count
  FROM stock_movements
  WHERE reference_type = 'sales_aggregate'
    AND product_id IN (v_pid_cou0001, v_pid_cou0005, v_pid_cou0006);

  IF v_existing_aggregate_count > 0 THEN
    RAISE EXCEPTION 'ABORT: % mouvements sales_aggregate existent déjà — migration déjà appliquée ?', v_existing_aggregate_count;
  END IF;

  -- ========================================================================
  -- ÉTAPE 1 — DELETE les mouvements non-forecast pour les 3 coussins
  -- On exclut les forecast (affects_forecast=true) car le trigger
  -- trg_reverse_stock_on_movement_delete les inverserait sur stock_real
  -- même s'ils n'y contribuaient pas à l'INSERT (asymétrie trigger).
  -- Les mouvements forecast existants sont donc conservés.
  -- ========================================================================
  DELETE FROM stock_movements
  WHERE product_id IN (v_pid_cou0001, v_pid_cou0005, v_pid_cou0006)
    AND (affects_forecast IS NULL OR affects_forecast = false);

  RAISE NOTICE 'Étape 1 ✓ : mouvements non-forecast supprimés (ADJUST + IN reception) — forecast conservés';

  -- ========================================================================
  -- ÉTAPE 2 — INSERT mouvements IN (réceptions Purchase Orders)
  -- 4 mouvements au total
  -- ========================================================================

  -- 1. COU-0001 | PO ALI-207300830501022407 | +100u | unit_cost=10.4952
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0001;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast, purchase_order_item_id
  ) VALUES (
    v_pid_cou0001, 'IN', 100, v_stock, v_stock + 100,
    10.4952, 'reception', v_po_ali207,
    'Reception commande fournisseur PO #ALI-207300830501022407',
    v_admin_id, '2025-09-01 00:00:00+00'::timestamptz,
    'purchase_reception', false, v_poi_cou0001_ali207
  );

  -- 2. COU-0001 | PO ALI-216371043501022407 | +100u | unit_cost=10.6876
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0001;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast, purchase_order_item_id
  ) VALUES (
    v_pid_cou0001, 'IN', 100, v_stock, v_stock + 100,
    10.6876, 'reception', v_po_ali216,
    'Reception commande fournisseur PO #ALI-216371043501022407',
    v_admin_id, '2025-10-01 00:00:00+00'::timestamptz,
    'purchase_reception', false, v_poi_cou0001_ali216
  );

  -- 3. COU-0005 | PO ALI-216371043501022407 | +150u | unit_cost=6.2929
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0005;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast, purchase_order_item_id
  ) VALUES (
    v_pid_cou0005, 'IN', 150, v_stock, v_stock + 150,
    6.2929, 'reception', v_po_ali216,
    'Reception commande fournisseur PO #ALI-216371043501022407',
    v_admin_id, '2025-10-01 00:00:00+00'::timestamptz,
    'purchase_reception', false, v_poi_cou0005_ali216
  );

  -- 4. COU-0006 | PO ALI-216371043501022407 | +150u | unit_cost=6.6849
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0006;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast, purchase_order_item_id
  ) VALUES (
    v_pid_cou0006, 'IN', 150, v_stock, v_stock + 150,
    6.6849, 'reception', v_po_ali216,
    'Reception commande fournisseur PO #ALI-216371043501022407',
    v_admin_id, '2025-10-01 00:00:00+00'::timestamptz,
    'purchase_reception', false, v_poi_cou0006_ali216
  );

  RAISE NOTICE 'Étape 2 ✓ : 4 mouvements IN créés (COU-0001=200, COU-0005=150, COU-0006=150)';

  -- ========================================================================
  -- ÉTAPE 3 — INSERT mouvements OUT agrégés (ventes LinkMe/F-25)
  -- 3 mouvements au total (1 par produit)
  -- ========================================================================

  -- 5. COU-0001 | OUT -158u | ventes LinkMe/F-25 agrégées
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0001;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast
  ) VALUES (
    v_pid_cou0001, 'OUT', -158, v_stock, v_stock - 158,
    10.60, 'sales_aggregate', NULL,
    'Sorties stock ventes LinkMe/F-25 (régularisation agrégée)',
    v_admin_id, '2026-02-23 22:00:00+00'::timestamptz,
    'sale', false
  );

  -- 6. COU-0005 | OUT -71u | ventes LinkMe/F-25 agrégées
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0005;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast
  ) VALUES (
    v_pid_cou0005, 'OUT', -71, v_stock, v_stock - 71,
    6.29, 'sales_aggregate', NULL,
    'Sorties stock ventes LinkMe/F-25 (régularisation agrégée)',
    v_admin_id, '2026-02-23 22:00:00+00'::timestamptz,
    'sale', false
  );

  -- 7. COU-0006 | OUT -83u | ventes LinkMe/F-25 agrégées
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_cou0006;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast
  ) VALUES (
    v_pid_cou0006, 'OUT', -83, v_stock, v_stock - 83,
    6.68, 'sales_aggregate', NULL,
    'Sorties stock ventes LinkMe/F-25 (régularisation agrégée)',
    v_admin_id, '2026-02-23 22:00:00+00'::timestamptz,
    'sale', false
  );

  RAISE NOTICE 'Étape 3 ✓ : 3 mouvements OUT agrégés créés';

  -- ========================================================================
  -- ÉTAPE 4 — GARDE-FOU VÉRIFICATION FINALE
  -- stock_real doit correspondre exactement aux valeurs attendues
  -- ========================================================================
  SELECT stock_real INTO v_stock_cou0001 FROM products WHERE id = v_pid_cou0001;
  SELECT stock_real INTO v_stock_cou0005 FROM products WHERE id = v_pid_cou0005;
  SELECT stock_real INTO v_stock_cou0006 FROM products WHERE id = v_pid_cou0006;

  IF v_stock_cou0001 != 42 THEN
    RAISE EXCEPTION 'ABORT: COU-0001 stock_real=% (attendu: 42)', v_stock_cou0001;
  END IF;

  IF v_stock_cou0005 != 79 THEN
    RAISE EXCEPTION 'ABORT: COU-0005 stock_real=% (attendu: 79)', v_stock_cou0005;
  END IF;

  IF v_stock_cou0006 != 67 THEN
    RAISE EXCEPTION 'ABORT: COU-0006 stock_real=% (attendu: 67)', v_stock_cou0006;
  END IF;

  RAISE NOTICE '✅ Migration réussie : COU-0001=42 | COU-0005=79 | COU-0006=67';
  RAISE NOTICE '   Total : 7 mouvements créés (4 IN + 3 OUT agrégés)';

END $$;
