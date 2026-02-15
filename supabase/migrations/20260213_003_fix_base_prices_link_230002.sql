-- ============================================================
-- Migration: Fix base prices for LINK-230002 (correction)
-- Date: 2026-02-13
-- Ticket: LM-USERS-001
--
-- Context: Migration 20260213_002 set WRONG prices in channel_pricing.
-- It set selling prices (prix facturés) instead of base prices.
-- Since selling_price_ht is a GENERATED COLUMN calculated as:
--   selling_price_ht = base_price_ht / (1 - margin_rate / 100)
-- We need to set base_price_ht to get the correct selling_price_ht.
--
-- Formula: base_price_ht = prix_facturé × (1 - margin_rate / 100)
-- With margin_rate = 15%: base_price_ht = prix_facturé × 0.85
-- ============================================================

-- =============================================================================
-- PART 1: Correct base prices in channel_pricing
-- =============================================================================

-- COU-0007 (Coussin Blanc): 64.71 × 0.85 = 55.00
UPDATE channel_pricing
SET public_price_ht = 55.00
WHERE product_id = '48ccd5af-b90c-47bd-9c8e-5e8bb5d48ad3'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- DCO-0005 (Lots 4 miroirs): 376.59 × 0.85 = 320.10
UPDATE channel_pricing
SET public_price_ht = 320.10
WHERE product_id = 'c81b12b8-8f91-4b28-a2c5-df70c89e3cb0'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0003 (Suspension paille): 98.69 × 0.85 = 83.89
UPDATE channel_pricing
SET public_price_ht = 83.89
WHERE product_id = 'ec12e634-ea89-4c6e-86d5-1f8e3d7c86a9'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0005 (Suspension raphia 5): 192.78 × 0.85 = 163.86
UPDATE channel_pricing
SET public_price_ht = 163.86
WHERE product_id = 'e7c8c7bb-cfbe-45ec-8617-5d8ca892d9b7'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0006 (Suspension raphia 6): 192.78 × 0.85 = 163.86
UPDATE channel_pricing
SET public_price_ht = 163.86
WHERE product_id = 'eb973cb0-ca32-4efc-99c9-82bd379b87e2'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0007 (Suspension raphia 3): 174.94 × 0.85 = 148.70
UPDATE channel_pricing
SET public_price_ht = 148.70
WHERE product_id = 'd2e8b1d8-a2e5-4c8e-9f1b-8e7d6c5b4a3c'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- =============================================================================
-- PART 2: Verify propagation to linkme_selection_items
-- =============================================================================
-- The sync_channel_pricing_to_selections trigger should propagate base_price_ht
-- Then selling_price_ht will be recalculated automatically by the GENERATED COLUMN

-- =============================================================================
-- PART 3: Recalculate commissions (same as before)
-- =============================================================================

UPDATE sales_order_items soi
SET retrocession_amount = ROUND(
  (lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity,
  2
)
FROM linkme_selection_items lsi
WHERE lsi.id = soi.linkme_selection_item_id
  AND soi.sales_order_id IN (
    SELECT id FROM sales_orders WHERE order_number = 'LINK-230002'
  );
