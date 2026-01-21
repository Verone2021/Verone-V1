-- ============================================
-- Migration: Add country and default_vat_rate to organisations
-- Date: 2026-01-20
-- Description:
--   - Add country column (ISO code) for TVA calculation
--   - Add default_vat_rate column with automatic calculation trigger
--   - France = 20%, Export (other countries) = 0%
-- ============================================

-- 1. Add country column (ISO code: FR, LU, BE, CH, etc.)
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'FR';

COMMENT ON COLUMN organisations.country IS
'Country ISO code (FR, LU, BE, CH, etc.). Used for automatic VAT rate calculation.
Default: FR (France).';

-- 2. Add default_vat_rate column
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS default_vat_rate DECIMAL(5,4) DEFAULT 0.20;

COMMENT ON COLUMN organisations.default_vat_rate IS
'Default VAT rate for this organisation.
Calculated automatically based on country:
- France (FR) = 0.20 (20%)
- Other countries = 0.00 (0%, export)
Can be overridden manually by back-office.';

-- 3. Update existing organisations based on country
-- Note: Most existing orgs are French, default to 20%
UPDATE organisations
SET default_vat_rate = CASE
  WHEN UPPER(COALESCE(country, '')) = 'FR' THEN 0.20
  WHEN UPPER(COALESCE(country, '')) = 'FRANCE' THEN 0.20
  WHEN country IS NULL OR country = '' THEN 0.20  -- Default France if no country
  ELSE 0.00  -- Export = 0%
END
WHERE default_vat_rate IS NULL OR default_vat_rate = 0.20;

-- 4. Create trigger function to auto-calculate default_vat_rate when country changes
CREATE OR REPLACE FUNCTION calculate_default_vat_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- If default_vat_rate is explicitly set (manual override), don't recalculate
  -- unless country changed
  IF TG_OP = 'UPDATE'
     AND OLD.default_vat_rate IS DISTINCT FROM NEW.default_vat_rate
     AND OLD.country IS NOT DISTINCT FROM NEW.country THEN
    -- Manual override without country change - keep the new value
    RETURN NEW;
  END IF;

  -- Auto-calculate based on country
  IF UPPER(COALESCE(NEW.country, '')) = 'FR'
     OR UPPER(COALESCE(NEW.country, '')) = 'FRANCE'
     OR NEW.country IS NULL
     OR NEW.country = '' THEN
    NEW.default_vat_rate := 0.20;
  ELSE
    -- All other countries = export = 0%
    NEW.default_vat_rate := 0.00;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_default_vat_rate() IS
'Trigger function to automatically calculate default_vat_rate based on country.
France = 20%, other countries = 0% (export).';

-- 5. Create trigger (runs on INSERT and UPDATE of country)
DROP TRIGGER IF EXISTS trg_calculate_default_vat_rate ON organisations;
CREATE TRIGGER trg_calculate_default_vat_rate
BEFORE INSERT OR UPDATE OF country ON organisations
FOR EACH ROW
EXECUTE FUNCTION calculate_default_vat_rate();

-- 6. Create index for efficient country-based queries
CREATE INDEX IF NOT EXISTS idx_organisations_country
ON organisations(country)
WHERE country IS NOT NULL;

-- 7. Add RLS policy consideration: no change needed,
--    these columns follow existing RLS on organisations table
