-- ============================================
-- Migration: Commission TTC columns
-- Date: 2025-12-09
-- Description: Ajouter colonnes TTC pour commissions LinkMe
-- ============================================

-- ============================================
-- PHASE 1: Colonnes sales_order_items
-- ============================================

-- Ajouter colonne commission TTC par ligne (GENERATED)
-- Calcul: retrocession_amount * (1 + tax_rate)
ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS retrocession_amount_ttc NUMERIC(10, 2)
  GENERATED ALWAYS AS (
    COALESCE(retrocession_amount, 0) * (1 + COALESCE(tax_rate, 0.2))
  ) STORED;

COMMENT ON COLUMN sales_order_items.retrocession_amount_ttc IS
  'Commission TTC par ligne (calculée automatiquement: retrocession_amount * (1 + tax_rate))';

-- ============================================
-- PHASE 2: Colonnes linkme_commissions
-- ============================================

-- Ajouter colonnes pour TTC et référence commande
ALTER TABLE linkme_commissions
ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 4) DEFAULT 0.2,
ADD COLUMN IF NOT EXISTS affiliate_commission_ttc NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS order_number VARCHAR(50);

COMMENT ON COLUMN linkme_commissions.tax_rate IS
  'Taux TVA appliqué (défaut 20%)';
COMMENT ON COLUMN linkme_commissions.affiliate_commission_ttc IS
  'Commission TTC affilié (HT * (1 + tax_rate))';
COMMENT ON COLUMN linkme_commissions.order_number IS
  'Numéro de commande lisible (SO-2025-XXXXX)';

-- ============================================
-- PHASE 3: Trigger pour calcul automatique TTC
-- ============================================

CREATE OR REPLACE FUNCTION update_linkme_commission_ttc()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculer commission TTC si affiliate_commission est défini
  IF NEW.affiliate_commission IS NOT NULL THEN
    NEW.affiliate_commission_ttc := ROUND(
      NEW.affiliate_commission * (1 + COALESCE(NEW.tax_rate, 0.2)),
      2
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer trigger existant si présent
DROP TRIGGER IF EXISTS trg_linkme_commission_ttc ON linkme_commissions;

-- Créer le trigger
CREATE TRIGGER trg_linkme_commission_ttc
  BEFORE INSERT OR UPDATE OF affiliate_commission, tax_rate
  ON linkme_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_linkme_commission_ttc();

-- ============================================
-- PHASE 4: Migrer données existantes
-- ============================================

-- Mettre à jour order_number depuis sales_orders
UPDATE linkme_commissions lc
SET
  order_number = so.order_number,
  tax_rate = COALESCE(so.tax_rate, 0.2)
FROM sales_orders so
WHERE lc.order_id = so.id
  AND lc.order_number IS NULL;

-- Calculer commission TTC pour données existantes
UPDATE linkme_commissions
SET affiliate_commission_ttc = ROUND(
  affiliate_commission * (1 + COALESCE(tax_rate, 0.2)),
  2
)
WHERE affiliate_commission_ttc IS NULL
  AND affiliate_commission IS NOT NULL;

-- ============================================
-- PHASE 5: Index pour performances
-- ============================================

-- Index sur order_number pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_order_number
  ON linkme_commissions(order_number);

-- Index sur status pour filtrage
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_status
  ON linkme_commissions(status);

-- ============================================
-- VALIDATION
-- ============================================

DO $$
DECLARE
  v_count_items INTEGER;
  v_count_commissions INTEGER;
BEGIN
  -- Vérifier colonnes sales_order_items
  SELECT COUNT(*) INTO v_count_items
  FROM information_schema.columns
  WHERE table_name = 'sales_order_items'
    AND column_name = 'retrocession_amount_ttc';

  IF v_count_items = 0 THEN
    RAISE EXCEPTION 'Colonne retrocession_amount_ttc non créée dans sales_order_items';
  END IF;

  -- Vérifier colonnes linkme_commissions
  SELECT COUNT(*) INTO v_count_commissions
  FROM information_schema.columns
  WHERE table_name = 'linkme_commissions'
    AND column_name IN ('affiliate_commission_ttc', 'order_number', 'tax_rate');

  IF v_count_commissions < 3 THEN
    RAISE EXCEPTION 'Colonnes TTC non créées dans linkme_commissions (attendu: 3, trouvé: %)', v_count_commissions;
  END IF;

  RAISE NOTICE '✅ Migration commission TTC réussie';
END $$;
