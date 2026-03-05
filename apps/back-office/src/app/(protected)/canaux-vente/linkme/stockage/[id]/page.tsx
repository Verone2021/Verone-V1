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
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  Input,
  Switch,
} from '@verone/ui';
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
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useAffiliateStorageDetail,
  useStoragePricingTiers,
  useUpdateAllocationBillable,
  useUpdateAllocationVisibility,
  useUpdateStorageQuantity,
  useDeleteStorageAllocation,
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
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch owner name
  useEffect(() => {
    async function fetchOwnerName() {
      const { createClient } = await import('@verone/utils/supabase/client');
      const supabase = createClient();

      if (ownerType === 'enseigne') {
        type EnseigneName = { name: string };

        const { data } = await supabase
          .from('enseignes')
          .select('name')
          .eq('id', ownerId)
          .single()
          .returns<EnseigneName>();
        if (data) setOwnerName(data.name);
      } else {
        type OrganisationName = {
          trade_name: string | null;
          legal_name: string;
        };

        const { data } = await supabase
          .from('organisations')
          .select('trade_name, legal_name')
          .eq('id', ownerId)
          .single()
          .returns<OrganisationName>();
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAllocations.map(allocation => (
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

  const billableMutation = useUpdateAllocationBillable();
  const visibilityMutation = useUpdateAllocationVisibility();
  const deleteMutation = useDeleteStorageAllocation();
  const quantityMutation = useUpdateStorageQuantity();

  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(String(allocation.stock_quantity));
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleToggleBillable() {
    void billableMutation
      .mutateAsync({
        allocationId: allocation.allocation_id,
        billable: !allocation.billable_in_storage,
      })
      .then(() => {
        toast.success(
          allocation.billable_in_storage
            ? 'Produit non facturable'
            : 'Produit facturable'
        );
      })
      .catch((err: Error) => {
        toast.error(`Erreur: ${err.message}`);
      });
  }

  function handleToggleVisibility() {
    void visibilityMutation
      .mutateAsync({
        allocationId: allocation.allocation_id,
        visible: !allocation.is_visible,
      })
      .then(() => {
        toast.success(
          allocation.is_visible ? 'Produit masque' : 'Produit visible'
        );
      })
      .catch((err: Error) => {
        toast.error(`Erreur: ${err.message}`);
      });
  }

  function handleDeleteConfirm() {
    return deleteMutation.mutateAsync(allocation.allocation_id).then(() => {
      toast.success('Allocation supprimee');
    });
  }

  function handleSaveQty() {
    const newQty = parseInt(qtyValue, 10);
    if (isNaN(newQty) || newQty < 0) {
      toast.error('Quantite invalide');
      return;
    }
    void quantityMutation
      .mutateAsync({
        allocationId: allocation.allocation_id,
        quantity: newQty,
      })
      .then(() => {
        setEditingQty(false);
        toast.success('Quantite mise a jour');
      })
      .catch((err: Error) => {
        toast.error(`Erreur: ${err.message}`);
      });
  }

  function handleCancelQty() {
    setQtyValue(String(allocation.stock_quantity));
    setEditingQty(false);
  }

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-4">
            {/* Product Image */}
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
              <ProductThumbnail
                src={allocation.product_image_url ?? undefined}
                alt={allocation.product_name}
                size="md"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">
                    {allocation.product_name}
                  </CardTitle>
                  <p className="text-sm text-gray-500 font-mono mt-1">
                    {allocation.product_sku}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {allocation.billable_in_storage ? (
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    Facturable
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-gray-500">
                    Non facturable
                  </Badge>
                )}
                {allocation.is_visible ? (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                    <Eye className="h-3 w-3 mr-1" />
                    Visible
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-red-500 border-red-200"
                  >
                    <EyeOff className="h-3 w-3 mr-1" />
                    Masque
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Volume stats */}
          <div className="grid grid-cols-3 gap-4 text-center border-t pt-4">
            <div>
              {editingQty ? (
                <div className="flex items-center gap-1 justify-center">
                  <Input
                    type="number"
                    min={0}
                    value={qtyValue}
                    onChange={e => setQtyValue(e.target.value)}
                    className="w-16 h-8 text-center text-sm"
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveQty();
                      if (e.key === 'Escape') handleCancelQty();
                    }}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveQty}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                    disabled={quantityMutation.isPending}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelQty}
                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingQty(true)}
                  className="cursor-pointer hover:bg-gray-50 rounded px-2 py-1 transition-colors"
                  title="Cliquer pour modifier"
                >
                  <p className="text-2xl font-bold text-gray-900">
                    {allocation.stock_quantity}
                  </p>
                </button>
              )}
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

          {/* Toggles */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Facturable</span>
              <Switch
                checked={allocation.billable_in_storage}
                onCheckedChange={handleToggleBillable}
                disabled={billableMutation.isPending}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Visible affilie</span>
              <Switch
                checked={allocation.is_visible}
                onCheckedChange={handleToggleVisibility}
                disabled={visibilityMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer l'allocation ?"
        description={`Le produit "${allocation.product_name}" sera retire du stockage de cet affilie. Cette action est irreversible.`}
        variant="destructive"
        confirmText="Supprimer"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
