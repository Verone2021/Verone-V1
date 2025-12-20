'use client';

/**
 * Page Approbations Produits - Back-Office LinkMe
 *
 * Queue de validation des produits crees par les affilies
 *
 * @module ApprobationsPage
 * @since 2025-12-20
 */

import { useState } from 'react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';
import {
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Euro,
  Percent,
  Ruler,
  Eye,
  Filter,
} from 'lucide-react';

import {
  usePendingApprovals,
  usePendingApprovalsCount,
  useAllAffiliateProducts,
  useApproveProduct,
  useRejectProduct,
  COMMISSION_RATES,
  type PendingProduct,
  type AffiliateProductApprovalStatus,
  type CommissionRate,
} from '../hooks/use-product-approvals';

// Status filter options
const STATUS_OPTIONS: {
  value: AffiliateProductApprovalStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Tous', icon: Package, color: 'text-gray-600' },
  {
    value: 'pending_approval',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuves',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: 'rejected',
    label: 'Rejetes',
    icon: XCircle,
    color: 'text-red-600',
  },
];

export default function ApprobationsPage() {
  const [selectedStatus, setSelectedStatus] = useState<
    AffiliateProductApprovalStatus | 'all'
  >('pending_approval');
  const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Dialogue approbation avec commission
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [selectedCommission, setSelectedCommission] =
    useState<CommissionRate>(5);

  const { data: pendingCount } = usePendingApprovalsCount();
  const {
    data: products,
    isLoading,
    refetch,
  } = useAllAffiliateProducts(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const approveProduct = useApproveProduct();
  const rejectProduct = useRejectProduct();

  // Ouvrir dialogue approbation (ne pas approuver directement)
  const handleApproveClick = (product: PendingProduct) => {
    setSelectedProduct(product);
    setSelectedCommission(5); // Reset to default
    setIsApproveDialogOpen(true);
  };

  // Confirmer approbation avec commission
  const handleApproveConfirm = async () => {
    if (!selectedProduct) return;

    try {
      await approveProduct.mutateAsync({
        productId: selectedProduct.id,
        commissionRate: selectedCommission,
      });
      setIsApproveDialogOpen(false);
      setSelectedProduct(null);
      refetch();
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (product: PendingProduct) => {
    setSelectedProduct(product);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedProduct || !rejectReason.trim()) return;

    try {
      await rejectProduct.mutateAsync({
        productId: selectedProduct.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedProduct(null);
      refetch();
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  const handleViewDetails = (product: PendingProduct) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  // Fonctions de calcul commission (modele affilies: commission DEDUITE)
  // Prix client = payout (fixe, ne change jamais)
  // Commission Verone en EUR
  const getCommissionAmount = (payout: number, commission: number) => {
    return payout * (commission / 100);
  };
  // Ce que l'affilie recoit (apres deduction commission)
  const getAffiliateEarning = (payout: number, commission: number) => {
    return payout - getCommissionAmount(payout, commission);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Approbations Produits
          </h1>
          <p className="text-gray-500 mt-1">
            Validez les produits crees par les affilies
          </p>
        </div>
        {pendingCount && pendingCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-700">
              {pendingCount} en attente
            </span>
          </div>
        )}
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {STATUS_OPTIONS.map(option => {
            const Icon = option.icon;
            const isActive = selectedStatus === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedStatus(option.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-white shadow-sm font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${option.color}`} />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!products || products.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun produit
          </h2>
          <p className="text-gray-500">
            {selectedStatus === 'pending_approval'
              ? 'Aucun produit en attente de validation'
              : 'Aucun produit affilie trouve'}
          </p>
        </div>
      )}

      {/* Products Table */}
      {!isLoading && products && products.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Produit
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Affilie
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Prix
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Statut
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">{product.sku}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-gray-900">
                        {product.affiliate_display_name || '-'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.enseigne_name || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">
                        {product.affiliate_payout_ht?.toFixed(2)} EUR
                      </p>
                      <p className="text-xs text-gray-500">
                        Commission: {product.affiliate_commission_rate || 0}% ={' '}
                        {getCommissionAmount(
                          product.affiliate_payout_ht || 0,
                          product.affiliate_commission_rate || 0
                        ).toFixed(2)}{' '}
                        EUR
                      </p>
                      <p className="text-xs text-green-600 font-medium">
                        Affilie recoit:{' '}
                        {getAffiliateEarning(
                          product.affiliate_payout_ht || 0,
                          product.affiliate_commission_rate || 0
                        ).toFixed(2)}{' '}
                        EUR
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={product.affiliate_approval_status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(product)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {product.affiliate_approval_status ===
                        'pending_approval' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectClick(product)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApproveClick(product)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approuver
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve Dialog - Commission obligatoire */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Approuver le produit
            </DialogTitle>
            <DialogDescription>
              Definissez le taux de commission plateforme avant
              d&apos;approuver.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4 space-y-4">
              {/* Recap produit */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span>
                    Payout affilié:{' '}
                    <span className="font-semibold">
                      {selectedProduct.affiliate_payout_ht?.toFixed(2)} EUR
                    </span>
                  </span>
                </div>
              </div>

              {/* Selection commission */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission plateforme *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {COMMISSION_RATES.map(rate => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSelectedCommission(rate)}
                      className={`p-3 rounded-lg border-2 text-center transition-colors ${
                        selectedCommission === rate
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg font-bold">{rate}%</span>
                      {rate === 5 && (
                        <span className="block text-xs text-gray-500">
                          Défaut
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apercu repartition revenus */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Repartition des revenus:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Prix client (fixe):</span>
                    <span className="text-lg font-bold text-gray-900">
                      {selectedProduct.affiliate_payout_ht?.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-amber-700">
                    <span>Commission Verone ({selectedCommission}%):</span>
                    <span className="font-medium">
                      -
                      {getCommissionAmount(
                        selectedProduct.affiliate_payout_ht || 0,
                        selectedCommission
                      ).toFixed(2)}{' '}
                      EUR
                    </span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex items-center justify-between text-green-700">
                    <span className="font-medium">Affilie recoit:</span>
                    <span className="text-lg font-bold">
                      {getAffiliateEarning(
                        selectedProduct.affiliate_payout_ht || 0,
                        selectedCommission
                      ).toFixed(2)}{' '}
                      EUR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={approveProduct.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirmer l&apos;approbation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejeter le produit
            </DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. L&apos;affilie pourra corriger et
              resoumettre le produit.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectReason.trim() || rejectProduct.isPending}
            >
              {rejectProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details du produit</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nom</p>
                  <p className="font-medium">{selectedProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">SKU</p>
                  <p className="font-medium">{selectedProduct.sku}</p>
                </div>
              </div>

              {selectedProduct.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{selectedProduct.description}</p>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-600">Prix client (fixe)</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {selectedProduct.affiliate_payout_ht?.toFixed(2)} EUR
                  </span>
                </div>
                <div className="flex items-center justify-between text-amber-700">
                  <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    <span>
                      Commission Verone (
                      {selectedProduct.affiliate_commission_rate || 0}%)
                    </span>
                  </div>
                  <span className="font-medium">
                    -
                    {getCommissionAmount(
                      selectedProduct.affiliate_payout_ht || 0,
                      selectedProduct.affiliate_commission_rate || 0
                    ).toFixed(2)}{' '}
                    EUR
                  </span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex items-center justify-between text-green-700">
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    <span className="font-medium">Affilie recoit</span>
                  </div>
                  <span className="font-bold text-lg">
                    {getAffiliateEarning(
                      selectedProduct.affiliate_payout_ht || 0,
                      selectedProduct.affiliate_commission_rate || 0
                    ).toFixed(2)}{' '}
                    EUR
                  </span>
                </div>
              </div>

              {selectedProduct.dimensions && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Dimensions
                  </p>
                  <p className="text-gray-700">
                    {selectedProduct.dimensions.length_cm || '-'} x{' '}
                    {selectedProduct.dimensions.width_cm || '-'} x{' '}
                    {selectedProduct.dimensions.height_cm || '-'} cm
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Affilie</p>
                  <p className="font-medium">
                    {selectedProduct.affiliate_display_name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enseigne</p>
                  <p className="font-medium">
                    {selectedProduct.enseigne_name || '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: AffiliateProductApprovalStatus }) {
  const config = {
    draft: {
      label: 'Brouillon',
      icon: AlertCircle,
      color: 'text-gray-600 bg-gray-100',
    },
    pending_approval: {
      label: 'En attente',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    approved: {
      label: 'Approuve',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    rejected: {
      label: 'Rejete',
      icon: XCircle,
      color: 'text-red-600 bg-red-50',
    },
  }[status];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
