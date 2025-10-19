-- ============================================================================
-- Migration: Ajout Colonnes Lifecycle Consultations
-- Date: 2025-10-20
-- Description: Ajouter colonnes validation/archivage/suppression (soft delete)
--              Pattern standard Vérone pour gestion lifecycle
--
-- RÈGLE MÉTIER CRITIQUE:
-- - Consultations = DEVIS uniquement (AUCUNE interaction avec stock)
-- - validated_at : Marque consultation validée (utilisée Phase 2 pricing)
-- - archived_at : Consultations non validées archivables
-- - deleted_at : Consultations archivées supprimables (soft delete)
-- ============================================================================

-- Ajouter colonnes lifecycle standard Vérone
ALTER TABLE client_consultations
ADD COLUMN IF NOT EXISTS validated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Ajouter commentaires explicatifs
COMMENT ON COLUMN client_consultations.validated_at IS 'Date validation consultation (utilisée Phase 2 pour pricing client)';
COMMENT ON COLUMN client_consultations.archived_at IS 'Date archivage consultation (consultations non validées archivables)';
COMMENT ON COLUMN client_consultations.deleted_at IS 'Date suppression logique (soft delete, consultations archivées supprimables)';

-- Index pour performance (queries filtrant consultations actives/archivées/validées)
CREATE INDEX IF NOT EXISTS idx_consultations_validated_at
  ON client_consultations(validated_at)
  WHERE validated_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_archived_at
  ON client_consultations(archived_at)
  WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_deleted_at
  ON client_consultations(deleted_at)
  WHERE deleted_at IS NULL; -- Consultations actives (non supprimées)

-- ⚠️ IMPORTANT: Pas de trigger stock_movements
-- Consultations = Devis uniquement (pas d'impact stock)
-- Les commandes (sales_orders) gèrent le stock, pas les consultations

-- Vérification colonnes ajoutées
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'client_consultations'
    AND column_name IN ('validated_at', 'archived_at', 'deleted_at')
  ) THEN
    RAISE NOTICE '✅ Migration 20251020_001 appliquée avec succès - Colonnes lifecycle consultations ajoutées';
  END IF;
END $$;
