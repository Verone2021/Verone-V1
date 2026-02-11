-- ============================================================================
-- Migration: Unify statuses (delivered→shipped) + Fix commission trigger
-- Date: 2026-02-11
-- Context: shipped = dernier statut actif (delivered réservé futur Packlink/Chronotruck)
--          Commission se déclenche à shipped (pas delivered)
--          Fix bug critique: payment_status (supprimé) → payment_status_v2
-- ============================================================================

BEGIN;

-- ============================================================================
-- ÉTAPE 1 : Recréer la fonction trigger commission (AVANT migration)
-- Fix: 'delivered' → 'shipped' + 'payment_status' → 'payment_status_v2'
-- ============================================================================

CREATE OR REPLACE FUNCTION create_linkme_commission_on_order_update()
RETURNS TRIGGER AS $$
DECLARE
  v_affiliate_id UUID;
  v_selection_id UUID;
  v_total_commission NUMERIC(10,2);
  v_linkme_channel_id UUID := '93c68db1-5a30-4168-89ec-6383152be405';
BEGIN
  -- Uniquement commandes LinkMe
  IF NEW.channel_id != v_linkme_channel_id THEN
    RETURN NEW;
  END IF;

  -- Figer la commission à 'shipped' (était 'delivered')
  IF NEW.status != 'shipped' THEN
    RETURN NEW;
  END IF;

  -- Trouver l'affilié et la sélection
  SELECT DISTINCT
    ls.affiliate_id,
    ls.id
  INTO v_affiliate_id, v_selection_id
  FROM sales_order_items soi
  JOIN linkme_selection_items lsei ON lsei.id = soi.linkme_selection_item_id
  JOIN linkme_selections ls ON ls.id = lsei.selection_id
  WHERE soi.sales_order_id = NEW.id
  LIMIT 1;

  IF v_affiliate_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Calculer commission totale
  SELECT COALESCE(SUM(soi.retrocession_amount), 0)
  INTO v_total_commission
  FROM sales_order_items soi
  WHERE soi.sales_order_id = NEW.id;

  -- UPSERT commission (idempotent)
  INSERT INTO linkme_commissions (
    affiliate_id,
    selection_id,
    order_id,
    order_number,
    order_amount_ht,
    affiliate_commission,
    affiliate_commission_ttc,
    linkme_commission,
    margin_rate_applied,
    linkme_rate_applied,
    tax_rate,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_affiliate_id,
    v_selection_id,
    NEW.id,
    NEW.order_number,
    NEW.total_ht,
    v_total_commission,
    ROUND(v_total_commission * 1.2, 2),
    ROUND(NEW.total_ht * 0.03, 2),
    0.12,
    0.03,
    0.2,
    -- Fix: payment_status_v2 au lieu de payment_status (colonne supprimée)
    CASE
      WHEN NEW.payment_status_v2 = 'paid' THEN 'validated'
      ELSE 'pending'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (order_id) DO UPDATE SET
    affiliate_commission = EXCLUDED.affiliate_commission,
    affiliate_commission_ttc = EXCLUDED.affiliate_commission_ttc,
    order_amount_ht = EXCLUDED.order_amount_ht,
    status = EXCLUDED.status,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 2 : Désactiver les 6 triggers de notification
-- Évite 99 notifications inutiles lors de la migration delivered→shipped
-- ============================================================================

ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_shipped_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_confirmed_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_order_cancelled_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_payment_received_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_delayed_notification;
ALTER TABLE sales_orders DISABLE TRIGGER trigger_so_partial_shipped_notification;

-- ============================================================================
-- ÉTAPE 3 : Migrer 99 commandes delivered → shipped
-- Le trigger trg_create_linkme_commission se déclenche (UPSERT idempotent)
-- ============================================================================

UPDATE sales_orders
SET status = 'shipped', updated_at = NOW()
WHERE status = 'delivered';

-- ============================================================================
-- ÉTAPE 4 : Réactiver les 6 triggers de notification
-- ============================================================================

ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_shipped_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_confirmed_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_order_cancelled_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_payment_received_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_delayed_notification;
ALTER TABLE sales_orders ENABLE TRIGGER trigger_so_partial_shipped_notification;

-- ============================================================================
-- ÉTAPE 5 : Mettre à jour prevent_so_direct_cancellation
-- Retirer le bloc delivered→cancelled (plus de commandes delivered)
-- ============================================================================

CREATE OR REPLACE FUNCTION prevent_so_direct_cancellation()
RETURNS TRIGGER AS $$
BEGIN
  -- Bloquer validated → cancelled (doit passer par draft d'abord)
  IF OLD.status = 'validated' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande client validée. Veuillez d''abord la dévalider (remettre en brouillon).';
  END IF;

  -- Bloquer partially_shipped → cancelled
  IF OLD.status = 'partially_shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande partiellement expédiée.';
  END IF;

  -- Bloquer shipped → cancelled (commande expédiée = statut final)
  IF OLD.status = 'shipped' AND NEW.status = 'cancelled' THEN
    RAISE EXCEPTION 'Impossible d''annuler une commande expédiée.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;
