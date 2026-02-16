-- Migration: Add Table/Tabouret 2021 to Pokawa selection + Fix retrocessions + Create 14 F-25 commissions
--
-- Context:
--   - 18 F-25 Pokawa orders without commission
--   - 14 calculable (11 with real items + 3 with only Table/Tabouret 2021 at 0 EUR)
--   - 4 remain stand-by (F-25-004, 005, 014, 046: 0 items in DB)
--
-- Products added to Pokawa selection:
--   - "Table modele 2021" (TAB-0003) - offered product, price = 0 EUR
--   - "Tabouret modele 2021" (BAN-0001) - offered product, price = 0 EUR
--
-- Pokawa affiliate: cdcb3238-0abd-4c43-b1fa-11bb633df163
-- Pokawa selection: b97bbc0e-1a5e-4bce-b628-b3461bfadbd7
-- LinkMe channel:   93c68db1-5a30-4168-89ec-6383152be405

BEGIN;

-- ============================================================
-- STEP 1: Add "Table modele 2021" and "Tabouret modele 2021"
--         to Pokawa selection with selling_price = 0, margin = 0
--         (offered products, already paid, no commission)
-- ============================================================

-- Table modele 2021 (product_id: 389f41ed-e25e-40e1-b525-8a7f2abf0726)
-- selling_price_ht is GENERATED ALWAYS from base_price_ht and margin_rate
INSERT INTO linkme_selection_items (selection_id, product_id, base_price_ht, margin_rate, display_order, is_featured)
SELECT
  'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'::uuid,
  '389f41ed-e25e-40e1-b525-8a7f2abf0726'::uuid,
  0, 0, 32, false
WHERE NOT EXISTS (
  SELECT 1 FROM linkme_selection_items
  WHERE selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'
    AND product_id = '389f41ed-e25e-40e1-b525-8a7f2abf0726'
);

-- Tabouret modele 2021 (product_id: ae2c69aa-a403-4b19-acd7-6d81944eea38)
-- selling_price_ht is GENERATED ALWAYS from base_price_ht and margin_rate
INSERT INTO linkme_selection_items (selection_id, product_id, base_price_ht, margin_rate, display_order, is_featured)
SELECT
  'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'::uuid,
  'ae2c69aa-a403-4b19-acd7-6d81944eea38'::uuid,
  0, 0, 33, false
WHERE NOT EXISTS (
  SELECT 1 FROM linkme_selection_items
  WHERE selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'
    AND product_id = 'ae2c69aa-a403-4b19-acd7-6d81944eea38'
);

-- ============================================================
-- STEP 2: Update retrocession_amount on items for 14 F-25
--         Formula: ROUND(selection.selling_price_ht * selection.margin_rate / 100, 2) * qty
--         Items not in selection are untouched (JOIN won't match)
-- ============================================================

UPDATE sales_order_items AS soi
SET retrocession_amount = ROUND(lsi.selling_price_ht * lsi.margin_rate / 100, 2) * soi.quantity
FROM linkme_selection_items lsi, sales_orders so
WHERE lsi.product_id = soi.product_id
  AND lsi.selection_id = 'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'
  AND soi.sales_order_id = so.id
  AND so.order_number IN (
    'F-25-024', 'F-25-025', 'F-25-026', 'F-25-027', 'F-25-031',
    'F-25-038', 'F-25-039', 'F-25-040', 'F-25-041', 'F-25-042',
    'F-25-043', 'F-25-044', 'F-25-049', 'F-25-050'
  );

-- ============================================================
-- STEP 3: Fix channel_id for ALL 18 F-25 (NULL -> LinkMe channel)
--         All F-25 with commission have channel_id set; these 18 don't
-- ============================================================

UPDATE sales_orders
SET channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
WHERE order_number IN (
    'F-25-004', 'F-25-005', 'F-25-014', 'F-25-024', 'F-25-025', 'F-25-026',
    'F-25-027', 'F-25-031', 'F-25-038', 'F-25-039', 'F-25-040', 'F-25-041',
    'F-25-042', 'F-25-043', 'F-25-044', 'F-25-046', 'F-25-049', 'F-25-050'
  )
  AND channel_id IS NULL;

-- ============================================================
-- STEP 4: Create commissions for 14 F-25 orders
--         (11 with real commission + 3 with commission = 0 EUR)
--         Uses retrocession_amount updated in Step 2
-- ============================================================

INSERT INTO linkme_commissions (
  affiliate_id, selection_id, order_id, order_number,
  order_amount_ht, affiliate_commission, affiliate_commission_ttc,
  linkme_commission, margin_rate_applied, linkme_rate_applied,
  status, tax_rate
)
SELECT
  'cdcb3238-0abd-4c43-b1fa-11bb633df163'::uuid,
  'b97bbc0e-1a5e-4bce-b628-b3461bfadbd7'::uuid,
  so.id,
  so.order_number,
  COALESCE(SUM(soi.total_ht), 0),
  COALESCE(SUM(soi.retrocession_amount), 0),
  ROUND(COALESCE(SUM(soi.retrocession_amount), 0) * 1.20, 2),
  0.00,
  0.15,
  0.00,
  'validated',
  0.20
FROM sales_orders so
LEFT JOIN sales_order_items soi ON soi.sales_order_id = so.id
WHERE so.order_number IN (
    'F-25-024', 'F-25-025', 'F-25-026', 'F-25-027', 'F-25-031',
    'F-25-038', 'F-25-039', 'F-25-040', 'F-25-041', 'F-25-042',
    'F-25-043', 'F-25-044', 'F-25-049', 'F-25-050'
  )
  AND NOT EXISTS (
    SELECT 1 FROM linkme_commissions lc WHERE lc.order_id = so.id
  )
GROUP BY so.id, so.order_number;

COMMIT;
