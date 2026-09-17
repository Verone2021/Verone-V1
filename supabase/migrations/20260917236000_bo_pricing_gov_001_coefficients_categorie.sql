-- [BO-PRICING-GOV-001] Recommended selling coefficients per category
--
-- Why: today two hard-coded coefficients compete and neither was ever decided by a
-- human. price_list_items holds cost_price x 1.5 for all 207 products (a WHOLESALE
-- coefficient, served on the public shop), and use-site-internet-products.ts posts
-- cost_price x 2.5 when adding a product to the site. Romeo's rule (2026-09-17):
-- Verone = retail shop, LinkMe = wholesaler, one coefficient each, per category.
--
-- Granularity: CATEGORY, not family. Only one family out of seven holds products
-- ('Maison et decoration', 202 of 209), so a per-family coefficient would be a
-- single global value.
--
-- These coefficients are ADVISORY ONLY. Nothing is blocked when a price falls below
-- them: the screens explain the gap and the margin report lists it. The only hard
-- rules live elsewhere (LinkMe must stay 5% under the site price; no publishing
-- without a landed cost).
--
-- Coefficients apply to the LANDED cost (purchase + shipping + customs), not to the
-- bare purchase price. Market references used, per category:
--   - usual coefficient of a French decoration shop: x2.5 (60% markup)
--   - decorative objects / wall decor: 60-70% markup
--   - textiles and accessories: 50-60% markup
--   - lighting and furniture: 30-40% in a decoration shop, 35-50% for furniture
--     retailers, with a x2-x3 step from wholesale to retail
--   - home decor wholesale margin: 40-55%
--   - a wholesale price normally sits 30-50% under the retail price

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS retail_coefficient numeric,
  ADD COLUMN IF NOT EXISTS wholesale_coefficient numeric;

COMMENT ON COLUMN public.categories.retail_coefficient IS
  'Coefficient de vente au detail conseille (site Verone), applique au prix de revient. Indicatif, jamais bloquant. NULL = utiliser le repli global app_settings.pricing_default_coefficients. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.categories.wholesale_coefficient IS
  'Coefficient de vente en gros conseille (LinkMe), applique au prix de revient. Indicatif, jamais bloquant. NULL = utiliser le repli global. [BO-PRICING-GOV-001]';

-- A coefficient below 1 would advise selling under cost; above 10 is a typo.
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_retail_coefficient_range;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_retail_coefficient_range
  CHECK (retail_coefficient IS NULL OR (retail_coefficient >= 1 AND retail_coefficient <= 10));

ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_wholesale_coefficient_range;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_wholesale_coefficient_range
  CHECK (wholesale_coefficient IS NULL OR (wholesale_coefficient >= 1 AND wholesale_coefficient <= 10));

-- The wholesale coefficient must stay under the retail one: LinkMe is meant to be
-- cheaper than the public shop. This is the structural rule, checked at the source.
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_wholesale_under_retail;
ALTER TABLE public.categories
  ADD CONSTRAINT categories_wholesale_under_retail
  CHECK (
    retail_coefficient IS NULL
    OR wholesale_coefficient IS NULL
    OR wholesale_coefficient < retail_coefficient
  );

-- Starting grid (Romeo adjusts it from Parametres afterwards).
UPDATE public.categories SET retail_coefficient = 2.3, wholesale_coefficient = 1.6 WHERE slug = 'mobilier';
UPDATE public.categories SET retail_coefficient = 2.9, wholesale_coefficient = 1.8 WHERE slug = 'objets-decoratifs';
UPDATE public.categories SET retail_coefficient = 2.4, wholesale_coefficient = 1.6 WHERE slug = 'eclairage';
UPDATE public.categories SET retail_coefficient = 2.6, wholesale_coefficient = 1.7 WHERE slug = 'plantes';
UPDATE public.categories SET retail_coefficient = 2.4, wholesale_coefficient = 1.7 WHERE slug = 'linge-maison';
UPDATE public.categories SET retail_coefficient = 2.5, wholesale_coefficient = 1.7 WHERE slug = 'accessoires';
UPDATE public.categories SET retail_coefficient = 2.7, wholesale_coefficient = 1.8 WHERE slug = 'art-de-table';
UPDATE public.categories SET retail_coefficient = 2.5, wholesale_coefficient = 1.7 WHERE slug = 'sante-bien-etre';

-- Global fallback for categories left without a coefficient (the five families with
-- no product today: electromenager, informatique, telephonie...).
INSERT INTO public.app_settings (setting_key, setting_value, setting_description, category, is_public)
VALUES (
  'pricing_default_coefficients',
  '{"retail": 2.5, "wholesale": 1.7}'::jsonb,
  'Coefficients de vente conseilles par defaut, appliques au prix de revient quand la categorie du produit n''en definit pas. Indicatifs, jamais bloquants. [BO-PRICING-GOV-001]',
  'pricing',
  false
)
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      setting_description = EXCLUDED.setting_description,
      category = EXCLUDED.category,
      updated_at = now();
