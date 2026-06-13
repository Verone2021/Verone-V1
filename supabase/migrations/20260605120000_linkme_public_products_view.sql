-- Migration: vue lecture seule des produits LinkMe en vitrine publique
-- Sprint: LINKME-DB-001 (site public LinkMe — homepage vrais produits + catalogue public)
-- Date: 2026-06-05
--
-- Aucune table modifiée. Vue en lecture seule basée sur les drapeaux PAR CANAL
-- déjà existants (channel_pricing.is_public_showcase / is_featured) pour le
-- canal LinkMe (id 93c68db1-5a30-4168-89ec-6383152be405).
--   - is_public_showcase = produit visible dans le catalogue/vitrine public LinkMe
--   - is_featured        = produit mis en avant sur la homepage (affiché en premier)
-- Lecture anonyme accordée (anon, authenticated) sur le modèle de linkme_globe_items.
-- Aucun prix n'est projeté : les prix sont masqués côté public (non connecté).

DROP VIEW IF EXISTS public.linkme_public_products;

CREATE VIEW public.linkme_public_products AS
SELECT
  p.id::text AS id,
  p.name,
  p.slug,
  c.name AS category,
  pi.public_url AS image_url,
  cp.is_featured,
  cp.display_order
FROM products p
JOIN channel_pricing cp
  ON cp.product_id = p.id
  AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'
  AND cp.is_active = true
  AND cp.is_public_showcase = true
JOIN product_images pi
  ON pi.product_id = p.id AND pi.is_primary = true AND pi.public_url IS NOT NULL
LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
LEFT JOIN categories c ON c.id = sc.category_id
WHERE p.product_status = 'active'
ORDER BY cp.is_featured DESC, cp.display_order ASC, p.name;

GRANT SELECT ON public.linkme_public_products TO anon, authenticated;

COMMENT ON VIEW public.linkme_public_products IS 'Produits LinkMe en vitrine publique (channel_pricing.is_public_showcase) — lecture anonyme pour homepage/catalogue public. is_featured = mis en avant accueil. LINKME-DB-001.';
