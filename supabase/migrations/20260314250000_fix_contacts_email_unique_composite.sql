-- Migration: Replace overly-restrictive contacts_email_unique constraint
-- with a composite unique index allowing same email across different orgs/enseignes.
--
-- Context: A person can manage multiple franchises/organisations, so the same
-- email must be allowed across different organisation_id or enseigne_id values.
-- The new constraint prevents duplicates within the same organisation/enseigne.
--
-- Note: idx_contacts_unique_email_org already exists (organisation_id, email WHERE is_active)
-- but does not cover enseigne contacts. This migration handles both cases.

-- Step 1: Drop the overly restrictive global unique constraint
ALTER TABLE public.contacts DROP CONSTRAINT contacts_email_unique;

-- Step 2: Create composite unique index covering both organisation and enseigne contexts.
-- COALESCE with a sentinel UUID handles NULL values so that:
--   - (email, org_A, sentinel) is unique per org
--   - (email, sentinel, enseigne_B) is unique per enseigne
-- Two rows with the same email but different organisation_id/enseigne_id will be allowed.
CREATE UNIQUE INDEX contacts_email_unique_per_owner
  ON public.contacts (
    email,
    COALESCE(organisation_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(enseigne_id,     '00000000-0000-0000-0000-000000000000'::uuid)
  );
