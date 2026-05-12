-- Migration: Ajout colonne order_date dans linkme_commissions
-- Contexte: Le code dans [id]/page.tsx requête cette colonne mais elle n'a jamais
-- été créée. Le pattern order_number était déjà dénormalisé depuis sales_orders,
-- order_date suit le même principe pour éviter une jointure supplémentaire.
-- Données vérifiées: 130 rows, toutes avec order_id valide (audit 2026-05-12).

ALTER TABLE linkme_commissions
  ADD COLUMN IF NOT EXISTS order_date date;

-- Backfill depuis sales_orders via order_id
UPDATE linkme_commissions lc
SET order_date = so.order_date
FROM sales_orders so
WHERE so.id = lc.order_id
  AND lc.order_date IS NULL;

-- Index pour le tri chronologique dans la page détail
CREATE INDEX IF NOT EXISTS idx_linkme_commissions_order_date
  ON linkme_commissions(order_date DESC);

COMMENT ON COLUMN linkme_commissions.order_date
  IS 'Date de la commande client (dénormalisé depuis sales_orders.order_date, même pattern que order_number)';
