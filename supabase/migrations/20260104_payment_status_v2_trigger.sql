-- =====================================================
-- Migration: payment_status_v2 pour sales_orders
-- Date: 2026-01-04
-- Description: Ajoute un champ calculé automatiquement via trigger
--              basé sur le rapprochement bancaire (transaction_document_links)
-- =====================================================

-- 1. Ajouter la colonne payment_status_v2 sur sales_orders
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS payment_status_v2 VARCHAR(50) DEFAULT 'pending';

-- 2. Créer la fonction qui met à jour payment_status_v2
CREATE OR REPLACE FUNCTION update_sales_order_payment_status_v2()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
  v_is_matched BOOLEAN;
BEGIN
  -- Déterminer l'order_id concerné
  IF TG_OP = 'DELETE' THEN
    v_order_id := OLD.sales_order_id;
  ELSE
    v_order_id := NEW.sales_order_id;
  END IF;

  -- Ne rien faire si pas de sales_order_id (peut être un lien document ou purchase_order)
  IF v_order_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Vérifier si un rapprochement existe pour cette commande
  SELECT EXISTS (
    SELECT 1 FROM transaction_document_links
    WHERE sales_order_id = v_order_id
    AND link_type = 'sales_order'
  ) INTO v_is_matched;

  -- Mettre à jour le payment_status_v2
  UPDATE sales_orders
  SET payment_status_v2 = CASE WHEN v_is_matched THEN 'paid' ELSE 'pending' END,
      updated_at = NOW()
  WHERE id = v_order_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. Créer le trigger sur transaction_document_links
DROP TRIGGER IF EXISTS trg_update_sales_order_payment_status_v2 ON transaction_document_links;

CREATE TRIGGER trg_update_sales_order_payment_status_v2
  AFTER INSERT OR UPDATE OR DELETE ON transaction_document_links
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_order_payment_status_v2();

-- 4. Initialiser les valeurs existantes (migration des données)
UPDATE sales_orders so
SET payment_status_v2 = CASE
  WHEN EXISTS (
    SELECT 1 FROM transaction_document_links tdl
    WHERE tdl.sales_order_id = so.id
    AND tdl.link_type = 'sales_order'
  ) THEN 'paid'
  ELSE 'pending'
END
WHERE payment_status_v2 IS NULL OR payment_status_v2 = 'pending';

-- 5. Ajouter un commentaire sur la colonne
COMMENT ON COLUMN sales_orders.payment_status_v2 IS
  'Statut de paiement v2 calculé automatiquement via rapprochement bancaire. paid = lié à une transaction, pending = non lié.';

-- 6. Créer un index pour les requêtes de filtrage
CREATE INDEX IF NOT EXISTS idx_sales_orders_payment_status_v2
ON sales_orders(payment_status_v2);
