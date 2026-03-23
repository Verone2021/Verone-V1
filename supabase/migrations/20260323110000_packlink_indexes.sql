-- Migration: Index pour requêtes Packlink
-- Date: 2026-03-23

-- Index partiel sur packlink_status (filtrage onglet "En cours Packlink")
CREATE INDEX IF NOT EXISTS idx_sales_order_shipments_packlink_status
ON sales_order_shipments (packlink_status)
WHERE packlink_status IS NOT NULL;

-- Index partiel sur packlink_shipment_id (lookup webhook par référence Packlink)
CREATE INDEX IF NOT EXISTS idx_sales_order_shipments_packlink_id
ON sales_order_shipments (packlink_shipment_id)
WHERE packlink_shipment_id IS NOT NULL;
