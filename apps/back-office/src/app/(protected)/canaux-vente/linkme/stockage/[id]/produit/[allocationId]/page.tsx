'use client';

/**
 * Page Detail Produit en Stockage - Back-Office LinkMe
 *
 * Affiche le detail d'une allocation de stockage avec tous les controles
 * Route: /canaux-vente/linkme/stockage/[id]/produit/[allocationId]
 *
 * @module StorageProductDetailPage
 * @since 2026-03-05
 */

import { useState } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

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
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  useAffiliateStorageDetail,
  useUpdateAllocationBillable,
  useUpdateAllocationVisibility,
  useUpdateStorageQuantity,
  useDeleteStorageAllocation,
  formatVolumeM3,
} from '../../../../hooks/use-linkme-storage';

export default function StorageProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storageId = params.id as string;
  const allocationId = params.allocationId as string;

  // Parse storage ID
  const [ownerType, ownerId] =
    storageId.split('-').length > 1
      ? [
          storageId.split('-')[0] as 'enseigne' | 'organisation',
          storageId.slice(storageId.indexOf('-') + 1),
        ]
      : ['enseigne' as const, storageId];

  const { data, isLoading } = useAffiliateStorageDetail(ownerType, ownerId);

  const allocation = data?.allocations.find(
    a => a.allocation_id === allocationId
  );

  const billableMutation = useUpdateAllocationBillable();
  const visibilityMutation = useUpdateAllocationVisibility();
  const deleteMutation = useDeleteStorageAllocation();
  const quantityMutation = useUpdateStorageQuantity();

  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleToggleBillable() {
    if (!allocation) return;
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
    if (!allocation) return;
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
    if (!allocation) return Promise.resolve();
    return deleteMutation.mutateAsync(allocation.allocation_id).then(() => {
      toast.success('Allocation supprimee');
      router.push(`/canaux-vente/linkme/stockage/${storageId}`);
    });
  }

  function startEditQty() {
    if (!allocation) return;
    setQtyValue(String(allocation.stock_quantity));
    setEditingQty(true);
  }

  function handleSaveQty() {
    if (!allocation) return;
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
    setEditingQty(false);
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!allocation) {
    return (
      <div className="p-6">
        <Link
          href={`/canaux-vente/linkme/stockage/${storageId}`}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Allocation introuvable</p>
        </div>
      </div>
    );
  }

  const totalVolume =
    allocation.stock_quantity * (allocation.unit_volume_m3 ?? 0);

  return (
    <div className="p-6">
      {/* Back link */}
      <Link
        href={`/canaux-vente/linkme/stockage/${storageId}`}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour au stockage
      </Link>

      {/* Product header */}
      <div className="flex items-start gap-5 mb-6">
        <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center">
          <ProductThumbnail
            src={allocation.product_image_url ?? undefined}
            alt={allocation.product_name}
            size="lg"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {allocation.product_name}
          </h1>
          <p className="text-sm text-gray-500 font-mono mt-1">
            {allocation.product_sku}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {allocation.billable_in_storage ? (
              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                Facturable
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500 text-xs">
                Non facturable
              </Badge>
            )}
            {allocation.is_visible ? (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="text-red-500 border-red-200 text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                Masque
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Volume card */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Box className="h-4 w-4" />
            Volume et quantite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Quantite</p>
              {editingQty ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    value={qtyValue}
                    onChange={e => setQtyValue(e.target.value)}
                    className="w-20 h-8 text-sm"
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
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelQty}
                    className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditQty}
                  className="text-lg font-semibold text-gray-900 hover:bg-gray-50 rounded px-1 -ml-1 transition-colors"
                  title="Cliquer pour modifier"
                >
                  {allocation.stock_quantity} unites
                </button>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Vol. unitaire</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatVolumeM3(allocation.unit_volume_m3)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Vol. total</p>
              <p className="text-lg font-semibold text-green-600">
                {formatVolumeM3(totalVolume)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls card */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Parametres
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Facturable</p>
              <p className="text-xs text-gray-500">
                Inclure dans le calcul de facturation stockage
              </p>
            </div>
            <Switch
              checked={allocation.billable_in_storage}
              onCheckedChange={handleToggleBillable}
              disabled={billableMutation.isPending}
            />
          </div>
          <div className="border-t" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                Visible pour l&apos;affilie
              </p>
              <p className="text-xs text-gray-500">
                Afficher ce produit dans l&apos;espace LinkMe de l&apos;affilie
              </p>
            </div>
            <Switch
              checked={allocation.is_visible}
              onCheckedChange={handleToggleVisibility}
              disabled={visibilityMutation.isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Informations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Date d&apos;allocation</p>
              <p className="font-medium">
                {new Date(allocation.allocated_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Debut stockage</p>
              <p className="font-medium">
                {new Date(allocation.storage_start_date).toLocaleDateString(
                  'fr-FR'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <div className="border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">
              Supprimer cette allocation
            </p>
            <p className="text-xs text-red-500">
              Le produit sera retire du stockage de cet affilie
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Supprimer
          </button>
        </div>
      </div>

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
    </div>
  );
}
