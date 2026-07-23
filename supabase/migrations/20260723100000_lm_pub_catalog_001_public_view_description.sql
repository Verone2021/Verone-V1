-- LM-PUB-CATALOG-001 — Enrichissement de la vue publique pour le catalogue + fiches produit
--
-- Contexte : la vitrine d'accueil publique LinkMe (composant Marketplace) affiche 8 produits
-- sans description. Le nouveau catalogue public (/produits + /produits/[slug]) a besoin de la
-- description et du méta-descriptif pour construire une vraie fiche produit, et de
-- l'identifiant Cloudflare pour un rendu image optimisé (cohérent avec le catalogue connecté).
--
-- Cette migration NE FAIT QU'AJOUTER trois colonnes descriptives à la vue publique
-- `linkme_public_products`. AUCUNE colonne de prix, coût ou marge n'est exposée (règle
-- catalogue public : prix réservés aux comptes connectés).
--
--   + cloudflare_image_id : rendu image optimisé (fallback sur image_url déjà présent)
--   + description         : mappée sur products.description_long (texte marketing long)
--   + meta_description    : products.meta_description (balise SEO)
--
-- Le corps de la vue est recréé à l'identique de CATVIS-002 (mêmes JOIN, mêmes filtres de
-- visibilité et garde-fous « pas de produit réservé au public »), avec seulement les trois
-- colonnes en plus. CREATE OR REPLACE préserve propriétaire et droits (anon SELECT).
-- Non-régression : les colonnes existantes gardent le même nom, le même type et le même ordre ;
-- les trois nouvelles sont ajoutées EN FIN de vue (contrainte CREATE OR REPLACE : on ne peut
-- qu'ajouter des colonnes à la fin). Les consommateurs actuels (vitrine d'accueil) restent valides.

CREATE OR REPLACE VIEW public.linkme_public_products AS
 SELECT p.id::text AS id,
    p.name,
    p.slug,
    c.name AS category,
    pi.public_url AS image_url,
    cp.is_featured,
    cp.display_order,
    pi.cloudflare_image_id,
    p.description_long AS description,
    p.meta_description
   FROM products p
     JOIN channel_pricing cp ON cp.product_id = p.id AND cp.channel_id = '93c68db1-5a30-4168-89ec-6383152be405'::uuid AND cp.is_active = true AND cp.is_public_showcase = true
     JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true AND pi.public_url IS NOT NULL
     LEFT JOIN subcategories sc ON sc.id = p.subcategory_id
     LEFT JOIN categories c ON c.id = sc.category_id
  WHERE p.product_status = 'active'::product_status_type
    AND p.is_visible_in_linkme_catalog = true
    AND p.assigned_client_id IS NULL
    AND p.enseigne_id IS NULL
    AND p.created_by_affiliate IS NULL
  ORDER BY cp.is_featured DESC, cp.display_order, p.name;
