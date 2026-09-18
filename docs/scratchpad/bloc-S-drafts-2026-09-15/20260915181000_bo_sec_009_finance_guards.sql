-- =====================================================================
-- [BO-SEC-009] Lot 9 — Gardes d'accès sur les fonctions finance sensibles
-- =====================================================================
-- Plan approuvé par Roméo le 15/09/2026 (bloc S, décision finance = owner/admin).
-- Référence snapshot : docs/scratchpad/snapshot-2026-09-15-bloc-S-functions.sql
--
-- Inventaire des fonctions traitées :
-- | Fonction                                              | Action                              |
-- |-------------------------------------------------------|-------------------------------------|
-- | apply_matching_rule_confirm(uuid,text[])              | Garde owner/admin                   |
-- | auto_classify_all_unmatched()                         | Garde owner/admin                   |
-- | create_customer_invoice_from_order(uuid)              | Garde owner/admin                   |
-- | create_supplier_invoice(uuid,uuid,text,...)           | Garde owner/admin                   |
-- | delete_order_payment(uuid)                            | Garde owner/admin                   |
-- | link_linkme_payment_to_bank_transaction(uuid,text)    | Garde owner/admin                   |
-- | link_transaction_to_document(uuid,uuid,uuid,...)      | Garde owner/admin                   |
-- | toggle_ignore_transaction(uuid,boolean,text)          | Garde owner/admin                   |
-- | unlink_transaction_document(uuid)                     | Garde owner/admin                   |
-- | decrement_selection_products_count(uuid)              | Garde is_backoffice_user()          |
-- | update_user_contact(text,text,text,text,text) 5-arg   | Garde propre-email ou backoffice    |
-- | update_user_contact(text,text,text,text) 4-arg        | REVOKE authenticated → service_role  |
-- | recalculate_order_paid_amount(uuid,uuid)              | REVOKE authenticated → service_role  |
-- | create_notification_for_owners(text,text,text,...)    | REVOKE authenticated → service_role  |
-- | increment_promo_usage(uuid)                           | REVOKE authenticated → service_role  |
-- | auto_match_bank_transaction(text,numeric,text,tstz)   | REVOKE authenticated → service_role  |
-- | auto_match_bank_transaction(text,numeric,side,text,...) | REVOKE authenticated → service_role |
--
-- Modèle de garde owner/admin copié de :
--   supabase/migrations/20260911230000_bo_audit_sec_s1_lot2_role_guard.sql lignes 34-45
-- =====================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';

-- =====================================================================
-- SECTION A — FONCTIONS AVEC GARDE OWNER/ADMIN BACK-OFFICE
-- Corps : byte-identique au corps pré-migration + bloc garde après BEGIN
-- =====================================================================

-- A.1 apply_matching_rule_confirm(uuid,text[])
CREATE OR REPLACE FUNCTION public.apply_matching_rule_confirm(p_rule_id uuid, p_selected_normalized_labels text[])
 RETURNS TABLE(nb_updated integer, updated_ids uuid[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rule RECORD;
  v_updated_count INTEGER := 0;
  v_updated_ids UUID[];
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  SELECT id, match_value, default_category, organisation_id, default_vat_rate, justification_optional
  INTO v_rule
  FROM matching_rules
  WHERE id = p_rule_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Règle non trouvée: %', p_rule_id;
  END IF;

  IF p_selected_normalized_labels IS NULL OR array_length(p_selected_normalized_labels, 1) = 0 THEN
    RAISE EXCEPTION 'Aucun label sélectionné pour application';
  END IF;

  PERFORM set_config('app.apply_rule_context', 'true', true);

  WITH updated AS (
    UPDATE bank_transactions bt SET
      applied_rule_id = p_rule_id,
      category_pcg = COALESCE(v_rule.default_category, bt.category_pcg),
      counterparty_organisation_id = COALESCE(v_rule.organisation_id, bt.counterparty_organisation_id),
      justification_optional = COALESCE(v_rule.justification_optional, bt.justification_optional),
      vat_rate = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL
        THEN v_rule.default_vat_rate
        ELSE bt.vat_rate
      END,
      amount_ht = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL AND bt.amount IS NOT NULL
        THEN ROUND(ABS(bt.amount) / (1 + v_rule.default_vat_rate / 100), 2)
        ELSE bt.amount_ht
      END,
      amount_vat = CASE
        WHEN v_rule.default_vat_rate IS NOT NULL AND bt.vat_rate IS NULL AND bt.amount IS NOT NULL
        THEN ROUND(ABS(bt.amount) - ROUND(ABS(bt.amount) / (1 + v_rule.default_vat_rate / 100), 2), 2)
        ELSE bt.amount_vat
      END,
      matching_status = 'auto_matched',
      match_reason = 'Règle confirmée: ' || v_rule.match_value,
      updated_at = NOW()
    WHERE bt.side = 'debit'
      AND (bt.applied_rule_id IS NULL OR bt.applied_rule_id = p_rule_id)
      AND normalize_label(bt.label) = ANY(p_selected_normalized_labels)
    RETURNING bt.id
  )
  SELECT COUNT(*)::INTEGER, array_agg(id)
  INTO v_updated_count, v_updated_ids
  FROM updated;

  PERFORM set_config('app.apply_rule_context', 'false', true);

  RETURN QUERY SELECT v_updated_count, COALESCE(v_updated_ids[1:20], ARRAY[]::UUID[]);
END;
$function$;

-- A.2 auto_classify_all_unmatched()
CREATE OR REPLACE FUNCTION public.auto_classify_all_unmatched()
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_rule RECORD; v_updated INTEGER := 0; v_total INTEGER := 0; v_rule_count INTEGER; BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
      AND role IN ('owner', 'admin') AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis' USING ERRCODE = '42501';
  END IF;
  FOR v_rule IN SELECT id, match_type, match_value, default_category, organisation_id FROM matching_rules WHERE is_active = true AND enabled = true ORDER BY priority ASC LOOP WITH updated AS ( UPDATE bank_transactions bt SET category_pcg = v_rule.default_category, counterparty_organisation_id = v_rule.organisation_id, applied_rule_id = v_rule.id, matching_status = 'auto_matched' WHERE (bt.matching_status = 'unmatched' OR bt.matching_status IS NULL) AND bt.side = 'debit' AND bt.applied_rule_id IS NULL AND ( (v_rule.match_type = 'label_contains' AND bt.label ILIKE '%' || v_rule.match_value || '%') OR (v_rule.match_type = 'label_exact' AND LOWER(bt.label) = LOWER(v_rule.match_value)) OR (v_rule.match_type = 'label_regex' AND bt.label ~* v_rule.match_value) ) RETURNING 1 ) SELECT count(*) INTO v_rule_count FROM updated; v_total := v_total + v_rule_count; END LOOP; RETURN json_build_object('success', true, 'classified_count', v_total, 'message', format('%s transaction(s) classée(s) automatiquement', v_total)); END; $function$;

-- A.3 create_customer_invoice_from_order(uuid)
CREATE OR REPLACE FUNCTION public.create_customer_invoice_from_order(p_sales_order_id uuid)
 RETURNS financial_documents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice financial_documents;
  v_order sales_orders;
  v_total_ht DECIMAL(12,2);
  v_tva_rate DECIMAL(5,4) := 0.20;
  v_tva_amount DECIMAL(12,2);
  v_total_ttc DECIMAL(12,2);
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
      AND role IN ('owner', 'admin') AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_order FROM sales_orders WHERE id = p_sales_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commande % introuvable', p_sales_order_id; END IF;
  IF v_order.status NOT IN ('shipped', 'delivered') THEN
    RAISE EXCEPTION 'Statut commande invalide (doit être shipped ou delivered): %', v_order.status;
  END IF;
  IF EXISTS (SELECT 1 FROM financial_documents WHERE sales_order_id = p_sales_order_id AND document_type = 'customer_invoice') THEN
    RAISE EXCEPTION 'Facture déjà créée pour commande %', v_order.order_number;
  END IF;
  SELECT COALESCE(SUM(total_ht), 0) INTO v_total_ht FROM sales_order_items WHERE sales_order_id = p_sales_order_id;
  IF v_total_ht = 0 THEN RAISE EXCEPTION 'Commande % sans items ou montant nul', v_order.order_number; END IF;
  v_tva_amount := ROUND(v_total_ht * v_tva_rate, 2);
  v_total_ttc := v_total_ht + v_tva_amount;
  INSERT INTO financial_documents (document_type, document_direction, partner_id, partner_type, document_number, document_date, due_date, total_ht, total_ttc, tva_amount, status, sales_order_id, abby_invoice_id, abby_invoice_number, created_by)
  VALUES ('customer_invoice', 'inbound', v_order.customer_id, 'customer', 'PENDING-' || gen_random_uuid()::text, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', v_total_ht, v_total_ttc, v_tva_amount, 'draft', p_sales_order_id, 'pending_sync_' || gen_random_uuid()::text, 'PENDING', auth.uid())
  RETURNING * INTO v_invoice;
  INSERT INTO financial_document_lines (document_id, line_number, product_id, description, quantity, unit_price_ht, total_ht, tva_rate)
  SELECT v_invoice.id, ROW_NUMBER() OVER (ORDER BY soi.created_at), soi.product_id, p.name, soi.quantity, soi.unit_price_ht, soi.total_ht, 20.00
  FROM sales_order_items soi JOIN products p ON soi.product_id = p.id WHERE soi.sales_order_id = p_sales_order_id;
  RAISE NOTICE 'Facture créée: % pour commande %', v_invoice.id, v_order.order_number;
  RETURN v_invoice;
END;
$function$;

-- A.4 create_supplier_invoice(uuid,uuid,text,date,date,numeric,numeric,numeric,text,text)
CREATE OR REPLACE FUNCTION public.create_supplier_invoice(p_supplier_id uuid, p_purchase_order_id uuid, p_invoice_number text, p_invoice_date date, p_due_date date, p_total_ht numeric, p_total_ttc numeric, p_tva_amount numeric, p_uploaded_file_url text, p_notes text DEFAULT NULL::text)
 RETURNS financial_documents
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_invoice financial_documents;
  v_document_number TEXT;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.user_app_roles
    WHERE user_id = auth.uid() AND app = 'back-office'
      AND role IN ('owner', 'admin') AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Acces refuse: role back-office owner/admin requis' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_supplier_id AND type = 'supplier') THEN
    RAISE EXCEPTION 'Fournisseur % invalide ou inexistant', p_supplier_id;
  END IF;
  IF p_purchase_order_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM purchase_orders WHERE id = p_purchase_order_id AND supplier_id = p_supplier_id) THEN
      RAISE EXCEPTION 'Commande fournisseur % invalide', p_purchase_order_id;
    END IF;
  END IF;
  v_document_number := 'FACF-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM') || '-' || p_invoice_number;
  INSERT INTO financial_documents (document_type, document_direction, partner_id, partner_type, document_number, document_date, due_date, total_ht, total_ttc, tva_amount, status, purchase_order_id, uploaded_file_url, notes, created_by)
  VALUES ('supplier_invoice', 'outbound', p_supplier_id, 'supplier', v_document_number, p_invoice_date, p_due_date, p_total_ht, p_total_ttc, p_tva_amount, 'received', p_purchase_order_id, p_uploaded_file_url, p_notes, auth.uid())
  RETURNING * INTO v_invoice;
  RAISE NOTICE 'Facture fournisseur créée: %', v_invoice.document_number;
  RETURN v_invoice;
END;
$function$;

-- A.5 delete_order_payment(uuid)
CREATE OR REPLACE FUNCTION public.delete_order_payment(p_payment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment RECORD;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  SELECT * INTO v_payment FROM order_payments WHERE id = p_payment_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  DELETE FROM order_payments WHERE id = p_payment_id;

  PERFORM recalculate_order_paid_amount(
    p_sales_order_id := v_payment.sales_order_id,
    p_purchase_order_id := v_payment.purchase_order_id
  );

  RETURN TRUE;
END;
$function$;

-- A.6 link_linkme_payment_to_bank_transaction(uuid,text)
CREATE OR REPLACE FUNCTION public.link_linkme_payment_to_bank_transaction(p_payment_request_id uuid, p_payment_reference text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_doc_id uuid;
  v_total_ttc numeric;
  v_transaction_id uuid;
  v_already_linked boolean;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  SELECT financial_document_id, total_amount_ttc INTO v_doc_id, v_total_ttc
  FROM linkme_payment_requests WHERE id = p_payment_request_id;
  IF v_doc_id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'no_financial_document', 'message', 'La demande n''a pas de document financier rattaché. La facture n''a peut-être pas été déposée.');
  END IF;
  SELECT EXISTS(SELECT 1 FROM transaction_document_links WHERE document_id = v_doc_id) INTO v_already_linked;
  IF v_already_linked THEN
    RETURN jsonb_build_object('linked', true, 'reason', 'already_linked', 'message', 'Le document est déjà rapproché à une transaction.');
  END IF;
  SELECT id INTO v_transaction_id FROM bank_transactions
  WHERE side = 'debit' AND p_payment_reference IS NOT NULL AND length(trim(p_payment_reference)) > 0
    AND (reference ILIKE '%' || p_payment_reference || '%' OR transaction_id ILIKE '%' || p_payment_reference || '%' OR label ILIKE '%' || p_payment_reference || '%')
  ORDER BY emitted_at DESC LIMIT 1;
  IF v_transaction_id IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'reason', 'transaction_not_found', 'message', 'Aucune transaction bancaire trouvée pour cette référence. Rapproche manuellement dans /finance/transactions.');
  END IF;
  INSERT INTO transaction_document_links (transaction_id, document_id, link_type, allocated_amount, created_by)
  VALUES (v_transaction_id, v_doc_id, 'document', v_total_ttc, (SELECT auth.uid()))
  ON CONFLICT (transaction_id, document_id) DO NOTHING;
  UPDATE financial_documents SET status = 'paid', amount_paid = v_total_ttc, updated_at = now() WHERE id = v_doc_id;
  RETURN jsonb_build_object('linked', true, 'transaction_id', v_transaction_id, 'document_id', v_doc_id, 'message', 'Transaction rapprochée avec succès.');
END;
$function$;

-- A.7 link_transaction_to_document(uuid,uuid,uuid,uuid,numeric,text)
CREATE OR REPLACE FUNCTION public.link_transaction_to_document(p_transaction_id uuid, p_document_id uuid DEFAULT NULL::uuid, p_sales_order_id uuid DEFAULT NULL::uuid, p_purchase_order_id uuid DEFAULT NULL::uuid, p_allocated_amount numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link_type VARCHAR(50);
  v_link_id UUID;
  v_amount DECIMAL;
  v_resolved_document_id UUID;
  v_resolved_sales_order_id UUID;
  v_existing_link_id UUID;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  IF p_document_id IS NOT NULL THEN v_link_type := 'document';
  ELSIF p_sales_order_id IS NOT NULL THEN v_link_type := 'sales_order';
  ELSIF p_purchase_order_id IS NOT NULL THEN v_link_type := 'purchase_order';
  ELSE RAISE EXCEPTION 'Au moins un ID cible doit etre fourni';
  END IF;
  IF p_allocated_amount IS NULL THEN SELECT ABS(amount) INTO v_amount FROM bank_transactions WHERE id = p_transaction_id;
  ELSE v_amount := p_allocated_amount;
  END IF;
  v_resolved_document_id := p_document_id;
  v_resolved_sales_order_id := p_sales_order_id;
  IF p_document_id IS NOT NULL AND p_sales_order_id IS NULL THEN
    SELECT fd.sales_order_id INTO v_resolved_sales_order_id FROM financial_documents fd WHERE fd.id = p_document_id AND fd.sales_order_id IS NOT NULL AND fd.deleted_at IS NULL;
  END IF;
  IF p_sales_order_id IS NOT NULL AND p_document_id IS NULL THEN
    SELECT fd.id INTO v_resolved_document_id FROM financial_documents fd WHERE fd.sales_order_id = p_sales_order_id AND fd.document_type = 'customer_invoice' AND fd.deleted_at IS NULL ORDER BY fd.created_at DESC LIMIT 1;
  END IF;
  IF v_link_type = 'document' AND v_resolved_document_id IS NOT NULL THEN
    SELECT id INTO v_existing_link_id FROM transaction_document_links WHERE transaction_id = p_transaction_id AND document_id = v_resolved_document_id;
  ELSIF v_link_type = 'sales_order' THEN
    SELECT id INTO v_existing_link_id FROM transaction_document_links WHERE transaction_id = p_transaction_id AND sales_order_id = v_resolved_sales_order_id LIMIT 1;
    IF v_existing_link_id IS NULL AND v_resolved_document_id IS NOT NULL THEN
      SELECT id INTO v_existing_link_id FROM transaction_document_links WHERE transaction_id = p_transaction_id AND document_id = v_resolved_document_id;
    END IF;
  ELSIF v_link_type = 'purchase_order' THEN
    SELECT id INTO v_existing_link_id FROM transaction_document_links WHERE transaction_id = p_transaction_id AND purchase_order_id = p_purchase_order_id;
  END IF;
  IF v_existing_link_id IS NOT NULL THEN
    UPDATE transaction_document_links SET allocated_amount = v_amount, document_id = COALESCE(v_resolved_document_id, document_id), sales_order_id = COALESCE(v_resolved_sales_order_id, sales_order_id), notes = COALESCE(p_notes, notes), updated_at = NOW() WHERE id = v_existing_link_id RETURNING id INTO v_link_id;
  ELSE
    INSERT INTO transaction_document_links (transaction_id, document_id, sales_order_id, purchase_order_id, link_type, allocated_amount, notes) VALUES (p_transaction_id, v_resolved_document_id, v_resolved_sales_order_id, p_purchase_order_id, v_link_type, v_amount, p_notes) RETURNING id INTO v_link_id;
  END IF;
  UPDATE bank_transactions SET matching_status = 'manual_matched', matched_document_id = COALESCE(v_resolved_document_id, matched_document_id), updated_at = NOW() WHERE id = p_transaction_id;
  IF v_resolved_document_id IS NOT NULL THEN
    UPDATE financial_documents SET amount_paid = LEAST(COALESCE(sub.total_allocated, 0), total_ttc), status = CASE WHEN COALESCE(sub.total_allocated, 0) >= total_ttc THEN 'paid'::document_status WHEN COALESCE(sub.total_allocated, 0) > 0 THEN 'partially_paid'::document_status ELSE status END, updated_at = NOW() FROM (SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated FROM transaction_document_links WHERE document_id = v_resolved_document_id) sub WHERE id = v_resolved_document_id;
  END IF;
  IF v_resolved_sales_order_id IS NOT NULL THEN PERFORM recalculate_order_paid_amount(p_sales_order_id := v_resolved_sales_order_id); END IF;
  IF p_purchase_order_id IS NOT NULL THEN PERFORM recalculate_order_paid_amount(p_purchase_order_id := p_purchase_order_id); END IF;
  RETURN v_link_id;
END;
$function$;

-- A.8 toggle_ignore_transaction(uuid,boolean,text)
CREATE OR REPLACE FUNCTION public.toggle_ignore_transaction(p_tx_id uuid, p_ignore boolean, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_current_status TEXT;
  v_tx_label TEXT;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  PERFORM check_transaction_not_locked(p_tx_id);
  SELECT matching_status, label INTO v_current_status, v_tx_label FROM bank_transactions WHERE id = p_tx_id;
  IF v_current_status IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Transaction not found'); END IF;
  IF p_ignore THEN
    UPDATE bank_transactions SET matching_status = 'ignored', ignored_at = now(), ignored_by = auth.uid(), ignore_reason = COALESCE(p_reason, 'Ignore manuellement'), updated_at = now() WHERE id = p_tx_id;
    RETURN jsonb_build_object('success', true, 'ignored', true, 'transaction_label', v_tx_label, 'message', 'Transaction ignoree');
  ELSE
    UPDATE bank_transactions SET matching_status = 'unmatched', ignored_at = NULL, ignored_by = NULL, ignore_reason = NULL, updated_at = now() WHERE id = p_tx_id;
    RETURN jsonb_build_object('success', true, 'ignored', false, 'transaction_label', v_tx_label, 'previous_status', v_current_status, 'message', 'Transaction restauree');
  END IF;
END;
$function$;

-- A.9 unlink_transaction_document(uuid)
CREATE OR REPLACE FUNCTION public.unlink_transaction_document(p_link_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_link RECORD;
BEGIN
  -- [BO-SEC-009] Garde d'acces : owner/admin back-office uniquement.
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

  SELECT * INTO v_link FROM transaction_document_links WHERE id = p_link_id;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  DELETE FROM transaction_document_links WHERE id = p_link_id;
  IF v_link.document_id IS NOT NULL THEN
    UPDATE financial_documents SET amount_paid = COALESCE(sub.total_allocated, 0), status = CASE WHEN COALESCE(sub.total_allocated, 0) >= total_ttc THEN 'paid'::document_status WHEN COALESCE(sub.total_allocated, 0) > 0 THEN 'partially_paid'::document_status ELSE 'sent'::document_status END, updated_at = NOW() FROM (SELECT COALESCE(SUM(allocated_amount), 0) AS total_allocated FROM transaction_document_links WHERE document_id = v_link.document_id) sub WHERE id = v_link.document_id;
  END IF;
  IF v_link.sales_order_id IS NOT NULL THEN PERFORM recalculate_order_paid_amount(p_sales_order_id := v_link.sales_order_id); END IF;
  IF v_link.purchase_order_id IS NOT NULL THEN PERFORM recalculate_order_paid_amount(p_purchase_order_id := v_link.purchase_order_id); END IF;
  IF NOT EXISTS (SELECT 1 FROM transaction_document_links WHERE transaction_id = v_link.transaction_id) THEN
    UPDATE bank_transactions SET matching_status = 'unmatched', matched_document_id = NULL, updated_at = NOW() WHERE id = v_link.transaction_id;
  END IF;
  RETURN TRUE;
END;
$function$;

-- =====================================================================
-- SECTION B — GARDE is_backoffice_user()
-- =====================================================================

-- B.1 decrement_selection_products_count(uuid)
CREATE OR REPLACE FUNCTION public.decrement_selection_products_count(p_selection_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- [BO-SEC-009] Garde d'acces : utilisateur back-office requis.
  IF NOT is_backoffice_user() THEN
    RAISE EXCEPTION 'Acces refuse: acces back-office requis'
      USING ERRCODE = '42501';
  END IF;

  UPDATE linkme_selections
  SET products_count = GREATEST(COALESCE(products_count, 0) - 1, 0),
      updated_at = NOW()
  WHERE id = p_selection_id;
END;
$function$;

-- =====================================================================
-- SECTION C — GARDE PROPRE-EMAIL OU BACK-OFFICE
-- =====================================================================

-- C.1 update_user_contact(text,text,text,text,text) — 5 arguments
CREATE OR REPLACE FUNCTION public.update_user_contact(p_email text, p_first_name text, p_last_name text, p_phone text DEFAULT NULL::text, p_title text DEFAULT NULL::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- [BO-SEC-009] Garde d'acces : propre email ou utilisateur back-office.
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Acces refuse: authentification requise' USING ERRCODE = '42501';
  END IF;
  IF NOT is_backoffice_user() THEN
    IF NOT EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND LOWER(email) = LOWER(p_email)
    ) THEN
      RAISE EXCEPTION 'Acces refuse: vous ne pouvez modifier que votre propre contact'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RETURN json_build_object('success', false, 'error', 'Email is required');
  END IF;
  UPDATE contacts
  SET first_name = p_first_name, last_name = p_last_name, phone = p_phone, title = p_title, updated_at = NOW()
  WHERE email = p_email;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Contact not found for email: ' || p_email);
  END IF;
  RETURN json_build_object('success', true, 'email', p_email);
END;
$function$;

-- =====================================================================
-- SECTION D — DROITS UNIQUEMENT (pas de garde — appels internes uniquement)
-- REVOKE FROM PUBLIC, anon, authenticated + GRANT TO service_role
-- =====================================================================

-- D.1 update_user_contact(text,text,text,text) — 4 arguments (service_role uniquement)
REVOKE EXECUTE ON FUNCTION public.update_user_contact(text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_contact(text, text, text, text) TO service_role;

-- D.2 recalculate_order_paid_amount(uuid,uuid) — helper interne
REVOKE EXECUTE ON FUNCTION public.recalculate_order_paid_amount(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recalculate_order_paid_amount(uuid, uuid) TO service_role;

-- D.3 create_notification_for_owners(text,text,text,text,text,text) — déclenché par triggers internes
REVOKE EXECUTE ON FUNCTION public.create_notification_for_owners(text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification_for_owners(text, text, text, text, text, text) TO service_role;

-- D.4 increment_promo_usage(uuid) — appelé depuis une route serveur authentifiée
REVOKE EXECUTE ON FUNCTION public.increment_promo_usage(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_promo_usage(uuid) TO service_role;

-- D.5 auto_match_bank_transaction(text,numeric,text,timestamp with time zone)
REVOKE EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, text, timestamp with time zone) TO service_role;

-- D.6 auto_match_bank_transaction(text,numeric,transaction_side,text,timestamp with time zone)
REVOKE EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, transaction_side, text, timestamp with time zone) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, transaction_side, text, timestamp with time zone) TO service_role;

COMMIT;

-- ---------------------------------------------------------------------
-- RETOUR ARRIÈRE (droits + corps d'avant, relevés le 15/09/2026) :
-- Corps complets dans snapshot-2026-09-15-bloc-S-functions.sql
-- ---------------------------------------------------------------------
-- BEGIN;
-- -- Restaurer les corps sans garde (sections A, B, C) :
-- --   Rejouer toutes les CREATE OR REPLACE de snapshot-2026-09-15-bloc-S-functions.sql
--
-- -- Restaurer les droits authenticated (section D) :
-- GRANT EXECUTE ON FUNCTION public.update_user_contact(text, text, text, text) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.recalculate_order_paid_amount(uuid, uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.create_notification_for_owners(text, text, text, text, text, text) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.increment_promo_usage(uuid) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, text, timestamp with time zone) TO authenticated;
-- GRANT EXECUTE ON FUNCTION public.auto_match_bank_transaction(text, numeric, transaction_side, text, timestamp with time zone) TO authenticated;
-- COMMIT;
