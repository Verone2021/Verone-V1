-- =====================================================
-- MIGRATION ROLLBACK: Nettoyer les anciens statuts obsolètes sales_orders
-- Date: 2025-11-20
-- =====================================================
-- CONTEXTE: sales_order_status avait 'pending', 'processing' (obsolètes)
-- NOUVEAU WORKFLOW: draft → validated → partially_shipped → shipped (ou cancelled)
-- =====================================================

-- ✅ ÉTAPE 1: Créer NOUVEL enum propre
CREATE TYPE sales_order_status_new AS ENUM (
  'draft',
  'validated',
  'partially_shipped',
  'shipped',
  'delivered',
  'cancelled'
);

-- ✅ ÉTAPE 2: Ajouter colonne status temporaire
ALTER TABLE sales_orders
ADD COLUMN status_new sales_order_status_new NOT NULL DEFAULT 'draft';

-- ✅ ÉTAPE 3: Migrer données basées sur timestamps
UPDATE sales_orders
SET status_new = CASE
  WHEN cancelled_at IS NOT NULL THEN 'cancelled'::sales_order_status_new
  WHEN delivered_at IS NOT NULL THEN 'delivered'::sales_order_status_new
  WHEN shipped_at IS NOT NULL THEN 'shipped'::sales_order_status_new
  WHEN confirmed_at IS NOT NULL THEN 'validated'::sales_order_status_new
  ELSE 'draft'::sales_order_status_new
END;

-- ✅ ÉTAPE 4: Renommer colonne
ALTER TABLE sales_orders
DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE sales_orders
RENAME COLUMN status_new TO status;

-- ✅ ÉTAPE 5: Renommer enum
DROP TYPE IF EXISTS sales_order_status CASCADE;
ALTER TYPE sales_order_status_new RENAME TO sales_order_status;

-- ✅ ÉTAPE 6: Créer index performance
CREATE INDEX IF NOT EXISTS idx_sales_orders_status ON sales_orders(status);

-- Validation
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM sales_orders WHERE status IS NOT NULL;
  RAISE NOTICE '✅ Migration sales_order_status : % lignes migrées', v_count;
END $$;
