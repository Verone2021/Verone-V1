-- =====================================================
-- Migration: payment_status_v2 pour purchase_orders
-- Date: 2026-01-05
-- Description: Ajoute un champ calculé automatiquement via trigger
--              basé sur le rapprochement bancaire (transaction_document_links)
-- =====================================================

-- 1. Ajouter la colonne payment_status_v2 sur purchase_orders
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS payment_status_v2 VARCHAR(50) DEFAULT 'pending';

-- 2. Créer la fonction qui met à jour payment_status_v2
CREATE OR REPLACE FUNCTION update_purchase_order_payment_status_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_is_matched BOOLEAN;
BEGIN
  -- Déterminer l'order_id concerné
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.purchase_order_id;
  ELSE
    v_order_id := NEW.purchase_order_id;
  END IF;

  -- Ne rien faire si pas de purchase_order_id (peut être un lien document ou sales_order)
  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Vérifier si un rapprochement existe pour cette commande
  SELECT EXISTS (
    SELECT 1 FROM transaction_document_links
    WHERE purchase_order_id = v_order_id
    AND link_type = 'purchase_order'
  ) INTO v_is_matched;

  -- Mettre à jour le payment_status_v2
  UPDATE purchase_orders
  SET payment_status_v2 = CASE WHEN v_is_matched THEN 'paid' ELSE 'pending' END,
      updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger sur transaction_document_links
DROP TRIGGER IF EXISTS trg_update_purchase_order_payment_status_v2 ON transaction_document_links;

CREATE TRIGGER trg_update_purchase_order_payment_status_v2
  AFTER INSERT OR UPDATE OR DELETE ON transaction_document_links
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_order_payment_status_v2();

-- 4. Initialiser les valeurs existantes (migration des données)
UPDATE purchase_orders po
SET payment_status_v2 = CASE
  WHEN EXISTS (
    SELECT 1 FROM transaction_document_links tdl
    WHERE tdl.purchase_order_id = po.id
    AND tdl.link_type = 'purchase_order'
  ) THEN 'paid'
  ELSE 'pending'
END
WHERE payment_status_v2 IS NULL OR payment_status_v2 = 'pending';

-- 5. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN purchase_orders.payment_status_v2 IS
  'Statut de paiement v2 calculé automatiquement via rapprochement bancaire. paid = lié à une transaction, pending = non lié.';

-- 6. Créer un index pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_purchase_orders_payment_status_v2
ON purchase_orders(payment_status_v2);
