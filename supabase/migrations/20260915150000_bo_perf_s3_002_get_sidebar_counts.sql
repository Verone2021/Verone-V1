-- =====================================================================
-- [BO-PERF-S3-002] Une seule fonction pour les 11 compteurs du menu de gauche
-- =====================================================================
-- Plan approuvé par Roméo le 15/09/2026 (bloc P, « fais tout le reste »).
--
-- Pourquoi : chaque rafraîchissement du menu envoie 11 requêtes HTTP (10 comptages HEAD + 1 RPC) :
-- 11 allers-retours, 11 contrôles d'authentification PostgREST, 11 évaluations des règles de sécurité.
-- Mesures : 12/09 ~15 000 comptages du menu par jour, p95 2,5 à 3,5 s ; 15/09 07:00-12:40 UTC ~3 600 appels
-- HEAD ; 15/09 12:50 → 13:10 UTC épisode de lenteur où le comptage `linkme_orders_enriched` échouait en
-- statement timeout et était relancé (effet boule de neige). Une fonction unique = 1 requête par rafraîchissement.
--
-- Choix :
--   - SECURITY INVOKER : les règles de sécurité existantes s'appliquent comme aujourd'hui ;
--   - STABLE, une seule instruction SQL ;
--   - filtres STRICTEMENT identiques à packages/@verone/notifications/src/hooks/use-sidebar-counts.ts
--     (dont le filtre sourcing « en cours » : sourcing_status NULL ou dans la liste des étapes actives) ;
--   - droits explicites (R-GRANT) : pas d'anon.
--
-- Contrôle obligatoire : les 11 valeurs renvoyées = les 11 comptages actuels du hook (comparés en SQL).
-- Application : execute_sql après essai annulé ; carnet ; types régénérés dans la même PR.
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.get_sidebar_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $fn$
  SELECT jsonb_build_object(
    'stockAlerts', COALESCE(public.get_stock_alerts_count(), 0),
    'consultations', (
      SELECT count(*) FROM public.client_consultations
      WHERE status IN ('en_attente', 'en_cours') AND archived_at IS NULL AND deleted_at IS NULL
    ),
    'linkmePending', (
      SELECT count(*) FROM public.linkme_orders_enriched WHERE status IN ('draft', 'validated')
    ),
    'productsIncomplete', (
      SELECT count(*) FROM public.products
      WHERE product_status = 'active' AND (description IS NULL OR description = '')
    ),
    'sourcingProducts', (
      SELECT count(*) FROM public.products
      WHERE creation_mode = 'sourcing'
        AND archived_at IS NULL
        AND (
          sourcing_status IS NULL
          OR sourcing_status IN (
            'need_identified', 'supplier_search', 'initial_contact', 'evaluation', 'negotiation',
            'sample_requested', 'sample_received', 'sample_approved', 'order_placed', 'received'
          )
        )
    ),
    'ordersPending', (
      SELECT count(*) FROM public.sales_orders WHERE status = 'draft'
    ),
    'expeditionsPending', (
      SELECT count(*) FROM public.sales_orders WHERE status IN ('validated', 'partially_shipped')
    ),
    'transactionsUnreconciled', (
      SELECT count(*) FROM public.bank_transactions WHERE matching_status = 'unmatched'
    ),
    'linkmeApprovals', (
      SELECT count(*) FROM public.sales_orders
      WHERE channel_id = '93c68db1-5a30-4168-89ec-6383152be405' AND status = 'draft'
    ),
    'formSubmissions', (
      SELECT count(*) FROM public.form_submissions WHERE status = 'new'
    ),
    'linkmeMissingInfo', (
      SELECT count(*) FROM public.linkme_info_requests
      WHERE sent_at IS NOT NULL AND completed_at IS NULL AND cancelled_at IS NULL
        AND token_expires_at > now()
    )
  );
$fn$;

COMMENT ON FUNCTION public.get_sidebar_counts() IS
  'BO-PERF-S3-002 : les 11 compteurs du menu de gauche du back-office en une requête (mêmes filtres que useSidebarCounts). SECURITY INVOKER, pas d''anon.';

REVOKE EXECUTE ON FUNCTION public.get_sidebar_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_sidebar_counts() TO authenticated, service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE : revert du hook useSidebarCounts, puis
-- DROP FUNCTION public.get_sidebar_counts();
-- ---------------------------------------------------------------------
