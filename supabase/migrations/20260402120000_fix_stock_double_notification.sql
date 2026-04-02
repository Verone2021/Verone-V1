-- Migration: Fix stock double notification + URL + dedup
-- Date: 2026-04-02
-- Ticket: BO-STK-001
-- Objectif:
--   1. Desactiver trigger notify_stock_negative_forecast (doublon avec create_notification_on_stock_alert)
--   2. Corriger URL action_url /stocks/inventaire → /stocks/alertes
--   3. Ameliorer dedup dans create_notification_for_owners (cle product_id + alert_type)
--
-- GARANTIE: Ne touche PAS a stock_alerts_unified_view, sync_stock_alert_tracking_v4,
--           ni aucun trigger PO/SO/reception/expedition. Identique au 8 dec 2025.

-- ============================================================================
-- 1. DESACTIVER le trigger doublon sur products
--    Ce trigger cree une 2eme notification (type=operations) en plus de celle
--    deja creee par create_notification_on_stock_alert (type=business).
--    On le desactive (pas DROP) pour pouvoir le reactiver si besoin.
-- ============================================================================

ALTER TABLE products DISABLE TRIGGER trigger_stock_negative_forecast_notification;

-- ============================================================================
-- 2. CORRIGER create_notification_on_stock_alert
--    - URL: /stocks/inventaire → /stocks/alertes (page dediee aux alertes)
--    - Pas d'autre changement de logique
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification_on_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_product_name TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_priority TEXT;
BEGIN
    SELECT name INTO v_product_name FROM products WHERE id = NEW.product_id;

    IF NEW.alert_type = 'low_stock' THEN
        v_notification_title := 'Stock faible';
        v_notification_message := 'Le produit ' || v_product_name ||
            ' a un stock faible (' || NEW.stock_real || ' unités, seuil min: ' || NEW.min_stock || ').';
        v_notification_priority := 'important';
    ELSIF NEW.alert_type = 'out_of_stock' THEN
        v_notification_title := 'Stock prévisionnel négatif';
        v_notification_message := 'Le produit ' || v_product_name ||
            ' a un stock prévisionnel négatif (' || NEW.shortage_quantity || ' unités manquantes).';
        v_notification_priority := 'urgent';
    ELSE
        RETURN NEW;
    END IF;

    IF NEW.validated = true THEN
        v_notification_message := v_notification_message || ' Commande fournisseur en cours de traitement.';
    ELSE
        v_notification_message := v_notification_message || ' Réapprovisionnement requis.';
    END IF;

    -- Créer notification pour tous les utilisateurs Owner
    -- URL corrigee: /stocks/alertes (pas /stocks/inventaire)
    PERFORM create_notification_for_owners(
        'business', v_notification_priority, v_notification_title,
        v_notification_message, '/stocks/alertes', 'Voir Alertes'
    );

    RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. AMELIORER la dedup dans create_notification_for_owners
--    Avant: dedup sur titre + message (bypasse car message change a chaque fluctuation)
--    Apres: dedup sur titre + nom produit (meme produit = bloque pendant 24h)
-- ============================================================================

DROP FUNCTION IF EXISTS create_notification_for_owners(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;

CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT,
  p_action_label TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_notification_count INTEGER := 0;
  v_product_name TEXT;
BEGIN
  -- Extraire le nom du produit du message pour dedup plus precise
  -- Le message commence toujours par "Le produit <nom>"
  v_product_name := substring(p_message FROM 'Le produit (.+?) a un');

  FOR v_user_id IN
    SELECT user_id
    FROM user_app_roles
    WHERE app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  LOOP
    -- Guard dedup : pas de notif si meme titre + meme produit pour meme user dans les 24h
    IF NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = v_user_id
        AND n.title = p_title
        AND (
          -- Dedup precise: meme produit dans le message
          (v_product_name IS NOT NULL AND n.message LIKE '%' || v_product_name || '%')
          -- Fallback: meme message exact (ancien comportement)
          OR (v_product_name IS NULL AND n.message = p_message)
        )
        AND n.created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO notifications (
        user_id, type, severity, title, message,
        action_url, action_label, read, created_at, updated_at
      ) VALUES (
        v_user_id, p_type, p_severity, p_title, p_message,
        p_action_url, p_action_label, false, NOW(), NOW()
      );
      v_notification_count := v_notification_count + 1;
    END IF;
  END LOOP;

  RETURN v_notification_count;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

-- Confirmer que le trigger doublon est desactive
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_stock_negative_forecast_notification'
      AND tgenabled = 'D'
  ) THEN
    RAISE NOTICE 'OK: trigger_stock_negative_forecast_notification desactive';
  ELSE
    RAISE EXCEPTION 'ERREUR: trigger_stock_negative_forecast_notification non desactive';
  END IF;
END $$;

-- Confirmer que les triggers critiques du 8 dec sont toujours actifs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_sync_stock_alert_tracking_v4'
      AND tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'ERREUR: trigger_sync_stock_alert_tracking_v4 manquant ou desactive!';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_create_notification_on_stock_alert_insert'
      AND tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'ERREUR: trigger_create_notification_on_stock_alert_insert manquant ou desactive!';
  END IF;

  RAISE NOTICE 'OK: tous les triggers critiques du 8 dec 2025 sont intacts';
END $$;
