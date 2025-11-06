'use client';

import { useMemo } from 'react';

/**
 * Hook pour calculer automatiquement le statut stock d'un produit
 *
 * Logique métier :
 * - stock_real > 0 → 'in_stock' (En stock)
 * - stock_real = 0 ET stock_forecasted_in > 0 → 'coming_soon' (Bientôt disponible)
 * - stock_real = 0 ET stock_forecasted_in = 0 → 'out_of_stock' (Rupture de stock)
 *
 * Ce statut est AUTOMATIQUE et LECTURE SEULE (calculé côté frontend uniquement)
 */

export type StockStatus = 'in_stock' | 'out_of_stock' | 'coming_soon';

export interface StockStatusData {
  stock_real: number;
  stock_forecasted_in: number;
}

export interface StockStatusResult {
  status: StockStatus;
  label: string;
  description: string;
  variant: 'success' | 'warning' | 'destructive';
  icon: string;
}

export function useStockStatus(product: StockStatusData): StockStatusResult {
  return useMemo(() => {
    if (product.stock_real > 0) {
      return {
        status: 'in_stock',
        label: 'En stock',
        description: `${product.stock_real} unité(s) disponible(s)`,
        variant: 'success',
        icon: '✓',
      };
    }

    if (product.stock_forecasted_in > 0) {
      return {
        status: 'coming_soon',
        label: 'Bientôt disponible',
        description: `${product.stock_forecasted_in} unité(s) en commande`,
        variant: 'warning',
        icon: '⏳',
      };
    }

    return {
      status: 'out_of_stock',
      label: 'Rupture de stock',
      description: 'Aucun stock disponible',
      variant: 'destructive',
      icon: '✕',
    };
  }, [product.stock_real, product.stock_forecasted_in]);
}
