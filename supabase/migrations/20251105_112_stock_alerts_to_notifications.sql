-- Migration 112: Notifications Automatiques pour Alertes Stock
-- Date: 2025-11-05
-- Contexte: Créer notifications dans UI quand alertes stock sont créées/modifiées
--
-- Objectifs:
-- 1. Nettoyer notifications existantes (test/dev)
-- 2. Créer trigger pour générer notifications automatiques depuis stock_alert_tracking
-- 3. Notifier tous les utilisateurs pour alertes critiques/warning
--
-- Références:
-- - Table notifications (type, severity, title, message, user_id)
-- - Table stock_alert_tracking (alert_type, alert_priority, product_id)
-- - Migration 111 : Alertes basées sur stock prévisionnel

-- =============================================================================
-- PARTIE 1: Nettoyer Notifications Existantes
-- =============================================================================

DO $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Supprimer toutes les notifications operations existantes
    DELETE FROM notifications WHERE type = 'operations';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RAISE NOTICE '✅ % notifications operations supprimées', v_deleted_count;
END $$;

-- =============================================================================
-- PARTIE 2: Créer Fonction Trigger Notification
-- =============================================================================

CREATE OR REPLACE FUNCTION create_notification_on_stock_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_product_name TEXT;
    v_product_sku TEXT;
    v_user RECORD;
    v_notifications_created INTEGER := 0;
BEGIN
    -- Récupérer infos produit
    SELECT name, sku INTO v_product_name, v_product_sku
    FROM products
    WHERE id = NEW.product_id;

    -- Créer notification pour CHAQUE utilisateur
    -- (Tous les utilisateurs doivent être notifiés des alertes stock critiques)
    FOR v_user IN SELECT id FROM auth.users
    LOOP
        INSERT INTO notifications (
            type,
            severity,
            title,
            message,
            action_url,
            action_label,
            user_id,
            read
        )
        VALUES (
            'operations',
            CASE
                WHEN NEW.alert_priority = 3 THEN 'urgent'
                WHEN NEW.alert_priority = 2 THEN 'important'
                ELSE 'info'
            END,
            CASE
                WHEN NEW.alert_type = 'out_of_stock' THEN 'Rupture de Stock'
                WHEN NEW.alert_type = 'low_stock' THEN 'Stock Faible'
                WHEN NEW.alert_type = 'no_stock_but_ordered' THEN 'Commandes Sans Stock'
                ELSE 'Alerte Stock'
            END,
            'Produit ' || v_product_name || ' (SKU: ' || v_product_sku || ') - Stock: ' ||
            NEW.stock_real || ', Seuil: ' || NEW.min_stock,
            '/stocks/alertes',
            'Voir Alertes Stock',
            v_user.id,
            false
        );

        v_notifications_created := v_notifications_created + 1;
    END LOOP;

    RAISE NOTICE '🔔 % notifications créées pour alerte %', v_notifications_created, NEW.alert_type;

    RETURN NEW;
END;
$$;

-- =============================================================================
-- PARTIE 3: Créer Triggers sur INSERT et UPDATE
-- =============================================================================

-- Trigger sur INSERT (nouvelle alerte créée)
DROP TRIGGER IF EXISTS trigger_create_notification_on_stock_alert_insert ON stock_alert_tracking;

CREATE TRIGGER trigger_create_notification_on_stock_alert_insert
    AFTER INSERT ON stock_alert_tracking
    FOR EACH ROW
    WHEN (NEW.validated = false AND NEW.alert_priority >= 2)
    EXECUTE FUNCTION create_notification_on_stock_alert();

COMMENT ON TRIGGER trigger_create_notification_on_stock_alert_insert ON stock_alert_tracking IS
'Trigger: Créer notifications pour TOUS les utilisateurs quand nouvelle alerte stock est créée.
Condition: Seulement alertes non validées (validated=false) avec priorité >= 2 (warning + critical).
Action: Insère notification dans table notifications pour chaque utilisateur.';

-- Trigger sur UPDATE (alerte modifiée - changement priorité)
DROP TRIGGER IF EXISTS trigger_create_notification_on_stock_alert_update ON stock_alert_tracking;

CREATE TRIGGER trigger_create_notification_on_stock_alert_update
    AFTER UPDATE OF alert_priority, stock_real, min_stock ON stock_alert_tracking
    FOR EACH ROW
    WHEN (
        NEW.validated = false
        AND NEW.alert_priority >= 2
        AND (
            OLD.alert_priority IS DISTINCT FROM NEW.alert_priority
            OR OLD.stock_real IS DISTINCT FROM NEW.stock_real
            OR OLD.min_stock IS DISTINCT FROM NEW.min_stock
        )
    )
    EXECUTE FUNCTION create_notification_on_stock_alert();

COMMENT ON TRIGGER trigger_create_notification_on_stock_alert_update ON stock_alert_tracking IS
'Trigger: Créer notification quand alerte stock change (priorité, stock réel, seuil minimum).
Condition: Changement significatif détecté (OLD IS DISTINCT FROM NEW).
Action: Notifie tous les utilisateurs du changement.';

-- =============================================================================
-- PARTIE 4: Vérification
-- =============================================================================

DO $$
DECLARE
    v_stock_alerts INTEGER;
    v_users_count INTEGER;
    v_notifications_count INTEGER;
BEGIN
    -- Compter alertes actuelles
    SELECT COUNT(*) INTO v_stock_alerts
    FROM stock_alert_tracking
    WHERE validated = false;

    -- Compter utilisateurs
    SELECT COUNT(*) INTO v_users_count
    FROM auth.users;

    -- Compter notifications créées
    SELECT COUNT(*) INTO v_notifications_count
    FROM notifications
    WHERE type = 'operations';

    -- Résultats
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ VÉRIFICATION MIGRATION 112';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ÉTAT ACTUEL:';
    RAISE NOTICE '   - Alertes stock actives: %', v_stock_alerts;
    RAISE NOTICE '   - Utilisateurs système: %', v_users_count;
    RAISE NOTICE '   - Notifications operations: %', v_notifications_count;
    RAISE NOTICE '';
    RAISE NOTICE '🔔 TRIGGER CRÉÉ:';
    RAISE NOTICE '   - Nom: create_notification_on_stock_alert()';
    RAISE NOTICE '   - INSERT: Nouvelle alerte → Notification tous users';
    RAISE NOTICE '   - UPDATE: Changement priorité/stock → Notification';
    RAISE NOTICE '';
    RAISE NOTICE '📝 PROCHAINS STEPS:';
    RAISE NOTICE '   1. Modifier min_stock produit pour tester';
    RAISE NOTICE '   2. Vérifier notifications dans UI /notifications';
    RAISE NOTICE '   3. Valider que tous users reçoivent la notification';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;

-- =============================================================================
-- RÉSUMÉ MIGRATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ MIGRATION 112 COMPLÉTÉE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📋 ACTIONS EFFECTUÉES:';
    RAISE NOTICE '   1. ✅ Nettoyage notifications operations existantes';
    RAISE NOTICE '   2. ✅ Fonction create_notification_on_stock_alert() créée';
    RAISE NOTICE '   3. ✅ Trigger INSERT sur stock_alert_tracking';
    RAISE NOTICE '   4. ✅ Trigger UPDATE sur stock_alert_tracking';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 FONCTIONNALITÉ:';
    RAISE NOTICE '   - Nouvelle alerte stock → Notification automatique';
    RAISE NOTICE '   - Changement alerte → Mise à jour notification';
    RAISE NOTICE '   - Tous les utilisateurs notifiés (CROSS JOIN auth.users)';
    RAISE NOTICE '   - Seulement alertes priority >= 2 (warning + critical)';
    RAISE NOTICE '';
    RAISE NOTICE '📚 RÉFÉRENCES:';
    RAISE NOTICE '   - Migration 111: Alertes basées stock prévisionnel';
    RAISE NOTICE '   - Table notifications: type operations + severity urgent/important';
    RAISE NOTICE '   - UI: /notifications (affichage) + /stocks/alertes (action)';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
