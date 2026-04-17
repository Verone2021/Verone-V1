-- BO-FIN-022 : Alignement financial_documents.total_ttc avec sales_orders.total_ttc (= round-per-line = Qonto)
-- Post-Phase 1 de BO-FIN-009 : les SO sont deja round-per-line via le trigger.
-- Ce script aligne les documents lies a commande (draft OU finalized) qui ont encore un delta 1-2 centimes.
-- Scope strict : factures liees a commande non annulee, delta entre 0.001 et 0.02 EUR.
-- Regle finance.md R1 : zero discordance DB <-> Qonto pour les factures liees a commande.

BEGIN;

-- Alignement : total_ttc = so.total_ttc, tva_amount ajuste pour conserver contrainte check_totals_coherent.
-- total_ht non modifie (preservation de la decomposition historique).
UPDATE financial_documents fd
SET
  total_ttc = so.total_ttc,
  tva_amount = so.total_ttc - fd.total_ht,
  synchronized_at = now()
FROM sales_orders so
WHERE fd.sales_order_id = so.id
  AND so.status != 'cancelled'
  AND fd.deleted_at IS NULL
  AND fd.status != 'cancelled'
  AND fd.document_type = 'customer_invoice'
  AND ABS(fd.total_ttc - so.total_ttc) BETWEEN 0.001 AND 0.02;

-- Verification : 0 document avec delta > 0.001 apres alignement
DO $$
DECLARE
  v_mismatch INT;
BEGIN
  SELECT COUNT(*)
  INTO v_mismatch
  FROM financial_documents fd
  JOIN sales_orders so ON so.id = fd.sales_order_id
  WHERE so.status != 'cancelled'
    AND fd.deleted_at IS NULL
    AND fd.status != 'cancelled'
    AND fd.document_type = 'customer_invoice'
    AND ABS(fd.total_ttc - so.total_ttc) > 0.001;

  IF v_mismatch > 0 THEN
    RAISE EXCEPTION 'BO-FIN-022 alignement INCOHERENT: % documents ne matchent pas sales_orders', v_mismatch;
  END IF;

  RAISE NOTICE 'BO-FIN-022 alignement OK : 0 document en divergence';
END $$;

-- Verification contrainte check_totals_coherent (absolument critique)
DO $$
DECLARE
  v_violations INT;
BEGIN
  SELECT COUNT(*)
  INTO v_violations
  FROM financial_documents
  WHERE deleted_at IS NULL
    AND ABS(total_ttc - (total_ht + tva_amount)) >= 0.01;

  IF v_violations > 0 THEN
    RAISE EXCEPTION 'BO-FIN-022 VIOLATION check_totals_coherent: % documents', v_violations;
  END IF;

  RAISE NOTICE 'BO-FIN-022 contrainte check_totals_coherent : OK (0 violation)';
END $$;

COMMIT;
