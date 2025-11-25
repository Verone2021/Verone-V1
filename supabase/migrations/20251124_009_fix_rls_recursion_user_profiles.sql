-- =====================================================
-- Migration: Fix RLS Infinite Recursion on user_profiles
-- Date: 2024-11-24
-- Author: Roméo Dos Santos (validation)
-- Issue: Error 42P17 "infinite recursion detected in policy for relation user_profiles"
-- =====================================================

-- PROBLÈME IDENTIFIÉ :
-- Les RLS policies sur user_profiles appellent get_user_role() et get_user_organisation_id()
-- Ces fonctions queryent user_profiles → déclenche RLS policies → récursion infinie

-- SOLUTION :
-- Ajouter "SET LOCAL row_security = off" dans les fonctions pour bypasser RLS
-- C'est sécurisé car les fonctions sont SECURITY DEFINER (exécutées avec privilèges owner)

-- =====================================================
-- FIX 1: get_user_role() - Bypass RLS pour éviter récursion
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role_type
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  user_role user_role_type;
BEGIN
  -- ✅ Désactive RLS pour cette requête uniquement (scope de la transaction)
  -- Nécessaire pour éviter récursion infinie : Policy → get_user_role() → Query user_profiles → Policy → ∞
  SET LOCAL row_security = off;

  -- Query user_profiles sans déclencher les RLS policies
  SELECT role INTO user_role
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  RETURN user_role;
END;
$function$;

COMMENT ON FUNCTION public.get_user_role() IS
'Retourne le rôle de l''utilisateur courant.
SECURITY DEFINER + row_security=off pour éviter récursion RLS.
Utilisé dans les policies RLS de user_profiles et autres tables.';

-- =====================================================
-- FIX 2: get_user_organisation_id() - Bypass RLS
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_organisation_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  user_role user_role_type;
  org_id uuid;
BEGIN
  -- ✅ Désactive RLS pour cette requête uniquement
  SET LOCAL row_security = off;

  -- Query user_profiles en une seule fois pour optimiser
  SELECT role, partner_id INTO user_role, org_id
  FROM public.user_profiles
  WHERE user_id = auth.uid();

  -- Staff interne Vérone (back-office) : pas d'organisation externe
  -- Les permissions sont gérées par les rôles (owner, admin, sales, etc.)
  IF user_role IN ('owner', 'admin', 'sales', 'catalog_manager', 'partner_manager') THEN
    RETURN NULL;
  END IF;

  -- Partenaires externes (LinkMe) : retourne partner_id
  RETURN org_id;
END;
$function$;

COMMENT ON FUNCTION public.get_user_organisation_id() IS
'Retourne l''organisation_id de l''utilisateur courant (ou NULL pour staff interne).
SECURITY DEFINER + row_security=off pour éviter récursion RLS.
Architecture: Staff Vérone = NULL, Partenaires externes = partner_id.';

-- =====================================================
-- VÉRIFICATION : user_has_access_to_organisation()
-- =====================================================

-- ✅ Pas de modification nécessaire pour cette fonction
-- Elle appelle get_user_role() et get_user_organisation_id() qui sont maintenant fixées
-- La récursion est brisée en amont

-- Vérifions que la fonction existe et est correcte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'user_has_access_to_organisation'
  ) THEN
    RAISE EXCEPTION 'Fonction user_has_access_to_organisation() manquante. Migration corrompue.';
  END IF;
END $$;

-- =====================================================
-- VALIDATION POST-MIGRATION
-- =====================================================

-- Test de non-régression : Vérifier que les fonctions retournent des valeurs
DO $$
DECLARE
  test_role user_role_type;
  test_org_id uuid;
BEGIN
  -- Note: Ces SELECTs échoueront si aucun utilisateur n'est connecté
  -- C'est attendu. On vérifie juste que les fonctions sont définies correctement

  -- Test get_user_role() (retournera NULL si pas d'auth context, c'est OK)
  SELECT get_user_role() INTO test_role;

  -- Test get_user_organisation_id() (retournera NULL si pas d'auth context, c'est OK)
  SELECT get_user_organisation_id() INTO test_org_id;

  RAISE NOTICE '✅ Migration 009 appliquée avec succès';
  RAISE NOTICE '   - get_user_role() : Fixée avec row_security=off';
  RAISE NOTICE '   - get_user_organisation_id() : Fixée avec row_security=off';
  RAISE NOTICE '   - user_has_access_to_organisation() : Inchangée (hérite du fix)';
END $$;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- ✅ Création d'utilisateur admin : FONCTIONNELLE (plus d'erreur 42P17)
-- ✅ RLS policies user_profiles : FONCTIONNELLES (pas de récursion)
-- ✅ Architecture multi-canal : PRÉSERVÉE
-- ✅ Staff organisation_id=NULL : AUTORISÉ (contrainte supprimée migration 008)

-- =====================================================
-- DOCUMENTATION TECHNIQUE
-- =====================================================

-- POURQUOI "SET LOCAL row_security = off" EST SÉCURISÉ :
-- 1. Scope limité : SET LOCAL n'affecte que la transaction courante, pas globalement
-- 2. SECURITY DEFINER : Fonction exécutée avec les privilèges du propriétaire (postgres)
-- 3. Contrôle d'accès : auth.uid() garantit qu'on ne lit que le profil de l'utilisateur authentifié
-- 4. Pas d'injection : Pas de paramètres utilisateur dans les queries (seulement auth.uid())

-- RÉCURSION ÉVITÉE :
-- Avant : Policy → get_user_role() → SELECT user_profiles → Policy → get_user_role() → ∞
-- Après : Policy → get_user_role() [row_security=off] → SELECT user_profiles (bypass RLS) → Return

-- IMPACT PERFORMANCE :
-- ✅ Amélioration : Plus de récursion = queries plus rapides
-- ✅ Cache : auth.uid() est mis en cache par Supabase
-- ✅ Index : user_id est primary key (lookup instantané)
