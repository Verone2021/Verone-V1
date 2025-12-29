-- ============================================================================
-- Migration: Invoice Upload Tracking
-- Date: 2025-12-24
-- Description: Ajoute le tracking des uploads de factures vers Qonto
-- ============================================================================

-- ============================================================================
-- PARTIE 1: Colonnes sur financial_documents
-- ============================================================================

-- Source de la facture (crm = générée, uploaded = PDF déposé, qonto_existing = déjà dans Qonto)
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS invoice_source TEXT
  CHECK (invoice_source IN ('crm', 'uploaded', 'qonto_existing'));

-- Statut de l'upload vers Qonto
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS upload_status TEXT
  CHECK (upload_status IN ('pending', 'uploading', 'confirmed', 'failed'))
  DEFAULT NULL;

-- ID de l'attachment retourné par Qonto après upload
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS qonto_attachment_id TEXT;

-- Date de l'upload
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

-- Qui a uploadé
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- PARTIE 2: Colonne sur bank_transactions pour tracker le statut PDF
-- ============================================================================

-- has_attachment calculé à partir de raw_data.attachments
-- Note: Cette colonne est un cache pour performance, la source de vérité reste raw_data
ALTER TABLE bank_transactions
ADD COLUMN IF NOT EXISTS has_attachment BOOLEAN GENERATED ALWAYS AS (
  CASE
    WHEN raw_data IS NULL THEN FALSE
    WHEN raw_data->'attachments' IS NULL THEN FALSE
    WHEN jsonb_array_length(raw_data->'attachments') = 0 THEN FALSE
    ELSE TRUE
  END
) STORED;

-- ============================================================================
-- PARTIE 3: Vue pour les transactions rapprochées sans facture
-- ============================================================================

CREATE OR REPLACE VIEW v_transactions_missing_invoice AS
SELECT
  bt.id,
  bt.transaction_id,
  bt.amount,
  bt.currency,
  bt.side,
  bt.label,
  bt.counterparty_name,
  bt.emitted_at,
  bt.settled_at,
  bt.matching_status,
  bt.matched_document_id,
  bt.has_attachment,
  fd.id as financial_document_id,
  fd.document_number,
  fd.invoice_source,
  fd.upload_status,
  fd.qonto_attachment_id,
  so.id as sales_order_id,
  so.order_number,
  so.customer_id
FROM bank_transactions bt
LEFT JOIN financial_documents fd ON fd.id = bt.matched_document_id
LEFT JOIN sales_orders so ON so.id = fd.sales_order_id
WHERE
  bt.matching_status IN ('manual_matched', 'auto_matched')
  AND bt.has_attachment = FALSE
  AND bt.side = 'credit' -- Uniquement les encaissements (ventes)
ORDER BY bt.emitted_at DESC;

-- ============================================================================
-- PARTIE 4: Vue pour le dashboard des uploads en attente
-- ============================================================================

CREATE OR REPLACE VIEW v_pending_invoice_uploads AS
SELECT
  fd.id,
  fd.document_number,
  fd.document_type,
  fd.total_ttc,
  fd.document_date,
  fd.invoice_source,
  fd.upload_status,
  fd.created_at,
  fd.uploaded_at,
  fd.uploaded_by,
  bt.transaction_id as qonto_transaction_id,
  bt.label as transaction_label,
  bt.amount as transaction_amount,
  so.order_number,
  so.customer_id,
  u.email as uploaded_by_email
FROM financial_documents fd
LEFT JOIN bank_transactions bt ON bt.matched_document_id = fd.id
LEFT JOIN sales_orders so ON so.id = fd.sales_order_id
LEFT JOIN auth.users u ON u.id = fd.uploaded_by
WHERE
  fd.upload_status = 'pending'
  OR (fd.invoice_source = 'uploaded' AND fd.upload_status IS NULL)
ORDER BY fd.created_at DESC;

-- ============================================================================
-- PARTIE 5: Fonction pour mettre à jour has_attachment après upload
-- ============================================================================

CREATE OR REPLACE FUNCTION update_transaction_attachment_status(
  p_transaction_id TEXT,
  p_attachment_id TEXT
) RETURNS VOID AS $$
BEGIN
  -- Mettre à jour raw_data pour inclure le nouvel attachment
  UPDATE bank_transactions
  SET raw_data = jsonb_set(
    COALESCE(raw_data, '{}'::jsonb),
    '{attachments}',
    COALESCE(raw_data->'attachments', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('id', p_attachment_id))
  )
  WHERE transaction_id = p_transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PARTIE 6: Index pour performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bank_transactions_has_attachment
ON bank_transactions(has_attachment)
WHERE matching_status IN ('manual_matched', 'auto_matched');

CREATE INDEX IF NOT EXISTS idx_financial_documents_upload_status
ON financial_documents(upload_status)
WHERE upload_status IS NOT NULL;

-- ============================================================================
-- PARTIE 7: RLS Policies
-- ============================================================================

-- Les nouvelles colonnes héritent des policies existantes sur financial_documents

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================

COMMENT ON COLUMN financial_documents.invoice_source IS 'Source de la facture: crm (générée dans le CRM), uploaded (PDF déposé), qonto_existing (déjà dans Qonto)';
COMMENT ON COLUMN financial_documents.upload_status IS 'Statut de l''upload vers Qonto: pending, uploading, confirmed, failed';
COMMENT ON COLUMN financial_documents.qonto_attachment_id IS 'ID de l''attachment retourné par Qonto API après upload réussi';
COMMENT ON COLUMN bank_transactions.has_attachment IS 'Indique si la transaction a au moins une pièce jointe (calculé depuis raw_data.attachments)';
COMMENT ON VIEW v_transactions_missing_invoice IS 'Transactions rapprochées (ventes) sans pièce jointe - pour upload de factures';
COMMENT ON VIEW v_pending_invoice_uploads IS 'Documents financiers en attente d''upload vers Qonto';
