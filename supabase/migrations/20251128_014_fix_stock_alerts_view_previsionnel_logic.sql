-- ============================================================================
-- Migration: Fix Stock Alerts View - Prévisionnel Logic (v3)
-- Date: 2025-11-28
-- Description: Corriger la logique des types d'alertes et couleurs
--
--   BUG 1 (corrigé): La vue affichait 'resolved' quand stock_real >= min_stock
--        même si stock_previsionnel < min_stock (à cause des réservations SO)
--
--   BUG 2 (corrigé): Le type 'no_stock_but_ordered' était utilisé à tort
--        quand on a assez de stock pour expédier mais pas assez pour le seuil
--
--   FIX:
--     - 'out_of_stock' = stock_previsionnel < 0 (pas assez pour honorer les commandes)
--     - 'low_stock' = stock_previsionnel < min_stock (seuil non atteint)
--     - Supprimer 'no_stock_but_ordered' qui prêtait à confusion
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

  -- Type d'alerte SIMPLIFIÉ (v3):
  -- 'out_of_stock' = Pas assez de stock pour honorer les commandes (stock_previsionnel < 0)
  -- 'low_stock' = Seuil minimum non atteint (stock_previsionnel < min_stock)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'out_of_stock'
    WHEN pa.stock_previsionnel < pa.min_stock THEN 'low_stock'
    ELSE 'none'
  END AS alert_type,

  -- Priorité (3=critique, 2=warning, 1=info, 0=none)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real <= 0 AND pa.stock_real < pa.min_stock THEN 3
    WHEN pa.stock_previsionnel < pa.min_stock THEN 2
    ELSE 0
  END AS alert_priority,

  -- Shortage basé sur prévisionnel (manque pour atteindre min_stock)
  GREATEST(0, pa.min_stock - pa.stock_previsionnel) AS shortage_quantity,

  -- Couleur calculée
  CASE
    -- ROUGE CRITIQUE : Stock prévisionnel négatif (même avec brouillons)
    WHEN pa.stock_previsionnel < 0 AND pa.stock_previsionnel_avec_draft < 0 THEN 'critical_red'
    -- ORANGE : Stock prévisionnel négatif MAIS brouillon couvre
    WHEN pa.stock_previsionnel < 0 AND pa.quantity_in_draft > 0 AND pa.stock_previsionnel_avec_draft >= 0 THEN 'orange'
    -- RESOLVED : Prévisionnel >= seuil minimum
    WHEN pa.stock_previsionnel >= pa.min_stock THEN 'resolved'
    -- ORANGE : Prévisionnel < seuil MAIS brouillon couvre le besoin
    WHEN pa.stock_previsionnel < pa.min_stock AND pa.quantity_in_draft > 0 AND pa.stock_previsionnel_avec_draft >= pa.min_stock THEN 'orange'
    -- ROUGE : Prévisionnel < seuil (seuil non atteint)
    WHEN pa.stock_previsionnel < pa.min_stock THEN 'red'
    ELSE 'resolved'
  END AS alert_color,

  -- Sévérité
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'critical'
    WHEN pa.stock_real <= 0 AND pa.stock_real < pa.min_stock THEN 'critical'
    WHEN pa.stock_previsionnel < pa.min_stock THEN 'warning'
    ELSE 'info'
  END AS severity,

  (pa.draft_order_id IS NOT NULL AND pa.quantity_in_draft > 0) AS is_in_draft

FROM product_alerts pa
WHERE
  pa.min_stock > 0
  AND (
    pa.stock_previsionnel < pa.min_stock
    OR pa.stock_previsionnel < 0
  )
ORDER BY
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real <= 0 AND pa.stock_real < pa.min_stock THEN 3
    WHEN pa.stock_previsionnel < pa.min_stock THEN 2
    ELSE 0
  END DESC,
  pa.stock_previsionnel ASC;

-- Documentation
COMMENT ON VIEW stock_alerts_unified_view IS
'Vue dynamique unifiée des alertes stock (v3 - Logique simplifiée).

Types d''alertes (basés sur stock_previsionnel):
- out_of_stock: stock_previsionnel < 0 (pas assez pour honorer les commandes clients)
- low_stock: stock_previsionnel < min_stock (seuil minimum non atteint)

Logique des couleurs:
- critical_red: stock_previsionnel < 0 ET brouillon ne couvre pas
- red: stock_previsionnel < min_stock (seuil non atteint)
- orange: stock insuffisant MAIS brouillon PO couvre le besoin
- resolved: stock_previsionnel >= min_stock

Exemple concret:
- Stock réel = 11, Réservé (forecasted_out) = 10, Seuil = 5
- Stock prévisionnel = 11 - 10 = 1 < 5 (seuil)
- Résultat: alert_type = low_stock, alert_color = red
- On a assez pour expédier (11 >= 10) mais après expédition on sera sous le seuil

Migration: 20251128_014 v3';
