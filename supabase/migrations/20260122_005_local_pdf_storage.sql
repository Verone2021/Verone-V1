-- Migration: Ajouter colonnes pour stockage local des PDFs
-- Date: 2026-01-22
-- Description: Stocker les PDFs localement dans Supabase Storage pour indépendance de Qonto

-- 1. Ajouter colonnes stockage local
ALTER TABLE financial_documents
ADD COLUMN IF NOT EXISTS local_pdf_path TEXT,
ADD COLUMN IF NOT EXISTS local_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS pdf_stored_at TIMESTAMPTZ;

-- 2. Index pour vérifier rapidement si un PDF est stocké localement
CREATE INDEX IF NOT EXISTS idx_financial_documents_local_pdf
  ON financial_documents(id)
  WHERE local_pdf_path IS NOT NULL;

-- 3. Commentaires
COMMENT ON COLUMN financial_documents.local_pdf_path IS
  'Chemin du PDF dans Supabase Storage (ex: invoices/customer/2026/FAC-2026-001.pdf)';

COMMENT ON COLUMN financial_documents.local_pdf_url IS
  'URL signée du PDF local (régénérable, cache de quelques heures)';

COMMENT ON COLUMN financial_documents.pdf_stored_at IS
  'Date de téléchargement et stockage du PDF localement';
