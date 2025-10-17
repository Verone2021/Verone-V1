-- Migration: Restaurer colonne cost_price dans products (rollback 20251017_003)
-- Date: 2025-10-17
-- Raison: Impl\u00e9mentation pattern LPP (Last Purchase Price)
-- Contexte: Migration 20251017_003 avait supprim\u00e9 cost_price par erreur

-- \ud83c\udfaf OBJECTIF
-- R\u00e9tablir colonne cost_price comme prix d'achat indicatif qui sera
-- automatiquement mis \u00e0 jour par trigger depuis purchase_orders valid\u00e9s.
-- Pattern LPP standard ERP (SAP, Dynamics 365).

-- 1. Recr\u00e9er colonne cost_price dans products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT NULL;

-- 2. Ajouter constraint CHECK (prix > 0 si d\u00e9fini)
ALTER TABLE products
ADD CONSTRAINT check_products_cost_price_positive
CHECK (cost_price IS NULL OR cost_price > 0);

-- 3. Cr\u00e9er index pour performance queries (WHERE cost_price IS NOT NULL)
CREATE INDEX IF NOT EXISTS idx_products_cost_price
ON products(cost_price)
WHERE cost_price IS NOT NULL; -- Partial index

-- 4. Documentation colonne
COMMENT ON COLUMN products.cost_price IS
  'Prix d''achat indicatif (Last Purchase Price - LPP).
   Auto-update via trigger depuis purchase_orders valid\u00e9s (status=received).
   Nullable, modifiable manuellement si besoin.
   Pattern ERP standard (SAP, Dynamics 365).
   Utilis\u00e9 pour calculs marge et analyses co\u00fbts.';

-- \u2705 R\u00c9SULTAT ATTENDU
-- - Colonne products.cost_price existe
-- - Constraint CHECK valide co\u00fbt > 0
-- - Index cr\u00e9\u00e9 pour performance
-- - Documentation claire du r\u00f4le LPP
-- - Pr\u00eat pour trigger auto-update (migration suivante 20251017_008)
