-- ============================================================================
-- Migration: Vue Dynamique Unifiée des Alertes Stock
-- Date: 2025-11-28
-- Description: Créer une vue qui calcule les alertes stock en temps réel
--   - Remplace la dépendance à stock_alert_tracking (qui peut être désynchronisé)
--   - Calcule automatiquement les couleurs (ROUGE/ORANGE/VERT)
--   - Supporte les 2 types d'alertes qui peuvent coexister :
--     1. low_stock (stock_real < min_stock)
--     2. out_of_stock (stock_previsionnel < 0)
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : Créer la vue dynamique
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
    -- Stock prévisionnel (commandes validées uniquement)
    (COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0) - COALESCE(p.stock_forecasted_out, 0)) AS stock_previsionnel,
    -- Tracking brouillon depuis stock_alert_tracking (pour compatibilité)
    sat.id AS tracking_id,
    sat.draft_order_id,
    sat.draft_order_number,
    COALESCE(sat.quantity_in_draft, 0) AS quantity_in_draft,
    sat.validated,
    sat.validated_at,
    sat.supplier_id,
    -- Stock prévisionnel incluant brouillon
    (COALESCE(p.stock_real, 0) + COALESCE(p.stock_forecasted_in, 0) - COALESCE(p.stock_forecasted_out, 0) + COALESCE(sat.quantity_in_draft, 0)) AS stock_previsionnel_avec_draft,
    -- Image produit principale
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
  -- Générer un ID unique pour chaque alerte (basé sur product_id + type)
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

  -- Type d'alerte (priorité: out_of_stock > low_stock)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'out_of_stock'
    WHEN pa.stock_real < pa.min_stock THEN 'low_stock'
    ELSE 'none'
  END AS alert_type,

  -- Priorité (3=critique, 2=warning, 1=info, 0=none)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real < pa.min_stock AND pa.stock_real <= 0 THEN 3
    WHEN pa.stock_real < pa.min_stock THEN 2
    ELSE 0
  END AS alert_priority,

  -- Shortage (manque pour atteindre min_stock)
  GREATEST(0, pa.min_stock - pa.stock_real) AS shortage_quantity,

  -- Couleur calculée selon la logique métier
  CASE
    -- 🔴 ROUGE CRITIQUE : Stock prévisionnel négatif (même avec brouillons)
    WHEN pa.stock_previsionnel < 0 AND pa.stock_previsionnel_avec_draft < 0 THEN 'critical_red'

    -- 🟠 ORANGE : Stock prévisionnel négatif MAIS brouillon couvre
    WHEN pa.stock_previsionnel < 0 AND pa.quantity_in_draft > 0 AND pa.stock_previsionnel_avec_draft >= 0 THEN 'orange'

    -- ✅ RESOLVED : Seuil atteint ET prévisionnel OK
    WHEN pa.stock_real >= pa.min_stock AND pa.stock_previsionnel >= 0 THEN 'resolved'

    -- 🟢 VERT : Seuil non atteint MAIS PO validée couvre le besoin
    WHEN pa.stock_real < pa.min_stock AND pa.stock_previsionnel >= pa.min_stock THEN 'green'

    -- 🟠 ORANGE : Seuil non atteint MAIS brouillon couvre le besoin
    WHEN pa.stock_real < pa.min_stock
      AND pa.quantity_in_draft > 0
      AND pa.stock_previsionnel_avec_draft >= pa.min_stock THEN 'orange'

    -- 🔴 ROUGE : Seuil non atteint, besoin non couvert
    WHEN pa.stock_real < pa.min_stock THEN 'red'

    ELSE 'resolved'
  END AS alert_color,

  -- Sévérité pour compatibilité avec le hook existant
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 'critical'
    WHEN pa.stock_real < pa.min_stock AND pa.stock_real <= 0 THEN 'critical'
    WHEN pa.stock_real < pa.min_stock THEN 'warning'
    ELSE 'info'
  END AS severity,

  -- Is in draft (pour compatibilité hook existant)
  (pa.draft_order_id IS NOT NULL AND pa.quantity_in_draft > 0) AS is_in_draft

FROM product_alerts pa
WHERE
  -- Condition 1 : Produit avec min_stock défini
  pa.min_stock > 0
  AND (
    -- Afficher si stock réel < seuil
    pa.stock_real < pa.min_stock
    -- OU si stock prévisionnel négatif
    OR pa.stock_previsionnel < 0
    -- OU si commande en cours (PO validée non reçue)
    OR (pa.stock_forecasted_in > 0 AND pa.stock_real < pa.min_stock)
  )
ORDER BY
  -- Trier par priorité (critique d'abord)
  CASE
    WHEN pa.stock_previsionnel < 0 THEN 3
    WHEN pa.stock_real < pa.min_stock AND pa.stock_real <= 0 THEN 3
    WHEN pa.stock_real < pa.min_stock THEN 2
    ELSE 0
  END DESC,
  -- Puis par stock réel (plus bas d'abord)
  pa.stock_real ASC;

-- ============================================================================
-- PARTIE 2 : Commentaire et documentation
-- ============================================================================

COMMENT ON VIEW stock_alerts_unified_view IS
'Vue dynamique unifiée des alertes stock.
Calcule les alertes en temps réel basé sur products et stock_alert_tracking.

Colonnes clés:
- alert_type: ''out_of_stock'' (prévisionnel < 0), ''low_stock'' (réel < min), ''none''
- alert_color: ''critical_red'', ''red'', ''orange'', ''green'', ''resolved''
- severity: ''critical'', ''warning'', ''info'' (compatibilité hook)

Logique des couleurs:
- 🔴 critical_red: stock_previsionnel < 0 (même avec brouillons)
- 🔴 red: stock_real < min_stock ET besoin non couvert
- 🟠 orange: brouillon existe ET couvre le besoin
- 🟢 green: PO validée couvre le besoin
- ✅ resolved: stock_real >= min_stock ET prévisionnel >= 0

Migration: 20251128_013';

-- ============================================================================
-- PARTIE 3 : Créer les policies RLS pour la vue
-- ============================================================================

-- La vue hérite automatiquement des policies des tables sous-jacentes (products, stock_alert_tracking)
-- Pas besoin de policies spécifiques pour une vue

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

DO $$
DECLARE
  v_view_exists BOOLEAN;
  v_alert_count INTEGER;
BEGIN
  -- Vérifier que la vue existe
  SELECT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_name = 'stock_alerts_unified_view'
  ) INTO v_view_exists;

  IF v_view_exists THEN
    -- Compter les alertes
    SELECT COUNT(*) INTO v_alert_count
    FROM stock_alerts_unified_view
    WHERE alert_color != 'resolved';

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Migration 20251128_013 terminée';
    RAISE NOTICE '   Vue stock_alerts_unified_view créée';
    RAISE NOTICE '   Alertes actives: %', v_alert_count;
    RAISE NOTICE '========================================';
  ELSE
    RAISE EXCEPTION '❌ Échec création vue stock_alerts_unified_view';
  END IF;
END $$;
