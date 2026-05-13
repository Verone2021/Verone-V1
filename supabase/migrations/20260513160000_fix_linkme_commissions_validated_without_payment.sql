-- Fix: commissions LinkMe passées en 'validated' (= "Payable") alors que le client
-- n'a pas payé la commande et qu'aucune facture n'a été émise.
-- Cause: import historique LinkMe (déc 2025 / fév 2026) ou dé-réconciliation d'un
-- paiement client sans re-synchro de la commission.
--
-- 1) Correction de donnée: ces commissions repassent en 'pending' (le flux normal
--    les re-validera quand le client paiera). On exclut celles déjà dans une demande.
-- 2) Faille systémique corrigée: le trigger sync_commission_status_on_payment ne gérait
--    que le sens "le client paie -> commission validée". On ajoute le sens inverse
--    (paiement client annulé/dé-rapproché -> commission repasse en attente).

-- ============================================================================
-- 1. Correction de donnée
-- ============================================================================
UPDATE linkme_commissions lc
SET status = 'pending', updated_at = now()
FROM sales_orders so
WHERE so.id = lc.order_id
  AND lc.status = 'validated'
  AND so.payment_status_v2 IS DISTINCT FROM 'paid'
  AND NOT EXISTS (SELECT 1 FROM financial_documents fd WHERE fd.sales_order_id = so.id)
  AND NOT EXISTS (SELECT 1 FROM linkme_payment_request_items pri WHERE pri.commission_id = lc.id);

-- ============================================================================
-- 2. Re-synchro inverse: paiement client annulé -> commission repasse en 'pending'
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_commission_status_on_payment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Le client paie sa commande -> les commissions liées deviennent "Payable"
  IF NEW.payment_status_v2 = 'paid'
     AND (OLD.payment_status_v2 IS NULL OR OLD.payment_status_v2 <> 'paid') THEN
    UPDATE linkme_commissions
      SET status = 'validated', updated_at = NOW()
      WHERE order_id = NEW.id AND status = 'pending';
  END IF;

  -- Le paiement client est annulé / dé-rapproché -> les commissions liées repassent
  -- "en attente" (uniquement celles encore 'validated' — on ne touche pas à celles
  -- déjà incluses dans une demande de paiement, ni aux payées/annulées).
  IF OLD.payment_status_v2 = 'paid'
     AND NEW.payment_status_v2 IS DISTINCT FROM 'paid' THEN
    UPDATE linkme_commissions
      SET status = 'pending', updated_at = NOW()
      WHERE order_id = NEW.id AND status = 'validated';
  END IF;

  RETURN NEW;
END;
$$;
