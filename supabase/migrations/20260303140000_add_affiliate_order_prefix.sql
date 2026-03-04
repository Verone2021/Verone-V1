-- Migration: Add order_code prefix to linkme_affiliates
-- Each affiliate gets a short prefix for sequential order numbering on LinkMe
-- Format: {PREFIX}-{N} (e.g., BWB-1, POK-1, VRON-1)

-- Add order_code column
ALTER TABLE linkme_affiliates ADD COLUMN order_code TEXT;

-- Backfill existing affiliates
UPDATE linkme_affiliates SET order_code = 'BWB'
WHERE id = '4c60050b-79e4-4453-9388-6f3db25bc04f'; -- BW Burger

UPDATE linkme_affiliates SET order_code = 'POK'
WHERE id = 'cdcb3238-0abd-4c43-b1fa-11bb633df163'; -- Pokawa

UPDATE linkme_affiliates SET order_code = 'VRON'
WHERE id = 'c7711bc3-24f7-4a55-8afe-5a50bad1ca70'; -- Verone

-- Add comment for documentation
COMMENT ON COLUMN linkme_affiliates.order_code IS 'Short prefix for sequential order numbering on LinkMe (e.g., BWB, POK, VRON)';
