/**
 * Migration: BO-FIN-046 — Verrous DB + audit trail
 *
 * 1. NOT NULL + CHECK sur sales_order_items.tax_rate
 * 2. formula_version TEXT sur financial_document_items
 * 3. updated_by UUID sur sales_orders + trigger set_updated_by
 *
 * Pré-requis: audit NULL tax_rate = 0 (confirmé avant apply)
 */

BEGIN;

-- ============================================================================
-- 1. sales_order_items.tax_rate → NOT NULL + CHECK valeurs FR autorisées
-- ============================================================================

-- Backfill conservateur (0 rows en prod, garde-fou)
UPDATE sales_order_items SET tax_rate = 0.2 WHERE tax_rate IS NULL;

-- NOT NULL
ALTER TABLE sales_order_items
  ALTER COLUMN tax_rate SET NOT NULL;

-- CHECK : taux TVA FR standard + cas exonération (0) + taux intermédiaires
ALTER TABLE sales_order_items
  ADD CONSTRAINT sales_order_items_tax_rate_valid
    CHECK (tax_rate IN (0, 0.021, 0.055, 0.085, 0.10, 0.20));

-- ============================================================================
-- 2. financial_document_items.formula_version — traçabilité formule calcul
-- ============================================================================

ALTER TABLE financial_document_items
  ADD COLUMN IF NOT EXISTS formula_version TEXT NOT NULL DEFAULT 'round-per-line-v1';

-- Backfill des lignes existantes (antérieures à BO-FIN-046)
UPDATE financial_document_items
  SET formula_version = 'round-per-line-v1'
  WHERE formula_version IS DISTINCT FROM 'round-per-line-v1';

-- ============================================================================
-- 3. sales_orders.updated_by + trigger — audit trail modification
-- ============================================================================

ALTER TABLE sales_orders
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Trigger : remplir updated_by = auth.uid() à chaque UPDATE
CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer si existe (idempotent)
DROP TRIGGER IF EXISTS trg_sales_orders_set_updated_by ON sales_orders;

CREATE TRIGGER trg_sales_orders_set_updated_by
  BEFORE UPDATE ON sales_orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_by();

-- ============================================================================
-- Vérifications post-migration
-- ============================================================================

DO $$
DECLARE
  v_null_tax_rate  INT;
  v_wrong_rate     INT;
BEGIN
  SELECT COUNT(*) INTO v_null_tax_rate
    FROM sales_order_items WHERE tax_rate IS NULL;

  SELECT COUNT(*) INTO v_wrong_rate
    FROM sales_order_items
    WHERE tax_rate NOT IN (0, 0.021, 0.055, 0.085, 0.10, 0.20);

  IF v_null_tax_rate > 0 THEN
    RAISE EXCEPTION 'tax_rate NULL encore présent : % rows', v_null_tax_rate;
  END IF;

  IF v_wrong_rate > 0 THEN
    RAISE EXCEPTION 'tax_rate hors valeurs autorisées : % rows', v_wrong_rate;
  END IF;

  RAISE NOTICE 'BO-FIN-046 migration OK : tax_rate propre, formula_version posé, updated_by actif';
END $$;

COMMIT;
