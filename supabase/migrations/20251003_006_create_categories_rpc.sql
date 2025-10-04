-- Migration: Create RPC get_categories_with_real_counts
-- Date: 2025-10-03
-- Description: Créer la fonction RPC pour obtenir les catégories avec comptage réel des sous-catégories
--              Fix l'erreur 400 récurrente dans use-categories.ts

-- Supprimer la fonction si elle existe déjà (pour réappliquer proprement)
DROP FUNCTION IF EXISTS get_categories_with_real_counts();

-- Créer la fonction RPC
CREATE OR REPLACE FUNCTION get_categories_with_real_counts()
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  slug VARCHAR(255),
  description TEXT,
  level INTEGER,
  display_order INTEGER,
  family_id UUID,
  google_category_id INTEGER,
  facebook_category VARCHAR(255),
  image_url TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  subcategory_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    c.created_at,
    c.updated_at,
    COUNT(s.id) as subcategory_count
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
    c.created_at,
    c.updated_at
  ORDER BY c.level, c.display_order;
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_categories_with_real_counts() TO anon, authenticated;

-- Commentaire pour documentation
COMMENT ON FUNCTION get_categories_with_real_counts() IS
'Retourne toutes les catégories avec le comptage réel de leurs sous-catégories associées.
Utilisé par use-categories.ts pour éviter les multiples requêtes N+1.';
