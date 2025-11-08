-- Migration 115: Supprimer fonctions obsolètes utilisant availability_status_type
-- Date: 2025-11-05
-- Contexte: Type availability_status_type a été remplacé par product_status_type (dual status)
--
-- Objectif:
-- Supprimer fonctions obsolètes qui référencent availability_status_type et causent erreurs
-- - update_sourcing_product_status_on_reception (ancien système sourcing)
-- - rollback_status_refonte (fonction rollback temporaire)
--
-- Impact:
-- Ces fonctions ne sont plus utilisées depuis refonte dual status (product_status + stock_status)
-- Migration 20251104: Phase 3 dual status migration complete
--
-- =============================================================================
-- DROP FUNCTIONS OBSOLETES
-- =============================================================================

-- 1. update_sourcing_product_status_on_reception (ancien trigger PO reception)
DROP FUNCTION IF EXISTS update_sourcing_product_status_on_reception() CASCADE;

-- 2. rollback_status_refonte (fonction rollback temporaire)
DROP FUNCTION IF EXISTS rollback_status_refonte() CASCADE;

-- =============================================================================
-- Vérification
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 115 COMPLÉTÉE - FUNCTIONS OBSOLETES SUPPRIMÉES';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 FONCTIONS SUPPRIMÉES:';
    RAISE NOTICE '   1. update_sourcing_product_status_on_reception()';
    RAISE NOTICE '   2. rollback_status_refonte()';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 RAISON:';
    RAISE NOTICE '   Type availability_status_type n''existe plus';
    RAISE NOTICE '   Remplacé par: product_status_type (dual status)';
    RAISE NOTICE '   Migration 20251104: Phase 3 refonte complete';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPACT:';
    RAISE NOTICE '   - Bouton "Valider" commandes fournisseurs fonctionnel ✅';
    RAISE NOTICE '   - Stock prévisionnel IN créé correctement ✅';
    RAISE NOTICE '   - Plus d''erreur "type availability_status_type does not exist" ✅';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
