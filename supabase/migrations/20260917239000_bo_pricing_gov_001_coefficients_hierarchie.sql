-- [BO-PRICING-GOV-001] Advised coefficients on the whole product hierarchy
--
-- Correction of 20260917236000, which only put them on categories. Romeo pointed out
-- that the hierarchy is Familles > Categories > Sous-categories and that he creates
-- entries at every level, so the setting belongs at every level too.
--
-- Resolution order, most specific wins (see resolveCoefficient in
-- @verone/products/utils/pricing-governance):
--   subcategory > category > family > app_settings.pricing_default_coefficients
--
-- A level left empty simply defers to the one above: nothing to fill unless a branch
-- really prices differently. That is the pattern of category-level pricing rules in
-- Odoo and Brightpearl, and it is what keeps the grid small.

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS retail_coefficient numeric,
  ADD COLUMN IF NOT EXISTS wholesale_coefficient numeric;

ALTER TABLE public.subcategories
  ADD COLUMN IF NOT EXISTS retail_coefficient numeric,
  ADD COLUMN IF NOT EXISTS wholesale_coefficient numeric;

COMMENT ON COLUMN public.families.retail_coefficient IS
  'Coefficient de vente au detail conseille (site Verone), applique au prix de revient. NULL = repli global. Une categorie ou une sous-categorie peut le preciser. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.families.wholesale_coefficient IS
  'Coefficient de vente en gros conseille (LinkMe), applique au prix de revient. NULL = repli global. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.subcategories.retail_coefficient IS
  'Coefficient de vente au detail conseille, le plus precis : l''emporte sur la categorie et la famille. NULL = heriter. [BO-PRICING-GOV-001]';
COMMENT ON COLUMN public.subcategories.wholesale_coefficient IS
  'Coefficient de vente en gros conseille, le plus precis. NULL = heriter. [BO-PRICING-GOV-001]';

-- Same guards as on categories: a coefficient under 1 would advise selling at a loss,
-- above 10 is a typo, and wholesale must stay under retail at the level where both
-- are set (LinkMe is meant to be cheaper than the public shop).
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['families', 'subcategories'] LOOP
    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t || '_retail_coefficient_range');
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (retail_coefficient IS NULL OR (retail_coefficient >= 1 AND retail_coefficient <= 10))',
      t, t || '_retail_coefficient_range');

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t || '_wholesale_coefficient_range');
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (wholesale_coefficient IS NULL OR (wholesale_coefficient >= 1 AND wholesale_coefficient <= 10))',
      t, t || '_wholesale_coefficient_range');

    EXECUTE format(
      'ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I', t, t || '_wholesale_under_retail');
    EXECUTE format(
      'ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (retail_coefficient IS NULL OR wholesale_coefficient IS NULL OR wholesale_coefficient < retail_coefficient)',
      t, t || '_wholesale_under_retail');
  END LOOP;
END $$;

-- Starting value on the only family that holds products today, so a category created
-- tomorrow under it inherits something sensible instead of the global fallback.
UPDATE public.families
SET retail_coefficient = 2.5, wholesale_coefficient = 1.7
WHERE slug = 'maison-decoration'
  AND retail_coefficient IS NULL;
