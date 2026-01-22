-- Migration: Ajouter colonnes Qonto pour factures
-- Date: 2026-01-22
-- Description: Colonnes pour stocker les données Qonto (ID, PDF URL, Public URL)

-- 1. Ajouter colonnes Qonto
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS qonto_invoice_id TEXT,
ADD COLUMN IF NOT EXISTS qonto_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS qonto_public_url TEXT;

-- 2. Index pour recherche par qonto_invoice_id
CREATE INDEX IF NOT EXISTS idx_financial_documents_qonto_invoice_id
  ON financial_documents(qonto_invoice_id)
  WHERE qonto_invoice_id IS NOT NULL;

-- 3. Commentaires
COMMENT ON COLUMN financial_documents.qonto_invoice_id IS
  'ID de la facture dans Qonto (format: uuid)';

COMMENT ON COLUMN financial_documents.qonto_pdf_url IS
  'URL du PDF de la facture finalisee dans Qonto';

COMMENT ON COLUMN financial_documents.qonto_public_url IS
  'URL publique de la facture dans Qonto (accessible sans auth)';
