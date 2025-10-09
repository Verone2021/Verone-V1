-- Migration: Correction ENUM movement_type dans RPC process_shipment_stock
-- Date: 2025-10-10
-- Auteur: Claude Code 2025
-- Description: Remplace 'sale' par 'OUT' pour compatibilité avec enum existant

-- ============================================================================
-- PROBLÈME IDENTIFIÉ
-- ============================================================================
-- Migration 20251010_002 utilise movement_type = 'sale'
-- Mais enum movement_type contient : IN, OUT, TRANSFER, ADJUST
-- Résultat: ERROR - invalid input value for enum movement_type: "sale"

-- ============================================================================
-- SOLUTION
-- ============================================================================
-- Remplacer 'sale' par 'OUT' (sortie stock = OUT)
-- Les 2 workflows (simplifié et avancé) sont corrigés

CREATE OR REPLACE FUNCTION process_shipment_stock(
  p_shipment_id UUID,
  p_sales_order_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item RECORD;
  v_order_status TEXT;
  v_result jsonb;
  v_has_parcel_items BOOLEAN;
BEGIN
  -- 1. Vérifier si parcel_items existe pour ce shipment (rétrocompatibilité)
  SELECT EXISTS (
    SELECT 1 FROM parcel_items pi
    JOIN shipping_parcels sp ON pi.parcel_id = sp.id
    WHERE sp.shipment_id = p_shipment_id
  ) INTO v_has_parcel_items;

  -- ============================================================================
  -- CAS 1: WORKFLOW SIMPLIFIÉ (parcel_items vide) - NOUVEAU COMPORTEMENT
  -- ============================================================================
  IF NOT v_has_parcel_items THEN
    -- Déduire stock de TOUS les produits de la commande
    FOR v_item IN
      SELECT
        soi.id AS order_item_id,
        soi.product_id,
        soi.quantity - COALESCE(soi.quantity_shipped, 0) AS qty_to_ship
      FROM sales_order_items soi
      WHERE soi.sales_order_id = p_sales_order_id
        AND soi.quantity > COALESCE(soi.quantity_shipped, 0) -- Seulement si reste à expédier
    LOOP
      -- Créer mouvement de stock (sortie warehouse)
      -- Note: Trigger maintain_stock_coherence calculera quantity_after automatiquement
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        performed_by,
        notes
      )
      SELECT
        v_item.product_id,
        'OUT', -- ✅ CORRIGÉ: OUT au lieu de 'sale'
        -v_item.qty_to_ship, -- Négatif pour sortie
        p.stock_real, -- quantity_before = stock actuel
        p.stock_real - v_item.qty_to_ship, -- quantity_after = stock après sortie
        'sales_order',
        p_sales_order_id,
        auth.uid(),
        format('Expédition globale via shipment %s (workflow simplifié)', p_shipment_id)
      FROM products p
      WHERE p.id = v_item.product_id;

      -- Mettre à jour quantity_shipped dans sales_order_items
      UPDATE sales_order_items
      SET quantity_shipped = COALESCE(quantity_shipped, 0) + v_item.qty_to_ship
      WHERE id = v_item.order_item_id;
    END LOOP;

  -- ============================================================================
  -- CAS 2: WORKFLOW AVANCÉ (parcel_items présent) - ANCIEN COMPORTEMENT
  -- ============================================================================
  ELSE
    -- Logique historique avec affectation produit/colis
    FOR v_item IN
      SELECT
        soi.id AS order_item_id,
        soi.product_id,
        SUM(pi.quantity_shipped) AS total_qty_shipped
      FROM parcel_items pi
      JOIN shipping_parcels sp ON pi.parcel_id = sp.id
      JOIN sales_order_items soi ON pi.sales_order_item_id = soi.id
      WHERE sp.shipment_id = p_shipment_id
      GROUP BY soi.id, soi.product_id
    LOOP
      -- Créer mouvement de stock (sortie warehouse)
      -- Note: Trigger maintain_stock_coherence calculera quantity_after automatiquement
      INSERT INTO stock_movements (
        product_id,
        movement_type,
        quantity_change,
        quantity_before,
        quantity_after,
        reference_type,
        reference_id,
        performed_by,
        notes
      )
      SELECT
        v_item.product_id,
        'OUT', -- ✅ CORRIGÉ: OUT au lieu de 'sale'
        -v_item.total_qty_shipped,
        p.stock_real, -- quantity_before = stock actuel
        p.stock_real - v_item.total_qty_shipped, -- quantity_after = stock après sortie
        'sales_order',
        p_sales_order_id,
        auth.uid(),
        format('Expédition détaillée via shipment %s (workflow avancé)', p_shipment_id)
      FROM products p
      WHERE p.id = v_item.product_id;

      -- Mettre à jour quantity_shipped dans sales_order_items
      UPDATE sales_order_items
      SET quantity_shipped = COALESCE(quantity_shipped, 0) + v_item.total_qty_shipped
      WHERE id = v_item.order_item_id;
    END LOOP;
  END IF;

  -- ============================================================================
  -- CALCUL STATUT COMMANDE (Unifié pour les 2 workflows)
  -- ============================================================================
  SELECT
    CASE
      WHEN SUM(quantity) = SUM(COALESCE(quantity_shipped, 0)) THEN 'shipped'
      WHEN SUM(COALESCE(quantity_shipped, 0)) > 0 THEN 'partially_shipped'
      ELSE 'confirmed'
    END INTO v_order_status
  FROM sales_order_items
  WHERE sales_order_id = p_sales_order_id;

  -- ============================================================================
  -- MISE À JOUR STATUT + TIMESTAMPS COMMANDE
  -- ============================================================================
  UPDATE sales_orders
  SET
    status = v_order_status::sales_order_status,
    shipped_at = CASE
      WHEN v_order_status IN ('shipped', 'partially_shipped') AND shipped_at IS NULL
      THEN NOW()
      ELSE shipped_at
    END,
    shipped_by = CASE
      WHEN v_order_status IN ('shipped', 'partially_shipped') AND shipped_by IS NULL
      THEN auth.uid()
      ELSE shipped_by
    END
  WHERE id = p_sales_order_id;

  -- ============================================================================
  -- MISE À JOUR TIMESTAMP SHIPMENT
  -- ============================================================================
  UPDATE shipments
  SET shipped_at = NOW()
  WHERE id = p_shipment_id AND shipped_at IS NULL;

  -- ============================================================================
  -- RETOUR RÉSULTAT SUCCESS
  -- ============================================================================
  v_result := jsonb_build_object(
    'success', true,
    'order_status', v_order_status,
    'workflow', CASE WHEN v_has_parcel_items THEN 'advanced' ELSE 'simple' END,
    'message', format('Expédition créée avec succès. Commande: %s', v_order_status)
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- ============================================================================
-- COMMENTAIRE DOCUMENTATION
-- ============================================================================
COMMENT ON FUNCTION process_shipment_stock IS
'Process shipment stock with dual workflow support (ENUM FIXED):
- Simple workflow (default): Deduct all order items when parcel_items empty
- Advanced workflow (legacy): Use parcel_items for fine-grained product/parcel assignment
- Uses movement_type OUT instead of invalid sale enum value
Best practice for most cases: Simple workflow (Shopify/WooCommerce pattern)';
