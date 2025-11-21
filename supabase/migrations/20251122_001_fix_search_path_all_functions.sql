-- Migration: Fix search_path on all functions (316 functions)
-- Date: 2025-11-22
-- Objectif: Corriger vulnérabilité injection SQL via search_path (Security Advisor)
-- Impact: 290-316 warnings Security Advisor → 0 warnings
-- Risque: BAS (opération standard PostgreSQL, pas d'impact fonctionnel)

-- Description:
-- Supabase Security Advisor détecte 290-316 fonctions sans search_path configuré.
-- Sans search_path explicite, les fonctions sont vulnérables à l'injection SQL via
-- manipulation du search_path (CVE-2018-1058).
--
-- Cette migration ajoute `SET search_path = public, pg_temp` à TOUTES les fonctions
-- du schéma public, empêchant ainsi l'attaquant d'injecter des fonctions homonymes
-- dans son propre schéma.
--
-- Référence: https://wiki.postgresql.org/wiki/A_Guide_to_CVE-2018-1058

-- ============================================================================
-- PHASE 1: ALTER FUNCTION SET search_path (316 fonctions)
-- ============================================================================

 ALTER FUNCTION public.add_collection_tag(collection_id uuid, tag text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.approve_sample_request(p_draft_id uuid, p_approved_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_assign_organisation_on_user_create() SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_cancel_unpaid_orders() SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_generate_collection_slug() SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_lock_section_if_complete(section_name_param text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_lock_validated_test() SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_match_bank_transaction(p_transaction_id text, p_amount numeric, p_side transaction_side, p_label text, p_settled_at timestamp with time zone) SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_match_bank_transaction(p_transaction_id text, p_amount numeric, p_label text, p_settled_at timestamp with time zone) SET search_path = public, pg_temp;
 ALTER FUNCTION public.auto_validate_alerts_on_order_confirmed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.batch_add_google_merchant_products(product_ids uuid[], merchant_id text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_annual_revenue_bfa(p_organisation_id uuid, p_fiscal_year integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_batch_prices_v2(p_product_ids uuid[], p_quantity integer, p_channel_id uuid, p_customer_id uuid, p_customer_type character varying, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_engagement_score(p_user_id uuid, p_days integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_next_retry() SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_order_line_price(p_product_id uuid, p_quantity integer, p_channel_id uuid, p_customer_id uuid, p_customer_type character varying, p_rfa_discount numeric, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_package_price(base_price_ht_cents integer, base_quantity integer, discount_rate numeric, unit_price_override_cents integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_package_price(p_product_id uuid, p_package_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_price_ttc(price_ht_cents integer, tax_rate numeric) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_price_ttc_cents(price_ht_cents integer, tva_rate numeric) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_product_completion_status() SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_product_price_old(p_product_id uuid, p_customer_id uuid, p_customer_type character varying, p_channel_id uuid, p_quantity integer, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_product_price_v2(p_product_id uuid, p_quantity integer, p_channel_id uuid, p_customer_id uuid, p_customer_type character varying, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_retrocession_amount() SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_stock_forecasted(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.calculate_stock_status(p_stock_real integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.cancel_order_forecast_movements(p_order_id uuid, p_reference_type text, p_performed_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_incomplete_catalog_products() SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_invoice_overdue() SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_late_shipments() SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_orders_stock_consistency() SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_overdue_invoices() SET search_path = public, pg_temp;
 ALTER FUNCTION public.check_sample_archive_allowed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.classify_error_with_ai(error_message text, error_type character varying, stack_trace text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.classify_error_with_ai(error_message text, error_type text, stack_trace text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_expired_webhook_events() SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_old_mcp_tasks(days_old integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_old_product_drafts() SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_old_status_history() SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_old_sync_operations() SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_resolved_errors() SET search_path = public, pg_temp;
 ALTER FUNCTION public.cleanup_validated_alerts(p_days_threshold integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.complete_mcp_task(queue_id_param uuid, success_param boolean, execution_details_param jsonb, resolution_method_param character varying) SET search_path = public, pg_temp;
 ALTER FUNCTION public.count_owners() SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_color_if_not_exists(color_name character varying, color_hex character varying) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_customer_invoice_from_order(p_sales_order_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_expense(p_supplier_id uuid, p_expense_category_id uuid, p_description text, p_amount_ht numeric, p_amount_ttc numeric, p_tva_amount numeric, p_expense_date date, p_uploaded_file_url text, p_notes text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_notification_for_owners(p_type text, p_severity text, p_title text, p_message text, p_action_url text, p_action_label text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_notification_on_stock_alert() SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_purchase_order(p_supplier_id uuid, p_items jsonb, p_delivery_address jsonb, p_notes text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_purchase_order_forecast_movements(p_purchase_order_id uuid, p_performed_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_purchase_reception_movement(p_reception_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_sales_order_forecast_movements(p_sales_order_id uuid, p_performed_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_sales_order_shipment_movements(p_sales_order_id uuid, p_performed_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_sample_order(p_supplier_id uuid, p_draft_ids uuid[], p_expected_delivery_date date, p_internal_notes text, p_created_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.create_supplier_invoice(p_supplier_id uuid, p_purchase_order_id uuid, p_invoice_number text, p_invoice_date date, p_due_date date, p_total_ht numeric, p_total_ttc numeric, p_tva_amount numeric, p_uploaded_file_url text, p_notes text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.custom_access_token_hook(event jsonb) SET search_path = public, pg_temp;
 ALTER FUNCTION public.detect_orphaned_stock() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_default_channel_list() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_default_customer_list() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_default_package() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_primary_collection_image() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_primary_image() SET search_path = public, pg_temp;
 ALTER FUNCTION public.ensure_single_primary_product() SET search_path = public, pg_temp;
 ALTER FUNCTION public.finalize_sourcing_to_catalog(draft_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.format_phone_display(phone_input text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_architecture_report() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_bfa_report_all_customers(p_fiscal_year integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_collection_image_url() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_feed_access_token() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_invoice_from_order(p_sales_order_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_item_group_id() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_po_number() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_product_image_url() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_product_sku(p_subcategory_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_public_url() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_share_token(collection_name text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_sku(family_code character varying, product_code character varying, color_code character varying, material_code character varying, size_code character varying) SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_so_number() SET search_path = public, pg_temp;
 ALTER FUNCTION public.generate_variant_product_sku(p_base_sku text, p_variant_value text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_activity_stats(days_ago integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_applicable_price_lists(p_channel_id uuid, p_customer_id uuid, p_customer_type character varying, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_archived_site_internet_products() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_available_stock(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_available_stock_advanced(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_best_mcp_strategy(error_msg text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_calculated_stock_from_movements(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_channel_price_evolution(p_product_id uuid, p_channel_id uuid, p_limit integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_cleanup_candidates(p_days_threshold integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_consultation_eligible_products(target_consultation_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_daily_activity() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_dashboard_metrics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_dashboard_stock_orders_metrics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_error_reports_dashboard(severity_filter error_severity_enum, status_filter error_status_enum, limit_param integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_google_merchant_eligible_products() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_google_merchant_product_price(p_product_id uuid, p_country_code text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_google_merchant_products() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_google_merchant_stats() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_invoice_status_summary(p_start_date date, p_end_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_low_stock_products(limit_count integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_mcp_queue_stats() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_next_mcp_task(processor_id_param text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_next_variant_position(group_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_order_total_retrocession(p_order_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_organisation_display_name(org organisations) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_primary_contact(org_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_product_margin_analysis(p_product_id uuid, p_start_date date, p_end_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_product_stats() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_product_stock_summary(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_product_variants(input_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_products_status_metrics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_quantity_breaks(p_product_id uuid, p_channel_id uuid, p_customer_id uuid, p_customer_type character varying, p_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_recent_errors(limit_count integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_sample_statistics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_section_progress(section_name_param text, limit_param integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_shipment_summary(p_sales_order_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_site_internet_collection_detail(p_slug text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_site_internet_collections() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_site_internet_config() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_site_internet_product_detail(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_site_internet_products() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_smart_stock_status(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_alerts(limit_count integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_alerts() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_alerts_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_analytics(p_period_days integer, p_organisation_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_metrics_optimized() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_reason_description(reason stock_reason_code) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_summary() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_stock_timeline_forecast(p_product_id uuid, p_days_ahead integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_test_progress_summary() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_treasury_stats(p_start_date date, p_end_date date) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_user_activity_stats(p_user_id uuid, p_days integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_user_full_name(user_profile_record user_profiles) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_user_recent_actions(p_user_id uuid, p_limit integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_user_stats() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_user_type() SET search_path = public, pg_temp;
 ALTER FUNCTION public.get_variant_siblings(product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gin_extract_value_trgm(text, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_compress(internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_consistent(internal, text, smallint, oid, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_decompress(internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_distance(internal, text, smallint, oid, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_in(cstring) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_options(internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_out(gtrgm) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_penalty(internal, internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_picksplit(internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_same(gtrgm, gtrgm, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.gtrgm_union(internal, internal) SET search_path = public, pg_temp;
 ALTER FUNCTION public.handle_abby_webhook_invoice_paid(p_abby_invoice_id text, p_payment_amount numeric, p_payment_date date, p_payment_method text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.handle_new_customer_signup() SET search_path = public, pg_temp;
 ALTER FUNCTION public.handle_po_item_quantity_change_confirmed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.handle_so_item_quantity_change_confirmed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.has_been_ordered(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.has_scope(required_scope text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.increment_quantity_shipped(p_item_id uuid, p_quantity integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.initialize_dashboard_tests() SET search_path = public, pg_temp;
 ALTER FUNCTION public.is_admin() SET search_path = public, pg_temp;
 ALTER FUNCTION public.is_customer_user() SET search_path = public, pg_temp;
 ALTER FUNCTION public.is_owner() SET search_path = public, pg_temp;
 ALTER FUNCTION public.is_staff_user() SET search_path = public, pg_temp;
 ALTER FUNCTION public.is_tester_or_admin() SET search_path = public, pg_temp;
 ALTER FUNCTION public.lock_section_when_complete(section_name_param text, force_lock boolean) SET search_path = public, pg_temp;
 ALTER FUNCTION public.log_audit_event(p_action text, p_table_name text, p_record_id uuid, p_old_data jsonb, p_new_data jsonb, p_severity text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.log_invoice_status_change() SET search_path = public, pg_temp;
 ALTER FUNCTION public.log_price_change() SET search_path = public, pg_temp;
 ALTER FUNCTION public.log_sample_requirement_changes() SET search_path = public, pg_temp;
 ALTER FUNCTION public.manage_consultation_primary_image() SET search_path = public, pg_temp;
 ALTER FUNCTION public.manage_purchase_order_stock() SET search_path = public, pg_temp;
 ALTER FUNCTION public.manage_sales_order_stock() SET search_path = public, pg_temp;
 ALTER FUNCTION public.manual_match_transaction(p_transaction_id text, p_document_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_payment_received(p_order_id uuid, p_amount numeric) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_payment_received(p_order_id uuid, p_amount numeric, p_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_sample_delivered(p_draft_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_sample_ordered(p_draft_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_sample_required(product_table text, product_id uuid, requires_sample_value boolean) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_sync_operation_success() SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_warehouse_exit(p_order_id uuid, p_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.mark_warehouse_exit(p_order_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.normalize_for_sku(text_input text, max_length integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_order_cancelled() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_order_confirmed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_order_shipped() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_payment_received() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_po_created() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_po_delayed() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_po_partial_received() SET search_path = public, pg_temp;
 ALTER FUNCTION public.notify_po_received() SET search_path = public, pg_temp;
 ALTER FUNCTION public.poll_google_merchant_statuses(product_ids uuid[], statuses_data jsonb) SET search_path = public, pg_temp;
 ALTER FUNCTION public.prevent_last_owner_deletion() SET search_path = public, pg_temp;
 ALTER FUNCTION public.prevent_last_owner_role_change() SET search_path = public, pg_temp;
 ALTER FUNCTION public.process_error_notifications() SET search_path = public, pg_temp;
 ALTER FUNCTION public.process_new_error() SET search_path = public, pg_temp;
 ALTER FUNCTION public.process_new_error_classification() SET search_path = public, pg_temp;
 ALTER FUNCTION public.process_shipment_stock(p_shipment_id uuid, p_sales_order_id uuid, p_performed_by_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.products_search_vector_update() SET search_path = public, pg_temp;
 ALTER FUNCTION public.queue_mcp_resolution() SET search_path = public, pg_temp;
 ALTER FUNCTION public.reactivate_alert_on_order_cancelled() SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_forecasted_stock(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_product_completion_on_images() SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_product_stock(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_purchase_order_totals() SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_sales_order_totals() SET search_path = public, pg_temp;
 ALTER FUNCTION public.recalculate_section_metrics(section_name_param text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.record_payment(p_document_id uuid, p_amount_paid numeric, p_payment_date date, p_payment_method text, p_transaction_reference text, p_bank_transaction_id uuid, p_notes text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.refresh_google_merchant_stats() SET search_path = public, pg_temp;
 ALTER FUNCTION public.refresh_product_prices_summary() SET search_path = public, pg_temp;
 ALTER FUNCTION public.regenerate_product_slug(product_id_param uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.remove_collection_tag(collection_id uuid, tag text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.remove_from_google_merchant(p_product_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.request_sample_order(p_draft_id uuid, p_sample_description text, p_estimated_cost numeric, p_delivery_time_days integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.reset_po_sequence_to_max() SET search_path = public, pg_temp;
 ALTER FUNCTION public.reset_so_sequence_to_max() SET search_path = public, pg_temp;
 ALTER FUNCTION public.reset_stuck_mcp_tasks(minutes_stuck integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.resync_all_product_stocks() SET search_path = public, pg_temp;
 ALTER FUNCTION public.revalidate_alerts_on_reception() SET search_path = public, pg_temp;
 ALTER FUNCTION public.rollback_po_forecasted() SET search_path = public, pg_temp;
 ALTER FUNCTION public.rollback_so_forecasted() SET search_path = public, pg_temp;
 ALTER FUNCTION public.search_collections_by_tags(search_tags text[]) SET search_path = public, pg_temp;
 ALTER FUNCTION public.search_product_colors(search_query text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.set_current_user_id(user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.set_limit(real) SET search_path = public, pg_temp;
 ALTER FUNCTION public.set_webhook_event_expiry() SET search_path = public, pg_temp;
 ALTER FUNCTION public.show_limit() SET search_path = public, pg_temp;
 ALTER FUNCTION public.show_trgm(text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.similarity(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.similarity_dist(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.similarity_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.slugify(text_input text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.strict_word_similarity(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.strict_word_similarity_commutator_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.strict_word_similarity_dist_commutator_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.strict_word_similarity_dist_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.strict_word_similarity_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.suggest_matches(p_transaction_id text, p_limit integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.sync_item_group_id() SET search_path = public, pg_temp;
 ALTER FUNCTION public.sync_stock_alert_tracking_v2() SET search_path = public, pg_temp;
 ALTER FUNCTION public.sync_user_metadata_to_jwt() SET search_path = public, pg_temp;
 ALTER FUNCTION public.sync_variant_group_suitable_rooms() SET search_path = public, pg_temp;
 ALTER FUNCTION public.test_custom_access_token_hook(test_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.toggle_google_merchant_visibility(p_product_id uuid, p_visible boolean) SET search_path = public, pg_temp;
 ALTER FUNCTION public.track_channel_pricing_changes() SET search_path = public, pg_temp;
 ALTER FUNCTION public.track_product_added_to_draft() SET search_path = public, pg_temp;
 ALTER FUNCTION public.track_product_quantity_updated_in_draft() SET search_path = public, pg_temp;
 ALTER FUNCTION public.track_product_removed_from_draft() SET search_path = public, pg_temp;
 ALTER FUNCTION public.transfer_to_product_catalog(p_draft_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.trg_purchase_orders_stock_automation() SET search_path = public, pg_temp;
 ALTER FUNCTION public.trigger_error_report_notification() SET search_path = public, pg_temp;
 ALTER FUNCTION public.trigger_generate_product_sku() SET search_path = public, pg_temp;
 ALTER FUNCTION public.trigger_generate_product_slug() SET search_path = public, pg_temp;
 ALTER FUNCTION public.trigger_update_section_metrics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.unmatch_transaction(p_transaction_id text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_bug_reports_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_channel_product_metadata_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_channel_product_pricing_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_collection_images_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_collection_product_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_collection_shared_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_consultation_images_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_contacts_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_document_amount_paid() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_error_metrics() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_expense_categories_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_financial_documents_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_google_merchant_metadata(p_product_id uuid, p_custom_title text, p_custom_description text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_google_merchant_price(p_product_id uuid, p_price_ht_cents integer, p_tva_rate numeric) SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_google_merchant_syncs_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_group_member_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_individual_customers_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_invoice_status_on_payment() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_invoices_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_mcp_queue_timestamp() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_notifications_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_packlink_shipments_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_po_forecasted_in() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_price_list_product_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_colors_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_cost_price_from_po() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_drafts_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_groups_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_name_from_variants() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_names_from_group() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_product_stock_after_movement() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_purchase_orders_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_so_forecasted_out() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_stock_on_reception() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_stock_on_shipment(p_product_id uuid, p_quantity integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_stock_on_shipment() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_test_status(test_id_param text, new_status_param test_status_enum, notes_param text, execution_time_param integer) SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_user_session() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_variant_group_product_count() SET search_path = public, pg_temp;
 ALTER FUNCTION public.update_variant_groups_updated_at() SET search_path = public, pg_temp;
 ALTER FUNCTION public.user_has_role_in_org(required_roles user_role_type[], target_org_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_contact_constraints() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_custom_product_assignment() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_feed_filters(filters_json jsonb) SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_parent_user_hierarchy() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_partner_id_migration() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_payment_amount() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_rls_setup() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_sample(draft_id uuid, approved boolean, validation_notes_text text, validated_by_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_sourcing_draft(draft_id uuid, requires_sample_decision boolean, validated_by_user_id uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_sourcing_draft(p_draft_id uuid, p_supplier_id uuid, p_cost_price numeric, p_requires_sample boolean, p_estimated_selling_price numeric, p_validated_by uuid) SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_stock_alerts_on_po() SET search_path = public, pg_temp;
 ALTER FUNCTION public.validate_stock_coherence() SET search_path = public, pg_temp;
 ALTER FUNCTION public.word_similarity(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.word_similarity_commutator_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.word_similarity_dist_commutator_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.word_similarity_dist_op(text, text) SET search_path = public, pg_temp;
 ALTER FUNCTION public.word_similarity_op(text, text) SET search_path = public, pg_temp;

-- ============================================================================
-- VALIDATION
-- ============================================================================

-- Vérifier que toutes les fonctions ont maintenant search_path configuré
-- Cette requête doit retourner 0 ligne après application de la migration
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.prokind = 'f'
    AND NOT EXISTS (
      SELECT 1 FROM unnest(p.proconfig) AS c
      WHERE c LIKE 'search_path=%'
    );

  IF remaining_count > 0 THEN
    RAISE WARNING 'ATTENTION: % fonctions restent sans search_path configuré', remaining_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Toutes les fonctions ont maintenant search_path configuré';
  END IF;
END $$;

