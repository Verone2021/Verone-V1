-- ============================================================================
-- Optimization: missing_fields_count on sales_order_linkme_details
--
-- Maintains a count of missing required fields (basic ones only).
-- This allows efficient server-side queries like:
--   SELECT COUNT(*) WHERE missing_fields_count > 0
-- instead of loading all orders client-side.
--
-- Note: This counts basic required fields only (requester, billing, delivery).
-- Complex conditional fields (franchise owner, mall email) remain client-side.
-- ============================================================================

-- 1. Add column
ALTER TABLE sales_order_linkme_details
ADD COLUMN IF NOT EXISTS missing_fields_count INT DEFAULT 0;

-- 2. Function to recalculate missing fields count
CREATE OR REPLACE FUNCTION recalc_linkme_missing_fields_count()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT := 0;
  v_org_siret TEXT;
BEGIN
  -- Count basic required fields that are empty
  -- Responsable
  IF COALESCE(NEW.requester_name, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.requester_email, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.requester_phone, '') = '' THEN v_count := v_count + 1; END IF;

  -- Facturation
  IF COALESCE(NEW.billing_name, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.billing_email, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.billing_phone, '') = '' THEN v_count := v_count + 1; END IF;

  -- Livraison
  IF COALESCE(NEW.delivery_contact_name, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.delivery_contact_email, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.delivery_contact_phone, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.delivery_address, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.delivery_postal_code, '') = '' THEN v_count := v_count + 1; END IF;
  IF COALESCE(NEW.delivery_city, '') = '' THEN v_count := v_count + 1; END IF;

  -- Organisation SIRET (cross-table check)
  SELECT o.siret INTO v_org_siret
  FROM sales_orders so
  JOIN organisations o ON o.id = so.customer_id AND so.customer_type = 'organization'
  WHERE so.id = NEW.sales_order_id;

  IF COALESCE(v_org_siret, '') = '' THEN v_count := v_count + 1; END IF;

  NEW.missing_fields_count := v_count;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in recalc_linkme_missing_fields_count: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

DROP TRIGGER IF EXISTS trg_recalc_missing_fields ON sales_order_linkme_details;
CREATE TRIGGER trg_recalc_missing_fields
  BEFORE INSERT OR UPDATE ON sales_order_linkme_details
  FOR EACH ROW
  EXECUTE FUNCTION recalc_linkme_missing_fields_count();

-- 3. Backfill existing rows
UPDATE sales_order_linkme_details SET updated_at = updated_at;

-- 4. Create index for fast count queries
CREATE INDEX IF NOT EXISTS idx_linkme_details_missing_fields
  ON sales_order_linkme_details (missing_fields_count)
  WHERE missing_fields_count > 0;
