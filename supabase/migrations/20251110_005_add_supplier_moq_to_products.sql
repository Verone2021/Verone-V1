-- Migration: Ajouter colonne supplier_moq (Minimum Order Quantity) aux produits
-- Date: 2025-11-10
-- Description: MOQ = Quantité minimum de commande imposée par le fournisseur
--
-- Business Rule: Si une alerte indique shortage_quantity=5 mais supplier_moq=10,
-- la quantité suggérée dans QuickPurchaseOrderModal doit être 10 (pas 5).
--
-- Exemple:
--   - Produit: Canapé Stockholm
--   - Shortage: 5 unités (pour atteindre min_stock)
--   - MOQ fournisseur: 10 unités
--   - Quantité commandée: 10 ✅ (respecte MOQ, même si >shortage)

-- Ajouter colonne supplier_moq
ALTER TABLE products
ADD COLUMN IF NOT EXISTS supplier_moq INTEGER DEFAULT 1;

-- Commentaire
COMMENT ON COLUMN products.supplier_moq IS
'Minimum Order Quantity (MOQ) : Quantité minimum de commande imposée par le fournisseur.
Par défaut: 1 (pas de contrainte).
Utilisé dans QuickPurchaseOrderModal pour calculer suggestedQty = MAX(shortage, MOQ).';

-- Index pour performance (si on filtre souvent par MOQ)
CREATE INDEX IF NOT EXISTS idx_products_supplier_moq
  ON products(supplier_moq)
  WHERE supplier_moq > 1;

-- Contrainte: MOQ doit être >= 1
ALTER TABLE products
ADD CONSTRAINT chk_supplier_moq_positive
  CHECK (supplier_moq >= 1);

-- =============================================
-- Données exemple (optionnel - à adapter selon catalogue)
-- =============================================

-- Exemple: Fournisseur A impose MOQ=10 pour canapés
-- UPDATE products
-- SET supplier_moq = 10
-- WHERE category IN (SELECT id FROM categories WHERE name ILIKE '%canapé%');

-- Exemple: Fournisseur B impose MOQ=50 pour accessoires
-- UPDATE products
-- SET supplier_moq = 50
-- WHERE category IN (SELECT id FROM categories WHERE name ILIKE '%accessoire%');
