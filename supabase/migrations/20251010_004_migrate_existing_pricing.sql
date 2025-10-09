-- =====================================================================
-- Migration: Migrate Existing Pricing Data
-- =====================================================================
-- Date: 2025-10-10
-- Version: 2.0.0
-- Auteur: Claude Code - Vérone Back Office
--
-- Description:
-- Migration des données pricing existantes vers nouvelle architecture
-- Création prix catalogue BASE pour tous produits
-- Association canaux et listes de prix
-- Nettoyage anciennes structures
-- =====================================================================

-- =====================================================================
-- 1. CRÉATION LISTES DE PRIX PAR CANAL
-- =====================================================================

DO $$
DECLARE
  v_base_list_id UUID;
  v_retail_list_id UUID;
  v_wholesale_list_id UUID;
  v_ecommerce_list_id UUID;
  v_b2b_list_id UUID;
  v_product_count INTEGER;
BEGIN
  -- Récupérer ID liste BASE
  SELECT id INTO v_base_list_id
  FROM price_lists
  WHERE code = 'CATALOG_BASE_2025';

  -- Créer listes par canal si n'existent pas
  INSERT INTO price_lists (code, name, description, list_type, priority, currency, is_active)
  VALUES
    ('RETAIL_STANDARD_2025', 'Retail Standard 2025', 'Prix magasin physique et showroom', 'channel', 200, 'EUR', TRUE),
    ('WHOLESALE_STANDARD_2025', 'Wholesale Standard 2025', 'Prix grossistes avec remise 20%', 'channel', 150, 'EUR', TRUE),
    ('ECOMMERCE_STANDARD_2025', 'E-Commerce Standard 2025', 'Prix boutique en ligne B2C', 'channel', 200, 'EUR', TRUE),
    ('B2B_STANDARD_2025', 'B2B Standard 2025', 'Prix plateforme B2B avec remise 15%', 'channel', 180, 'EUR', TRUE)
  ON CONFLICT (code) DO NOTHING;

  -- Récupérer IDs listes créées
  SELECT id INTO v_retail_list_id FROM price_lists WHERE code = 'RETAIL_STANDARD_2025';
  SELECT id INTO v_wholesale_list_id FROM price_lists WHERE code = 'WHOLESALE_STANDARD_2025';
  SELECT id INTO v_ecommerce_list_id FROM price_lists WHERE code = 'ECOMMERCE_STANDARD_2025';
  SELECT id INTO v_b2b_list_id FROM price_lists WHERE code = 'B2B_STANDARD_2025';

  RAISE NOTICE '📋 Listes de prix par canal créées';

  -- =====================================================================
  -- 2. MIGRATION PRIX PRODUITS VERS LISTE BASE
  -- =====================================================================

  -- Si des produits ont un cost_price, l'utiliser comme prix de base
  INSERT INTO price_list_items (
    price_list_id,
    product_id,
    price_ht,
    min_quantity,
    is_active,
    created_at,
    notes
  )
  SELECT
    v_base_list_id,
    p.id,
    CASE
      -- Si cost_price existe et > 0, appliquer marge standard 40%
      WHEN p.cost_price IS NOT NULL AND p.cost_price > 0 THEN
        ROUND(p.cost_price * 1.40, 2)
      -- Sinon prix par défaut
      ELSE 100.00
    END as price_ht,
    1 as min_quantity,
    TRUE as is_active,
    NOW() as created_at,
    'Migration automatique depuis cost_price avec marge 40%' as notes
  FROM products p
  WHERE NOT EXISTS (
    SELECT 1 FROM price_list_items pli
    WHERE pli.product_id = p.id
      AND pli.price_list_id = v_base_list_id
  );

  GET DIAGNOSTICS v_product_count = ROW_COUNT;
  RAISE NOTICE '✅ % prix produits migrés vers liste BASE', v_product_count;

  -- =====================================================================
  -- 3. ASSOCIATION CANAUX ET LISTES DE PRIX
  -- =====================================================================

  -- Associer listes aux canaux
  INSERT INTO channel_price_lists (channel_id, price_list_id, priority, is_default, is_active)
  SELECT
    sc.id as channel_id,
    CASE sc.code
      WHEN 'retail' THEN v_retail_list_id
      WHEN 'wholesale' THEN v_wholesale_list_id
      WHEN 'ecommerce' THEN v_ecommerce_list_id
      WHEN 'b2b' THEN v_b2b_list_id
    END as price_list_id,
    100 as priority,
    TRUE as is_default,
    TRUE as is_active
  FROM sales_channels sc
  WHERE sc.code IN ('retail', 'wholesale', 'ecommerce', 'b2b')
  ON CONFLICT (channel_id, price_list_id) DO NOTHING;

  -- Associer aussi la liste BASE à tous les canaux (fallback)
  INSERT INTO channel_price_lists (channel_id, price_list_id, priority, is_default, is_active)
  SELECT
    sc.id as channel_id,
    v_base_list_id as price_list_id,
    1000 as priority,  -- Priorité basse (fallback)
    FALSE as is_default,
    TRUE as is_active
  FROM sales_channels sc
  ON CONFLICT (channel_id, price_list_id) DO NOTHING;

  RAISE NOTICE '✅ Canaux associés aux listes de prix';

  -- =====================================================================
  -- 4. MIGRATION DONNÉES channel_pricing EXISTANTES
  -- =====================================================================

  -- Si table channel_pricing existe avec données, migrer vers nouvelles listes
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'channel_pricing'
  ) THEN
    -- Migrer prix spécifiques par canal
    INSERT INTO price_list_items (
      price_list_id,
      product_id,
      price_ht,
      min_quantity,
      discount_rate,
      is_active,
      notes
    )
    SELECT
      CASE
        WHEN sc.code = 'retail' THEN v_retail_list_id
        WHEN sc.code = 'wholesale' THEN v_wholesale_list_id
        WHEN sc.code = 'ecommerce' THEN v_ecommerce_list_id
        WHEN sc.code = 'b2b' THEN v_b2b_list_id
      END as price_list_id,
      cp.product_id,
      COALESCE(cp.custom_price_ht,
        (SELECT pli.price_ht FROM price_list_items pli
         WHERE pli.product_id = cp.product_id
           AND pli.price_list_id = v_base_list_id) * (1 - COALESCE(cp.discount_rate, 0))
      ) as price_ht,
      COALESCE(cp.min_quantity, 1),
      cp.discount_rate,
      cp.is_active,
      'Migré depuis channel_pricing'
    FROM channel_pricing cp
    JOIN sales_channels sc ON cp.channel_id = sc.id
    WHERE sc.code IN ('retail', 'wholesale', 'ecommerce', 'b2b')
    ON CONFLICT (price_list_id, product_id, min_quantity) DO NOTHING;

    RAISE NOTICE '✅ Données channel_pricing migrées';
  END IF;

  -- =====================================================================
  -- 5. MIGRATION DONNÉES customer_pricing EXISTANTES
  -- =====================================================================

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'customer_pricing'
  ) THEN
    -- Créer listes prix pour clients avec contrats
    INSERT INTO price_lists (
      code,
      name,
      description,
      list_type,
      priority,
      currency,
      is_active,
      valid_from,
      valid_until
    )
    SELECT DISTINCT
      'CONTRACT_' || LEFT(cp.customer_id::TEXT, 8),
      'Contrat Client ' || COALESCE(cp.contract_reference, LEFT(cp.customer_id::TEXT, 8)),
      'Prix contractuels négociés - ' || COALESCE(cp.contract_reference, 'Migration'),
      'contract',
      50,  -- Haute priorité pour contrats
      'EUR',
      cp.is_active,
      cp.valid_from,
      cp.valid_until
    FROM customer_pricing cp
    WHERE cp.approval_status = 'approved'
    ON CONFLICT (code) DO NOTHING;

    -- Migrer items prix clients
    WITH customer_lists AS (
      SELECT DISTINCT
        cp.customer_id,
        cp.customer_type,
        pl.id as price_list_id
      FROM customer_pricing cp
      JOIN price_lists pl ON pl.code = 'CONTRACT_' || LEFT(cp.customer_id::TEXT, 8)
    )
    INSERT INTO price_list_items (
      price_list_id,
      product_id,
      price_ht,
      min_quantity,
      discount_rate,
      is_active,
      notes
    )
    SELECT
      cl.price_list_id,
      cp.product_id,
      COALESCE(cp.custom_price_ht,
        (SELECT pli.price_ht FROM price_list_items pli
         WHERE pli.product_id = cp.product_id
           AND pli.price_list_id = v_base_list_id) * (1 - COALESCE(cp.discount_rate, 0))
      ) as price_ht,
      COALESCE(cp.min_quantity, 1),
      cp.discount_rate,
      cp.is_active,
      'Migré depuis customer_pricing - ' || COALESCE(cp.contract_reference, '')
    FROM customer_pricing cp
    JOIN customer_lists cl ON cp.customer_id = cl.customer_id
      AND cp.customer_type = cl.customer_type
    WHERE cp.approval_status = 'approved'
    ON CONFLICT (price_list_id, product_id, min_quantity) DO NOTHING;

    -- Associer listes aux clients
    INSERT INTO customer_price_lists (
      customer_id,
      customer_type,
      price_list_id,
      priority,
      is_active,
      contract_reference
    )
    SELECT DISTINCT
      cp.customer_id,
      cp.customer_type,
      pl.id,
      50,
      TRUE,
      cp.contract_reference
    FROM customer_pricing cp
    JOIN price_lists pl ON pl.code = 'CONTRACT_' || LEFT(cp.customer_id::TEXT, 8)
    WHERE cp.approval_status = 'approved'
    ON CONFLICT (customer_id, customer_type, price_list_id) DO NOTHING;

    RAISE NOTICE '✅ Données customer_pricing migrées';
  END IF;

  -- =====================================================================
  -- 6. CRÉATION PRIX PAR DÉFAUT POUR CANAUX AVEC REMISES
  -- =====================================================================

  -- Wholesale : -20% sur tous produits
  INSERT INTO price_list_items (
    price_list_id,
    product_id,
    price_ht,
    min_quantity,
    discount_rate,
    is_active,
    notes
  )
  SELECT
    v_wholesale_list_id,
    pli.product_id,
    ROUND(pli.price_ht * 0.80, 2),  -- -20%
    1,
    0.20,
    TRUE,
    'Prix wholesale avec remise 20%'
  FROM price_list_items pli
  WHERE pli.price_list_id = v_base_list_id
    AND pli.min_quantity = 1
  ON CONFLICT (price_list_id, product_id, min_quantity) DO NOTHING;

  -- B2B : -15% sur tous produits
  INSERT INTO price_list_items (
    price_list_id,
    product_id,
    price_ht,
    min_quantity,
    discount_rate,
    is_active,
    notes
  )
  SELECT
    v_b2b_list_id,
    pli.product_id,
    ROUND(pli.price_ht * 0.85, 2),  -- -15%
    1,
    0.15,
    TRUE,
    'Prix B2B avec remise 15%'
  FROM price_list_items pli
  WHERE pli.price_list_id = v_base_list_id
    AND pli.min_quantity = 1
  ON CONFLICT (price_list_id, product_id, min_quantity) DO NOTHING;

  RAISE NOTICE '✅ Prix par défaut créés pour canaux avec remises';

END $$;

-- =====================================================================
-- 7. ASSOCIATION GROUPES CLIENTS ET LISTES
-- =====================================================================

-- Associer groupe B2B_STANDARD à liste B2B
INSERT INTO group_price_lists (group_id, price_list_id, priority, is_default, is_active)
SELECT
  cg.id,
  pl.id,
  100,
  TRUE,
  TRUE
FROM customer_groups cg, price_lists pl
WHERE cg.code = 'B2B_STANDARD'
  AND pl.code = 'B2B_STANDARD_2025'
ON CONFLICT (group_id, price_list_id) DO NOTHING;

-- Associer groupe WHOLESALE à liste wholesale
INSERT INTO group_price_lists (group_id, price_list_id, priority, is_default, is_active)
SELECT
  cg.id,
  pl.id,
  100,
  TRUE,
  TRUE
FROM customer_groups cg, price_lists pl
WHERE cg.code = 'WHOLESALE'
  AND pl.code = 'WHOLESALE_STANDARD_2025'
ON CONFLICT (group_id, price_list_id) DO NOTHING;

-- =====================================================================
-- 8. UPDATE FONCTION calculate_product_price POUR UTILISER NOUVELLES TABLES
-- =====================================================================

-- Renommer ancienne fonction si existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'calculate_product_price'
  ) THEN
    ALTER FUNCTION calculate_product_price RENAME TO calculate_product_price_old;
    RAISE NOTICE '⚠️ Ancienne fonction calculate_product_price renommée en calculate_product_price_old';
  END IF;
END $$;

-- =====================================================================
-- 9. NETTOYAGE (OPTIONNEL - COMMENTÉ POUR SÉCURITÉ)
-- =====================================================================

-- Pour activer le nettoyage, décommenter les lignes suivantes :

-- DROP TABLE IF EXISTS channel_pricing CASCADE;
-- DROP TABLE IF EXISTS customer_pricing CASCADE;
-- DROP FUNCTION IF EXISTS calculate_product_price_old CASCADE;

-- ALTER TABLE products DROP COLUMN IF EXISTS price_ht;
-- ALTER TABLE products DROP COLUMN IF EXISTS selling_price;

-- =====================================================================
-- 10. STATISTIQUES MIGRATION
-- =====================================================================

DO $$
DECLARE
  v_price_lists_count INTEGER;
  v_price_items_count INTEGER;
  v_customer_lists_count INTEGER;
  v_channel_lists_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_price_lists_count FROM price_lists;
  SELECT COUNT(*) INTO v_price_items_count FROM price_list_items;
  SELECT COUNT(*) INTO v_customer_lists_count FROM customer_price_lists;
  SELECT COUNT(*) INTO v_channel_lists_count FROM channel_price_lists;

  RAISE NOTICE '=====================================';
  RAISE NOTICE '✅ Migration 20251010_004 terminée';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '📊 Statistiques finales:';
  RAISE NOTICE '  - Listes de prix: %', v_price_lists_count;
  RAISE NOTICE '  - Items de prix: %', v_price_items_count;
  RAISE NOTICE '  - Associations clients: %', v_customer_lists_count;
  RAISE NOTICE '  - Associations canaux: %', v_channel_lists_count;
  RAISE NOTICE '=====================================';
  RAISE NOTICE '⚠️ IMPORTANT: Ancienne fonction calculate_product_price';
  RAISE NOTICE '   renommée en calculate_product_price_old';
  RAISE NOTICE '   Nouvelle fonction sera créée dans migration 005';
  RAISE NOTICE '=====================================';
END $$;