/**
 * 🧪 SCRIPT TEST: Mouvements Stock Partiels
 *
 * Date: 2025-10-18
 * Migration testée: 20251018_001_enable_partial_stock_movements.sql
 *
 * OBJECTIF: Valider que les triggers gèrent correctement les scénarios:
 * - Réceptions partielles (PO partially_received)
 * - Expéditions partielles (SO partially_shipped)
 *
 * PRODUIT TEST: Fauteuil Milo - Bleu (cb45e989-981a-46fe-958d-bd3b81f12e8b)
 * Stock initial: stock_real=35, stock_forecasted_in=1, stock_forecasted_out=1
 */

-- ===========================================================================
-- SCÉNARIO 1: RÉCEPTION PARTIELLE COMMANDE FOURNISSEUR (PO)
-- ===========================================================================

-- État initial produit
SELECT
    'ÉTAT INITIAL' as phase,
    id,
    name,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    stock_quantity
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

-- Créer une commande fournisseur test (100 unités)
-- Note: Remplacer 'supplier_id_test' par un vrai supplier_id de votre database
/*
INSERT INTO purchase_orders (
    po_number,
    supplier_id,
    status,
    total_ht,
    total_ttc,
    created_by
) VALUES (
    'PO-TEST-PARTIAL-001',
    '00000000-0000-0000-0000-000000000000',  -- À remplacer
    'draft',
    5000.00,
    6000.00,
    '100d2439-0f52-46b1-9c30-ad7934b44719'  -- User ID Romeo
) RETURNING *;
*/

-- Ajouter items commande (utiliser PO id retourné ci-dessus)
/*
INSERT INTO purchase_order_items (
    purchase_order_id,
    product_id,
    quantity,
    quantity_received,  -- Important: Initialement 0
    unit_price_ht
) VALUES (
    '<po_id_from_above>',
    'cb45e989-981a-46fe-958d-bd3b81f12e8b',  -- Fauteuil Milo Bleu
    100,  -- Quantité commandée
    0,    -- Rien reçu encore
    50.00
);
*/

-- ✅ TEST 1: Confirmation commande → Prévisionnel +100
/*
UPDATE purchase_orders
SET status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = '100d2439-0f52-46b1-9c30-ad7934b44719'
WHERE po_number = 'PO-TEST-PARTIAL-001';

-- Vérifier stock après confirmation
SELECT
    'APRÈS CONFIRMATION PO' as phase,
    stock_real,  -- Doit rester 35
    stock_forecasted_in,  -- Doit être 101 (1 initial + 100 nouveau)
    stock_forecasted_out,  -- Doit rester 1
    stock_quantity  -- Doit être 135 (35 + 101 - 1)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ✅ TEST 2: Réception partielle 40 unités → Status partially_received
/*
UPDATE purchase_order_items
SET quantity_received = 40
WHERE purchase_order_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE purchase_orders
SET status = 'partially_received',
    received_by = '100d2439-0f52-46b1-9c30-ad7934b44719'
WHERE po_number = 'PO-TEST-PARTIAL-001';

-- Vérifier stock après réception partielle
SELECT
    'APRÈS RÉCEPTION PARTIELLE 40/100' as phase,
    stock_real,  -- Doit être 75 (35 + 40)
    stock_forecasted_in,  -- Doit être 61 (101 - 40)
    stock_forecasted_out,  -- Doit rester 1
    stock_quantity  -- Doit être 135 (75 + 61 - 1)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

-- Vérifier mouvements stock créés
SELECT
    'MOUVEMENTS RÉCEPTION PARTIELLE' as phase,
    movement_type,
    quantity_change,
    affects_forecast,
    forecast_type,
    notes
FROM stock_movements
WHERE product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b'
AND reference_type = 'purchase_order'
AND reference_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001')
ORDER BY performed_at DESC
LIMIT 5;
*/

-- ✅ TEST 3: Réception partielle 35 unités supplémentaires
/*
UPDATE purchase_order_items
SET quantity_received = 75  -- 40 + 35 = 75 total reçu
WHERE purchase_order_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE purchase_orders
SET status = 'partially_received',
    received_by = '100d2439-0f52-46b1-9c30-ad7934b44719'
WHERE po_number = 'PO-TEST-PARTIAL-001';

-- Vérifier stock après 2ème réception partielle
SELECT
    'APRÈS RÉCEPTION PARTIELLE 75/100' as phase,
    stock_real,  -- Doit être 110 (35 + 75)
    stock_forecasted_in,  -- Doit être 26 (101 - 75)
    stock_forecasted_out,  -- Doit rester 1
    stock_quantity  -- Doit être 135 (110 + 26 - 1)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ✅ TEST 4: Réception finale 25 unités → Status received
/*
UPDATE purchase_order_items
SET quantity_received = 100  -- Tout reçu
WHERE purchase_order_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE purchase_orders
SET status = 'received',
    received_by = '100d2439-0f52-46b1-9c30-ad7934b44719'
WHERE po_number = 'PO-TEST-PARTIAL-001';

-- Vérifier stock après réception complète
SELECT
    'APRÈS RÉCEPTION COMPLÈTE 100/100' as phase,
    stock_real,  -- Doit être 135 (35 + 100)
    stock_forecasted_in,  -- Doit être 1 (101 - 100, reste celui d'avant)
    stock_forecasted_out,  -- Doit rester 1
    stock_quantity  -- Doit être 135 (135 + 1 - 1)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ===========================================================================
-- SCÉNARIO 2: EXPÉDITION PARTIELLE COMMANDE CLIENT (SO)
-- ===========================================================================

-- ✅ TEST 5: Créer commande client (50 unités)
/*
INSERT INTO sales_orders (
    order_number,
    customer_id,
    status,
    total_ht,
    total_ttc,
    created_by
) VALUES (
    'SO-TEST-PARTIAL-001',
    '00000000-0000-0000-0000-000000000000',  -- À remplacer
    'draft',
    2500.00,
    3000.00,
    '100d2439-0f52-46b1-9c30-ad7934b44719'
) RETURNING *;

INSERT INTO sales_order_items (
    sales_order_id,
    product_id,
    quantity,
    quantity_shipped,  -- Initialement 0
    unit_price_ht
) VALUES (
    '<so_id_from_above>',
    'cb45e989-981a-46fe-958d-bd3b81f12e8b',
    50,
    0,
    50.00
);

-- Confirmer commande client
UPDATE sales_orders
SET status = 'confirmed',
    confirmed_at = NOW(),
    confirmed_by = '100d2439-0f52-46b1-9c30-ad7934b44719'
WHERE order_number = 'SO-TEST-PARTIAL-001';

-- Vérifier stock après confirmation SO
SELECT
    'APRÈS CONFIRMATION SO' as phase,
    stock_real,  -- Doit rester 135
    stock_forecasted_in,  -- Doit rester 1
    stock_forecasted_out,  -- Doit être 51 (1 + 50)
    stock_quantity  -- Doit être 85 (135 + 1 - 51)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ✅ TEST 6: Expédition partielle 20 unités
/*
UPDATE sales_order_items
SET quantity_shipped = 20
WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE sales_orders
SET status = 'partially_shipped',
    warehouse_exit_at = NOW()
WHERE order_number = 'SO-TEST-PARTIAL-001';

-- Vérifier stock après expédition partielle
SELECT
    'APRÈS EXPÉDITION PARTIELLE 20/50' as phase,
    stock_real,  -- Doit être 115 (135 - 20)
    stock_forecasted_in,  -- Doit rester 1
    stock_forecasted_out,  -- Doit rester 51
    stock_quantity  -- Doit être 65 (115 + 1 - 51)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

-- Vérifier mouvements stock expédition partielle
SELECT
    'MOUVEMENTS EXPÉDITION PARTIELLE' as phase,
    movement_type,
    quantity_change,
    affects_forecast,
    notes
FROM stock_movements
WHERE product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b'
AND reference_type = 'sales_order'
AND reference_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001')
ORDER BY performed_at DESC
LIMIT 5;
*/

-- ✅ TEST 7: Expédition partielle 15 unités supplémentaires
/*
UPDATE sales_order_items
SET quantity_shipped = 35  -- 20 + 15 = 35 total expédié
WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE sales_orders
SET status = 'partially_shipped'
WHERE order_number = 'SO-TEST-PARTIAL-001';

-- Vérifier stock
SELECT
    'APRÈS EXPÉDITION PARTIELLE 35/50' as phase,
    stock_real,  -- Doit être 100 (115 - 15)
    stock_forecasted_in,
    stock_forecasted_out,
    stock_quantity
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ✅ TEST 8: Expédition finale 15 unités → shipped
/*
UPDATE sales_order_items
SET quantity_shipped = 50  -- Tout expédié
WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001')
AND product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';

UPDATE sales_orders
SET status = 'shipped'
WHERE order_number = 'SO-TEST-PARTIAL-001';

-- Vérifier stock final
SELECT
    'APRÈS EXPÉDITION COMPLÈTE 50/50' as phase,
    stock_real,  -- Doit être 85 (100 - 15)
    stock_forecasted_in,  -- Doit rester 1
    stock_forecasted_out,  -- Doit rester 51
    stock_quantity  -- Doit être 35 (85 + 1 - 51)
FROM products
WHERE id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b';
*/

-- ===========================================================================
-- NETTOYAGE (À exécuter après tests pour ne pas polluer database)
-- ===========================================================================

/*
-- Supprimer commandes test
DELETE FROM sales_order_items WHERE sales_order_id = (SELECT id FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001');
DELETE FROM sales_orders WHERE order_number = 'SO-TEST-PARTIAL-001';

DELETE FROM purchase_order_items WHERE purchase_order_id = (SELECT id FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001');
DELETE FROM purchase_orders WHERE po_number = 'PO-TEST-PARTIAL-001';

-- Supprimer mouvements stock test
DELETE FROM stock_movements WHERE product_id = 'cb45e989-981a-46fe-958d-bd3b81f12e8b' AND notes LIKE '%TEST%';
*/

-- ===========================================================================
-- RÉSULTATS ATTENDUS (Documentation)
-- ===========================================================================

/*
SCÉNARIO RÉCEPTION PARTIELLE PO (100 unités):
  Initial: stock_real=35, forecasted_in=1
  Confirmé: stock_real=35, forecasted_in=101 (+100)
  Reçu 40: stock_real=75 (+40), forecasted_in=61 (-40)
  Reçu 75 total: stock_real=110 (+35), forecasted_in=26 (-35)
  Reçu 100 total: stock_real=135 (+25), forecasted_in=1 (-25)

SCÉNARIO EXPÉDITION PARTIELLE SO (50 unités):
  Confirmé: forecasted_out=51 (+50)
  Expédié 20: stock_real=115 (-20)
  Expédié 35 total: stock_real=100 (-15)
  Expédié 50 total: stock_real=85 (-15)

✅ VALIDATION:
- Mouvements différentiels uniquement (pas de duplication)
- Stock prévisionnel converti progressivement en réel
- Triggers exécutés sans erreur
- Historique complet dans stock_movements
*/
