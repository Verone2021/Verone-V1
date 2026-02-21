-- Migration: Sync stock_quantity avec stock_real
-- Contexte: Les triggers d'achat écrivent uniquement dans stock_real.
-- La colonne stock_quantity (legacy) n'est pas mise à jour automatiquement.
-- Certaines parties de l'UI (ex: gestion échantillons) lisent stock_quantity.
-- Cette migration synchronise les deux colonnes une bonne fois pour toutes.

UPDATE products
SET stock_quantity = stock_real
WHERE stock_real IS NOT NULL
  AND (stock_quantity IS NULL OR stock_quantity != stock_real);
