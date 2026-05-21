-- =============================================================================
-- [BO-LINKME-PR-004] Corrections des triggers du workflow paiements LinkMe
-- =============================================================================
-- 3 corrections ciblees, aucune modification de schema (fonctions uniquement) :
--
-- 1. recompute_payment_request_status
--    Ecrivait le statut 'invoice_received', retire du CHECK de
--    linkme_payment_requests par BO-LINKME-PR-003 -> viole le CHECK si on retire
--    le dernier virement d'une demande avec facture. Corrige : 'pending'.
--
-- 2. create_linkme_commission_on_order_update
--    Principe metier : une commission ne disparait jamais. Le trigger faisait un
--    DELETE de la commission pour tout statut de commande hors validated/shipped
--    -> supprimait a tort la commission quand la commande progressait vers
--    partially_shipped ou delivered, et pouvait supprimer une commission deja
--    'requested' (dans une demande) ou 'paid' (versee). Corrige :
--      - DELETE uniquement pour draft (devalidation) / cancelled, et seulement
--        pour les commissions encore 'pending'/'validated' ;
--      - calcul + UPSERT pour tous les statuts de progression
--        (validated, partially_shipped, shipped, delivered) ;
--      - dans le ON CONFLICT DO UPDATE, le statut n'est recalcule que
--        pending<->validated ; 'requested'/'paid'/'cancelled' sont preserves.
--
-- 3. mark_commission_requested_on_item_insert
--    Garde-fou rendu bloquant : refuse d'attacher a une demande de paiement une
--    commission qui n'est pas 'validated' (commande non payee). Avant : UPDATE
--    silencieux qui laissait creer une ligne incoherente.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. recompute_payment_request_status
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_payment_request_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_request_id uuid;
  v_total_paid numeric;
  v_total_due numeric;
  v_current_status text;
  v_last_ref text;
BEGIN
  v_request_id := COALESCE(NEW.payment_request_id, OLD.payment_request_id);

  SELECT total_amount_ttc, status
    INTO v_total_due, v_current_status
    FROM linkme_payment_requests WHERE id = v_request_id;

  IF v_current_status = 'cancelled' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount_ttc), 0) INTO v_total_paid
    FROM linkme_payments WHERE payment_request_id = v_request_id;

  SELECT payment_reference INTO v_last_ref
    FROM linkme_payments WHERE payment_request_id = v_request_id
    ORDER BY payment_date DESC, created_at DESC LIMIT 1;

  IF v_total_due > 0 AND v_total_paid >= v_total_due THEN
    UPDATE linkme_payment_requests
      SET status = 'paid', paid_at = COALESCE(paid_at, now()), payment_reference = v_last_ref
      WHERE id = v_request_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE linkme_payment_requests
      SET status = 'partially_paid', paid_at = NULL, payment_reference = v_last_ref
      WHERE id = v_request_id;
  ELSE
    -- Aucun virement : retour au statut 'pending'. Le suivi de la facture est
    -- porte par le booleen invoice_received (BO-LINKME-PR-003), pas par status.
    UPDATE linkme_payment_requests
      SET status = 'pending', paid_at = NULL, payment_reference = NULL
      WHERE id = v_request_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- -----------------------------------------------------------------------------
-- 2. create_linkme_commission_on_order_update
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_linkme_commission_on_order_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_commission NUMERIC(10,2);
  v_affiliate_products_ca NUMERIC(10,2);
  v_total_payout_ht NUMERIC(10,2);
  v_total_payout_ttc NUMERIC(10,2);
  v_tax_rate NUMERIC(5,4);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  IF NEW.channel_id != v_linkme_channel_id THEN RETURN NEW; END IF;

  -- Commande revenue en brouillon ou annulee : on retire la commission, MAIS
  -- jamais une commission deja 'requested' (dans une demande) ou 'paid' (versee).
  -- Les statuts de progression (partially_shipped, shipped, delivered) ne
  -- suppriment jamais la commission : la vente est reelle.
  IF NEW.status IN ('draft', 'cancelled') THEN
    DELETE FROM linkme_commissions
    WHERE order_id = NEW.id
      AND status IN ('pending', 'validated');
    RETURN NEW;
  END IF;

  SELECT DISTINCT ls.affiliate_id, ls.id
  INTO v_affiliate_id, v_selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsei ON lsei.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsei.selection_id
  WHERE soi.sales_order_id = NEW.id LIMIT 1;

  IF v_affiliate_id IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = NEW.id AND p.created_by_affiliate IS NULL;

  SELECT COALESCE(SUM(
    CASE WHEN p.affiliate_commission_rate IS NOT NULL AND p.affiliate_commission_rate > 0
      THEN soi.unit_price_ht * soi.quantity * p.affiliate_commission_rate / 100
      ELSE 0 END
  ), 0)
  INTO v_linkme_commission
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = NEW.id;

  SELECT COALESCE(SUM(soi.unit_price_ht * soi.quantity), 0)
  INTO v_affiliate_products_ca
  FROM sales_order_items soi
  JOIN products p ON p.id = soi.product_id
  WHERE soi.sales_order_id = NEW.id AND p.created_by_affiliate IS NOT NULL;

  SELECT COALESCE(la.tva_rate, 0.2) INTO v_tax_rate
  FROM linkme_affiliates la WHERE la.id = v_affiliate_id;
  IF v_tax_rate IS NULL THEN v_tax_rate := 0.2; END IF;
  IF v_tax_rate > 1 THEN v_tax_rate := v_tax_rate / 100; END IF;

  v_total_payout_ht := v_total_commission + (v_affiliate_products_ca - v_linkme_commission);
  v_total_payout_ttc := ROUND(v_total_payout_ht * (1 + v_tax_rate), 2);

  INSERT INTO linkme_commissions (
    affiliate_id, selection_id, order_id, order_number,
    order_amount_ht, affiliate_commission, affiliate_commission_ttc,
    linkme_commission, margin_rate_applied, linkme_rate_applied,
    tax_rate, total_payout_ht, total_payout_ttc,
    status, created_at, updated_at
  ) VALUES (
    v_affiliate_id, v_selection_id, NEW.id, NEW.order_number,
    NEW.total_ht, v_total_commission, ROUND(v_total_commission * (1 + v_tax_rate), 2),
    ROUND(v_linkme_commission, 2),
    ROUND(v_total_commission / NULLIF(NEW.total_ht, 0), 4),
    ROUND(v_linkme_commission / NULLIF(NEW.total_ht, 0), 4),
    v_tax_rate, v_total_payout_ht, v_total_payout_ttc,
    CASE WHEN NEW.payment_status_v2 = 'paid' THEN 'validated' ELSE 'pending' END,
    NOW(), NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    order_amount_ht = EXCLUDED.order_amount_ht,
    affiliate_commission = EXCLUDED.affiliate_commission,
    affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
    linkme_commission = EXCLUDED.linkme_commission,
    margin_rate_applied = EXCLUDED.margin_rate_applied,
    linkme_rate_applied = EXCLUDED.linkme_rate_applied,
    tax_rate = EXCLUDED.tax_rate,
    total_payout_ht = EXCLUDED.total_payout_ht,
    total_payout_ttc = EXCLUDED.total_payout_ttc,
    -- Le statut n'est recalcule que pending<->validated. Une commission deja
    -- 'requested' (dans une demande), 'paid' (versee) ou 'cancelled' est preservee.
    status = CASE
      WHEN linkme_commissions.status IN ('requested', 'paid', 'cancelled')
        THEN linkme_commissions.status
      ELSE EXCLUDED.status
    END,
    updated_at = NOW();

  RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 3. mark_commission_requested_on_item_insert
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_commission_requested_on_item_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
    FROM linkme_commissions WHERE id = NEW.commission_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Commission % introuvable : impossible de l''attacher a une demande de paiement.', NEW.commission_id
      USING ERRCODE = 'foreign_key_violation';
  END IF;

  IF v_status <> 'validated' THEN
    RAISE EXCEPTION 'Commission % non eligible (statut "%") : seules les commissions validees (commande payee) peuvent etre incluses dans une demande de paiement.', NEW.commission_id, v_status
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE linkme_commissions
    SET status = 'requested', payment_request_id = NEW.payment_request_id
    WHERE id = NEW.commission_id;

  RETURN NEW;
END;
$function$;

COMMIT;
