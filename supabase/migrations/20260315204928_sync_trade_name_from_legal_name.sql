-- Migration: Ensure trade_name is always populated
-- Rule: trade_name = display name, never NULL
-- Sync direction: legal_name → trade_name ONLY (legal_name is juridical, never auto-filled)

-- Step 1: Create trigger function (one-way sync)
CREATE OR REPLACE FUNCTION sync_trade_name_from_legal_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If trade_name is empty, copy from legal_name
  IF NEW.trade_name IS NULL OR TRIM(NEW.trade_name) = '' THEN
    NEW.trade_name := NEW.legal_name;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach trigger on INSERT and UPDATE
CREATE TRIGGER trg_sync_trade_name_from_legal_name
  BEFORE INSERT OR UPDATE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION sync_trade_name_from_legal_name();

-- Step 3: Fix existing data — all orgs with NULL trade_name
UPDATE organisations
SET trade_name = legal_name
WHERE trade_name IS NULL;
