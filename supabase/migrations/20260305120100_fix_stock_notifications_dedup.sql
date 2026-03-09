-- Migration: Fix stock notification triggers - dedup 24h
-- Date: 2026-03-05
-- Objectif: Ajouter deduplication aux triggers stock pour eviter doublons

-- ============================================================================
-- 1. Fix create_notification_for_owners : ajouter guard dedup 24h
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
BEGIN
  FOR v_user_id IN
    SELECT user_id
    FROM user_app_roles
    WHERE app = 'back-office'
      AND role IN ('owner', 'admin')
      AND is_active = true
  LOOP
    -- Guard dedup : pas de notif si meme titre+message pour meme user dans les 24h
    IF NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = v_user_id
        AND n.title = p_title
        AND n.message = p_message
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
-- 2. Fix create_notification_on_stock_alert : dedup via create_notification_for_owners
-- (La dedup est maintenant dans create_notification_for_owners, pas besoin de
-- modifier cette fonction car elle appelle deja create_notification_for_owners)
-- ============================================================================

-- Rien a changer sur create_notification_on_stock_alert ni notify_stock_negative_forecast
-- car ils utilisent tous les deux create_notification_for_owners qui a maintenant le guard dedup.

COMMENT ON FUNCTION create_notification_for_owners IS
  'Creates notifications for back-office owners/admins with 24h dedup guard to prevent duplicates';
