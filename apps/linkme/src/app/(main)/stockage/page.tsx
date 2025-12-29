/**
 * Page Mon Stockage - LinkMe
 *
 * Affiche pour l'affilié :
 * - KPIs de stockage (volume total, facturable, unités, coût estimé)
 * - Grille tarifaire en lecture seule
 * - Liste des produits stockés (tous, avec prix conditionnel)
 *
 * @module StockagePage
 * @since 2025-12-22
 */

'use client';

import { useMemo } from 'react';

import { Box, TrendingUp, Package, Euro, Warehouse } from 'lucide-react';

import {
  StorageKPICard,
  PricingGridReadOnly,
  StorageProductCard,
} from '../../../components/storage';
import {
  useAffiliateStorageSummary,
  useAffiliateStorageDetails,
  useStoragePricingTiers,
  formatVolume,
  formatPrice,
  calculateStoragePrice,
} from '../../../lib/hooks/use-affiliate-storage';

export default function StockagePage() {
  const { data: summary, isLoading: summaryLoading } =
    useAffiliateStorageSummary();
  const { data: products, isLoading: productsLoading } =
    useAffiliateStorageDetails();
  const { data: pricingTiers, isLoading: tiersLoading } =
    useStoragePricingTiers();

  const isLoading = summaryLoading || productsLoading || tiersLoading;

  // Calcul du coût estimé (uniquement sur volume facturable)
  const estimatedCost = useMemo(() => {
    if (!summary || !pricingTiers) return 0;
    return calculateStoragePrice(summary.billable_volume_m3, pricingTiers);
  }, [summary, pricingTiers]);

  return (
    <div className="space-y-5 p-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Mon Stockage</h1>
        <p className="text-gray-500 text-sm">
          Visualisez vos produits stockes et la tarification
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
          subtitle="Comptabilise"
          isLoading={isLoading}
        />
        <StorageKPICard
          icon={Package}
          label="Unites stockees"
          value={`${summary?.total_units ?? 0}`}
          color="purple"
          subtitle={`${summary?.products_count ?? 0} produits`}
          isLoading={isLoading}
        />
        <StorageKPICard
          icon={Euro}
          label="Cout estime"
          value={formatPrice(estimatedCost)}
          color="orange"
          subtitle="Par mois"
          isLoading={isLoading}
        />
      </div>

      {/* Grille tarifaire */}
      <PricingGridReadOnly
        tiers={pricingTiers ?? []}
        currentVolume={summary?.billable_volume_m3}
        isLoading={tiersLoading}
      />

      {/* Produits stockés */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Mes produits stockes ({products?.length ?? 0})
          </h3>
        </div>

        {/* Empty state */}
        {!isLoading && (!products || products.length === 0) && (
          <div className="bg-white rounded-xl border p-8 text-center">
            <Warehouse className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-gray-700 mb-1">
              Aucun produit stocke
            </h4>
            <p className="text-xs text-gray-500">
              Vos produits approuves avec stockage apparaitront ici
            </p>
          </div>
        )}

        {/* Grid de produits */}
        {products && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <StorageProductCard
                key={product.allocation_id}
                product={product}
                pricingTiers={pricingTiers ?? []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
