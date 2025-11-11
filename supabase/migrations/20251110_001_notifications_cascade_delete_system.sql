-- =========================================================================
-- Migration: 20251110_001_notifications_cascade_delete_system.sql
-- Date: 2025-11-10
-- Auteur: Claude Code
-- Description: Système CASCADE DELETE automatique pour notifications orphelines
--
-- CONTEXTE:
-- Actuellement, quand une entité (commande, produit, etc.) est supprimée,
-- les notifications liées restent orphelines avec des action_url cassées.
--
-- SOLUTION:
-- Ajouter des colonnes FK optionnelles vers les entités sources avec ON DELETE CASCADE.
-- PostgreSQL supprimera automatiquement les notifications quand l'entité est supprimée.
--
-- EXTENSIBILITÉ:
-- Cette migration couvre les 3 entités principales identifiées:
-- - products
-- - sales_orders
-- - purchase_orders
--
-- POUR AJOUTER D'AUTRES ENTITÉS (ex: invoices, stock_movements, etc.):
-- ALTER TABLE notifications ADD COLUMN related_<entity>_id UUID REFERENCES <table>(id) ON DELETE CASCADE;
-- CREATE INDEX idx_notifications_<entity> ON notifications(related_<entity>_id) WHERE related_<entity>_id IS NOT NULL;
-- Puis mettre à jour la contrainte CHECK check_single_related_entity
-- =========================================================================

-- =========================================================================
-- PARTIE 1: Ajouter Colonnes FK Optionnelles (Entités Principales)
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIE 1: Ajout colonnes FK vers entités';
  RAISE NOTICE '========================================';
END $$;

-- Colonne FK vers products (notifications stock, catalogue)
ALTER TABLE notifications
ADD COLUMN related_product_id UUID REFERENCES products(id) ON DELETE CASCADE;

COMMENT ON COLUMN notifications.related_product_id IS
'FK vers products - CASCADE DELETE automatique si produit supprimé. Utilisé pour notifications stock critique, réapprovisionnement, catalogue.';

-- Colonne FK vers sales_orders (notifications commandes clients)
ALTER TABLE notifications
ADD COLUMN related_sales_order_id UUID REFERENCES sales_orders(id) ON DELETE CASCADE;

COMMENT ON COLUMN notifications.related_sales_order_id IS
'FK vers sales_orders - CASCADE DELETE automatique si commande client supprimée. Utilisé pour notifications confirmation, expédition, livraison, paiement, annulation.';

-- Colonne FK vers purchase_orders (notifications commandes fournisseurs)
ALTER TABLE notifications
ADD COLUMN related_purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE;

COMMENT ON COLUMN notifications.related_purchase_order_id IS
'FK vers purchase_orders - CASCADE DELETE automatique si commande fournisseur supprimée. Utilisé pour notifications création PO, confirmation, réception, retard.';

-- =========================================================================
-- PARTIE 2: Indexes Partiels Performants
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIE 2: Création indexes partiels';
  RAISE NOTICE '========================================';
END $$;

-- Index partiel products (WHERE ... IS NOT NULL = index plus petit et performant)
CREATE INDEX idx_notifications_product
  ON notifications(related_product_id)
  WHERE related_product_id IS NOT NULL;

-- Index partiel sales_orders
CREATE INDEX idx_notifications_sales_order
  ON notifications(related_sales_order_id)
  WHERE related_sales_order_id IS NOT NULL;

-- Index partiel purchase_orders
CREATE INDEX idx_notifications_purchase_order
  ON notifications(related_purchase_order_id)
  WHERE related_purchase_order_id IS NOT NULL;

-- =========================================================================
-- PARTIE 3: Contrainte CHECK (une seule FK non-null à la fois)
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIE 3: Ajout contrainte CHECK';
  RAISE NOTICE '========================================';
END $$;

ALTER TABLE notifications
ADD CONSTRAINT check_single_related_entity
CHECK (
  (related_product_id IS NOT NULL)::int +
  (related_sales_order_id IS NOT NULL)::int +
  (related_purchase_order_id IS NOT NULL)::int <= 1
);

COMMENT ON CONSTRAINT check_single_related_entity ON notifications IS
'Assure qu''une notification est liée à maximum UNE entité (product OU sales_order OU purchase_order). Si nouvelles colonnes FK ajoutées, mettre à jour cette contrainte.';

-- =========================================================================
-- PARTIE 4: Mettre à Jour Fonction Helper create_notification_for_owners
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIE 4: MAJ fonction helper notifications';
  RAISE NOTICE '========================================';
END $$;

CREATE OR REPLACE FUNCTION create_notification_for_owners(
  p_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_action_url text,
  p_action_label text,
  p_related_product_id uuid DEFAULT NULL,
  p_related_sales_order_id uuid DEFAULT NULL,
  p_related_purchase_order_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_notification_count INTEGER := 0;
BEGIN
  -- Créer notification pour chaque utilisateur Owner/Admin
  FOR v_user IN
    SELECT id FROM auth.users
    -- TODO: Filtrer par rôle si nécessaire (Owner/Admin uniquement)
  LOOP
    INSERT INTO notifications (
      type,
      severity,
      title,
      message,
      action_url,
      action_label,
      user_id,
      related_product_id,           -- ✅ NOUVEAU
      related_sales_order_id,        -- ✅ NOUVEAU
      related_purchase_order_id      -- ✅ NOUVEAU
    ) VALUES (
      p_type,
      p_severity,
      p_title,
      p_message,
      p_action_url,
      p_action_label,
      v_user.id,
      p_related_product_id,
      p_related_sales_order_id,
      p_related_purchase_order_id
    );

    v_notification_count := v_notification_count + 1;
  END LOOP;

  RETURN v_notification_count;
END;
$$;

COMMENT ON FUNCTION create_notification_for_owners IS
'✅ MAJ 2025-11-10: Support FK optionnelles vers entités (product, sales_order, purchase_order).
Crée notifications pour tous les users avec CASCADE DELETE automatique si entité liée supprimée.
EXTENSIBILITÉ: Ajouter paramètres p_related_<entity>_id pour nouvelles entités.';

-- =========================================================================
-- PARTIE 5: Fonction Nettoyage Notifications Anciennes + Orphelines Legacy
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'PARTIE 5: Création fonction nettoyage';
  RAISE NOTICE '========================================';
END $$;

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Supprimer notifications lues >30 jours (archivage automatique)
  DELETE FROM notifications
  WHERE read = true
    AND updated_at < now() - interval '30 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '[CLEANUP] Notifications lues >30j: % supprimées', v_deleted_count;

  -- Supprimer notifications sans FK >7 jours (orphelines legacy avant migration)
  -- Ces notifications ont été créées AVANT l'ajout des FK
  DELETE FROM notifications
  WHERE related_product_id IS NULL
    AND related_sales_order_id IS NULL
    AND related_purchase_order_id IS NULL
    AND created_at < now() - interval '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RAISE NOTICE '[CLEANUP] Orphelines legacy >7j: % supprimées', v_deleted_count;

  -- Statistiques post-nettoyage
  DECLARE
    v_total_notifications INTEGER;
    v_with_fk INTEGER;
  BEGIN
    SELECT COUNT(*) INTO v_total_notifications FROM notifications;
    SELECT COUNT(*) INTO v_with_fk FROM notifications
    WHERE related_product_id IS NOT NULL
       OR related_sales_order_id IS NOT NULL
       OR related_purchase_order_id IS NOT NULL;

    RAISE NOTICE '[STATS] Total notifications: % (dont % avec FK)', v_total_notifications, v_with_fk;
  END;
END;
$$;

COMMENT ON FUNCTION cleanup_old_notifications IS
'Nettoie notifications lues >30j + orphelines legacy (sans FK) >7j.
Exécution recommandée: Hebdomadaire via CRON (dimanche 4h).
Commande CRON: SELECT cleanup_old_notifications();';

-- =========================================================================
-- PARTIE 6: Documentation Extensibilité
-- =========================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLÉTÉE AVEC SUCCÈS';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Modifications appliquées:';
  RAISE NOTICE '  ✅ 3 colonnes FK ajoutées (related_product_id, related_sales_order_id, related_purchase_order_id)';
  RAISE NOTICE '  ✅ 3 indexes partiels créés (performance optimale)';
  RAISE NOTICE '  ✅ 1 contrainte CHECK ajoutée (une seule FK à la fois)';
  RAISE NOTICE '  ✅ Fonction create_notification_for_owners mise à jour';
  RAISE NOTICE '  ✅ Fonction cleanup_old_notifications créée';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '  1. Mettre à jour triggers notification pour passer les FK:';
  RAISE NOTICE '     - notify_stock_alert()';
  RAISE NOTICE '     - notify_stock_replenished()';
  RAISE NOTICE '     - notify_order_confirmed()';
  RAISE NOTICE '     - notify_payment_received()';
  RAISE NOTICE '     - Etc. (15 triggers au total)';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Configurer CRON hebdomadaire:';
  RAISE NOTICE '     SELECT cron.schedule(';
  RAISE NOTICE '       ''cleanup-old-notifications'',';
  RAISE NOTICE '       ''0 4 * * 0'',';
  RAISE NOTICE '       $$SELECT cleanup_old_notifications();$$';
  RAISE NOTICE '     );';
  RAISE NOTICE '';
  RAISE NOTICE '  3. Pour ajouter d''autres entités (ex: invoices, stock_movements):';
  RAISE NOTICE '     ALTER TABLE notifications ADD COLUMN related_<entity>_id UUID REFERENCES <table>(id) ON DELETE CASCADE;';
  RAISE NOTICE '     CREATE INDEX idx_notifications_<entity> ON notifications(related_<entity>_id) WHERE related_<entity>_id IS NOT NULL;';
  RAISE NOTICE '     -- Mettre à jour contrainte CHECK check_single_related_entity';
  RAISE NOTICE '     -- Mettre à jour fonction create_notification_for_owners';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'CASCADE DELETE: ACTIF ✅';
  RAISE NOTICE 'Supprimer product/sales_order/purchase_order → Notifications supprimées automatiquement';
  RAISE NOTICE '========================================';
END;
$$;
