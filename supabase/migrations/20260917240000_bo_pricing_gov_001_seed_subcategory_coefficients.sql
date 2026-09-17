-- [BO-PRICING-GOV-001] Seed the subcategory coefficients from their parent category
--
-- Decided by Romeo on 2026-09-17: the colour code on the catalogue line reads the
-- coefficient of the SUBCATEGORY first, and all 42 of them were empty, so every
-- product fell back to its category, then to the 2.5 / 1.7 default. Copying the
-- parent category's value down makes the verdict meaningful straight away; Romeo
-- then adjusts only the branches that really price differently.
--
-- Only subcategories that have none are touched, and only where the parent category
-- actually has one (the 2 subcategories of "Telephone et accessoires" keep inheriting).
--
-- Rolling back, should it ever be wanted:
--   UPDATE public.subcategories
--      SET retail_coefficient = NULL, wholesale_coefficient = NULL;
-- (before this migration, all 42 rows were NULL on both columns — measured 2026-09-17
--  21:25 UTC, along with the reference footprint: 125 products online, 13 845 EUR HT,
--  402 stock movements, 2 707 units in real stock, 147 forecast out, 207 base price
--  lines, 192 customer orders.)

UPDATE public.subcategories s
SET
  retail_coefficient = c.retail_coefficient,
  wholesale_coefficient = c.wholesale_coefficient,
  updated_at = now()
FROM public.categories c
WHERE c.id = s.category_id
  AND s.retail_coefficient IS NULL
  AND s.wholesale_coefficient IS NULL
  AND c.retail_coefficient IS NOT NULL;
