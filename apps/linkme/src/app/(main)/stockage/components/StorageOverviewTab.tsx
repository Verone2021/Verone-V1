'use client';

/**
 * StorageOverviewTab — Onglet Vue d'ensemble du stockage
 *
 * KPIs + Grille tarifaire + Top produits stockés
 *
 * @module StorageOverviewTab
 * @since 2026-02-25
 */

import { useMemo } from 'react';

import { Box, TrendingUp, Package, Euro } from 'lucide-react';

import {
  StorageKPICard,
  PricingGridReadOnly,
  StorageProductCard,
} from '@/components/storage';
import type {
  StorageSummary,
  StorageAllocation,
  StoragePricingTier,
} from '@/lib/hooks/use-affiliate-storage';
import {
  formatVolume,
  formatPrice,
  calculateStoragePrice,
} from '@/lib/hooks/use-affiliate-storage';

interface StorageOverviewTabProps {
  summary: StorageSummary | null | undefined;
  products: StorageAllocation[] | undefined;
  pricingTiers: StoragePricingTier[] | undefined;
  isLoading: boolean;
}

export function StorageOverviewTab({
  summary,
  products,
  pricingTiers,
  isLoading,
}: StorageOverviewTabProps) {
  const estimatedCost = useMemo(() => {
    if (!summary || !pricingTiers) return 0;
    return calculateStoragePrice(summary.billable_volume_m3, pricingTiers);
  }, [summary, pricingTiers]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StorageKPICard
          icon={Box}
          label="Volume total"
          value={formatVolume(summary?.total_volume_m3 ?? 0)}
          color="blue"
          subtitle="Tous produits"
          isLoading={isLoading}
        />
        <StorageKPICard
          icon={TrendingUp}
          label="Volume facturable"
          value={formatVolume(summary?.billable_volume_m3 ?? 0)}
          color="green"
          subtitle="Comptabilisé"
          isLoading={isLoading}
        />
        <StorageKPICard
          icon={Package}
          label="Unités stockées"
          value={`${summary?.total_units ?? 0}`}
          color="purple"
          subtitle={`${summary?.products_count ?? 0} produits`}
          isLoading={isLoading}
        />
        <StorageKPICard
          icon={Euro}
          label="Coût estimé"
          value={formatPrice(estimatedCost)}
          color="orange"
          subtitle="Par mois"
          isLoading={isLoading}
        />
      </section>

      {/* Grille tarifaire */}
      <PricingGridReadOnly
        tiers={pricingTiers ?? []}
        currentVolume={summary?.billable_volume_m3}
        isLoading={isLoading}
      />

      {/* Produits stockés (aperçu) */}
      {products && products.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Produits en stock ({products.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <StorageProductCard
                key={product.allocation_id}
                product={product}
                pricingTiers={pricingTiers ?? []}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
