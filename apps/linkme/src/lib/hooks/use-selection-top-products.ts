'use client';

/**
 * Hook: useSelectionTopProducts
 * Top produits vendus pour une sélection spécifique
 *
 * @module use-selection-top-products
 * @since 2026-04-14 (extrait de use-affiliate-analytics.ts)
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-selection';
import type { TopProductData } from '../../types/analytics';

const supabase = createClient();

export { affiliateAnalyticsKeys } from './use-affiliate-analytics';

export function useSelectionTopProducts(selectionId: string | null) {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['affiliate-analytics', 'selection-products', selectionId],
    queryFn: async (): Promise<TopProductData[]> => {
      if (!selectionId || !affiliate) return [];

      const { data: commissionsData } = await supabase
        .from('linkme_commissions')
        .select('order_id')
        .eq('affiliate_id', affiliate.id)
        .eq('selection_id', selectionId);

      const orderIds = (commissionsData ?? [])
        .map(c => c.order_id)
        .filter((id): id is string => !!id);

      if (orderIds.length === 0) return [];

      const { data: orderItemsData } = await supabase
        .from('linkme_order_items_enriched')
        .select('product_id, quantity, total_ht, affiliate_margin')
        .in('sales_order_id', orderIds);

      const orderItems = orderItemsData ?? [];
      const productMap = new Map<
        string,
        { quantity: number; revenue: number; commission: number }
      >();

      orderItems.forEach(item => {
        const productId = item.product_id;
        if (!productId) return;
        if (!productMap.has(productId)) {
          productMap.set(productId, { quantity: 0, revenue: 0, commission: 0 });
        }
        const entry = productMap.get(productId)!;
        entry.quantity += item.quantity ?? 0;
        entry.revenue += item.total_ht ?? 0;
        entry.commission += item.affiliate_margin ?? 0;
      });

      const productIds = Array.from(productMap.keys());
      if (productIds.length === 0) return [];

      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, sku')
        .in('id', productIds);

      const { data: imagesData } = await supabase
        .from('product_images')
        .select('product_id, public_url')
        .in('product_id', productIds)
        .eq('is_primary', true);

      const imageMap = new Map(
        (imagesData ?? []).map(img => [img.product_id, img.public_url])
      );
      const productsInfo = new Map(
        (productsData ?? []).map(p => [p.id, { name: p.name, sku: p.sku }])
      );

      return Array.from(productMap.entries())
        .map(([productId, data]) => {
          const info = productsInfo.get(productId);
          return {
            productId,
            productName: info?.name ?? 'Produit inconnu',
            productSku: info?.sku ?? '',
            productImageUrl: imageMap.get(productId) ?? null,
            quantitySold: data.quantity,
            revenueHT: data.revenue,
            commissionHT: data.commission,
            selectionId,
          };
        })
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .slice(0, 5);
    },
    enabled: !!selectionId && !!affiliate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
}
