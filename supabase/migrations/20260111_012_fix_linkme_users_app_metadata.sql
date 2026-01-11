-- ============================================================================
-- Migration: Fix LinkMe Users App Metadata
-- Date: 2026-01-11
--
-- Les utilisateurs LinkMe n'ont pas raw_app_meta_data.app défini.
-- La RLS user_profiles_select_own_app utilise COALESCE(..., 'back-office')
-- donc les users LinkMe (app='linkme') ne peuvent pas lire leur profil.
--
-- Cette migration définit raw_app_meta_data.app = 'linkme' pour tous les
-- utilisateurs ayant un rôle LinkMe actif.
-- ============================================================================

-- Mettre à jour les utilisateurs LinkMe existants
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"app": "linkme"}'::jsonb
WHERE id IN (
  SELECT user_id
  FROM user_app_roles
  WHERE app = 'linkme' AND is_active = true
);

-- Vérification
DO $$
DECLARE
  v_updated INTEGER;
  v_missing INTEGER;
BEGIN
  -- Compter les utilisateurs mis à jour
  SELECT COUNT(*) INTO v_updated
  FROM auth.users au
  JOIN user_app_roles uar ON au.id = uar.user_id
  WHERE uar.app = 'linkme' AND uar.is_active = true
  AND au.raw_app_meta_data->>'app' = 'linkme';

  -- Compter ceux qui manquent encore
  SELECT COUNT(*) INTO v_missing
  FROM auth.users au
  JOIN user_app_roles uar ON au.id = uar.user_id
  WHERE uar.app = 'linkme' AND uar.is_active = true
  AND (au.raw_app_meta_data->>'app' IS NULL OR au.raw_app_meta_data->>'app' != 'linkme');

  IF v_missing = 0 THEN
    RAISE NOTICE 'SUCCESS: % LinkMe users have app metadata set correctly', v_updated;
  ELSE
    RAISE WARNING 'PROBLEM: % LinkMe users still missing app metadata', v_missing;
  END IF;
END $$;
