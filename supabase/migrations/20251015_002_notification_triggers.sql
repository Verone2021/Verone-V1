-- =====================================================
-- Migration: Notification Triggers - Vérone
-- Date: 2025-10-15
-- Description: Système de notifications persistantes avec
--              triggers automatiques pour alertes critiques
-- =====================================================

-- Table: dashboard_notifications
-- Stocke les notifications persistantes pour le dashboard
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  -- Identifiants
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  organisation_id uuid REFERENCES organisations(id) ON DELETE CASCADE,

  -- Notification data
  type text NOT NULL CHECK (type IN ('stock', 'order', 'system', 'activity')),
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  title text NOT NULL,
  message text NOT NULL,

  -- Action
  action_url text,
  action_label text,

  -- État
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,

  -- Référence source (pour éviter doublons)
  source_table text,
  source_id text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  dismissed_at timestamptz
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_notifications_user_unread
  ON dashboard_notifications(user_id, created_at DESC)
  WHERE is_read = false AND is_dismissed = false;

CREATE INDEX idx_notifications_organisation
  ON dashboard_notifications(organisation_id, created_at DESC);

CREATE INDEX idx_notifications_source
  ON dashboard_notifications(source_table, source_id)
  WHERE source_table IS NOT NULL;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE dashboard_notifications ENABLE ROW LEVEL SECURITY;

-- Users voient leurs propres notifications
CREATE POLICY "users_view_own_notifications" ON dashboard_notifications
  FOR SELECT USING (user_id = auth.uid());

-- Users peuvent marquer comme lu/dismissed
CREATE POLICY "users_update_own_notifications" ON dashboard_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Service role peut créer notifications
CREATE POLICY "service_create_notifications" ON dashboard_notifications
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- TRIGGER: Alert stock critique automatique
-- =====================================================
CREATE OR REPLACE FUNCTION create_stock_alert_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Alert si stock < 5 et pas déjà de notification active
  IF NEW.stock_real < 5 AND NOT EXISTS (
    SELECT 1 FROM dashboard_notifications
    WHERE source_table = 'products'
      AND source_id = NEW.id::text
      AND type = 'stock'
      AND is_dismissed = false
      AND created_at > now() - interval '24 hours'
  ) THEN
    -- Récupérer l'organisation et un admin/owner
    SELECT organisation_id INTO v_org_id FROM products WHERE id = NEW.id;

    SELECT user_id INTO v_user_id
    FROM user_profiles
    WHERE organisation_id = v_org_id
      AND role IN ('owner', 'admin')
    LIMIT 1;

    IF v_user_id IS NOT NULL THEN
      INSERT INTO dashboard_notifications (
        user_id,
        organisation_id,
        type,
        severity,
        title,
        message,
        action_url,
        action_label,
        source_table,
        source_id
      ) VALUES (
        v_user_id,
        v_org_id,
        'stock',
        CASE WHEN NEW.stock_real < 3 THEN 'critical' ELSE 'warning' END,
        'Stock critique',
        format('%s - Il ne reste que %s unités en stock', NEW.name, NEW.stock_real),
        format('/stocks?search=%s', NEW.sku),
        'Voir le produit',
        'products',
        NEW.id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_stock_alert_notification
  AFTER UPDATE ON products
  FOR EACH ROW
  WHEN (NEW.stock_real < 5 AND OLD.stock_real >= 5)
  EXECUTE FUNCTION create_stock_alert_notification();

-- =====================================================
-- TRIGGER: Alert commande urgente (>3 jours draft)
-- NOTE: Trigger désactivé temporairement car nécessite adaptation
--       pour sales_orders et purchase_orders séparément
-- TODO: Implémenter triggers séparés pour chaque type de commande
-- =====================================================
-- CREATE OR REPLACE FUNCTION create_urgent_order_notification()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   v_user_id uuid;
--   v_days_waiting int;
-- BEGIN
--   -- Calculer jours d'attente
--   v_days_waiting := EXTRACT(DAY FROM (now() - NEW.created_at));
--
--   -- Alert si > 3 jours et toujours draft
--   IF NEW.status = 'draft'
--      AND v_days_waiting > 3
--      AND NOT EXISTS (
--        SELECT 1 FROM dashboard_notifications
--        WHERE source_table IN ('sales_orders', 'purchase_orders')
--          AND source_id = NEW.id::text
--          AND type = 'order'
--          AND is_dismissed = false
--          AND created_at > now() - interval '24 hours'
--      ) THEN
--
--     -- Récupérer un admin/owner de l'organisation
--     SELECT user_id INTO v_user_id
--     FROM user_profiles
--     WHERE role IN ('owner', 'admin')
--     LIMIT 1;
--
--     IF v_user_id IS NOT NULL THEN
--       -- TODO: Implémenter logique notification
--       NULL;
--     END IF;
--   END IF;
--
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTION: Nettoyage notifications anciennes
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- Supprimer notifications lues > 30 jours
  DELETE FROM dashboard_notifications
  WHERE is_read = true
    AND read_at < now() - interval '30 days';

  -- Supprimer notifications dismissed > 7 jours
  DELETE FROM dashboard_notifications
  WHERE is_dismissed = true
    AND dismissed_at < now() - interval '7 days';

  RAISE NOTICE 'Nettoyage notifications anciennes effectué';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTAIRES DOCUMENTATION
-- =====================================================
COMMENT ON TABLE dashboard_notifications IS 'Notifications persistantes dashboard avec état read/dismissed';
COMMENT ON FUNCTION create_stock_alert_notification IS 'Trigger: Crée notification stock critique < 5 unités';
-- COMMENT ON FUNCTION create_urgent_order_notification IS 'Trigger: Crée notification commande pending > 3 jours';
COMMENT ON FUNCTION cleanup_old_notifications IS 'Fonction: Nettoie les notifications anciennes (lues >30j, dismissed >7j)';

-- =====================================================
-- VALIDATION MIGRATION
-- =====================================================
DO $$
BEGIN
  -- Vérifier table créée
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'dashboard_notifications') THEN
    RAISE EXCEPTION 'Table dashboard_notifications non créée';
  END IF;

  -- Vérifier triggers créés
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_stock_alert_notification'
  ) THEN
    RAISE EXCEPTION 'Trigger trigger_stock_alert_notification non créé';
  END IF;

  RAISE NOTICE '✅ Migration notification triggers completed successfully';
  RAISE NOTICE '📊 Table: dashboard_notifications';
  RAISE NOTICE '🔔 Triggers: stock_alert';
  RAISE NOTICE '⏸️ Trigger urgent_order désactivé (nécessite adaptation sales/purchase)';
  RAISE NOTICE '🧹 Fonction cleanup_old_notifications disponible';
END;
$$;
