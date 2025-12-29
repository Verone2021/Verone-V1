-- =====================================================================
-- Migration: Fix financial_documents FK ON DELETE
-- Date: 2025-12-28
-- Description: Change partner_id FK from RESTRICT to SET NULL
--              This was missed in the earlier FK fix migration
-- =====================================================================

-- Drop existing constraint
ALTER TABLE financial_documents
DROP CONSTRAINT IF EXISTS fk_partner;

-- Add new constraint with ON DELETE SET NULL
ALTER TABLE financial_documents
ADD CONSTRAINT fk_partner
FOREIGN KEY (partner_id) REFERENCES organisations(id)
ON DELETE SET NULL;

-- Log
DO $$
BEGIN
  RAISE NOTICE 'FK financial_documents.partner_id updated to ON DELETE SET NULL';
END $$;
