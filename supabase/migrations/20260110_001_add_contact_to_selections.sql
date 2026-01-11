-- Migration: Add contact fields to linkme_selections
-- Purpose: Allow each selection to have a contact person for FAQ section
-- Date: 2026-01-10

-- Add contact fields to linkme_selections
ALTER TABLE linkme_selections
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN linkme_selections.contact_name IS 'Name of the contact person for this selection (displayed in FAQ section)';
COMMENT ON COLUMN linkme_selections.contact_email IS 'Email of the contact person for this selection';
COMMENT ON COLUMN linkme_selections.contact_phone IS 'Phone of the contact person for this selection';
