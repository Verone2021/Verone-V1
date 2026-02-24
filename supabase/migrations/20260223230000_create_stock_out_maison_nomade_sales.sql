-- ============================================================================
-- Migration: Création mouvements OUT agrégés — Produits Maison Nomade
--
-- Contexte :
--   Stocks figés à la valeur Airtable (import CSV 2025-12-15 = stock au
--   moment de la facture 2025-049, juin/juillet 2025).
--   Depuis cette date, commandes F-25-030 → F-25-050 + LINK-240067 ont été
--   expédiées SANS aucun mouvement OUT enregistré.
--
-- Solution :
--   Créer 1 mouvement OUT agrégé par produit (18 produits + cas spécial SUS-0010).
--   Pas de DELETE — on ajoute simplement les sorties manquantes.
--
-- Périmètre :
--   18 produits Maison Nomade (coussins et PLA-0002 exclus)
--   SUS-0010 : ADJUST +2 (inventory_reconciliation) puis OUT -2 → stock final = 0
--
-- Reference IDs (reference_id IS NOT NULL — constraint check_movement_reference) :
--   OUT sales_aggregate  : b[cat][sku_6]-0000-0000-0000-000000000000
--     cat: BAN=1, DEC=2, MEU=3, PLA=4, SEP=5, SUS=6, TAB=7, VAS=8
--   ADJUST SUS-0010 batch: ad060010-0000-0000-0000-000000000000
--
-- Stocks attendus après migration :
--   BAN-0001=42 | BAN-0008=3  | DEC-0001=9  | DEC-0002=0  | DEC-0003=2
--   DEC-0004=4  | DEC-0005=1  | MEU-0001=15 | PLA-0001=687 | SEP-0001=13
--   SUS-0002=32 | SUS-0003=31 | SUS-0005=5  | SUS-0006=39 | SUS-0007=24
--   SUS-0010=0  | TAB-0003=30 | VAS-0034=9
--
-- SÉCURITÉ :
--   - Transaction atomique (tout ou rien)
--   - Garde-fou anti-doublon (reference_ids déterministes)
--   - Vérification finale stock_real pour chaque produit
--   - Le trigger trg_sync_product_stock_after_movement met à jour stock_real
-- ============================================================================

DO $$
DECLARE
  v_admin_id UUID := '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0';
  v_existing_aggregate_count INT;
  v_stock INT;

  -- Product IDs
  v_pid_ban0001 UUID := 'ae2c69aa-a403-4b19-acd7-6d81944eea38'; -- BAN-0001 Tabouret modèle 2021
  v_pid_ban0008 UUID := '27ab1208-61b0-493f-8970-b75e7726eca9'; -- BAN-0008 Banc artisanal bois 120cm
  v_pid_dec0001 UUID := '255b1f37-36fe-49da-a889-87e0db32b647'; -- DEC-0001 Miroir XL
  v_pid_dec0002 UUID := '9eb44f73-457a-467d-a671-9df87806e0b7'; -- DEC-0002 Rond paille S
  v_pid_dec0003 UUID := '20ce5eb2-a393-43e4-b053-e9c716c3375c'; -- DEC-0003 Rond paille L
  v_pid_dec0004 UUID := '46603979-dd67-4fab-b64c-5db6c53e5e55'; -- DEC-0004 Rond paille M
  v_pid_dec0005 UUID := 'c81b12b8-e638-4b45-9482-24d96752d136'; -- DEC-0005 Lots 4 miroirs laiton
  v_pid_meu0001 UUID := '37f00f14-ce2d-48bf-ba4a-832d37978a74'; -- MEU-0001 Meuble TABESTO à POKAWA
  v_pid_pla0001 UUID := 'e8d982ab-4b66-45c7-bc16-27943f785aec'; -- PLA-0001 Plateau bois 20×30 cm
  v_pid_sep0001 UUID := '6a1289df-f0e0-4a33-9a1e-f877df17a6a2'; -- SEP-0001 Séparateur Terrasse
  v_pid_sus0002 UUID := '6e2f9ec6-e191-401d-8ab9-cb26604a8175'; -- SUS-0002 Suspensions frange n°2
  v_pid_sus0003 UUID := 'ec12e634-dac1-41b5-b03e-6e1906965d02'; -- SUS-0003 Suspension paille
  v_pid_sus0005 UUID := 'e7c8c7bb-cfbe-45ec-8617-5d8ca892d9b7'; -- SUS-0005 Suspension raphia 5
  v_pid_sus0006 UUID := 'eb973cb0-ca32-4efc-99c9-82bd379b87e2'; -- SUS-0006 Suspension raphia 6
  v_pid_sus0007 UUID := 'd2e8b1d8-18b8-4438-ad00-d7c78f840a15'; -- SUS-0007 Suspension raphia 3
  v_pid_sus0010 UUID := '14960d7e-3f93-4d1a-a0da-7af355407639'; -- SUS-0010 Suspensions franges n°1
  v_pid_tab0003 UUID := '389f41ed-e25e-40e1-b525-8a7f2abf0726'; -- TAB-0003 Table modèle 2021
  v_pid_vas0034 UUID := '06ee7806-50ff-43cb-aaf6-96075113aee2'; -- VAS-0034 Ciel de bar

  -- Reference IDs déterministes pour les OUT sales_aggregate
  v_ref_ban0001 UUID := 'b1000001-0000-0000-0000-000000000000';
  v_ref_ban0008 UUID := 'b1000008-0000-0000-0000-000000000000';
  v_ref_dec0001 UUID := 'b2000001-0000-0000-0000-000000000000';
  v_ref_dec0002 UUID := 'b2000002-0000-0000-0000-000000000000';
  v_ref_dec0003 UUID := 'b2000003-0000-0000-0000-000000000000';
  v_ref_dec0004 UUID := 'b2000004-0000-0000-0000-000000000000';
  v_ref_dec0005 UUID := 'b2000005-0000-0000-0000-000000000000';
  v_ref_meu0001 UUID := 'b3000001-0000-0000-0000-000000000000';
  v_ref_pla0001 UUID := 'b4000001-0000-0000-0000-000000000000';
  v_ref_sep0001 UUID := 'b5000001-0000-0000-0000-000000000000';
  v_ref_sus0002 UUID := 'b6000002-0000-0000-0000-000000000000';
  v_ref_sus0003 UUID := 'b6000003-0000-0000-0000-000000000000';
  v_ref_sus0005 UUID := 'b6000005-0000-0000-0000-000000000000';
  v_ref_sus0006 UUID := 'b6000006-0000-0000-0000-000000000000';
  v_ref_sus0007 UUID := 'b6000007-0000-0000-0000-000000000000';
  v_ref_sus0010 UUID := 'b6000010-0000-0000-0000-000000000000';
  v_ref_tab0003 UUID := 'b7000003-0000-0000-0000-000000000000';
  v_ref_vas0034 UUID := 'b8000034-0000-0000-0000-000000000000';
  -- Batch UUID pour le ADJUST SUS-0010 (inventory_reconciliation)
  v_ref_adj_sus0010 UUID := 'ad060010-0000-0000-0000-000000000000';

  -- Stocks attendus (vérification finale)
  v_expected_ban0001 INT := 42;
  v_expected_ban0008 INT := 3;
  v_expected_dec0001 INT := 9;
  v_expected_dec0002 INT := 0;
  v_expected_dec0003 INT := 2;
  v_expected_dec0004 INT := 4;
  v_expected_dec0005 INT := 1;
  v_expected_meu0001 INT := 15;
  v_expected_pla0001 INT := 687;
  v_expected_sep0001 INT := 13;
  v_expected_sus0002 INT := 32;
  v_expected_sus0003 INT := 31;
  v_expected_sus0005 INT := 5;
  v_expected_sus0006 INT := 39;
  v_expected_sus0007 INT := 24;
  v_expected_sus0010 INT := 0;
  v_expected_tab0003 INT := 30;
  v_expected_vas0034 INT := 9;

BEGIN

  -- ========================================================================
  -- ÉTAPE 0 — GARDE-FOU ANTI-DOUBLON
  -- Vérifier qu'aucun mouvement avec ces reference_ids n'existe déjà
  -- ========================================================================
  SELECT count(*) INTO v_existing_aggregate_count
  FROM stock_movements
  WHERE reference_type = 'sales_aggregate'
    AND reference_id IN (
      v_ref_ban0001, v_ref_ban0008, v_ref_dec0001, v_ref_dec0002, v_ref_dec0003,
      v_ref_dec0004, v_ref_dec0005, v_ref_meu0001, v_ref_pla0001, v_ref_sep0001,
      v_ref_sus0002, v_ref_sus0003, v_ref_sus0005, v_ref_sus0006, v_ref_sus0007,
      v_ref_sus0010, v_ref_tab0003, v_ref_vas0034
    );

  IF v_existing_aggregate_count > 0 THEN
    RAISE EXCEPTION 'ABORT: % mouvements sales_aggregate existent déjà (reference_ids présents) — migration déjà appliquée ?', v_existing_aggregate_count;
  END IF;

  RAISE NOTICE 'Étape 0 ✓ : aucun doublon détecté';

  -- ========================================================================
  -- ÉTAPE 1 — SUS-0010 : ADJUST +2 (reconstitution stock inventaire non tracé)
  -- Stock actuel = 0. La vente F-25-030 (2u, 01/07/2025) a été faite
  -- mais aucun stock n'était tracé. On reconstitue d'abord le stock.
  -- reference_type='inventory_reconciliation' (pattern existant pour ADJUST)
  -- ========================================================================
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0010;
  INSERT INTO stock_movements (
    product_id, movement_type, quantity_change, quantity_before, quantity_after,
    reference_type, reference_id, notes, performed_by, performed_at,
    reason_code, affects_forecast
  ) VALUES (
    v_pid_sus0010, 'ADJUST', 2, v_stock, v_stock + 2,
    'inventory_reconciliation', v_ref_adj_sus0010,
    'Reconstitution stock SUS-0010 — vendu F-25-030 (1er juillet 2025) mais stock non tracé dans Airtable',
    v_admin_id, '2026-02-23 23:00:00+00'::timestamptz,
    'inventory_correction', false
  );
  RAISE NOTICE 'Étape 1 ✓ : SUS-0010 ADJUST +2 (0 → 2)';

  -- ========================================================================
  -- ÉTAPE 2 — INSERT mouvements OUT agrégés (1 par produit, 18 total)
  -- Tous datés au 2026-02-23 23:00:00+00 (régularisation)
  -- ========================================================================

  -- BAN-0001 | OUT -22 | F-25-031(6) + F-25-042(16) | 64 → 42
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_ban0001;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_ban0001, 'OUT', -22, v_stock, v_stock - 22, 'sales_aggregate', v_ref_ban0001, 'Ventes agrégées F-25-031(6)+F-25-042(16) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- BAN-0008 | OUT -1 | F-25-030(1) | 4 → 3
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_ban0008;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_ban0008, 'OUT', -1, v_stock, v_stock - 1, 'sales_aggregate', v_ref_ban0008, 'Ventes agrégées F-25-030(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- DEC-0001 | OUT -3 | F-25-049(2) + F-25-050(1) | 12 → 9
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0001;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_dec0001, 'OUT', -3, v_stock, v_stock - 3, 'sales_aggregate', v_ref_dec0001, 'Ventes agrégées F-25-049(2)+F-25-050(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- DEC-0002 | OUT -2 | F-25-030(1) + F-25-047(1) | 2 → 0
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0002;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_dec0002, 'OUT', -2, v_stock, v_stock - 2, 'sales_aggregate', v_ref_dec0002, 'Ventes agrégées F-25-030(1)+F-25-047(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- DEC-0003 | OUT -6 | F-25-045(3) + F-25-047(1) + F-25-050(2) | 8 → 2
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0003;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_dec0003, 'OUT', -6, v_stock, v_stock - 6, 'sales_aggregate', v_ref_dec0003, 'Ventes agrégées F-25-045(3)+F-25-047(1)+F-25-050(2) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- DEC-0004 | OUT -3 | F-25-030(1) + F-25-047(1) + F-25-050(1) | 7 → 4
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0004;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_dec0004, 'OUT', -3, v_stock, v_stock - 3, 'sales_aggregate', v_ref_dec0004, 'Ventes agrégées F-25-030(1)+F-25-047(1)+F-25-050(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- DEC-0005 | OUT -1 | F-25-030(1) | 2 → 1
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0005;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_dec0005, 'OUT', -1, v_stock, v_stock - 1, 'sales_aggregate', v_ref_dec0005, 'Ventes agrégées F-25-030(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- MEU-0001 | OUT -1 | F-25-048(1) | 16 → 15
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_meu0001;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_meu0001, 'OUT', -1, v_stock, v_stock - 1, 'sales_aggregate', v_ref_meu0001, 'Ventes agrégées F-25-048(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- PLA-0001 | OUT -195 | LINK-240067(50)+F-25-039(30)+F-25-040(15)+F-25-044(40)+F-25-045(30)+F-25-048(30) | 882 → 687
  -- Note : stock_real=882 car 8 OUT déjà enregistrés (SO-2026-00080 partiellement expédié)
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_pla0001;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_pla0001, 'OUT', -195, v_stock, v_stock - 195, 'sales_aggregate', v_ref_pla0001, 'Ventes agrégées LINK-240067(50)+F-25-039(30)+F-25-040(15)+F-25-044(40)+F-25-045(30)+F-25-048(30) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SEP-0001 | OUT -2 | F-25-047(2) | 15 → 13
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sep0001;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sep0001, 'OUT', -2, v_stock, v_stock - 2, 'sales_aggregate', v_ref_sep0001, 'Ventes agrégées F-25-047(2) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0002 | OUT -17 | F-25-045(4)+F-25-047(3)+F-25-049(4)+F-25-050(6) | 49 → 32
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0002;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0002, 'OUT', -17, v_stock, v_stock - 17, 'sales_aggregate', v_ref_sus0002, 'Ventes agrégées F-25-045(4)+F-25-047(3)+F-25-049(4)+F-25-050(6) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0003 | OUT -14 | F-25-030(4)+F-25-045(2)+F-25-049(8) | 45 → 31
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0003;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0003, 'OUT', -14, v_stock, v_stock - 14, 'sales_aggregate', v_ref_sus0003, 'Ventes agrégées F-25-030(4)+F-25-045(2)+F-25-049(8) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0005 | OUT -7 | F-25-045(4)+F-25-050(3) | 12 → 5
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0005;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0005, 'OUT', -7, v_stock, v_stock - 7, 'sales_aggregate', v_ref_sus0005, 'Ventes agrégées F-25-045(4)+F-25-050(3) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0006 | OUT -10 | F-25-030(2)+F-25-047(1)+F-25-050(7) | 49 → 39
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0006;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0006, 'OUT', -10, v_stock, v_stock - 10, 'sales_aggregate', v_ref_sus0006, 'Ventes agrégées F-25-030(2)+F-25-047(1)+F-25-050(7) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0007 | OUT -49 | F-25-030(6)+F-25-032(15)+F-25-045(2)+F-25-047(4)+F-25-048(3)+F-25-049(13)+F-25-050(6) | 73 → 24
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0007;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0007, 'OUT', -49, v_stock, v_stock - 49, 'sales_aggregate', v_ref_sus0007, 'Ventes agrégées F-25-030(6)+F-25-032(15)+F-25-045(2)+F-25-047(4)+F-25-048(3)+F-25-049(13)+F-25-050(6) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- SUS-0010 | OUT -2 | F-25-030(2) | 2 → 0 (après ADJUST +2 de l'étape 1)
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0010;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_sus0010, 'OUT', -2, v_stock, v_stock - 2, 'sales_aggregate', v_ref_sus0010, 'Ventes agrégées F-25-030(2) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- TAB-0003 | OUT -11 | F-25-031(3)+F-25-042(8) | 41 → 30
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_tab0003;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_tab0003, 'OUT', -11, v_stock, v_stock - 11, 'sales_aggregate', v_ref_tab0003, 'Ventes agrégées F-25-031(3)+F-25-042(8) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  -- VAS-0034 | OUT -2 | F-25-030(1)+F-25-049(1) | 11 → 9
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_vas0034;
  INSERT INTO stock_movements (product_id, movement_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, notes, performed_by, performed_at, reason_code, affects_forecast)
  VALUES (v_pid_vas0034, 'OUT', -2, v_stock, v_stock - 2, 'sales_aggregate', v_ref_vas0034, 'Ventes agrégées F-25-030(1)+F-25-049(1) — régularisation depuis facture 2025-049', v_admin_id, '2026-02-23 23:00:00+00'::timestamptz, 'sale', false);

  RAISE NOTICE 'Étape 2 ✓ : 18 mouvements OUT agrégés créés';

  -- ========================================================================
  -- ÉTAPE 3 — VÉRIFICATION FINALE
  -- stock_real doit correspondre exactement aux valeurs attendues
  -- ========================================================================
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_ban0001;
  IF v_stock != v_expected_ban0001 THEN RAISE EXCEPTION 'ABORT: BAN-0001 stock_real=% (attendu: %)', v_stock, v_expected_ban0001; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_ban0008;
  IF v_stock != v_expected_ban0008 THEN RAISE EXCEPTION 'ABORT: BAN-0008 stock_real=% (attendu: %)', v_stock, v_expected_ban0008; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0001;
  IF v_stock != v_expected_dec0001 THEN RAISE EXCEPTION 'ABORT: DEC-0001 stock_real=% (attendu: %)', v_stock, v_expected_dec0001; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0002;
  IF v_stock != v_expected_dec0002 THEN RAISE EXCEPTION 'ABORT: DEC-0002 stock_real=% (attendu: %)', v_stock, v_expected_dec0002; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0003;
  IF v_stock != v_expected_dec0003 THEN RAISE EXCEPTION 'ABORT: DEC-0003 stock_real=% (attendu: %)', v_stock, v_expected_dec0003; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0004;
  IF v_stock != v_expected_dec0004 THEN RAISE EXCEPTION 'ABORT: DEC-0004 stock_real=% (attendu: %)', v_stock, v_expected_dec0004; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_dec0005;
  IF v_stock != v_expected_dec0005 THEN RAISE EXCEPTION 'ABORT: DEC-0005 stock_real=% (attendu: %)', v_stock, v_expected_dec0005; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_meu0001;
  IF v_stock != v_expected_meu0001 THEN RAISE EXCEPTION 'ABORT: MEU-0001 stock_real=% (attendu: %)', v_stock, v_expected_meu0001; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_pla0001;
  IF v_stock != v_expected_pla0001 THEN RAISE EXCEPTION 'ABORT: PLA-0001 stock_real=% (attendu: %)', v_stock, v_expected_pla0001; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sep0001;
  IF v_stock != v_expected_sep0001 THEN RAISE EXCEPTION 'ABORT: SEP-0001 stock_real=% (attendu: %)', v_stock, v_expected_sep0001; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0002;
  IF v_stock != v_expected_sus0002 THEN RAISE EXCEPTION 'ABORT: SUS-0002 stock_real=% (attendu: %)', v_stock, v_expected_sus0002; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0003;
  IF v_stock != v_expected_sus0003 THEN RAISE EXCEPTION 'ABORT: SUS-0003 stock_real=% (attendu: %)', v_stock, v_expected_sus0003; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0005;
  IF v_stock != v_expected_sus0005 THEN RAISE EXCEPTION 'ABORT: SUS-0005 stock_real=% (attendu: %)', v_stock, v_expected_sus0005; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0006;
  IF v_stock != v_expected_sus0006 THEN RAISE EXCEPTION 'ABORT: SUS-0006 stock_real=% (attendu: %)', v_stock, v_expected_sus0006; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0007;
  IF v_stock != v_expected_sus0007 THEN RAISE EXCEPTION 'ABORT: SUS-0007 stock_real=% (attendu: %)', v_stock, v_expected_sus0007; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_sus0010;
  IF v_stock != v_expected_sus0010 THEN RAISE EXCEPTION 'ABORT: SUS-0010 stock_real=% (attendu: %)', v_stock, v_expected_sus0010; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_tab0003;
  IF v_stock != v_expected_tab0003 THEN RAISE EXCEPTION 'ABORT: TAB-0003 stock_real=% (attendu: %)', v_stock, v_expected_tab0003; END IF;
  SELECT stock_real INTO v_stock FROM products WHERE id = v_pid_vas0034;
  IF v_stock != v_expected_vas0034 THEN RAISE EXCEPTION 'ABORT: VAS-0034 stock_real=% (attendu: %)', v_stock, v_expected_vas0034; END IF;

  RAISE NOTICE '✅ Migration réussie — 19 mouvements créés (1 ADJUST + 18 OUT agrégés)';
  RAISE NOTICE 'BAN-0001=42 | BAN-0008=3 | DEC-0001=9 | DEC-0002=0 | DEC-0003=2 | DEC-0004=4 | DEC-0005=1';
  RAISE NOTICE 'MEU-0001=15 | PLA-0001=687 | SEP-0001=13 | SUS-0002=32 | SUS-0003=31 | SUS-0005=5';
  RAISE NOTICE 'SUS-0006=39 | SUS-0007=24 | SUS-0010=0 | TAB-0003=30 | VAS-0034=9';

END $$;
