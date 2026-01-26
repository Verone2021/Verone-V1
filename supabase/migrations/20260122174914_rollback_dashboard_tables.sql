-- Migration: Suppression complète du système dashboard personnalisable
-- Date: 2026-01-22
-- Objectif: Nettoyer tables, fonctions, triggers, indexes, RLS policies
-- Raison: Dashboard personnalisable trop complexe, source de bugs et problèmes déploiement

-- 1. DROP TRIGGERS (en premier pour éviter erreurs de dépendances)
DROP TRIGGER IF EXISTS trigger_update_user_dashboard_preferences_updated_at
  ON public.user_dashboard_preferences;

DROP TRIGGER IF EXISTS update_linkme_page_configurations_updated_at
  ON public.linkme_page_configurations;

-- 2. DROP FUNCTIONS
DROP FUNCTION IF EXISTS public.update_user_dashboard_preferences_updated_at();
DROP FUNCTION IF EXISTS public.get_dashboard_stock_orders_metrics();

-- 3. DROP TABLES (CASCADE pour supprimer indexes, policies, FK automatiquement)
DROP TABLE IF EXISTS public.user_dashboard_preferences CASCADE;
DROP TABLE IF EXISTS public.linkme_page_configurations CASCADE;

-- 4. COMMENT pour historique
COMMENT ON SCHEMA public IS 'Dashboard personnalisable supprimé le 2026-01-22. Tables: user_dashboard_preferences, linkme_page_configurations. Remplacé par dashboard fixe simple.';
