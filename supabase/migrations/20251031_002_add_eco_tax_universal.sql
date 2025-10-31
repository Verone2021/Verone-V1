-- Migration: Ajouter colonne eco_tax universelle (achats + ventes + produits)
-- Date: 2025-10-31
-- Objectif: Permettre édition éco-taxe par ligne dans commandes achats ET ventes
-- Architecture: Pattern snapshot (eco_tax_default indicatif dans products, eco_tax réel dans order_items)

-- ============================================================================
-- 1. AJOUTER COLONNES ECO_TAX AUX ITEMS COMMANDES
-- ============================================================================

-- Achats
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS eco_tax NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN purchase_order_items.eco_tax IS
  'Éco-taxe/éco-participation par ligne (ex: éco-mobilier France).
   Prix réel modifiable dans la commande (pattern snapshot).
   Copié depuis products.eco_tax_default lors ajout produit mais modifiable.';

-- Ventes
ALTER TABLE sales_order_items
ADD COLUMN IF NOT EXISTS eco_tax NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN sales_order_items.eco_tax IS
  'Éco-taxe/éco-participation par ligne (ex: éco-mobilier France).
   Prix réel modifiable dans la commande (pattern snapshot).
   Copié depuis products.eco_tax_default lors ajout produit mais modifiable.';

-- ============================================================================
-- 2. AJOUTER COLONNE ECO_TAX_DEFAULT AUX PRODUITS (Source Indicative)
-- ============================================================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS eco_tax_default NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN products.eco_tax_default IS
  'Éco-taxe par défaut (prix indicatif/informatif).
   Source pour auto-remplissage lors ajout produit dans commande.
   Pattern snapshot: valeur copiée dans order_items.eco_tax (modifiable dans chaque commande).';

-- ============================================================================
-- 3. ADAPTER TRIGGERS RECALCUL TOTAUX ACHATS
-- ============================================================================

-- Trigger recalcul total_ht purchase_orders (inclure eco_tax)
CREATE OR REPLACE FUNCTION recalculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht NUMERIC(10,2);
BEGIN
  -- Calculer total_ht en incluant éco-taxes
  SELECT COALESCE(SUM(
    (quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100))
    + COALESCE(eco_tax, 0)
  ), 0)
  INTO v_total_ht
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Mettre à jour totaux commande
  UPDATE purchase_orders
  SET
    total_ht = v_total_ht,
    total_ttc = v_total_ht * 1.20,  -- TVA 20%
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Remplacer triggers existants
DROP TRIGGER IF EXISTS recalculate_purchase_order_totals_trigger ON purchase_order_items;

CREATE TRIGGER recalculate_purchase_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_purchase_order_totals();

-- ============================================================================
-- 4. ADAPTER TRIGGERS RECALCUL TOTAUX VENTES
-- ============================================================================

-- Trigger recalcul total_ht sales_orders (inclure eco_tax)
CREATE OR REPLACE FUNCTION recalculate_sales_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht NUMERIC(10,2);
BEGIN
  -- Calculer total_ht en incluant éco-taxes
  SELECT COALESCE(SUM(
    (quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100))
    + COALESCE(eco_tax, 0)
  ), 0)
  INTO v_total_ht
  FROM sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Mettre à jour totaux commande
  UPDATE sales_orders
  SET
    total_ht = v_total_ht,
    total_ttc = v_total_ht * 1.20,  -- TVA 20%
    updated_at = NOW()
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Remplacer triggers existants
DROP TRIGGER IF EXISTS recalculate_sales_order_totals_trigger ON sales_order_items;

CREATE TRIGGER recalculate_sales_order_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON sales_order_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_sales_order_totals();

-- ============================================================================
-- 5. VALIDATION & TESTS
-- ============================================================================

-- Vérifier colonnes ajoutées
DO $$
BEGIN
  RAISE NOTICE '✅ Vérification colonnes eco_tax...';

  -- purchase_order_items
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchase_order_items' AND column_name = 'eco_tax'
  ) THEN
    RAISE NOTICE '  ✅ purchase_order_items.eco_tax existe';
  ELSE
    RAISE EXCEPTION '  ❌ purchase_order_items.eco_tax MANQUANT';
  END IF;

  -- sales_order_items
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sales_order_items' AND column_name = 'eco_tax'
  ) THEN
    RAISE NOTICE '  ✅ sales_order_items.eco_tax existe';
  ELSE
    RAISE EXCEPTION '  ❌ sales_order_items.eco_tax MANQUANT';
  END IF;

  -- products
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'eco_tax_default'
  ) THEN
    RAISE NOTICE '  ✅ products.eco_tax_default existe';
  ELSE
    RAISE EXCEPTION '  ❌ products.eco_tax_default MANQUANT';
  END IF;

  RAISE NOTICE '✅ Migration eco_tax universelle complète';
END $$;
