-- [BO-FIN-FEES-002] CHECK constraints sur les colonnes JSONB d'adresses
--
-- Bug 2026-05-07 : 17 commandes (depuis le 19 mars) avaient billing_address
-- stocké comme STRING JSON au lieu d'OBJECT. Postgres l'acceptait
-- silencieusement (JSONB autorise tout type). Le code Qonto plantait
-- ensuite avec "Adresse incomplète" car typeof 'string'.city = undefined.
--
-- Cette migration ajoute des CHECK constraints qui empêchent désormais
-- toute insertion d'une string/array/scalar dans ces colonnes. Seuls
-- NULL et JSON object sont autorisés.
--
-- Le code Qonto a aussi été renforcé en parallèle (defense in depth)
-- avec un parser tolérant pour gérer les formats anormaux historiques.
--
-- Tables couvertes :
--   - sales_orders.billing_address
--   - sales_orders.shipping_address
--   - financial_documents.billing_address
--   - financial_documents.shipping_address
--   - affiliate_pending_orders.billing_address
--   - affiliate_pending_orders.shipping_address
--   - purchase_orders.delivery_address
--
-- Pré-requis : la migration de correction des données (UPDATE
-- billing_address = #>> '{}' :: jsonb sur les strings) DOIT avoir été
-- appliquée avant. Si des strings résiduelles existent, ALTER TABLE
-- échouera et la migration sera rollbackée.

BEGIN;

-- ============================================================================
-- 1. Vérification préalable : reparser tout résidu string en object
-- ============================================================================
-- Idempotent : si déjà fait, NOOP. Sinon corrige avant le ADD CONSTRAINT.
UPDATE sales_orders
SET billing_address = (billing_address #>> '{}')::jsonb
WHERE jsonb_typeof(billing_address) = 'string';

UPDATE sales_orders
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

UPDATE financial_documents
SET billing_address = (billing_address #>> '{}')::jsonb
WHERE jsonb_typeof(billing_address) = 'string';

UPDATE financial_documents
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

UPDATE affiliate_pending_orders
SET billing_address = (billing_address #>> '{}')::jsonb
WHERE jsonb_typeof(billing_address) = 'string';

UPDATE affiliate_pending_orders
SET shipping_address = (shipping_address #>> '{}')::jsonb
WHERE jsonb_typeof(shipping_address) = 'string';

UPDATE purchase_orders
SET delivery_address = (delivery_address #>> '{}')::jsonb
WHERE jsonb_typeof(delivery_address) = 'string';

-- ============================================================================
-- 2. Ajout des CHECK constraints
-- ============================================================================
ALTER TABLE sales_orders
  ADD CONSTRAINT sales_orders_billing_address_object_only
    CHECK (billing_address IS NULL OR jsonb_typeof(billing_address) = 'object'),
  ADD CONSTRAINT sales_orders_shipping_address_object_only
    CHECK (shipping_address IS NULL OR jsonb_typeof(shipping_address) = 'object');

ALTER TABLE financial_documents
  ADD CONSTRAINT financial_documents_billing_address_object_only
    CHECK (billing_address IS NULL OR jsonb_typeof(billing_address) = 'object'),
  ADD CONSTRAINT financial_documents_shipping_address_object_only
    CHECK (shipping_address IS NULL OR jsonb_typeof(shipping_address) = 'object');

ALTER TABLE affiliate_pending_orders
  ADD CONSTRAINT affiliate_pending_orders_billing_address_object_only
    CHECK (billing_address IS NULL OR jsonb_typeof(billing_address) = 'object'),
  ADD CONSTRAINT affiliate_pending_orders_shipping_address_object_only
    CHECK (shipping_address IS NULL OR jsonb_typeof(shipping_address) = 'object');

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_delivery_address_object_only
    CHECK (delivery_address IS NULL OR jsonb_typeof(delivery_address) = 'object');

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
DO $$
DECLARE
  v_total_strings INT;
  v_constraints_count INT;
BEGIN
  SELECT
    (SELECT COUNT(*) FROM sales_orders WHERE jsonb_typeof(billing_address) = 'string')
    + (SELECT COUNT(*) FROM sales_orders WHERE jsonb_typeof(shipping_address) = 'string')
    + (SELECT COUNT(*) FROM financial_documents WHERE jsonb_typeof(billing_address) = 'string')
    + (SELECT COUNT(*) FROM financial_documents WHERE jsonb_typeof(shipping_address) = 'string')
    + (SELECT COUNT(*) FROM affiliate_pending_orders WHERE jsonb_typeof(billing_address) = 'string')
    + (SELECT COUNT(*) FROM affiliate_pending_orders WHERE jsonb_typeof(shipping_address) = 'string')
    + (SELECT COUNT(*) FROM purchase_orders WHERE jsonb_typeof(delivery_address) = 'string')
    INTO v_total_strings;

  SELECT COUNT(*) INTO v_constraints_count
  FROM pg_constraint
  WHERE conname LIKE '%_address_object_only%';

  RAISE NOTICE '[BO-FIN-FEES-002] vérifications:';
  RAISE NOTICE '  - Strings résiduelles (attendu 0): %', v_total_strings;
  RAISE NOTICE '  - CHECK constraints créées (attendu 7): %', v_constraints_count;

  IF v_total_strings > 0 THEN
    RAISE EXCEPTION '[BO-FIN-FEES-002] % strings résiduelles dans les colonnes JSONB d''adresse', v_total_strings;
  END IF;
  IF v_constraints_count < 7 THEN
    RAISE EXCEPTION '[BO-FIN-FEES-002] Seulement % CHECK constraints créées, attendu 7', v_constraints_count;
  END IF;
END $$;
