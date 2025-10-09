-- Migration: Système de gestion des expéditions multi-transporteurs
-- Description: Packlink, Mondial Relay, Chronotruck et expéditions manuelles
-- Author: Claude Code 2025
-- Date: 2025-10-10
-- Version: 2.0 (Corrigée après clarification utilisateur)

-- =============================================================================
-- 1. ENUM pour méthode d'expédition (CORRIGÉ)
-- =============================================================================

CREATE TYPE shipping_method AS ENUM (
  'packlink',      -- Agrégateur multi-transporteurs (API)
  'mondial_relay', -- Points relais (API ou manuel)
  'chronotruck',   -- Transport palettes (manuel via app.chronotruck.com)
  'manual'         -- Saisie manuelle libre
);

-- =============================================================================
-- 2. ENUM pour type d'expédition (NOUVEAU)
-- =============================================================================

CREATE TYPE shipment_type AS ENUM ('parcel', 'pallet');

-- =============================================================================
-- 3. TABLE PRINCIPALE: shipments
-- =============================================================================

CREATE TABLE shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence commande
  sales_order_id UUID NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,

  -- Méthode et type d'expédition
  shipping_method shipping_method NOT NULL,
  shipment_type shipment_type NOT NULL DEFAULT 'parcel',
  carrier_name TEXT, -- Nom du transporteur effectif (ex: "DPD", "Colissimo")
  service_name TEXT, -- Nom du service (ex: "Express", "Standard")

  -- Tracking
  tracking_number TEXT,
  tracking_url TEXT,

  -- Coûts
  cost_paid_eur DECIMAL(10, 2) DEFAULT 0, -- Coût réel payé au transporteur
  cost_charged_eur DECIMAL(10, 2) DEFAULT 0, -- Montant facturé au client (0 si inclus)

  -- Dates clés
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shipped_at TIMESTAMPTZ, -- Date réelle d'expédition
  delivered_at TIMESTAMPTZ, -- Date réelle de livraison
  estimated_delivery_at TIMESTAMPTZ, -- Date estimée de livraison

  -- Adresse expédition (copie au moment de l'expédition)
  shipping_address JSONB,

  -- Données API Packlink
  packlink_shipment_id TEXT, -- ID chez Packlink
  packlink_label_url TEXT, -- URL étiquette générée
  packlink_service_id INT, -- Service ID sélectionné
  packlink_response JSONB, -- Réponse complète API Packlink

  -- Données Mondial Relay
  mondial_relay_point_id TEXT, -- ID du point relais
  mondial_relay_point_name TEXT, -- Nom du point relais
  mondial_relay_point_address TEXT, -- Adresse complète du point relais
  mondial_relay_label_url TEXT, -- URL étiquette
  mondial_relay_response JSONB, -- Réponse API si disponible

  -- Données Chronotruck
  chronotruck_reference TEXT, -- Référence saisie manuellement depuis app
  chronotruck_palette_count INT, -- Nombre de palettes
  chronotruck_url TEXT, -- Lien vers la réservation
  chronotruck_data JSONB, -- Données additionnelles

  -- Notes et métadonnées
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. TABLE: shipping_parcels (multi-colis/palettes)
-- =============================================================================

CREATE TABLE shipping_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence expédition
  shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,

  -- Numéro de colis ou palette (1, 2, 3...)
  parcel_number INT NOT NULL,

  -- Type (parcel ou pallet)
  parcel_type shipment_type NOT NULL DEFAULT 'parcel',

  -- Dimensions et poids
  weight_kg DECIMAL(8, 2) NOT NULL,
  length_cm INT NOT NULL,
  width_cm INT NOT NULL,
  height_cm INT NOT NULL,

  -- Tracking spécifique au colis/palette (si multi-colis)
  parcel_tracking_number TEXT,

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte unicité numéro colis par expédition
  CONSTRAINT unique_parcel_number_per_shipment UNIQUE (shipment_id, parcel_number)
);

-- =============================================================================
-- 5. TABLE: parcel_items (contenu des colis/palettes)
-- =============================================================================

CREATE TABLE parcel_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Référence colis/palette
  parcel_id UUID NOT NULL REFERENCES shipping_parcels(id) ON DELETE CASCADE,

  -- Référence ligne de commande
  sales_order_item_id UUID NOT NULL REFERENCES sales_order_items(id) ON DELETE CASCADE,

  -- Quantité expédiée dans ce colis/palette
  quantity_shipped INT NOT NULL CHECK (quantity_shipped > 0),

  -- Métadonnées
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 6. INDEXES pour performance
-- =============================================================================

-- Recherche par commande
CREATE INDEX idx_shipments_sales_order ON shipments(sales_order_id);

-- Recherche par méthode
CREATE INDEX idx_shipments_method ON shipments(shipping_method);

-- Recherche par type
CREATE INDEX idx_shipments_type ON shipments(shipment_type);

-- Recherche par tracking
CREATE INDEX idx_shipments_tracking ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;

-- Recherche colis par expédition
CREATE INDEX idx_parcels_shipment ON shipping_parcels(shipment_id);

-- Recherche items par colis
CREATE INDEX idx_parcel_items_parcel ON parcel_items(parcel_id);

-- Recherche items par ligne commande
CREATE INDEX idx_parcel_items_order_item ON parcel_items(sales_order_item_id);

-- =============================================================================
-- 7. RLS (Row Level Security)
-- =============================================================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE parcel_items ENABLE ROW LEVEL SECURITY;

-- Policy: Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can read shipments"
  ON shipments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read parcels"
  ON shipping_parcels FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read parcel items"
  ON parcel_items FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Utilisateurs authentifiés peuvent créer
CREATE POLICY "Authenticated users can create shipments"
  ON shipments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create parcels"
  ON shipping_parcels FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create parcel items"
  ON parcel_items FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Utilisateurs authentifiés peuvent mettre à jour
CREATE POLICY "Authenticated users can update shipments"
  ON shipments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update parcels"
  ON shipping_parcels FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================================================
-- 8. TRIGGER: updated_at automatique
-- =============================================================================

CREATE TRIGGER set_shipments_updated_at
  BEFORE UPDATE ON shipments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 9. RPC FUNCTION: Créer expédition complète avec stock
-- =============================================================================

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
  v_total_shipped INT;
  v_order_status TEXT;
  v_result jsonb;
BEGIN
  -- 1. Récupérer tous les items expédiés via les colis/palettes
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
    -- 2. Créer mouvement de stock (sortie warehouse)
    INSERT INTO stock_movements (
      product_id,
      movement_type,
      quantity_change,
      reference_type,
      reference_id,
      performed_by,
      notes
    )
    VALUES (
      v_item.product_id,
      'sale', -- Type vente = sortie stock
      -v_item.total_qty_shipped, -- Négatif pour sortie
      'sales_order',
      p_sales_order_id,
      auth.uid(),
      format('Expédition via shipment %s', p_shipment_id)
    );

    -- 3. Mettre à jour quantity_shipped dans sales_order_items
    UPDATE sales_order_items
    SET quantity_shipped = quantity_shipped + v_item.total_qty_shipped
    WHERE id = v_item.order_item_id;
  END LOOP;

  -- 4. Calculer statut commande (shipped vs partially_shipped)
  SELECT
    CASE
      WHEN SUM(quantity) = SUM(quantity_shipped) THEN 'shipped'
      WHEN SUM(quantity_shipped) > 0 THEN 'partially_shipped'
      ELSE 'confirmed'
    END INTO v_order_status
  FROM sales_order_items
  WHERE sales_order_id = p_sales_order_id;

  -- 5. Mettre à jour statut + shipped_at dans sales_orders
  UPDATE sales_orders
  SET
    status = v_order_status::sales_order_status,
    shipped_at = CASE
      WHEN v_order_status = 'shipped' THEN NOW()
      ELSE shipped_at
    END,
    shipped_by = CASE
      WHEN v_order_status = 'shipped' THEN auth.uid()
      ELSE shipped_by
    END
  WHERE id = p_sales_order_id;

  -- 6. Mettre à jour shipped_at dans shipments
  UPDATE shipments
  SET shipped_at = NOW()
  WHERE id = p_shipment_id AND shipped_at IS NULL;

  -- 7. Retourner résultat
  v_result := jsonb_build_object(
    'success', true,
    'order_status', v_order_status,
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

-- =============================================================================
-- 10. COMMENTAIRES pour documentation
-- =============================================================================

COMMENT ON TABLE shipments IS 'Expéditions multi-transporteurs (Packlink, Mondial Relay, Chronotruck, Manuel)';
COMMENT ON TABLE shipping_parcels IS 'Colis/Palettes individuels d''une expédition (multi-colis)';
COMMENT ON TABLE parcel_items IS 'Contenu détaillé de chaque colis/palette (produits + quantités)';
COMMENT ON FUNCTION process_shipment_stock IS 'Traitement complet expédition: stock + statut commande';

COMMENT ON COLUMN shipments.shipping_method IS 'Méthode expédition: packlink (API), mondial_relay (API/manuel), chronotruck (manuel), manual (libre)';
COMMENT ON COLUMN shipments.shipment_type IS 'Type: parcel (colis) ou pallet (palette)';
COMMENT ON COLUMN shipments.chronotruck_reference IS 'Référence saisie depuis https://app.chronotruck.com/';

-- =============================================================================
-- FIN MIGRATION
-- =============================================================================
