-- =============================================
-- SCRIPT: Création Données Test
-- Date: 2025-10-13
-- Objectif: Créer données test propres pour validation workflows
-- =============================================

\echo '========================================'
\echo 'PHASE 2: CRÉATION DONNÉES TEST'
\echo '========================================'
\echo ''

-- =============================================
-- IDs CONSTANTS (récupérés de la base)
-- =============================================

-- Produits (3 Fauteuil Milo)
-- '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55'  -- Milo Beige
-- 'c189cf72-c980-4ed6-9ee7-3de805c6ab9a'  -- Milo Blanc
-- 'cd10eeb2-5e9b-4016-bdeb-a7119d935956'  -- Milo Bleu

-- Organisations
-- '988ba9d8-1007-45b3-a311-0c88e75c5915'  -- Supplier: Linhai Newlanston
-- '04f4ec68-9f78-425e-ad11-aef18d2a10d2'  -- Customer: Pokawa Lille

-- User
-- '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'  -- catalog-manager-test@verone.com

-- =============================================
-- PURCHASE ORDERS (3 scénarios)
-- =============================================

\echo '=== CRÉATION PURCHASE ORDERS ==='
\echo ''

-- PO-TEST-001 : Workflow complet (Draft → Confirmed → Received)
\echo '1. Création PO-TEST-001 (Milo Beige, 20 unités)'
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by,
  validated_by
) VALUES (
  'PO-TEST-001',
  '988ba9d8-1007-45b3-a311-0c88e75c5915',
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, po_number, status;

-- Ligne PO-TEST-001
INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-001'),
  '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55',  -- Milo Beige
  20,
  100.00  -- Prix unitaire HT
)
RETURNING quantity;

\echo ''

-- PO-TEST-002 : Annulation (Draft → Confirmed → Cancelled)
\echo '2. Création PO-TEST-002 (Milo Blanc, 15 unités)'
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by,
  validated_by
) VALUES (
  'PO-TEST-002',
  '988ba9d8-1007-45b3-a311-0c88e75c5915',
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, po_number, status;

INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-002'),
  'c189cf72-c980-4ed6-9ee7-3de805c6ab9a',  -- Milo Blanc
  15,
  100.00
)
RETURNING quantity;

\echo ''

-- PO-TEST-003 : En attente (Draft → Confirmed)
\echo '3. Création PO-TEST-003 (Milo Bleu, 10 unités)'
INSERT INTO purchase_orders (
  po_number,
  supplier_id,
  status,
  created_by,
  validated_by
) VALUES (
  'PO-TEST-003',
  '988ba9d8-1007-45b3-a311-0c88e75c5915',
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, po_number, status;

INSERT INTO purchase_order_items (
  purchase_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-003'),
  'cd10eeb2-5e9b-4016-bdeb-a7119d935956',  -- Milo Bleu
  10,
  100.00
)
RETURNING quantity;

\echo ''
\echo '========================================'

-- =============================================
-- SALES ORDERS (3 scénarios)
-- =============================================

\echo ''
\echo '=== CRÉATION SALES ORDERS ==='
\echo ''

-- SO-TEST-001 : Workflow complet (Draft → Validated → Shipped)
\echo '1. Création SO-TEST-001 (Milo Beige, 5 unités)'
INSERT INTO sales_orders (
  order_number,
  customer_id,
  customer_type,
  status,
  created_by
) VALUES (
  'SO-TEST-001',
  '04f4ec68-9f78-425e-ad11-aef18d2a10d2',  -- Pokawa Lille
  'organization',  -- Type client
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, order_number, status;

-- Ligne SO-TEST-001
INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-001'),
  '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55',  -- Milo Beige
  5,
  150.00  -- Prix vente HT
)
RETURNING quantity;

\echo ''

-- SO-TEST-002 : Annulation (Draft → Validated → Cancelled)
\echo '2. Création SO-TEST-002 (Milo Blanc, 8 unités)'
INSERT INTO sales_orders (
  order_number,
  customer_id,
  customer_type,
  status,
  created_by
) VALUES (
  'SO-TEST-002',
  '04f4ec68-9f78-425e-ad11-aef18d2a10d2',
  'b2b',
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, order_number, status;

INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-002'),
  'c189cf72-c980-4ed6-9ee7-3de805c6ab9a',  -- Milo Blanc
  8,
  150.00
)
RETURNING quantity;

\echo ''

-- SO-TEST-003 : En attente (Draft → Validated)
\echo '3. Création SO-TEST-003 (Milo Bleu, 3 unités)'
INSERT INTO sales_orders (
  order_number,
  customer_id,
  customer_type,
  status,
  created_by
) VALUES (
  'SO-TEST-003',
  '04f4ec68-9f78-425e-ad11-aef18d2a10d2',
  'b2b',
  'draft',
  '9eb44c44-16b6-4605-9a1a-5380b58c8ab2'
)
RETURNING id, order_number, status;

INSERT INTO sales_order_items (
  sales_order_id,
  product_id,
  quantity,
  unit_price_ht
) VALUES (
  (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-003'),
  'cd10eeb2-5e9b-4016-bdeb-a7119d935956',  -- Milo Bleu
  3,
  150.00
)
RETURNING quantity;

\echo ''
\echo '========================================'

-- =============================================
-- VALIDATION CRÉATION
-- =============================================

\echo ''
\echo '=== VALIDATION DONNÉES CRÉÉES ==='
\echo ''

\echo '--- Purchase Orders créés ---'
SELECT
  po_number,
  status,
  (SELECT name FROM organisations WHERE id = supplier_id) as supplier
FROM purchase_orders
WHERE po_number LIKE 'PO-TEST%'
ORDER BY po_number;

\echo ''
\echo '--- Purchase Order Items ---'
SELECT
  po.po_number,
  p.name as product,
  poi.quantity
FROM purchase_order_items poi
JOIN purchase_orders po ON po.id = poi.purchase_order_id
JOIN products p ON p.id = poi.product_id
WHERE po.po_number LIKE 'PO-TEST%'
ORDER BY po.po_number;

\echo ''
\echo '--- Sales Orders créés ---'
SELECT
  order_number,
  status,
  (SELECT name FROM organisations WHERE id = customer_id) as customer
FROM sales_orders
WHERE order_number LIKE 'SO-TEST%'
ORDER BY order_number;

\echo ''
\echo '--- Sales Order Items ---'
SELECT
  so.order_number,
  p.name as product,
  soi.quantity
FROM sales_order_items soi
JOIN sales_orders so ON so.id = soi.sales_order_id
JOIN products p ON p.id = soi.product_id
WHERE so.order_number LIKE 'SO-TEST%'
ORDER BY so.order_number;

\echo ''
\echo '--- Stocks produits (doivent être 0) ---'
SELECT
  name,
  stock_real,
  stock_quantity,
  stock_forecasted_in,
  stock_forecasted_out
FROM products
WHERE id IN (
  '25d2e61c-18d5-45a8-aec5-2a18f1b9cb55',
  'c189cf72-c980-4ed6-9ee7-3de805c6ab9a',
  'cd10eeb2-5e9b-4016-bdeb-a7119d935956'
)
ORDER BY name;

\echo ''
\echo '--- Compteurs ---'
SELECT 'Purchase Orders' as type, COUNT(*) as count FROM purchase_orders WHERE po_number LIKE 'PO-TEST%'
UNION ALL
SELECT 'Sales Orders', COUNT(*) FROM sales_orders WHERE order_number LIKE 'SO-TEST%'
UNION ALL
SELECT 'Stock Movements', COUNT(*) FROM stock_movements;

\echo ''
\echo '✅ Script create_test_data.sql terminé'
\echo ''
