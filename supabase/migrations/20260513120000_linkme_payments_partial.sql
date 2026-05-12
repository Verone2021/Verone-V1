-- Migration: linkme_payments — paiements partiels / multiples des demandes de paiement LinkMe
--
-- Contexte: une demande de paiement LinkMe ne pouvait être réglée que d'un seul coup
-- ("Marquer comme payé" + une référence). Ce modèle introduit:
--   1. un statut intermédiaire 'partially_paid' sur linkme_payment_requests
--   2. une table linkme_payments (1 demande → N paiements, modèle identique aux expéditions partielles)
--   3. le recalcul automatique du statut de la demande à chaque ajout/suppression de paiement
--   4. la mise à jour du trigger de synchro commissions pour gérer le "dé-soldage" (paid → autre)
--   5. le passage automatique des commissions en 'requested' quand elles entrent dans une demande
--      (le flux affilié LinkMe ne le faisait pas — incohérence avec le flux back-office)
--   6. les policies RLS côté affilié manquantes sur linkme_payment_requests / linkme_payment_request_items
--      (jusqu'ici seul le staff back-office y avait accès — le flux affilié LinkMe était cassé au niveau RLS)
--
-- Helper RLS réutilisé: check_linkme_affiliate_access(affiliate_row linkme_affiliates) → boolean
-- (SECURITY DEFINER STABLE, défini dans une migration antérieure).

-- ============================================================================
-- 1. Statut intermédiaire 'partially_paid'
-- ============================================================================
-- La colonne status est varchar(20) sans CHECK : on ajoute le CHECK pour cadrer les valeurs.
ALTER TABLE linkme_payment_requests
  DROP CONSTRAINT IF EXISTS linkme_payment_requests_status_check;
ALTER TABLE linkme_payment_requests
  ADD CONSTRAINT linkme_payment_requests_status_check
  CHECK (status IN ('pending', 'invoice_received', 'partially_paid', 'paid', 'cancelled'));

-- ============================================================================
-- 2. Table linkme_payments
-- ============================================================================
CREATE TABLE IF NOT EXISTS linkme_payments (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_request_id uuid NOT NULL REFERENCES linkme_payment_requests(id) ON DELETE CASCADE,
  amount_ttc         numeric(10, 2) NOT NULL CHECK (amount_ttc > 0),
  payment_reference  varchar(100) NOT NULL,
  payment_date       date NOT NULL DEFAULT current_date,
  payment_proof_url  varchar(500),
  notes              text,
  paid_by            uuid REFERENCES auth.users(id),
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_linkme_payments_request ON linkme_payments(payment_request_id);

COMMENT ON TABLE linkme_payments IS
  'Paiements (virements) effectués pour une demande de paiement LinkMe. Une demande peut être réglée en plusieurs virements — modèle identique aux expéditions partielles. Le statut de la demande est recalculé automatiquement à chaque ajout/suppression de paiement.';

ALTER TABLE linkme_payments ENABLE ROW LEVEL SECURITY;

-- staff = tout
CREATE POLICY "staff_manage_linkme_payments" ON linkme_payments
  FOR ALL TO authenticated
  USING (is_backoffice_user())
  WITH CHECK (is_backoffice_user());

-- affilié = lecture seule de ses propres paiements (via la demande → affilié)
CREATE POLICY "affiliates_view_own_linkme_payments" ON linkme_payments
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1
      FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      WHERE pr.id = linkme_payments.payment_request_id
        AND check_linkme_affiliate_access(la)
    )
  );

-- ============================================================================
-- 3. Recalcul automatique du statut de la demande à chaque paiement
-- ============================================================================
CREATE OR REPLACE FUNCTION recompute_payment_request_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_request_id     uuid;
  v_total_paid     numeric;
  v_total_due      numeric;
  v_current_status text;
  v_has_invoice    boolean;
  v_last_ref       text;
BEGIN
  v_request_id := COALESCE(NEW.payment_request_id, OLD.payment_request_id);

  SELECT total_amount_ttc, status, (invoice_file_url IS NOT NULL)
    INTO v_total_due, v_current_status, v_has_invoice
    FROM linkme_payment_requests WHERE id = v_request_id;

  -- ne jamais toucher une demande annulée
  IF v_current_status = 'cancelled' THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(SUM(amount_ttc), 0) INTO v_total_paid
    FROM linkme_payments WHERE payment_request_id = v_request_id;

  SELECT payment_reference INTO v_last_ref
    FROM linkme_payments WHERE payment_request_id = v_request_id
    ORDER BY payment_date DESC, created_at DESC LIMIT 1;

  IF v_total_due > 0 AND v_total_paid >= v_total_due THEN
    UPDATE linkme_payment_requests
      SET status = 'paid', paid_at = COALESCE(paid_at, now()), payment_reference = v_last_ref
      WHERE id = v_request_id;
  ELSIF v_total_paid > 0 THEN
    UPDATE linkme_payment_requests
      SET status = 'partially_paid', paid_at = NULL, payment_reference = v_last_ref
      WHERE id = v_request_id;
  ELSE
    -- plus aucun paiement → revenir à 'invoice_received' (si facture présente) sinon 'pending'
    UPDATE linkme_payment_requests
      SET status = CASE WHEN v_has_invoice THEN 'invoice_received' ELSE 'pending' END,
          paid_at = NULL, payment_reference = NULL
      WHERE id = v_request_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trigger_recompute_payment_request_status ON linkme_payments;
CREATE TRIGGER trigger_recompute_payment_request_status
  AFTER INSERT OR DELETE ON linkme_payments
  FOR EACH ROW EXECUTE FUNCTION recompute_payment_request_status();

-- ============================================================================
-- 4. MAJ trigger synchro commissions : gérer le "dé-soldage" (paid → autre statut non annulé)
-- ============================================================================
CREATE OR REPLACE FUNCTION sync_commissions_on_payment_request_paid()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Demande soldée → commissions payées
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status <> 'paid') THEN
    UPDATE linkme_commissions
      SET status = 'paid', payment_request_id = NEW.id, paid_at = COALESCE(NEW.paid_at, NOW())
      WHERE id IN (SELECT commission_id FROM linkme_payment_request_items WHERE payment_request_id = NEW.id);
  END IF;

  -- Demande dé-soldée (un paiement a été supprimé) → commissions repassent en 'requested'
  IF OLD.status = 'paid' AND NEW.status NOT IN ('paid', 'cancelled') THEN
    UPDATE linkme_commissions
      SET status = 'requested', paid_at = NULL
      WHERE id IN (SELECT commission_id FROM linkme_payment_request_items WHERE payment_request_id = NEW.id);
  END IF;

  -- Demande annulée → commissions libérées (redeviennent éligibles)
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    UPDATE linkme_commissions
      SET status = 'validated', payment_request_id = NULL, paid_at = NULL
      WHERE id IN (SELECT commission_id FROM linkme_payment_request_items WHERE payment_request_id = NEW.id);
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 5. Commissions ajoutées à une demande → status 'requested' (automatique)
-- ============================================================================
CREATE OR REPLACE FUNCTION mark_commission_requested_on_item_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE linkme_commissions
    SET status = 'requested', payment_request_id = NEW.payment_request_id
    WHERE id = NEW.commission_id AND status = 'validated';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_mark_commission_requested ON linkme_payment_request_items;
CREATE TRIGGER trigger_mark_commission_requested
  AFTER INSERT ON linkme_payment_request_items
  FOR EACH ROW EXECUTE FUNCTION mark_commission_requested_on_item_insert();

-- Item supprimé hors annulation/paiement → commission libérée
CREATE OR REPLACE FUNCTION release_commission_on_item_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE linkme_commissions
    SET status = 'validated', payment_request_id = NULL, paid_at = NULL
    WHERE id = OLD.commission_id AND status IN ('requested', 'paid');
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_release_commission_on_item_delete ON linkme_payment_request_items;
CREATE TRIGGER trigger_release_commission_on_item_delete
  AFTER DELETE ON linkme_payment_request_items
  FOR EACH ROW EXECUTE FUNCTION release_commission_on_item_delete();

-- ============================================================================
-- 6. RLS côté affilié : linkme_payment_requests + linkme_payment_request_items
--    (jusqu'ici seul le staff back-office y avait accès → flux affilié LinkMe cassé)
-- ============================================================================

-- linkme_payment_requests : voir ses propres demandes
CREATE POLICY "affiliates_view_own_payment_requests" ON linkme_payment_requests
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1 FROM linkme_affiliates la
      WHERE la.id = linkme_payment_requests.affiliate_id AND check_linkme_affiliate_access(la)
    )
  );

-- linkme_payment_requests : créer ses propres demandes
CREATE POLICY "affiliates_create_own_payment_requests" ON linkme_payment_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1 FROM linkme_affiliates la
      WHERE la.id = linkme_payment_requests.affiliate_id AND check_linkme_affiliate_access(la)
    )
  );

-- linkme_payment_requests : mettre à jour SA demande tant qu'elle n'est pas (partiellement) payée
-- (upload facture: pending→invoice_received ; annulation: pending/invoice_received→cancelled)
CREATE POLICY "affiliates_update_own_payment_requests" ON linkme_payment_requests
  FOR UPDATE TO authenticated
  USING (
    is_backoffice_user()
    OR (
      status IN ('pending', 'invoice_received')
      AND EXISTS (
        SELECT 1 FROM linkme_affiliates la
        WHERE la.id = linkme_payment_requests.affiliate_id AND check_linkme_affiliate_access(la)
      )
    )
  )
  WITH CHECK (
    is_backoffice_user()
    OR (
      status IN ('pending', 'invoice_received', 'cancelled')
      AND EXISTS (
        SELECT 1 FROM linkme_affiliates la
        WHERE la.id = linkme_payment_requests.affiliate_id AND check_linkme_affiliate_access(la)
      )
    )
  );

-- linkme_payment_request_items : voir les items de ses propres demandes
CREATE POLICY "affiliates_view_own_request_items" ON linkme_payment_request_items
  FOR SELECT TO authenticated
  USING (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1 FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      WHERE pr.id = linkme_payment_request_items.payment_request_id AND check_linkme_affiliate_access(la)
    )
  );

-- linkme_payment_request_items : créer les items de ses propres demandes
CREATE POLICY "affiliates_create_own_request_items" ON linkme_payment_request_items
  FOR INSERT TO authenticated
  WITH CHECK (
    is_backoffice_user()
    OR EXISTS (
      SELECT 1 FROM linkme_payment_requests pr
      JOIN linkme_affiliates la ON la.id = pr.affiliate_id
      WHERE pr.id = linkme_payment_request_items.payment_request_id AND check_linkme_affiliate_access(la)
    )
  );
