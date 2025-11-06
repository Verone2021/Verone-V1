-- Migration: Ajouter champ eco_tax_vat_rate pour TVA séparée sur éco-taxe
-- Date: 2025-11-06
-- Description: Permet de choisir un taux de TVA différent pour l'éco-taxe

-- ============================================================================
-- PHASE 1: Ajouter colonnes eco_tax_vat_rate
-- ============================================================================

-- Commandes clients
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS eco_tax_vat_rate DECIMAL(5,2) DEFAULT NULL;

COMMENT ON COLUMN sales_orders.eco_tax_vat_rate IS 'Taux de TVA spécifique pour l''éco-taxe (NULL = utilise tax_rate de la commande)';

-- Commandes fournisseurs
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS eco_tax_vat_rate DECIMAL(5,2) DEFAULT NULL;

COMMENT ON COLUMN purchase_orders.eco_tax_vat_rate IS 'Taux de TVA spécifique pour l''éco-taxe (NULL = utilise tax_rate de la commande)';

-- ============================================================================
-- PHASE 2: Modifier triggers pour utiliser eco_tax_vat_rate
-- ============================================================================

-- Fonction de recalcul commandes clients
CREATE OR REPLACE FUNCTION public.recalculate_sales_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht DECIMAL(10,2);
  v_eco_tax_total DECIMAL(10,2);
  v_total_ttc DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
  v_eco_tax_vat_rate DECIMAL(5,2);
BEGIN
  -- Récupérer les taux de TVA de la commande
  SELECT
    COALESCE(tax_rate, 20),
    eco_tax_vat_rate
  INTO v_tax_rate, v_eco_tax_vat_rate
  FROM sales_orders
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Si eco_tax_vat_rate est NULL, utiliser tax_rate
  v_eco_tax_vat_rate := COALESCE(v_eco_tax_vat_rate, v_tax_rate);

  -- Calculer le total HT (SANS éco-taxe)
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_ht
  FROM sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Calculer le total éco-taxe séparément
  SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
  INTO v_eco_tax_total
  FROM sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Calculer le total TTC
  -- Formule: (HT * (1 + TVA_produits)) + (eco_tax * (1 + TVA_eco_taxe))
  v_total_ttc := (v_total_ht * (1 + v_tax_rate / 100)) + (v_eco_tax_total * (1 + v_eco_tax_vat_rate / 100));

  -- Mettre à jour la commande
  UPDATE sales_orders
  SET
    total_ht = v_total_ht,
    eco_tax_total = v_eco_tax_total,
    total_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction de recalcul commandes fournisseurs
CREATE OR REPLACE FUNCTION public.recalculate_purchase_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht DECIMAL(10,2);
  v_eco_tax_total DECIMAL(10,2);
  v_total_ttc DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
  v_eco_tax_vat_rate DECIMAL(5,2);
BEGIN
  -- Récupérer les taux de TVA de la commande
  SELECT
    COALESCE(tax_rate, 20),
    eco_tax_vat_rate
  INTO v_tax_rate, v_eco_tax_vat_rate
  FROM purchase_orders
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Si eco_tax_vat_rate est NULL, utiliser tax_rate
  v_eco_tax_vat_rate := COALESCE(v_eco_tax_vat_rate, v_tax_rate);

  -- Calculer le total HT (SANS éco-taxe)
  SELECT COALESCE(SUM(
    quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
  ), 0)
  INTO v_total_ht
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Calculer le total éco-taxe séparément
  SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
  INTO v_eco_tax_total
  FROM purchase_order_items
  WHERE purchase_order_id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  -- Calculer le total TTC
  -- Formule: (HT * (1 + TVA_produits)) + (eco_tax * (1 + TVA_eco_taxe))
  v_total_ttc := (v_total_ht * (1 + v_tax_rate / 100)) + (v_eco_tax_total * (1 + v_eco_tax_vat_rate / 100));

  -- Mettre à jour la commande
  UPDATE purchase_orders
  SET
    total_ht = v_total_ht,
    eco_tax_total = v_eco_tax_total,
    total_ttc = v_total_ttc,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 3: Vérification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration terminée: eco_tax_vat_rate ajouté';
  RAISE NOTICE '   - NULL = utilise tax_rate de la commande';
  RAISE NOTICE '   - Valeur = TVA spécifique pour éco-taxe';
END $$;
