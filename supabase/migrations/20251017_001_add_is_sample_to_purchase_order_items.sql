-- Migration: Ajout colonne is_sample à purchase_order_items
-- Date: 2025-10-17
-- Description: Permet de marquer un item de commande achat comme échantillon
-- Business Rule: Les échantillons sont généralement en quantité 1 pour tester avant achat en volume

-- Ajout de la colonne is_sample
ALTER TABLE purchase_order_items
ADD COLUMN IF NOT EXISTS is_sample boolean NOT NULL DEFAULT false;

-- Commentaire pour documentation
COMMENT ON COLUMN purchase_order_items.is_sample IS
'Indique si cet item est un échantillon. Les échantillons sont commandés pour validation qualité avant commande en volume (quantité généralement 1).';

-- Index pour requêtes fréquentes sur les échantillons
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_is_sample
ON purchase_order_items(is_sample)
WHERE is_sample = true;

-- Commentaire sur l'index
COMMENT ON INDEX idx_purchase_order_items_is_sample IS
'Index partiel pour optimiser les requêtes cherchant uniquement les items échantillons';
