-- ============================================================================
-- Migration: Create customer_samples_view
-- Description: Vue pour afficher les échantillons clients avec leurs relations
-- Date: 2026-01-11
-- ============================================================================

-- Vue customer_samples_view
-- Agrège les données de purchase_order_items (échantillons) avec:
-- - products (info produit)
-- - purchase_orders (info commande fournisseur)
-- - organisations (fournisseur + client B2B)
-- - individual_customers (client B2C)
-- - product_images (image produit)

CREATE OR REPLACE VIEW public.customer_samples_view AS
SELECT
  -- IDs
  poi.id AS sample_id,
  poi.purchase_order_id,
  poi.product_id,

  -- Sample info
  poi.sample_type::text AS sample_type,
  poi.quantity,
  poi.unit_price_ht,
  poi.notes AS sample_notes,
  poi.archived_at,
  poi.created_at AS sample_created_at,
  poi.updated_at AS sample_updated_at,

  -- Status dérivé (calculé depuis PO status + archived_at)
  -- Enum values: draft, validated, partially_received, received, cancelled
  CASE
    WHEN poi.archived_at IS NOT NULL THEN 'archived'::text
    WHEN po.status = 'draft' THEN 'draft'::text
    WHEN po.status = 'validated' THEN 'ordered'::text
    WHEN po.status IN ('partially_received', 'received') THEN 'received'::text
    WHEN po.status = 'cancelled' THEN 'archived'::text
    ELSE 'unknown'::text
  END AS sample_status,

  -- Product info
  p.sku AS product_sku,
  p.name AS product_name,
  p.description AS product_description,
  pi.public_url AS product_image,

  -- Purchase Order info
  po.po_number,
  po.status::text AS po_status,
  po.supplier_id,
  po.expected_delivery_date,
  po.created_at AS po_created_at,

  -- Supplier (organisation)
  supplier.legal_name AS supplier_name,
  supplier.trade_name AS supplier_trade_name,

  -- Customer B2B (organisation)
  poi.customer_organisation_id AS customer_org_id,
  customer_org.legal_name AS customer_org_legal_name,
  customer_org.trade_name AS customer_org_trade_name,

  -- Customer B2C (individual_customers)
  poi.customer_individual_id AS customer_ind_id,
  customer_ind.first_name AS customer_ind_first_name,
  customer_ind.last_name AS customer_ind_last_name,
  customer_ind.email AS customer_ind_email,

  -- Helpers: customer_display_name et customer_type
  CASE
    WHEN poi.customer_organisation_id IS NOT NULL THEN
      COALESCE(customer_org.trade_name, customer_org.legal_name, 'Client B2B')
    WHEN poi.customer_individual_id IS NOT NULL THEN
      TRIM(CONCAT(customer_ind.first_name, ' ', customer_ind.last_name))
    ELSE 'Échantillon interne'
  END AS customer_display_name,

  CASE
    WHEN poi.customer_organisation_id IS NOT NULL THEN 'B2B'::text
    WHEN poi.customer_individual_id IS NOT NULL THEN 'B2C'::text
    ELSE NULL
  END AS customer_type

FROM public.purchase_order_items poi

-- Join Purchase Order
INNER JOIN public.purchase_orders po
  ON poi.purchase_order_id = po.id

-- Join Product
LEFT JOIN public.products p
  ON poi.product_id = p.id

-- Join Primary Image (left join car peut être null)
LEFT JOIN public.product_images pi
  ON pi.product_id = p.id
  AND pi.is_primary = true

-- Join Supplier (organisation)
LEFT JOIN public.organisations supplier
  ON po.supplier_id = supplier.id

-- Join Customer B2B (organisation)
LEFT JOIN public.organisations customer_org
  ON poi.customer_organisation_id = customer_org.id

-- Join Customer B2C (individual_customers)
LEFT JOIN public.individual_customers customer_ind
  ON poi.customer_individual_id = customer_ind.id

-- Filtrer uniquement les items qui sont des échantillons
WHERE poi.sample_type IS NOT NULL;

-- Grant permissions
GRANT SELECT ON public.customer_samples_view TO authenticated;
GRANT SELECT ON public.customer_samples_view TO service_role;

-- Commentaire sur la vue
COMMENT ON VIEW public.customer_samples_view IS
'Vue des échantillons clients avec toutes les relations (produit, fournisseur, client B2B/B2C)';

-- ============================================================================
-- FIN DE MIGRATION
-- ============================================================================
