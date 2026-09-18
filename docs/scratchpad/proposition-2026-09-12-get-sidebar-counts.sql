-- [BO-PERF-S3-002] PROPOSITION — NON APPLIQUÉE, NON PLANIFIÉE SANS ACCORD ÉCRIT DE ROMÉO.
-- Une seule fonction pour les 11 compteurs du menu de gauche (session-3, étape 3).
--
-- Pourquoi : après S3 (plus d'interrogation toutes les 30 s), chaque rafraîchissement du menu envoie encore
-- 11 requêtes HTTP (10 comptages HEAD + 1 RPC), donc 11 allers-retours, 11 contrôles d'authentification PostgREST et
-- 11 évaluations des règles de sécurité. Mesure du 2026-09-12 (passerelle, 24 h) : ~15 000 comptages du menu en
-- production, p95 2,5 à 3,5 s par comptage, 1 700 appels > 2 s. Une RPC unique ramène un rafraîchissement à
-- 1 requête : ÷ 11 sur le nombre d'appels restants après S3, et une seule latence au lieu du max de 11.
--
-- Choix :
--   - SECURITY INVOKER : les règles de sécurité existantes s'appliquent comme aujourd'hui (le personnel voit tout via
--     is_backoffice_user(), un affilié LinkMe ne voit que ses lignes) — aucun contournement ;
--   - STABLE, une seule instruction : un seul plan, pas de re-préparation par appel ;
--   - mêmes filtres, à l'identique, que packages/@verone/notifications/src/hooks/use-sidebar-counts.ts ;
--   - droits explicites (règle R-GRANT) : pas d'anon.
--
-- Contrôle obligatoire avant mise en ligne : les 11 valeurs renvoyées = les 11 valeurs des comptages actuels
-- (référence 2026-09-12 01:25 UTC : stock 2, consultations 2, linkme 21, produits incomplets 199, sourcing 4,
-- commandes brouillon 16, expéditions 9, transactions 107, approbations LinkMe 16, formulaires 0, infos LinkMe 0).
-- Types TypeScript régénérés dans la même PR.

CREATE OR REPLACE FUNCTION public.get_sidebar_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'stockAlerts', public.get_stock_alerts_count(),
    'consultations', (SELECT count(*) FROM client_consultations
                        WHERE status IN ('en_attente', 'en_cours') AND archived_at IS NULL AND deleted_at IS NULL),
    'linkmePending', (SELECT count(*) FROM linkme_orders_enriched WHERE status IN ('draft', 'validated')),
    'productsIncomplete', (SELECT count(*) FROM products
                             WHERE product_status = 'active' AND (description IS NULL OR description = '')),
    'sourcingProducts', (SELECT count(*) FROM products
                           WHERE creation_mode = 'sourcing' AND product_status IN ('draft', 'preorder')
                             AND archived_at IS NULL),
    'ordersPending', (SELECT count(*) FROM sales_orders WHERE status = 'draft'),
    'expeditionsPending', (SELECT count(*) FROM sales_orders WHERE status IN ('validated', 'partially_shipped')),
    'transactionsUnreconciled', (SELECT count(*) FROM bank_transactions WHERE matching_status = 'unmatched'),
    'linkmeApprovals', (SELECT count(*) FROM sales_orders
                          WHERE channel_id = '93c68db1-5a30-4168-89ec-6383152be405' AND status = 'draft'),
    'formSubmissions', (SELECT count(*) FROM form_submissions WHERE status = 'new'),
    'linkmeMissingInfo', (SELECT count(*) FROM linkme_info_requests
                            WHERE sent_at IS NOT NULL AND completed_at IS NULL AND cancelled_at IS NULL
                              AND token_expires_at > now())
  );
$$;

REVOKE EXECUTE ON FUNCTION public.get_sidebar_counts() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_sidebar_counts() TO authenticated, service_role;

-- Retour arrière : DROP FUNCTION public.get_sidebar_counts(); + revert du hook.
