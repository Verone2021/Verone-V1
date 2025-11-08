-- =====================================================================
-- Migration: Customer Samples View
-- Description: Vue consolidée pour affichage échantillons clients
--              Regroupe données purchase_order_items + products + PO + customers
-- Date: 2025-10-31
-- =====================================================================

-- =====================================================================
-- VIEW: customer_samples_view
-- =====================================================================
-- Consolide toutes les données nécessaires pour l'affichage échantillons:
-- - Informations échantillon (sample_type, quantity, dates)
-- - Informations produit (nom, référence, images)
-- - Informations PO (statut, supplier, numéro)
-- - Informations client (B2B: legal_name, B2C: first_name + last_name)
-- - Statut archivage

CREATE OR REPLACE VIEW customer_samples_view AS
SELECT
  -- ===================================================================
  -- ÉCHANTILLON (purchase_order_items)
  -- ===================================================================
  poi.id AS sample_id,
  poi.purchase_order_id,
  poi.product_id,
  poi.sample_type,
  poi.quantity,
  poi.unit_price_ht,
  poi.notes AS sample_notes,
  poi.archived_at,
  poi.created_at AS sample_created_at,
  poi.updated_at AS sample_updated_at,

  -- Statut dérivé
  CASE
    WHEN poi.archived_at IS NOT NULL THEN 'archived'
    WHEN po.status = 'draft' THEN 'draft'
    WHEN po.status IN ('sent', 'confirmed') THEN 'ordered'
    WHEN po.status IN ('partially_received', 'received') THEN 'received'
    ELSE 'unknown'
  END AS sample_status,

  -- ===================================================================
  -- PRODUIT (products)
  -- ===================================================================
  p.sku AS product_sku,
  p.name AS product_name,
  p.description AS product_description,
  img.public_url AS product_image,

  -- ===================================================================
  -- COMMANDE ACHAT (purchase_orders)
  -- ===================================================================
  po.po_number,
  po.status AS po_status,
  po.supplier_id,
  po.expected_delivery_date,
  po.created_at AS po_created_at,

  -- ===================================================================
  -- FOURNISSEUR (organisations)
  -- ===================================================================
  supp.legal_name AS supplier_name,
  supp.trade_name AS supplier_trade_name,

  -- ===================================================================
  -- CLIENT B2B (organisations via customer_organisation_id)
  -- ===================================================================
  org_cust.id AS customer_org_id,
  org_cust.legal_name AS customer_org_legal_name,
  org_cust.trade_name AS customer_org_trade_name,

  -- ===================================================================
  -- CLIENT B2C (individual_customers via customer_individual_id)
  -- ===================================================================
  ind_cust.id AS customer_ind_id,
  ind_cust.first_name AS customer_ind_first_name,
  ind_cust.last_name AS customer_ind_last_name,
  ind_cust.email AS customer_ind_email,

  -- ===================================================================
  -- HELPERS: Nom client unifié
  -- ===================================================================
  COALESCE(
    org_cust.trade_name,
    org_cust.legal_name,
    CONCAT(ind_cust.first_name, ' ', ind_cust.last_name),
    'Client inconnu'
  ) AS customer_display_name,

  -- Type client
  CASE
    WHEN poi.customer_organisation_id IS NOT NULL THEN 'B2B'
    WHEN poi.customer_individual_id IS NOT NULL THEN 'B2C'
    ELSE NULL
  END AS customer_type

FROM purchase_order_items poi

-- JOIN produit (obligatoire)
INNER JOIN products p ON p.id = poi.product_id

-- JOIN commande achat (obligatoire)
INNER JOIN purchase_orders po ON po.id = poi.purchase_order_id

-- JOIN fournisseur (obligatoire)
INNER JOIN organisations supp ON supp.id = po.supplier_id

-- LEFT JOIN client B2B (optionnel)
LEFT JOIN organisations org_cust ON org_cust.id = poi.customer_organisation_id

-- LEFT JOIN client B2C (optionnel)
LEFT JOIN individual_customers ind_cust ON ind_cust.id = poi.customer_individual_id

-- LEFT JOIN image principale produit (optionnel)
LEFT JOIN product_images img ON img.product_id = p.id AND img.is_primary = true

WHERE
  -- Filtrer uniquement les échantillons (internes ou clients)
  poi.sample_type IS NOT NULL

  -- Exclure produits archivés
  AND p.archived_at IS NULL;

-- =====================================================================
-- INDEX OPTIMISATION
-- =====================================================================
-- Index sur purchase_order_items.sample_type pour filtrage rapide
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sample_type
  ON purchase_order_items(sample_type)
  WHERE sample_type IS NOT NULL;

-- Index sur purchase_order_items.archived_at pour filtrage archivés
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_archived_at
  ON purchase_order_items(archived_at)
  WHERE archived_at IS NOT NULL;

-- Index composé pour filtres courants (sample_type + archived_at)
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_sample_filters
  ON purchase_order_items(sample_type, archived_at)
  WHERE sample_type IS NOT NULL;

-- =====================================================================
-- COMMENTAIRES DOCUMENTATION
-- =====================================================================

COMMENT ON VIEW customer_samples_view IS
  'Vue consolidée échantillons clients: regroupe données POI + products + PO + customers pour affichage UI';

COMMENT ON COLUMN customer_samples_view.sample_status IS
  'Statut dérivé: archived | draft | ordered | received | unknown';

COMMENT ON COLUMN customer_samples_view.customer_display_name IS
  'Nom client unifié: trade_name (B2B) ou first_name + last_name (B2C)';

COMMENT ON COLUMN customer_samples_view.customer_type IS
  'Type client: B2B (organisation) ou B2C (individual)';

-- =====================================================================
-- EXAMPLES QUERIES
-- =====================================================================
-- Requête 1: Tous les échantillons actifs (non archivés)
/*
SELECT * FROM customer_samples_view
WHERE archived_at IS NULL
ORDER BY sample_created_at DESC;
*/

-- Requête 2: Échantillons archivés
/*
SELECT * FROM customer_samples_view
WHERE archived_at IS NOT NULL
ORDER BY archived_at DESC;
*/

-- Requête 3: Échantillons clients uniquement (pas internes)
/*
SELECT * FROM customer_samples_view
WHERE sample_type = 'customer'
AND archived_at IS NULL;
*/

-- Requête 4: Échantillons par statut PO
/*
SELECT sample_status, COUNT(*) as count
FROM customer_samples_view
WHERE archived_at IS NULL
GROUP BY sample_status;
*/

-- Requête 5: Échantillons pour un client spécifique (B2B)
/*
SELECT * FROM customer_samples_view
WHERE customer_org_id = 'uuid-here'
ORDER BY sample_created_at DESC;
*/

-- Requête 6: Performance metrics (à analyser si lenteurs)
/*
EXPLAIN ANALYZE
SELECT * FROM customer_samples_view
WHERE sample_type = 'customer'
AND archived_at IS NULL
LIMIT 50;
*/
