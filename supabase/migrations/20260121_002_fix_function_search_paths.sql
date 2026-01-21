-- ============================================================================
-- Migration: Fix SECURITY DEFINER functions missing search_path
-- Date: 2026-01-21
-- Description: Ajouter SET search_path = public aux fonctions SECURITY DEFINER
--              pour prevenir les attaques par injection de schema.
--
-- PROBLEME DE SECURITE:
-- Les fonctions SECURITY DEFINER sans search_path sont vulnerables aux attaques
-- ou un attaquant peut creer un schema malveillant avec des fonctions du meme nom
-- et le placer en premier dans le search_path de l'utilisateur.
--
-- SOLUTION:
-- Ajouter SET search_path = public pour s'assurer que seul le schema public
-- est utilise lors de l'execution de ces fonctions.
--
-- Fonctions corrigees:
-- 1. create_public_linkme_order (CRITIQUE - LinkMe)
-- 2. upsert_address (HAUTE - Addresses)
-- 3. archive_address (HAUTE - Addresses)
-- 4. manage_default_address (MOYENNE - Trigger)
-- 5. mark_payment_received (MOYENNE - Paiements)
-- 6. get_linkme_catalog_products_for_affiliate (MOYENNE - Catalogue)
-- 7. Et autres fonctions SECURITY DEFINER identifiees...
-- ============================================================================

-- ============================================================================
-- FONCTION 1: create_public_linkme_order (CRITIQUE)
-- ============================================================================
-- Note: Cette fonction est complexe, on utilise ALTER FUNCTION pour ajouter search_path
-- sans avoir a la recreer entierement

ALTER FUNCTION create_public_linkme_order(UUID, UUID, JSONB, JSONB, JSONB, JSONB, JSONB)
SET search_path = public;

-- ============================================================================
-- FONCTION 2: upsert_address (HAUTE)
-- ============================================================================

ALTER FUNCTION upsert_address(VARCHAR, UUID, VARCHAR, JSONB, BOOLEAN, VARCHAR)
SET search_path = public;

-- ============================================================================
-- FONCTION 3: archive_address (HAUTE)
-- ============================================================================

ALTER FUNCTION archive_address(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 4: manage_default_address (MOYENNE - Trigger)
-- ============================================================================

ALTER FUNCTION manage_default_address()
SET search_path = public;

-- ============================================================================
-- FONCTION 5: mark_payment_received (MOYENNE)
-- ============================================================================

ALTER FUNCTION mark_payment_received(UUID, NUMERIC, TEXT)
SET search_path = public;

-- ============================================================================
-- FONCTION 6: get_linkme_catalog_products_for_affiliate (MOYENNE)
-- ============================================================================

ALTER FUNCTION get_linkme_catalog_products_for_affiliate(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 7: notify_affiliate_archive (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION notify_affiliate_archive()
SET search_path = public;

-- ============================================================================
-- FONCTION 8: log_transaction_enrichment (BASSE)
-- ============================================================================

ALTER FUNCTION log_transaction_enrichment(UUID, TEXT, JSONB, JSONB)
SET search_path = public;

-- ============================================================================
-- FONCTION 9: toggle_ignore_transaction (BASSE)
-- ============================================================================

ALTER FUNCTION toggle_ignore_transaction(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 10: link_transaction_to_document (BASSE)
-- ============================================================================

ALTER FUNCTION link_transaction_to_document(UUID, UUID, TEXT, TEXT)
SET search_path = public;

-- ============================================================================
-- FONCTION 11: unlink_transaction_document (BASSE)
-- ============================================================================

ALTER FUNCTION unlink_transaction_document(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 12: get_transaction_links (BASSE)
-- ============================================================================

ALTER FUNCTION get_transaction_links(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 13: notify_admin_affiliate_order (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION notify_admin_affiliate_order()
SET search_path = public;

-- ============================================================================
-- FONCTION 14: notify_admin_product_approval (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION notify_admin_product_approval()
SET search_path = public;

-- ============================================================================
-- FONCTION 15: notify_admin_organisation_approval (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION notify_admin_organisation_approval()
SET search_path = public;

-- ============================================================================
-- FONCTION 16: lookup_customer_by_code (MOYENNE)
-- ============================================================================

ALTER FUNCTION lookup_customer_by_code(VARCHAR)
SET search_path = public;

-- ============================================================================
-- FONCTION 17: track_selection_view (BASSE)
-- ============================================================================

ALTER FUNCTION track_selection_view(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 18: track_product_view (BASSE)
-- ============================================================================

ALTER FUNCTION track_product_view(UUID, UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 19: update_addresses_timestamp (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION update_addresses_timestamp()
SET search_path = public;

-- ============================================================================
-- FONCTION 20: is_admin (BASSE)
-- ============================================================================

ALTER FUNCTION is_admin()
SET search_path = public;

-- ============================================================================
-- FONCTION 21: create_stock_on_affiliate_reception_confirm (MOYENNE - Trigger)
-- ============================================================================

ALTER FUNCTION create_stock_on_affiliate_reception_confirm()
SET search_path = public;

-- ============================================================================
-- FONCTION 22: notify_admin_new_form_submission (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION notify_admin_new_form_submission()
SET search_path = public;

-- ============================================================================
-- FONCTION 23: is_staff_user (HAUTE - RLS helper)
-- ============================================================================
-- Deja corrigee mais verifions

ALTER FUNCTION is_staff_user()
SET search_path = public;

-- ============================================================================
-- FONCTION 24: check_sales_order_exists (HAUTE - RLS helper)
-- ============================================================================
-- Deja corrigee mais verifions

ALTER FUNCTION check_sales_order_exists(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 25: get_linkme_orders (MOYENNE)
-- ============================================================================

ALTER FUNCTION get_linkme_orders(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 26: get_linkme_order_items (MOYENNE)
-- ============================================================================

ALTER FUNCTION get_linkme_order_items(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 27: get_dashboard_stock_orders_metrics (MOYENNE)
-- ============================================================================

ALTER FUNCTION get_dashboard_stock_orders_metrics()
SET search_path = public;

-- ============================================================================
-- FONCTION 28: preview_apply_matching_rule (MOYENNE - Finance)
-- ============================================================================

ALTER FUNCTION preview_apply_matching_rule(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 29: apply_matching_rule_confirm (MOYENNE - Finance)
-- ============================================================================

DO $$
BEGIN
  -- Cette fonction peut avoir plusieurs signatures, essayons les deux
  BEGIN
    ALTER FUNCTION apply_matching_rule_confirm(UUID, UUID[])
    SET search_path = public;
  EXCEPTION WHEN undefined_function THEN
    RAISE NOTICE 'apply_matching_rule_confirm(UUID, UUID[]) non trouvee';
  END;
END $$;

-- ============================================================================
-- FONCTION 30: apply_rule_to_all_matching (BASSE - Finance)
-- ============================================================================

ALTER FUNCTION apply_rule_to_all_matching(UUID)
SET search_path = public;

-- ============================================================================
-- FONCTION 31: auto_classify_bank_transaction (BASSE - Finance)
-- ============================================================================

ALTER FUNCTION auto_classify_bank_transaction()
SET search_path = public;

-- ============================================================================
-- FONCTION 32: update_product_stock_after_movement (MOYENNE - Stock)
-- ============================================================================

ALTER FUNCTION update_product_stock_after_movement()
SET search_path = public;

-- ============================================================================
-- FONCTION 33: create_linkme_commission_on_order_update (BASSE - Trigger)
-- ============================================================================

ALTER FUNCTION create_linkme_commission_on_order_update()
SET search_path = public;

-- ============================================================================
-- AUTRES FONCTIONS TRIGGER SANS search_path
-- ============================================================================

-- handle_shipment_deletion
ALTER FUNCTION handle_shipment_deletion()
SET search_path = public;

-- handle_shipment_quantity_update
ALTER FUNCTION handle_shipment_quantity_update()
SET search_path = public;

-- prevent_po_direct_cancellation
ALTER FUNCTION prevent_po_direct_cancellation()
SET search_path = public;

-- prevent_so_direct_cancellation
ALTER FUNCTION prevent_so_direct_cancellation()
SET search_path = public;

-- validate_stock_alerts_on_po
ALTER FUNCTION validate_stock_alerts_on_po()
SET search_path = public;

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration 20260121_002: search_path ajoute aux fonctions SECURITY DEFINER';
  RAISE NOTICE 'Les fonctions sont maintenant protegees contre les attaques par injection de schema';
END $$;
