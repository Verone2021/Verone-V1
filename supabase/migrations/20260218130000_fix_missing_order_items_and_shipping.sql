-- Migration: Add missing order items and shipping costs
-- Verified against original invoice PDFs in docs/Vente-2025/

-- ============================================================
-- 1. Add missing product lines (sales_order_items)
-- ============================================================

-- F-25-011: Philippe Chretien - Lampe Atomic chromé (LAM-0002) - 54.17€ HT
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price_ht)
SELECT so.id, 'f28a7d0b-b44c-4a58-8471-1c82e77bb177', 1, 54.17
FROM sales_orders so WHERE so.order_number = 'F-25-011'
AND NOT EXISTS (SELECT 1 FROM sales_order_items soi WHERE soi.sales_order_id = so.id);

-- F-25-013: Karine Lefeuvre - Fauteuil Eve tissu bouclette jaune (FAU-0009) - 166.67€ HT
INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price_ht)
SELECT so.id, '8ac8e4dc-8867-443c-b785-a91bd0259962', 1, 166.67
FROM sales_orders so WHERE so.order_number = 'F-25-013'
AND NOT EXISTS (SELECT 1 FROM sales_order_items soi WHERE soi.sales_order_id = so.id);

-- ============================================================
-- 2. Add shipping costs (frais de livraison / service)
-- These are service fees, not product lines
-- Trigger trig_so_charges_recalc recalculates total_ttc
-- ============================================================

-- F-25-004: Pokawa Mazarine - Frais livraison 150€ HT (180€ TTC)
UPDATE sales_orders SET total_ht = 0, shipping_cost_ht = 150.00
WHERE order_number = 'F-25-004';

-- F-25-014: Pokawa Toulouse - Frais livraison 450€ HT (540€ TTC)
UPDATE sales_orders SET total_ht = 0, shipping_cost_ht = 450.00
WHERE order_number = 'F-25-014';

-- F-25-037: Pokawa Lebon - Frais livraison 300€ HT (360€ TTC) - was 0€ in DB
UPDATE sales_orders SET total_ht = 0, shipping_cost_ht = 300.00
WHERE order_number = 'F-25-037';

-- F-25-046: Pokawa Aix-en-Provence - Frais livraison 450€ HT (540€ TTC)
UPDATE sales_orders SET total_ht = 0, shipping_cost_ht = 450.00
WHERE order_number = 'F-25-046';
