-- =============================================================================
-- [BO-LINKME-PR-003] RPC de rapprochement Qonto pour les paiements LinkMe
-- =============================================================================
-- Appelée quand le back-office marque une demande LinkMe comme payée. Cherche
-- la transaction bancaire correspondante par référence et crée le lien dans
-- `transaction_document_links`. Met à jour `financial_documents.status = 'paid'`.
-- Idempotente : `uq_transaction_document` empêche le doublon.
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION link_linkme_payment_to_bank_transaction(
  p_payment_request_id uuid,
  p_payment_reference text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc_id uuid;
  v_total_ttc numeric;
  v_transaction_id uuid;
  v_already_linked boolean;
BEGIN
  -- Récupérer le document financier lié à la demande
  SELECT financial_document_id, total_amount_ttc
  INTO v_doc_id, v_total_ttc
  FROM linkme_payment_requests
  WHERE id = p_payment_request_id;

  IF v_doc_id IS NULL THEN
    RETURN jsonb_build_object(
      'linked', false,
      'reason', 'no_financial_document',
      'message', 'La demande n''a pas de document financier rattaché. La facture n''a peut-être pas été déposée.'
    );
  END IF;

  -- Si une transaction est déjà rapprochée à ce document, ne rien faire
  SELECT EXISTS(
    SELECT 1 FROM transaction_document_links
    WHERE document_id = v_doc_id
  ) INTO v_already_linked;

  IF v_already_linked THEN
    RETURN jsonb_build_object(
      'linked', true,
      'reason', 'already_linked',
      'message', 'Le document est déjà rapproché à une transaction.'
    );
  END IF;

  -- Chercher la transaction bancaire par référence (case-insensitive)
  SELECT id INTO v_transaction_id
  FROM bank_transactions
  WHERE side = 'debit'
    AND p_payment_reference IS NOT NULL
    AND length(trim(p_payment_reference)) > 0
    AND (
      reference ILIKE '%' || p_payment_reference || '%'
      OR transaction_id ILIKE '%' || p_payment_reference || '%'
      OR label ILIKE '%' || p_payment_reference || '%'
    )
  ORDER BY emitted_at DESC
  LIMIT 1;

  IF v_transaction_id IS NULL THEN
    RETURN jsonb_build_object(
      'linked', false,
      'reason', 'transaction_not_found',
      'message', 'Aucune transaction bancaire trouvée pour cette référence. Rapproche manuellement dans /finance/transactions.'
    );
  END IF;

  -- Insérer le lien (idempotent via uq_transaction_document)
  INSERT INTO transaction_document_links (
    transaction_id, document_id, link_type, allocated_amount, created_by
  )
  VALUES (
    v_transaction_id, v_doc_id, 'document', v_total_ttc, (SELECT auth.uid())
  )
  ON CONFLICT (transaction_id, document_id) DO NOTHING;

  -- Mettre à jour le statut du document
  UPDATE financial_documents
  SET status = 'paid',
      amount_paid = v_total_ttc,
      updated_at = now()
  WHERE id = v_doc_id;

  RETURN jsonb_build_object(
    'linked', true,
    'transaction_id', v_transaction_id,
    'document_id', v_doc_id,
    'message', 'Transaction rapprochée avec succès.'
  );
END;
$$;

COMMENT ON FUNCTION link_linkme_payment_to_bank_transaction(uuid, text) IS
  'Rapproche le paiement d''une demande LinkMe avec la transaction Qonto correspondante. Cherche par référence dans reference / transaction_id / label de bank_transactions (débit). Idempotent. Retourne un JSONB avec linked + reason.';

GRANT EXECUTE ON FUNCTION link_linkme_payment_to_bank_transaction(uuid, text) TO authenticated;

COMMIT;
