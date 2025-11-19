-- =====================================================================
-- 📝 MIGRATION DOCUMENTATION: Colonnes Fantômes user_profiles
-- =====================================================================
-- Date: 2025-11-19
-- Auteur: Claude Code (Audit Dette Technique Auth)
-- Priorité: P2 DOCUMENTATION
-- =====================================================================
-- CONTEXTE:
-- Audit Phase 1.1 a détecté 5 colonnes déclarées dans types TypeScript
-- mais ABSENTES de la DB réelle user_profiles.
--
-- Ces colonnes fantômes proviennent d'une génération incorrecte des types
-- (probablement hallucination ou types générés sur ancienne version).
--
-- Cette migration DOCUMENTE ces colonnes pour référence future.
-- Phase 1.6 régénérera les types TypeScript corrects.
-- =====================================================================

-- Référence:
-- docs/audits/2025-11/AUDIT-DETTE-TECHNIQUE-AUTH-2025-11-19.md
-- Section: 5 Colonnes FANTÔMES Identifiées

-- =====================================================================
-- 1. DOCUMENTER COLONNES FANTÔMES (Commentaires SQL)
-- =====================================================================

COMMENT ON TABLE user_profiles IS
  'Profils utilisateurs étendus (auth.users → user_profiles 1:1).

  ⚠️ ATTENTION COLONNES FANTÔMES (types TypeScript mais PAS dans DB) :
  - app: app_type ENUM → Jamais implémentée, remplacée par app_source (Phase 2)
  - avatar_url: string → Feature avatar jamais implémentée
  - individual_customer_id: string → Lien customers fantôme, relation à revoir
  - last_sign_in_at: string → Redondant, existe dans auth.users.last_sign_in_at
  - organisation_id: string → PRÉVUE Phase 2 architecture multi-canal

  ✅ COLONNES RÉELLES (11) :
  - user_id (PK, FK auth.users)
  - role (user_role_type ENUM)
  - user_type (user_type... TEXT actuellement, doit être ENUM)
  - scopes (TEXT[])
  - partner_id (UUID)
  - first_name (TEXT)
  - last_name (TEXT)
  - phone (TEXT)
  - job_title (TEXT)
  - created_at (TIMESTAMPTZ)
  - updated_at (TIMESTAMPTZ)

  📅 Audit: 2025-11-19
  🔧 Fix: Régénération types TypeScript (migration 20251119_004)
  🚀 Phase 2: Ajout organisation_id + app_source + parent_user_id (migration 20251119_010)';

-- =====================================================================
-- 2. DOCUMENTER SCHÉMA RÉEL ACTUEL
-- =====================================================================

-- user_id (PK)
COMMENT ON COLUMN user_profiles.user_id IS
  'Clé primaire, référence auth.users(id). Relation 1:1 auth.users → user_profiles.';

-- role (ENUM user_role_type)
COMMENT ON COLUMN user_profiles.role IS
  'Rôle utilisateur (owner, admin, catalog_manager, sales, partner_manager).
  Contrôle permissions via RLS policies. ✅ UTILISÉ PARTOUT.';

-- user_type (devrait être ENUM)
COMMENT ON COLUMN user_profiles.user_type IS
  '⚠️ Type utilisateur (staff, supplier, customer, partner).
  PROBLÈME: Actuellement TEXT mais devrait être ENUM user_type.
  🔧 Fix: Migration 20251119_003 (Phase 1.5).
  📊 Usage: COSMÉTIQUE UNIQUEMENT (4 fichiers, labels "Équipe" vs "Standard").';

-- scopes (TEXT[])
COMMENT ON COLUMN user_profiles.scopes IS
  'Permissions granulaires (optionnel). ⚠️ Non utilisé actuellement.';

-- partner_id (UUID)
COMMENT ON COLUMN user_profiles.partner_id IS
  'Référence organisation partenaire (optionnel). ⚠️ Faible usage (1 endpoint /api/partners).';

-- first_name, last_name, phone, job_title
COMMENT ON COLUMN user_profiles.first_name IS
  'Prénom utilisateur (optionnel, max 50 chars). ✅ Ajouté migration 20251030_001.';

COMMENT ON COLUMN user_profiles.last_name IS
  'Nom famille utilisateur (optionnel, max 50 chars). ✅ Ajouté migration 20251030_001.';

COMMENT ON COLUMN user_profiles.phone IS
  'Téléphone français validé (optionnel). ✅ Ajouté migration 20251030_001.';

COMMENT ON COLUMN user_profiles.job_title IS
  'Intitulé poste/fonction (optionnel, max 100 chars). ✅ Ajouté migration 20251030_001.';

-- created_at, updated_at
COMMENT ON COLUMN user_profiles.created_at IS
  'Date création profil (auto NOW()). ✅ Utilisé analytics.';

COMMENT ON COLUMN user_profiles.updated_at IS
  'Date dernière modification (trigger auto). ✅ Utilisé analytics.';

-- =====================================================================
-- 3. DOCUMENTER COLONNES FANTÔMES DÉTAILLÉES
-- =====================================================================

-- Note: Ces colonnes N'EXISTENT PAS dans la DB, seulement dans types TypeScript

-- FANTÔME 1: app (app_type ENUM)
DO $$
BEGIN
  RAISE NOTICE '🔴 COLONNE FANTÔME: app (app_type ENUM)';
  RAISE NOTICE '   Statut DB: N''EXISTE PAS';
  RAISE NOTICE '   Statut Types: Déclarée (apps/back-office/src/types/supabase.ts)';
  RAISE NOTICE '   Usage Code: 0 références (grep -r "\.app")';
  RAISE NOTICE '   Origine: Hallucination types générés, jamais implémentée';
  RAISE NOTICE '   Solution: Remplacée par app_source en Phase 2 (20251119_010)';
END $$;

-- FANTÔME 2: avatar_url (string)
DO $$
BEGIN
  RAISE NOTICE '🔴 COLONNE FANTÔME: avatar_url (string)';
  RAISE NOTICE '   Statut DB: N''EXISTE PAS';
  RAISE NOTICE '   Statut Types: Déclarée (apps/back-office/src/types/supabase.ts)';
  RAISE NOTICE '   Usage Code: 0 références (grep -r "avatar_url")';
  RAISE NOTICE '   Origine: Feature avatar jamais implémentée';
  RAISE NOTICE '   Solution: Non prioritaire, disparaîtra à régénération types';
END $$;

-- FANTÔME 3: individual_customer_id (string)
DO $$
BEGIN
  RAISE NOTICE '🔴 COLONNE FANTÔME: individual_customer_id (string)';
  RAISE NOTICE '   Statut DB: N''EXISTE PAS';
  RAISE NOTICE '   Statut Types: Déclarée (apps/back-office/src/types/supabase.ts)';
  RAISE NOTICE '   Usage Code: 0 références directes';
  RAISE NOTICE '   Origine: Lien fantôme vers table customers (polymorphique)';
  RAISE NOTICE '   Solution: Relation à revoir avec polymorphic pattern';
END $$;

-- FANTÔME 4: last_sign_in_at (string)
DO $$
BEGIN
  RAISE NOTICE '🟡 COLONNE FANTÔME: last_sign_in_at (string)';
  RAISE NOTICE '   Statut DB: N''EXISTE PAS dans user_profiles';
  RAISE NOTICE '   Statut Types: Déclarée (apps/back-office/src/types/supabase.ts)';
  RAISE NOTICE '   Usage Code: 28 références (mais via auth.users.last_sign_in_at ✅)';
  RAISE NOTICE '   Origine: Redondant avec auth.users.last_sign_in_at';
  RAISE NOTICE '   Solution: Utiliser TOUJOURS auth.users.last_sign_in_at';
END $$;

-- FANTÔME 5: organisation_id (string) - CAS SPÉCIAL
DO $$
BEGIN
  RAISE NOTICE '🟠 COLONNE FANTÔME: organisation_id (string) - CAS SPÉCIAL';
  RAISE NOTICE '   Statut DB: N''EXISTE PAS actuellement';
  RAISE NOTICE '   Statut Types: Déclarée (apps/back-office/src/types/supabase.ts)';
  RAISE NOTICE '   Usage Code: 0 références directes (mais 26 RLS policies cassées!)';
  RAISE NOTICE '   Origine: Architecture multi-tenant PRÉVUE mais NON IMPLÉMENTÉE';
  RAISE NOTICE '   Solution: SERA AJOUTÉE en Phase 2 (migration 20251119_010)';
  RAISE NOTICE '   Impact: CRITIQUE - 12+ migrations RLS référencent cette colonne';
END $$;

-- =====================================================================
-- 4. PLAN CORRECTION
-- =====================================================================

DO $$
BEGIN
  RAISE NOTICE '📋 PLAN CORRECTION COLONNES FANTÔMES:';
  RAISE NOTICE '';
  RAISE NOTICE '  Phase 1.5 (20251119_003): Corriger user_type TEXT → ENUM';
  RAISE NOTICE '  Phase 1.6 (20251119_004): Régénérer types TypeScript';
  RAISE NOTICE '    → Supprime app, avatar_url, individual_customer_id, last_sign_in_at';
  RAISE NOTICE '';
  RAISE NOTICE '  Phase 2.1 (20251119_010): Ajouter colonnes multi-canal';
  RAISE NOTICE '    → Ajoute organisation_id, app_source, parent_user_id, client_type';
  RAISE NOTICE '  Phase 2.2 (20251119_011): RLS multi-canal avec organisation_id';
  RAISE NOTICE '';
  RAISE NOTICE '  ✅ Résultat: Types TypeScript synchronisés avec DB réelle';
END $$;

-- =====================================================================
-- 5. VALIDATION
-- =====================================================================

-- Vérifier colonnes réelles user_profiles (doit être 11)
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'user_profiles'
    AND table_schema = 'public';

  IF column_count != 11 THEN
    RAISE WARNING '⚠️ user_profiles a % colonnes (attendu 11)', column_count;
  ELSE
    RAISE NOTICE '✅ user_profiles a exactement 11 colonnes (schéma correct)';
  END IF;
END $$;

-- =====================================================================
-- FIN MIGRATION
-- =====================================================================
-- Statut: DOCUMENTATION ONLY (pas de modification schema)
-- Impact: AUCUN (commentaires SQL uniquement)
-- Next Step: Phase 1.5 - Corriger user_type TEXT → ENUM
-- =====================================================================
