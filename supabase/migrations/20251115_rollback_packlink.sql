-- =============================================================================
-- Migration Rollback : Suppression complète intégration Packlink
-- Date: 2025-11-15
-- Raison: Abandon intégration Packlink pour reprendre avec architecture propre
-- =============================================================================

-- ÉTAPE 1: Drop table packlink_shipments (créée par 20251114125649)
DROP TABLE IF EXISTS public.packlink_shipments CASCADE;

-- ÉTAPE 2: Drop function tracking (créée par 20251112_002)
DROP FUNCTION IF EXISTS get_shipment_tracking_summary(UUID);

-- ÉTAPE 3: Drop table tracking events (créée par 20251112_002)
DROP TABLE IF EXISTS shipment_tracking_events CASCADE;

-- ÉTAPE 4: Drop indexes Packlink sur shipments (créés par 20251112_002)
DROP INDEX IF EXISTS idx_shipments_packlink_shipment_id;
DROP INDEX IF EXISTS idx_shipments_status;

-- ÉTAPE 5: Drop colonnes ajoutées à shipments (créées par 20251112_002)
ALTER TABLE shipments DROP COLUMN IF EXISTS status;
ALTER TABLE shipments DROP COLUMN IF EXISTS packlink_order_ref;

-- ÉTAPE 6: Drop enum (créé par 20251112_002)
DROP TYPE IF EXISTS shipment_status_type;

-- =============================================================================
-- NOTES
-- =============================================================================

-- Les 4 colonnes packlink_* dans shipments (migration 20251010_001_create_shipments_system.sql)
-- sont conservées car nullable et migration trop ancienne :
--   - packlink_shipment_id TEXT
--   - packlink_label_url TEXT
--   - packlink_service_id INT
--   - packlink_response JSONB

-- L'enum shipping_method contient toujours la valeur 'packlink' (pas gênant)

-- =============================================================================
-- VALIDATION
-- =============================================================================

DO $$
DECLARE
  v_packlink_shipments_exists BOOLEAN;
  v_tracking_events_exists BOOLEAN;
  v_enum_exists BOOLEAN;
BEGIN
  -- Vérifier que packlink_shipments est supprimée
  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'packlink_shipments'
  ) INTO v_packlink_shipments_exists;

  -- Vérifier que shipment_tracking_events est supprimée
  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'shipment_tracking_events'
  ) INTO v_tracking_events_exists;

  -- Vérifier que enum shipment_status_type est supprimé
  SELECT EXISTS (
    SELECT 1 FROM pg_type
    WHERE typname = 'shipment_status_type'
  ) INTO v_enum_exists;

  IF v_packlink_shipments_exists THEN
    RAISE EXCEPTION 'Rollback failed: packlink_shipments still exists';
  END IF;

  IF v_tracking_events_exists THEN
    RAISE EXCEPTION 'Rollback failed: shipment_tracking_events still exists';
  END IF;

  IF v_enum_exists THEN
    RAISE EXCEPTION 'Rollback failed: shipment_status_type still exists';
  END IF;

  RAISE NOTICE '✅ Rollback Packlink terminé avec succès';
  RAISE NOTICE '   - packlink_shipments supprimée';
  RAISE NOTICE '   - shipment_tracking_events supprimée';
  RAISE NOTICE '   - shipment_status_type supprimé';
  RAISE NOTICE '   - Colonnes status/packlink_order_ref supprimées de shipments';
  RAISE NOTICE '   - Indexes Packlink supprimés';
END $$;
