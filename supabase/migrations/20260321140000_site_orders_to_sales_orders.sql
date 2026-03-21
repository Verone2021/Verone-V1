-- Migration: Enable site_orders integration into sales_orders
-- Phase 1: Add Stripe-specific columns to sales_orders
-- Phase 2: Fix cancellation trigger for site internet orders
-- Phase 3: Migrate existing site_orders data

-- ============================================================
-- PHASE 1: Add Stripe columns to sales_orders
-- ============================================================

ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE sales_orders ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT;

-- ============================================================
-- PHASE 2: Fix cancellation trigger for site internet orders
-- A site internet order (validated + paid) can be cancelled (with Stripe refund)
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_so_direct_cancellation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
BEGIN
  -- Site internet orders can be cancelled from validated (paid orders get refunded via Stripe)
  IF NEW.channel_id = v_site_internet_channel_id THEN
    -- Only block cancellation of shipped/delivered orders
    IF OLD.status IN ('shipped', 'delivered') AND NEW.status = 'cancelled' THEN
      RAISE EXCEPTION 'Impossible d''annuler une commande site internet deja expediee ou livree.';
    END IF;
    RETURN NEW;
  END IF;

  -- Original logic for non-site-internet orders
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande client validee. Veuillez d''abord la devalider (remettre en brouillon).';
  END IF;

  IF OLD.status = 'partially_shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande partiellement expediee.';
  END IF;

  IF OLD.status = 'shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande expediee.';
  END IF;

  IF OLD.status = 'delivered' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande livree.';
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- PHASE 3: Add notification trigger for site internet orders in sales_orders
-- ============================================================

CREATE OR REPLACE FUNCTION notify_backoffice_on_site_sales_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_internet_channel_id UUID := '0c2639e9-df80-41fa-84d0-9da96a128f7f';
  v_customer_name TEXT;
BEGIN
  -- Only for site internet orders
  IF NEW.channel_id != v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  -- Only when status changes to validated (= paid)
  IF NEW.status = 'validated' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'validated') THEN
    -- Get customer name
    SELECT COALESCE(ic.first_name || ' ' || ic.last_name, 'Client')
    INTO v_customer_name
    FROM individual_customers ic
    WHERE ic.id = NEW.individual_customer_id;

    INSERT INTO notifications (type, severity, title, message, action_url, action_label, user_id)
    SELECT
      'business',
      'important',
      'Nouvelle commande site internet',
      COALESCE(v_customer_name, 'Client') || ' — ' || NEW.total_ttc || ' EUR',
      '/canaux-vente/site-internet?tab=commandes',
      'Voir la commande',
      uar.user_id
    FROM user_app_roles uar
    WHERE uar.app = 'back-office'
      AND uar.is_active = true
      AND uar.role IN ('owner', 'admin');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_site_sales_order ON sales_orders;
CREATE TRIGGER trg_notify_site_sales_order
  AFTER INSERT OR UPDATE OF status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_backoffice_on_site_sales_order();
