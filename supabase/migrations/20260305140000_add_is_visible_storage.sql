-- Add is_visible column to storage_allocations
-- Controls product visibility on the LinkMe affiliate side
ALTER TABLE storage_allocations
ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN storage_allocations.is_visible
IS 'Controls product visibility on the LinkMe affiliate side. False = hidden from affiliate.';

-- Update get_storage_details RPC to include is_visible (return type changed, must DROP first)
DROP FUNCTION IF EXISTS get_storage_details(uuid, uuid);

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
  is_visible BOOLEAN,
  allocated_at TIMESTAMPTZ,
  storage_start_date DATE,
  product_image_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    a.is_visible,
    a.allocated_at,
    COALESCE(a.storage_start_date, a.allocated_at::date) AS storage_start_date,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id
      ORDER BY pi.display_order ASC NULLS LAST
      LIMIT 1
    ) AS product_image_url
  FROM storage_allocations a
  LEFT JOIN products p ON p.id = a.product_id
  WHERE (
    (p_owner_enseigne_id IS NOT NULL AND a.owner_enseigne_id = p_owner_enseigne_id) OR
    (p_owner_organisation_id IS NOT NULL AND a.owner_organisation_id = p_owner_organisation_id)
  )
  ORDER BY a.allocated_at DESC;
END;
$$;
