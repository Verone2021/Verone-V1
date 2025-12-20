-- =====================================================
-- MIGRATION: Rename affiliate_storage_allocations to storage_allocations
-- Date: 2025-12-20
-- Description: Nom plus generique pour permettre stockage clients (pas seulement affilies)
-- =====================================================

-- =====================================================
-- PARTIE 1: Renommer la table
-- =====================================================

ALTER TABLE IF EXISTS affiliate_storage_allocations
RENAME TO storage_allocations;

-- =====================================================
-- PARTIE 2: Renommer les index
-- =====================================================

ALTER INDEX IF EXISTS affiliate_storage_allocations_pkey
RENAME TO storage_allocations_pkey;

-- =====================================================
-- PARTIE 3: Mettre a jour le trigger
-- =====================================================

-- Drop old trigger
DROP TRIGGER IF EXISTS trg_storage_billing_event ON storage_allocations;

-- Recreate trigger function with updated table name
CREATE OR REPLACE FUNCTION log_storage_billing_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product RECORD;
  v_volume_unit NUMERIC;
  v_volume_change NUMERIC;
  v_qty_change INTEGER;
  v_source TEXT;
BEGIN
  -- Get product dimensions
  SELECT dimensions INTO v_product FROM products WHERE id = COALESCE(NEW.product_id, OLD.product_id);

  -- Calculate unit volume
  v_volume_unit := calc_product_volume_m3(v_product.dimensions);

  IF TG_OP = 'INSERT' THEN
    v_qty_change := NEW.stock_quantity;
    v_volume_change := v_volume_unit * NEW.stock_quantity;
    v_source := 'allocation_create';

    INSERT INTO storage_billing_events (
      owner_enseigne_id,
      owner_organisation_id,
      product_id,
      qty_change,
      volume_m3_change,
      billable,
      happened_at,
      source,
      reference_id,
      created_by
    ) VALUES (
      NEW.owner_enseigne_id,
      NEW.owner_organisation_id,
      NEW.product_id,
      v_qty_change,
      v_volume_change,
      NEW.billable_in_storage,
      NEW.allocated_at,
      v_source,
      NEW.id,
      auth.uid()
    );

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.stock_quantity != NEW.stock_quantity THEN
      v_qty_change := NEW.stock_quantity - OLD.stock_quantity;
      v_volume_change := v_volume_unit * v_qty_change;
      v_source := 'allocation_update';

      INSERT INTO storage_billing_events (
        owner_enseigne_id,
        owner_organisation_id,
        product_id,
        qty_change,
        volume_m3_change,
        billable,
        happened_at,
        source,
        reference_id,
        created_by
      ) VALUES (
        NEW.owner_enseigne_id,
        NEW.owner_organisation_id,
        NEW.product_id,
        v_qty_change,
        v_volume_change,
        NEW.billable_in_storage,
        NOW(),
        v_source,
        NEW.id,
        auth.uid()
      );
    END IF;

    IF OLD.billable_in_storage != NEW.billable_in_storage THEN
      INSERT INTO storage_billing_events (
        owner_enseigne_id,
        owner_organisation_id,
        product_id,
        qty_change,
        volume_m3_change,
        billable,
        happened_at,
        source,
        reference_id,
        created_by
      ) VALUES (
        NEW.owner_enseigne_id,
        NEW.owner_organisation_id,
        NEW.product_id,
        0,
        0,
        NEW.billable_in_storage,
        NOW(),
        'billable_toggle',
        NEW.id,
        auth.uid()
      );
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_qty_change := -OLD.stock_quantity;
    v_volume_change := v_volume_unit * v_qty_change;
    v_source := 'allocation_delete';

    INSERT INTO storage_billing_events (
      owner_enseigne_id,
      owner_organisation_id,
      product_id,
      qty_change,
      volume_m3_change,
      billable,
      happened_at,
      source,
      reference_id,
      created_by
    ) VALUES (
      OLD.owner_enseigne_id,
      OLD.owner_organisation_id,
      OLD.product_id,
      v_qty_change,
      v_volume_change,
      OLD.billable_in_storage,
      NOW(),
      v_source,
      OLD.id,
      auth.uid()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate trigger on renamed table
CREATE TRIGGER trg_storage_billing_event
  AFTER INSERT OR UPDATE OR DELETE ON storage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION log_storage_billing_event();

-- =====================================================
-- PARTIE 4: Mettre a jour les RPC qui referent a l'ancienne table
-- =====================================================

-- Update get_affiliate_storage_summary
CREATE OR REPLACE FUNCTION get_affiliate_storage_summary(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT,
  billable_products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT,
    COALESCE(SUM(a.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC,
    COALESCE(SUM(CASE WHEN a.billable_in_storage THEN a.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC,
    COUNT(DISTINCT a.product_id)::BIGINT,
    COUNT(DISTINCT CASE WHEN a.billable_in_storage THEN a.product_id END)::BIGINT
  FROM storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id
  WHERE (
    (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
    (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
  );
END;
$$;

-- Update get_storage_details
CREATE OR REPLACE FUNCTION get_storage_details(
  p_owner_enseigne_id UUID DEFAULT NULL,
  p_owner_organisation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  allocation_id UUID,
  product_id UUID,
  product_name TEXT,
  product_sku TEXT,
  stock_quantity INTEGER,
  unit_volume_m3 NUMERIC,
  total_volume_m3 NUMERIC,
  billable_in_storage BOOLEAN,
  allocated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS allocation_id,
    a.product_id,
    p.name::TEXT AS product_name,
    p.sku::TEXT AS product_sku,
    a.stock_quantity,
    calc_product_volume_m3(p.dimensions) AS unit_volume_m3,
    (a.stock_quantity * calc_product_volume_m3(p.dimensions)) AS total_volume_m3,
    a.billable_in_storage,
    a.allocated_at
  FROM storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id
  WHERE (
    (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
    (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
  )
  ORDER BY a.allocated_at DESC;
END;
$$;

-- Update get_all_storage_overview
CREATE OR REPLACE FUNCTION get_all_storage_overview()
RETURNS TABLE (
  owner_id UUID,
  owner_type TEXT,
  owner_name TEXT,
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Enseignes
  SELECT
    e.id AS owner_id,
    'enseigne'::TEXT AS owner_type,
    e.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(a.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN a.billable_in_storage THEN a.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM enseignes e
  INNER JOIN storage_allocations a ON a.owner_enseigne_id = e.id
  LEFT JOIN products p ON p.id = a.product_id
  GROUP BY e.id, e.name

  UNION ALL

  -- Organisations
  SELECT
    o.id AS owner_id,
    'organisation'::TEXT AS owner_type,
    o.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(a.stock_quantity * calc_product_volume_m3(p.dimensions)), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(CASE WHEN a.billable_in_storage THEN a.stock_quantity * calc_product_volume_m3(p.dimensions) ELSE 0 END), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM organisations o
  INNER JOIN storage_allocations a ON a.owner_organisation_id = o.id
  LEFT JOIN products p ON p.id = a.product_id
  GROUP BY o.id, o.name

  ORDER BY billable_volume_m3 DESC;
END;
$$;

-- Update get_global_storage_overview (uses storage_allocations)
CREATE OR REPLACE FUNCTION get_global_storage_overview()
RETURNS TABLE (
  owner_type TEXT,
  owner_id UUID,
  owner_name TEXT,
  total_units BIGINT,
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  products_count BIGINT,
  billable_products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  -- Enseigne owners
  SELECT
    'enseigne'::TEXT AS owner_type,
    e.id AS owner_id,
    e.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count,
    COUNT(DISTINCT CASE WHEN a.billable_in_storage THEN a.product_id END)::BIGINT AS billable_products_count
  FROM enseignes e
  LEFT JOIN storage_allocations a ON a.owner_enseigne_id = e.id
  LEFT JOIN products p ON p.id = a.product_id
  WHERE EXISTS (
    SELECT 1 FROM storage_allocations sa
    WHERE sa.owner_enseigne_id = e.id
  )
  GROUP BY e.id, e.name

  UNION ALL

  -- Organisation owners
  SELECT
    'organisation'::TEXT AS owner_type,
    o.id AS owner_id,
    o.name::TEXT AS owner_name,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count,
    COUNT(DISTINCT CASE WHEN a.billable_in_storage THEN a.product_id END)::BIGINT AS billable_products_count
  FROM organisations o
  LEFT JOIN storage_allocations a ON a.owner_organisation_id = o.id
  LEFT JOIN products p ON p.id = a.product_id
  WHERE EXISTS (
    SELECT 1 FROM storage_allocations sa
    WHERE sa.owner_organisation_id = o.id
  )
  GROUP BY o.id, o.name

  ORDER BY billable_volume_m3 DESC;
END;
$$;

-- Update get_storage_totals
CREATE OR REPLACE FUNCTION get_storage_totals()
RETURNS TABLE (
  total_volume_m3 NUMERIC,
  billable_volume_m3 NUMERIC,
  total_units BIGINT,
  active_owners BIGINT,
  products_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check admin access
  IF NOT EXISTS (
    SELECT 1 FROM user_app_roles uar
    WHERE uar.user_id = auth.uid()
      AND uar.app = 'back-office'
      AND uar.is_active = true
  ) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    COALESCE(SUM(
      a.stock_quantity * calc_product_volume_m3(p.dimensions)
    ), 0)::NUMERIC AS total_volume_m3,
    COALESCE(SUM(
      CASE WHEN a.billable_in_storage THEN
        a.stock_quantity * calc_product_volume_m3(p.dimensions)
      ELSE 0 END
    ), 0)::NUMERIC AS billable_volume_m3,
    COALESCE(SUM(a.stock_quantity), 0)::BIGINT AS total_units,
    (
      COUNT(DISTINCT a.owner_enseigne_id) +
      COUNT(DISTINCT a.owner_organisation_id)
    )::BIGINT AS active_owners,
    COUNT(DISTINCT a.product_id)::BIGINT AS products_count
  FROM storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id;
END;
$$;

-- =====================================================
-- PARTIE 5: Mettre a jour les RLS policies
-- =====================================================

-- Drop old policies (if exist with old name references)
DROP POLICY IF EXISTS "Affiliate view own storage allocations" ON storage_allocations;
DROP POLICY IF EXISTS "Admin view all storage allocations" ON storage_allocations;
DROP POLICY IF EXISTS "Admin manage storage allocations" ON storage_allocations;

-- Create new policies with generic names
CREATE POLICY "Owner view own storage allocations"
  ON storage_allocations FOR SELECT
  USING (
    -- Admin back-office can see all
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
    OR
    -- Owner can see their own (enseigne)
    (
      owner_enseigne_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_app_roles uar
        WHERE uar.user_id = auth.uid()
          AND uar.enseigne_id = storage_allocations.owner_enseigne_id
          AND uar.is_active = true
      )
    )
    OR
    -- Owner can see their own (organisation)
    (
      owner_organisation_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM user_app_roles uar
        WHERE uar.user_id = auth.uid()
          AND uar.organisation_id = storage_allocations.owner_organisation_id
          AND uar.is_active = true
      )
    )
  );

CREATE POLICY "Admin manage storage allocations"
  ON storage_allocations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
  );

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
