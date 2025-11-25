-- =====================================================
-- Migration: Fix user_profiles INSERT Policy - Remove Direct SELECT
-- Date: 2024-11-24
-- Author: Roméo Dos Santos (validation)
-- Issue: Policy INSERT fait SELECT direct sur user_profiles → récursion infinie
-- =====================================================

-- PROBLÈME IDENTIFIÉ :
-- Migration 009 a fixé get_user_role() avec row_security=off
-- MAIS la policy INSERT fait ENCORE un SELECT direct sur user_profiles :
--   EXISTS (SELECT 1 FROM user_profiles WHERE user_id = get_current_user_id() ...)
-- Ce SELECT déclenche RLS policies → récursion infinie

-- SOLUTION :
-- Remplacer le SELECT direct par get_user_role() qui bypass RLS

-- =====================================================
-- FIX: Policy INSERT - Utiliser get_user_role()
-- =====================================================

-- Supprimer la policy INSERT actuelle (cassée)
DROP POLICY IF EXISTS "user_profiles_insert_admin_back_office" ON user_profiles;

-- Créer nouvelle policy INSERT utilisant get_user_role()
CREATE POLICY "user_profiles_insert_admin_back_office"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  -- Vérifier que l'app est back-office
  app = 'back-office'::app_type
  AND
  -- Vérifier que l'utilisateur actuel est owner ou admin
  -- ✅ get_user_role() bypass RLS (SET LOCAL row_security = off)
  get_user_role() IN ('owner'::user_role_type, 'admin'::user_role_type)
);

COMMENT ON POLICY "user_profiles_insert_admin_back_office" ON user_profiles IS
'Seuls les owners et admins peuvent créer des profils back-office.
Utilise get_user_role() qui bypass RLS (migration 009) pour éviter récursion.';

-- =====================================================
-- BONUS: Simplifier autres policies si nécessaire
-- =====================================================

-- La policy SELECT "staff_all" utilise déjà get_user_role() (OK)
-- La policy SELECT "staff_own" utilise get_current_user_id() qui est wrapper auth.uid() (OK)
-- La policy SELECT "staff_org" utilise user_has_access_to_organisation() qui appelle get_user_role() fixé (OK)
-- La policy UPDATE utilise get_user_role() (OK)
-- La policy DELETE utilise get_user_role() (OK)

-- Toutes les autres policies sont correctes maintenant que get_user_role() bypass RLS

-- =====================================================
-- VALIDATION POST-MIGRATION
-- =====================================================

DO $$
BEGIN
  -- Vérifier que la nouvelle policy existe
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      AND policyname = 'user_profiles_insert_admin_back_office'
  ) THEN
    RAISE EXCEPTION 'Policy user_profiles_insert_admin_back_office non créée. Migration échouée.';
  END IF;

  RAISE NOTICE '✅ Migration 010 appliquée avec succès';
  RAISE NOTICE '   - Policy INSERT : Remplacée (utilise get_user_role())';
  RAISE NOTICE '   - Récursion : Éliminée (pas de SELECT direct sur user_profiles)';
END $$;

-- =====================================================
-- RÉSULTAT ATTENDU
-- =====================================================

-- ✅ Création d'utilisateur admin : FONCTIONNELLE (plus d'erreur 42P17)
-- ✅ Policy INSERT : SELECT via get_user_role() qui bypass RLS
-- ✅ Chaîne d'appels : Policy → get_user_role() [row_security=off] → SELECT user_profiles → Return
-- ✅ Pas de récursion possible

-- =====================================================
-- LOGIQUE SÉCURISÉE
-- =====================================================

-- Avant (CASSÉ) :
-- INSERT user_profiles
--   → Policy CHECK
--     → EXISTS (SELECT FROM user_profiles WHERE ...)
--       → RLS policies trigger
--         → get_user_role()
--           → SELECT user_profiles
--             → RLS policies trigger
--               → ∞ RÉCURSION

-- Après (FIXÉ) :
-- INSERT user_profiles
--   → Policy CHECK
--     → get_user_role() [SECURITY DEFINER + row_security=off]
--       → SELECT user_profiles (BYPASS RLS)
--       → Return role
--     → IN ('owner', 'admin') ?
--     → ✅ Autorisé ou ❌ Refusé
-- PAS de récursion : get_user_role() bypass RLS avec row_security=off
