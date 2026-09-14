-- [BO-AUDIT-SEC-S1] Lot 4 — F3 : fonctions SECURITY DEFINER utilisées par les écrans CONNECTÉS.
--
-- Appliquée en production le 2026-09-12 via execute_sql (accord écrit de Roméo), inscrite au carnet
-- supabase_migrations.schema_migrations : 20260912010000 bo_audit_sec_s1_lot4_revoke_public_keep_authenticated.
-- Vérifié : anon 247 → 127 (19 hors triggers = F2), authenticated 252 inchangé ; HTTP sans connexion
-- get_stock_alerts_count et get_treasury_stats → 401/42501 ; get_linkme_public_stats, get_site_internet_products,
-- get_categories_with_real_counts → 200 ; salarié connecté : get_stock_alerts_count OK ; veronecollections.fr et
-- linkme.network → 200.
--
-- Liste recalculée le 2026-09-12 après le lot 3 : 120 signatures = toutes les fonctions SECURITY DEFINER (hors
-- triggers) encore exécutables par anon, MOINS les 18 noms F2 conservés pour le public (site, pages LinkMe publiques,
-- règles RLS visibles du public).
-- Vérifié :
--   - aucun appel anon dans pg_stat_statements (les seuls appels anon concernent F2 + 2 fonctions SECURITY INVOKER hors lot) ;
--   - aucune règle RLS visant anon/PUBLIC ne les utilise (celles qui les utilisent visent les connectés) ;
--   - aucune fonction SECURITY INVOKER ne les appelle (appels internes = definer, donc exécutés en propriétaire) ;
--   - site internet : `increment_promo_usage`, `nextval_text` appelées avec la clé serveur (service_role) ;
--   - LinkMe : les outils qui les appellent ne sont utilisés que dans l'espace connecté.
--
-- Effet : retire EXECUTE à PUBLIC et anon ; garde authenticated et service_role. Aucune fonction modifiée.
-- Compteur attendu : SECURITY DEFINER exécutables par anon 247 → 127 ; authenticated inchangé (252).
-- Limite : un compte LinkMe connecté peut encore appeler celles qui n'ont pas de garde interne → lots de gardes à venir.
--
-- Retour arrière : GRANT EXECUTE ON FUNCTION public.<signature> TO PUBLIC, anon;

DO $lot4$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'acquire_sync_lock(sync_type,integer)',
    'apply_matching_rule_confirm(uuid,text[])',
    'approve_affiliate_product(uuid,numeric)',
    'approve_storage_request(uuid)',
    'archive_address(uuid)',
    'auto_classify_all_unmatched()',
    'auto_lock_section_if_complete(text)',
    'auto_match_bank_transaction(text,numeric,text,timestamp with time zone)',
    'auto_match_bank_transaction(text,numeric,transaction_side,text,timestamp with time zone)',
    'batch_add_google_merchant_products(uuid[],text)',
    'batch_add_meta_commerce_products(uuid[],text)',
    'calculate_affiliate_product_price(uuid,numeric)',
    'calculate_annual_revenue_bfa(uuid,integer)',
    'calculate_package_price(uuid,uuid)',
    'cancel_order_forecast_movements(uuid,text,uuid)',
    'check_linkme_affiliate_access(linkme_affiliates)',
    'check_transaction_not_locked(uuid)',
    'cleanup_expired_sync_locks()',
    'count_active_owners()',
    'create_customer_invoice_from_order(uuid)',
    'create_customer_organisation_for_affiliate(uuid,text,text,text,text,text,text,text,boolean,text,numeric,numeric,uuid,text)',
    'create_notification_for_owners(text,text,text,text,text,text)',
    'create_purchase_order_forecast_movements(uuid,uuid)',
    'create_purchase_order_reception_movements(uuid,uuid)',
    'create_sales_order_forecast_movements(uuid,uuid)',
    'create_supplier_invoice(uuid,uuid,text,date,date,numeric,numeric,numeric,text,text)',
    'decrement_selection_products_count(uuid)',
    'delete_order_payment(uuid)',
    'generate_po_number()',
    'get_affiliate_dashboard_data(uuid)',
    'get_affiliate_partner_organisation_id(uuid)',
    'get_affiliate_product_by_id(uuid,uuid)',
    'get_affiliate_products_for_enseigne(uuid)',
    'get_affiliate_storage_summary(uuid,uuid)',
    'get_ai_usage_by_endpoint(integer)',
    'get_ai_usage_stats(integer)',
    'get_all_storage_overview()',
    'get_archived_site_internet_products()',
    'get_available_stock(uuid)',
    'get_channel_stats_aggregated(text,date,date)',
    'get_channel_stats_history(text,date,date,uuid)',
    'get_daily_activity()',
    'get_dashboard_stock_orders_metrics()',
    'get_enseigne_organisation_stats(uuid)',
    'get_global_storage_overview()',
    'get_google_merchant_products()',
    'get_google_merchant_stats()',
    'get_last_sync_status(sync_type)',
    'get_linkme_catalog_products_for_affiliate(uuid)',
    'get_linkme_users_emails(uuid[])',
    'get_meta_commerce_products()',
    'get_meta_commerce_stats()',
    'get_meta_eligible_products()',
    'get_meta_sync_records_for_status_update()',
    'get_pending_storage_requests_count()',
    'get_pinterest_pin_stats()',
    'get_product_commission_history(uuid)',
    'get_product_stats()',
    'get_products_status_metrics()',
    'get_scheduled_publications_calendar(timestamp with time zone,timestamp with time zone)',
    'get_site_internet_config()',
    'get_site_internet_product_detail(uuid)',
    'get_site_top_products(text,integer,integer)',
    'get_stock_alerts_count()',
    'get_stock_metrics_optimized()',
    'get_storage_details(uuid,uuid)',
    'get_storage_events_history(uuid,uuid,integer,integer)',
    'get_storage_monthly_history(uuid,uuid,integer)',
    'get_storage_totals()',
    'get_storage_weighted_average(uuid,uuid,date,date)',
    'get_top_images(text,date,date,integer)',
    'get_treasury_stats(date,date)',
    'get_unpaid_invoices_count()',
    'get_unpaid_invoices(integer)',
    'get_user_activity_stats(uuid,integer)',
    'get_user_contact(text)',
    'get_user_email(uuid)',
    'get_user_info(uuid)',
    'get_user_recent_actions(uuid,integer)',
    'get_user_stats()',
    'increment_promo_usage(uuid)',
    'is_back_office_admin()',
    'is_back_office_owner()',
    'is_back_office_privileged()',
    'is_own_linkme_order(uuid,uuid,uuid)',
    'is_transaction_locked(date)',
    'link_linkme_payment_to_bank_transaction(uuid,text)',
    'link_transaction_to_document(uuid,uuid,uuid,uuid,numeric,text)',
    'log_audit_event(text,text,uuid,jsonb,jsonb,text)',
    'mark_warehouse_exit(uuid,uuid)',
    'nextval_text(text)',
    'poll_google_merchant_statuses(uuid[],jsonb)',
    'preview_apply_matching_rule(uuid,text,numeric)',
    'preview_apply_matching_rule(uuid,text)',
    'recalculate_order_paid_amount(uuid,uuid)',
    'recalculate_section_metrics(text)',
    'refresh_google_merchant_stats()',
    'reject_affiliate_product(uuid,text)',
    'reject_storage_request(uuid,text)',
    'release_sync_lock(uuid,uuid,sync_run_status,integer,integer,integer,integer,integer,jsonb,text)',
    'remove_from_google_merchant(uuid)',
    'remove_from_meta_commerce(uuid)',
    'resolve_email_links(text)',
    'set_current_user_id(uuid)',
    'snapshot_channel_stats()',
    'submit_affiliate_product_for_approval(uuid)',
    'toggle_google_merchant_visibility(uuid,boolean)',
    'toggle_ignore_transaction(uuid,boolean,text)',
    'toggle_meta_commerce_visibility(uuid,boolean)',
    'unlink_transaction_document(uuid)',
    'update_affiliate_product(uuid,numeric,numeric,text)',
    'update_google_merchant_metadata(uuid,text,text)',
    'update_google_merchant_price(uuid,integer,numeric)',
    'update_meta_commerce_price(uuid,numeric)',
    'update_meta_sync_status(uuid,text,text)',
    'update_product_pmp_on_po_received(uuid)',
    'update_user_contact(text,text,text,text,text)',
    'update_user_contact(text,text,text,text)',
    'upsert_address(character varying,uuid,character varying,jsonb,boolean,character varying)',
    'validate_sourcing_draft(uuid,boolean,uuid)'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon', sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', sig);
  END LOOP;
END
$lot4$;
