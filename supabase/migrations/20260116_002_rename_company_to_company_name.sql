-- ============================================================================
-- Migration: Fix form_submissions column name mismatch
-- ============================================================================
-- Issue: Column is named 'company' in migration 20260115_001
--        but code references 'company_name' (API route, trigger, UI)
-- Fix: Rename column to match code convention
-- ============================================================================

-- Rename column to match code convention
ALTER TABLE form_submissions
RENAME COLUMN company TO company_name;

COMMENT ON COLUMN form_submissions.company_name IS 'Company name (optional) - aligned with code convention';
