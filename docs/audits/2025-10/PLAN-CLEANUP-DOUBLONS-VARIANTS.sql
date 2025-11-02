-- ============================================================================
-- PLAN CLEANUP DOUBLONS VARIANTS - FAUTEUIL MILO
-- ============================================================================
-- Date: 2025-11-01
-- Contexte: Investigation doublons produits Vert/Bleu dans variant_group
-- Référence: RAPPORT-INVESTIGATION-DOUBLON-FMIL-VERT.md
-- ============================================================================

-- ============================================================================
-- PARTIE 1: CLEANUP PRODUIT ORPHELIN (FMIL-VERT-22) - PRIORITÉ CRITIQUE
-- ============================================================================
-- Ce produit a été créé lors des tests Phase 3 et doit être supprimé
-- ⚠️ IMPORTANT: Exécuter en TRANSACTION pour rollback si erreur

BEGIN;

-- Étape 1.1: Vérifier le produit existe
SELECT 
    id, 
    sku, 
    name, 
    variant_group_id, 
    stock_real,
    created_at
FROM products 
WHERE sku = 'FMIL-VERT-22';
-- Expected: 1 row, variant_group_id = NULL, stock_real = 1040

-- Étape 1.2: Vérifier mouvements de stock (doivent être 10)
SELECT COUNT(*) as nb_mouvements
FROM stock_movements 
WHERE product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERT-22');
-- Expected: 10 mouvements

-- Étape 1.3: Supprimer TOUS les mouvements de stock
DELETE FROM stock_movements 
WHERE product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERT-22');
-- Expected: DELETE 10

-- Étape 1.4: Supprimer le produit orphelin
DELETE FROM products 
WHERE sku = 'FMIL-VERT-22';
-- Expected: DELETE 1

-- Étape 1.5: Vérifier suppression
SELECT COUNT(*) as reste_produit 
FROM products 
WHERE sku = 'FMIL-VERT-22';
-- Expected: 0

-- Si tout OK, commit. Sinon, ROLLBACK.
-- COMMIT;
ROLLBACK; -- Par sécurité, laisser ROLLBACK par défaut

-- ============================================================================
-- PARTIE 2: ANALYSE DOUBLONS "VERT" LÉGITIMES - DÉCISION BUSINESS REQUISE
-- ============================================================================
-- 2 produits "Vert" dans le variant_group légitime

-- Produits concernés:
SELECT 
    sku,
    name,
    variant_attributes->>'color' as couleur,
    variant_attributes->>'color_secondary' as couleur_secondaire,
    stock_real,
    created_at
FROM products
WHERE sku IN ('FMIL-VERT-01', 'FMIL-VERTF-11')
ORDER BY created_at;

-- OPTION A: Fusionner stocks vers FMIL-VERT-01 (plus ancien, stock plus élevé)
-- ⚠️ Nécessite décision business AVANT exécution

/*
BEGIN;

-- A.1: Calculer stock total
SELECT SUM(stock_real) as stock_total
FROM products
WHERE sku IN ('FMIL-VERT-01', 'FMIL-VERTF-11');
-- Expected: 5 + 3 = 8

-- A.2: Transférer stock vers FMIL-VERT-01
UPDATE products 
SET stock_real = 8,
    updated_at = NOW()
WHERE sku = 'FMIL-VERT-01';

-- A.3: Vérifier s'il y a des mouvements sur FMIL-VERTF-11
SELECT COUNT(*) FROM stock_movements 
WHERE product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERTF-11');

-- A.4: Si mouvements existent, les migrer vers FMIL-VERT-01
UPDATE stock_movements
SET product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERT-01')
WHERE product_id = (SELECT id FROM products WHERE sku = 'FMIL-VERTF-11');

-- A.5: Supprimer FMIL-VERTF-11
DELETE FROM products WHERE sku = 'FMIL-VERTF-11';

COMMIT;
*/

-- OPTION B: Distinguer avec color_secondary
-- ⚠️ Nécessite clarification nuances couleurs avec équipe produit

/*
BEGIN;

-- B.1: Renommer FMIL-VERTF-11 en "Vert Foncé"
UPDATE products 
SET variant_attributes = jsonb_set(
    variant_attributes, 
    '{color}', 
    '"Vert Foncé"'
),
updated_at = NOW()
WHERE sku = 'FMIL-VERTF-11';

-- B.2: Vérifier résultat
SELECT 
    sku, 
    variant_attributes->>'color' as couleur
FROM products
WHERE sku IN ('FMIL-VERT-01', 'FMIL-VERTF-11');

COMMIT;
*/

-- ============================================================================
-- PARTIE 3: ANALYSE DOUBLONS "BLEU" - DÉCISION BUSINESS REQUISE
-- ============================================================================
-- 3 produits "Bleu" détectés

SELECT 
    sku,
    name,
    variant_attributes->>'color' as couleur,
    variant_attributes->>'color_secondary' as couleur_secondaire,
    stock_real,
    created_at
FROM products
WHERE sku IN ('FMIL-BLEU-15', 'FMIL-BLEUI-09', 'FMIL-BLEUV-16')
ORDER BY stock_real DESC;

-- RECOMMANDATION: 
-- - FMIL-BLEUV-16 a déjà color_secondary = "Vert" → OK, distinct
-- - FMIL-BLEU-15 (125 unités) vs FMIL-BLEUI-09 (5 unités) → Fusionner ?
-- - OU distinguer avec nuances: "Bleu Clair" / "Bleu Indigo"

-- ============================================================================
-- PARTIE 4: PROTECTION FUTURE - CONTRAINTE UNIQUE SUR (variant_group, color)
-- ============================================================================
-- ⚠️ À exécuter APRÈS cleanup doublons

-- Migration future: supabase/migrations/20251102_001_variant_color_uniqueness.sql

/*
BEGIN;

-- Étape 1: Vérifier qu'il n'y a PLUS de doublons
SELECT 
    variant_group_id,
    variant_attributes->>'color' as couleur,
    COUNT(*) as nb_produits
FROM products
WHERE variant_group_id IS NOT NULL
GROUP BY variant_group_id, variant_attributes->>'color'
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Étape 2: Créer INDEX UNIQUE partiel
CREATE UNIQUE INDEX idx_products_variant_color_unique 
ON products (variant_group_id, (variant_attributes->>'color'))
WHERE variant_group_id IS NOT NULL;

-- Étape 3: Ajouter CHECK constraint (variant avec group doit avoir couleur)
ALTER TABLE products 
ADD CONSTRAINT check_variant_has_color 
CHECK (
  variant_group_id IS NULL 
  OR (variant_attributes ? 'color' AND variant_attributes->>'color' IS NOT NULL)
);

-- Étape 4: Tester la contrainte (doit échouer)
INSERT INTO products (sku, name, variant_group_id, variant_attributes) 
VALUES (
    'TEST-DOUBLON', 
    'Test Doublon', 
    'fff629d9-8d80-4357-b186-f9fd60e529d4', 
    '{"color": "Vert"}'
);
-- Expected: ERROR - duplicate key value violates unique constraint

ROLLBACK; -- Annuler test

-- Si tout OK
COMMIT;
*/

-- ============================================================================
-- CHECKLIST POST-CLEANUP
-- ============================================================================
/*
✅ [ ] FMIL-VERT-22 supprimé (10 mouvements + 1 produit)
✅ [ ] Doublons "Vert" résolus (fusion OU distinction)
✅ [ ] Doublons "Bleu" analysés et décision prise
✅ [ ] Contrainte UNIQUE ajoutée
✅ [ ] Tests contrainte validés (insertion doublon doit échouer)
✅ [ ] Documentation mise à jour (business rules variants)
*/

-- ============================================================================
-- FIN PLAN CLEANUP
-- ============================================================================
