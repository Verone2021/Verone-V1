-- =============================================================================
-- Migration: Promotion System Upgrade
-- Date: 2026-04-12
-- Description:
--   1. Add targeting & automation columns to order_discounts
--   2. Create order_discount_targets (product/collection targeting)
--   3. Create promotion_usages (audit trail per order)
--   4. Add discount tracking columns to sales_orders
--   5. RLS policies for new tables
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extend order_discounts with targeting & automation
-- ---------------------------------------------------------------------------

ALTER TABLE order_discounts
  ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'all'
    CHECK (target_type IN ('all', 'products', 'collections')),
  ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS exclude_sale_items BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN order_discounts.target_type IS 'all = applies to entire order, products = specific products, collections = specific collections';
COMMENT ON COLUMN order_discounts.is_automatic IS 'If true, discount is auto-applied without code entry (Shopify-style)';
COMMENT ON COLUMN order_discounts.exclude_sale_items IS 'If true, items already on sale (channel_pricing.discount_rate > 0) are excluded';

-- Make code nullable for automatic promos (no code needed)
ALTER TABLE order_discounts
  ALTER COLUMN code DROP NOT NULL;

-- Add free_shipping as valid discount_type
-- (discount_type is varchar, no enum constraint — just documenting)
COMMENT ON COLUMN order_discounts.discount_type IS 'percentage | fixed_amount | free_shipping';

-- ---------------------------------------------------------------------------
-- 2. Create order_discount_targets (product/collection targeting)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_discount_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES order_discounts(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('product', 'collection')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_discount_targets_discount_id
  ON order_discount_targets(discount_id);

CREATE INDEX IF NOT EXISTS idx_order_discount_targets_target
  ON order_discount_targets(target_type, target_id);

COMMENT ON TABLE order_discount_targets IS 'Links a promo to specific products or collections. Empty = applies to all (when order_discounts.target_type = all)';

-- ---------------------------------------------------------------------------
-- 3. Create promotion_usages (audit trail)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS promotion_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_id UUID NOT NULL REFERENCES order_discounts(id) ON DELETE RESTRICT,
  order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES individual_customers(id) ON DELETE SET NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_discount_id
  ON promotion_usages(discount_id);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_order_id
  ON promotion_usages(order_id);

CREATE INDEX IF NOT EXISTS idx_promotion_usages_customer_id
  ON promotion_usages(customer_id);

-- Unique constraint: one promo per order (no double-counting)
CREATE UNIQUE INDEX IF NOT EXISTS idx_promotion_usages_unique_order_discount
  ON promotion_usages(discount_id, order_id);

COMMENT ON TABLE promotion_usages IS 'Tracks every promo redemption with the actual discount amount. Used for ROI reporting and per-customer limit enforcement.';

-- ---------------------------------------------------------------------------
-- 4. Add discount tracking to sales_orders
-- ---------------------------------------------------------------------------

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS applied_discount_id UUID REFERENCES order_discounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applied_discount_code VARCHAR,
  ADD COLUMN IF NOT EXISTS applied_discount_amount NUMERIC DEFAULT 0;

COMMENT ON COLUMN sales_orders.applied_discount_id IS 'FK to order_discounts — which promo was used';
COMMENT ON COLUMN sales_orders.applied_discount_code IS 'Snapshot of the promo code at order time (denormalized for reporting)';
COMMENT ON COLUMN sales_orders.applied_discount_amount IS 'Actual discount amount in EUR applied to this order';

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

-- order_discount_targets: staff full access
ALTER TABLE order_discount_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_order_discount_targets"
  ON order_discount_targets
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Authenticated users can read targets (needed for promo validation on site)
CREATE POLICY "authenticated_read_order_discount_targets"
  ON order_discount_targets
  FOR SELECT TO authenticated
  USING (true);

-- promotion_usages: staff full access
ALTER TABLE promotion_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_full_access_promotion_usages"
  ON promotion_usages
  FOR ALL TO authenticated
  USING (is_backoffice_user());

-- Authenticated users can insert (webhook inserts after payment)
CREATE POLICY "authenticated_insert_promotion_usages"
  ON promotion_usages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can read their own usages (for per-customer limit check)
CREATE POLICY "authenticated_read_own_promotion_usages"
  ON promotion_usages
  FOR SELECT TO authenticated
  USING (true);
