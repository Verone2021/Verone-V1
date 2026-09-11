-- [BO-AUDIT-SEC-S1] Lot 2 — garde owner/admin back-office sur 4 signatures sensibles.
--
-- Appliquée en production le 2026-09-11 via execute_sql (accord écrit de Roméo), inscrite au carnet
-- supabase_migrations.schema_migrations : 20260911230000 bo_audit_sec_s1_lot2_role_guard.
--
-- Même garde, mot pour mot, que reset_finance_auto_data (BO-AUDIT-003) : utilisateur connecté ET rôle
-- back-office owner/admin actif, sinon 42501. Corps inchangés en dehors de la garde. CREATE OR REPLACE
-- conserve les droits posés au lot 1 (anon fermé ; authenticated + service_role gardés) et les signatures,
-- donc aucun changement des types TypeScript.
--
-- Appelants : packages/@verone/organisations/src/hooks/use-organisations-crud.ts (delete_organisation_safe),
-- packages/@verone/orders/src/hooks/use-sales-orders-payments.ts (mark_payment_received),
-- packages/@verone/orders/src/hooks/purchase-orders/purchase-order-mutations.ts (mark_po_payment_received).
-- Aucun appel LinkMe, site, route serveur, fonction Edge ni pg_cron.
-- Effet connu : cleanup_auto_suppliers (lancée à la main sans session) ne peut plus appeler delete_organisation_safe ;
-- le rôle back-office catalog_manager est refusé (décision Roméo : owner/admin uniquement).
--
-- Retour arrière : rejouer les 4 CREATE OR REPLACE ci-dessous en retirant le bloc
-- « [BO-AUDIT-SEC-S1 lot 2] Garde d'acces » (IF … END IF;) de chaque fonction.

CREATE OR REPLACE FUNCTION public.delete_organisation_safe(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_source TEXT;
  v_legal_name TEXT;
  v_unlinked_count INT := 0;
  v_disabled_rules_count INT := 0;
  v_action TEXT;
BEGIN
  -- [BO-AUDIT-SEC-S1 lot 2] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis'
      USING ERRCODE = '42501';
  END IF;

  SELECT source, legal_name INTO v_source, v_legal_name
  FROM organisations
  WHERE id = p_org_id;

  IF v_source IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Organisation not found'
    );
  END IF;

  UPDATE bank_transactions
  SET counterparty_organisation_id = NULL, updated_at = now()
  WHERE counterparty_organisation_id = p_org_id;
  GET DIAGNOSTICS v_unlinked_count = ROW_COUNT;

  UPDATE matching_rules
  SET is_active = false, disabled_at = now()
  WHERE organisation_id = p_org_id AND is_active = true;
  GET DIAGNOSTICS v_disabled_rules_count = ROW_COUNT;

  IF v_source = 'transaction_linking' THEN
    DELETE FROM organisations WHERE id = p_org_id;
    v_action := 'deleted';
  ELSE
    UPDATE organisations
    SET archived_at = now(), updated_at = now()
    WHERE id = p_org_id;
    v_action := 'archived';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'action', v_action,
    'organisation_name', v_legal_name,
    'source', v_source,
    'unlinked_transactions_count', v_unlinked_count,
    'disabled_rules_count', v_disabled_rules_count
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_payment_received(p_order_id uuid, p_amount numeric, p_user_id uuid DEFAULT NULL::uuid, p_payment_type text DEFAULT 'transfer_other'::text, p_reference text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment_id UUID;
BEGIN
  -- [BO-AUDIT-SEC-S1 lot 2] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis'
      USING ERRCODE = '42501';
  END IF;

  INSERT INTO order_payments (
    sales_order_id, payment_type, amount, payment_date, reference, note, created_by
  ) VALUES (
    p_order_id,
    p_payment_type::manual_payment_type,
    p_amount,
    COALESCE(p_date, NOW()),
    p_reference,
    p_note,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_payment_id;

  PERFORM recalculate_order_paid_amount(p_sales_order_id := p_order_id);

  UPDATE linkme_commissions
  SET status = 'validated', validated_at = NOW()
  WHERE order_id = p_order_id AND status = 'pending';

  RETURN v_payment_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_po_payment_received(p_order_id uuid, p_amount numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_ttc numeric;
  v_paid numeric;
  v_remaining numeric;
BEGIN
  -- [BO-AUDIT-SEC-S1 lot 2] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis'
      USING ERRCODE = '42501';
  END IF;

  SELECT total_ttc, COALESCE(paid_amount, 0)
  INTO v_total_ttc, v_paid
  FROM purchase_orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order % not found', p_order_id;
  END IF;

  v_remaining := v_total_ttc - v_paid;

  -- Reject if already fully paid
  IF v_remaining <= 0 THEN
    RAISE EXCEPTION 'PO already fully paid (remaining: %)', v_remaining;
  END IF;

  -- Reject if amount exceeds remaining (with 0.01 tolerance for rounding)
  IF p_amount > v_remaining + 0.01 THEN
    RAISE EXCEPTION 'Amount % exceeds remaining % for PO %', p_amount, v_remaining, p_order_id;
  END IF;

  -- Cap to exact remaining if slight rounding overshoot
  IF p_amount > v_remaining THEN
    p_amount := v_remaining;
  END IF;

  UPDATE purchase_orders
  SET
    payment_status_v2 = CASE
      WHEN v_paid + p_amount >= v_total_ttc THEN 'paid'
      ELSE 'partially_paid'
    END,
    paid_amount = v_paid + p_amount,
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
  WHERE id = p_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.mark_po_payment_received(p_order_id uuid, p_amount numeric, p_user_id uuid DEFAULT NULL::uuid, p_payment_type text DEFAULT 'transfer_other'::text, p_reference text DEFAULT NULL::text, p_note text DEFAULT NULL::text, p_date timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment_id UUID;
  v_total_ttc NUMERIC;
  v_current_paid NUMERIC;
BEGIN
  -- [BO-AUDIT-SEC-S1 lot 2] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1
    FROM public.user_app_roles
    WHERE user_id = auth.uid()
      AND app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis'
      USING ERRCODE = '42501';
  END IF;

  SELECT total_ttc, COALESCE(paid_amount, 0)
  INTO v_total_ttc, v_current_paid
  FROM purchase_orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase order % not found', p_order_id;
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be positive';
  END IF;

  INSERT INTO order_payments (
    purchase_order_id,
    payment_type,
    amount,
    payment_date,
    reference,
    note,
    created_by
  ) VALUES (
    p_order_id,
    p_payment_type::manual_payment_type,
    p_amount,
    COALESCE(p_date, NOW()),
    p_reference,
    p_note,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_payment_id;

  PERFORM recalculate_order_paid_amount(p_purchase_order_id := p_order_id);

  RETURN v_payment_id;
END;
$function$;
