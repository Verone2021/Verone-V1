-- ============================================================================
-- Migration: Fix Stock Alerts View - Support out_of_stock sans min_stock
-- Date: 2025-12-08
-- Description: Corriger la condition WHERE pour afficher les alertes out_of_stock
--              même pour les produits sans min_stock défini
--
--   BUG: La condition `WHERE min_stock > 0` excluait les alertes out_of_stock
--        pour les produits sans min_stock, alors que out_of_stock (prévisionnel < 0)
--        est une alerte INDÉPENDANTE de min_stock.
--
--   FIX: Modifier le WHERE pour :
--     - low_stock : nécessite min_stock > 0 ET stock_previsionnel < min_stock
--     - out_of_stock : stock_previsionnel < 0 (INDÉPENDANT de min_stock)
-- ============================================================================

CREATE OR REPLACE VIEW stock_alerts_unified_view AS
WITH product_alerts AS (
  SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.sku,
    COALESCE(p.stock_real, 0) AS stock_real,
    COALESCE(p.stock_forecasted_in, 0) AS stock_forecasted_in,
    COALESCE(p.stock_forecasted_out, 0) AS stock_forecasted_out,
    COALESCE(p.min_stock, 0) AS min_stock,
    (COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0) - COALESCE(p.stock_forecasted_out, 0)) AS stock_previsionnel,
    sat.id AS tracking_id,
    sat.draft_order_id,
    sat.draft_order_number,
    COALESCE(sat.quantity_in_draft, 0) AS quantity_in_draft,
    sat.validated,
    sat.validated_at,
    sat.supplier_id,
    (COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0) - COALESCE(p.stock_forecasted_out, 0) + COALESCE(sat.quantity_in_draft, 0)) AS stock_previsionnel_avec_draft,
    (
      SELECT pi.public_url
      FROM product_images pi
      WHERE pi.product_id = p.id AND pi.is_primary = true
      LIMIT 1
    ) AS product_image_url
  FROM products p
  LEFT JOIN stock_alert_tracking sat ON sat.product_id = p.id
  WHERE p.archived_at IS NULL
)
SELECT
  COALESCE(pa.tracking_id, pa.product_id) AS id,
  pa.product_id,
  pa.product_name,
  pa.sku,
  pa.stock_real,
  pa.stock_forecasted_in,
  pa.stock_forecasted_out,
  pa.min_stock,
  pa.stock_previsionnel,
  pa.stock_previsionnel_avec_draft,
  pa.draft_order_id,
  pa.draft_order_number,
  pa.quantity_in_draft,
  pa.validated,
  pa.validated_at,
  pa.supplier_id,
  pa.product_image_url,

  -- Type d'alerte (v4 - DEUX TYPES INDÉPENDANTS) :
  -- 'out_of_stock' = Stock prévisionnel < 0 (INDÉPENDANT de min_stock)
  -- 'low_stock' = Stock prévisionnel < min_stock (nécessite min_stock > 0)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'out_of_stock'
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock THEN 'low_stock'
    ELSE 'none'
  END AS alert_type,

  -- Priorité (3=critique out_of_stock, 2=warning low_stock, 0=none)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real <= 0 AND pa.min_stock > 0 THEN 3
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock THEN 2
    ELSE 0
  END AS alert_priority,

  -- Shortage basé sur prévisionnel
  CASE
    WHEN pa.stock_previsionnel < 0 THEN ABS(pa.stock_previsionnel)
    WHEN pa.min_stock > 0 THEN GREATEST(0, pa.min_stock - pa.stock_previsionnel)
    ELSE 0
  END AS shortage_quantity,

  -- Couleur calculée (workflow ROUGE/ORANGE/VERT)
  CASE
    -- ROUGE CRITIQUE : Stock prévisionnel négatif (même avec brouillons)
    WHEN pa.stock_previsionnel < 0 AND pa.stock_previsionnel_avec_draft < 0 THEN 'critical_red'
    -- ORANGE : Stock prévisionnel négatif MAIS brouillon couvre
    WHEN pa.stock_previsionnel < 0 AND pa.quantity_in_draft > 0 AND pa.stock_previsionnel_avec_draft >= 0 THEN 'orange'
    -- RESOLVED : Pas d'alerte (prévisionnel >= 0 et >= min_stock si défini)
    WHEN pa.stock_previsionnel >= 0 AND (pa.min_stock = 0 OR pa.stock_previsionnel >= pa.min_stock) THEN 'resolved'
    -- ORANGE : Prévisionnel < seuil MAIS brouillon couvre le besoin
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock AND pa.quantity_in_draft > 0 AND pa.stock_previsionnel_avec_draft >= pa.min_stock THEN 'orange'
    -- ROUGE : Prévisionnel < seuil (seuil non atteint)
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock THEN 'red'
    ELSE 'resolved'
  END AS alert_color,

  -- Sévérité
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'critical'
    WHEN pa.stock_real <= 0 AND pa.min_stock > 0 THEN 'critical'
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock THEN 'warning'
    ELSE 'info'
  END AS severity,

  (pa.draft_order_id IS NOT NULL AND pa.quantity_in_draft > 0) AS is_in_draft

FROM product_alerts pa
WHERE
  -- ============================================================================
  -- FIX v4 : CONDITIONS POUR DEUX TYPES D'ALERTES INDÉPENDANTES
  -- ============================================================================
  -- Condition 1 : out_of_stock - stock prévisionnel < 0 (INDÉPENDANT de min_stock)
  pa.stock_previsionnel < 0
  -- Condition 2 : low_stock - nécessite min_stock > 0 ET stock < seuil
  OR (pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock)
ORDER BY
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real <= 0 AND pa.min_stock > 0 THEN 3
    WHEN pa.min_stock > 0 AND pa.stock_previsionnel < pa.min_stock THEN 2
    ELSE 0
  END DESC,
  pa.stock_previsionnel ASC;

-- Documentation
COMMENT ON VIEW stock_alerts_unified_view IS
'Vue dynamique unifiée des alertes stock (v4 - Fix out_of_stock sans min_stock).

DEUX TYPES D''ALERTES INDÉPENDANTES :
- out_of_stock: stock_previsionnel < 0 (INDÉPENDANT de min_stock)
  → Signifie que les commandes clients (forecasted_out) dépassent le stock disponible
  → CRITIQUE - doit TOUJOURS être affiché même si min_stock = 0

- low_stock: stock_previsionnel < min_stock (nécessite min_stock > 0)
  → Signifie que le seuil minimum n''est pas atteint
  → WARNING - nécessite min_stock défini

Logique des couleurs:
- critical_red: stock_previsionnel < 0 ET brouillon ne couvre pas
- red: stock_previsionnel < min_stock (seuil non atteint)
- orange: stock insuffisant MAIS brouillon PO couvre le besoin
- resolved: stock OK (prévisionnel >= 0 et >= min_stock)

Migration: 20251208_003 v4';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_view_exists BOOLEAN;
  v_out_of_stock_count INTEGER;
  v_low_stock_count INTEGER;
BEGIN
  -- Vérifier que la vue existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'stock_alerts_unified_view'
  ) INTO v_view_exists;

  IF v_view_exists THEN
    -- Compter les alertes par type
    SELECT
      COUNT(*) FILTER (WHERE alert_type = 'out_of_stock'),
      COUNT(*) FILTER (WHERE alert_type = 'low_stock')
    INTO v_out_of_stock_count, v_low_stock_count
    FROM stock_alerts_unified_view;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251208_003 terminée';
    RAISE NOTICE '   Vue stock_alerts_unified_view v4 créée';
    RAISE NOTICE '   Alertes out_of_stock: %', v_out_of_stock_count;
    RAISE NOTICE '   Alertes low_stock: %', v_low_stock_count;
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Échec création vue stock_alerts_unified_view';
  END IF;
END $$;
