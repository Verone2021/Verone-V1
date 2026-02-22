-- Migration: Add ignored_missing_fields column to sales_order_linkme_details
-- Allows back-office staff to mark specific missing fields as "not required"
-- for a given order (e.g., SIRET unavailable but order can proceed).
--
-- Structure: JSONB array of field keys (strings)
-- Example: '["organisation_siret", "requester_phone"]'

ALTER TABLE public.sales_order_linkme_details
  ADD COLUMN IF NOT EXISTS ignored_missing_fields JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sales_order_linkme_details.ignored_missing_fields IS
  'Array of field keys explicitly ignored by back-office staff (e.g., ["organisation_siret"]). These fields are excluded from missing fields analysis.';
