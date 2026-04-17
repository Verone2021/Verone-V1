-- Rend l'index unique_document_number_per_type partiel (ne considere que les docs non-supprimes).
-- Permet la reutilisation d'un document_number apres soft-delete (ex: re-generation proforma draft).
-- Fix BO-FIN-014 : le guard d'ecrasement dans /api/qonto/invoices POST soft-delete l'ancienne proforma
-- puis INSERT la nouvelle avec le meme document_number. Sans partial index, violation 23505.

ALTER TABLE financial_documents DROP CONSTRAINT IF EXISTS unique_document_number_per_type;
DROP INDEX IF EXISTS unique_document_number_per_type;

CREATE UNIQUE INDEX unique_document_number_per_type
  ON financial_documents (document_type, document_number)
  WHERE deleted_at IS NULL;
