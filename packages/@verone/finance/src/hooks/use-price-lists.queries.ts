/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

import { useQuery } from '@tanstack/react-query';

import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

import type {
  PriceList,
  PriceListItem,
  PriceListType,
} from './use-price-lists.types';

export function usePriceLists(filters?: {
  list_type?: PriceListType;
  is_active?: boolean;
}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-lists', filters],
    queryFn: async (): Promise<PriceList[]> => {
      try {
        let query = (supabase as { from: CallableFunction })
          .from('price_lists')
          .select(
            'id, code, name, description, list_type, priority, currency, valid_from, valid_until, is_active, created_at, updated_at, created_by, updated_by'
          )
          .order('priority', { ascending: true });

        if (filters?.list_type) {
          query = query.eq('list_type', filters.list_type);
        }

        if (filters?.is_active !== undefined) {
          query = query.eq('is_active', filters.is_active);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch price lists', undefined, {
            operation: 'usePriceLists',
            error: error.message,
            filters,
          });
          throw error;
        }

        logger.info('Price lists fetched successfully', {
          operation: 'usePriceLists',
          count: data?.length ?? 0,
        });

        return (data as unknown as PriceList[]) ?? [];
      } catch (error) {
        logger.error('Exception in usePriceLists', undefined, {
          operation: 'usePriceLists',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePriceList(priceListId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-list', priceListId],
    queryFn: async (): Promise<PriceList | null> => {
      if (!priceListId) return null;

      try {
        const { data, error } = await (supabase as { from: CallableFunction })
          .from('price_lists')
          .select(
            'id, code, name, description, list_type, priority, currency, valid_from, valid_until, is_active, created_at, updated_at, created_by, updated_by'
          )
          .eq('id', priceListId)
          .single();

        if (error) {
          logger.error('Failed to fetch price list', undefined, {
            operation: 'usePriceList',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        return data as unknown as PriceList;
      } catch (error) {
        logger.error('Exception in usePriceList', undefined, {
          operation: 'usePriceList',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!priceListId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePriceListItems(priceListId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['price-list-items', priceListId],
    queryFn: async (): Promise<PriceListItem[]> => {
      if (!priceListId) return [];

      try {
        const { data, error } = await (supabase as { from: CallableFunction })
          .from('price_list_items')
          .select(
            `
            id,
            price_list_id,
            product_id,
            cost_price,
            discount_rate,
            min_quantity,
            max_quantity,
            margin_rate,
            currency,
            valid_from,
            valid_until,
            is_active,
            notes,
            created_at,
            updated_at,
            products (
              id,
              name,
              sku,
              cost_price,
              product_images!left (
                public_url,
                is_primary
              )
            ),
            price_lists (
              id,
              code,
              name
            )
          `
          )
          .eq('price_list_id', priceListId)
          .order('min_quantity', { ascending: true });

        if (error) {
          logger.error('Failed to fetch price list items', undefined, {
            operation: 'usePriceListItems',
            priceListId,
            error: error.message,
          });
          throw error;
        }

        logger.info('Price list items fetched successfully', {
          operation: 'usePriceListItems',
          priceListId,
          count: data?.length ?? 0,
        });

        // Enrichir les produits avec primary_image_url (BR-TECH-002)
        interface PriceListItemRow {
          products: {
            product_images?: Array<{ public_url: string; is_primary: boolean }>;
            [key: string]: unknown;
          } | null;
          [key: string]: unknown;
        }
        const enrichedItems = ((data ?? []) as PriceListItemRow[]).map(
          item => ({
            ...item,
            products: item.products
              ? {
                  ...item.products,
                  primary_image_url:
                    item.products.product_images?.[0]?.public_url ?? null,
                }
              : null,
          })
        );

        return enrichedItems as unknown as PriceListItem[];
      } catch (error) {
        logger.error('Exception in usePriceListItems', undefined, {
          operation: 'usePriceListItems',
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    enabled: !!priceListId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
