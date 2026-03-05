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

import { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { ProductThumbnail } from '@verone/products';
import { Badge, Card, CardContent, Input } from '@verone/ui';
import {
  ArrowLeft,
  Loader2,
  Package,
  Box,
  TrendingUp,
  Building2,
  Briefcase,
  Euro,
  Search,
  Eye,
  EyeOff,
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
  const [ownerLogoUrl, setOwnerLogoUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch owner name and logo
  useEffect(() => {
    async function fetchOwnerInfo() {
      const { createClient } = await import('@verone/utils/supabase/client');
      const supabase = createClient();

      if (ownerType === 'enseigne') {
        type EnseigneInfo = { name: string; logo_url: string | null };

        const { data } = await supabase
          .from('enseignes')
          .select('name, logo_url')
          .eq('id', ownerId)
          .single()
          .returns<EnseigneInfo>();
        if (data) {
          setOwnerName(data.name);
          setOwnerLogoUrl(data.logo_url);
        }
      } else {
        type OrganisationInfo = {
          trade_name: string | null;
          legal_name: string;
          logo_url: string | null;
        };

        const { data } = await supabase
          .from('organisations')
          .select('trade_name, legal_name, logo_url')
          .eq('id', ownerId)
          .single()
          .returns<OrganisationInfo>();
        if (data) {
          setOwnerName(data.trade_name ?? data.legal_name ?? 'Organisation');
          setOwnerLogoUrl(data.logo_url);
        }
      }
    }
    void fetchOwnerInfo().catch(error => {
      console.error('[LinkMeStockage] fetchOwnerInfo failed:', error);
    });
  }, [ownerType, ownerId]);

  const isEnseigne = ownerType === 'enseigne';
  const totalVolume = data?.summary.total_volume_m3 ?? 0;
  const estimatedPrice = pricingTiers
    ? calculateStoragePrice(totalVolume, pricingTiers)
    : 0;

  const filteredAllocations = useMemo(() => {
    if (!data?.allocations) return [];
    if (!searchQuery.trim()) return data.allocations;
    const q = searchQuery.toLowerCase();
    return data.allocations.filter(
      a =>
        a.product_name.toLowerCase().includes(q) ||
        a.product_sku.toLowerCase().includes(q)
    );
  }, [data?.allocations, searchQuery]);

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
          {ownerLogoUrl ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getLogoUrl(ownerLogoUrl)}
                alt={ownerName}
                className="w-full h-full object-contain p-1"
              />
            </div>
          ) : (
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
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {ownerName ?? 'Chargement...'}
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

      {/* Search + Products Grid */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 shrink-0">
          <Package className="h-5 w-5" />
          Produits en stockage ({data?.allocations.length ?? 0})
        </h2>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par nom ou SKU..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!data?.allocations || data.allocations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Aucun produit en stockage</p>
        </div>
      ) : filteredAllocations.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border">
          <p className="text-gray-500">
            Aucun produit ne correspond a &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredAllocations.map(allocation => (
            <ProductStorageCard
              key={allocation.allocation_id}
              allocation={allocation}
              storageId={id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==============================================================
// HELPERS
// ==============================================================

function getLogoUrl(logoPath: string): string {
  if (logoPath.startsWith('http')) return logoPath;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/organisation-logos/${logoPath}`;
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

function ProductStorageCard({
  allocation,
  storageId,
}: {
  allocation: StorageAllocation;
  storageId: string;
}) {
  return (
    <Link
      href={`/canaux-vente/linkme/stockage/${storageId}/produit/${allocation.allocation_id}`}
      className="block"
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
              <ProductThumbnail
                src={allocation.product_image_url ?? undefined}
                alt={allocation.product_name}
                size="sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {allocation.product_name}
              </p>
              <p className="text-xs text-gray-400 font-mono">
                {allocation.product_sku}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <p className="text-sm font-semibold text-gray-900">
              {allocation.stock_quantity} unites
            </p>
            <div className="flex items-center gap-1">
              {allocation.billable_in_storage ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-1.5 py-0">
                  Fact.
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-gray-400 text-[10px] px-1.5 py-0"
                >
                  Non fact.
                </Badge>
              )}
              {allocation.is_visible ? (
                <Eye className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-red-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
