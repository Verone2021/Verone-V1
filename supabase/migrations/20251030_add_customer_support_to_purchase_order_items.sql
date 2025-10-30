-- Migration: Add customer support to purchase_order_items for sample orders
-- Date: 2025-10-30
-- Description: Ajouter colonnes pour lier échantillons clients (B2B et B2C)
--
-- Business Context:
-- Les échantillons clients (sample_type='customer') doivent pouvoir être liés
-- à des clients professionnels (organisations) OU particuliers (individual_customers).
-- Permet la sélection client B2B/B2C comme dans les commandes clients.

-- ============================================================================
-- 1. ADD COLUMNS for customer linkage
-- ============================================================================
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS customer_organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS customer_individual_id UUID REFERENCES individual_customers(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. COMMENTS
-- ============================================================================
COMMENT ON COLUMN purchase_order_items.customer_organisation_id IS 'Lien vers client professionnel (B2B) pour échantillons clients';
COMMENT ON COLUMN purchase_order_items.customer_individual_id IS 'Lien vers client particulier (B2C) pour échantillons clients';

-- ============================================================================
-- 3. INDEXES for performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_customer_org
ON purchase_order_items(customer_organisation_id)
WHERE customer_organisation_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_customer_individual
ON purchase_order_items(customer_individual_id)
WHERE customer_individual_id IS NOT NULL;

-- ============================================================================
-- 4. VALIDATION CONSTRAINT
-- ============================================================================
-- Pour les échantillons clients, il faut AU MOINS un des deux IDs client
ALTER TABLE purchase_order_items
DROP CONSTRAINT IF EXISTS check_customer_sample_has_customer;

ALTER TABLE purchase_order_items
ADD CONSTRAINT check_customer_sample_has_customer
CHECK (
  -- Si sample_type = 'customer', alors il faut un client (org OU individual)
  (sample_type = 'customer' AND (customer_organisation_id IS NOT NULL OR customer_individual_id IS NOT NULL))
  -- Si sample_type != 'customer', pas de contrainte
  OR sample_type IS NULL
  OR sample_type != 'customer'
);

COMMENT ON CONSTRAINT check_customer_sample_has_customer ON purchase_order_items
IS 'Garantit qu''un échantillon client (sample_type=customer) a toujours un client lié (B2B ou B2C)';

-- ============================================================================
-- 5. NOTES FOR FUTURE ROLLBACK
-- ============================================================================
-- Pour rollback complet :
-- ALTER TABLE purchase_order_items DROP CONSTRAINT IF EXISTS check_customer_sample_has_customer;
-- DROP INDEX IF EXISTS idx_purchase_order_items_customer_individual;
-- DROP INDEX IF EXISTS idx_purchase_order_items_customer_org;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS customer_individual_id;
-- ALTER TABLE purchase_order_items DROP COLUMN IF EXISTS customer_organisation_id;
