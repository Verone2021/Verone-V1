-- Migration: Add consultation_id to financial_documents
-- Links quotes (devis) to their source consultation

ALTER TABLE financial_documents
  ADD COLUMN consultation_id UUID REFERENCES client_consultations(id);

CREATE INDEX idx_financial_documents_consultation ON financial_documents(consultation_id)
  WHERE consultation_id IS NOT NULL;
