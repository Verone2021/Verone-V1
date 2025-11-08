-- Migration: Ajouter colonne eco_tax_total pour séparer l'éco-taxe du prix HT
-- Date: 2025-11-06
-- Description: Permet d'afficher séparément l'éco-taxe (conformité légale France)

-- ============================================================================
-- PHASE 1: Ajouter colonnes eco_tax_total
-- ============================================================================

-- Commandes clients
ALTER TABLE sales_orders
ADD COLUMN IF NOT EXISTS eco_tax_total DECIMAL(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN sales_orders.eco_tax_total IS 'Montant total éco-taxe (DEEE) pour la commande - calculé automatiquement depuis les lignes';

-- Commandes fournisseurs
ALTER TABLE purchase_orders
ADD COLUMN IF NOT EXISTS eco_tax_total DECIMAL(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN purchase_orders.eco_tax_total IS 'Montant total éco-taxe (DEEE) pour la commande - calculé automatiquement depuis les lignes';

-- ============================================================================
-- PHASE 2: Modifier triggers pour calculer eco_tax_total séparément
-- ============================================================================

-- Fonction de recalcul commandes clients
CREATE OR REPLACE FUNCTION public.recalculate_sales_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_total_ht DECIMAL(10,2);
  v_eco_tax_total DECIMAL(10,2);
  v_total_ttc DECIMAL(10,2);
  v_tax_rate DECIMAL(5,2);
BEGIN
  -- Récupérer le taux de TVA de la commande
  SELECT COALESCE(tax_rate, 20) INTO v_tax_rate
  FROM sales_orders
  WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

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

  -- Calculer le total TTC (HT + éco-taxe) * (1 + TVA)
  v_total_ttc := (v_total_ht + v_eco_tax_total) * (1 + v_tax_rate / 100);

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
BEGIN
  -- Récupérer le taux de TVA de la commande
  SELECT COALESCE(tax_rate, 20) INTO v_tax_rate
  FROM purchase_orders
  WHERE id = COALESCE(NEW.purchase_order_id, OLD.purchase_order_id);

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

  -- Calculer le total TTC (HT + éco-taxe) * (1 + TVA)
  v_total_ttc := (v_total_ht + v_eco_tax_total) * (1 + v_tax_rate / 100);

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
-- PHASE 3: Recalculer toutes les commandes existantes
-- ============================================================================

-- Recalculer toutes les commandes clients
UPDATE sales_orders
SET
  eco_tax_total = (
    SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
    FROM sales_order_items
    WHERE sales_order_id = sales_orders.id
  ),
  total_ht = (
    SELECT COALESCE(SUM(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
    ), 0)
    FROM sales_order_items
    WHERE sales_order_id = sales_orders.id
  );

-- Recalculer les total_ttc après modification
UPDATE sales_orders
SET total_ttc = (total_ht + eco_tax_total) * (1 + COALESCE(tax_rate, 20) / 100);

-- Recalculer toutes les commandes fournisseurs
UPDATE purchase_orders
SET
  eco_tax_total = (
    SELECT COALESCE(SUM(COALESCE(eco_tax, 0)), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = purchase_orders.id
  ),
  total_ht = (
    SELECT COALESCE(SUM(
      quantity * unit_price_ht * (1 - COALESCE(discount_percentage, 0) / 100)
    ), 0)
    FROM purchase_order_items
    WHERE purchase_order_id = purchase_orders.id
  );

-- Recalculer les total_ttc après modification
UPDATE purchase_orders
SET total_ttc = (total_ht + eco_tax_total) * (1 + COALESCE(tax_rate, 20) / 100);

-- ============================================================================
-- PHASE 4: Vérification
-- ============================================================================

-- Log du nombre de commandes migrées
DO $$
DECLARE
  v_sales_count INTEGER;
  v_purchase_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_sales_count FROM sales_orders WHERE eco_tax_total > 0;
  SELECT COUNT(*) INTO v_purchase_count FROM purchase_orders WHERE eco_tax_total > 0;

  RAISE NOTICE '✅ Migration terminée:';
  RAISE NOTICE '   - % commandes clients avec éco-taxe', v_sales_count;
  RAISE NOTICE '   - % commandes fournisseurs avec éco-taxe', v_purchase_count;
END $$;
