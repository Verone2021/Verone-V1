-- ============================================================================
-- Migration: Fix LinkMe Commission Statuses
-- Date: 2025-12-17
-- Description: Synchronise les statuts des commissions LinkMe avec payment_status
--              des commandes. Les commissions dont la commande est payée passent
--              de 'pending' à 'paid'.
-- ============================================================================

-- Contexte:
-- - 99 commissions total dans linkme_commissions
-- - 96 commandes ont payment_status = 'paid' mais commission.status = 'pending'
-- - 3 commandes restent en payment_status = 'pending' (factures non payées)
-- Commandes non payées (à conserver en pending):
-- - LINK-240067 (2025-07-04) - 1,425.00€
-- - LINK-240028 (2024-05-15) - 5,132.94€
-- - LINK-240005 (2024-01-16) - 1,797.90€

-- ============================================================================
-- MISE À JOUR DES STATUTS
-- ============================================================================

-- Mettre à jour les commissions dont la commande est payée
UPDATE linkme_commissions lc
SET
  status = 'paid',
  paid_at = COALESCE(lc.paid_at, NOW())
FROM sales_orders so
WHERE lc.order_id = so.id
  AND so.payment_status = 'paid'
  AND lc.status IN ('pending', 'validated');

-- ============================================================================
-- TRIGGER: Synchronisation automatique pour les futures commissions
-- ============================================================================

-- Fonction qui synchronise le statut de la commission quand le paiement change
CREATE OR REPLACE FUNCTION sync_commission_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le payment_status passe à 'paid', mettre à jour les commissions
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    UPDATE linkme_commissions
    SET
      status = 'paid',
      paid_at = COALESCE(paid_at, NOW())
    WHERE order_id = NEW.id
      AND status IN ('pending', 'validated');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trg_sync_commission_on_payment ON sales_orders;

-- Créer le trigger
CREATE TRIGGER trg_sync_commission_on_payment
  AFTER UPDATE OF payment_status ON sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION sync_commission_status_on_payment();

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION sync_commission_status_on_payment() IS
'Synchronise automatiquement le statut des commissions LinkMe quand le payment_status
de la commande passe à paid. Cela évite les incohérences entre le statut de paiement
de la commande et le statut de la commission.';

COMMENT ON TRIGGER trg_sync_commission_on_payment ON sales_orders IS
'Déclenche la synchronisation du statut des commissions LinkMe lors de la mise à jour
du payment_status de la commande.';
