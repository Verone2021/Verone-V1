-- ============================================================================
-- Migration: Sorties de stock pour ventes particuliers OPJET
-- 7 commandes shipped sans mouvement OUT (11 lignes, 14 unités)
--
-- SÉCURITÉ:
-- - Transaction atomique (tout ou rien)
-- - Garde-fou anti-doublon
-- - Garde-fou stock suffisant par produit
-- - Le trigger trg_sync_product_stock_after_movement met à jour stock_real
-- ============================================================================

DO $$
DECLARE
  v_existing_out_count INT;
  v_admin_id UUID := '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0';
  v_stock INT;
  v_qty INT;
  -- Ordre IDs
  v_order_ids UUID[] := ARRAY[
    'f4c4a9aa-4071-4b3d-967b-413d68fcb1cc', -- F-25-006
    '59bdfb15-592c-4b45-98ec-97c2dbfe068c', -- F-25-010
    'bdba28b4-3cf6-465c-b4f7-5192eff54843', -- F-25-011
    'e6f0c859-a44b-4654-80fe-429718ef4737', -- F-25-013
    '25d4de04-a17e-4f2d-9906-0e688173e5a6', -- F-25-018
    'b1b1e29c-a1a3-4279-bd9e-79f05f8d2849', -- F-25-021
    'da5b8c01-b4c9-43ec-ad20-99f5ff11025c'  -- F-25-023
  ]::UUID[];
BEGIN

  -- ========================================================================
  -- GARDE-FOU 1 : Vérifier qu'aucun mouvement OUT réel n'existe déjà
  -- (on exclut les forecast qui existent peut-être)
  -- ========================================================================
  SELECT count(*) INTO v_existing_out_count
  FROM stock_movements
  WHERE movement_type = 'OUT'
    AND (affects_forecast IS NULL OR affects_forecast = false)
    AND reference_id = ANY(v_order_ids);

  IF v_existing_out_count > 0 THEN
    RAISE EXCEPTION 'ABORT: % mouvements OUT réels existent déjà pour ces commandes', v_existing_out_count;
  END IF;

  -- ========================================================================
  -- GARDE-FOU 2 : Vérifier stock suffisant pour chaque produit
  -- ========================================================================

  -- F-25-006: FAU-0003 (qté 1, stock attendu >= 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = 'e06c4494-8eb4-4023-865b-8b4042fb3674';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: FAU-0003 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-006: CHA-0004 (qté 4, stock attendu >= 4)
  SELECT stock_real INTO v_stock FROM products WHERE id = '47c1f199-ec24-4189-a6ea-2ca3c5716b37';
  IF v_stock < 4 THEN RAISE EXCEPTION 'ABORT: CHA-0004 stock insuffisant (% < 4)', v_stock; END IF;

  -- F-25-010: FAU-0013 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '936e526b-ba15-4cb9-be0e-2cd5961fe47b';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: FAU-0013 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-011: LAM-0002 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = 'f28a7d0b-b44c-4a58-8471-1c82e77bb177';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: LAM-0002 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-013: FAU-0009 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '8ac8e4dc-8867-443c-b785-a91bd0259962';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: FAU-0009 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-018: CHE-0002 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '0bd6e7ce-8c9c-4072-880b-edc6bfae3567';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: CHE-0002 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-018: TAB-0014 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '1704eb1a-0fba-44d8-8cd0-ba3ee2d9ef2e';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: TAB-0014 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-018: LAM-0026 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '0669d728-94fc-414f-a252-95b80f672706';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: LAM-0026 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-021: LAM-0007 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '6d7a4a09-7000-4f9f-acb9-ff07624f96e2';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: LAM-0007 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-021: TBS-0005 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = '12775745-2df8-4aae-899f-1ea82da03c60';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: TBS-0005 stock insuffisant (% < 1)', v_stock; END IF;

  -- F-25-023: TAB-0008 (qté 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = 'ab09d2c9-7067-4231-8be5-b1d745c5f4ad';
  IF v_stock < 1 THEN RAISE EXCEPTION 'ABORT: TAB-0008 stock insuffisant (% < 1)', v_stock; END IF;

  -- ========================================================================
  -- INSERT des 11 mouvements OUT
  -- Le trigger trg_sync_product_stock_after_movement mettra à jour stock_real
  -- ========================================================================

  -- 1. F-25-006 | FAU-0003 | Fauteuil douce velours naturel pivotant | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = 'e06c4494-8eb4-4023-865b-8b4042fb3674';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    'e06c4494-8eb4-4023-865b-8b4042fb3674', 'OUT', -1, v_stock, v_stock - 1,
    214.67, 'sale', 'f4c4a9aa-4071-4b3d-967b-413d68fcb1cc',
    'Sortie stock vente particulier F-25-006 (régularisation)', v_admin_id,
    '2025-03-24 00:00:00+00'::timestamptz, 'sale', false
  );

  -- 2. F-25-006 | CHA-0004 | Chaise Scandy vert thym | qté 4
  SELECT stock_real INTO v_stock FROM products WHERE id = '47c1f199-ec24-4189-a6ea-2ca3c5716b37';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '47c1f199-ec24-4189-a6ea-2ca3c5716b37', 'OUT', -4, v_stock, v_stock - 4,
    21.44, 'sale', 'f4c4a9aa-4071-4b3d-967b-413d68fcb1cc',
    'Sortie stock vente particulier F-25-006 (régularisation)', v_admin_id,
    '2025-03-24 00:00:00+00'::timestamptz, 'sale', false
  );

  -- 3. F-25-010 | FAU-0013 | Fauteuil Eve tissu bouclette orange | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '936e526b-ba15-4cb9-be0e-2cd5961fe47b';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '936e526b-ba15-4cb9-be0e-2cd5961fe47b', 'OUT', -1, v_stock, v_stock - 1,
    111.17, 'sale', '59bdfb15-592c-4b45-98ec-97c2dbfe068c',
    'Sortie stock vente particulier F-25-010 (régularisation)', v_admin_id,
    '2026-02-09 21:22:02.908513+00'::timestamptz, 'sale', false
  );

  -- 4. F-25-011 | LAM-0002 | Lampe Atomic chromé | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = 'f28a7d0b-b44c-4a58-8471-1c82e77bb177';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    'f28a7d0b-b44c-4a58-8471-1c82e77bb177', 'OUT', -1, v_stock, v_stock - 1,
    35.17, 'sale', 'bdba28b4-3cf6-465c-b4f7-5192eff54843',
    'Sortie stock vente particulier F-25-011 (régularisation)', v_admin_id,
    '2026-02-10 05:15:56.762687+00'::timestamptz, 'sale', false
  );

  -- 5. F-25-013 | FAU-0009 | Fauteuil Eve tissu bouclette jaune | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '8ac8e4dc-8867-443c-b785-a91bd0259962';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '8ac8e4dc-8867-443c-b785-a91bd0259962', 'OUT', -1, v_stock, v_stock - 1,
    111.17, 'sale', 'e6f0c859-a44b-4654-80fe-429718ef4737',
    'Sortie stock vente particulier F-25-013 (régularisation)', v_admin_id,
    '2026-02-10 05:17:04.896449+00'::timestamptz, 'sale', false
  );

  -- 6. F-25-018 | CHE-0002 | Chevet Marguerite | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '0bd6e7ce-8c9c-4072-880b-edc6bfae3567';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '0bd6e7ce-8c9c-4072-880b-edc6bfae3567', 'OUT', -1, v_stock, v_stock - 1,
    98.50, 'sale', '25d4de04-a17e-4f2d-9906-0e688173e5a6',
    'Sortie stock vente particulier F-25-018 (régularisation)', v_admin_id,
    '2026-02-10 07:03:22.423207+00'::timestamptz, 'sale', false
  );

  -- 7. F-25-018 | TAB-0014 | Bout de canapé Bibi matcha | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '1704eb1a-0fba-44d8-8cd0-ba3ee2d9ef2e';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '1704eb1a-0fba-44d8-8cd0-ba3ee2d9ef2e', 'OUT', -1, v_stock, v_stock - 1,
    79.22, 'sale', '25d4de04-a17e-4f2d-9906-0e688173e5a6',
    'Sortie stock vente particulier F-25-018 (régularisation)', v_admin_id,
    '2026-02-10 07:03:22.423207+00'::timestamptz, 'sale', false
  );

  -- 8. F-25-018 | LAM-0026 | Lampe Solène spirale orange | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '0669d728-94fc-414f-a252-95b80f672706';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '0669d728-94fc-414f-a252-95b80f672706', 'OUT', -1, v_stock, v_stock - 1,
    22.17, 'sale', '25d4de04-a17e-4f2d-9906-0e688173e5a6',
    'Sortie stock vente particulier F-25-018 (régularisation)', v_admin_id,
    '2026-02-10 07:03:22.423207+00'::timestamptz, 'sale', false
  );

  -- 9. F-25-021 | LAM-0007 | Lampadaire Saturne bouclette blanc | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '6d7a4a09-7000-4f9f-acb9-ff07624f96e2';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '6d7a4a09-7000-4f9f-acb9-ff07624f96e2', 'OUT', -1, v_stock, v_stock - 1,
    79.08, 'sale', 'b1b1e29c-a1a3-4279-bd9e-79f05f8d2849',
    'Sortie stock vente particulier F-25-021 (régularisation)', v_admin_id,
    '2026-02-10 06:53:15.150263+00'::timestamptz, 'sale', false
  );

  -- 10. F-25-021 | TBS-0005 | Tabouret passementerie kaki | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = '12775745-2df8-4aae-899f-1ea82da03c60';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    '12775745-2df8-4aae-899f-1ea82da03c60', 'OUT', -1, v_stock, v_stock - 1,
    69.75, 'sale', 'b1b1e29c-a1a3-4279-bd9e-79f05f8d2849',
    'Sortie stock vente particulier F-25-021 (régularisation)', v_admin_id,
    '2026-02-10 06:53:15.150263+00'::timestamptz, 'sale', false
  );

  -- 11. F-25-023 | TAB-0008 | Bout de canapé Bibi marron | qté 1
  SELECT stock_real INTO v_stock FROM products WHERE id = 'ab09d2c9-7067-4231-8be5-b1d745c5f4ad';
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after,
    unit_cost, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (
    'ab09d2c9-7067-4231-8be5-b1d745c5f4ad', 'OUT', -1, v_stock, v_stock - 1,
    79.08, 'sale', 'da5b8c01-b4c9-43ec-ad20-99f5ff11025c',
    'Sortie stock vente particulier F-25-023 (régularisation)', v_admin_id,
    '2026-02-10 06:45:07.965334+00'::timestamptz, 'sale', false
  );

  RAISE NOTICE '✅ 11 mouvements OUT créés avec succès pour 7 commandes particuliers';
END $$;
