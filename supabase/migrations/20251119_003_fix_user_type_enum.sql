-- =====================================================================
-- 🔧 MIGRATION CORRECTION: user_type TEXT → ENUM
-- =====================================================================
-- Date: 2025-11-19
-- Auteur: Claude Code (Audit Dette Technique Auth)
-- Priorité: P2 MODERATE
-- =====================================================================
-- CONTEXTE:
-- Audit Phase 1.1 a détecté incohérence type colonne user_type:
--   - Migration initiale (20250113_002 ligne 38): user_type ENUM ✅
--   - Types TypeScript: user_type: string ❌
--
-- Cette migration vérifie le type réel et corrige si nécessaire.
-- =====================================================================

-- Référence:
-- docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md
-- Section: Problème user_type (TEXT vs ENUM)

-- =====================================================================
-- 1. VÉRIFIER TYPE ACTUEL
-- =====================================================================

DO $$
DECLARE
  current_type TEXT;
  is_enum BOOLEAN;
BEGIN
  -- Récupérer type actuel de la colonne
  SELECT data_type
  INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'user_type'
    AND table_schema = 'public';

  -- Vérifier si c'est un ENUM
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'user_profiles'
      AND column_name = 'user_type'
      AND udt_name = 'user_type'  -- Nom du type ENUM
  ) INTO is_enum;

  RAISE NOTICE '📊 Type actuel user_profiles.user_type: %', current_type;
  RAISE NOTICE '🔍 Est ENUM user_type: %', is_enum;

  IF is_enum THEN
    RAISE NOTICE '✅ Colonne déjà ENUM user_type (correct)';
    RAISE NOTICE 'ℹ️  Types TypeScript seront régénérés en Phase 1.6';
  ELSE
    RAISE NOTICE '⚠️ Colonne est % (doit être ENUM user_type)', current_type;
  END IF;
END $$;

-- =====================================================================
-- 2. CONVERTIR TEXT → ENUM (Si nécessaire)
-- =====================================================================

DO $$
DECLARE
  current_type TEXT;
BEGIN
  -- Vérifier type actuel
  SELECT data_type
  INTO current_type
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'user_type'
    AND table_schema = 'public';

  -- Si TEXT, convertir en ENUM
  IF current_type != 'USER-DEFINED' THEN
    RAISE NOTICE 'Conversion user_type TEXT → ENUM...';

    -- Vérifier valeurs actuelles sont valides
    PERFORM user_type
    FROM user_profiles
    WHERE user_type NOT IN ('staff', 'supplier', 'customer', 'partner')
    LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'Valeurs invalides détectées dans user_type. Vérifier données avant conversion.';
    END IF;

    -- Conversion (via colonne temporaire car ALTER TYPE impossible)
    ALTER TABLE user_profiles
    ADD COLUMN user_type_new user_type;

    -- Copier valeurs
    UPDATE user_profiles
    SET user_type_new = user_type::user_type;

    -- Remplacer colonne
    ALTER TABLE user_profiles
    DROP COLUMN user_type;

    ALTER TABLE user_profiles
    RENAME COLUMN user_type_new TO user_type;

    -- Restaurer DEFAULT
    ALTER TABLE user_profiles
    ALTER COLUMN user_type SET DEFAULT 'staff'::user_type;

    RAISE NOTICE '✅ Conversion user_type TEXT → ENUM réussie';
  ELSE
    RAISE NOTICE 'ℹ️  Aucune conversion nécessaire (déjà ENUM)';
  END IF;
END $$;

-- =====================================================================
-- 3. VÉRIFIER ENUM user_type EXISTE ET EST CORRECT
-- =====================================================================

DO $$
DECLARE
  enum_values TEXT[];
  expected_values TEXT[] := ARRAY['staff', 'supplier', 'customer', 'partner'];
BEGIN
  -- Récupérer valeurs ENUM
  SELECT ARRAY_AGG(enumlabel ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'user_type'::regtype;

  RAISE NOTICE '📋 Valeurs ENUM user_type: %', enum_values;

  -- Vérifier toutes les valeurs attendues existent
  IF enum_values @> expected_values THEN
    RAISE NOTICE '✅ ENUM user_type contient toutes les valeurs attendues';
  ELSE
    RAISE WARNING '⚠️ ENUM user_type manque certaines valeurs attendues';
    RAISE WARNING '   Attendu: %', expected_values;
    RAISE WARNING '   Actuel: %', enum_values;
  END IF;
END $$;

-- =====================================================================
-- 4. RECRÉER INDEX (Si détruit par conversion)
-- =====================================================================

-- Index sur user_type pour performance RLS policies
CREATE INDEX IF NOT EXISTS idx_user_profiles_type
ON user_profiles(user_type);

-- =====================================================================
-- 5. DOCUMENTER COLONNE
-- =====================================================================

COMMENT ON COLUMN user_profiles.user_type IS
  'Type utilisateur (staff, supplier, customer, partner).
  Type: ENUM user_type (corrigé 2025-11-19).

  Valeurs:
  - staff: Équipe interne (défaut)
  - supplier: Fournisseur externe
  - customer: Client
  - partner: Partenaire commercial

  📊 Usage actuel: COSMÉTIQUE UNIQUEMENT (4 fichiers, labels UI).
  ⚠️ Rôle permissions contrôlé par user_profiles.role (pas user_type).

  Audit: docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md';

-- =====================================================================
-- 6. VALIDATION FINALE
-- =====================================================================

DO $$
DECLARE
  column_type TEXT;
  enum_type TEXT;
  default_value TEXT;
BEGIN
  -- Vérifier type final
  SELECT data_type, udt_name, column_default
  INTO column_type, enum_type, default_value
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND column_name = 'user_type'
    AND table_schema = 'public';

  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎯 VALIDATION FINALE user_type';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '   Type colonne: % (udt: %)', column_type, enum_type;
  RAISE NOTICE '   Valeur défaut: %', default_value;

  IF column_type = 'USER-DEFINED' AND enum_type = 'user_type' THEN
    RAISE NOTICE '✅ user_type est correctement ENUM user_type';
  ELSE
    RAISE EXCEPTION '❌ user_type n''est pas ENUM user_type (type: %, udt: %)', column_type, enum_type;
  END IF;

  -- Vérifier données cohérentes
  PERFORM user_type
  FROM user_profiles
  WHERE user_type IS NULL;

  IF FOUND THEN
    RAISE WARNING '⚠️ Certains user_profiles ont user_type NULL';
  ELSE
    RAISE NOTICE '✅ Aucun user_type NULL';
  END IF;

  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '✅ Migration user_type TEXT → ENUM : SUCCÈS';
  RAISE NOTICE 'ℹ️  Next: Phase 1.6 - Régénérer types TypeScript';
  RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: READY FOR PRODUCTION
-- Impact: Correction type colonne (breaking si code supposait TEXT)
-- Rollback: Reconvertir ENUM → TEXT (non recommandé)
-- Next Step: Phase 1.6 - Régénérer types TypeScript
-- =====================================================================
