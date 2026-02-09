-- ============================================================================
-- View: linkme_selection_items_with_pricing
-- Date: 2026-02-09
-- Description: JOIN selection items + products + pricing + images pour affichage catalogue
-- Note: Cette view existait deja en DB mais n'etait pas trackee dans les migrations.
--       CREATE OR REPLACE pour idempotence.
-- RLS: Les views PostgreSQL heritent des policies RLS des tables sous-jacentes.
-- ============================================================================

CREATE OR REPLACE VIEW linkme_selection_items_with_pricing AS
SELECT
  lsi.id,
  lsi.selection_id,
  lsi.product_id,
  p.name AS product_name,
  p.sku AS product_sku,
  pi.public_url AS product_image,
  lsi.selling_price_ht,
  round(lsi.selling_price_ht * 1.20, 2) AS selling_price_ttc,
  lsi.margin_rate,
  c.name AS category_name,
  p.subcategory_id,
  sc.name AS subcategory_name,
  lsi.display_order
FROM linkme_selection_items lsi
JOIN products p ON (p.id = lsi.product_id)
LEFT JOIN product_images pi ON (pi.product_id = p.id AND pi.is_primary = true)
LEFT JOIN subcategories sc ON (sc.id = p.subcategory_id)
LEFT JOIN categories c ON (c.id = sc.category_id);

-- SECURITY INVOKER: la view applique le RLS du user qui fait la query
-- (sans cela, le owner postgres bypass le RLS = faille de securite)
ALTER VIEW linkme_selection_items_with_pricing SET (security_invoker = on);

COMMENT ON VIEW linkme_selection_items_with_pricing IS
'View denormalisee pour affichage catalogue LinkMe (selections publiques + dashboard affilies).
RLS herite des tables sous-jacentes (linkme_selection_items, products, categories, subcategories, product_images).';
