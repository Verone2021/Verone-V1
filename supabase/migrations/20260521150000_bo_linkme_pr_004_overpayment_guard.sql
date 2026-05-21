-- =============================================================================
-- [BO-LINKME-PR-004] Garde-fou anti-surpaiement + correction ERRCODE
-- =============================================================================
-- Suite à la revue qualité du chantier workflow paiements LinkMe.
--
-- 1. prevent_linkme_payment_overpay (NOUVEAU trigger BEFORE INSERT sur
--    linkme_payments) : refuse un virement qui porterait le total versé
--    au-delà du montant dû de la demande. Jusqu'ici, la seule protection
--    contre le surpaiement était côté écran (ProcessPaymentModal) — un INSERT
--    direct en base (script, régression UI) pouvait créer un trop-perçu
--    silencieux. La table a déjà CHECK amount_ttc > 0 ; ce trigger ajoute le
--    plafond haut. Tolérance de 0,01 € pour absorber les écarts d'arrondi.
--
-- 2. mark_commission_requested_on_item_insert : le cas « commission
--    introuvable / status NULL » levait ERRCODE 'foreign_key_violation', ce
--    qui est trompeur (la FK garantit déjà l'existence de la ligne). Remplacé
--    par une RAISE EXCEPTION standard (P0001).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Garde-fou anti-surpaiement
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_linkme_payment_overpay()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_due numeric;
  v_already_paid numeric;
BEGIN
  SELECT total_amount_ttc INTO v_total_due
    FROM linkme_payment_requests WHERE id = NEW.payment_request_id;

  SELECT COALESCE(SUM(amount_ttc), 0) INTO v_already_paid
    FROM linkme_payments WHERE payment_request_id = NEW.payment_request_id;

  IF v_total_due IS NOT NULL
     AND v_already_paid + NEW.amount_ttc > v_total_due + 0.01 THEN
    RAISE EXCEPTION 'Surpaiement refuse : un virement de % porterait le total verse a % alors que la demande ne doit que %.',
      NEW.amount_ttc, v_already_paid + NEW.amount_ttc, v_total_due
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_prevent_linkme_payment_overpay ON linkme_payments;
CREATE TRIGGER trg_prevent_linkme_payment_overpay
  BEFORE INSERT ON linkme_payments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_linkme_payment_overpay();

-- -----------------------------------------------------------------------------
-- 2. Correction ERRCODE — mark_commission_requested_on_item_insert
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_commission_requested_on_item_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  SELECT status INTO v_status
    FROM linkme_commissions WHERE id = NEW.commission_id;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Commission % : statut introuvable, impossible de l''attacher a une demande de paiement.', NEW.commission_id;
  END IF;

  IF v_status <> 'validated' THEN
    RAISE EXCEPTION 'Commission % non eligible (statut "%") : seules les commissions validees (commande payee) peuvent etre incluses dans une demande de paiement.', NEW.commission_id, v_status
      USING ERRCODE = 'check_violation';
  END IF;

  UPDATE linkme_commissions
    SET status = 'requested', payment_request_id = NEW.payment_request_id
    WHERE id = NEW.commission_id;

  RETURN NEW;
END;
$function$;

COMMIT;
