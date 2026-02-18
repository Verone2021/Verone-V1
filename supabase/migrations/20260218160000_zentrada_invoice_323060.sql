-- ============================================================================
-- Migration: Nettoyage Zentrada + Saisie facture 323060
-- Date: 2026-02-18
-- Description:
--   - Supprime données obsolètes (21 produits incomplets, org doublon)
--   - Consolide fournisseur Zentrada (1 seule organisation)
--   - Crée 24 produits conformes à la facture 323060 (11.11.2025)
--   - Crée PO 919055 avec 24 lignes
--   - Crée mouvements stock IN pour les 21 produits livrés
--
-- NOTE: Cette migration a été appliquée manuellement via execute_sql.
--       Ce fichier sert de documentation et traçabilité.
-- ============================================================================

-- ===========================================
-- ÉTAPE 1 : NETTOYAGE
-- ===========================================

-- 1a. Supprimer mouvements de stock (PRD-0084, PRD-0085)
DELETE FROM stock_movements
WHERE product_id IN (
  'dcb0f1a8-9d11-42ec-8075-0650664710cd',
  'cdb453f5-064b-4068-95aa-140a086a7a46'
);

-- 1b. Supprimer les 21 produits Zentrada existants
DELETE FROM products
WHERE supplier_id = '16ccbe2e-85e4-41ad-8d46-70520afc0fa1';

-- 1c. Migrer matching rule vers org consolidée
UPDATE matching_rules SET
  organisation_id = '16ccbe2e-85e4-41ad-8d46-70520afc0fa1',
  display_label = 'Zentrada'
WHERE id = '86ae18bf-b9c1-4504-a6a8-f68820de1741';

-- 1d. Migrer bank_transactions vers org consolidée (avec context bypass)
SET LOCAL app.apply_rule_context = 'true';
UPDATE bank_transactions SET
  counterparty_organisation_id = '16ccbe2e-85e4-41ad-8d46-70520afc0fa1'
WHERE counterparty_organisation_id = '7248b1bd-3a42-4478-bf32-0094f07f9f27';

-- 1e. Supprimer l'organisation doublon "zentrada Europe"
DELETE FROM organisations WHERE id = '7248b1bd-3a42-4478-bf32-0094f07f9f27';

-- 1f. Mettre à jour l'organisation "Zentrada" conservée
UPDATE organisations SET
  legal_name = 'zentrada Europe GmbH & Co KG',
  trade_name = 'Zentrada',
  email = 'service@zentrada.fr',
  phone = '0170 61 75 87',
  type = 'supplier',
  is_active = true,
  updated_at = now()
WHERE id = '16ccbe2e-85e4-41ad-8d46-70520afc0fa1';

-- ===========================================
-- ÉTAPE 2 : CRÉER 24 PRODUITS (facture 323060)
-- ===========================================

-- 21 produits livrés (status = active)
INSERT INTO products (sku, name, brand, supplier_reference, gtin, cost_price, weight, supplier_id, product_status, stock_real, condition) VALUES
('ZEN-0001', 'Cadre photo naturel eva 30x40 dis beige', 'atmosphera', '121158C', '3560239403708', 5.83, 1.46, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0002', 'Suspension ppr etel naturel d37.5 beige', 'atmosphera', '168210', '3560238704189', 46.66, 3.10, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0003', 'Miroir raphia tropi 43x29 beige moyen', 'atmosphera', '185833', '3560231553937', 12.05, 0.80, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0004', 'Deco mural raphia alba 91x64 beige', 'atmosphera', '188044', '3560231647278', 33.53, 3.85, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0005', 'Miroir raphia alba x3 beige', 'atmosphera', '182058', '3560237591650', 30.78, 1.32, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0006', 'Deco mural raphia alaina d64 beige moyen', 'atmosphera', '179491', '3560237554051', 19.05, 1.63, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0007', 'Deco mural raphia oasis x2 beige', 'atmosphera', '182081', '3560237591988', 19.44, 0.88, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0008', 'Miroir tresse d68 celia beige lin', 'atmosphera', '179431', '3560237553566', 21.06, 3.08, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0009', 'Miroir roseau ael d80 beige', 'atmosphera', '182053', '3560237591605', 19.04, 1.93, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0010', 'Miroir deco contour dore losange h60cm', 'HOME DECO FACTORY', 'HD0113', '3664944523215', 12.72, 2.07, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0011', 'Miroir deco contour deco dore losange', 'HOME DECO FACTORY', 'HD4385', '3664944389248', 8.75, 0.75, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0012', 'Lampe campignon lito beige h24.5', 'atmosphera', '210363C', '3560231013554', 10.66, 0.80, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0013', 'Table metal D31H46cm caramel', 'Florissima', '76500', '4042831206875', 30.98, NULL, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0014', 'Lampe campignon lito noir h24.5', 'atmosphera', '210363A', '3560231098858', 10.66, 0.80, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0015', 'Table basse aeris beige', 'atmosphera', '185028', '3560231638634', 218.70, 30.50, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0016', 'Miroir metal warren or d24 x3 dore', 'atmosphera', '206476', '3560233538277', 11.34, 1.02, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0017', 'Miroir plast orga roman 30x39 dore', 'atmosphera', '197614', '3560232689796', 4.57, 1.04, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0018', 'Organiseur coulissant bambou PM', 'Five', '167732', '3560238691441', 3.05, 0.38, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0019', 'Organiseur coulissant bambou MM', 'Five', '167733', '3560238691458', 5.35, 0.68, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0020', 'Miroir raphia safari d38 beige', 'atmosphera', '174135', '3560237549743', 7.61, 0.62, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new'),
('ZEN-0021', 'Miroir raphia alba d57 beige', 'atmosphera', '173839', '3560233816221', 22.62, 2.83, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'active', 0, 'new');

-- 3 produits non livrés (status = draft)
INSERT INTO products (sku, name, brand, supplier_reference, gtin, cost_price, weight, supplier_id, product_status, stock_real, condition) VALUES
('ZEN-0022', 'Lampe campignon lito terracotta h24.5', 'atmosphera', '210363F', '3560231013585', 10.66, 0.75, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'draft', 0, 'new'),
('ZEN-0023', 'Lampe campignon lito vert fonce h24.5', 'atmosphera', '210363D', '3560231013561', 10.66, 0.75, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'draft', 0, 'new'),
('ZEN-0024', 'Lampe campignon lito ocre h24.5', 'atmosphera', '210363H', '3560231013608', 10.66, 0.80, '16ccbe2e-85e4-41ad-8d46-70520afc0fa1', 'draft', 0, 'new');

-- ===========================================
-- ÉTAPE 3 : CRÉER PO 919055
-- ===========================================

INSERT INTO purchase_orders (
  po_number, supplier_id, order_date, status, currency, tax_rate,
  created_by, received_by, received_at, notes
) VALUES (
  '919055',
  '16ccbe2e-85e4-41ad-8d46-70520afc0fa1',
  '2025-10-28',
  'partially_received',
  'EUR',
  0.20,
  '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0',
  '628e94b2-9cf8-43e6-a00e-bf5e2aee64d0',
  '2025-11-11',
  'Facture Zentrada 323060 du 11.11.2025. 21/24 articles livrés (3 lampes non livrées).'
);

-- PO items sont insérés avec les product IDs générés ci-dessus
-- (dans l'exécution réelle, les IDs sont dynamiques)

-- ===========================================
-- ÉTAPE 4 : MOUVEMENTS STOCK IN (21 livrés)
-- ===========================================

-- Les mouvements de stock sont insérés via SELECT sur purchase_order_items
-- avec quantity_received > 0, reference_type = 'purchase_order_item'
-- Les triggers automatiques mettent à jour:
--   - products.stock_real via trg_sync_product_stock_after_movement
--   - products.cost_net_avg / cost_price_avg via trigger_update_cost_price_pmp
--   - purchase_order_items.unit_cost_net via trigger_allocate_po_fees
--   - purchase_orders totals via recalculate_purchase_order_totals_trigger
