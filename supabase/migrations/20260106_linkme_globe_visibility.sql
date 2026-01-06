-- =============================================
-- Migration: LinkMe Globe Visibility
-- Date: 2026-01-06
-- Description: Ajoute les colonnes et vues pour
--              le globe 3D de LinkMe
-- =============================================

-- Produits: visibilité sur globe LinkMe
ALTER TABLE products
ADD COLUMN IF NOT EXISTS show_on_linkme_globe BOOLEAN DEFAULT false;

COMMENT ON COLUMN products.show_on_linkme_globe IS
  'Si true, le produit apparaît sur le globe 3D de LinkMe (nécessite image_url)';

-- Organisations: visibilité sur globe LinkMe
ALTER TABLE organisations
ADD COLUMN IF NOT EXISTS show_on_linkme_globe BOOLEAN DEFAULT false;

COMMENT ON COLUMN organisations.show_on_linkme_globe IS
  'Si true, le logo apparaît sur le globe 3D de LinkMe (nécessite logo_url)';

-- Index partiel pour performance (seulement les éléments visibles)
CREATE INDEX IF NOT EXISTS idx_products_linkme_globe
ON products(show_on_linkme_globe)
WHERE show_on_linkme_globe = true;

CREATE INDEX IF NOT EXISTS idx_organisations_linkme_globe
ON organisations(show_on_linkme_globe)
WHERE show_on_linkme_globe = true;

-- Vue pour récupérer les items du globe
CREATE OR REPLACE VIEW linkme_globe_items AS
SELECT
  'product'::text as item_type,
  p.id::text,
  p.name,
  p.image_url
FROM products p
WHERE p.show_on_linkme_globe = true
  AND p.image_url IS NOT NULL
  AND p.image_url != ''
UNION ALL
SELECT
  'organisation'::text as item_type,
  o.id::text,
  o.name,
  o.logo_url as image_url
FROM organisations o
WHERE o.show_on_linkme_globe = true
  AND o.logo_url IS NOT NULL
  AND o.logo_url != '';

COMMENT ON VIEW linkme_globe_items IS
  'Items à afficher sur le globe 3D de LinkMe (produits + organisations)';

-- Grant pour la vue
GRANT SELECT ON linkme_globe_items TO authenticated;
GRANT SELECT ON linkme_globe_items TO anon;
