'use client';

import { useState, useMemo, useCallback } from 'react';

import { toast } from 'sonner';

import {
  useLinkMeCatalogProducts,
  useUpdateLinkMePricing,
  type LinkMeCatalogProduct,
} from '../../hooks/use-linkme-catalog';

import { htToTtc, ttcToHt } from './helpers';
import type { PendingChange } from './types';

export function useConfigurationPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, PendingChange>
  >(new Map());

  const {
    data: catalogProducts,
    isLoading,
    refetch,
  } = useLinkMeCatalogProducts();
  const updatePricingMutation = useUpdateLinkMePricing();

  const filteredProducts = useMemo(() => {
    if (!catalogProducts) return [];
    if (!searchTerm) return catalogProducts;

    const search = searchTerm.toLowerCase();
    return catalogProducts.filter(
      p =>
        p.product_name.toLowerCase().includes(search) ||
        p.product_reference.toLowerCase().includes(search)
    );
  }, [catalogProducts, searchTerm]);

  const kpis = useMemo(() => {
    if (!catalogProducts || catalogProducts.length === 0) {
      return {
        totalProducts: 0,
        avgMargin: 0,
        avgBuffer: 0,
        avgCommission: 0,
        productsWithPricing: 0,
      };
    }

    let totalMargin = 0;
    let totalBuffer = 0;
    let totalCommission = 0;
    let marginCount = 0;
    let bufferCount = 0;
    let commissionCount = 0;
    let productsWithPricing = 0;

    catalogProducts.forEach(p => {
      if (p.public_price_ht !== null || p.product_selling_price_ht !== null) {
        productsWithPricing++;
      }

      const costPrice = p.product_price_ht ?? 0;
      const sellingPrice = p.product_selling_price_ht ?? p.public_price_ht ?? 0;
      if (costPrice > 0 && sellingPrice > 0) {
        totalMargin += (sellingPrice - costPrice) / costPrice;
        marginCount++;
      }

      const bufferRate = p.buffer_rate ?? null;
      if (bufferRate !== null) {
        totalBuffer += bufferRate;
        bufferCount++;
      }

      if (p.channel_commission_rate !== null) {
        totalCommission += p.channel_commission_rate;
        commissionCount++;
      }
    });

    return {
      totalProducts: catalogProducts.length,
      avgMargin: marginCount > 0 ? totalMargin / marginCount : 0,
      avgBuffer: bufferCount > 0 ? totalBuffer / bufferCount : 0.05,
      avgCommission:
        commissionCount > 0 ? totalCommission / commissionCount : 0,
      productsWithPricing,
    };
  }, [catalogProducts]);

  const handleFieldChange = useCallback(
    (
      product: LinkMeCatalogProduct,
      field:
        | 'public_price_ht'
        | 'custom_price_ht'
        | 'buffer_rate'
        | 'channel_commission_rate',
      newValue: number | null
    ) => {
      const key = `${product.id}-${field}`;

      let originalValue: number | null = null;
      if (field === 'buffer_rate') {
        originalValue = product.buffer_rate ?? 0.05;
      } else if (field === 'public_price_ht') {
        originalValue = product.public_price_ht ?? null;
      } else if (field === 'custom_price_ht') {
        originalValue = product.product_selling_price_ht ?? null;
      } else if (field === 'channel_commission_rate') {
        originalValue = product.channel_commission_rate ?? null;
      }

      if (newValue === originalValue) {
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } else {
        setPendingChanges(prev => {
          const next = new Map(prev);
          next.set(key, {
            catalogProductId: product.id,
            field,
            originalValue,
            newValue,
          });
          return next;
        });
      }
    },
    []
  );

  const handleSaveAll = async () => {
    if (pendingChanges.size === 0) return;

    const changesByProduct = new Map<string, Record<string, number | null>>();
    pendingChanges.forEach(change => {
      const existing = changesByProduct.get(change.catalogProductId) ?? {};
      existing[change.field] = change.newValue;
      changesByProduct.set(change.catalogProductId, existing);
    });

    let successCount = 0;
    let errorCount = 0;

    for (const [catalogProductId, pricing] of changesByProduct) {
      try {
        await updatePricingMutation.mutateAsync({
          catalogProductId,
          pricing: pricing as {
            public_price_ht?: number | null;
            custom_price_ht?: number | null;
            buffer_rate?: number | null;
            channel_commission_rate?: number;
          },
        });
        successCount++;
      } catch (error) {
        console.error(`Erreur mise à jour ${catalogProductId}:`, error);
        errorCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} produit(s) mis à jour`);
      setPendingChanges(new Map());
      void refetch().catch(error => {
        console.error('[ConfigurationPage] refetch failed:', error);
      });
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} erreur(s) lors de la mise à jour`);
    }
  };

  const handleDiscardAll = () => {
    setPendingChanges(new Map());
  };

  const getEffectiveValue = (
    product: LinkMeCatalogProduct,
    field:
      | 'public_price_ht'
      | 'custom_price_ht'
      | 'buffer_rate'
      | 'channel_commission_rate'
  ): number | null => {
    const key = `${product.id}-${field}`;
    const pending = pendingChanges.get(key);
    if (pending) return pending.newValue;

    if (field === 'buffer_rate') return product.buffer_rate ?? 0.05;
    if (field === 'public_price_ht') return product.public_price_ht ?? null;
    if (field === 'custom_price_ht')
      return product.product_selling_price_ht ?? null;
    if (field === 'channel_commission_rate')
      return product.channel_commission_rate ?? null;
    return null;
  };

  const calculateMargin = (product: LinkMeCatalogProduct): number | null => {
    const costPrice = product.product_price_ht ?? 0;
    const sellingPrice =
      getEffectiveValue(product, 'custom_price_ht') ??
      getEffectiveValue(product, 'public_price_ht') ??
      0;
    if (costPrice <= 0 || sellingPrice <= 0) return null;
    return (sellingPrice - costPrice) / costPrice;
  };

  const hasChanges = (product: LinkMeCatalogProduct): boolean =>
    pendingChanges.has(`${product.id}-public_price_ht`) ||
    pendingChanges.has(`${product.id}-custom_price_ht`) ||
    pendingChanges.has(`${product.id}-buffer_rate`) ||
    pendingChanges.has(`${product.id}-channel_commission_rate`);

  const getEffectiveTtcValue = (
    product: LinkMeCatalogProduct
  ): number | null => {
    const htValue = getEffectiveValue(product, 'public_price_ht');
    return htValue !== null ? htToTtc(htValue) : null;
  };

  const handleTtcChange = useCallback(
    (product: LinkMeCatalogProduct, ttcValue: number | null) => {
      const htValue = ttcValue !== null ? ttcToHt(ttcValue) : null;
      handleFieldChange(product, 'public_price_ht', htValue);
    },
    [handleFieldChange]
  );

  return {
    searchTerm,
    setSearchTerm,
    pendingChanges,
    filteredProducts,
    kpis,
    isLoading,
    updatePricingMutation,
    handleFieldChange,
    handleSaveAll,
    handleDiscardAll,
    getEffectiveValue,
    calculateMargin,
    hasChanges,
    getEffectiveTtcValue,
    handleTtcChange,
  };
}
