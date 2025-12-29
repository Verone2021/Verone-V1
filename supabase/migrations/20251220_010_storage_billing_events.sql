-- =====================================================
-- MIGRATION: Table storage_billing_events + Trigger
-- Date: 2025-12-20
-- Description: Event-based tracking for storage billing
--              Supports weighted average m3 calculation
-- =====================================================

-- =====================================================
-- PARTIE 1: Table storage_billing_events
-- =====================================================

CREATE TABLE IF NOT EXISTS storage_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Owner (XOR: enseigne OR organisation)
  owner_enseigne_id UUID REFERENCES enseignes(id) ON DELETE CASCADE,
  owner_organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,

  -- Product reference
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  -- Quantity change (positive = add, negative = remove)
  qty_change INTEGER NOT NULL,

  -- Volume change in m3 (calculated from product dimensions * qty_change)
  volume_m3_change NUMERIC(12,6) NOT NULL,

  -- Billable flag at time of event
  billable BOOLEAN NOT NULL DEFAULT true,

  -- When did this event happen
  happened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Source of the event
  source TEXT NOT NULL CHECK (source IN (
    'allocation_create',
    'allocation_update',
    'allocation_delete',
    'billable_toggle',
    'manual_adjustment'
  )),

  -- Reference to source record (allocation id, etc.)
  reference_id UUID,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- XOR constraint: exactly one owner type
  CONSTRAINT xor_storage_event_owner CHECK (
    (owner_enseigne_id IS NOT NULL AND owner_organisation_id IS NULL) OR
    (owner_enseigne_id IS NULL AND owner_organisation_id IS NOT NULL)
  )
);

-- Index for billing queries by owner and date range
CREATE INDEX IF NOT EXISTS idx_storage_events_enseigne_date
  ON storage_billing_events(owner_enseigne_id, happened_at)
  WHERE owner_enseigne_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storage_events_org_date
  ON storage_billing_events(owner_organisation_id, happened_at)
  WHERE owner_organisation_id IS NOT NULL;

-- Index for product history
CREATE INDEX IF NOT EXISTS idx_storage_events_product
  ON storage_billing_events(product_id, happened_at);

-- =====================================================
-- PARTIE 2: Helper function to calculate volume
-- =====================================================

-- Reuse existing calc_product_volume_m3 if exists, otherwise create
CREATE OR REPLACE FUNCTION calc_product_volume_m3(p_dimensions JSONB)
RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_length NUMERIC;
  v_width NUMERIC;
  v_height NUMERIC;
BEGIN
  -- Dimensions are stored in centimeters
  v_length := COALESCE((p_dimensions->>'length_cm')::NUMERIC, 0);
  v_width := COALESCE((p_dimensions->>'width_cm')::NUMERIC, 0);
  v_height := COALESCE((p_dimensions->>'height_cm')::NUMERIC, 0);

  -- If any dimension is 0, return 0
  IF v_length = 0 OR v_width = 0 OR v_height = 0 THEN
    RETURN 0;
  END IF;

  -- Convert cm3 to m3: divide by 1,000,000
  RETURN (v_length * v_width * v_height) / 1000000.0;
END;
$$;

-- =====================================================
-- PARTIE 3: Trigger function for affiliate_storage_allocations
-- =====================================================

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
    -- New allocation created
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
    -- Check if quantity changed
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

    -- Check if billable status changed
    IF OLD.billable_in_storage != NEW.billable_in_storage THEN
      -- Log billable toggle (qty_change = 0, but tracks the change)
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
    -- Allocation removed - negative qty change
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

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trg_storage_billing_event ON affiliate_storage_allocations;

-- Create trigger
CREATE TRIGGER trg_storage_billing_event
  AFTER INSERT OR UPDATE OR DELETE ON affiliate_storage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION log_storage_billing_event();

-- =====================================================
-- PARTIE 4: RLS Policies
-- =====================================================

ALTER TABLE storage_billing_events ENABLE ROW LEVEL SECURITY;

-- Admin back-office can see all events
DROP POLICY IF EXISTS "Admin view all storage events" ON storage_billing_events;
CREATE POLICY "Admin view all storage events"
  ON storage_billing_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
  );

-- LinkMe users can see their own enseigne events
DROP POLICY IF EXISTS "LinkMe view own enseigne events" ON storage_billing_events;
CREATE POLICY "LinkMe view own enseigne events"
  ON storage_billing_events FOR SELECT
  USING (
    owner_enseigne_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND uar.enseigne_id = storage_billing_events.owner_enseigne_id
    )
  );

-- =====================================================
-- PARTIE 5: Grant permissions
-- =====================================================

GRANT SELECT ON storage_billing_events TO authenticated;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
