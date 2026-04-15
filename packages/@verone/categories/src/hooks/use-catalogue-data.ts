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

export async function loadArchivedProducts(
  filters: CatalogueFilters = {}
): Promise<{ products: Product[]; total: number }> {
  let query = supabase.from('products').select(PRODUCT_SELECT);

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

  const { data, error } = await query;
  if (error) throw error;

  return { products: (data || []) as Product[], total: (data || []).length };
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
