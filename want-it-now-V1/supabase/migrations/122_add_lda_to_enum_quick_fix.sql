-- ==============================================================================
-- MIGRATION 122: CORRECTION RAPIDE - Ajouter LDA à l'ENUM existant
-- ==============================================================================
-- Description: Fix immédiat pour permettre les formes juridiques portugaises
-- Issue: LDA pas accepté par forme_juridique_enum actuel
-- Solution: Ajouter LDA, SA_PT, SL à l'ENUM existant (solution temporaire)
-- Date: Janvier 2025 - Fix Urgent
-- ==============================================================================

BEGIN;

-- Ajouter les valeurs manquantes à l'ENUM existant
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'LDA';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'SA_PT';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'SL';
ALTER TYPE forme_juridique_enum ADD VALUE IF NOT EXISTS 'SU';

-- Notification de succès
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'MIGRATION 122: CORRECTION RAPIDE LDA - COMPLÉTÉE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ Ajouté LDA (Sociedade por Quotas - Portugal) à forme_juridique_enum';
    RAISE NOTICE '✅ Ajouté SA_PT (Sociedade Anónima - Portugal) à forme_juridique_enum';
    RAISE NOTICE '✅ Ajouté SL (Sociedad Limitada - Espagne) à forme_juridique_enum';
    RAISE NOTICE '✅ Ajouté SU (Sociedade Unipessoal - Portugal) à forme_juridique_enum';
    RAISE NOTICE '';
    RAISE NOTICE '🇵🇹 FIX: JARDIM PRÓSPERO LDA peut maintenant être sauvegardé !';
    RAISE NOTICE '🚀 NEXT: Appliquer Migration 121 pour architecture finale';
    RAISE NOTICE '============================================================================';
END $$;

COMMIT;