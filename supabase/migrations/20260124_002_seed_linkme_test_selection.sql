-- =====================================================
-- MIGRATION: Seed LinkMe test selection for E2E tests
-- Date: 2026-01-24
-- Description: Create active selection with products for Pokawa affiliate
-- =====================================================

DO $$
DECLARE
  v_pokawa_affiliate_id UUID;
  v_selection_id UUID;
  v_product_ids UUID[];
  v_product_id UUID;
  v_base_price NUMERIC;
  v_selling_price NUMERIC;
BEGIN
  -- Get Pokawa affiliate ID
  SELECT la.id INTO v_pokawa_affiliate_id
  FROM linkme_affiliates la
  JOIN user_app_roles uar ON (
    (uar.enseigne_id IS NOT NULL AND uar.enseigne_id = la.enseigne_id) OR
    (uar.organisation_id IS NOT NULL AND uar.organisation_id = la.organisation_id)
  )
  JOIN auth.users u ON u.id = uar.user_id
  WHERE u.email = 'admin@pokawa-test.fr'
    AND uar.app = 'linkme'
    AND la.status = 'active'
  LIMIT 1;

  IF v_pokawa_affiliate_id IS NULL THEN
    RAISE NOTICE 'Pokawa affiliate not found, skipping seed data';
    RETURN;
  END IF;

  RAISE NOTICE 'Found Pokawa affiliate: %', v_pokawa_affiliate_id;

  -- Check if selection already exists
  IF EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE affiliate_id = v_pokawa_affiliate_id
    AND archived_at IS NULL
  ) THEN
    RAISE NOTICE 'Active selection already exists for Pokawa, skipping seed data';
    RETURN;
  END IF;

  -- Create selection
  INSERT INTO linkme_selections (
    affiliate_id,
    name,
    slug,
    description,
    archived_at,
    published_at
  ) VALUES (
    v_pokawa_affiliate_id,
    'Sélection Test E2E 2026',
    'selection-test-e2e-2026',
    'Sélection créée automatiquement pour les tests E2E',
    NULL,
    CURRENT_TIMESTAMP
  )
  RETURNING id INTO v_selection_id;

  RAISE NOTICE 'Created selection: %', v_selection_id;

  -- Get some active products
  SELECT ARRAY_AGG(id) INTO v_product_ids
  FROM products
  WHERE is_active = true
  AND sku IS NOT NULL
  LIMIT 5;

  IF v_product_ids IS NULL OR array_length(v_product_ids, 1) = 0 THEN
    RAISE EXCEPTION 'No active products found';
  END IF;

  RAISE NOTICE 'Found % products', array_length(v_product_ids, 1);

  -- Add products to selection
  FOREACH v_product_id IN ARRAY v_product_ids LOOP
    -- Get product base price
    SELECT COALESCE(price_ht, 100) INTO v_base_price
    FROM products
    WHERE id = v_product_id;

    -- Calculate selling price with margin
    v_selling_price := v_base_price * 1.30; -- 30% margin

    INSERT INTO linkme_selection_items (
      selection_id,
      product_id,
      base_price_ht,
      margin_rate,
      selling_price_ht,
      is_active
    ) VALUES (
      v_selection_id,
      v_product_id,
      v_base_price,
      0.30,
      v_selling_price,
      true
    );
  END LOOP;

  RAISE NOTICE 'Added % items to selection', array_length(v_product_ids, 1);
  RAISE NOTICE 'Seed data created successfully';
END $$;
