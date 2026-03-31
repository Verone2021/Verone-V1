-- RPCs for Meta Commerce status sync from Graph API

-- Get synced records with SKU for matching against Meta retailer_id
CREATE OR REPLACE FUNCTION get_meta_sync_records_for_status_update()
RETURNS TABLE(
  sync_id UUID,
  product_id UUID,
  sku TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    mcs.id AS sync_id,
    mcs.product_id,
    p.sku
  FROM meta_commerce_syncs mcs
  JOIN products p ON p.id = mcs.product_id
  WHERE mcs.sync_status = 'synced';
$$;

-- Update a single sync record with Meta product ID and status
CREATE OR REPLACE FUNCTION update_meta_sync_status(
  p_sync_id UUID,
  p_meta_product_id TEXT,
  p_meta_status TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE meta_commerce_syncs
  SET
    meta_product_id = p_meta_product_id,
    meta_status = p_meta_status,
    synced_at = NOW(),
    updated_at = NOW()
  WHERE id = p_sync_id;
$$;
