-- =====================================================
-- MIGRATION: Fix trigger pour ignorer réceptions affiliées en attente
-- Date: 2025-12-22
-- Description: Le trigger update_stock_on_reception doit ignorer les
--              réceptions affiliées (reference_type = 'affiliate_product')
--              car elles ont leur propre workflow via trigger_stock_on_affiliate_reception
-- =====================================================

-- Modifier le trigger pour ajouter une condition WHEN
DROP TRIGGER IF EXISTS trigger_reception_update_stock ON purchase_order_receptions;

CREATE TRIGGER trigger_reception_update_stock
  AFTER INSERT ON purchase_order_receptions
  FOR EACH ROW
  WHEN (NEW.reference_type = 'purchase_order' OR NEW.reference_type IS NULL)
  EXECUTE FUNCTION update_stock_on_reception();

COMMENT ON TRIGGER trigger_reception_update_stock ON purchase_order_receptions IS
'Declenche uniquement pour les receptions de commandes fournisseur (purchase_order),
pas pour les receptions affiliees qui ont leur propre trigger.';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
