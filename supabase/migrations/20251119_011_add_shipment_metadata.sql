-- Migration: Add optional shipment/reception metadata to stock_movements
-- Context: stock_movements = Event Sourcing audit trail (source of truth)
--          Add optional carrier/tracking metadata for receptions/shipments
-- Impact: +5 columns (all NULL/optional), +1 partial index
-- Priority: P1 - Architecture enhancement

-- =============================================
-- 1. ADD OPTIONAL METADATA COLUMNS
-- =============================================

ALTER TABLE stock_movements
ADD COLUMN IF NOT EXISTS carrier_name text,
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS delivery_note text,
ADD COLUMN IF NOT EXISTS received_by_name text,
ADD COLUMN IF NOT EXISTS shipped_by_name text;

-- =============================================
-- 2. ADD COLUMN COMMENTS (Documentation)
-- =============================================

COMMENT ON COLUMN stock_movements.carrier_name IS
'Nom transporteur (ex: Chronopost, DHL, DPD). OPTIONNEL. Renseigné pour expéditions/réceptions avec suivi transporteur.';

COMMENT ON COLUMN stock_movements.tracking_number IS
'Numéro suivi colis transporteur. OPTIONNEL. Permet recherche rapide expéditions clients.';

COMMENT ON COLUMN stock_movements.delivery_note IS
'Référence bon de livraison fournisseur (BL). OPTIONNEL. Utile pour audit réceptions.';

COMMENT ON COLUMN stock_movements.received_by_name IS
'Nom personne ayant réceptionné (si différent de performed_by). OPTIONNEL. Ex: livreur externe, prestataire.';

COMMENT ON COLUMN stock_movements.shipped_by_name IS
'Nom personne ayant expédié (si différent de performed_by). OPTIONNEL. Ex: préparateur commande externe.';

-- =============================================
-- 3. CREATE PARTIAL INDEX (Performance)
-- =============================================

-- Index UNIQUEMENT sur lignes avec tracking_number renseigné
-- Permet recherche rapide "Où est mon colis avec tracking XYZ123 ?"
CREATE INDEX IF NOT EXISTS idx_stock_movements_tracking
ON stock_movements(tracking_number)
WHERE tracking_number IS NOT NULL;

COMMENT ON INDEX idx_stock_movements_tracking IS
'Index partiel pour recherche rapide par numéro suivi transporteur. Optimisé (indexe UNIQUEMENT lignes avec tracking renseigné).';

-- =============================================
-- 4. VERIFICATION
-- =============================================

DO $$
DECLARE
  v_columns_added INT;
BEGIN
  -- Compter nouvelles colonnes ajoutées
  SELECT COUNT(*)
  INTO v_columns_added
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'stock_movements'
    AND column_name IN (
      'carrier_name',
      'tracking_number',
      'delivery_note',
      'received_by_name',
      'shipped_by_name'
    );

  IF v_columns_added = 5 THEN
    RAISE NOTICE '✅ 5 colonnes métadonnées ajoutées à stock_movements';
  ELSE
    RAISE WARNING 'ATTENTION: Seulement % colonnes ajoutées (5 attendues)', v_columns_added;
  END IF;
END $$;

-- Vérifier index créé
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE tablename = 'stock_movements'
  AND indexname = 'idx_stock_movements_tracking';

-- =============================================
-- 5. EXEMPLE USAGE (Documentation)
-- =============================================

/*
EXEMPLE 1 : Réception avec tracking transporteur

INSERT INTO stock_movements (
  product_id,
  movement_type,
  quantity_change,
  reference_type,
  reference_id,
  notes,
  carrier_name,         -- ✅ NOUVEAU
  tracking_number,      -- ✅ NOUVEAU
  delivery_note,        -- ✅ NOUVEAU
  performed_by
) VALUES (
  'uuid-product',
  'IN',
  40,
  'purchase_order',
  'uuid-po',
  'Réception commande PO-2025-001',
  'Chronopost',         -- Transporteur
  'XY123456789',        -- Numéro suivi
  'BL-FOURNISSEUR-001', -- Bon livraison
  auth.uid()
);

EXEMPLE 2 : Expédition client avec tracking

INSERT INTO stock_movements (
  product_id,
  movement_type,
  quantity_change,
  reference_type,
  reference_id,
  notes,
  carrier_name,
  tracking_number,
  performed_by
) VALUES (
  'uuid-product',
  'OUT',
  -30,
  'sales_order',
  'uuid-so',
  'Expédition commande SO-2025-045',
  'DPD',
  'AB987654321',
  auth.uid()
);

EXEMPLE 3 : Recherche par tracking number

SELECT
  sm.performed_at,
  sm.movement_type,
  sm.quantity_change,
  sm.carrier_name,
  sm.tracking_number,
  sm.notes,
  p.name AS product_name,
  u.email AS performed_by_user
FROM stock_movements sm
JOIN products p ON p.id = sm.product_id
JOIN auth.users u ON u.id = sm.performed_by
WHERE sm.tracking_number = 'XY123456789';
*/
