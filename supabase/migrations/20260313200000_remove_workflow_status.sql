-- Remove workflow_status column and associated objects from financial_documents
-- Context: workflow_status was never used in production (0 documents beyond initial state).
-- All workflow logic is now based on the Qonto status field directly.

DROP TRIGGER IF EXISTS trg_update_workflow_timestamps ON financial_documents;
DROP FUNCTION IF EXISTS update_workflow_timestamps();
DROP INDEX IF EXISTS idx_financial_documents_workflow_status;
ALTER TABLE financial_documents DROP COLUMN IF EXISTS workflow_status;
ALTER TABLE financial_documents DROP COLUMN IF EXISTS validated_to_draft_at;
ALTER TABLE financial_documents DROP COLUMN IF EXISTS validated_by;
-- Keep synchronized_at and finalized_at as they have independent value
-- (tracking when the document was created/finalized, regardless of workflow)
