-- Migration: Add linkme_display_number to sales_orders
-- Sequential order number per affiliate, displayed exclusively on LinkMe
-- Format: {PREFIX}-{N} (e.g., BWB-1, BWB-2, POK-1, VRON-1)

-- 1. Add column
ALTER TABLE sales_orders ADD COLUMN linkme_display_number TEXT;

-- 2. Backfill: assign sequential numbers per affiliate, ordered by created_at
WITH numbered AS (
  SELECT id, created_by_affiliate_id,
    ROW_NUMBER() OVER (
      PARTITION BY created_by_affiliate_id
      ORDER BY created_at
    ) as seq
  FROM sales_orders
  WHERE created_by_affiliate_id IS NOT NULL
)
UPDATE sales_orders so
SET linkme_display_number = (
  SELECT COALESCE(la.order_code, 'LNK') || '-' || n.seq
  FROM numbered n
  JOIN linkme_affiliates la ON la.id = n.created_by_affiliate_id
  WHERE n.id = so.id
)
FROM numbered n
WHERE n.id = so.id;

-- 3. Index for performance (search by display number)
CREATE INDEX idx_sales_orders_linkme_display_number
ON sales_orders(linkme_display_number) WHERE linkme_display_number IS NOT NULL;

-- 4. Trigger: auto-assign linkme_display_number on INSERT
CREATE OR REPLACE FUNCTION assign_linkme_display_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prefix TEXT;
  v_next_seq INT;
BEGIN
  -- Only for orders with an affiliate
  IF NEW.created_by_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get affiliate prefix
  SELECT COALESCE(order_code, 'LNK') INTO v_prefix
  FROM linkme_affiliates WHERE id = NEW.created_by_affiliate_id;

  -- Calculate next sequential number for this affiliate
  SELECT COALESCE(MAX(
    NULLIF(SPLIT_PART(linkme_display_number, '-', 2), '')::INT
  ), 0) + 1 INTO v_next_seq
  FROM sales_orders
  WHERE created_by_affiliate_id = NEW.created_by_affiliate_id
    AND linkme_display_number IS NOT NULL;

  NEW.linkme_display_number := v_prefix || '-' || v_next_seq;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_linkme_display_number
BEFORE INSERT ON sales_orders
FOR EACH ROW
EXECUTE FUNCTION assign_linkme_display_number();

-- Documentation
COMMENT ON COLUMN sales_orders.linkme_display_number IS 'Sequential order number per affiliate, displayed on LinkMe (e.g., BWB-1, POK-2)';
COMMENT ON FUNCTION assign_linkme_display_number() IS 'Auto-assigns sequential linkme_display_number on sales_orders INSERT when created_by_affiliate_id is set';
