-- ============================================================================
-- Fix RLS pour catalogue public LinkMe
-- Date: 2026-02-09
-- Branche: fix/remove-workspace-middlewares
-- Probleme: Tables categories, subcategories bloquent utilisateurs anonymes
-- Impact: Page publique /s/<slug> retourne catalogue vide (0 items)
-- Root cause: View linkme_selection_items_with_pricing JOIN ces tables,
--             mais aucune policy SELECT pour role anon
-- ============================================================================

-- CATEGORIES : Lecture publique (donnees de reference non sensibles)
CREATE POLICY "public_read_categories" ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY "public_read_categories" ON categories IS
'Lecture publique des categories (necessaire pour catalogue LinkMe public via view linkme_selection_items_with_pricing)';

-- SUBCATEGORIES : Lecture publique (donnees de reference non sensibles)
CREATE POLICY "public_read_subcategories" ON subcategories
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY "public_read_subcategories" ON subcategories IS
'Lecture publique des sous-categories (necessaire pour catalogue LinkMe public via view linkme_selection_items_with_pricing)';

-- PRODUCT_IMAGES : Lecture publique explicite pour anon
-- Note: Une policy "customers_read_active_product_images" existe deja pour role public
-- mais sa logique CASE/WHEN est complexe. On ajoute une policy simple pour anon.
CREATE POLICY "public_read_product_images" ON product_images
  FOR SELECT
  TO anon
  USING (true);

COMMENT ON POLICY "public_read_product_images" ON product_images IS
'Lecture publique des images produits pour utilisateurs anonymes (URLs publiques Supabase Storage)';
