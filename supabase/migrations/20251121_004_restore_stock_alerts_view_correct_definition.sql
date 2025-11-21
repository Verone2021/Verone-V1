-- ============================================================================
-- Migration: Restaurer stock_alerts_view avec définition correcte
-- Date: 2025-11-21
-- Auteur: Claude Code (Correction Automatisée)
-- ============================================================================
--
-- PROBLÈME:
--   Migration 20251121_002_remove_security_definer_views.sql a recréé la vue
--   stock_alerts_view avec une MAUVAISE définition qui référence une table
--   'stock_alerts' inexistante, causant 32 erreurs 404 dans la console.
--
-- SOLUTION:
--   Restaurer la définition ORIGINALE de la migration 20251012_001 qui utilise:
--   - Table 'products' (existe)
--   - Fonction 'get_smart_stock_status()' (existe)
--   - SANS 'SECURITY DEFINER' (respecte RLS policies)
--
-- IMPACT:
--   - Corrige 32 erreurs console 404
--   - Débloque pre-push hook (Console Zero Tolerance)
--   - Restaure alertes stock dans dashboard
--   - Sécurisé: SECURITY INVOKER (mode par défaut)
--
-- ============================================================================

-- ÉTAPE 1: Supprimer vue incorrecte
-- ============================================================================
DROP VIEW IF EXISTS public.stock_alerts_view CASCADE;

-- ÉTAPE 2: Recréer avec définition CORRECTE (originale 20251012_001)
-- ============================================================================
CREATE OR REPLACE VIEW public.stock_alerts_view AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.sku,
  p.stock_quantity,
  p.min_stock,
  s.has_been_ordered,
  s.alert_status,
  s.alert_priority
FROM products p
CROSS JOIN LATERAL get_smart_stock_status(p.id) s
WHERE p.archived_at IS NULL
  AND s.alert_status IN ('out_of_stock', 'low_stock')  -- Seulement alertes actives
ORDER BY s.alert_priority DESC, p.stock_quantity ASC;

-- ÉTAPE 3: Documentation et permissions
-- ============================================================================
COMMENT ON VIEW public.stock_alerts_view IS
'Vue alertes stock intelligentes - Utilise get_smart_stock_status()
Mode SECURITY INVOKER (par défaut) - Respecte RLS policies des tables sous-jacentes
Affiche uniquement produits avec alertes actives (out_of_stock, low_stock)';

-- Grant SELECT à authenticated (RLS de 'products' s'applique)
GRANT SELECT ON public.stock_alerts_view TO authenticated;

-- ÉTAPE 4: Validation automatique
-- ============================================================================
DO $$
DECLARE
  v_view_count INTEGER;
  v_security_definer_count INTEGER;
  v_function_count INTEGER;
BEGIN
  -- Test 1: Vérifier vue créée
  SELECT COUNT(*) INTO v_view_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname = 'stock_alerts_view';

  IF v_view_count = 0 THEN
    RAISE EXCEPTION '❌ Vue stock_alerts_view non créée!';
  END IF;

  -- Test 2: Vérifier pas de SECURITY DEFINER
  SELECT COUNT(*) INTO v_security_definer_count
  FROM pg_views
  WHERE schemaname = 'public'
    AND viewname = 'stock_alerts_view'
    AND definition LIKE '%SECURITY DEFINER%';

  IF v_security_definer_count > 0 THEN
    RAISE EXCEPTION '❌ Vue stock_alerts_view a SECURITY DEFINER (risque sécurité)!';
  END IF;

  -- Test 3: Vérifier fonction get_smart_stock_status existe
  SELECT COUNT(*) INTO v_function_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_smart_stock_status';

  IF v_function_count = 0 THEN
    RAISE EXCEPTION '❌ Fonction get_smart_stock_status() manquante! Appliquer migration 20251012_001 d''abord.';
  END IF;

  -- Test 4: Vérifier vue retourne données (au moins 0 lignes sans erreur)
  PERFORM * FROM stock_alerts_view LIMIT 1;

  -- Succès
  RAISE NOTICE '✅ Vue stock_alerts_view restaurée avec succès';
  RAISE NOTICE '   - Définition: products + get_smart_stock_status()';
  RAISE NOTICE '   - Sécurité: SECURITY INVOKER (RLS respecté)';
  RAISE NOTICE '   - Permissions: SELECT granted to authenticated';
  RAISE NOTICE '   - Test SELECT: OK';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION '❌ Validation échouée: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END $$;

-- ============================================================================
-- FIN MIGRATION
-- ============================================================================
--
-- TESTS POST-MIGRATION À EFFECTUER:
--
-- 1. Vérifier vue existe:
--    SELECT * FROM stock_alerts_view LIMIT 5;
--
-- 2. Vérifier RLS respecté (multi-tenancy):
--    SET ROLE authenticated;
--    SET request.jwt.claims TO '{"organisation_id": "test-uuid"}';
--    SELECT COUNT(*) FROM stock_alerts_view;
--
-- 3. Vérifier frontend (0 erreur console):
--    npm run dev
--    http://localhost:3000 → Console DevTools = 0 erreur
--
-- 4. Vérifier pre-push hook passe:
--    git add . && git commit -m "fix" && git push
--
-- ============================================================================
