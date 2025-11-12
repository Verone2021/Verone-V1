-- Migration: Packlink Shipments Setup (Phase 2 - Database)
-- Date: 2025-11-12
-- Feature: Configuration complète table shipments pour intégration API Packlink
-- Priority: P0 - CRITICAL
--
-- Context: Ajouter colonnes status + tracking + table événements pour multi-shipments workflow
--
-- Tables modifiées: shipments (ajout colonnes)
-- Tables créées: shipment_tracking_events
-- Enums créés: shipment_status_type
--
-- Cascade: Webhooks Packlink → shipment_tracking_events → UI timeline

\echo '========================================';
\echo 'PACKLINK SHIPMENTS SETUP - PHASE 2';
\echo '========================================';
\echo '';

-- =============================================
-- 1. ENUM: shipment_status_type
-- Statuts Packlink (cycle complet livraison)
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shipment_status_type') THEN
    CREATE TYPE shipment_status_type AS ENUM (
      'PENDING',              -- Commande reçue, préparation
      'READY_TO_PURCHASE',    -- Prêt achat transporteur
      'PROCESSING',           -- Génération label en cours
      'READY_FOR_SHIPPING',   -- Label prêt, attente collecte
      'TRACKING',             -- Collecté par transporteur
      'IN_TRANSIT',           -- En transit
      'OUT_FOR_DELIVERY',     -- En livraison
      'DELIVERED',            -- Livré
      'INCIDENT',             -- Problème (adresse, douane...)
      'RETURNED_TO_SENDER',   -- Retourné expéditeur
      'DRAFT',                -- Brouillon (incomplet)
      'ARCHIVED'              -- Archivé (>90 jours)
    );
    RAISE NOTICE '✅ Enum shipment_status_type créé avec 12 valeurs';
  ELSE
    RAISE NOTICE 'ℹ️ Enum shipment_status_type existe déjà';
  END IF;
END $$;

-- =============================================
-- 2. COLONNE status: Statut actuel shipment
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE shipments ADD COLUMN status shipment_status_type DEFAULT 'PENDING';
    COMMENT ON COLUMN shipments.status IS 'Statut actuel expédition (cycle Packlink)';
    RAISE NOTICE '✅ Colonne status ajoutée à shipments';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne status existe déjà';
  END IF;
END $$;

-- =============================================
-- 3. COLONNE packlink_order_ref: Référence order Packlink
-- Format: ORD-2025-ABC123
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments'
    AND column_name = 'packlink_order_ref'
  ) THEN
    ALTER TABLE shipments ADD COLUMN packlink_order_ref TEXT;
    COMMENT ON COLUMN shipments.packlink_order_ref IS 'Référence order Packlink (ORD-2025-...)';
    RAISE NOTICE '✅ Colonne packlink_order_ref ajoutée à shipments';
  ELSE
    RAISE NOTICE 'ℹ️ Colonne packlink_order_ref existe déjà';
  END IF;
END $$;

-- =============================================
-- 4. INDEX: Recherche rapide par packlink_shipment_id
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_shipments_packlink_shipment_id'
  ) THEN
    CREATE INDEX idx_shipments_packlink_shipment_id
    ON shipments(packlink_shipment_id)
    WHERE packlink_shipment_id IS NOT NULL;
    RAISE NOTICE '✅ Index idx_shipments_packlink_shipment_id créé';
  ELSE
    RAISE NOTICE 'ℹ️ Index idx_shipments_packlink_shipment_id existe déjà';
  END IF;
END $$;

-- =============================================
-- 5. INDEX: Recherche rapide par status
-- =============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_shipments_status'
  ) THEN
    CREATE INDEX idx_shipments_status ON shipments(status);
    RAISE NOTICE '✅ Index idx_shipments_status créé';
  ELSE
    RAISE NOTICE 'ℹ️ Index idx_shipments_status existe déjà';
  END IF;
END $$;

-- =============================================
-- 6. TABLE: shipment_tracking_events
-- Historique événements webhooks Packlink
-- =============================================

CREATE TABLE IF NOT EXISTS shipment_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,

  -- Données événement
  event_name TEXT NOT NULL,                 -- Ex: 'shipment.tracking.update', 'shipment.delivered'
  event_timestamp TIMESTAMPTZ NOT NULL,     -- Timestamp événement transporteur
  city TEXT,                                -- Ville événement (ex: 'Paris', 'Lyon')
  description TEXT,                         -- Description événement (ex: 'Package collected', 'Delivered')

  -- Payload complet webhook (JSONB pour flexibilité)
  raw_payload JSONB NOT NULL DEFAULT '{}'::JSONB,

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes
  CONSTRAINT valid_event_timestamp CHECK (event_timestamp <= NOW() + INTERVAL '1 day')
);

COMMENT ON TABLE shipment_tracking_events IS
'Événements tracking expéditions reçus via webhooks Packlink. Timeline complète pour UI.';

COMMENT ON COLUMN shipment_tracking_events.event_name IS
'Type événement Packlink (shipment.delivered, shipment.tracking.update, etc.)';

COMMENT ON COLUMN shipment_tracking_events.raw_payload IS
'Payload webhook complet JSON pour debug et évolutions futures';

-- Index pour recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_tracking_events_shipment
ON shipment_tracking_events(shipment_id, event_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_tracking_events_name
ON shipment_tracking_events(event_name);

RAISE NOTICE '✅ Table shipment_tracking_events créée avec indexes';

-- =============================================
-- 7. RLS POLICIES: shipment_tracking_events
-- Sécurité lecture événements tracking
-- =============================================

-- Enable RLS
ALTER TABLE shipment_tracking_events ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs authentifiés peuvent lire leurs événements
CREATE POLICY "Users can read shipment tracking events for their orders"
ON shipment_tracking_events FOR SELECT
USING (
  auth.uid() IN (
    SELECT DISTINCT created_by FROM shipments WHERE id = shipment_id
    UNION
    SELECT DISTINCT created_by FROM sales_orders so
    INNER JOIN shipments s ON s.sales_order_id = so.id
    WHERE s.id = shipment_id
  )
);

-- Policy: Service role peut tout faire (webhooks)
CREATE POLICY "Service role can manage all tracking events"
ON shipment_tracking_events FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

RAISE NOTICE '✅ RLS policies créées pour shipment_tracking_events';

-- =============================================
-- 8. FUNCTION HELPER: get_shipment_tracking_summary
-- Résumé tracking pour affichage UI
-- =============================================

CREATE OR REPLACE FUNCTION get_shipment_tracking_summary(p_shipment_id UUID)
RETURNS TABLE (
  total_events INT,
  latest_status TEXT,
  latest_city TEXT,
  latest_description TEXT,
  latest_timestamp TIMESTAMPTZ,
  events JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT AS total_events,
    (ARRAY_AGG(ste.description ORDER BY ste.event_timestamp DESC))[1] AS latest_status,
    (ARRAY_AGG(ste.city ORDER BY ste.event_timestamp DESC))[1] AS latest_city,
    (ARRAY_AGG(ste.description ORDER BY ste.event_timestamp DESC))[1] AS latest_description,
    MAX(ste.event_timestamp) AS latest_timestamp,
    JSONB_AGG(
      JSONB_BUILD_OBJECT(
        'event_name', ste.event_name,
        'timestamp', ste.event_timestamp,
        'city', ste.city,
        'description', ste.description
      ) ORDER BY ste.event_timestamp DESC
    ) AS events
  FROM shipment_tracking_events ste
  WHERE ste.shipment_id = p_shipment_id
  GROUP BY ste.shipment_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_shipment_tracking_summary(UUID) IS
'RPC Helper: Résumé tracking expédition (dernier événement + timeline complète)';

-- =============================================
-- 9. VÉRIFICATION POST-MIGRATION
-- =============================================

DO $$
DECLARE
  v_status_col BOOLEAN;
  v_order_ref_col BOOLEAN;
  v_tracking_table BOOLEAN;
  v_enum_count INT;
  v_index_count INT;
BEGIN
  -- Vérifier colonne status
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'status'
  ) INTO v_status_col;

  -- Vérifier colonne packlink_order_ref
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'shipments' AND column_name = 'packlink_order_ref'
  ) INTO v_order_ref_col;

  -- Vérifier table tracking_events
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'shipment_tracking_events'
  ) INTO v_tracking_table;

  -- Compter valeurs enum
  SELECT COUNT(*) INTO v_enum_count
  FROM pg_enum e
  JOIN pg_type t ON e.enumtypid = t.oid
  WHERE t.typname = 'shipment_status_type';

  -- Compter index créés
  SELECT COUNT(*) INTO v_index_count
  FROM pg_indexes
  WHERE tablename IN ('shipments', 'shipment_tracking_events')
  AND indexname LIKE 'idx_%packlink%' OR indexname LIKE 'idx_%status%' OR indexname LIKE 'idx_tracking%';

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ VÉRIFICATION POST-MIGRATION';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Colonne shipments.status        : %', CASE WHEN v_status_col THEN 'EXISTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE 'Colonne packlink_order_ref      : %', CASE WHEN v_order_ref_col THEN 'EXISTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE 'Table shipment_tracking_events  : %', CASE WHEN v_tracking_table THEN 'EXISTE' ELSE 'MANQUANTE' END;
  RAISE NOTICE 'Enum shipment_status_type       : % valeurs', v_enum_count;
  RAISE NOTICE 'Index créés                     : % index', v_index_count;
  RAISE NOTICE 'RPC get_shipment_tracking_summary : CRÉÉ';
  RAISE NOTICE '';

  IF v_status_col AND v_order_ref_col AND v_tracking_table AND v_enum_count >= 12 THEN
    RAISE NOTICE '🎉 Migration 002 réussie - Système Packlink shipments prêt';
  ELSE
    RAISE WARNING '⚠️ Migration incomplète - Vérifier logs ci-dessus';
  END IF;

  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
END $$;

\echo '';
\echo '========================================';
\echo '✅ MIGRATION 002 TERMINÉE';
\echo '========================================';
\echo '';
\echo 'Modifications apportées:';
\echo '1. Enum shipment_status_type (12 statuts Packlink)';
\echo '2. Colonne shipments.status (statut actuel)';
\echo '3. Colonne shipments.packlink_order_ref (référence order)';
\echo '4. Table shipment_tracking_events (historique webhooks)';
\echo '5. Index optimisation recherches';
\echo '6. RLS policies sécurité événements';
\echo '7. RPC get_shipment_tracking_summary() pour UI';
\echo '';
\echo '🎯 Prochaine étape: Phase 2 - Wrapper TypeScript Packlink API';
\echo '';
