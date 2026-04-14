'use server';

import { cache } from 'react';
import { createServerClient } from '@verone/utils/supabase/server';

export interface ProductCompleteness {
  total: number;
  active: number;
  draft: number;
  preorder: number;
  missingPhotos: number;
  missingDescription: number;
  missingCostPrice: number;
  missingCategory: number;
  missingMetaDescription: number;
  missingSellPrice: number;
  activeNoStock: number;
  stockAlerts: number;
  avgCompletion: number;
}

export const getProductCompleteness = cache(
  async (): Promise<ProductCompleteness> => {
    const supabase = await createServerClient();

    try {
      const [productsData, stockAlertsData, sellPriceData] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, product_status, has_images, description, meta_description, cost_price, stock_real, subcategory_id, completion_percentage'
          )
          .is('archived_at', null),
        supabase
          .from('stock_alerts_unified_view')
          .select('id', { count: 'exact' }),
        supabase
          .from('channel_pricing')
          .select('product_id')
          .gt('custom_price_ht', 0),
      ]);

      const products = productsData.data ?? [];
      const active = products.filter(p => p.product_status === 'active');
      const draft = products.filter(p => p.product_status === 'draft');
      const preorder = products.filter(p => p.product_status === 'preorder');

      // Products with at least one sell price
      const productsWithSellPrice = new Set(
        (sellPriceData.data ?? []).map(cp => cp.product_id)
      );

      // Average completion
      const completions = products.map(p => p.completion_percentage ?? 0);
      const avgCompletion =
        completions.length > 0
          ? Math.round(
              completions.reduce((a, b) => a + b, 0) / completions.length
            )
          : 0;

      return {
        total: products.length,
        active: active.length,
        draft: draft.length,
        preorder: preorder.length,
        missingPhotos: products.filter(p => !p.has_images).length,
        missingDescription: products.filter(
          p => !p.description || p.description === ''
        ).length,
        missingCostPrice: products.filter(
          p => !p.cost_price || p.cost_price === 0
        ).length,
        missingCategory: products.filter(p => !p.subcategory_id).length,
        missingMetaDescription: products.filter(
          p => !p.meta_description || p.meta_description === ''
        ).length,
        missingSellPrice: products.filter(p => !productsWithSellPrice.has(p.id))
          .length,
        activeNoStock: active.filter(p => (p.stock_real ?? 0) === 0).length,
        stockAlerts: stockAlertsData.count ?? 0,
        avgCompletion,
      };
    } catch (error) {
      console.error('[getProductCompleteness] Error:', error);
      return {
        total: 0,
        active: 0,
        draft: 0,
        preorder: 0,
        missingPhotos: 0,
        missingDescription: 0,
        missingCostPrice: 0,
        missingCategory: 0,
        missingMetaDescription: 0,
        missingSellPrice: 0,
        activeNoStock: 0,
        stockAlerts: 0,
        avgCompletion: 0,
      };
    }
  }
);
