-- Migration: Optimize RLS Performance (Performance Advisor)
--
-- PROBLEME: 491 warnings "Auth RLS Initialization Plan"
-- Les policies RLS appellent auth.uid() et des fonctions helper pour chaque ligne
-- Planning Time eleve (~67ms) sur les requetes avec RLS
--
-- SOLUTION:
-- 1. Creer des index composites optimises pour les lookups RLS
-- 2. Ajouter des index sur les colonnes de jointure frequentes
-- 3. Optimiser les fonctions helper si necessaire
--
-- @since 2026-01-11

-- ============================================================================
-- STEP 1: Index composite pour user_app_roles (utilise dans TOUTES les policies LinkMe)
-- ============================================================================

-- Index pour les lookups RLS LinkMe: (user_id, app, is_active) avec enseigne_id et organisation_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_app_roles_rls_linkme
ON user_app_roles (user_id, app, is_active, enseigne_id, organisation_id)
WHERE app = 'linkme' AND is_active = true;

-- Index pour les lookups staff backoffice
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_rls_staff
ON user_profiles (user_id, role, app)
WHERE app = 'back-office' AND role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager');

-- ============================================================================
-- STEP 2: Index pour les jointures frequentes dans les policies
-- ============================================================================

-- linkme_selections -> affiliate_id (tres utilise dans les policies)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_linkme_selections_affiliate_id
ON linkme_selections (affiliate_id);

-- linkme_commissions -> affiliate_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_linkme_commissions_affiliate_id
ON linkme_commissions (affiliate_id);

-- sales_order_items -> sales_order_id (pour les policies qui joignent avec sales_orders)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_order_items_order_id
ON sales_order_items (sales_order_id);

-- ============================================================================
-- STEP 3: Index pour optimiser les lookups par organisation
-- ============================================================================

-- sales_orders par organisation (pour user_has_access_to_organisation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_orders_customer_org
ON sales_orders (customer_id)
WHERE customer_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Optimiser la fonction is_staff_user pour eviter les appels repetes
-- Wrapper qui met en cache le resultat dans une variable de session
-- ============================================================================

-- Creer une fonction de cache pour is_staff_user
-- Cette approche utilise current_setting pour cacher le resultat pendant la transaction
CREATE OR REPLACE FUNCTION is_staff_user_cached()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  cached_value text;
  result boolean;
BEGIN
  -- Essayer de recuperer la valeur en cache
  cached_value := current_setting('app.is_staff_user_cache', true);

  IF cached_value IS NOT NULL THEN
    RETURN cached_value::boolean;
  END IF;

  -- Calculer la valeur
  result := is_staff_user();

  -- Mettre en cache pour cette transaction
  PERFORM set_config('app.is_staff_user_cache', result::text, true);

  RETURN result;
END;
$$;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================
DO $$
DECLARE
  idx_count integer;
BEGIN
  SELECT COUNT(*) INTO idx_count
  FROM pg_indexes
  WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%_rls_%';

  RAISE NOTICE 'RLS optimization complete: % RLS-specific indexes created', idx_count;
END $$;
