/**
 * 🔧 CORRECTIF URGENT: Colonnes Prix Manquantes Table Products
 * Date: 28/09/2025
 * Problème: Erreur 42703 - price_ht column does not exist
 * Solution: Réappliquer les ajouts de colonnes prix manquantes
 */

-- 1. Vérification existence table products
SELECT 'Vérification table products...' as step;
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'products'
) as table_exists;

-- 2. Ajout colonnes manquantes si elles n'existent pas
SELECT 'Ajout colonne price_ht si manquante...' as step;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_ht NUMERIC(10,2) DEFAULT 0;

SELECT 'Ajout colonne supplier_cost_price si manquante...' as step;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_cost_price NUMERIC(10,2);

SELECT 'Ajout colonne estimated_selling_price si manquante...' as step;
ALTER TABLE products
ADD COLUMN IF NOT EXISTS estimated_selling_price NUMERIC(10,2);

-- 3. Mise à jour contraintes et valeurs par défaut
SELECT 'Application contraintes business...' as step;

-- Contrainte price_ht > 0 (business requirement)
ALTER TABLE products
ADD CONSTRAINT IF NOT EXISTS products_price_ht_positive
CHECK (price_ht >= 0);

-- Contrainte supplier_cost_price >= 0
ALTER TABLE products
ADD CONSTRAINT IF NOT EXISTS products_supplier_cost_positive
CHECK (supplier_cost_price IS NULL OR supplier_cost_price >= 0);

-- 4. Mise à jour données existantes (migration des valeurs)
SELECT 'Migration données existantes...' as step;

-- Si cost_price existe et price_ht est 0, copier la valeur
UPDATE products
SET price_ht = COALESCE(cost_price, 0)
WHERE price_ht = 0 OR price_ht IS NULL;

-- Si supplier_cost_price est NULL, utiliser cost_price comme fallback
UPDATE products
SET supplier_cost_price = cost_price
WHERE supplier_cost_price IS NULL AND cost_price IS NOT NULL;

-- 5. Ajout index pour performance
SELECT 'Création index performance...' as step;

CREATE INDEX IF NOT EXISTS idx_products_price_ht
ON products(price_ht)
WHERE price_ht IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_supplier_cost
ON products(supplier_cost_price)
WHERE supplier_cost_price IS NOT NULL;

-- 6. Commentaires documentation
SELECT 'Ajout commentaires documentation...' as step;

COMMENT ON COLUMN products.price_ht IS 'Prix HT en euros avec 2 décimales (ex: 1299.99) - Colonne restaurée 28/09/2025';
COMMENT ON COLUMN products.supplier_cost_price IS 'Prix coût fournisseur en euros avec 2 décimales';
COMMENT ON COLUMN products.estimated_selling_price IS 'Prix de vente estimé en euros avec 2 décimales';

-- 7. Validation finale
SELECT 'Validation finale structure...' as step;

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('price_ht', 'supplier_cost_price', 'estimated_selling_price', 'cost_price')
ORDER BY column_name;

-- 8. Test requête use-collections.ts
SELECT 'Test requête collections...' as step;

SELECT
  'Test réussi - Colonnes price accessibles' as result
FROM products
WHERE price_ht IS NOT NULL
LIMIT 1;

SELECT 'CORRECTIF TERMINÉ ✅' as status;