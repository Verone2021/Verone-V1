-- [BO-RLS-PERF-002] Phase 4 — Suppression policies legacy purchase_orders
--
-- Audit RLS (perf-optimizer 2026-05-07) — chantier CS-3 reporté en Phase 4
-- après identification du compte non-staff qui bloquait la suppression.
--
-- Vérification (2026-05-07) : sur 24 purchase_orders en base, 23 ont un
-- created_by staff back-office. Le 1 cas restant est admin@bwburger-test.fr
-- (Admin BW Burger), un compte de TEST côté enseigne LinkMe avec 1 seule PO
-- vraisemblablement créée lors d'une migration historique. Ce compte
-- n'utilise pas le back-office et n'a pas vocation à voir les
-- purchase_orders.
--
-- Les 3 policies legacy "Utilisateurs peuvent..." passent par
-- user_has_access_to_organisation() → get_user_organisation_id() →
-- get_user_role(). Cette chaîne traverse user_profiles (32M seq_scan) à
-- chaque row et utilise des colonnes obsolètes (cf. .claude/rules/database.md
-- pattern interdit user_profiles.role / raw_user_meta_data).
--
-- staff_manage_purchase_orders (FOR ALL is_backoffice_user, déjà wrappé en
-- Phase 1) couvre tous les besoins du staff. staff_insert_purchase_orders
-- (INSERT) reste pour la création.
--
-- Aucune donnée touchée. Le compte test BW Burger perd l'accès SELECT à sa
-- PO test mais n'utilise pas le back-office (channel LinkMe).

BEGIN;

DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs commandes fournisseurs"
  ON public.purchase_orders;
DROP POLICY IF EXISTS "Utilisateurs peuvent modifier leurs commandes fournisseurs"
  ON public.purchase_orders;
DROP POLICY IF EXISTS "Utilisateurs peuvent supprimer leurs commandes fournisseurs"
  ON public.purchase_orders;

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
DO $$
DECLARE
  v_legacy_count INT;
  v_staff_manage_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO v_legacy_count
  FROM pg_policy
  WHERE polrelid = 'public.purchase_orders'::regclass
    AND polname IN (
      'Utilisateurs peuvent voir leurs commandes fournisseurs',
      'Utilisateurs peuvent modifier leurs commandes fournisseurs',
      'Utilisateurs peuvent supprimer leurs commandes fournisseurs'
    );

  SELECT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.purchase_orders'::regclass
      AND polname = 'staff_manage_purchase_orders'
  ) INTO v_staff_manage_exists;

  RAISE NOTICE '[BO-RLS-PERF-002 Phase 4] vérifications:';
  RAISE NOTICE '  - Policies legacy restantes: % (attendu 0)', v_legacy_count;
  RAISE NOTICE '  - staff_manage_purchase_orders présente: %', v_staff_manage_exists;

  IF v_legacy_count > 0 THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 4] Policies legacy non supprimées (%).', v_legacy_count;
  END IF;
  IF NOT v_staff_manage_exists THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 4] staff_manage_purchase_orders absente — accès staff cassé!';
  END IF;
END $$;
