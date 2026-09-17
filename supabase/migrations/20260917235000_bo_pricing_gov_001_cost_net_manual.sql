-- [BO-PRICING-GOV-001] Manual landed cost (prix de revient saisi a la main)
--
-- Why: products.cost_net_avg is computed by the PMP trigger from received purchase
-- order items (purchase price + allocated fees: shipping, customs, insurance).
-- 50 active products have no purchase history at all, so cost_net_avg is NULL and
-- their real margin cannot be computed. Romeo must be able to type the landed cost
-- by hand in that case.
--
-- Design: a separate column, NOT an override of cost_net_avg. The PMP trigger keeps
-- writing cost_net_avg untouched; the manual value simply takes precedence when
-- reading. That way a later purchase order never silently erases the manual entry,
-- and we can always show which of the two a displayed cost comes from.
--
-- Resolution order (see resolveCost in @verone/products/utils/product-sales-margin):
--   cost_net_manual  >  cost_net_avg (computed)  >  cost_price (purchase price only)

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_net_manual numeric,
  ADD COLUMN IF NOT EXISTS cost_net_manual_at timestamptz,
  ADD COLUMN IF NOT EXISTS cost_net_manual_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.products.cost_net_manual IS
  'Prix de revient HT saisi manuellement (achat + transport + douane + assurance). Prioritaire sur cost_net_avg a la lecture. N''est jamais ecrit par le declencheur PMP. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.products.cost_net_manual_at IS
  'Date de la derniere saisie manuelle du prix de revient. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.products.cost_net_manual_by IS
  'Utilisateur ayant saisi le prix de revient manuel. [BO-PRICING-GOV-001]';

-- A manual landed cost must be a strictly positive amount when present:
-- 0 or a negative value would silently produce an infinite / negative margin.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_net_manual_positive;
ALTER TABLE public.products
  ADD CONSTRAINT products_cost_net_manual_positive
  CHECK (cost_net_manual IS NULL OR cost_net_manual > 0);

-- Traceability columns only make sense together with a value.
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_cost_net_manual_traceability;
ALTER TABLE public.products
  ADD CONSTRAINT products_cost_net_manual_traceability
  CHECK (cost_net_manual IS NULL OR cost_net_manual_at IS NOT NULL);
