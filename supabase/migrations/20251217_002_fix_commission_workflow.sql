-- ============================================================================
-- Migration: Fix Commission Workflow
-- Date: 2025-12-17
-- Description: Corrige le workflow des commissions LinkMe
--              Le trigger doit mettre 'validated' (pas 'paid') quand le client paie
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Corriger le trigger sync_commission_status_on_payment
-- ============================================================================

-- Le trigger actuel met 'paid' quand le client paie, mais c'est incorrect.
-- 'paid' signifie que l'affilié a reçu son argent.
-- Quand le client paie, la commission devient 'validated' (= prête pour demande de paiement)

CREATE OR REPLACE FUNCTION sync_commission_status_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le payment_status passe à 'paid', mettre les commissions à 'validated'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    UPDATE linkme_commissions
    SET status = 'validated'  -- Prête pour demande de paiement, PAS payée à l'affilié
    WHERE order_id = NEW.id
      AND status = 'pending';  -- Seulement les pending, pas les requested/paid
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ÉTAPE 2: Corriger les données existantes
-- ============================================================================

-- Les commissions avec status='paid' mais qui n'ont PAS été réellement payées
-- (pas dans une demande de paiement avec status='paid') doivent passer à 'validated'

UPDATE linkme_commissions
SET
  status = 'validated',
  paid_at = NULL  -- Pas encore payé à l'affilié
WHERE status = 'paid'
  AND id NOT IN (
    -- Exclure les commissions vraiment payées (dans une demande de paiement complétée)
    SELECT pri.commission_id
    FROM linkme_payment_request_items pri
    JOIN linkme_payment_requests pr ON pr.id = pri.payment_request_id
    WHERE pr.status = 'paid'
  );

-- ============================================================================
-- ÉTAPE 3: Supprimer la contrainte CHECK si elle existe et la recréer
-- ============================================================================

-- La contrainte doit inclure: pending, validated, requested, paid
-- (payable n'est plus utilisé)

DO $$
BEGIN
  -- Supprimer l'ancienne contrainte si elle existe
  ALTER TABLE linkme_commissions DROP CONSTRAINT IF EXISTS linkme_commissions_status_check;

  -- Créer la nouvelle contrainte
  ALTER TABLE linkme_commissions ADD CONSTRAINT linkme_commissions_status_check
    CHECK (status IN ('pending', 'validated', 'requested', 'paid'));
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Contrainte CHECK non modifiée: %', SQLERRM;
END $$;

-- ============================================================================
-- VALIDATION
-- ============================================================================

DO $$
DECLARE
  v_pending INTEGER;
  v_validated INTEGER;
  v_requested INTEGER;
  v_paid INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'validated'),
    COUNT(*) FILTER (WHERE status = 'requested'),
    COUNT(*) FILTER (WHERE status = 'paid')
  INTO v_pending, v_validated, v_requested, v_paid
  FROM linkme_commissions;

  RAISE NOTICE '✅ Migration terminée - Commissions par statut:';
  RAISE NOTICE '   - pending: %', v_pending;
  RAISE NOTICE '   - validated (payables): %', v_validated;
  RAISE NOTICE '   - requested (en cours): %', v_requested;
  RAISE NOTICE '   - paid (payées): %', v_paid;
END $$;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON FUNCTION sync_commission_status_on_payment() IS
'Synchronise le statut des commissions LinkMe quand le payment_status de la commande passe à paid.
Met le statut à ''validated'' (prêt pour demande de paiement), PAS ''paid'' (qui signifie que l''affilié a reçu son argent).

Workflow des statuts:
1. pending - Commission créée, client n''a pas payé
2. validated - Client a payé, commission éligible pour demande de paiement
3. requested - Affilié a fait une demande de paiement
4. paid - Affilié a reçu son argent';
