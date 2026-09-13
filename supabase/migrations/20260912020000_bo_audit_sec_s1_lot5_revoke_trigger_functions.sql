-- [BO-AUDIT-SEC-S1] Lot 5 — F1 : fonctions de DÉCLENCHEURS (RETURNS trigger) SECURITY DEFINER exposées au public.
--
-- Appliquée en production le 2026-09-12 via execute_sql (accord écrit de Roméo, automatismes de stock compris ;
-- Roméo rappelle que le cycle stock a été testé récemment : docs/scratchpad/protocole-smoke-tests-stock-complet.md),
-- inscrite au carnet supabase_migrations.schema_migrations : 20260912020000 bo_audit_sec_s1_lot5_revoke_trigger_functions.
-- Vérifié : anon 127 → 19 (= F2), authenticated 252 → 144 ; déclencheurs 246 dont 243 actifs, empreinte
-- (table:nom:état:fonction) identique avant/après c7328e7001b96aca321d072b020ba55e ; site et LinkMe publics 200.
--
-- 108 signatures (96 attachées à un déclencheur, 12 orphelines), recalculées le 2026-09-12 après le lot 4.
--
-- Démonstration faite le 2026-09-12 (option « essai temporaire » choisie par Roméo), dans un bloc annulé par une
-- exception finale — aucun objet restant (vérifié) :
--   table + 2 fonctions de déclencheur (SECURITY DEFINER et INVOKER) + 2 déclencheurs, puis
--   REVOKE EXECUTE … FROM PUBLIC, anon, authenticated ;
--   has_function_privilege('authenticated', …) = false ;
--   INSERT en rôle authenticated → les 2 déclencheurs s'exécutent ; INSERT en rôle anon → le déclencheur s'exécute.
-- ⇒ PostgreSQL ne vérifie le droit EXECUTE d'une fonction de déclencheur qu'à la CRÉATION du déclencheur, jamais à son
--   déclenchement (vaut aussi pour les déclencheurs de auth.users). Retirer le droit n'arrête aucun automatisme ; cela
--   empêche seulement d'appeler ces fonctions « à la main ».
--
-- ⚠️ 12 d'entre elles figurent dans .claude/rules/stock-triggers-protected.md (confirm_packlink_shipment_stock,
-- handle_po_item_quantity_change_confirmed, handle_purchase_order_reception_validation, handle_sales_order_confirmation,
-- rollback_forecasted_out_on_so_devalidation, rollback_so_forecasted, rollback_validated_to_draft_tracking,
-- update_forecasted_out_on_so_validation, update_forecasted_stock_on_po_validation, update_stock_on_reception,
-- update_stock_on_shipment, validate_stock_alerts_on_po) : AUCUNE n'est modifiée, déplacée ni supprimée ; seul le droit
-- d'exécution manuelle change. Décision explicite de Roméo requise.
--
-- Effet : retire EXECUTE à PUBLIC, anon, authenticated. service_role et postgres inchangés.
-- Compteur attendu : SECURITY DEFINER exécutables par anon 127 → 19 (les 19 fonctions publiques F2) ;
-- par authenticated 252 → 144.
--
-- Retour arrière : GRANT EXECUTE ON FUNCTION public.<signature> TO PUBLIC, anon, authenticated;

DO $lot5$
DECLARE
  sig text;
  sigs text[] := ARRAY[
    'assign_linkme_display_number()',
    'audit_trigger_function()',
    'auto_add_sourcing_product_to_linkme()',
    'auto_assign_organisation_on_user_create()',
    'auto_validate_alerts_on_order_confirmed()',
    'backfill_order_affiliate_from_items()',
    'calculate_retrocession_amount()',
    'calculate_sla_deadline()',
    'clean_order_quote_on_delete()',
    'clean_order_quote_on_soft_delete()',
    'confirm_packlink_shipment_stock()',
    'create_linkme_profile_for_enseigne()',
    'create_notification_on_stock_alert()',
    'create_stock_on_affiliate_reception_confirm()',
    'email_messages_link_on_insert()',
    'generate_product_sku()',
    'handle_linkme_user_contact_sync()',
    'handle_new_customer_signup()',
    'handle_po_item_quantity_change_confirmed()',
    'handle_purchase_order_reception_validation()',
    'handle_purchase_order_validation()',
    'handle_reception_deletion()',
    'handle_reception_quantity_update()',
    'handle_sales_order_confirmation()',
    'handle_shipment_deletion()',
    'handle_shipment_quantity_update()',
    'handle_site_internet_signup()',
    'increment_ambassador_code_usage()',
    'lock_prices_on_order_validation()',
    'log_product_commission_change()',
    'log_storage_billing_event()',
    'manage_default_address()',
    'manage_purchase_order_stock()',
    'notify_admin_affiliate_order()',
    'notify_admin_new_form_submission()',
    'notify_admin_organisation_approval()',
    'notify_admin_product_approval()',
    'notify_affiliate_archive()',
    'notify_affiliate_order_approved()',
    'notify_backoffice_on_site_sales_order()',
    'notify_billing_contact_change()',
    'notify_linkme_info_request_completed()',
    'notify_linkme_info_request_sent()',
    'notify_linkme_step4_completed()',
    'notify_new_bank_transaction()',
    'notify_order_cancelled()',
    'notify_order_confirmed()',
    'notify_order_shipped()',
    'notify_payment_received()',
    'notify_po_created()',
    'notify_po_delayed()',
    'notify_po_partial_received()',
    'notify_po_received()',
    'notify_sales_order_event()',
    'notify_shipment_created()',
    'notify_so_delayed()',
    'notify_so_partial_shipped()',
    'notify_stock_negative_forecast()',
    'notify_storage_request_approved()',
    'notify_storage_request_rejected()',
    'prevent_last_owner_deletion_modern()',
    'prevent_last_owner_role_change_modern()',
    'propagate_enseigne_logo_to_orgs()',
    'propagate_enseigne_payment_delay()',
    'reactivate_alert_on_order_cancelled()',
    'recalc_linkme_missing_fields_count()',
    'recalculate_po_payment_status_on_total_change()',
    'recalculate_so_payment_status_on_total_change()',
    'reset_stock_alerts_on_po_cancel()',
    'revalidate_alerts_on_reception()',
    'reverse_stock_on_movement_delete()',
    'rollback_forecasted_out_on_so_devalidation()',
    'rollback_po_forecasted()',
    'rollback_so_forecasted()',
    'rollback_stock_alert_tracking_on_po_cancel()',
    'rollback_validated_to_draft_tracking()',
    'set_org_logo_from_enseigne()',
    'set_updated_by()',
    'sync_owner_type_payment_terms()',
    'sync_stock_alert_tracking_v4()',
    'sync_user_metadata_to_jwt()',
    'sync_user_profile_email()',
    'tg_linkme_create_expense_on_invoice_received()',
    'track_channel_pricing_changes()',
    'track_product_added_to_draft()',
    'track_product_quantity_updated_in_draft()',
    'track_product_removed_from_draft()',
    'trg_fn_update_pmp_on_po_received()',
    'trg_purchase_orders_stock_automation()',
    'trigger_error_report_notification()',
    'trigger_so_insert_validated_forecast()',
    'trigger_update_section_metrics()',
    'update_customer_ambassador_counters()',
    'update_enseigne_member_count()',
    'update_forecasted_out_on_so_validation()',
    'update_forecasted_stock_on_po_validation()',
    'update_product_cost_price_pmp()',
    'update_product_has_images()',
    'update_product_stock_after_movement()',
    'update_purchase_order_payment_status_v2()',
    'update_sales_order_affiliate_totals()',
    'update_sales_order_payment_status_v2()',
    'update_so_forecasted_out()',
    'update_stock_alert_on_movement()',
    'update_stock_on_reception()',
    'update_stock_on_shipment()',
    'validate_enseigne_product_selection()',
    'validate_stock_alerts_on_po()'
  ];
BEGIN
  FOREACH sig IN ARRAY sigs LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', sig);
  END LOOP;
END
$lot5$;
