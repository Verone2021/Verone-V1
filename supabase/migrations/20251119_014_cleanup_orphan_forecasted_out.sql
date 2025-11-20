-- Migration: Nettoyage des valeurs orphelines stock_forecasted_out
-- Bug: Produits avec stock_forecasted_out > 0 sans commandes clients validées
-- Cause: Commandes annulées/supprimées qui n'ont pas relâché le stock prévisionnel
-- Impact: Fausses alertes "Commandé Sans Stock"
-- Priority: P1 - HIGH
-- Date: 2025-11-19

-- ✅ Nettoyer tous les produits avec stock_forecasted_out orphelin
-- (stock_forecasted_out > 0 mais aucune commande client validée correspondante)
UPDATE products
SET
  stock_forecasted_out = 0,
  updated_at = NOW()
WHERE stock_forecasted_out > 0
  AND id NOT IN (
    SELECT DISTINCT soi.product_id
    FROM sales_order_items soi
    JOIN sales_orders so ON so.id = soi.sales_order_id
    WHERE so.status IN ('confirmed', 'partially_shipped')
      AND soi.product_id IS NOT NULL
  );

-- ✅ Supprimer alertes orphelines qui vont être recalculées par le trigger
DELETE FROM stock_alert_tracking
WHERE alert_type = 'no_stock_but_ordered'
  AND product_id IN (
    SELECT id FROM products
    WHERE stock_forecasted_out = 0
  );

-- ✅ Forcer recalcul des alertes pour tous les produits actifs
UPDATE products
SET stock_real = stock_real
WHERE product_status = 'active';

COMMENT ON MIGRATION IS
'Nettoyage des valeurs orphelines stock_forecasted_out causées par des commandes
annulées/supprimées. Résout les fausses alertes "Commandé Sans Stock".
HOTFIX 2025-11-19 : Data cleanup post-trigger corrections.';
