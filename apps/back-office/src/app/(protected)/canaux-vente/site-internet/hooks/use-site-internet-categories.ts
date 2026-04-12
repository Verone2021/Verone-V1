/**
 * Hook: useSiteInternetCategories
 *
 * Builds the real hierarchy: Family -> Category -> Subcategory
 * Filtered to only show branches with published products (is_published_online = true).
 * Source of truth = back-office catalogue. No manual management.
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

export interface SiteSubcategory {
  id: string;
  name: string;
  slug: string | null;
  publishedCount: number;
}

export interface SiteCategory {
  id: string;
  name: string;
  slug: string | null;
  subcategories: SiteSubcategory[];
  publishedCount: number;
}

export interface SiteFamily {
  id: string;
  name: string;
  categories: SiteCategory[];
  publishedCount: number;
}

export interface SiteCategoryStats {
  families: number;
  categories: number;
  subcategories: number;
  totalPublished: number;
}

async function fetchCategoryTree(): Promise<{
  tree: SiteFamily[];
  stats: SiteCategoryStats;
}> {
  // Query families, categories, subcategories with product counts
  const [familiesRes, categoriesRes, subcategoriesRes, productsRes] =
    await Promise.all([
      supabase
        .from('families')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('categories')
        .select('id, name, slug, family_id')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('subcategories')
        .select('id, name, slug, category_id')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('products')
        .select('subcategory_id')
        .eq('is_published_online', true)
        .eq('product_status', 'active'),
    ]);

  // Count published products per subcategory
  const countMap = new Map<string, number>();
  for (const p of productsRes.data ?? []) {
    const scId = (p as { subcategory_id: string | null }).subcategory_id;
    if (scId) countMap.set(scId, (countMap.get(scId) ?? 0) + 1);
  }

  type FamilyRow = { id: string; name: string };
  type CategoryRow = {
    id: string;
    name: string;
    slug: string | null;
    family_id: string;
  };
  type SubcategoryRow = {
    id: string;
    name: string;
    slug: string | null;
    category_id: string;
  };

  const families = (familiesRes.data ?? []) as FamilyRow[];
  const categories = (categoriesRes.data ?? []) as CategoryRow[];
  const subcategories = (subcategoriesRes.data ?? []) as SubcategoryRow[];

  // Build tree, filtering out branches with 0 published products
  const tree: SiteFamily[] = [];

  for (const f of families) {
    const fCats = categories.filter(c => c.family_id === f.id);
    const siteCats: SiteCategory[] = [];

    for (const c of fCats) {
      const cSubs = subcategories.filter(sc => sc.category_id === c.id);
      const siteSubs: SiteSubcategory[] = [];

      for (const sc of cSubs) {
        const count = countMap.get(sc.id) ?? 0;
        if (count > 0) {
          siteSubs.push({
            id: sc.id,
            name: sc.name,
            slug: sc.slug,
            publishedCount: count,
          });
        }
      }

      if (siteSubs.length > 0) {
        siteCats.push({
          id: c.id,
          name: c.name,
          slug: c.slug,
          subcategories: siteSubs,
          publishedCount: siteSubs.reduce((s, sc) => s + sc.publishedCount, 0),
        });
      }
    }

    if (siteCats.length > 0) {
      tree.push({
        id: f.id,
        name: f.name,
        categories: siteCats,
        publishedCount: siteCats.reduce((s, c) => s + c.publishedCount, 0),
      });
    }
  }

  const stats: SiteCategoryStats = {
    families: tree.length,
    categories: tree.reduce((sum, f) => sum + f.categories.length, 0),
    subcategories: tree.reduce(
      (sum, f) =>
        sum + f.categories.reduce((s, c) => s + c.subcategories.length, 0),
      0
    ),
    totalPublished: tree.reduce((sum, f) => sum + f.publishedCount, 0),
  };

  return { tree, stats };
}

export function useSiteInternetCategories() {
  return useQuery({
    queryKey: ['site-internet-categories-tree'],
    queryFn: fetchCategoryTree,
    staleTime: 120_000,
  });
}
