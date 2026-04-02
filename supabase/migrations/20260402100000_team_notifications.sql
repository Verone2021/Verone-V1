-- ============================================================
-- Migration: Notifications d'equipe partagees
-- Probleme: chaque event cree 1 notification par user back-office (x3)
--   → 3999 notifications dont 2413 doublons
--   → Si Imane traite une notif, les autres ne le voient pas
-- Solution: user_id = NULL = notification d'equipe (read global)
--   → Les notifs LinkMe affilies restent per-user
-- ============================================================

-- 1. Rendre user_id nullable (equipe = NULL)
ALTER TABLE notifications ALTER COLUMN user_id DROP NOT NULL;

-- 2. Index pour les requetes equipe
CREATE INDEX IF NOT EXISTS idx_notifications_team
  ON notifications (created_at DESC)
  WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- ============================================================
-- 3. Refondre create_notification_for_owners → UNE seule notification
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_action_url TEXT DEFAULT NULL,
  p_action_label TEXT DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Deduplication: pas de doublon identique dans les 24h
  IF EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id IS NULL
      AND n.title = p_title
      AND n.message = p_message
      AND n.created_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN 0;
  END IF;

  -- UNE seule notification d'equipe
  INSERT INTO notifications (
    user_id, type, severity, title, message,
    action_url, action_label, read, created_at, updated_at
  ) VALUES (
    NULL, p_type, p_severity, p_title, p_message,
    p_action_url, p_action_label, false, NOW(), NOW()
  );

  RETURN 1;
END;
$$;

-- ============================================================
-- 4. notify_admin_affiliate_order → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_affiliate_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.pending_admin_validation = true THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    VALUES (
      NULL, 'business', 'important',
      'Nouvelle commande à valider',
      format('Commande %s en attente de validation', NEW.order_number),
      '/canaux-vente/linkme/approbations?tab=commandes'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating order notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. notify_admin_new_form_submission → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_new_form_submission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form_type RECORD;
  v_enriched_message TEXT;
BEGIN
  SELECT * INTO v_form_type
  FROM form_types
  WHERE code = NEW.form_type;

  v_enriched_message := format(
    '%s %s - %s | Email: %s | Tel: %s | Source: %s',
    NEW.first_name,
    NEW.last_name,
    COALESCE(NEW.company_name, 'Particulier'),
    NEW.email,
    COALESCE(NEW.phone, 'Non renseigne'),
    NEW.source
  );

  INSERT INTO notifications (user_id, type, severity, title, message, action_url)
  VALUES (
    NULL, 'business',
    CASE NEW.priority
      WHEN 'urgent' THEN 'urgent'
      WHEN 'high' THEN 'important'
      ELSE 'info'
    END,
    format('Nouveau: %s', v_form_type.label),
    v_enriched_message,
    '/prises-contact?id=' || NEW.id
  );

  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. notify_admin_organisation_approval → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_organisation_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.approval_status = 'pending_validation' THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    VALUES (
      NULL, 'business', 'important',
      'Nouvelle organisation à valider',
      'Organisation "' || COALESCE(NEW.trade_name, NEW.legal_name) || '" en attente de validation.',
      '/canaux-vente/linkme/approbations?tab=organisations'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organisation notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 7. notify_admin_product_approval → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_admin_product_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.affiliate_approval_status = 'pending_approval'
     AND (OLD.affiliate_approval_status IS DISTINCT FROM 'pending_approval') THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url)
    VALUES (
      NULL, 'business', 'important',
      'Nouveau produit à approuver',
      'Le produit "' || NEW.name || '" attend votre validation.',
      '/canaux-vente/linkme/approbations?tab=produits'
    );
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating product notification: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 8. notify_backoffice_on_site_sales_order → equipe
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
  IF NEW.channel_id != v_site_internet_channel_id THEN
    RETURN NEW;
  END IF;

  IF NEW.status = 'validated' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'validated') THEN
    SELECT COALESCE(ic.first_name || ' ' || ic.last_name, 'Client')
    INTO v_customer_name
    FROM individual_customers ic
    WHERE ic.id = NEW.individual_customer_id;

    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    VALUES (
      NULL, 'business', 'important',
      'Nouvelle commande site internet',
      COALESCE(v_customer_name, 'Client') || ' — ' || NEW.total_ttc || ' EUR',
      '/canaux-vente/site-internet?tab=commandes',
      'Voir la commande'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 9. notify_new_bank_transaction → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_new_bank_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_title TEXT;
  v_message TEXT;
  v_severity TEXT := 'info';
  v_action_url TEXT;
BEGIN
  IF NEW.side = 'credit' THEN
    v_title := 'Paiement entrant';
    v_message := format('+ %s E -- %s | %s',
      ROUND(NEW.amount::NUMERIC, 2)::TEXT,
      COALESCE(NEW.counterparty_name, NEW.label, 'Transaction'),
      TO_CHAR(COALESCE(NEW.settled_at, NEW.created_at), 'DD/MM/YYYY'));
  ELSE
    v_title := 'Paiement sortant';
    v_message := format('- %s E -- %s | %s',
      ROUND(NEW.amount::NUMERIC, 2)::TEXT,
      COALESCE(NEW.counterparty_name, NEW.label, 'Transaction'),
      TO_CHAR(COALESCE(NEW.settled_at, NEW.created_at), 'DD/MM/YYYY'));
  END IF;

  IF NEW.matching_status IN ('auto_matched', 'manual_matched') THEN
    v_message := v_message || ' | Rapproche';
  ELSE
    v_message := v_message || ' | Non rapproche';
  END IF;

  v_action_url := '/finance/transactions?transaction=' || NEW.id::TEXT;

  -- Deduplication equipe
  IF NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id IS NULL AND n.title = v_title AND n.message = v_message
  ) THEN
    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    VALUES (NULL, 'business', v_severity, v_title, v_message, v_action_url, 'Voir transaction');
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 10. notify_linkme_info_request_completed → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_linkme_info_request_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  IF NEW.completed_at IS NOT NULL
     AND OLD.completed_at IS DISTINCT FROM NEW.completed_at THEN

    SELECT order_number INTO v_order_number
    FROM sales_orders
    WHERE id = NEW.sales_order_id;

    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    VALUES (
      NULL, 'business', 'important',
      'Infos complétées par le contact',
      format('%s a complété les informations pour la commande %s',
             COALESCE(NEW.completed_by_email, 'Contact'),
             COALESCE(v_order_number, 'N/A')),
      format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
      'Voir commande'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_info_request_completed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 11. notify_linkme_info_request_sent → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_linkme_info_request_sent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  SELECT order_number INTO v_order_number
  FROM sales_orders
  WHERE id = NEW.sales_order_id;

  INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
  VALUES (
    NULL, 'business', 'info',
    'Demande d''infos envoyée',
    format('Demande envoyée à %s pour la commande %s',
           COALESCE(NEW.recipient_name, NEW.recipient_email),
           COALESCE(v_order_number, 'N/A')),
    format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
    'Voir commande'
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_info_request_sent: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 12. notify_linkme_step4_completed → equipe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_linkme_step4_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_number TEXT;
BEGIN
  IF NEW.step4_completed_at IS NOT NULL
     AND OLD.step4_completed_at IS DISTINCT FROM NEW.step4_completed_at THEN

    SELECT order_number INTO v_order_number
    FROM sales_orders
    WHERE id = NEW.sales_order_id;

    INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label)
    VALUES (
      NULL, 'business', 'info',
      'Informations de livraison fournies',
      format('Les informations de livraison ont été fournies pour la commande %s',
             COALESCE(v_order_number, 'N/A')),
      format('/canaux-vente/linkme/commandes/%s', NEW.sales_order_id),
      'Voir commande'
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in notify_linkme_step4_completed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 13. notify_billing_contact_change → equipe BO + per-user LinkMe
-- ============================================================
CREATE OR REPLACE FUNCTION notify_billing_contact_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_name TEXT;
  v_org_name TEXT;
  v_org_id UUID;
  v_enseigne_id UUID;
  v_change_type TEXT;
  v_message TEXT;
  v_linkme_user UUID;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_billing_contact = true THEN
    v_change_type := 'nouveau';
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_billing_contact = false AND NEW.is_billing_contact = true THEN
      v_change_type := 'ajoute';
    ELSIF OLD.is_billing_contact = true AND NEW.is_billing_contact = false THEN
      v_change_type := 'retire';
    ELSIF NEW.is_billing_contact = true AND OLD.email != NEW.email THEN
      v_change_type := 'email_modifie';
    ELSIF NEW.is_billing_contact = true AND (OLD.first_name != NEW.first_name OR OLD.last_name != NEW.last_name) THEN
      v_change_type := 'nom_modifie';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_contact_name := COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '');
  v_org_id := NEW.organisation_id;
  v_enseigne_id := NEW.enseigne_id;

  IF v_org_id IS NOT NULL THEN
    SELECT COALESCE(trade_name, legal_name) INTO v_org_name FROM organisations WHERE id = v_org_id;
  ELSIF v_enseigne_id IS NOT NULL THEN
    SELECT name INTO v_org_name FROM enseignes WHERE id = v_enseigne_id;
  ELSE
    v_org_name := 'Organisation inconnue';
  END IF;

  CASE v_change_type
    WHEN 'nouveau' THEN
      v_message := 'Nouveau contact facturation: ' || v_contact_name || ' pour ' || v_org_name;
    WHEN 'ajoute' THEN
      v_message := v_contact_name || ' est maintenant contact facturation pour ' || v_org_name;
    WHEN 'retire' THEN
      v_message := v_contact_name || ' nest plus contact facturation pour ' || v_org_name;
    WHEN 'email_modifie' THEN
      v_message := 'Email du contact facturation modifie: ' || OLD.email || ' vers ' || NEW.email || ' (' || v_org_name || ')';
    WHEN 'nom_modifie' THEN
      v_message := 'Nom du contact facturation modifie: ' || OLD.first_name || ' ' || OLD.last_name || ' vers ' || v_contact_name || ' (' || v_org_name || ')';
    ELSE
      v_message := 'Changement contact facturation pour ' || v_org_name;
  END CASE;

  -- UNE notification d'equipe pour le back-office
  INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label, read, created_at)
  VALUES (NULL, 'business',
    CASE WHEN v_change_type IN ('email_modifie', 'retire') THEN 'important' ELSE 'info' END,
    'Contact facturation modifie', v_message,
    CASE WHEN v_org_id IS NOT NULL THEN '/contacts-organisations?id=' || v_org_id ELSE '/contacts-organisations' END,
    'Voir le contact', false, NOW());

  -- Notifications per-user pour les affilies LinkMe concernes
  IF v_enseigne_id IS NOT NULL THEN
    FOR v_linkme_user IN
      SELECT la.user_id
      FROM linkme_affiliates la
      WHERE la.enseigne_id = v_enseigne_id
        AND la.status = 'active'
        AND la.user_id IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, type, severity, title, message, action_url, action_label, read, created_at)
      VALUES (v_linkme_user, 'business',
        CASE WHEN v_change_type IN ('email_modifie', 'retire') THEN 'important' ELSE 'info' END,
        'Contact facturation modifie', v_message,
        CASE WHEN v_org_id IS NOT NULL THEN '/contacts-organisations?id=' || v_org_id ELSE '/contacts-organisations' END,
        'Voir le contact', false, NOW());
    END LOOP;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erreur notification contact facturation: %', SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- ============================================================
-- 14. Mettre a jour la RLS pour inclure les notifs d'equipe
-- ============================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "staff_full_access" ON notifications;

-- Nouvelles policies: equipe (user_id IS NULL) visible par tout le staff
CREATE POLICY "staff_view_team_and_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR user_id IS NULL
  );

CREATE POLICY "staff_update_team_and_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (user_id IS NULL AND is_backoffice_user())
  );

CREATE POLICY "staff_delete_notifications" ON notifications
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (user_id IS NULL AND is_backoffice_user())
  );

-- Insert: seul le systeme (triggers SECURITY DEFINER) insere
-- Pas de policy INSERT necessaire car les triggers sont SECURITY DEFINER
