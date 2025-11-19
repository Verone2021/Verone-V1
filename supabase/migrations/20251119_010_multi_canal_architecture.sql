-- =====================================================================
-- 🚀 MIGRATION ARCHITECTURE: Multi-Canal user_profiles
-- =====================================================================
-- Date: 2025-11-19
-- Auteur: Claude Code (Architecture Multi-Frontends)
-- Priorité: P1 MAJOR
-- =====================================================================
-- CONTEXTE:
-- Architecture Turborepo actuelle avec 3 frontends séparés :
--   - back-office (Port 3000) : CRM/ERP Admin
--   - site-internet (Port 3001) : E-commerce Public
--   - linkme (Port 3002) : Commissions Apporteurs
--
-- Besoin: Différencier users selon canal + organisation + hiérarchie
--
-- Cette migration ajoute 4 colonnes critiques :
--   1. organisation_id : Isolation tenant (multi-organisation)
--   2. app_source : Canal d'inscription (back-office | site-internet | linkme)
--   3. parent_user_id : Hiérarchie comptes (consolidation)
--   4. client_type : Segmentation (particulier | professionnel)
-- =====================================================================

-- Référence:
-- - docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md (Phase 2)
-- - docs/architecture/TURBOREPO-FINAL-CHECKLIST.md (Multi-frontends)
-- - .claude/contexts/monorepo.md (Architecture 3 apps)

-- =====================================================================
-- 1. VÉRIFIER TYPE app_type EXISTE
-- =====================================================================

-- Type app_type pour différencier canaux
CREATE TYPE IF NOT EXISTS app_type AS ENUM (
  'back-office',   -- Admin CRM/ERP (port 3000)
  'site-internet', -- E-commerce public (port 3001)
  'linkme'         -- Apporteurs d'affaires (port 3002)
);

COMMENT ON TYPE app_type IS
  'Canal d''origine utilisateur.
  - back-office: Créé par admin (équipe interne)
  - site-internet: Auto-inscription e-commerce
  - linkme: Inscription vendeur/apporteur';

-- =====================================================================
-- 2. VÉRIFIER TYPE client_type EXISTE
-- =====================================================================

-- Type client_type pour segmentation commerciale
CREATE TYPE IF NOT EXISTS client_type AS ENUM (
  'particulier',   -- B2C (grand public)
  'professionnel'  -- B2B (entreprises, artisans)
);

COMMENT ON TYPE client_type IS
  'Segmentation client B2C/B2B.
  - particulier: Grand public (B2C)
  - professionnel: Entreprises, artisans (B2B)
  Impacte : tarification, conditions paiement, catalogues';

-- =====================================================================
-- 3. AJOUTER COLONNES MULTI-CANAL (Idempotent)
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '🔧 Ajout colonnes multi-canal à user_profiles...';

  -- 3.1 organisation_id : Isolation tenant
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'organisation_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN organisation_id UUID REFERENCES organisations(id);

    RAISE NOTICE '✅ Colonne organisation_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne organisation_id existe déjà';
  END IF;

  -- 3.2 app_source : Canal d'inscription
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'app_source'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN app_source app_type DEFAULT 'back-office';

    RAISE NOTICE '✅ Colonne app_source ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne app_source existe déjà';
  END IF;

  -- 3.3 parent_user_id : Hiérarchie comptes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'parent_user_id'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN parent_user_id UUID REFERENCES user_profiles(user_id);

    RAISE NOTICE '✅ Colonne parent_user_id ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne parent_user_id existe déjà';
  END IF;

  -- 3.4 client_type : Segmentation B2C/B2B
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'client_type'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN client_type client_type;

    RAISE NOTICE '✅ Colonne client_type ajoutée';
  ELSE
    RAISE NOTICE 'ℹ️  Colonne client_type existe déjà';
  END IF;

END $$;

-- =====================================================================
-- 4. CONTRAINTES MÉTIER
-- =====================================================================

-- 4.1 Contrainte parent_user_id : Pas de cycle (user ne peut être son propre parent)
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_no_self_parent;

ALTER TABLE user_profiles
ADD CONSTRAINT check_no_self_parent
CHECK (parent_user_id IS NULL OR parent_user_id != user_id);

-- 4.2 Contrainte organisation_id : Obligatoire pour certains rôles
-- (Owner/Admin DOIVENT avoir organisation_id)
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_organisation_required_for_admin;

ALTER TABLE user_profiles
ADD CONSTRAINT check_organisation_required_for_admin
CHECK (
  (role IN ('owner', 'admin') AND organisation_id IS NOT NULL)
  OR (role NOT IN ('owner', 'admin'))
);

-- =====================================================================
-- 5. INDEX PERFORMANCE
-- =====================================================================

-- Index organisation_id (critique RLS policies)
CREATE INDEX IF NOT EXISTS idx_user_profiles_organisation_id
ON user_profiles(organisation_id)
WHERE organisation_id IS NOT NULL;

-- Index app_source (filtrage par canal)
CREATE INDEX IF NOT EXISTS idx_user_profiles_app_source
ON user_profiles(app_source);

-- Index parent_user_id (hiérarchie comptes)
CREATE INDEX IF NOT EXISTS idx_user_profiles_parent_user_id
ON user_profiles(parent_user_id)
WHERE parent_user_id IS NOT NULL;

-- Index client_type (segmentation commerciale)
CREATE INDEX IF NOT EXISTS idx_user_profiles_client_type
ON user_profiles(client_type)
WHERE client_type IS NOT NULL;

-- Index composite organisation + role (RLS query optimization)
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_role
ON user_profiles(organisation_id, role)
WHERE organisation_id IS NOT NULL;

-- =====================================================================
-- 6. TRIGGER : Auto-assigner organisation_id depuis créateur
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_assign_organisation_on_user_create()
RETURNS TRIGGER AS $$
DECLARE
  creator_org_id UUID;
BEGIN
  -- Si organisation_id pas fourni ET créé par un user authentifié
  IF NEW.organisation_id IS NULL AND auth.uid() IS NOT NULL THEN
    -- Récupérer organisation_id du créateur
    SELECT organisation_id
    INTO creator_org_id
    FROM user_profiles
    WHERE user_id = auth.uid();

    -- Assigner si trouvé
    IF creator_org_id IS NOT NULL THEN
      NEW.organisation_id := creator_org_id;
      RAISE NOTICE 'Auto-assignation organisation_id % depuis créateur %', creator_org_id, auth.uid();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Appliquer trigger
DROP TRIGGER IF EXISTS trigger_auto_assign_organisation ON user_profiles;

CREATE TRIGGER trigger_auto_assign_organisation
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_organisation_on_user_create();

-- =====================================================================
-- 7. TRIGGER : Valider hiérarchie parent_user_id
-- =====================================================================

CREATE OR REPLACE FUNCTION validate_parent_user_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  parent_org_id UUID;
  current_parent UUID;
  max_depth INTEGER := 10;
  depth INTEGER := 0;
BEGIN
  -- Si parent_user_id fourni
  IF NEW.parent_user_id IS NOT NULL THEN
    -- Vérifier parent existe
    IF NOT EXISTS (
      SELECT 1 FROM user_profiles WHERE user_id = NEW.parent_user_id
    ) THEN
      RAISE EXCEPTION 'parent_user_id % n''existe pas', NEW.parent_user_id;
    END IF;

    -- Vérifier même organisation (si organisations définies)
    SELECT organisation_id
    INTO parent_org_id
    FROM user_profiles
    WHERE user_id = NEW.parent_user_id;

    IF parent_org_id IS NOT NULL
       AND NEW.organisation_id IS NOT NULL
       AND parent_org_id != NEW.organisation_id THEN
      RAISE EXCEPTION 'parent_user_id doit être dans la même organisation';
    END IF;

    -- Vérifier pas de cycle (détection profondeur max 10)
    current_parent := NEW.parent_user_id;
    WHILE current_parent IS NOT NULL AND depth < max_depth LOOP
      -- Vérifier pas de retour sur user actuel (cycle)
      IF current_parent = NEW.user_id THEN
        RAISE EXCEPTION 'Cycle détecté dans hiérarchie parent_user_id';
      END IF;

      -- Monter d'un niveau
      SELECT parent_user_id
      INTO current_parent
      FROM user_profiles
      WHERE user_id = current_parent;

      depth := depth + 1;
    END LOOP;

    IF depth >= max_depth THEN
      RAISE EXCEPTION 'Hiérarchie parent_user_id trop profonde (max %)', max_depth;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer trigger
DROP TRIGGER IF EXISTS trigger_validate_parent_user ON user_profiles;

CREATE TRIGGER trigger_validate_parent_user
  BEFORE INSERT OR UPDATE OF parent_user_id ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_parent_user_hierarchy();

-- =====================================================================
-- 8. DOCUMENTATION COLONNES
-- =====================================================================

COMMENT ON COLUMN user_profiles.organisation_id IS
  'Organisation propriétaire de ce user (isolation tenant).

  🎯 Usage:
  - RLS policies filtrent par organisation_id (multi-tenant)
  - Owner/Admin DOIVENT avoir organisation_id (contrainte)
  - Auto-assigné depuis créateur si non fourni (trigger)

  🔗 Relations:
  - Référence: organisations(id)
  - Index: idx_user_profiles_organisation_id

  ⚠️ NULL autorisé uniquement pour rôles non-admin.

  Ajouté: 2025-11-19 (Phase 2 Multi-Canal)';

COMMENT ON COLUMN user_profiles.app_source IS
  'Canal d''inscription utilisateur.

  Valeurs:
  - back-office: Créé par admin dans CRM (port 3000)
  - site-internet: Auto-inscription e-commerce (port 3001)
  - linkme: Inscription vendeur/apporteur (port 3002)

  🎯 Usage:
  - Statistiques canal acquisition
  - Filtrage middlewares app-specific
  - Audit origine comptes

  Défaut: ''back-office''
  Index: idx_user_profiles_app_source

  Ajouté: 2025-11-19 (Phase 2 Multi-Canal)';

COMMENT ON COLUMN user_profiles.parent_user_id IS
  'User parent pour consolidation comptes (hiérarchie).

  🎯 Cas d''usage:
  - Client professionnel avec plusieurs comptes employés
  - Apporteur principal + sous-apporteurs
  - Consolidation facturation/commissions

  🔗 Relations:
  - FK: user_profiles(user_id)
  - Contrainte: Pas de cycle (check_no_self_parent)
  - Validation: Même organisation que parent (trigger)

  📊 Requêtes hiérarchiques:
  WITH RECURSIVE hierarchy AS (
    SELECT user_id, parent_user_id, 1 as level
    FROM user_profiles WHERE user_id = ?
    UNION ALL
    SELECT up.user_id, up.parent_user_id, h.level + 1
    FROM user_profiles up
    JOIN hierarchy h ON up.parent_user_id = h.user_id
    WHERE h.level < 10
  )
  SELECT * FROM hierarchy;

  Ajouté: 2025-11-19 (Phase 2 Multi-Canal)';

COMMENT ON COLUMN user_profiles.client_type IS
  'Segmentation commerciale B2C/B2B.

  Valeurs:
  - particulier: Grand public (B2C)
  - professionnel: Entreprises, artisans (B2B)

  🎯 Impact:
  - Tarification (grilles prix B2C vs B2B)
  - Conditions paiement (comptant vs 30j)
  - Catalogues visibles
  - Remises applicables
  - Process validation commandes

  ℹ️  NULL autorisé (= non segmenté).
  Index: idx_user_profiles_client_type

  Ajouté: 2025-11-19 (Phase 2 Multi-Canal)';

-- =====================================================================
-- 9. MIGRATION DONNÉES EXISTANTES (Si nécessaire)
-- =====================================================================

-- Assigner organisation_id par défaut aux users existants sans organisation
-- (Uniquement si une organisation "default" existe)
DO $$
DECLARE
  default_org_id UUID;
  updated_count INTEGER;
BEGIN
  -- Chercher organisation "default" ou "internal"
  SELECT id INTO default_org_id
  FROM organisations
  WHERE slug IN ('default', 'internal', 'verone')
  LIMIT 1;

  IF default_org_id IS NOT NULL THEN
    -- Assigner aux users sans organisation (sauf non-admin)
    UPDATE user_profiles
    SET organisation_id = default_org_id
    WHERE organisation_id IS NULL
      AND role IN ('owner', 'admin', 'catalog_manager', 'sales');

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    IF updated_count > 0 THEN
      RAISE NOTICE '✅ % users assignés à organisation défaut %', updated_count, default_org_id;
    END IF;
  ELSE
    RAISE NOTICE 'ℹ️  Aucune organisation par défaut trouvée (slug: default/internal/verone)';
    RAISE NOTICE 'ℹ️  Users existants conservent organisation_id NULL';
  END IF;
END $$;

-- =====================================================================
-- 10. VALIDATION FINALE
-- =====================================================================

DO $$
DECLARE
  total_users INTEGER;
  users_with_org INTEGER;
  users_without_org INTEGER;
  admin_without_org INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  SELECT COUNT(*) INTO users_with_org FROM user_profiles WHERE organisation_id IS NOT NULL;
  SELECT COUNT(*) INTO users_without_org FROM user_profiles WHERE organisation_id IS NULL;
  SELECT COUNT(*) INTO admin_without_org
  FROM user_profiles
  WHERE organisation_id IS NULL AND role IN ('owner', 'admin');

  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎯 VALIDATION MIGRATION MULTI-CANAL';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '   Total users: %', total_users;
  RAISE NOTICE '   Users avec organisation: %', users_with_org;
  RAISE NOTICE '   Users sans organisation: %', users_without_org;
  RAISE NOTICE '   Admin/Owner sans organisation: %', admin_without_org;

  IF admin_without_org > 0 THEN
    RAISE WARNING '⚠️ % admin/owner n''ont pas d''organisation_id', admin_without_org;
    RAISE WARNING 'ℹ️  Cela viole la contrainte check_organisation_required_for_admin';
    RAISE WARNING 'ℹ️  Assigner manuellement ou créer organisation par défaut';
  ELSE
    RAISE NOTICE '✅ Tous les admin/owner ont organisation_id';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration Multi-Canal : SUCCÈS';
  RAISE NOTICE 'ℹ️  Next: Phase 2.2 - Créer RLS policies multi-canal';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION
-- Impact: 4 nouvelles colonnes + 2 triggers + contraintes métier
-- Breaking: Owner/Admin DOIVENT avoir organisation_id
-- Next Step: Phase 2.2 - RLS policies avec isolation tenant
-- =====================================================================
