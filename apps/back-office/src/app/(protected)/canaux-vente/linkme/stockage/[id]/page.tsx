'use client';

/**
 * Page Detail Stockage Client - Back-Office LinkMe
 *
 * Affiche le stockage d'un client avec des cartes produits
 * Route: /canaux-vente/linkme/stockage/[id]
 * Format ID: enseigne-{uuid} ou organisation-{uuid}
 *
 * @module StorageDetailPage
 * @since 2025-12-22
 */

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ProductThumbnail } from '@verone/products';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import {
  ArrowLeft,
  Loader2,
  Package,
  Box,
  TrendingUp,
  Building2,
  Briefcase,
  Euro,
} from 'lucide-react';

import {
  useAffiliateStorageDetail,
  useStoragePricingTiers,
  formatVolumeM3,
  calculateStoragePrice,
  formatPrice,
  type StorageAllocation,
} from '../../hooks/use-linkme-storage';

export default function StorageDetailPage() {
  const params = useParams();
  const id = params.id as string;

  // Parse ID: format is "enseigne-uuid" or "organisation-uuid"
  const [ownerType, ownerId] =
    id.split('-').length > 1
      ? [
          id.split('-')[0] as 'enseigne' | 'organisation',
          id.slice(id.indexOf('-') + 1),
        ]
      : ['enseigne' as const, id];

  const { data, isLoading } = useAffiliateStorageDetail(ownerType, ownerId);
  const { data: pricingTiers } = useStoragePricingTiers();

  const [ownerName, setOwnerName] = useState<string>('');

  // Fetch owner name
  useEffect(() => {
    async function fetchOwnerName() {
      const { createClient } = await import('@verone/utils/supabase/client');
      const supabase = createClient();

      if (ownerType === 'enseigne') {
        const { data } = await supabase
          .from('enseignes')
          .select('name')
          .eq('id', ownerId)
          .single();
        if (data) setOwnerName(data.name);
      } else {
        const { data } = await supabase
          .from('organisations')
          .select('trade_name, legal_name')
          .eq('id', ownerId)
          .single();
        if (data)
          setOwnerName(data.trade_name ?? data.legal_name ?? 'Organisation');
      }
    }
    void fetchOwnerName().catch(error => {
      console.error('[LinkMeStockage] fetchOwnerName failed:', error);
    });
  }, [ownerType, ownerId]);

  const isEnseigne = ownerType === 'enseigne';
  const totalVolume = data?.summary.total_volume_m3 ?? 0;
  const estimatedPrice = pricingTiers
    ? calculateStoragePrice(totalVolume, pricingTiers)
    : 0;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/canaux-vente/linkme/stockage"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour au stockage
        </Link>

        <div className="flex items-center gap-4">
          <div
            className={`p-4 rounded-xl ${
              isEnseigne ? 'bg-blue-50' : 'bg-purple-50'
            }`}
          >
            {isEnseigne ? (
              <Building2 className="h-8 w-8 text-blue-600" />
            ) : (
              <Briefcase className="h-8 w-8 text-purple-600" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ownerName || 'Chargement...'}
            </h1>
            <Badge
              variant="outline"
              className={
                isEnseigne
                  ? 'border-blue-300 text-blue-700'
                  : 'border-purple-300 text-purple-700'
              }
            >
              {isEnseigne ? 'Enseigne' : 'Organisation'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          icon={Package}
          label="Unites stockees"
          value={`${data?.summary.total_units ?? 0}`}
          color="purple"
        />
        <SummaryCard
          icon={Box}
          label="Volume total"
          value={formatVolumeM3(data?.summary.total_volume_m3)}
          color="blue"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Volume facturable"
          value={formatVolumeM3(data?.summary.billable_volume_m3)}
          color="green"
        />
        <SummaryCard
          icon={Euro}
          label="Cout estime / mois"
          value={formatPrice(estimatedPrice)}
          color="orange"
        />
      </div>

      {/* Products Grid - CARDS */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Produits en stockage ({data?.allocations.length ?? 0})
        </h2>
      </div>

      {!data?.allocations || data.allocations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Aucun produit en stockage</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.allocations.map(allocation => (
            <ProductStorageCard
              key={allocation.allocation_id}
              allocation={allocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==============================================================
// COMPOSANTS LOCAUX
// ==============================================================

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductStorageCard({ allocation }: { allocation: StorageAllocation }) {
  const totalVolume =
    allocation.stock_quantity * (allocation.unit_volume_m3 ?? 0);

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Product Image */}
          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
            <ProductThumbnail
              src={undefined}
              alt={allocation.product_name}
              size="md"
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">
              {allocation.product_name}
            </CardTitle>
            <p className="text-sm text-gray-500 font-mono mt-1">
              {allocation.product_sku}
            </p>
            {allocation.billable_in_storage && (
              <Badge className="mt-2 bg-green-100 text-green-700 border-green-200">
                Facturable
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {allocation.stock_quantity}
            </p>
            <p className="text-xs text-gray-500">unites</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {formatVolumeM3(allocation.unit_volume_m3)}
            </p>
            <p className="text-xs text-gray-500">vol. unitaire</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {formatVolumeM3(totalVolume)}
            </p>
            <p className="text-xs text-gray-500">vol. total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
