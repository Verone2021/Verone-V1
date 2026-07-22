-- [BO-LINKME-CATVIS-001] Contrôle par produit de la visibilité au catalogue LinkMe
--
-- Ajoute un kill-switch par produit pour afficher/cacher un produit du catalogue
-- LinkMe, indépendant du pricing (channel_pricing.is_active) et de la feature
-- globe 3D (show_on_linkme_globe). Défaut TRUE = non-régression : tous les
-- produits actuels restent visibles.
--
-- Nettoie aussi 4 produits sourcés pour le client DSA
-- (d1ed3199-e47a-461a-9477-eac6df8b3d2a) rattachés via assigned_client_id mais
-- restés product_type='standard' : décision Romeo 2026-07-08 = les marquer
-- 'custom' (réservés à DSA, invisibles au catalogue général).

-- 1. Colonne nullable avec default sûr
ALTER TABLE products
  ADD COLUMN is_visible_in_linkme_catalog BOOLEAN DEFAULT true;

-- 2. Backfill explicite (tous visibles = comportement actuel conservé)
UPDATE products
  SET is_visible_in_linkme_catalog = true
  WHERE is_visible_in_linkme_catalog IS NULL;

-- 3. NOT NULL après backfill
ALTER TABLE products
  ALTER COLUMN is_visible_in_linkme_catalog SET NOT NULL;

-- 4. Index partiel (on requête surtout les produits cachés, minoritaires)
CREATE INDEX IF NOT EXISTS products_linkme_hidden_idx
  ON products (is_visible_in_linkme_catalog)
  WHERE is_visible_in_linkme_catalog = false;

-- 5. Mise en cohérence des 4 produits DSA (réservés → product_type='custom')
UPDATE products
  SET product_type = 'custom'
  WHERE assigned_client_id = 'd1ed3199-e47a-461a-9477-eac6df8b3d2a'
    AND product_type = 'standard';
