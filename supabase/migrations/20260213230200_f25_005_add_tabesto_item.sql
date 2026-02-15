-- F-25-005 (Pokawa Mazarine - Paris 8) : Ajouter item Meuble TABESTO + commission
-- Produit offert (déjà payé), prix = 0€, commission = 0€
-- Contexte : F-25-005 avait 0 items en DB, Romeo confirme 1 meuble TABESTO à ajouter
-- Note: base_price_ht_locked=0 pour que le trigger calculate_retrocession_amount()
--   calcule (0-0)*1=0 au lieu de (0-1006.14)*1=-1006.14 (base_price réelle du produit)

-- Step 1: INSERT item Meuble TABESTO sur F-25-005
INSERT INTO sales_order_items (
  sales_order_id, product_id, quantity, unit_price_ht,
  discount_percentage, quantity_shipped,
  tax_rate, retrocession_rate, retrocession_amount,
  eco_tax, is_sample, linkme_selection_item_id,
  base_price_ht_locked, selling_price_ht_locked
)
SELECT
  'd79dad72-8732-459d-a259-063bad624931'::uuid,  -- F-25-005
  '37f00f14-ce2d-48bf-ba4a-832d37978a74'::uuid,  -- Meuble TABESTO à POKAWA
  1, 0, 0, 0,  -- qty=1, unit_price=0, discount=0, shipped=0
  0.20, 0, 0, 0, false,
  '7ccef8c6-c37a-414b-9f54-d308f3df7d44'::uuid,  -- selection item Pokawa
  0, 0  -- locked prices = 0 (produit offert)
WHERE NOT EXISTS (
  SELECT 1 FROM sales_order_items
  WHERE sales_order_id = 'd79dad72-8732-459d-a259-063bad624931'
    AND product_id = '37f00f14-ce2d-48bf-ba4a-832d37978a74'
);

-- Step 2: INSERT commission F-25-005 (0€)
INSERT INTO linkme_commissions (
  affiliate_id, selection_id, order_id, order_number,
  order_amount_ht, affiliate_commission, affiliate_commission_ttc,
  linkme_commission, margin_rate_applied, linkme_rate_applied,
  status, tax_rate
)
SELECT
  'cdcb3238-0abd-4c43-b1fa-11bb633df163'::uuid,  -- Pokawa affiliate
  'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'::uuid,  -- Pokawa selection
  'd79dad72-8732-459d-a259-063bad624931'::uuid,    -- F-25-005
  'F-25-005',
  0, 0, 0, 0, 0.15, 0, 'validated', 0.20
WHERE NOT EXISTS (
  SELECT 1 FROM linkme_commissions
  WHERE order_id = 'd79dad72-8732-459d-a259-063bad624931'
);
