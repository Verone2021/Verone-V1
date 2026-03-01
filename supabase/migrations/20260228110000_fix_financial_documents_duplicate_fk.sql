-- Fix: Remove duplicate FK constraint on financial_documents.partner_id -> organisations.id
-- There were 2 FK constraints pointing to the same column:
--   1. financial_documents_partner_id_fkey (kept)
--   2. fk_partner (removed - duplicate)
-- This caused PostgREST error: "Could not embed because more than one relationship was found"

ALTER TABLE financial_documents DROP CONSTRAINT IF EXISTS fk_partner;
