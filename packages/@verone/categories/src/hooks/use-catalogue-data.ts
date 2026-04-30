import { createClient } from '@verone/utils/supabase/client';

import type { Category, CatalogueFilters, Product } from './catalogue-types';

const supabase = createClient();

export async function loadCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, level, display_order, is_active')
    .eq('is_active', true)
    .order('level', { ascending: true })
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as Category[];
}

export async function resolveSubcategoryIds(
  filters: CatalogueFilters
): Promise<string[]> {
  const subcategoryIds = new Set<string>();

  if (filters.subcategories?.length) {
    filters.subcategories.forEach(id => subcategoryIds.add(id));
  }

  if (filters.categories?.length) {
    const { data: subcats } = await supabase
      .from('subcategories')
      .select('id')
      .in('category_id', filters.categories);

    subcats?.forEach(sub => subcategoryIds.add(sub.id));
  }

  if (filters.families?.length) {
    const { data: cats } = await supabase
      .from('categories')
      .select('id')
      .in('family_id', filters.families);

    if (cats?.length) {
      const categoryIds = cats.map(c => c.id);
      const { data: subcats } = await supabase
        .from('subcategories')
        .select('id')
        .in('category_id', categoryIds);

      subcats?.forEach(sub => subcategoryIds.add(sub.id));
    }
  }

  return Array.from(subcategoryIds);
}

const PRODUCT_SELECT = `
  id, sku, name, slug,
  cost_price, cost_price_count, product_type, stock_real,
  cost_net_avg, cost_net_last, cost_net_min, cost_net_max,
  margin_percentage, completion_percentage, completion_status,
  target_margin_percentage, target_price,
  stock_status, product_status, condition,
  subcategory_id, supplier_id, brand,
  has_images, dimensions, weight,
  archived_at, created_at, updated_at,
  supplier:organisations!supplier_id(id, legal_name, trade_name),
  subcategories!subcategory_id(id, name)
`;

export async function loadProducts(
  filters: CatalogueFilters = {},
  defaultLimit = 24
): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' });

  query = query.is('archived_at', null);
  query = query.neq('creation_mode', 'sourcing');

  if (filters.search) {
    // BO-CATALOG-SEARCH-001 : élargir la recherche aux colonnes brand,
    // gtin, supplier_reference (au lieu de seulement name + sku).
    // Permet de retrouver un produit via son code-barres, sa marque ou
    // sa référence fournisseur.
    const term = filters.search;
    query = query.or(
      `name.ilike.%${term}%,sku.ilike.%${term}%,brand.ilike.%${term}%,gtin.ilike.%${term}%,supplier_reference.ilike.%${term}%`
    );
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in(
      'product_status',
      filters.statuses as Array<
        'active' | 'preorder' | 'discontinued' | 'draft'
      >
    );
  }

  const hasHierarchyFilter =
    (filters.families?.length ?? 0) > 0 ||
    (filters.categories?.length ?? 0) > 0 ||
    (filters.subcategories?.length ?? 0) > 0;

  if (hasHierarchyFilter) {
    const resolvedSubcategoryIds = await resolveSubcategoryIds(filters);
    if (resolvedSubcategoryIds.length > 0) {
      query = query.in('subcategory_id', resolvedSubcategoryIds);
    } else {
      return { products: [], total: 0 };
    }
  }

  if (filters.suppliers && filters.suppliers.length > 0) {
    query = query.in('supplier_id', filters.suppliers);
  }

  if (filters.conditions && filters.conditions.length > 0) {
    query = query.in('condition', filters.conditions);
  }

  if (filters.brands && filters.brands.length > 0) {
    query = query.in('brand', filters.brands);
  }

  if (filters.publishedOnline === 'published') {
    query = query.eq('is_published_online', true);
  } else if (filters.publishedOnline === 'unpublished') {
    query = query.eq('is_published_online', false);
  }

  if (filters.priceMin !== undefined && filters.priceMin > 0) {
    query = query.gte('cost_price', filters.priceMin);
  }
  if (filters.priceMax !== undefined && filters.priceMax > 0) {
    query = query.lte('cost_price', filters.priceMax);
  }

  if (filters.marginMin !== undefined) {
    query = query.gte('margin_percentage', filters.marginMin);
  }
  if (filters.marginMax !== undefined) {
    query = query.lte('margin_percentage', filters.marginMax);
  }

  if (filters.stockLevels && filters.stockLevels.length > 0) {
    const parts: string[] = [];
    if (filters.stockLevels.includes('in_stock'))
      parts.push('stock_real.gt.10');
    if (filters.stockLevels.includes('low_stock'))
      parts.push('and(stock_real.gt.0,stock_real.lte.10)');
    if (filters.stockLevels.includes('out_of_stock'))
      parts.push('stock_real.eq.0,stock_real.is.null');
    if (parts.length > 0) query = query.or(parts.join(','));
  }

  if (filters.completionLevels && filters.completionLevels.length > 0) {
    const parts: string[] = [];
    if (filters.completionLevels.includes('high'))
      parts.push('completion_percentage.gt.80');
    if (filters.completionLevels.includes('medium'))
      parts.push(
        'and(completion_percentage.gte.50,completion_percentage.lte.80)'
      );
    if (filters.completionLevels.includes('low'))
      parts.push('completion_percentage.lt.50,completion_percentage.is.null');
    if (parts.length > 0) query = query.or(parts.join(','));
  }

  const limit = filters.limit ?? defaultLimit;
  const page = filters.page ?? 1;
  const offset = filters.offset ?? (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  query = query.order('updated_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return { products: (data ?? []) as Product[], total: count ?? 0 };
}

export async function loadArchivedProducts(
  filters: CatalogueFilters = {}
): Promise<{ products: Product[]; total: number }> {
  // BO-PERF-CATALOG-001 : utiliser `count: 'exact'` pour retourner le vrai
  // total (ancien comportement renvoyait `data.length` qui était limité à
  // la taille de la page → pagination cassée si > 50 archivés).
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' });

  query = query.not('archived_at', 'is', null);

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    );
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in(
      'product_status',
      filters.statuses as Array<
        'active' | 'preorder' | 'discontinued' | 'draft'
      >
    );
  }

  const hasHierarchyFilter =
    (filters.families?.length ?? 0) > 0 ||
    (filters.categories?.length ?? 0) > 0 ||
    (filters.subcategories?.length ?? 0) > 0;

  if (hasHierarchyFilter) {
    const resolvedSubcategoryIds = await resolveSubcategoryIds(filters);
    if (resolvedSubcategoryIds.length > 0) {
      query = query.in('subcategory_id', resolvedSubcategoryIds);
    } else {
      return { products: [], total: 0 };
    }
  }

  if (filters.suppliers && filters.suppliers.length > 0) {
    query = query.in('supplier_id', filters.suppliers);
  }

  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);
  query = query.order('archived_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return { products: (data ?? []) as Product[], total: count ?? 0 };
}

export async function loadIncompleteProducts(
  filters: CatalogueFilters = {},
  defaultLimit = 24
): Promise<{ products: Product[]; total: number }> {
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' });

  query = query.is('archived_at', null);
  query = query.neq('creation_mode', 'sourcing');

  const missing = filters.missingFields ?? [];
  if (missing.length > 0) {
    if (missing.includes('supplier')) query = query.is('supplier_id', null);
    if (missing.includes('subcategory'))
      query = query.is('subcategory_id', null);
    if (missing.includes('price')) query = query.is('cost_price', null);
    if (missing.includes('photo')) query = query.eq('has_images', false);
    if (missing.includes('dimensions')) query = query.is('dimensions', null);
    if (missing.includes('weight')) query = query.is('weight', null);
  } else {
    query = query.or(
      'supplier_id.is.null,subcategory_id.is.null,cost_price.is.null,has_images.eq.false,dimensions.is.null,weight.is.null'
    );
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    );
  }

  if (filters.statuses && filters.statuses.length > 0) {
    query = query.in(
      'product_status',
      filters.statuses as Array<
        'active' | 'preorder' | 'discontinued' | 'draft'
      >
    );
  }

  const hasHierarchyFilter =
    (filters.families?.length ?? 0) > 0 ||
    (filters.categories?.length ?? 0) > 0 ||
    (filters.subcategories?.length ?? 0) > 0;

  if (hasHierarchyFilter) {
    const resolvedSubcategoryIds = await resolveSubcategoryIds(filters);
    if (resolvedSubcategoryIds.length > 0) {
      query = query.in('subcategory_id', resolvedSubcategoryIds);
    } else {
      return { products: [], total: 0 };
    }
  }

  if (filters.suppliers && filters.suppliers.length > 0) {
    query = query.in('supplier_id', filters.suppliers);
  }

  const limit = filters.limit ?? defaultLimit;
  const page = filters.page ?? 1;
  const offset = filters.offset ?? (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  query = query.order('updated_at', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;

  return { products: (data ?? []) as Product[], total: count ?? 0 };
}
