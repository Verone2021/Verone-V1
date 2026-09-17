-- [BO-PRICING-GOV-001] get_categories_with_real_counts returns the new coefficients
--
-- Why: use-categories.ts casts this function's rows to CategoryWithCount, i.e. to the
-- full categories Row type. Adding retail_coefficient / wholesale_coefficient to the
-- table without adding them here would make that cast claim two fields the function
-- never returns: TypeScript would say `number | null`, runtime would hand back
-- undefined. Extending the function keeps the cast honest.
--
-- The return type changes, so CREATE OR REPLACE is not enough: DROP then CREATE.
-- Grants are re-applied because DROP loses them (see 20260915170000 lot 7: this
-- function is closed to anon and PUBLIC, open to authenticated and service_role).

DROP FUNCTION IF EXISTS public.get_categories_with_real_counts();

CREATE FUNCTION public.get_categories_with_real_counts()
RETURNS TABLE (
  id uuid,
  name character varying,
  slug character varying,
  description text,
  level integer,
  display_order integer,
  family_id uuid,
  google_category_id integer,
  facebook_category character varying,
  image_url text,
  is_active boolean,
  retail_coefficient numeric,
  wholesale_coefficient numeric,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  subcategory_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.slug,
    c.description,
    c.level,
    c.display_order,
    c.family_id,
    c.google_category_id,
    c.facebook_category,
    c.image_url,
    c.is_active,
    c.retail_coefficient,
    c.wholesale_coefficient,
    c.created_at,
    c.updated_at,
    COUNT(s.id) AS subcategory_count
  FROM categories c
  LEFT JOIN subcategories s ON s.category_id = c.id
  GROUP BY
    c.id,
    c.name,
    c.slug,
    c.description,
    c.level,
    c.display_order,
    c.family_id,
    c.google_category_id,
    c.facebook_category,
    c.image_url,
    c.is_active,
    c.retail_coefficient,
    c.wholesale_coefficient,
    c.created_at,
    c.updated_at
  ORDER BY c.level, c.display_order;
END;
$function$;

-- R-GRANT (.claude/rules/database.md): closed to visitors, open to signed-in users.
REVOKE EXECUTE ON FUNCTION public.get_categories_with_real_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_categories_with_real_counts() TO authenticated, service_role;
