-- Migration: Create affiliate storage allocations table
-- Description: Tracks storage allocations for affiliate products with volume calculations

-- Create the storage allocations table
CREATE TABLE IF NOT EXISTS affiliate_storage_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product reference
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  -- Owner (XOR constraint: exactly one must be set)
  owner_enseigne_id UUID REFERENCES enseignes(id) ON DELETE CASCADE,
  owner_organisation_id UUID REFERENCES organisations(id) ON DELETE CASCADE,

  -- Storage data
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  billable_in_storage BOOLEAN NOT NULL DEFAULT true,

  -- Audit timestamps
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- XOR constraint: exactly one owner type
  CONSTRAINT chk_storage_owner_xor CHECK (
    (owner_enseigne_id IS NOT NULL AND owner_organisation_id IS NULL) OR
    (owner_enseigne_id IS NULL AND owner_organisation_id IS NOT NULL)
  )
);

-- Unique index: one allocation per product per owner (using COALESCE for functional uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_product_owner_unique
  ON affiliate_storage_allocations (
    product_id,
    COALESCE(owner_enseigne_id, '00000000-0000-0000-0000-000000000000'::UUID),
    COALESCE(owner_organisation_id, '00000000-0000-0000-0000-000000000000'::UUID)
  );

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_storage_owner_enseigne
  ON affiliate_storage_allocations(owner_enseigne_id)
  WHERE owner_enseigne_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storage_owner_org
  ON affiliate_storage_allocations(owner_organisation_id)
  WHERE owner_organisation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_storage_billable
  ON affiliate_storage_allocations(billable_in_storage)
  WHERE billable_in_storage = true;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_storage_allocation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_storage_allocation_updated_at
  BEFORE UPDATE ON affiliate_storage_allocations
  FOR EACH ROW
  EXECUTE FUNCTION update_storage_allocation_updated_at();

-- Enable RLS
ALTER TABLE affiliate_storage_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Affiliate can view own storage (via enseigne or organisation)
CREATE POLICY "Affiliate view own storage"
  ON affiliate_storage_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'linkme'
        AND uar.is_active = true
        AND (
          uar.enseigne_id = affiliate_storage_allocations.owner_enseigne_id OR
          uar.organisation_id = affiliate_storage_allocations.owner_organisation_id
        )
    )
  );

-- Admin can view all storage
CREATE POLICY "Admin view all storage"
  ON affiliate_storage_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
  );

-- Admin can manage storage
CREATE POLICY "Admin manage storage"
  ON affiliate_storage_allocations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_app_roles uar
      WHERE uar.user_id = auth.uid()
        AND uar.app = 'back-office'
        AND uar.is_active = true
    )
  );

-- Comments
COMMENT ON TABLE affiliate_storage_allocations IS
  'Tracks storage allocations for affiliate products in Verone warehouse';

COMMENT ON COLUMN affiliate_storage_allocations.stock_quantity IS
  'Number of units stored';

COMMENT ON COLUMN affiliate_storage_allocations.billable_in_storage IS
  'Whether this allocation counts toward monthly storage billing';
