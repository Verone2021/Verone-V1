-- Fix organisations where trade_name is set and different from legal_name
-- but has_different_trade_name = false (data inconsistency)
-- Affected: RCELEC, SAS CPK, SAS Triton, SSP BELGIUM, zentrada Europe GmbH & Co KG
UPDATE organisations
SET
  has_different_trade_name = true,
  updated_at = NOW()
WHERE
  trade_name IS NOT NULL
  AND trade_name != ''
  AND trade_name != legal_name
  AND has_different_trade_name = false;
