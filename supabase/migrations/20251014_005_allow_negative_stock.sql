-- =============================================
-- MIGRATION 005: Autoriser Stocks Négatifs (Backorders)
-- Date: 2025-10-14
-- =============================================
-- Objectif: Permettre stocks négatifs pour gérer backorders selon meilleures pratiques ERP 2025
-- Justification: Systèmes modernes (NetSuite, Fishbowl, etc.) utilisent stock négatif = commandes en attente
-- Impact: Suppression 4 contraintes CHECK bloquant création commandes avec stock insuffisant

\echo '========================================';
\echo 'SUPPRESSION: Contraintes CHECK Stocks Négatifs';
\echo '========================================';
\echo '';

-- =============================================
-- STATISTIQUES AVANT SUPPRESSION
-- =============================================

\echo '=== AVANT: Contraintes actives sur products ===';
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND contype = 'c'
AND conname IN (
    'stock_non_negative',
    'products_stock_real_check',
    'products_stock_forecasted_in_check',
    'products_stock_forecasted_out_check'
);

\echo '';
\echo '=== Stocks actuels (aperçu 5 produits) ===';
SELECT
    sku,
    name,
    stock_quantity,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_disponible
FROM products
WHERE archived_at IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- SUPPRESSION CONTRAINTES CHECK
-- =============================================

\echo '';
\echo '=== Suppression des contraintes CHECK ===';

-- Contrainte 1: stock_quantity >= 0
ALTER TABLE products
DROP CONSTRAINT IF EXISTS stock_non_negative;

\echo '✅ Contrainte stock_non_negative supprimée';

-- Contrainte 2: stock_real >= 0
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_stock_real_check;

\echo '✅ Contrainte products_stock_real_check supprimée';

-- Contrainte 3: stock_forecasted_in >= 0
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_stock_forecasted_in_check;

\echo '✅ Contrainte products_stock_forecasted_in_check supprimée';

-- Contrainte 4: stock_forecasted_out >= 0
ALTER TABLE products
DROP CONSTRAINT IF EXISTS products_stock_forecasted_out_check;

\echo '✅ Contrainte products_stock_forecasted_out_check supprimée';

-- =============================================
-- DOCUMENTATION ET JUSTIFICATION
-- =============================================

COMMENT ON COLUMN products.stock_quantity IS
'Stock total actuel (legacy - remplacé par stock_real).
⚠️ Peut être NÉGATIF = Backorders (commandes en attente de réapprovisionnement).
Conforme meilleures pratiques ERP 2025 (NetSuite, Fishbowl, etc.)';

COMMENT ON COLUMN products.stock_real IS
'Stock physique réellement présent en entrepôt.
⚠️ Peut être NÉGATIF = Backorders (stock vendu avant réception).
Workflow: Stock négatif → Alert dashboard → Réapprovisionnement automatique.
Exemple: stock_real = -5 → 5 unités vendues en attente de livraison fournisseur.';

COMMENT ON COLUMN products.stock_forecasted_in IS
'Stock prévu en entrée (commandes fournisseurs en transit).
⚠️ Peut être NÉGATIF si annulations prévisionnelles > ajouts.
Calcul: SUM(stock_movements WHERE affects_forecast=true AND forecast_type=''in'')';

COMMENT ON COLUMN products.stock_forecasted_out IS
'Stock prévu en sortie (commandes clients validées non expédiées).
⚠️ Peut être NÉGATIF si annulations commandes > réservations.
Calcul: ABS(SUM(stock_movements WHERE affects_forecast=true AND forecast_type=''out''))';

-- =============================================
-- STATISTIQUES APRÈS SUPPRESSION
-- =============================================

\echo '';
\echo '=== APRÈS: Vérification suppression contraintes ===';
SELECT
    COUNT(*) as contraintes_restantes
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND contype = 'c'
AND conname IN (
    'stock_non_negative',
    'products_stock_real_check',
    'products_stock_forecasted_in_check',
    'products_stock_forecasted_out_check'
);

\echo '';
\echo '=== Validation: Colonnes stocks acceptent maintenant valeurs négatives ===';
\echo 'Types de données après suppression contraintes:';
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('stock_quantity', 'stock_real', 'stock_forecasted_in', 'stock_forecasted_out')
ORDER BY ordinal_position;

-- =============================================
-- TESTS DE VALIDATION (Commentés - à décommenter pour tester)
-- =============================================

/*
-- Test 1: Insérer produit avec stock négatif (backorder)
INSERT INTO products (sku, name, price_ht, stock_real, stock_quantity)
VALUES ('TEST-BACKORDER-001', 'Test Produit Backorder', 99.99, -10, -10);

-- Test 2: Mettre à jour stock existant en négatif
UPDATE products
SET stock_real = -5, stock_quantity = -5
WHERE sku = 'FAUTEUIL-MILO-BEIGE';

-- Test 3: Vérifier calculs avec stocks négatifs
SELECT
    sku,
    stock_real,
    stock_forecasted_in,
    stock_forecasted_out,
    (stock_real + stock_forecasted_in - stock_forecasted_out) as stock_disponible_calcule
FROM products
WHERE stock_real < 0 OR stock_quantity < 0;
*/

-- =============================================
-- RÉSUMÉ MIGRATION
-- =============================================

\echo '';
\echo '========================================';
\echo '✅ Migration 005 terminée avec succès';
\echo '========================================';
\echo '';
\echo '📦 BACKORDERS AUTORISÉS:';
\echo '  • Stock négatif = Commandes en attente';
\echo '  • Workflow: Vendre → Stock négatif → Réapprovisionner';
\echo '  • Conforme standards ERP 2025 (NetSuite, Fishbowl)';
\echo '';
\echo '🔓 CONTRAINTES SUPPRIMÉES:';
\echo '  1. stock_non_negative (stock_quantity >= 0)';
\echo '  2. products_stock_real_check (stock_real >= 0)';
\echo '  3. products_stock_forecasted_in_check (stock_forecasted_in >= 0)';
\echo '  4. products_stock_forecasted_out_check (stock_forecasted_out >= 0)';
\echo '';
\echo '🎯 IMPACTS POSITIFS:';
\echo '  ✅ Commandes validables même stock = 0';
\echo '  ✅ Pas de blocage création commandes';
\echo '  ✅ Gestion transparente backorders';
\echo '  ✅ Dashboard alerte stocks négatifs';
\echo '';
\echo '🔄 WORKFLOWS DÉBLOQUÉS:';
\echo '  • draft → confirmed (réservation prévisionnel)';
\echo '  • confirmed → warehouse_exit (déduction stock réel)';
\echo '  • Annulations commandes (restauration stock)';
\echo '';
\echo '🧪 TESTS REQUIS:';
\echo '  1. Créer commande produit stock = 0';
\echo '  2. Valider commande (draft → confirmed)';
\echo '  3. Vérifier stock_real devient négatif';
\echo '  4. Confirmer pas d''erreur console/database';
\echo '';
\echo '========================================';
