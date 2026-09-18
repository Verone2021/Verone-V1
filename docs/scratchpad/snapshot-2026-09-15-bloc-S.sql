-- =====================================================================
-- INSTANTANÉ AVANT MIGRATIONS BLOC S — 15/09/2026 (REV 2 — 15/09 17:00 UTC)
-- Relevé le 15/09/2026 avant application des migrations :
--   20260915180000_bo_sec_004_lot8_revoke_invoker_anon.sql
--   20260915181000_bo_sec_009_finance_guards.sql
--   20260915182000_bo_sec_010_drop_legacy_org_policies.sql
--   20260915183000_bo_sec_004_stock_alert_views_anon.sql
-- Corps complets des fonctions : snapshot-2026-09-15-bloc-S-functions.sql
-- =====================================================================

-- =====================================================================
-- SECTION 1 — INVENTAIRE DES FONCTIONS SECURITY INVOKER (LOT 8)
-- =====================================================================
-- Requête ayant produit cet inventaire :
--   SELECT p.oid::regprocedure::text, prosecdef, has_function_privilege('anon', p.oid, 'EXECUTE')
--   FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--   WHERE n.nspname = 'public' AND prosecdef = false
--     AND has_function_privilege('anon', p.oid, 'EXECUTE') = true
--   ORDER BY proname;
--
-- RÉSULTAT BRUT : 238 fonctions (131 déclencheurs, 28 writers, 79 readers)
-- APRÈS EXCLUSIONS STOCK : 128 déclencheurs, 23 writers, 63 readers = 214 total
--
-- EXPLICATION DES ÉCARTS AVEC L'INVENTAIRE APPROUVÉ (120/21/62) :
--   • L'inventaire approuvé était une estimation basée sur une classification
--     heuristique partielle du 12/09. Le décompte réel le 15/09 est supérieur.
--   • 8 nouvelles fonctions déclencheur sont apparues depuis le 12/09
--     (fonctions ajoutées dans les migrations 20260912→20260915).
--   • Les writers supplémentaires incluent create_sample_order, mark_sample_delivered,
--     mark_sample_ordered et generate_product_sku(uuid) (ajoutées post-12/09).
--   • Les readers supplémentaires incluent approve_sample_request, validate_sourcing_draft
--     et plusieurs fonctions de calcul récentes.
--
-- FONCTIONS STOCK EXCLUES DU LOT 8 (ne pas toucher — règle stock-triggers-protected) :
--   Déclencheurs exclus (3) :
--     manage_sales_order_stock()
--     sync_stock_quantity_from_stock_real()
--     sync_stock_status()
--   Writers exclus (5) :
--     calculate_stock_forecasted(uuid)
--     calculate_stock_status(integer)
--     mark_warehouse_exit(uuid)
--     recalculate_forecasted_stock(uuid)
--     recalculate_product_stock(uuid)
--   Readers exclus (16) :
--     check_orders_stock_consistency()
--     detect_orphaned_stock()
--     get_available_stock_advanced(uuid)
--     get_calculated_stock_from_movements(uuid)
--     get_low_stock_products(integer)
--     get_product_stock_summary(uuid)
--     get_smart_stock_status(uuid)
--     get_stock_alerts()
--     get_stock_alerts(integer)
--     get_stock_analytics(integer,uuid)
--     get_stock_reason_description(stock_reason_code)
--     get_stock_summary()
--     get_stock_timeline_forecast(uuid,integer)
--     has_been_ordered(uuid)
--     product_is_sellable(timestamp with time zone,product_status_type,character varying)
--     validate_stock_coherence()
--
-- ACL UNIFORME pour toutes les fonctions des listes ci-dessous :
--   prosecdef = false (SECURITY INVOKER)
--   proacl = {=X/postgres,postgres=X/postgres,anon=X/postgres,
--             authenticated=X/postgres,service_role=X/postgres}
--
-- RETOUR ARRIÈRE : GRANT EXECUTE ON FUNCTION public.<sig> TO PUBLIC;
-- =====================================================================

-- 1A. FONCTIONS DÉCLENCHEUR (128 — reçoivent REVOKE FROM PUBLIC, anon, authenticated)
-- allocate_po_fees_and_calculate_unit_cost()
-- articles_compute_metrics()
-- articles_set_published_at()
-- articles_update_search_vector()
-- auto_add_supplier_to_linkme_channel()
-- auto_classify_bank_transaction()
-- auto_classify_bank_transactions()
-- auto_classify_expense()
-- auto_generate_collection_slug()
-- auto_lock_validated_test()
-- calculate_default_vat_rate()
-- calculate_ht_vat_amounts()
-- calculate_next_retry()
-- calculate_product_completion_status()
-- check_invoice_overdue()
-- check_rule_lock()
-- check_sample_archive_allowed()
-- create_linkme_commission_on_order_update()
-- enforce_fiscal_year_lock()
-- ensure_single_default_channel_list()
-- ensure_single_default_customer_list()
-- ensure_single_default_package()
-- ensure_single_primary_collection_image()
-- ensure_single_primary_image()
-- ensure_single_primary_product()
-- generate_collection_image_url()
-- generate_payment_request_number()
-- generate_product_image_url()
-- generate_public_url()
-- handle_po_deletion()
-- handle_so_item_quantity_change_confirmed()
-- linkme_update_selection_products_count()
-- linkme_update_updated_at()
-- log_invoice_status_change()
-- log_price_change()
-- log_sample_requirement_changes()
-- manage_consultation_primary_image()
-- mark_commission_requested_on_item_insert()
-- mark_sync_operation_success()
-- mirror_product_image_to_media_asset()
-- mirror_product_image_update_to_media_asset()
-- notify_affiliate_payment_request_paid()
-- prevent_linkme_payment_overpay()
-- prevent_po_direct_cancellation()
-- prevent_so_direct_cancellation()
-- process_error_notifications()
-- process_new_error()
-- process_new_error_classification()
-- products_search_vector_update()
-- queue_mcp_resolution()
-- reallocate_po_fees_on_charges_change()
-- recalc_order_on_shipping_change()
-- recalc_purchase_order_on_charges_change()
-- recalc_sales_order_on_charges_change()
-- recalculate_product_completion_on_images()
-- recalculate_purchase_order_totals()
-- recalculate_sales_order_totals()
-- recompute_payment_request_status()
-- refresh_product_prices_summary()
-- release_commission_on_item_delete()
-- set_articles_updated_at()
-- set_contact_owner_type()
-- set_gmail_watch_state_updated_at()
-- set_options_updated_at()
-- set_webhook_event_expiry()
-- sync_channel_pricing_to_selections()
-- sync_commission_status_on_payment()
-- sync_commissions_on_payment_request_paid()
-- sync_item_group_id()
-- sync_trade_name_from_legal_name()
-- sync_variant_group_suitable_rooms()
-- sync_vat_breakdown_to_document_lines()
-- trigger_generate_organisation_code()
-- trigger_generate_product_slug()
-- trigger_set_updated_at()
-- trigger_set_updated_at_linkme_details()
-- update_addresses_timestamp()
-- update_bug_reports_updated_at()
-- update_channel_product_metadata_updated_at()
-- update_channel_product_pricing_updated_at()
-- update_collection_images_updated_at()
-- update_collection_product_count()
-- update_collection_shared_count()
-- update_consultation_images_updated_at()
-- update_contacts_updated_at()
-- update_counterparties_updated_at()
-- update_document_amount_paid()
-- update_email_messages_updated_at()
-- update_email_templates_updated_at()
-- update_enseignes_updated_at()
-- update_error_metrics()
-- update_financial_documents_updated_at()
-- update_form_submission_updated_at()
-- update_google_merchant_syncs_updated_at()
-- update_group_member_count()
-- update_individual_customers_updated_at()
-- update_invoice_status_on_payment()
-- update_invoices_updated_at()
-- update_linkme_channel_suppliers_updated_at()
-- update_linkme_commission_ttc()
-- update_linkme_page_configurations_updated_at()
-- update_mcp_queue_timestamp()
-- update_notifications_updated_at()
-- update_payment_request_timestamp()
-- update_pcg_categories_updated_at()
-- update_price_list_product_count()
-- update_product_colors_updated_at()
-- update_product_drafts_updated_at()
-- update_product_groups_updated_at()
-- update_product_name_from_variants()
-- update_product_names_from_group()
-- update_purchase_orders_updated_at()
-- update_shopping_carts_updated_at()
-- update_storage_allocation_updated_at()
-- update_storage_pricing_updated_at()
-- update_storage_request_updated_at()
-- update_transaction_document_links_updated_at()
-- update_updated_at()
-- update_updated_at_column()
-- update_user_session()
-- update_variant_group_product_count()
-- update_variant_groups_updated_at()
-- update_webhook_configs_updated_at()
-- validate_contact_constraints()
-- validate_custom_product_assignment()
-- validate_linkme_selection_item_margin()
-- validate_parent_user_hierarchy()
-- validate_payment_amount()

-- 1B. FONCTIONS WRITER (23 — reçoivent REVOKE FROM PUBLIC, anon)
-- add_collection_tag(uuid,text)
-- apply_all_matching_rules()
-- apply_matching_rule_to_history(uuid)
-- apply_rule_to_all_matching(uuid)
-- auto_cancel_unpaid_orders()
-- auto_register_counterparty_ibans()
-- calculate_engagement_score(uuid,integer)
-- cleanup_old_sync_operations()
-- create_color_if_not_exists(character varying,character varying)
-- create_customer_individual_for_affiliate(uuid,text,text,text,text,text,text,text)
-- create_sample_order(uuid,uuid[],date,text,uuid)
-- generate_architecture_report()
-- generate_feed_access_token()
-- generate_item_group_id()
-- generate_linkme_code()
-- generate_organisation_code()
-- generate_product_sku(uuid)
-- generate_share_token(text)
-- generate_so_number()
-- mark_sample_delivered(uuid)
-- mark_sample_ordered(uuid)
-- remove_collection_tag(uuid,text)
-- remove_dimensions_from_name(text)

-- 1C. FONCTIONS READER (63 — reçoivent REVOKE FROM PUBLIC, anon)
-- apply_multi_vat_breakdown(numeric,jsonb)
-- approve_sample_request(uuid,uuid)
-- build_single_vat_breakdown(numeric,numeric)
-- calc_product_volume_m3(jsonb)
-- calculate_batch_prices_v2(uuid[],integer,uuid,uuid,character varying,date)
-- calculate_order_line_price(uuid,integer,uuid,uuid,character varying,numeric,date)
-- calculate_package_price(integer,integer,numeric,integer)
-- calculate_price_ttc(integer,numeric)
-- calculate_price_ttc_cents(integer,numeric)
-- calculate_product_price_v2(uuid,integer,uuid,uuid,character varying,date)
-- calculate_storage_price(numeric)
-- calculate_vat_from_ttc(numeric,numeric)
-- classify_error_with_ai(text,character varying,text)
-- classify_error_with_ai(text,text,text)
-- cleanup_expired_webhook_events()
-- cleanup_old_product_drafts()
-- cleanup_old_status_history()
-- cleanup_resolved_errors()
-- current_user_has_role_in_org(uuid,user_role_type[])
-- current_user_has_scope(text)
-- extract_dimensions_from_name(text)
-- format_phone_display(text)
-- generate_sku(character varying,character varying,character varying,character varying,character varying)
-- generate_variant_product_sku(text,text)
-- get_affiliates_with_users()
-- get_applicable_price_lists(uuid,uuid,character varying,date)
-- get_consultation_eligible_products(uuid)
-- get_current_organisation_id()
-- get_customers_for_affiliate(uuid)
-- get_entity_addresses(character varying,uuid,character varying,boolean)
-- get_google_merchant_eligible_products()
-- get_kpi_alltime_summary(uuid)
-- get_linkme_channel_id()
-- get_linkme_order_items(uuid)
-- get_linkme_orders(uuid,integer,integer)
-- get_next_variant_position(uuid)
-- get_order_total_retrocession(uuid)
-- get_organisation_display_name(organisations)
-- get_pcg_category_totals(date,date)
-- get_primary_contact(uuid)
-- get_quantity_breaks(uuid,uuid,uuid,character varying,date)
-- get_recent_errors(integer)
-- get_transaction_history(uuid)
-- get_transactions_by_year()
-- get_transactions_stats(integer,integer)
-- get_user_full_name(user_profiles)
-- get_variant_siblings(uuid)
-- initialize_dashboard_tests()
-- is_current_user_admin()
-- is_product_marketing_eligible(uuid)
-- normalize_for_sku(text,integer)
-- normalize_label(text)
-- normalize_name(text)
-- populate_counterparty_ibans_from_history()
-- search_collections_by_tags(text[])
-- search_organisations_unaccent(text,text)
-- search_product_colors(text)
-- slugify(text)
-- suggest_variant_groups(integer,integer,integer)
-- transfer_to_product_catalog(uuid)
-- validate_feed_filters(jsonb)
-- validate_partner_id_migration()
-- validate_sourcing_draft(uuid,uuid,numeric,boolean,numeric,uuid)

-- =====================================================================
-- SECTION 2 — FONCTIONS FINANCE AVEC GARDE (LOT 9)
-- Corps complets : voir snapshot-2026-09-15-bloc-S-functions.sql
-- ACL avant migration : {postgres=X/postgres,service_role=X/postgres,authenticated=X/postgres}
-- =====================================================================
--
-- 2.1  apply_matching_rule_confirm(uuid,text[])             — garde owner/admin
-- 2.2  auto_classify_all_unmatched()                        — garde owner/admin
-- 2.3  create_customer_invoice_from_order(uuid)             — garde owner/admin
-- 2.4  create_supplier_invoice(uuid,uuid,text,date,date,numeric,numeric,numeric,text,text) — garde owner/admin
-- 2.5  delete_order_payment(uuid)                           — garde owner/admin
-- 2.6  link_linkme_payment_to_bank_transaction(uuid,text)   — garde owner/admin
-- 2.7  link_transaction_to_document(uuid,uuid,uuid,uuid,numeric,text) — garde owner/admin
-- 2.8  toggle_ignore_transaction(uuid,boolean,text)          — garde owner/admin
-- 2.9  unlink_transaction_document(uuid)                    — garde owner/admin
-- 2.10 decrement_selection_products_count(uuid)             — garde is_backoffice_user()
-- 2.11 update_user_contact(text,text,text,text,text) 5-arg  — garde propre-email ou backoffice
-- 2.12 update_user_contact(text,text,text,text) 4-arg       — REVOKE authenticated, GRANT service_role
-- 2.13 recalculate_order_paid_amount(uuid,uuid)             — REVOKE authenticated, GRANT service_role
-- 2.14 create_notification_for_owners(text,text,text,text,text,text) — REVOKE authenticated, GRANT service_role
-- 2.15 increment_promo_usage(uuid)                          — REVOKE authenticated, GRANT service_role
-- 2.16 auto_match_bank_transaction(text,numeric,text,timestamp with time zone) — REVOKE authenticated, GRANT service_role
-- 2.17 auto_match_bank_transaction(text,numeric,transaction_side,text,timestamp with time zone) — REVOKE authenticated, GRANT service_role

-- =====================================================================
-- SECTION 3 — 5 POLITIQUES RLS LEGACY (LOT 10)
-- Relevées le 15/09/2026 via pg_policies
-- Raison de suppression : appellent user_has_access_to_organisation(get_user_organisation_id())
-- qui appelle get_user_role() (fonction inexistante → erreur 42883 pour tout non-staff)
-- =====================================================================

-- Restauration RETOUR ARRIÈRE :
CREATE POLICY "Utilisateurs peuvent voir les items de leurs commandes fourniss"
  ON public.purchase_order_items
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM purchase_orders po
    WHERE po.id = purchase_order_items.purchase_order_id
      AND user_has_access_to_organisation(get_user_organisation_id())
  ));

CREATE POLICY "Utilisateurs peuvent modifier leurs commandes fournisseurs"
  ON public.purchase_orders
  FOR UPDATE
  USING (supplier_id IN (SELECT organisations.id FROM organisations WHERE user_has_access_to_organisation(organisations.id)))
  WITH CHECK (supplier_id IN (SELECT organisations.id FROM organisations WHERE user_has_access_to_organisation(organisations.id)));

CREATE POLICY "Utilisateurs peuvent supprimer leurs commandes fournisseurs"
  ON public.purchase_orders
  FOR DELETE
  USING (user_has_access_to_organisation(get_user_organisation_id()));

CREATE POLICY "Utilisateurs peuvent voir leurs commandes fournisseurs"
  ON public.purchase_orders
  FOR SELECT
  USING (supplier_id IN (SELECT organisations.id FROM organisations WHERE user_has_access_to_organisation(organisations.id)));

CREATE POLICY "Utilisateurs peuvent consulter les mouvements de stock"
  ON public.stock_movements
  FOR SELECT
  USING (user_has_access_to_organisation(get_user_organisation_id()));

-- Droits des fonctions helper (à restaurer si retour arrière) :
-- user_has_access_to_organisation(uuid) : ACL avant lot 10 = {=X/postgres,postgres=X/postgres,service_role=X/postgres}
-- get_user_organisation_id()            : ACL avant lot 10 = {=X/postgres,postgres=X/postgres,service_role=X/postgres}
-- Note : PUBLIC avait déjà EXECUTE (=X/postgres). Restauration = GRANT EXECUTE TO PUBLIC.
GRANT EXECUTE ON FUNCTION public.user_has_access_to_organisation(uuid) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_organisation_id() TO PUBLIC;

-- =====================================================================
-- SECTION 4 — DROITS DES VUES ALERTES STOCK (LOT 11)
-- Relevés le 15/09/2026
-- =====================================================================
-- stock_alerts_view         : {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,
--                              authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}
-- stock_alerts_unified_view : {postgres=arwdDxtm/postgres,anon=arwdDxtm/postgres,
--                              authenticated=arwdDxtm/postgres,service_role=arwdDxtm/postgres}
-- RETOUR ARRIÈRE :
GRANT SELECT ON public.stock_alerts_view TO anon;
GRANT SELECT ON public.stock_alerts_unified_view TO anon;

-- =====================================================================
-- SECTION 5 — EMPREINTE STOCK (DEUX ESSAIS IDENTIQUES — DÉTERMINISTE)
-- =====================================================================
-- Essai 1 (15/09/2026, ~15:00 UTC) :
-- {"trial":1,"pre":{"PLA0001_real":594,"PLA0001_fout":55,"SEP0002_real":8,"SEP0002_fout":1,
--  "PRD0314_real":0,"PRD0314_fin":0},"S1":{"sm_new":1,"soic_delta":1,"comm_delta":1,
--  "so_status":"draft","PLA0001_fout_after":55},"S2":{"sm_new":0,"SEP0002_real":7,
--  "SEP0002_fout":0},"S3":{"sm_new":1,"sat_delta":0,"PRD0314_real":1,"PRD0314_fin":0,
--  "po_status":"received"},"S4":{"alerts_view":11,"unified_view":2}}
-- Essai 2 (15/09/2026) : identique à l'essai 1 — déterminisme confirmé.
--
-- Note PO-39 : id = be957bee-6cdb-4ef2-9407-047d3cc0d093 (confirmé présent le 15/09/2026)
