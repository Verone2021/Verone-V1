-- [BO-FIN-034] Allow 'superseded' in financial_documents.quote_status
-- Required for R4 (finance.md) : auto-overwrite draft devis when regenerating.
-- `checkAndCleanExistingQuotes` sets quote_status='superseded' on soft-delete.

ALTER TABLE financial_documents
  DROP CONSTRAINT IF EXISTS financial_documents_quote_status_check;

ALTER TABLE financial_documents
  ADD CONSTRAINT financial_documents_quote_status_check CHECK (
    quote_status = ANY (
      ARRAY[
        'draft'::text,
        'validated'::text,
        'sent'::text,
        'accepted'::text,
        'declined'::text,
        'expired'::text,
        'converted'::text,
        'superseded'::text
      ]
    )
  );
