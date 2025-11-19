-- Migration: Remove PackLink shipment tables (Logistic ≠ Stock)
-- Context: PackLink tables confuse LOGISTICS (carrier tracking) with STOCK (in/out movements)
--          stock_movements already handles inventory tracking (Event Sourcing Pattern)
-- Impact: Remove 4 tables, 3 enums (~670 SQL lines)
-- Priority: P1 - Architecture cleanup

-- =============================================
-- 1. DROP RLS POLICIES
-- =============================================

-- shipment_tracking_events policies
DROP POLICY IF EXISTS "Authenticated users can read shipment tracking events" ON shipment_tracking_events;
DROP POLICY IF EXISTS "Authenticated users can create shipment tracking events" ON shipment_tracking_events;

-- shipments policies
DROP POLICY IF EXISTS "Authenticated users can read shipments" ON shipments;
DROP POLICY IF EXISTS "Authenticated users can create shipments" ON shipments;
DROP POLICY IF EXISTS "Authenticated users can update shipments" ON shipments;

-- shipping_parcels policies
DROP POLICY IF EXISTS "Authenticated users can read shipping parcels" ON shipping_parcels;
DROP POLICY IF EXISTS "Authenticated users can create shipping parcels" ON shipping_parcels;

-- parcel_items policies
DROP POLICY IF EXISTS "Authenticated users can read parcel items" ON parcel_items;
DROP POLICY IF EXISTS "Authenticated users can create parcel items" ON parcel_items;

-- =============================================
-- 2. DROP FUNCTIONS (if exist)
-- =============================================

DROP FUNCTION IF EXISTS get_shipment_tracking_summary(UUID) CASCADE;
DROP FUNCTION IF EXISTS calculate_shipment_cost(UUID) CASCADE;
DROP FUNCTION IF EXISTS validate_parcel_items(UUID) CASCADE;

-- =============================================
-- 3. DROP TABLES (CASCADE removes FK constraints)
-- =============================================

-- Order matters: child tables first (FK dependencies)
DROP TABLE IF EXISTS shipment_tracking_events CASCADE;
DROP TABLE IF EXISTS parcel_items CASCADE;
DROP TABLE IF EXISTS shipping_parcels CASCADE;
DROP TABLE IF EXISTS shipments CASCADE;

-- =============================================
-- 4. DROP ENUMS (if no longer used)
-- =============================================

DROP TYPE IF EXISTS shipment_status_type CASCADE;
DROP TYPE IF EXISTS shipment_type CASCADE;
DROP TYPE IF EXISTS shipping_method CASCADE;

-- =============================================
-- 5. VERIFICATION QUERIES
-- =============================================

-- Verify no remaining PackLink tables
DO $$
DECLARE
  v_remaining_tables INT;
BEGIN
  SELECT COUNT(*)
  INTO v_remaining_tables
  FROM pg_tables
  WHERE schemaname = 'public'
    AND (
      tablename LIKE '%shipment%'
      OR tablename LIKE '%parcel%'
      OR tablename LIKE '%packlink%'
    );

  IF v_remaining_tables > 0 THEN
    RAISE WARNING 'ATTENTION: % table(s) PackLink restante(s)', v_remaining_tables;
  ELSE
    RAISE NOTICE '✅ Toutes les tables PackLink supprimées avec succès';
  END IF;
END $$;

-- List remaining shipping-related columns in other tables (for cleanup)
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name LIKE '%shipment%'
    OR column_name LIKE '%packlink%'
    OR column_name LIKE '%carrier%'
    OR column_name LIKE '%tracking%'
  )
ORDER BY table_name, column_name;

COMMENT ON SCHEMA public IS
'PackLink tables removed 2025-11-19: shipments, shipping_parcels, parcel_items, shipment_tracking_events.
Reason: Confusion LOGISTICS vs STOCK. Use stock_movements for inventory tracking (Event Sourcing).';
