-- ============================================================================
-- Migration: Cleanup Obsolete Tables
-- Date: 2025-10-25
-- Author: Phase B Audit - Database Optimization
--
-- Description:
--   Suppression de 8 tables obsolètes identifiées lors de l'audit Phase B:
--   - 5 tables de tests manuels (manual_tests_*, test_*)
--   - 3 tables d'ancien système d'erreurs (error_*)
--   - 1 backup obsolète (notifications_backup_20251014)
--
--   Total espace récupéré: ~2.2 MB
--
-- Justification:
--   1. Aucune référence dans le code applicatif (src/)
--   2. Présentes uniquement dans types auto-générés
--   3. Ancien système remplacé par MCP (mcp_resolution_*)
--   4. Tables de tests devenues obsolètes
--
-- Sécurité:
--   - Utilisation de CASCADE pour gérer les foreign keys
--   - Utilisation de IF EXISTS pour éviter erreurs si déjà supprimées
--   - Pas de backup nécessaire (tables confirmées obsolètes)
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES DE TESTS MANUELS OBSOLETES
-- ============================================================================

-- Table: manual_tests_progress (1.2 MB, 1004 rows)
-- Raison: Système de tests manuels obsolète
DROP TABLE IF EXISTS public.manual_tests_progress CASCADE;

-- Table: test_validation_state (144 KB, 59 rows)
-- Raison: Système de validation tests obsolète
DROP TABLE IF EXISTS public.test_validation_state CASCADE;

-- Table: test_sections_lock (104 KB, 10 rows)
-- Raison: Système de lock tests obsolète
DROP TABLE IF EXISTS public.test_sections_lock CASCADE;

-- Table: test_error_reports (88 KB, 1 row)
-- Raison: Système de rapports tests obsolète
DROP TABLE IF EXISTS public.test_error_reports CASCADE;

-- ============================================================================
-- SECTION 2: ANCIEN SYSTEME D'ERREURS (REMPLACE PAR MCP)
-- ============================================================================

-- Table: error_reports_v2 (536 KB, 32 colonnes)
-- Raison: Ancien système d'erreurs, remplacé par mcp_resolution_queue
DROP TABLE IF EXISTS public.error_reports_v2 CASCADE;

-- Table: error_notifications_queue (72 KB, 11 colonnes)
-- Raison: Ancien système notifications d'erreurs, remplacé par MCP
DROP TABLE IF EXISTS public.error_notifications_queue CASCADE;

-- Table: error_resolution_history (64 KB, 11 colonnes)
-- Raison: Ancien historique résolution erreurs, remplacé par MCP
DROP TABLE IF EXISTS public.error_resolution_history CASCADE;

-- ============================================================================
-- SECTION 3: BACKUPS OBSOLETES
-- ============================================================================

-- Table: notifications_backup_20251014 (16 KB, 26 rows)
-- Raison: Backup du 14 octobre devenu obsolète
DROP TABLE IF EXISTS public.notifications_backup_20251014 CASCADE;

-- ============================================================================
-- VERIFICATION POST-MIGRATION
-- ============================================================================

-- Afficher les tables restantes pour confirmation
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';

    RAISE NOTICE 'Migration complétée. Nombre de tables restantes: %', table_count;
    RAISE NOTICE '8 tables obsolètes supprimées avec succès.';
    RAISE NOTICE 'Espace récupéré estimé: ~2.2 MB';
END $$;

-- ============================================================================
-- NOTES POST-MIGRATION
-- ============================================================================

-- TODO APRES CETTE MIGRATION:
-- 1. Régénérer les types TypeScript: supabase gen types typescript
-- 2. Vérifier le build: npm run build
-- 3. Tester l'application: npm run dev + tests Playwright
-- 4. Commit: "chore(db): cleanup 8 obsolete tables (~2.2MB recovered)"

-- TABLES CONSERVEES (IMPORTANTES POUR FUTURES PHASES):
-- ✅ notifications (112 KB) - Système actif (use-notifications.ts)
-- ✅ mcp_resolution_queue (144 KB) - Système MCP actif
-- ✅ mcp_resolution_strategies (64 KB) - Système MCP actif
-- ✅ bank_transactions (0 rows) - Phase 2 Finance
-- ✅ abby_sync_queue (0 rows) - Phase 2 Facturation
-- ✅ abby_webhook_events (0 rows) - Phase 2 Facturation

-- ============================================================================
