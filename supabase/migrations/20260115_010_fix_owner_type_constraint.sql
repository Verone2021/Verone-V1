-- LM-ORD-007 (Suite): Fix owner_type constraint in sales_order_linkme_details
-- Date: 2026-01-15
-- Root cause: CHECK constraint allows ('propre', 'franchise') but RPC inserts 'succursale'
-- Solution: Update constraint to accept ('propre', 'succursale', 'franchise')

-- Drop old constraint
ALTER TABLE sales_order_linkme_details
DROP CONSTRAINT IF EXISTS sales_order_linkme_details_owner_type_check;

-- Add new constraint with correct values
ALTER TABLE sales_order_linkme_details
ADD CONSTRAINT sales_order_linkme_details_owner_type_check
  CHECK (owner_type IN ('propre', 'succursale', 'franchise'));

-- Comment explaining the values
COMMENT ON COLUMN sales_order_linkme_details.owner_type IS
  'Type de propriété du restaurant: propre (legacy, mapped to succursale), succursale (owned by enseigne), franchise (franchisé). RPC function maps propre→succursale for consistency with organisations.ownership_type.';
