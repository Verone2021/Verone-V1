-- =====================================================================
-- [BO-SEC-004] Lot 8 — Fermer les fonctions SECURITY INVOKER au public
-- =====================================================================
-- Plan approuvé par Roméo le 15/09/2026 (bloc S, « fais tout le reste »).
-- Référence : docs/scratchpad/snapshot-2026-09-15-bloc-S.sql Section 1
--
-- Inventaire (relevé le 15/09/2026) :
-- | Groupe       | Brut | Exclusions stock | Appliqué | Action                              |
-- |--------------|------|------------------|----------|-------------------------------------|
-- | Déclencheurs | 131  | 3                | 128      | REVOKE FROM PUBLIC, anon, authenticated |
-- | Writers      |  28  | 5                |  23      | REVOKE FROM PUBLIC, anon            |
-- | Readers      |  79  | 16               |  63      | REVOKE FROM PUBLIC, anon            |
-- | TOTAL        | 238  | 24               | 214      |                                     |
--
-- Exclusions stock (non touchées — règle stock-triggers-protected) :
--   Déclencheurs : manage_sales_order_stock, sync_stock_quantity_from_stock_real, sync_stock_status
--   Writers : calculate_stock_forecasted, calculate_stock_status, mark_warehouse_exit,
--             recalculate_forecasted_stock, recalculate_product_stock
--   Readers : check_orders_stock_consistency, detect_orphaned_stock, get_available_stock_advanced,
--             get_calculated_stock_from_movements, get_low_stock_products, get_product_stock_summary,
--             get_smart_stock_status, get_stock_alerts (×2), get_stock_analytics,
--             get_stock_reason_description, get_stock_summary, get_stock_timeline_forecast,
--             has_been_ordered, product_is_sellable, validate_stock_coherence
--
-- Règle R-GRANT : REVOKE toujours FROM PUBLIC, anon ensemble (jamais anon seul).
-- Les déclencheurs perdent aussi authenticated (jamais appelés directement par du code client).
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- =====================================================================
-- SECTION A — FONCTIONS DÉCLENCHEUR (128)
-- REVOKE FROM PUBLIC, anon, authenticated (jamais appelées directement)
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.articles_compute_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.articles_set_published_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.articles_update_search_vector() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_add_supplier_to_linkme_channel() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_classify_bank_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_classify_bank_transactions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_classify_expense() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_generate_collection_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_lock_validated_test() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_default_vat_rate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_ht_vat_amounts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_next_retry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_product_completion_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_invoice_overdue() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rule_lock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_sample_archive_allowed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_linkme_commission_on_order_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_fiscal_year_lock() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_channel_list() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_customer_list() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_package() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_primary_collection_image() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_primary_image() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_primary_product() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_collection_image_url() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_payment_request_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_product_image_url() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_public_url() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_po_deletion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_so_item_quantity_change_confirmed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.linkme_update_selection_products_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.linkme_update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_invoice_status_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_price_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_sample_requirement_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.manage_consultation_primary_image() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_commission_requested_on_item_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_sync_operation_success() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mirror_product_image_to_media_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mirror_product_image_update_to_media_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_affiliate_payment_request_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_linkme_payment_overpay() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_po_direct_cancellation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_so_direct_cancellation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_error_notifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_new_error() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_new_error_classification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.products_search_vector_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.queue_mcp_resolution() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reallocate_po_fees_on_charges_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_order_on_shipping_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_purchase_order_on_charges_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_sales_order_on_charges_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_product_completion_on_images() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_purchase_order_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_sales_order_totals() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_payment_request_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_product_prices_summary() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_commission_on_item_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_articles_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_contact_owner_type() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_gmail_watch_state_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_options_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_webhook_event_expiry() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_channel_pricing_to_selections() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_commission_status_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_commissions_on_payment_request_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_item_group_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_trade_name_from_legal_name() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_variant_group_suitable_rooms() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_vat_breakdown_to_document_lines() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_generate_organisation_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_generate_product_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_set_updated_at_linkme_details() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_addresses_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_bug_reports_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_channel_product_metadata_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_channel_product_pricing_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_collection_images_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_collection_product_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_collection_shared_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_consultation_images_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_contacts_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_counterparties_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_document_amount_paid() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_email_messages_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_email_templates_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_enseignes_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_error_metrics() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_financial_documents_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_form_submission_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_google_merchant_syncs_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_group_member_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_individual_customers_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_invoice_status_on_payment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_invoices_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_linkme_channel_suppliers_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_linkme_commission_ttc() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_linkme_page_configurations_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_mcp_queue_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_notifications_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_payment_request_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_pcg_categories_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_price_list_product_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_colors_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_drafts_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_groups_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_name_from_variants() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_product_names_from_group() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_purchase_orders_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_shopping_carts_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_storage_allocation_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_storage_pricing_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_storage_request_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_transaction_document_links_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_session() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_variant_group_product_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_variant_groups_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_webhook_configs_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_contact_constraints() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_custom_product_assignment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_linkme_selection_item_margin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_parent_user_hierarchy() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_payment_amount() FROM PUBLIC, anon, authenticated;

-- =====================================================================
-- SECTION B — FONCTIONS WRITER (23)
-- REVOKE FROM PUBLIC, anon (authenticated conservé)
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.add_collection_tag(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_all_matching_rules() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_matching_rule_to_history(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_rule_to_all_matching(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_cancel_unpaid_orders() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_register_counterparty_ibans() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_engagement_score(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_sync_operations() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_color_if_not_exists(character varying, character varying) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_customer_individual_for_affiliate(uuid, text, text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_sample_order(uuid, uuid[], date, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_architecture_report() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_feed_access_token() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_item_group_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_linkme_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_organisation_code() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_product_sku(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_share_token(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_so_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_sample_delivered(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_sample_ordered(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_collection_tag(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_dimensions_from_name(text) FROM PUBLIC, anon;

-- =====================================================================
-- SECTION C — FONCTIONS READER (63)
-- REVOKE FROM PUBLIC, anon (authenticated conservé)
-- =====================================================================

REVOKE EXECUTE ON FUNCTION public.apply_multi_vat_breakdown(numeric, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_sample_request(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.build_single_vat_breakdown(numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calc_product_volume_m3(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_batch_prices_v2(uuid[], integer, uuid, uuid, character varying, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_order_line_price(uuid, integer, uuid, uuid, character varying, numeric, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_package_price(integer, integer, numeric, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_price_ttc(integer, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_price_ttc_cents(integer, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_product_price_v2(uuid, integer, uuid, uuid, character varying, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_storage_price(numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.calculate_vat_from_ttc(numeric, numeric) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.classify_error_with_ai(text, character varying, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.classify_error_with_ai(text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_webhook_events() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_product_drafts() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_status_history() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_resolved_errors() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role_in_org(uuid, user_role_type[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_has_scope(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.extract_dimensions_from_name(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.format_phone_display(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_sku(character varying, character varying, character varying, character varying, character varying) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_variant_product_sku(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_affiliates_with_users() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_applicable_price_lists(uuid, uuid, character varying, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_consultation_eligible_products(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_current_organisation_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_customers_for_affiliate(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_entity_addresses(character varying, uuid, character varying, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_google_merchant_eligible_products() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_kpi_alltime_summary(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_linkme_channel_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_linkme_order_items(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_linkme_orders(uuid, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_next_variant_position(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_order_total_retrocession(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_organisation_display_name(public.organisations) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_pcg_category_totals(date, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_primary_contact(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_quantity_breaks(uuid, uuid, uuid, character varying, date) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_recent_errors(integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_transaction_history(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_transactions_by_year() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_transactions_stats(integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_full_name(public.user_profiles) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_variant_siblings(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.initialize_dashboard_tests() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_product_marketing_eligible(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.normalize_for_sku(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.normalize_label(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.normalize_name(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.populate_counterparty_ibans_from_history() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_collections_by_tags(text[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_organisations_unaccent(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_product_colors(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.slugify(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.suggest_variant_groups(integer, integer, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transfer_to_product_catalog(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_feed_filters(jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_partner_id_migration() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validate_sourcing_draft(uuid, uuid, numeric, boolean, numeric, uuid) FROM PUBLIC, anon;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (droits d'avant, relevés le 15/09/2026) :
-- Toutes ces fonctions avaient ACL = {=X/postgres,...,anon=X/postgres,...}
-- c'est-à-dire PUBLIC avait EXECUTE. Restauration :
-- ---------------------------------------------------------------------
-- BEGIN;
-- -- Section A : déclencheurs (128)
-- GRANT EXECUTE ON FUNCTION public.allocate_po_fees_and_calculate_unit_cost() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.articles_compute_metrics() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.articles_set_published_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.articles_update_search_vector() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_add_supplier_to_linkme_channel() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_classify_bank_transaction() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_classify_bank_transactions() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_classify_expense() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_generate_collection_slug() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_lock_validated_test() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_default_vat_rate() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_ht_vat_amounts() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_next_retry() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_product_completion_status() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.check_invoice_overdue() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.check_rule_lock() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.check_sample_archive_allowed() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.create_linkme_commission_on_order_update() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.enforce_fiscal_year_lock() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_default_channel_list() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_default_customer_list() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_default_package() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_primary_collection_image() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_primary_image() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.ensure_single_primary_product() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_collection_image_url() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_payment_request_number() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_product_image_url() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_public_url() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.handle_po_deletion() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.handle_so_item_quantity_change_confirmed() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.linkme_update_selection_products_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.linkme_update_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.log_invoice_status_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.log_price_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.log_sample_requirement_changes() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.manage_consultation_primary_image() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mark_commission_requested_on_item_insert() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mark_sync_operation_success() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mirror_product_image_to_media_asset() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mirror_product_image_update_to_media_asset() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.notify_affiliate_payment_request_paid() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.prevent_linkme_payment_overpay() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.prevent_po_direct_cancellation() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.prevent_so_direct_cancellation() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.process_error_notifications() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.process_new_error() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.process_new_error_classification() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.products_search_vector_update() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.queue_mcp_resolution() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.reallocate_po_fees_on_charges_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalc_order_on_shipping_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalc_purchase_order_on_charges_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalc_sales_order_on_charges_change() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalculate_product_completion_on_images() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalculate_purchase_order_totals() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recalculate_sales_order_totals() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.recompute_payment_request_status() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.refresh_product_prices_summary() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.release_commission_on_item_delete() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.set_articles_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.set_contact_owner_type() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.set_gmail_watch_state_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.set_options_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.set_webhook_event_expiry() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_channel_pricing_to_selections() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_commission_status_on_payment() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_commissions_on_payment_request_paid() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_item_group_id() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_trade_name_from_legal_name() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_variant_group_suitable_rooms() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.sync_vat_breakdown_to_document_lines() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.trigger_generate_organisation_code() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.trigger_generate_product_slug() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.trigger_set_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.trigger_set_updated_at_linkme_details() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_addresses_timestamp() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_bug_reports_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_channel_product_metadata_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_channel_product_pricing_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_collection_images_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_collection_product_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_collection_shared_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_consultation_images_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_contacts_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_counterparties_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_document_amount_paid() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_email_messages_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_email_templates_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_enseignes_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_error_metrics() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_financial_documents_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_form_submission_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_google_merchant_syncs_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_group_member_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_individual_customers_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_invoice_status_on_payment() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_invoices_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_linkme_channel_suppliers_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_linkme_commission_ttc() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_linkme_page_configurations_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_mcp_queue_timestamp() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_notifications_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_payment_request_timestamp() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_pcg_categories_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_price_list_product_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_product_colors_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_product_drafts_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_product_groups_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_product_name_from_variants() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_product_names_from_group() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_purchase_orders_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_shopping_carts_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_storage_allocation_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_storage_pricing_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_storage_request_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_transaction_document_links_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_user_session() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_variant_group_product_count() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_variant_groups_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.update_webhook_configs_updated_at() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_contact_constraints() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_custom_product_assignment() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_linkme_selection_item_margin() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_parent_user_hierarchy() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_payment_amount() TO PUBLIC;
-- -- Section B : writers (23)
-- GRANT EXECUTE ON FUNCTION public.add_collection_tag(uuid, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.apply_all_matching_rules() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.apply_matching_rule_to_history(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.apply_rule_to_all_matching(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_cancel_unpaid_orders() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.auto_register_counterparty_ibans() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_engagement_score(uuid, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.cleanup_old_sync_operations() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.create_color_if_not_exists(character varying, character varying) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.create_customer_individual_for_affiliate(uuid, text, text, text, text, text, text, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.create_sample_order(uuid, uuid[], date, text, uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_architecture_report() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_feed_access_token() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_item_group_id() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_linkme_code() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_organisation_code() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_product_sku(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_share_token(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_so_number() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mark_sample_delivered(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.mark_sample_ordered(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.remove_collection_tag(uuid, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.remove_dimensions_from_name(text) TO PUBLIC;
-- -- Section C : readers (63)
-- GRANT EXECUTE ON FUNCTION public.apply_multi_vat_breakdown(numeric, jsonb) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.approve_sample_request(uuid, uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.build_single_vat_breakdown(numeric, numeric) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calc_product_volume_m3(jsonb) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_batch_prices_v2(uuid[], integer, uuid, uuid, character varying, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_order_line_price(uuid, integer, uuid, uuid, character varying, numeric, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_package_price(integer, integer, numeric, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_price_ttc(integer, numeric) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_price_ttc_cents(integer, numeric) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_product_price_v2(uuid, integer, uuid, uuid, character varying, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_storage_price(numeric) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.calculate_vat_from_ttc(numeric, numeric) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.classify_error_with_ai(text, character varying, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.classify_error_with_ai(text, text, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.cleanup_expired_webhook_events() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.cleanup_old_product_drafts() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.cleanup_old_status_history() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.cleanup_resolved_errors() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.current_user_has_role_in_org(uuid, user_role_type[]) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.current_user_has_scope(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.extract_dimensions_from_name(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.format_phone_display(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_sku(character varying, character varying, character varying, character varying, character varying) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.generate_variant_product_sku(text, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_affiliates_with_users() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_applicable_price_lists(uuid, uuid, character varying, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_consultation_eligible_products(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_current_organisation_id() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_customers_for_affiliate(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_entity_addresses(character varying, uuid, character varying, boolean) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_google_merchant_eligible_products() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_kpi_alltime_summary(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_linkme_channel_id() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_linkme_order_items(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_linkme_orders(uuid, integer, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_next_variant_position(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_order_total_retrocession(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_organisation_display_name(public.organisations) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_pcg_category_totals(date, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_primary_contact(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_quantity_breaks(uuid, uuid, uuid, character varying, date) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_recent_errors(integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_transaction_history(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_transactions_by_year() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_transactions_stats(integer, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_user_full_name(public.user_profiles) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.get_variant_siblings(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.initialize_dashboard_tests() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.is_product_marketing_eligible(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.normalize_for_sku(text, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.normalize_label(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.normalize_name(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.populate_counterparty_ibans_from_history() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.search_collections_by_tags(text[]) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.search_organisations_unaccent(text, text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.search_product_colors(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.slugify(text) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.suggest_variant_groups(integer, integer, integer) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.transfer_to_product_catalog(uuid) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_feed_filters(jsonb) TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_partner_id_migration() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.validate_sourcing_draft(uuid, uuid, numeric, boolean, numeric, uuid) TO PUBLIC;
-- COMMIT;
