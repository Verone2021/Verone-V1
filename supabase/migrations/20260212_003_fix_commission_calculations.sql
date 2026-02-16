-- ============================================================
-- Migration: Fix Commission Calculations (SSOT: selling_price - base_price)
-- Date: 2026-02-12
-- Ticket: LM-USERS-001
--
-- Root cause: retrocession_amount was calculated as
--   unit_price_ht × qty × retrocession_rate / 100
-- instead of the correct formula:
--   (selling_price_ht - base_price_ht) × qty
--
-- This caused ~1,563 EUR of cumulative errors across 96 commissions.
--
-- Fixes:
-- 1.1 Trigger calculate_retrocession_amount(): use margin-based formula
-- 1.2 RPC create_affiliate_order(): fix retrocession_amount insert
-- 1.3 Drop duplicate trigger trig_recalc_so_totals
-- 1.4 Recalculate ALL retrocession_amount in sales_order_items
-- 1.5 Recalculate ALL affiliate_commission in linkme_commissions
-- 1.6 Update reconcile_linkme_commissions() check #2
-- ============================================================

-- ============================================================
-- 1.1 FIX TRIGGER: calculate_retrocession_amount()
-- For LinkMe items: commission = (selling_price - base_price) × qty
-- For non-LinkMe items: fallback to rate-based formula
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_retrocession_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_base_price NUMERIC;
BEGIN
  -- For LinkMe items: commission = (selling_price - base_price) × qty
  IF NEW.linkme_selection_item_id IS NOT NULL THEN
    SELECT base_price_ht INTO v_base_price
    FROM linkme_selection_items
    WHERE id = NEW.linkme_selection_item_id;

    IF v_base_price IS NOT NULL THEN
      NEW.retrocession_amount := ROUND(
        (NEW.unit_price_ht - v_base_price) * NEW.quantity, 2
      );
    ELSE
      NEW.retrocession_amount := 0.00;
    END IF;
  -- For non-LinkMe items: rate-based formula (fallback)
  ELSIF NEW.retrocession_rate IS NOT NULL AND NEW.retrocession_rate > 0 THEN
    NEW.retrocession_amount := ROUND(
      (NEW.unit_price_ht * NEW.quantity) * (NEW.retrocession_rate / 100),
      2
    );
  ELSE
    NEW.retrocession_amount := 0.00;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 1.2 FIX RPC: create_affiliate_order()
-- Fix retrocession_amount to use (selling_price - base_price) × qty
-- ============================================================

CREATE OR REPLACE FUNCTION create_affiliate_order(
  p_affiliate_id UUID,
  p_customer_id UUID,
  p_customer_type TEXT,
  p_selection_id UUID,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL,
  p_responsable_contact_id UUID DEFAULT NULL,
  p_billing_contact_id UUID DEFAULT NULL,
  p_delivery_contact_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_item JSONB;
  v_selection_item RECORD;
  v_total_ht NUMERIC := 0;
  v_total_ttc NUMERIC := 0;
  v_item_total_ht NUMERIC;
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
  v_max_num INTEGER;
  v_year TEXT;
  v_current_user_id UUID;
BEGIN
  -- Get current user
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilisateur non authentifié';
  END IF;

  -- ============================================
  -- VALIDATIONS
  -- ============================================

  IF NOT EXISTS (
    SELECT 1 FROM linkme_affiliates
    WHERE id = p_affiliate_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Affilié non trouvé ou inactif: %', p_affiliate_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM linkme_selections
    WHERE id = p_selection_id AND affiliate_id = p_affiliate_id
  ) THEN
    RAISE EXCEPTION 'Sélection non trouvée ou n appartient pas à l affilié: %', p_selection_id;
  END IF;

  IF p_customer_type = 'organization' THEN
    IF NOT EXISTS (SELECT 1 FROM organisations WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Organisation cliente non trouvée: %', p_customer_id;
    END IF;
  ELSIF p_customer_type = 'individual' THEN
    IF NOT EXISTS (SELECT 1 FROM individual_customers WHERE id = p_customer_id) THEN
      RAISE EXCEPTION 'Client individuel non trouvé: %', p_customer_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Type de client invalide: %. Doit être organization ou individual', p_customer_type;
  END IF;

  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Au moins un produit est requis';
  END IF;

  IF p_responsable_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_responsable_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact responsable invalide ou inactif: %', p_responsable_contact_id;
    END IF;
  END IF;

  IF p_billing_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_billing_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact facturation invalide ou inactif: %', p_billing_contact_id;
    END IF;
  END IF;

  IF p_delivery_contact_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM contacts
      WHERE id = p_delivery_contact_id AND is_active = TRUE
    ) THEN
      RAISE EXCEPTION 'Contact livraison invalide ou inactif: %', p_delivery_contact_id;
    END IF;
  END IF;

  -- ============================================
  -- ORDER NUMBER GENERATION
  -- ============================================

  v_year := TO_CHAR(NOW(), 'YYYY');

  SELECT COALESCE(
    MAX(
      CASE
        WHEN LENGTH(order_number) >= 13
             AND SUBSTRING(order_number FROM 10) ~ '^\d+$'
        THEN SUBSTRING(order_number FROM 10)::INTEGER
        ELSE 0
      END
    ), 0
  ) INTO v_max_num
  FROM sales_orders
  WHERE order_number LIKE 'SO-' || v_year || '-%';

  v_order_number := 'SO-' || v_year || '-' || LPAD((v_max_num + 1)::TEXT, 5, '0');

  -- ============================================
  -- CREATE ORDER
  -- ============================================

  INSERT INTO sales_orders (
    order_number,
    channel_id,
    customer_id,
    customer_type,
    status,
    payment_status,
    created_by,
    created_by_affiliate_id,
    pending_admin_validation,
    linkme_selection_id,
    notes,
    total_ht,
    total_ttc,
    tax_rate,
    shipping_cost_ht,
    insurance_cost_ht,
    handling_cost_ht,
    responsable_contact_id,
    billing_contact_id,
    delivery_contact_id
  ) VALUES (
    v_order_number,
    v_linkme_channel_id,
    p_customer_id,
    p_customer_type,
    'draft',
    'pending',
    v_current_user_id,
    p_affiliate_id,
    true,
    p_selection_id,
    p_notes,
    0,
    0,
    0.2,
    0,
    0,
    0,
    p_responsable_contact_id,
    p_billing_contact_id,
    p_delivery_contact_id
  ) RETURNING id INTO v_order_id;

  -- ============================================
  -- CREATE ORDER ITEMS
  -- ============================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT
      lsi.*,
      p.name as product_name,
      p.sku as product_sku
    INTO v_selection_item
    FROM linkme_selection_items lsi
    JOIN products p ON p.id = lsi.product_id
    WHERE lsi.id = (v_item->>'selection_item_id')::UUID
      AND lsi.selection_id = p_selection_id;

    IF v_selection_item IS NULL THEN
      RAISE EXCEPTION 'Item de sélection non trouvé ou n appartient pas à la sélection: %', v_item->>'selection_item_id';
    END IF;

    v_item_total_ht := v_selection_item.selling_price_ht * (v_item->>'quantity')::INTEGER;

    INSERT INTO sales_order_items (
      sales_order_id,
      product_id,
      quantity,
      unit_price_ht,
      tax_rate,
      linkme_selection_item_id,
      retrocession_rate,
      retrocession_amount
    ) VALUES (
      v_order_id,
      v_selection_item.product_id,
      (v_item->>'quantity')::INTEGER,
      v_selection_item.selling_price_ht,
      0.2,
      v_selection_item.id,
      v_selection_item.margin_rate,
      -- FIX: (selling_price - base_price) × qty (not base_price × margin_rate × qty)
      ROUND(
        (v_selection_item.selling_price_ht - v_selection_item.base_price_ht)
        * (v_item->>'quantity')::INTEGER,
        2
      )
    );

    v_total_ht := v_total_ht + v_item_total_ht;
  END LOOP;

  -- ============================================
  -- UPDATE ORDER TOTALS
  -- ============================================

  v_total_ttc := v_total_ht * 1.2;

  UPDATE sales_orders
  SET
    total_ht = v_total_ht,
    total_ttc = v_total_ttc
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$function$;

-- ============================================================
-- 1.3 DROP DUPLICATE TRIGGER
-- recalculate_sales_order_totals_trigger AND trig_recalc_so_totals
-- both call recalculate_sales_order_totals() — drop the duplicate
-- ============================================================

DROP TRIGGER IF EXISTS trig_recalc_so_totals ON sales_order_items;

-- ============================================================
-- 1.4 RECALCULATE ALL retrocession_amount IN sales_order_items
-- Disable trigger to prevent it from overwriting our corrections
-- (107 items have unit_price_ht != selling_price_ht)
-- ============================================================

ALTER TABLE sales_order_items DISABLE TRIGGER trg_calculate_retrocession;

-- Recalculate from linkme_selection_items (source of truth)
UPDATE sales_order_items soi
SET retrocession_amount = ROUND(
  (lsei.selling_price_ht - lsei.base_price_ht) * soi.quantity, 2
)
FROM linkme_selection_items lsei
WHERE lsei.id = soi.linkme_selection_item_id
  AND soi.linkme_selection_item_id IS NOT NULL;

-- Re-enable trigger (now using the corrected formula)
ALTER TABLE sales_order_items ENABLE TRIGGER trg_calculate_retrocession;

-- ============================================================
-- 1.5 RECALCULATE ALL affiliate_commission IN linkme_commissions
-- ============================================================

UPDATE linkme_commissions lc
SET
  affiliate_commission = sub.correct_commission,
  affiliate_commission_ttc = ROUND(sub.correct_commission * (1 + COALESCE(lc.tax_rate, 0.2)), 2),
  margin_rate_applied = ROUND(sub.correct_commission / NULLIF(lc.order_amount_ht, 0), 4),
  updated_at = NOW()
FROM (
  SELECT soi.sales_order_id,
    COALESCE(SUM(soi.retrocession_amount), 0) AS correct_commission
  FROM sales_order_items soi
  GROUP BY soi.sales_order_id
) sub
WHERE sub.sales_order_id = lc.order_id;

-- ============================================================
-- 1.6 UPDATE reconcile_linkme_commissions() CHECK #2
-- Use (selling_price - base_price) as reference instead of
-- just SUM(retrocession_amount) which could itself be stale
-- ============================================================

CREATE OR REPLACE FUNCTION reconcile_linkme_commissions()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_issues jsonb := '[]'::jsonb;
  v_missing_count int;
  v_mismatch_count int;
BEGIN
  -- Check 1: Shipped orders without commission
  SELECT COUNT(*) INTO v_missing_count
  FROM sales_orders so
  WHERE so.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
    AND so.status = 'shipped'
    AND NOT EXISTS (
      SELECT 1 FROM linkme_commissions lc WHERE lc.order_id = so.id
    );

  IF v_missing_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'missing_commission',
      'count', v_missing_count,
      'message', format('%s shipped orders without commission', v_missing_count)
    );
  END IF;

  -- Check 2: affiliate_commission vs real margins from selection items
  SELECT COUNT(*) INTO v_mismatch_count
  FROM linkme_commissions lc
  JOIN (
    SELECT soi.sales_order_id,
      COALESCE(SUM(
        ROUND((lsei.selling_price_ht - lsei.base_price_ht) * soi.quantity, 2)
      ), 0) AS expected
    FROM sales_order_items soi
    JOIN linkme_selection_items lsei ON lsei.id = soi.linkme_selection_item_id
    WHERE soi.linkme_selection_item_id IS NOT NULL
    GROUP BY soi.sales_order_id
  ) sub ON sub.sales_order_id = lc.order_id
  WHERE ABS(lc.affiliate_commission - sub.expected) > 0.01;

  IF v_mismatch_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'affiliate_commission_mismatch',
      'count', v_mismatch_count,
      'message', format('%s commissions with affiliate_commission != SUM((selling_price - base_price) * qty)', v_mismatch_count)
    );
  END IF;

  -- Check 3: linkme_commission mismatch vs per-item calculation
  SELECT COUNT(*) INTO v_mismatch_count
  FROM linkme_commissions lc
  JOIN (
    SELECT soi.sales_order_id,
      COALESCE(SUM(
        CASE WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
          THEN soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100
          ELSE 0
        END
      ), 0)::numeric(10,2) AS expected
    FROM sales_order_items soi
    JOIN products p ON p.id = soi.product_id
    GROUP BY soi.sales_order_id
  ) sub ON sub.sales_order_id = lc.order_id
  WHERE ABS(lc.linkme_commission - sub.expected) > 0.01;

  IF v_mismatch_count > 0 THEN
    v_issues := v_issues || jsonb_build_object(
      'type', 'linkme_commission_mismatch',
      'count', v_mismatch_count,
      'message', format('%s commissions with linkme_commission mismatch', v_mismatch_count)
    );
  END IF;

  RETURN jsonb_build_object(
    'is_healthy', jsonb_array_length(v_issues) = 0,
    'issues', v_issues,
    'checked_at', now()
  );
END;
$$;
