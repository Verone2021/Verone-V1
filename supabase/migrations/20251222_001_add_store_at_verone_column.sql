-- =====================================================
-- MIGRATION: Ajouter colonne store_at_verone aux produits
-- Date: 2025-12-22
-- Description: Permet aux affilies d'indiquer s'ils veulent que
--              Verone stocke et expedie leurs produits
-- =====================================================

-- Ajouter la colonne store_at_verone
ALTER TABLE products
ADD COLUMN IF NOT EXISTS store_at_verone BOOLEAN DEFAULT FALSE;

-- Commentaire explicatif
COMMENT ON COLUMN products.store_at_verone IS
'Indique si le produit est stocke chez Verone (true) ou gere par l''affilie (false)';

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================
