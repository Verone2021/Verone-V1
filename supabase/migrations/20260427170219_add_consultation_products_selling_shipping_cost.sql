-- BO-CONSULT-FIX-002 : Transport vente facturable au client par ligne consultation
--
-- Pourquoi : avant cette colonne, les frais de transport ne pouvaient être saisis
-- qu'au niveau du devis (QuoteFeesSection.shippingCostHt). Côté consultation,
-- impossible de piloter la marge réelle (incluant ce qui sera refacturé au client).
--
-- Sémantique : selling_shipping_cost = TOTAL LIGNE pour l'expédition (cohérent
-- avec shipping_cost qui désigne le coût d'achat total, voir BO-CONSULT-FIX-002).
-- DEFAULT 0 → lignes existantes restent neutres (pas de transport refacturé).

ALTER TABLE public.consultation_products
  ADD COLUMN IF NOT EXISTS selling_shipping_cost numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.consultation_products.selling_shipping_cost IS
  'Transport vente facturé au client (total ligne, en EUR HT). DEFAULT 0. Distinct de shipping_cost qui est le coût d''achat. Permet de piloter la marge réelle = (vente × qty + selling_shipping_cost) - (achat × qty + shipping_cost).';
