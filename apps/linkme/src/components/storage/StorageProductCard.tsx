/**
 * Composant StorageProductCard
 * Affiche une carte produit stocké avec volume et tarification conditionnelle
 *
 * @module StorageProductCard
 * @since 2025-12-22
 */

import { Package, Box, CheckCircle, XCircle } from 'lucide-react';

import type {
  StorageAllocation,
  StoragePricingTier,
} from '../../lib/hooks/use-affiliate-storage';
import {
  formatVolume,
  formatPrice,
  calculateStoragePrice,
} from '../../lib/hooks/use-affiliate-storage';

export interface StorageProductCardProps {
  product: StorageAllocation;
  pricingTiers: StoragePricingTier[];
}

export function StorageProductCard({
  product,
  pricingTiers,
}: StorageProductCardProps) {
  const isBillable = product.billable_in_storage;
  const totalVolume = product.stock_quantity * (product.unit_volume_m3 || 0);
  const estimatedPrice = isBillable
    ? calculateStoragePrice(totalVolume, pricingTiers)
    : null;

  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow">
      {/* Header avec image et nom */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <Package className="h-6 w-6 text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {product.product_name}
          </h4>
          <p className="text-xs text-gray-500 font-mono">
            {product.product_sku}
          </p>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-3 gap-2 text-center border-t border-b py-3 mb-3">
        <div>
          <p className="text-lg font-bold text-gray-900">
            {product.stock_quantity}
          </p>
          <p className="text-[10px] text-gray-500">unites</p>
        </div>
        <div>
          <p className="text-lg font-bold text-blue-600">
            {formatVolume(product.unit_volume_m3)}
          </p>
          <p className="text-[10px] text-gray-500">vol. unit.</p>
        </div>
        <div>
          <p className="text-lg font-bold text-purple-600">
            {formatVolume(totalVolume)}
          </p>
          <p className="text-[10px] text-gray-500">vol. total</p>
        </div>
      </div>

      {/* Statut facturation et coût */}
      <div className="flex items-center justify-between">
        {isBillable ? (
          <>
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Facturable</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-green-600">
                ~{formatPrice(estimatedPrice || 0)}
              </p>
              <p className="text-[10px] text-gray-400">par mois</p>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-gray-400">
              <XCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Non facturable</span>
            </div>
            <p className="text-xs text-gray-400">Non comptabilise</p>
          </>
        )}
      </div>
    </div>
  );
}
