-- [BO-COMPTA-002] Autoriser le type 'bank_transaction_batch' dans document_emails
--
-- La route /api/finance/send-to-accountant journalise chaque lot d'envoi de
-- pièces bancaires au cabinet Welyb dans document_emails avec
-- document_type = 'bank_transaction_batch'. La contrainte CHECK existante
-- n'autorisait que les types de documents commerciaux ('quote', 'invoice',
-- 'proforma', 'credit_note'), donc l'INSERT échouait silencieusement (warning
-- non bloquant) : l'email partait mais l'historique d'envoi n'était pas tracé.
--
-- Élargissement append-only de la contrainte : aucune donnée existante impactée.

ALTER TABLE public.document_emails
  DROP CONSTRAINT IF EXISTS document_emails_document_type_check;

ALTER TABLE public.document_emails
  ADD CONSTRAINT document_emails_document_type_check
  CHECK (
    document_type IN (
      'quote',
      'invoice',
      'proforma',
      'credit_note',
      'bank_transaction_batch'
    )
  );
