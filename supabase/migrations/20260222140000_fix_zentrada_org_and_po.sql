-- Fix Zentrada organisation: country, VAT rate, VAT number
-- Zentrada GmbH is based in Wuerzburg, Germany (DE)
-- Intra-community delivery = 0% VAT
-- VAT number from invoice 323060

-- 1. Corriger organisation Zentrada
UPDATE organisations SET
  country = 'DE',
  default_vat_rate = 0.0000,
  vat_number = 'DE813805341',
  updated_at = NOW()
WHERE id = '16ccbe2e-85e4-41ad-8d46-70520afc0fa1';

-- 2. Corriger PO-2026-00034: tax_rate 0% and total_ttc = total_ht
UPDATE purchase_orders SET
  tax_rate = 0.0000,
  total_ttc = total_ht,
  updated_at = NOW()
WHERE id = '9aabffa7-ed99-4bed-bea3-2c56bcd066be';
