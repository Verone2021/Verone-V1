'use client';

import { calculateMinimumSellingPrice } from '@verone/finance/utils';
import { createClient } from '@verone/utils/supabase/client';

import type { Product, ProductFilters } from './use-products';

export const PRODUCTS_PER_PAGE = 50;
export const CACHE_REVALIDATION_TIME = 5 * 60 * 1000; // 5 minutes

export const productsFetcher = async (
  _key: string,
  filters: ProductFilters | undefined,
  page: number = 0
) => {
  const supabase = createClient();

  let query = supabase
    .from('products')
    .select(
      `
      id,
      name,
      sku,
      slug,
      stock_status,
      product_status,
      condition,
      stock_quantity,
      margin_percentage,
      cost_price,
      variant_attributes,
      created_at,
      updated_at,
      subcategory_id,
      supplier_id,
      product_images (
        public_url,
        is_primary
      ),
      organisations!products_supplier_id_fkey (
        id,
        legal_name,
        trade_name
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(page * PRODUCTS_PER_PAGE, (page + 1) * PRODUCTS_PER_PAGE - 1);

  if (filters?.search?.trim()) {
    query = query.or(
      `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`
    );
  }

  if (filters?.status) {
    query = query.eq(
      'product_status',
      filters.status as NonNullable<Product['product_status']>
    );
  }

  if (filters?.supplier_id) {
    query = query.eq('supplier_id', filters.supplier_id);
  }

  if (filters?.subcategory_id) {
    query = query.eq('subcategory_id', filters.subcategory_id);
  }

  if (filters?.in_stock_only) {
    query = query.gt('stock_quantity', 0);
  }

  if (filters?.is_published_online !== undefined) {
    query = query.eq('is_published_online', filters.is_published_online);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const enriched = (data ?? []).map(product => {
    const { organisations, ...productWithoutOrgs } = product as Record<
      string,
      unknown
    >;

    return {
      ...productWithoutOrgs,
      primary_image_url: (product as Record<string, unknown>).product_images
        ? ((
            (product as Record<string, unknown>).product_images as Array<{
              public_url: string;
            }>
          )?.[0]?.public_url ?? null)
        : null,
      supplier_name:
        (organisations as Record<string, unknown>)?.trade_name ??
        (organisations as Record<string, unknown>)?.legal_name ??
        undefined,
      supplier: organisations
        ? {
            id: (organisations as Record<string, unknown>).id,
            name:
              (organisations as Record<string, unknown>).trade_name ??
              (organisations as Record<string, unknown>).legal_name ??
              '',
            type: 'supplier',
          }
        : undefined,
      minimumSellingPrice:
        product.cost_price && product.margin_percentage
          ? calculateMinimumSellingPrice(
              Number(product.cost_price),
              Number(product.margin_percentage)
            )
          : 0,
    };
  });

  return { products: enriched, totalCount: count ?? 0 };
};
