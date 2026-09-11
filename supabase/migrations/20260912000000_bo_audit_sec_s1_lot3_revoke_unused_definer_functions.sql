-- [BO-AUDIT-SEC-S1] Lot 3 — F4 : fonctions SECURITY DEFINER exposées que plus rien n'utilise.
--
-- Appliquée en production le 2026-09-12 via execute_sql (accord écrit de Roméo), inscrite au carnet
-- supabase_migrations.schema_migrations : 20260912000000 bo_audit_sec_s1_lot3_revoke_unused_definer_functions.
-- Vérifié : anon 319 → 247, authenticated 324 → 252 ; appel sans connexion d'une fonction fermée → 401 / 42501 ;
-- fonctions publiques du site et de LinkMe toujours 200.
--
-- Liste recalculée le 2026-09-12 (72 signatures, une par nom), chaque fonction vérifiée :
--   - aucun appel dans le code (apps back-office / LinkMe / site, packages, fonctions Edge, extension Chrome,
--     scripts, CI), copies de types générés exclues ; les 2 aides à nom dynamique (stockage, Meta) ne les visent pas ;
--   - aucun appel depuis une autre fonction SQL, aucune règle RLS, aucune vue, aucun défaut de colonne,
--     aucune contrainte, aucun pg_cron ;
--   - aucun appel anon / authenticated dans l'historique pg_stat_statements.
-- Exclues volontairement : F2 (pages publiques, règles RLS), fonctions de trigger (lot 5).
--
-- Effet : retire EXECUTE à PUBLIC, anon et authenticated. service_role et postgres gardent l'accès
-- (routes serveur, fonctions Edge, maintenance). Aucune fonction modifiée ni supprimée.
-- Compteur attendu : SECURITY DEFINER exécutables par anon 319 → 247 ; par authenticated 324 → 252.
--
-- Retour arrière (fonction par fonction si besoin) :
--   GRANT EXECUTE ON FUNCTION public.<signature> TO PUBLIC, anon, authenticated;

DO $lot3$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'add_product_to_selection(uuid,uuid,numeric,numeric)',
    'apply_rule_simple(uuid,text[])',
    'calculate_product_price_old(uuid,uuid,character varying,uuid,integer,date)',
    'check_incomplete_catalog_products()',
    'check_late_shipments()',
    'check_overdue_invoices()',
    'check_sales_order_exists(uuid)',
    'check_selection_belongs_to_affiliate(uuid,uuid)',
    'check_selection_is_public(uuid)',
    'cleanup_old_mcp_tasks(integer)',
    'cleanup_validated_alerts(integer)',
    'complete_mcp_task(uuid,boolean,jsonb,character varying)',
    'create_manual_stock_movement(uuid,text,integer,text,text,uuid)',
    'create_public_order(uuid,text,uuid,text,jsonb,jsonb)',
    'create_purchase_reception_movement(uuid)',
    'finalize_sourcing_to_catalog(uuid)',
    'generate_bfa_report_all_customers(integer)',
    'get_channel_price_evolution(uuid,uuid,integer)',
    'get_cleanup_candidates(integer)',
    'get_dashboard_metrics()',
    'get_enseigne_details(uuid)',
    'get_error_reports_dashboard(error_severity_enum,error_status_enum,integer)',
    'get_finance_settings()',
    'get_google_merchant_product_price(uuid,text)',
    'get_invoice_status_summary(date,date)',
    'get_linkme_products_by_year(integer)',
    'get_mcp_queue_stats()',
    'get_media_asset_analytics_summary(uuid,integer)',
    'get_next_mcp_task(text)',
    'get_pinterest_pin_products()',
    'get_product_cost_price_details(uuid)',
    'get_product_margin_analysis(uuid,date,date)',
    'get_product_variants(uuid)',
    'get_sample_statistics()',
    'get_section_progress(text,integer)',
    'get_site_internet_collection_detail(text)',
    'get_site_internet_collections()',
    'get_test_progress_summary()',
    'get_transaction_links(uuid)',
    'get_user_type()',
    'handle_abby_webhook_invoice_paid(text,numeric,date,text)',
    'has_scope(text)',
    'increment_quantity_shipped(uuid,integer)',
    'increment_selection_products_count(uuid)',
    'insert_sales_order_items(jsonb)',
    'is_back_office_admin_or_owner()',
    'is_backoffice_admin()',
    'is_catalog_manager()',
    'is_enseigne_admin(uuid)',
    'is_staff_user_cached()',
    'is_tester_or_admin()',
    'is_transaction_locked_by_id(uuid)',
    'lock_section_when_complete(text,boolean)',
    'log_auth_event(text,boolean,jsonb)',
    'log_transaction_enrichment(uuid,text,jsonb,jsonb,text[],text,text)',
    'lookup_customer_by_code(character varying)',
    'manual_match_transaction(text,uuid)',
    'mark_sample_required(text,uuid,boolean)',
    'process_shipment_stock(uuid,uuid,uuid)',
    'reconcile_linkme_commissions()',
    'regenerate_product_slug(uuid)',
    'reject_affiliate_order(uuid,text)',
    'reset_stuck_mcp_tasks(integer)',
    'suggest_matches(text,integer)',
    'unmatch_transaction(text)',
    'update_test_status(text,test_status_enum,text,integer)',
    'update_transaction_attachment_status(text,text)',
    'user_enseigne_ids()',
    'user_has_role_in_org(user_role_type[],uuid)',
    'validate_affiliate_order(uuid)',
    'validate_rls_setup()',
    'validate_sample(uuid,boolean,text,uuid)'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO service_role', sig);
  END LOOP;
END
$lot3$;
