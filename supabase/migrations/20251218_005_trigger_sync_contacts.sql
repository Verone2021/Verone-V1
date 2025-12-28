-- ============================================
-- Migration: Trigger pour synchroniser contacts avec user_app_roles LinkMe
-- Date: 2025-12-18
-- Description:
--   1. Créer automatiquement un contact quand un user LinkMe est créé
--   2. Mettre à jour le contact si user_app_roles change
--   3. Backfill des users LinkMe existants sans contact
-- ============================================

-- ============================================
-- PHASE 1: Fonction trigger
-- ============================================

CREATE OR REPLACE FUNCTION handle_linkme_user_contact_sync()
RETURNS TRIGGER AS $$
DECLARE
  v_user_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_phone TEXT;
BEGIN
  -- Seulement pour app='linkme'
  IF NEW.app != 'linkme' THEN
    RETURN NEW;
  END IF;

  -- Récupérer infos user depuis auth.users
  SELECT
    email,
    raw_user_meta_data->>'first_name',
    raw_user_meta_data->>'last_name'
  INTO v_user_email, v_first_name, v_last_name
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Si pas d'email, on ne peut pas créer le contact
  IF v_user_email IS NULL THEN
    RAISE NOTICE '⚠️ Pas d email pour user_id %, skip création contact', NEW.user_id;
    RETURN NEW;
  END IF;

  -- Récupérer phone depuis user_profiles
  SELECT phone INTO v_phone
  FROM user_profiles
  WHERE user_id = NEW.user_id;

  -- UPSERT contact (idempotent)
  INSERT INTO contacts (
    email,
    first_name,
    last_name,
    phone,
    enseigne_id,
    organisation_id,
    owner_type,
    is_primary_contact,
    is_active,
    notes,
    created_at,
    updated_at
  )
  VALUES (
    v_user_email,
    COALESCE(v_first_name, 'Utilisateur'),
    COALESCE(v_last_name, 'LinkMe'),
    v_phone,
    NEW.enseigne_id,
    NEW.organisation_id,
    CASE
      WHEN NEW.enseigne_id IS NOT NULL THEN 'enseigne'
      WHEN NEW.organisation_id IS NOT NULL THEN 'organisation'
      ELSE NULL
    END,
    true,
    true,
    'Contact auto-sync via trigger LinkMe (user_app_roles)',
    NOW(),
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    enseigne_id = COALESCE(EXCLUDED.enseigne_id, contacts.enseigne_id),
    organisation_id = COALESCE(EXCLUDED.organisation_id, contacts.organisation_id),
    owner_type = COALESCE(EXCLUDED.owner_type, contacts.owner_type),
    updated_at = NOW();

  RAISE NOTICE '✅ Contact sync pour user LinkMe: %', v_user_email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PHASE 2: Créer le trigger
-- ============================================

DROP TRIGGER IF EXISTS trg_sync_linkme_user_contact ON user_app_roles;

CREATE TRIGGER trg_sync_linkme_user_contact
  AFTER INSERT OR UPDATE ON user_app_roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_linkme_user_contact_sync();

-- ============================================
-- PHASE 3: Index pour performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_user_app_roles_user_app ON user_app_roles(user_id, app);

-- ============================================
-- PHASE 4: Backfill users LinkMe existants sans contact
-- ============================================

INSERT INTO contacts (
  email,
  first_name,
  last_name,
  phone,
  enseigne_id,
  organisation_id,
  owner_type,
  is_primary_contact,
  is_active,
  notes,
  created_at,
  updated_at
)
SELECT
  u.email,
  COALESCE(u.raw_user_meta_data->>'first_name', up.first_name, 'Utilisateur'),
  COALESCE(u.raw_user_meta_data->>'last_name', up.last_name, 'LinkMe'),
  up.phone,
  uar.enseigne_id,
  uar.organisation_id,
  CASE
    WHEN uar.enseigne_id IS NOT NULL THEN 'enseigne'
    WHEN uar.organisation_id IS NOT NULL THEN 'organisation'
    ELSE NULL
  END,
  true,
  true,
  'Contact backfill via migration 20251218_005',
  NOW(),
  NOW()
FROM auth.users u
JOIN user_app_roles uar ON uar.user_id = u.id AND uar.app = 'linkme'
LEFT JOIN user_profiles up ON up.user_id = u.id
WHERE NOT EXISTS (
  SELECT 1 FROM contacts c WHERE c.email = u.email
)
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- PHASE 5: Commentaires et validation
-- ============================================

COMMENT ON FUNCTION handle_linkme_user_contact_sync() IS
'Synchronise automatiquement un contact quand un user_app_role LinkMe est créé ou modifié.
- Récupère les infos depuis auth.users et user_profiles
- UPSERT dans contacts (idempotent via email)
- Remplit enseigne_id ou organisation_id selon le rôle';

COMMENT ON TRIGGER trg_sync_linkme_user_contact ON user_app_roles IS
'Déclenché sur INSERT/UPDATE de user_app_roles pour synchroniser les contacts LinkMe';

-- Validation
DO $$
DECLARE
  v_trigger_exists BOOLEAN;
  v_contact_count INT;
BEGIN
  -- Vérifier que le trigger existe
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_linkme_user_contact'
  ) INTO v_trigger_exists;

  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION 'Trigger trg_sync_linkme_user_contact non créé';
  END IF;

  -- Compter contacts créés/backfillés
  SELECT COUNT(*) INTO v_contact_count
  FROM contacts c
  WHERE EXISTS (
    SELECT 1 FROM user_app_roles uar
    JOIN auth.users u ON u.id = uar.user_id
    WHERE uar.app = 'linkme' AND u.email = c.email
  );

  RAISE NOTICE '✅ Migration sync contacts réussie - % contacts liés à des users LinkMe', v_contact_count;
END $$;
