-- Migration: Remove NOT NULL constraints from products.name and products.sku
-- Date: 2025-10-17
-- Description: Permettre création produits vides (aucun champ obligatoire)
-- Issue: Error 23502 "null value in column name violates not-null constraint"
-- Business Rule: Tous les champs sont optionnels - complétion possible depuis Détails Produit

BEGIN;

-- ============================================================================
-- ÉTAPE 1: Rendre name et sku nullables
-- ============================================================================

-- 1.1 Supprimer contrainte NOT NULL sur name
ALTER TABLE products
  ALTER COLUMN name DROP NOT NULL;

-- 1.2 Supprimer contrainte NOT NULL sur sku
ALTER TABLE products
  ALTER COLUMN sku DROP NOT NULL;

-- ============================================================================
-- ÉTAPE 2: Documentation colonnes
-- ============================================================================

COMMENT ON COLUMN products.name IS 'Nom commercial du produit (optionnel - peut être complété plus tard depuis page Détails)';
COMMENT ON COLUMN products.sku IS 'SKU généré automatiquement par trigger (optionnel si produit vide)';

-- ============================================================================
-- ÉTAPE 3: Validation
-- ============================================================================

DO $$
DECLARE
  name_nullable BOOLEAN;
  sku_nullable BOOLEAN;
BEGIN
  -- Vérifier que name est nullable
  SELECT is_nullable = 'YES' INTO name_nullable
  FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'name';

  -- Vérifier que sku est nullable
  SELECT is_nullable = 'YES' INTO sku_nullable
  FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'sku';

  IF NOT name_nullable THEN
    RAISE EXCEPTION 'ERREUR: Colonne products.name toujours NOT NULL';
  END IF;

  IF NOT sku_nullable THEN
    RAISE EXCEPTION 'ERREUR: Colonne products.sku toujours NOT NULL';
  END IF;

  RAISE NOTICE 'SUCCESS: Colonnes products.name et products.sku sont maintenant nullables';
END $$;

COMMIT;

-- ============================================================================
-- NOTES MIGRATION
-- ============================================================================

/*
PROBLÈME RÉSOLU:
- Erreur PostgreSQL 23502: "null value in column name violates not-null constraint"
- User requirement: "Aucun champ n'est obligatoire. On peut compléter plus tard depuis Détails-Produits"

COLONNES MODIFIÉES:
1. products.name: NOT NULL → NULL (optionnel)
2. products.sku: NOT NULL → NULL (optionnel)

IMPACT BUSINESS:
- ✅ Création produits vides possible (workflow drafts)
- ✅ Complétion progressive depuis page /produits/catalogue/[id]
- ✅ Validation optionnelle (pas de blocage)

ARCHITECTURE VÉRONE PHASE 1:
- Produit minimal = {} (objet vide accepté)
- SKU généré automatiquement par trigger trigger_set_product_sku SEULEMENT si name présent
- Completion calculée par trigger calculate_product_completion_status (0-100%)

TRIGGERS COMPATIBLES:
- trigger_set_product_sku: Génère SKU SI name présent, sinon NULL OK
- calculate_product_completion_status: Calcule % completion (0% si tout vide)
- Tous autres triggers: Gèrent NULL values correctement

TESTS RECOMMANDÉS:
1. Créer produit vide → INSERT INTO products DEFAULT VALUES → Doit réussir
2. Vérifier sku = NULL et name = NULL acceptés
3. Vérifier completion_percentage = 0% pour produit vide
4. Compléter name → Vérifier SKU auto-généré
*/
