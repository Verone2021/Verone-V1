-- Migration: Suppression colonne price_ht (Prix de vente)
-- Date: 2025-10-17
-- Description: Suppression de price_ht - Phase 1 utilise uniquement cost_price (prix d'achat)
-- Raison: En Phase 1, seul le prix d'achat fournisseur est géré.
--         Le prix de vente sera introduit en Phase 2 via sales_order_items.

-- ⚠️ IMPORTANT: Cette migration est IRRÉVERSIBLE
-- Toutes les données de price_ht seront perdues
-- Assurez-vous d'avoir une sauvegarde avant d'exécuter

-- 1. Sauvegarde des données existantes (optionnel, pour rollback manuel)
CREATE TEMP TABLE price_ht_backup AS
SELECT id, sku, name, price_ht, cost_price, created_at
FROM products
WHERE price_ht IS NOT NULL;

-- Afficher combien de produits seront affectés
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count FROM price_ht_backup;
  RAISE NOTICE 'Nombre de produits avec price_ht défini: %', affected_count;
END $$;

-- 2. Supprimer l'index sur price_ht (créé dans migration 20250916_010)
DROP INDEX IF EXISTS idx_products_price_ht;

-- 3. Supprimer la colonne price_ht
ALTER TABLE products DROP COLUMN IF EXISTS price_ht;

-- 4. Supprimer price_ht de product_drafts également (cohérence)
-- La table product_drafts a compatibility field price_ht
ALTER TABLE product_drafts DROP COLUMN IF EXISTS price_ht;

-- 5. Supprimer la colonne selling_price de product_drafts (même raison)
-- selling_price était mappé vers price_ht lors de la validation
ALTER TABLE product_drafts DROP COLUMN IF EXISTS selling_price;

-- 6. Mettre à jour les commentaires pour clarity
COMMENT ON COLUMN products.cost_price IS 'Prix d''achat fournisseur HT en euros (ex: 899.50). Champ principal en Phase 1.';
COMMENT ON COLUMN products.estimated_selling_price IS 'Prix de vente estimé calculé en euros (cost_price × (1 + margin_percentage/100))';

COMMENT ON COLUMN product_drafts.supplier_price IS 'Prix d''achat fournisseur en euros (sera mappé vers cost_price lors validation)';
COMMENT ON COLUMN product_drafts.estimated_selling_price IS 'Prix de vente estimé en euros (calculé, pas stocké en products)';

-- 7. Validation finale
DO $$
DECLARE
  price_ht_exists BOOLEAN;
  selling_price_exists BOOLEAN;
BEGIN
  -- Vérifier que price_ht n'existe plus dans products
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_ht'
  ) INTO price_ht_exists;

  -- Vérifier que selling_price n'existe plus dans product_drafts
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'product_drafts' AND column_name = 'selling_price'
  ) INTO selling_price_exists;

  IF price_ht_exists THEN
    RAISE EXCEPTION 'ERREUR: Colonne price_ht existe encore dans products';
  END IF;

  IF selling_price_exists THEN
    RAISE EXCEPTION 'ERREUR: Colonne selling_price existe encore dans product_drafts';
  END IF;

  RAISE NOTICE 'Migration réussie:';
  RAISE NOTICE '- Colonne products.price_ht supprimée ✓';
  RAISE NOTICE '- Colonne product_drafts.price_ht supprimée ✓';
  RAISE NOTICE '- Colonne product_drafts.selling_price supprimée ✓';
  RAISE NOTICE '- Index idx_products_price_ht supprimé ✓';
  RAISE NOTICE '- Seule colonne prix restante: products.cost_price (prix d''achat)';
END $$;

-- 8. Note pour rollback manuel (si nécessaire)
-- Pour restaurer price_ht depuis la sauvegarde temporaire:
-- ALTER TABLE products ADD COLUMN price_ht NUMERIC(10,2);
-- UPDATE products p SET price_ht = b.price_ht FROM price_ht_backup b WHERE p.id = b.id;
-- Mais attention: cette sauvegarde n'existe que pendant la session PostgreSQL actuelle
