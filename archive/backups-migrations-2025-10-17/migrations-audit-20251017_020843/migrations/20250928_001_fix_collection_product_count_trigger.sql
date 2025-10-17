-- 🔧 CORRECTION COMPTAGE COLLECTIONS - Trigger Dupliqué
-- Résout le problème de double comptage des produits dans les collections
-- Issue : trigger_update_collection_product_count dupliqué

-- ✅ ÉTAPE 1 : Supprimer le trigger dupliqué
DROP TRIGGER IF EXISTS trigger_update_collection_product_count ON collection_products;

-- ✅ ÉTAPE 2 : Vérifier que le trigger principal reste actif
-- (trigger_collection_product_count doit rester pour maintenir la cohérence)

-- ✅ ÉTAPE 3 : Recalculer les compteurs existants pour corriger les incohérences
UPDATE collections
SET product_count = (
    SELECT COUNT(*)
    FROM collection_products
    WHERE collection_id = collections.id
)
WHERE product_count != (
    SELECT COUNT(*)
    FROM collection_products
    WHERE collection_id = collections.id
);

-- ✅ ÉTAPE 4 : Commentaire de validation
-- Après cette migration :
-- - Un seul trigger actif : trigger_collection_product_count
-- - Comptage correct : product_count = nombre réel dans collection_products
-- - Plus de duplication lors des ajouts/suppressions