-- [BO-RLS-PERF-002] Phase 3 — Consolidation policies affilié et storage
--
-- Audit RLS (perf-optimizer 2026-05-07) — chantiers structurels CS-1 et CS-4.
--
-- CS-1 : linkme_selection_items a 4 policies affilié
-- (SELECT/INSERT/UPDATE/DELETE) avec EXACTEMENT la même clause USING/WITH CHECK
-- (3 JOINs sur linkme_selections → linkme_affiliates → user_app_roles).
-- Chaque opération déclenche l'évaluation de la même sous-requête répétée.
-- Une seule policy FOR ALL avec la même clause remplace les 4.
--
-- CS-4 : affiliate_storage_allocations a 2 policies staff fonctionnellement
-- équivalentes :
--   - "Admin manage storage" (FOR ALL, EXISTS inline)
--   - "Admin view all storage" (SELECT, EXISTS inline)
--   - "backoffice_full_access_affiliate_storage_allocations" (FOR ALL, helper)
-- Les deux premières dupliquent ce que la 3e fait déjà (FOR ALL via le helper
-- déjà wrappé en Phase 1). On les supprime.
-- "Affiliate view own storage" (SELECT affilié) est conservée — elle est
-- la seule à filtrer côté affilié et n'est pas redondante.
--
-- Hors scope volontairement :
-- - purchase_orders : 1 utilisateur non-staff a des commandes (vérifié
--   2026-05-07). Tant que ce compte n'est pas identifié, les 3 policies
--   legacy "Utilisateurs peuvent..." restent.
-- - stock_movements : 341/341 performed_by sont staff, mais il existe une
--   policy users_own_stock_movements qui couvre les cas d'auto-référence
--   (performed_by = auth.uid()). Trop de tests à faire dans cette PR.
--
-- Aucune donnée touchée. Aucun affilié ne perd l'accès à ses propres
-- linkme_selection_items ou storage. Le staff garde un accès complet via
-- les FOR ALL existantes.

BEGIN;

-- ============================================================================
-- CS-1 : Consolidation linkme_selection_items affilié — 4 policies → 1
-- ============================================================================

DROP POLICY IF EXISTS linkme_selection_items_affiliate_select
  ON public.linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_insert
  ON public.linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_update
  ON public.linkme_selection_items;
DROP POLICY IF EXISTS linkme_selection_items_affiliate_delete
  ON public.linkme_selection_items;

CREATE POLICY linkme_selection_items_affiliate_all
ON public.linkme_selection_items
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM linkme_selections ls
    JOIN linkme_affiliates la ON la.id = ls.affiliate_id
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
    WHERE ls.id = linkme_selection_items.selection_id
      AND uar.app = 'linkme'::app_type
      AND uar.is_active = true
      AND (
        (la.organisation_id IS NOT NULL
         AND la.organisation_id = uar.organisation_id)
        OR
        (la.enseigne_id IS NOT NULL
         AND la.enseigne_id = uar.enseigne_id)
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM linkme_selections ls
    JOIN linkme_affiliates la ON la.id = ls.affiliate_id
    JOIN user_app_roles uar ON uar.user_id = (SELECT auth.uid())
    WHERE ls.id = linkme_selection_items.selection_id
      AND uar.app = 'linkme'::app_type
      AND uar.is_active = true
      AND (
        (la.organisation_id IS NOT NULL
         AND la.organisation_id = uar.organisation_id)
        OR
        (la.enseigne_id IS NOT NULL
         AND la.enseigne_id = uar.enseigne_id)
      )
  )
);

-- ============================================================================
-- CS-4 : Suppression doublons affiliate_storage_allocations
-- ============================================================================
-- "Admin manage storage" et "Admin view all storage" font le même travail que
-- backoffice_full_access_affiliate_storage_allocations (qui utilise déjà le
-- helper is_backoffice_user wrappé en Phase 1). On les supprime.

DROP POLICY IF EXISTS "Admin manage storage"
  ON public.affiliate_storage_allocations;
DROP POLICY IF EXISTS "Admin view all storage"
  ON public.affiliate_storage_allocations;

COMMIT;

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================
DO $$
DECLARE
  v_lsi_old_count INT;
  v_lsi_new_exists BOOLEAN;
  v_storage_doublons INT;
BEGIN
  -- linkme_selection_items: aucune des 4 anciennes ne doit subsister
  SELECT COUNT(*) INTO v_lsi_old_count
  FROM pg_policy
  WHERE polrelid = 'public.linkme_selection_items'::regclass
    AND polname IN (
      'linkme_selection_items_affiliate_select',
      'linkme_selection_items_affiliate_insert',
      'linkme_selection_items_affiliate_update',
      'linkme_selection_items_affiliate_delete'
    );

  SELECT EXISTS (
    SELECT 1 FROM pg_policy
    WHERE polrelid = 'public.linkme_selection_items'::regclass
      AND polname = 'linkme_selection_items_affiliate_all'
  ) INTO v_lsi_new_exists;

  -- affiliate_storage_allocations: les 2 doublons supprimés
  SELECT COUNT(*) INTO v_storage_doublons
  FROM pg_policy
  WHERE polrelid = 'public.affiliate_storage_allocations'::regclass
    AND polname IN ('Admin manage storage', 'Admin view all storage');

  RAISE NOTICE '[BO-RLS-PERF-002 Phase 3] vérifications:';
  RAISE NOTICE '  - Anciennes policies linkme_selection_items affilié restantes: % (attendu 0)',
    v_lsi_old_count;
  RAISE NOTICE '  - Nouvelle policy linkme_selection_items_affiliate_all présente: %',
    v_lsi_new_exists;
  RAISE NOTICE '  - Doublons affiliate_storage_allocations restants: % (attendu 0)',
    v_storage_doublons;

  IF v_lsi_old_count > 0 THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 3] Anciennes policies non supprimées (%).', v_lsi_old_count;
  END IF;
  IF NOT v_lsi_new_exists THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 3] Nouvelle policy linkme_selection_items_affiliate_all absente.';
  END IF;
  IF v_storage_doublons > 0 THEN
    RAISE EXCEPTION '[BO-RLS-PERF-002 Phase 3] Doublons storage non supprimés (%).', v_storage_doublons;
  END IF;
END $$;
