'use client';

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
  Warehouse,
  User,
  Pencil,
  History,
} from 'lucide-react';

import {
  useAllAffiliateProducts,
  useApproveProduct,
  useRejectProduct,
  useUpdateAffiliateProduct,
  COMMISSION_RATES,
  type PendingProduct,
  type AffiliateProductApprovalStatus,
  type CommissionRate,
} from '../../hooks/use-product-approvals';

// ============================================================================
// STATUS BADGE
// ============================================================================

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

// ============================================================================
// STATUS FILTER OPTIONS
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

export function ProduitsTab() {
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

  // Dialogue edition produit affilie (nouveau 2026-01-09)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCommissionRate, setEditCommissionRate] = useState<number>(0);
  const [editPayoutHt, setEditPayoutHt] = useState<number>(0);
  const [editChangeReason, setEditChangeReason] = useState('');

  const {
    data: products,
    isLoading,
    refetch,
  } = useAllAffiliateProducts(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const approveProduct = useApproveProduct();
  const updateProduct = useUpdateAffiliateProduct();
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
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
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
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  const handleViewDetails = (product: PendingProduct) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  // Ouvrir dialogue edition (produits approuves uniquement)
  const handleEditClick = (product: PendingProduct) => {
    setSelectedProduct(product);
    setEditCommissionRate(product.affiliate_commission_rate ?? 0);
    setEditPayoutHt(product.affiliate_payout_ht ?? 0);
    setEditChangeReason('');
    setIsEditDialogOpen(true);
  };

  // Confirmer modification
  const handleEditConfirm = async () => {
    if (!selectedProduct) return;

    try {
      await updateProduct.mutateAsync({
        productId: selectedProduct.id,
        commissionRate: editCommissionRate,
        payoutHt: editPayoutHt,
        changeReason: editChangeReason ?? undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      void refetch().catch(error => {
        console.error('[Approbations] Refetch failed:', error);
      });
    } catch (err) {
      alert(
        'Erreur lors de la modification: ' +
          (err instanceof Error ? err.message : 'Erreur inconnue')
      );
    }
  };

  // Fonctions de calcul commission (modele affilies: commission DEDUITE)
  const getCommissionAmount = (payout: number, commission: number) => {
    return payout * (commission / 100);
  };
  const getAffiliateEarning = (payout: number, commission: number) => {
    return payout - getCommissionAmount(payout, commission);
  };

  return (
    <>
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
                  Stockage
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
                        {product.affiliate_display_name ?? '-'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.enseigne_name ?? '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-semibold">
                        {product.affiliate_payout_ht?.toFixed(2)} EUR
                      </p>
                      <p className="text-xs text-gray-500">
                        Commission: {product.affiliate_commission_rate ?? 0}% ={' '}
                        {getCommissionAmount(
                          product.affiliate_payout_ht ?? 0,
                          product.affiliate_commission_rate ?? 0
                        ).toFixed(2)}{' '}
                        EUR
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {product.affiliate_storage_type === 'verone' ? (
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded">
                          <Warehouse className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700">
                            Chez Verone
                          </p>
                          <p className="text-xs text-gray-500">
                            {product.affiliate_stock_quantity} unites
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-100 rounded">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600">
                          Gere par l&apos;affilie
                        </p>
                      </div>
                    )}
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
                      {/* Bouton Edit pour produits approuves */}
                      {product.affiliate_approval_status === 'approved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(product)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                      )}
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
                        selectedProduct.affiliate_payout_ht ?? 0,
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
                        selectedProduct.affiliate_payout_ht ?? 0,
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
              onClick={() => {
                void handleApproveConfirm().catch(error => {
                  console.error(
                    '[Approbations] Approve confirm failed:',
                    error
                  );
                });
              }}
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
              onClick={() => {
                void handleRejectConfirm().catch(error => {
                  console.error('[Approbations] Reject failed:', error);
                });
              }}
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
                      {selectedProduct.affiliate_commission_rate ?? 0}%)
                    </span>
                  </div>
                  <span className="font-medium">
                    -
                    {getCommissionAmount(
                      selectedProduct.affiliate_payout_ht ?? 0,
                      selectedProduct.affiliate_commission_rate ?? 0
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
                      selectedProduct.affiliate_payout_ht ?? 0,
                      selectedProduct.affiliate_commission_rate ?? 0
                    ).toFixed(2)}{' '}
                    EUR
                  </span>
                </div>
              </div>

              {/* Stockage info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                  <Warehouse className="h-4 w-4" />
                  Stockage
                </p>
                {selectedProduct.affiliate_storage_type === 'verone' ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Warehouse className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">
                        Stocke chez Verone
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedProduct.affiliate_stock_quantity} unites a
                        recevoir
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded">
                      <User className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">
                        Gere par l&apos;affilie
                      </p>
                      <p className="text-sm text-gray-500">
                        Expedition directe par l&apos;affilie
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {selectedProduct.dimensions && (
                <div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Dimensions
                  </p>
                  <p className="text-gray-700">
                    {selectedProduct.dimensions.length_cm ?? '-'} x{' '}
                    {selectedProduct.dimensions.width_cm ?? '-'} x{' '}
                    {selectedProduct.dimensions.height_cm ?? '-'} cm
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Affilie</p>
                  <p className="font-medium">
                    {selectedProduct.affiliate_display_name ?? '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Enseigne</p>
                  <p className="font-medium">
                    {selectedProduct.enseigne_name ?? '-'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Modifier commission/payout (nouveau 2026-01-09) */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-500" />
              Modifier le produit
            </DialogTitle>
            <DialogDescription>
              Modifiez la commission et/ou le payout du produit affilie.
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4 space-y-4">
              {/* Recap produit */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500">{selectedProduct.sku}</p>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commission Verone (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={editCommissionRate}
                  onChange={e =>
                    setEditCommissionRate(parseFloat(e.target.value) ?? 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Payout HT */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout affilie (EUR HT)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editPayoutHt}
                  onChange={e =>
                    setEditPayoutHt(parseFloat(e.target.value) ?? 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Raison du changement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du changement (optionnel)
                </label>
                <Textarea
                  value={editChangeReason}
                  onChange={e => setEditChangeReason(e.target.value)}
                  placeholder="Ex: Ajustement suite a negociation..."
                  rows={2}
                />
              </div>

              {/* Apercu calcule */}
              <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                <p className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Apercu apres modification:
                </p>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prix client:</span>
                    <span className="font-medium">
                      {editPayoutHt.toFixed(2)} EUR
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-700">
                    <span>Commission Verone ({editCommissionRate}%):</span>
                    <span>
                      -
                      {getCommissionAmount(
                        editPayoutHt,
                        editCommissionRate
                      ).toFixed(2)}{' '}
                      EUR
                    </span>
                  </div>
                  <hr className="border-blue-200" />
                  <div className="flex justify-between text-green-700 font-medium">
                    <span>Affilie recoit:</span>
                    <span>
                      {getAffiliateEarning(
                        editPayoutHt,
                        editCommissionRate
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
              onClick={() => setIsEditDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                void handleEditConfirm().catch(error => {
                  console.error('[Approbations] Edit confirm failed:', error);
                });
              }}
              disabled={updateProduct.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateProduct.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Pencil className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
