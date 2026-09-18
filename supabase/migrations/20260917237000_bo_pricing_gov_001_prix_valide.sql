-- [BO-PRICING-GOV-001] Trace of who decided a channel price, and when
--
-- Why: nothing today tells a decided price apart from a default one. Two automatic
-- coefficients produced every price currently online (price_list_items at
-- cost x 1.5, and use-site-internet-products.ts at cost x 2.5), so "the product has
-- a price" never meant "someone chose that price".
--
-- IMPORTANT — no backfill on purpose. The 30 existing site prices were posted by the
-- bulk "add to site" hook, not decided by anyone. Stamping them as validated would
-- write a fact that never happened (.claude/rules/no-phantom-data.md). They stay
-- unstamped and the margin report lists them as "posed automatically, never reviewed".
--
-- Consequence for the site eligibility rule (separate migration, applied last):
-- what gates publication is the EXISTENCE of an explicit channel price, not this
-- stamp. Dropping the fallback to the base price list already takes the shop from
-- 125 to the 30 products that carry a real channel price. This stamp is what lets
-- the report say which of those 30 Romeo has since reviewed.

ALTER TABLE public.channel_pricing
  ADD COLUMN IF NOT EXISTS price_validated_at timestamptz,
  ADD COLUMN IF NOT EXISTS price_validated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.channel_pricing.price_validated_at IS
  'Date a laquelle ce prix a ete enregistre depuis un ecran par un humain. NULL = prix pose par un traitement automatique, jamais revu. Aucun remplissage retroactif. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.channel_pricing.price_validated_by IS
  'Utilisateur ayant enregistre ce prix depuis un ecran. [BO-PRICING-GOV-001]';

ALTER TABLE public.channel_pricing
  DROP CONSTRAINT IF EXISTS channel_pricing_price_validated_traceability;
ALTER TABLE public.channel_pricing
  ADD CONSTRAINT channel_pricing_price_validated_traceability
  CHECK (price_validated_by IS NULL OR price_validated_at IS NOT NULL);

-- Reading "which prices still carry no human decision" must stay cheap: the margin
-- report and the catalogue list both filter on it.
CREATE INDEX IF NOT EXISTS channel_pricing_not_validated_idx
  ON public.channel_pricing (channel_id)
  WHERE price_validated_at IS NULL;
