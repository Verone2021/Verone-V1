-- =====================================================
-- MIGRATION ROLLBACK: Nettoyer les anciens statuts obsolètes
-- Date: 2025-11-20
-- =====================================================
-- CONTEXTE: purchase_order_status avait 'pending_validation', 'pending_payment' (obsolètes)
-- NOUVEAU WORKFLOW: draft → validated → received (ou cancelled à tout moment)
-- =====================================================

-- ✅ ÉTAPE 1: Créer NOUVEL enum propre
CREATE TYPE purchase_order_status_new AS ENUM (
  'draft',
  'validated',
  'partially_received',
  'received',
  'cancelled'
);

-- ✅ ÉTAPE 2: Ajouter colonne status temporaire
ALTER TABLE purchase_orders
ADD COLUMN status_new purchase_order_status_new NOT NULL DEFAULT 'draft';

-- ✅ ÉTAPE 3: Migrer données basées sur timestamps
UPDATE purchase_orders
SET status_new = CASE
  WHEN cancelled_at IS NOT NULL THEN 'cancelled'::purchase_order_status_new
  WHEN received_at IS NOT NULL THEN 'received'::purchase_order_status_new
  WHEN validated_at IS NOT NULL THEN 'validated'::purchase_order_status_new
  ELSE 'draft'::purchase_order_status_new
END;

-- ✅ ÉTAPE 4: Renommer colonne
ALTER TABLE purchase_orders
DROP COLUMN IF EXISTS status CASCADE;

ALTER TABLE purchase_orders
RENAME COLUMN status_new TO status;

-- ✅ ÉTAPE 5: Renommer enum
DROP TYPE IF EXISTS purchase_order_status CASCADE;
ALTER TYPE purchase_order_status_new RENAME TO purchase_order_status;

-- ✅ ÉTAPE 6: Créer index performance
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);

-- Validation
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM purchase_orders WHERE status IS NOT NULL;
  RAISE NOTICE '✅ Migration purchase_order_status : % lignes migrées', v_count;
END $$;
