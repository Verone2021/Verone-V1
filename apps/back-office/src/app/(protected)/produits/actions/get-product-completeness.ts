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
  activeNoStock: number;
  stockAlerts: number;
}

export const getProductCompleteness = cache(
  async (): Promise<ProductCompleteness> => {
    const supabase = await createServerClient();

    try {
      const [productsData, stockAlertsData] = await Promise.all([
        supabase
          .from('products')
          .select(
            'id, product_status, has_images, description, cost_price, stock_real'
          )
          .is('archived_at', null),
        supabase
          .from('stock_alerts_unified_view')
          .select('id', { count: 'exact' }),
      ]);

      const products = productsData.data ?? [];
      const active = products.filter(p => p.product_status === 'active');
      const draft = products.filter(p => p.product_status === 'draft');
      const preorder = products.filter(p => p.product_status === 'preorder');

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
        activeNoStock: active.filter(p => (p.stock_real ?? 0) === 0).length,
        stockAlerts: stockAlertsData.count ?? 0,
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
        activeNoStock: 0,
        stockAlerts: 0,
      };
    }
  }
);
