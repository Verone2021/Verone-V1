-- ============================================================
-- Migration: Fix LINK-230002 prices and selection links
-- Date: 2026-02-13
-- Ticket: LM-USERS-001
--
-- Context: LINK-230002 invoice verification revealed:
-- - 2 orphaned items (linkme_selection_item_id = NULL)
-- - 1 item linked to wrong selection
-- - 5 items with divergent prices (invoice vs current catalog)
--
-- Financial impact: -450.57 EUR underpayment (commission missing)
--
-- Corrections:
-- 1. Fix selection links for 3 items (SUS-0005, SUS-0006, SUS-0009)
-- 2. Adjust 5 prices in channel_pricing (trigger propagates to selections)
-- 3. Recalculate commissions automatically
-- ============================================================

-- =============================================================================
-- PART 1: Fix selection links (3 items)
-- =============================================================================

-- SUS-0005 (Suspension raphia 5): Fix wrong link
-- Currently: 46242a54 (WRONG - that's SUS-0006's item)
-- Correct: 4006ccf5-953e-4f1f-8d6a-b9a70f518594
UPDATE sales_order_items
SET linkme_selection_item_id = '4006ccf5-953e-4f1f-8d6a-b9a70f518594'
WHERE id = 'a3e2d6a0-2a99-49fd-bdc9-f6972a8ee4ba';

-- SUS-0006 (Suspension raphia 6): Link to selection (currently NULL)
-- Correct: 46242a54-80e0-4fca-a2b5-e0ed0e7b9f0a
UPDATE sales_order_items
SET linkme_selection_item_id = '46242a54-80e0-4fca-a2b5-e0ed0e7b9f0a'
WHERE id = '58a08ae2-fe52-4b46-b04a-0eb973d84c83';

-- SUS-0009 (Suspension frange n°3): Link to selection (currently NULL)
-- Correct: 7d5ecee7-1e49-4a39-b73d-75b07f8c14a2
UPDATE sales_order_items
SET linkme_selection_item_id = '7d5ecee7-1e49-4a39-b73d-75b07f8c14a2'
WHERE id = '313f09c9-f84d-4de4-9720-9b30080a801a';

-- =============================================================================
-- PART 2: Adjust prices in channel_pricing (5 products)
-- =============================================================================
-- Note: sync_channel_pricing_to_selections trigger will propagate to selections

-- COU-0007 (Coussin Blanc): Adjust down
-- Invoice price: 64.71 EUR vs Current: 65.29 EUR
UPDATE channel_pricing
SET public_price_ht = 64.71
WHERE product_id = '48ccd5af-b90c-47bd-9c8e-5e8bb5d48ad3'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- DCO-0005 (Lots 4 miroirs): Adjust up
-- Invoice price: 376.59 EUR vs Current: 314.38 EUR
UPDATE channel_pricing
SET public_price_ht = 376.59
WHERE product_id = 'c81b12b8-8f91-4b28-a2c5-df70c89e3cb0'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0003 (Suspension paille): Adjust up
-- Invoice price: 98.69 EUR vs Current: 66.64 EUR
UPDATE channel_pricing
SET public_price_ht = 98.69
WHERE product_id = 'ec12e634-ea89-4c6e-86d5-1f8e3d7c86a9'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0005 (Suspension raphia 5): Adjust up
-- Invoice price: 192.78 EUR vs Current: 148.21 EUR
UPDATE channel_pricing
SET public_price_ht = 192.78
WHERE product_id = 'e7c8c7bb-cfbe-45ec-8617-5d8ca892d9b7'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- SUS-0007 (Suspension raphia 3): Adjust up
-- Invoice price: 174.94 EUR vs Current: 133.22 EUR
UPDATE channel_pricing
SET public_price_ht = 174.94
WHERE product_id = 'd2e8b1d8-a2e5-4c8e-9f1b-8e7d6c5b4a3c'
  AND channel_id = '93c68db1-5a30-4168-89ec-6383152be405';

-- =============================================================================
-- PART 3: Recalculate commissions (all LINK-230002 items)
-- =============================================================================
-- Uses existing formula: (selling_price_ht - base_price_ht) × quantity

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

-- =============================================================================
-- VERIFICATION: Final check (all items should have correct commission)
-- =============================================================================
-- Run this manually to verify:
/*
SELECT
  p.sku,
  soi.quantity,
  soi.unit_price_ht as prix_facture,
  lsi.selling_price_ht as prix_selection,
  soi.retrocession_amount as commission_db,
  ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2) as commission_attendue,
  CASE
    WHEN ABS(soi.retrocession_amount - ROUND((lsi.selling_price_ht - lsi.base_price_ht) * soi.quantity, 2)) < 0.01 THEN 'OK'
    ELSE 'ERREUR'
  END as statut
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
JOIN products p ON p.id = soi.product_id
LEFT JOIN linkme_selection_items lsi ON lsi.id = soi.linkme_selection_item_id
WHERE so.order_number = 'LINK-230002'
ORDER BY p.sku;
*/
