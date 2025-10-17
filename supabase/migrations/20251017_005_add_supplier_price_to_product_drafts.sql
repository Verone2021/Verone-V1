-- Migration: Add supplier_price to product_drafts
-- Date: 2025-10-17
-- Description: Add supplier_price column to product_drafts (replacement for cost_price)
-- Context: Migration 20251017_003 removed cost_price, must add supplier_price for Phase 1

BEGIN;

-- ============================================================================
-- Add supplier_price to product_drafts
-- ============================================================================

ALTER TABLE product_drafts
ADD COLUMN IF NOT EXISTS supplier_price DECIMAL(12,2)
  CONSTRAINT supplier_price_positive CHECK (supplier_price IS NULL OR supplier_price > 0);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_product_drafts_supplier_price
ON product_drafts(supplier_price)
WHERE supplier_price IS NOT NULL;

-- Documentation
COMMENT ON COLUMN product_drafts.supplier_price IS 'Prix d''achat fournisseur HT en euros (ex: 899.50). Champ principal Phase 1 remplaçant cost_price.';

-- Validation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product_drafts' AND column_name = 'supplier_price'
  ) THEN
    RAISE EXCEPTION 'ERREUR: Colonne supplier_price non créée dans product_drafts';
  END IF;

  RAISE NOTICE 'SUCCESS: supplier_price ajouté à product_drafts';
END $$;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================

/*
PROBLÈME RÉSOLU:
- Migration 20251017_003 a supprimé cost_price de product_drafts
- Mais product_drafts a besoin d'un champ prix pour workflow sourcing
- supplier_price est le champ standard Phase 1 (prix d'achat fournisseur)

ARCHITECTURE VÉRONE PHASE 1:
- product_drafts.supplier_price = Prix d'achat fournisseur (création brouillon)
- products.estimated_selling_price = Prix de vente calculé (marge 50%)
- products.margin_percentage = Marge standard 50%

WORKFLOW:
1. Création draft → supplier_price renseigné
2. Validation sourcing → vérifie supplier_price > 0
3. Passage catalogue → calcule estimated_selling_price = supplier_price × 1.5
*/
