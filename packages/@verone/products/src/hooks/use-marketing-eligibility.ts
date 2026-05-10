'use client';

import { useState, useCallback, useEffect } from 'react';

import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Niveau de stock côté marketing :
 * - in_stock : stock physique disponible immédiatement
 * - reorder_pending : pas de stock physique mais réappro fournisseur en cours
 * - preorder : produit en précommande (statut commercial dédié)
 * - out_of_stock : aucun stock ni réappro — avertissement non-bloquant
 */
export type MarketingStockLevel =
  | 'in_stock'
  | 'reorder_pending'
  | 'preorder'
  | 'out_of_stock';

export interface MarketingEligibilityState {
  marketingBlocked: boolean;
  marketingBlockedReason: string | null;
  isPublishedOnline: boolean;
  isOnMeta: boolean;
  isOnGoogleMerchant: boolean;
  productStatus: 'active' | 'preorder' | 'discontinued' | 'draft';
  archived: boolean;
  stockReal: number;
  stockForecastedIn: number;
  stockLevel: MarketingStockLevel;
  /** Calcul local pour aperçu UI — miroir de is_product_marketing_eligible() */
  isEligible: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

export interface UseMarketingEligibilityReturn
  extends MarketingEligibilityState {
  setBlocked: (blocked: boolean, reason?: string | null) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useMarketingEligibility(
  productId: string
): UseMarketingEligibilityReturn {
  const supabase = createClient();

  const [state, setState] = useState<MarketingEligibilityState>({
    marketingBlocked: false,
    marketingBlockedReason: null,
    isPublishedOnline: false,
    isOnMeta: false,
    isOnGoogleMerchant: false,
    productStatus: 'active',
    archived: false,
    stockReal: 0,
    stockForecastedIn: 0,
    stockLevel: 'out_of_stock',
    isEligible: false,
    loading: true,
    saving: false,
    error: null,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));

    const [productResult, metaResult, googleResult] = await Promise.all([
      supabase
        .from('products')
        .select(
          'product_status, is_published_online, archived_at, marketing_blocked, marketing_blocked_reason, stock_real, stock_forecasted_in'
        )
        .eq('id', productId)
        .single(),
      supabase
        .from('meta_commerce_syncs')
        .select('id')
        .eq('product_id', productId)
        .eq('meta_status', 'active')
        .limit(1),
      supabase
        .from('google_merchant_syncs')
        .select('id')
        .eq('product_id', productId)
        .limit(1),
    ]);

    if (productResult.error || !productResult.data) {
      setState(s => ({
        ...s,
        loading: false,
        error: productResult.error?.message ?? 'Produit introuvable',
      }));
      return;
    }

    const p = productResult.data;
    const isOnMeta = (metaResult.data?.length ?? 0) > 0;
    const isOnGoogle = (googleResult.data?.length ?? 0) > 0;
    const archived = Boolean(p.archived_at);
    const productStatus = p.product_status;
    const marketingBlocked = Boolean(p.marketing_blocked);
    const stockReal = p.stock_real ?? 0;
    const stockForecastedIn = p.stock_forecasted_in ?? 0;

    // Stock level — règle "Tolérante" : avertissement seulement, pas de blocage
    let stockLevel: MarketingStockLevel;
    if (stockReal > 0) {
      stockLevel = 'in_stock';
    } else if (productStatus === 'preorder') {
      stockLevel = 'preorder';
    } else if (stockForecastedIn > 0) {
      stockLevel = 'reorder_pending';
    } else {
      stockLevel = 'out_of_stock';
    }

    const isEligible =
      !archived &&
      (productStatus === 'active' || productStatus === 'preorder') &&
      !marketingBlocked &&
      (Boolean(p.is_published_online) || isOnMeta);

    setState({
      marketingBlocked,
      marketingBlockedReason: p.marketing_blocked_reason,
      isPublishedOnline: Boolean(p.is_published_online),
      isOnMeta,
      isOnGoogleMerchant: isOnGoogle,
      productStatus,
      archived,
      stockReal,
      stockForecastedIn,
      stockLevel,
      isEligible,
      loading: false,
      saving: false,
      error: null,
    });
  }, [productId, supabase]);

  useEffect(() => {
    void refresh().catch(err =>
      console.error('[useMarketingEligibility] refresh failed:', err)
    );
  }, [refresh]);

  const setBlocked = useCallback(
    async (blocked: boolean, reason: string | null = null) => {
      setState(s => ({ ...s, saving: true, error: null }));

      const { error } = await supabase
        .from('products')
        .update({
          marketing_blocked: blocked,
          marketing_blocked_reason: blocked ? reason : null,
        })
        .eq('id', productId);

      if (error) {
        setState(s => ({ ...s, saving: false, error: error.message }));
        return;
      }

      await refresh();
    },
    [productId, refresh, supabase]
  );

  return { ...state, setBlocked, refresh };
}
