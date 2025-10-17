-- Migration: Créer trigger LPP (Last Purchase Price) auto-update
-- Date: 2025-10-17
-- Pattern: ERP standard (SAP, Dynamics 365)
-- Objectif: Auto-update products.cost_price depuis purchase_orders validés

-- 🎯 LOGIQUE LPP (Last Purchase Price)
-- Quand une commande fournisseur est validée (status='received'),
-- le prix unitaire (unit_price_ht) devient automatiquement le nouveau cost_price
-- du produit. Cela permet de suivre le dernier prix d'achat réel.

-- 1. Fonction trigger : Auto-update cost_price depuis dernier PO validé
CREATE OR REPLACE FUNCTION update_product_cost_price_from_po()
RETURNS TRIGGER AS $$
DECLARE
  po_status TEXT;
BEGIN
  -- Récupérer le statut de la commande fournisseur
  SELECT status INTO po_status
  FROM purchase_orders
  WHERE id = NEW.purchase_order_id;

  -- Si la commande est validée (received), mettre à jour cost_price
  IF po_status = 'received' THEN
    UPDATE products
    SET cost_price = NEW.unit_price_ht,
        updated_at = NOW()
    WHERE id = NEW.product_id;

    RAISE NOTICE 'LPP Update: Product % cost_price updated to % (from PO %)',
                  NEW.product_id, NEW.unit_price_ht, NEW.purchase_order_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Créer trigger sur purchase_order_items
DROP TRIGGER IF EXISTS trigger_update_cost_price_from_po ON purchase_order_items;

CREATE TRIGGER trigger_update_cost_price_from_po
AFTER INSERT OR UPDATE OF unit_price_ht ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_cost_price_from_po();

-- 3. Migration données historiques : Peupler cost_price depuis dernier PO validé
WITH latest_po_prices AS (
  SELECT DISTINCT ON (poi.product_id)
    poi.product_id,
    poi.unit_price_ht AS latest_cost_price
  FROM purchase_order_items poi
  JOIN purchase_orders po ON po.id = poi.purchase_order_id
  WHERE po.status = 'received'  -- Seulement commandes validées
  ORDER BY poi.product_id,
           po.received_at DESC NULLS LAST,
           po.created_at DESC
)
UPDATE products p
SET cost_price = lpp.latest_cost_price,
    updated_at = NOW()
FROM latest_po_prices lpp
WHERE p.id = lpp.product_id
  AND (p.cost_price IS NULL OR p.cost_price != lpp.latest_cost_price);

-- 4. Documentation
COMMENT ON FUNCTION update_product_cost_price_from_po() IS
  'Trigger LPP (Last Purchase Price): Auto-update products.cost_price
   depuis dernier purchase_order validé (status=received).
   Pattern ERP standard (SAP, Dynamics 365).
   Déclenché sur INSERT/UPDATE purchase_order_items.unit_price_ht.';

-- ✅ RÉSULTAT ATTENDU
-- - Trigger actif sur purchase_order_items
-- - cost_price auto-update quand PO validé
-- - Données historiques migrées (dernier prix connu)
-- - RAISE NOTICE pour debug (logs Supabase)

-- 🧪 TEST MANUEL
-- 1. Créer PO draft avec item
-- 2. Valider PO (status='received')
-- 3. Vérifier products.cost_price mis à jour automatiquement
