-- [PERF-001] Phase 3d: Fix search_path on SECURITY DEFINER functions
-- Mutable search_path + SECURITY DEFINER = potential privilege escalation
-- Fix: SET search_path = 'public' on all affected functions

ALTER FUNCTION public.cleanup_validated_alerts SET search_path = 'public';
ALTER FUNCTION public.count_active_owners SET search_path = 'public';
ALTER FUNCTION public.generate_product_sku() SET search_path = 'public';
ALTER FUNCTION public.generate_product_sku(uuid) SET search_path = 'public';
ALTER FUNCTION public.get_cleanup_candidates SET search_path = 'public';
ALTER FUNCTION public.get_storage_details SET search_path = 'public';
ALTER FUNCTION public.is_back_office_owner SET search_path = 'public';
ALTER FUNCTION public.is_back_office_privileged SET search_path = 'public';
ALTER FUNCTION public.link_transaction_to_document SET search_path = 'public';
ALTER FUNCTION public.mark_po_payment_received(uuid, numeric) SET search_path = 'public';
ALTER FUNCTION public.mark_po_payment_received(uuid, numeric, uuid, text, text, text, timestamptz) SET search_path = 'public';
ALTER FUNCTION public.prevent_last_owner_deletion_modern SET search_path = 'public';
ALTER FUNCTION public.prevent_last_owner_role_change_modern SET search_path = 'public';
ALTER FUNCTION public.reconcile_linkme_commissions SET search_path = 'public';
ALTER FUNCTION public.reject_affiliate_order SET search_path = 'public';
ALTER FUNCTION public.set_org_logo_from_enseigne SET search_path = 'public';
ALTER FUNCTION public.track_selection_view SET search_path = 'public';
ALTER FUNCTION public.trg_fn_update_pmp_on_po_received SET search_path = 'public';
ALTER FUNCTION public.unlink_transaction_document SET search_path = 'public';
ALTER FUNCTION public.update_product_cost_price_pmp SET search_path = 'public';
ALTER FUNCTION public.update_product_has_images SET search_path = 'public';
ALTER FUNCTION public.update_product_pmp_on_po_received SET search_path = 'public';
ALTER FUNCTION public.validate_affiliate_order SET search_path = 'public';
