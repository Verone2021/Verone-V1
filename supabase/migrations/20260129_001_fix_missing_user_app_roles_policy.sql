-- ============================================================================
-- Migration: Fix missing "Users can view their own roles" policy
-- Date: 2026-01-29
-- URGENCE: CRITIQUE - Corrige l'authentification LinkMe en production
--
-- PROBLEME:
-- La migration 20260121_005 a supprimé la policy "Users can view their own roles"
-- (via migration 003) mais ne l'a JAMAIS recréée. Le commentaire ligne 27-28
-- de la migration 005 dit "On garde cette policy" mais elle n'existe pas !
--
-- SYMPTOME:
-- - Login Supabase réussit (POST /auth/v1/token → 200)
-- - Cookie d'auth créé et envoyé
-- - Dashboard (main)/layout.tsx vérifie user_app_roles
-- - Query SELECT retourne VIDE (RLS bloque tout)
-- - Layout redirige vers /login
-- - Boucle de redirection infinie
--
-- SOLUTION:
-- Recréer la policy "Users can view their own roles" qui permet à chaque
-- utilisateur de lire SES PROPRES rôles (sans récursion).
--
-- Cette policy est CRITIQUE car elle permet aux layouts server-side de vérifier
-- les rôles de l'utilisateur connecté.
-- ============================================================================

-- Supprimer si existe (au cas où elle aurait été recréée manuellement)
DROP POLICY IF EXISTS "Users can view their own roles" ON user_app_roles;

-- Recréer la policy SANS récursion (simple comparaison auth.uid())
CREATE POLICY "Users can view their own roles"
  ON user_app_roles
  FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- VALIDATION: Vérifier que la policy existe bien
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_app_roles'
    AND policyname = 'Users can view their own roles';

  IF policy_count = 0 THEN
    RAISE EXCEPTION 'ERREUR: Policy "Users can view their own roles" non créée !';
  END IF;

  RAISE NOTICE '✅ Policy "Users can view their own roles" créée avec succès';
  RAISE NOTICE '✅ Les utilisateurs peuvent maintenant lire leurs propres rôles';
  RAISE NOTICE '✅ L''authentification LinkMe devrait fonctionner en production';
END $$;
