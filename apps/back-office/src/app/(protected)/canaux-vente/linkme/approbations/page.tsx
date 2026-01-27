'use client';

/**
 * Page Approbations LinkMe - Back-Office
 *
 * 3 onglets de validation:
 * - Commandes: pending_admin_validation = true
 * - Produits: affiliate_approval_status = 'pending_approval'
 * - Organisations: approval_status = 'pending_validation'
 *
 * @module ApprobationsPage
 * @since 2026-01-05
 */

import { Fragment, useState } from 'react';

import Link from 'next/link';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  ShoppingCart,
  Building2,
  Mail,
  Phone,
  MapPin,
  Pencil,
  History,
  ChevronDown,
  ChevronRight,
  Store,
} from 'lucide-react';

import {
  usePendingOrdersCount,
  useApproveOrder,
  useRejectOrder,
  useAllLinkMeOrders,
  type PendingOrder,
  type OrderValidationStatus,
} from '../hooks/use-linkme-order-actions';
import {
  usePendingOrganisationsCount,
  useAllOrganisationsWithApproval,
  useApproveOrganisation,
  useRejectOrganisation,
  type PendingOrganisation,
  type OrganisationApprovalStatus,
} from '../hooks/use-organisation-approvals';
import {
  usePendingApprovalsCount,
  useAllAffiliateProducts,
  useApproveProduct,
  useRejectProduct,
  useUpdateAffiliateProduct,
  COMMISSION_RATES,
  type PendingProduct,
  type AffiliateProductApprovalStatus,
  type CommissionRate,
} from '../hooks/use-product-approvals';

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ApprobationsPage() {
  const { data: pendingOrdersCount = 0 } = usePendingOrdersCount();
  const { data: pendingProductsCount = 0 } = usePendingApprovalsCount();
  const { data: pendingOrgsCount = 0 } = usePendingOrganisationsCount();

  const totalPending =
    pendingOrdersCount + pendingProductsCount + pendingOrgsCount;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Approbations</h1>
          <p className="text-gray-500 mt-1">
            Validez les commandes, produits et organisations
          </p>
        </div>
        {totalPending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="font-semibold text-amber-700">
              {totalPending} en attente
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commandes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes
            {pendingOrdersCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingOrdersCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="produits" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits
            {pendingProductsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingProductsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="organisations"
            className="flex items-center gap-2"
          >
            <Building2 className="h-4 w-4" />
            Organisations
            {pendingOrgsCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingOrgsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="commandes">
          <CommandesTab />
        </TabsContent>

        <TabsContent value="produits">
          <ProduitsTab />
        </TabsContent>

        <TabsContent value="organisations">
          <OrganisationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// TAB: COMMANDES
// ============================================================================

const ORDER_STATUS_OPTIONS: {
  value: OrderValidationStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Tous', icon: ShoppingCart, color: 'text-gray-600' },
  {
    value: 'pending',
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

function CommandesTab() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrderValidationStatus | 'all'
  >('pending');

  const {
    data: orders,
    isLoading,
    refetch,
  } = useAllLinkMeOrders(selectedStatus === 'all' ? undefined : selectedStatus);

  const approveOrder = useApproveOrder();
  const rejectOrder = useRejectOrder();

  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // État pour les lignes expandues
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (orderId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  const handleApprove = async (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de toggle la ligne
    try {
      await approveOrder.mutateAsync({ orderId: order.id });
      refetch();
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (order: PendingOrder, e: React.MouseEvent) => {
    e.stopPropagation(); // Éviter de toggle la ligne
    setSelectedOrder(order);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedOrder || !rejectReason.trim()) return;

    try {
      await rejectOrder.mutateAsync({
        orderId: selectedOrder.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedOrder(null);
      refetch();
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  // Format du type de demandeur - Reserved
  const _formatRequesterType = (type: string | null | undefined) => {
    if (!type) return '-';
    const types: Record<string, string> = {
      responsable_enseigne: 'Responsable enseigne',
      architecte: 'Architecte',
      franchise: 'Franchise',
    };
    return types[type] || type;
  };

  return (
    <>
      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {ORDER_STATUS_OPTIONS.map(option => {
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
      {!isLoading && (!orders || orders.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune commande
          </h2>
          <p className="text-gray-500">
            {selectedStatus === 'pending'
              ? 'Aucune commande en attente de validation'
              : 'Aucune commande trouvee avec ce filtre'}
          </p>
        </div>
      )}

      {/* Orders Table */}
      {!isLoading && orders && orders.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 w-8" />
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Commande
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Demandeur
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Organisation
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Montant
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map(order => {
                const isExpanded = expandedRows.has(order.id);
                const details = order.linkme_details;
                const isNewRestaurant = details?.is_new_restaurant ?? false;

                return (
                  <Fragment key={order.id}>
                    {/* Ligne principale - cliquable */}
                    <tr
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleRow(order.id)}
                    >
                      <td className="px-3 py-4">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.order_number}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString(
                              'fr-FR'
                            )}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-gray-900">
                            {order.requester_name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.requester_email || '-'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-gray-900">
                            {order.organisation_name || '-'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.enseigne_name || '-'}
                          </p>
                          {/* Badge Nouveau / Existant */}
                          {isNewRestaurant ? (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-orange-300 text-orange-700 bg-orange-50">
                              <Building2 className="h-3 w-3" />
                              Nouveau restaurant
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">
                              <Store className="h-3 w-3" />
                              Restaurant existant
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {order.total_ttc.toFixed(2)} EUR
                          </p>
                          <p className="text-xs text-gray-500">
                            {order.items.length} article
                            {order.items.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <Link
                            href={`/canaux-vente/linkme/commandes/${order.id}`}
                            className="p-2 text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => handleRejectClick(order, e)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            onClick={e => handleApprove(order, e)}
                            disabled={approveOrder.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveOrder.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
                            Approuver
                          </Button>
                        </div>
                      </td>
                    </tr>

                    {/* Ligne expandue avec produits */}
                    {isExpanded && (
                      <tr
                        key={`${order.id}-expanded`}
                        className="bg-gray-50 hover:bg-gray-50"
                      >
                        <td colSpan={6} className="p-0">
                          <div className="py-3 px-6 space-y-2">
                            {order.items.map(item => (
                              <div
                                key={item.id}
                                className="flex items-center gap-4 text-sm py-2"
                              >
                                {/* Thumbnail */}
                                <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  {item.products?.primary_image_url ? (
                                    <img
                                      src={item.products.primary_image_url}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-full h-full p-2 text-gray-400" />
                                  )}
                                </div>
                                {/* Nom */}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.products?.name || 'Produit inconnu'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {item.products?.sku || '-'}
                                  </p>
                                </div>
                                {/* Quantite */}
                                <p className="text-gray-600 font-medium">
                                  x{item.quantity}
                                </p>
                                {/* Prix unitaire */}
                                <p className="text-gray-500 text-xs w-20 text-right">
                                  {item.unit_price_ht.toFixed(2)} EUR
                                </p>
                                {/* Total */}
                                <p className="font-semibold text-gray-900 w-24 text-right">
                                  {item.total_ht.toFixed(2)} EUR HT
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejeter la commande
            </DialogTitle>
            <DialogDescription>
              Indiquez le motif du rejet. Le demandeur sera notifie.
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
              disabled={!rejectReason.trim() || rejectOrder.isPending}
            >
              {rejectOrder.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ============================================================================
// TAB: PRODUITS
// ============================================================================

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

function ProduitsTab() {
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

  // Ouvrir dialogue edition (produits approuves uniquement)
  const handleEditClick = (product: PendingProduct) => {
    setSelectedProduct(product);
    setEditCommissionRate(product.affiliate_commission_rate || 0);
    setEditPayoutHt(product.affiliate_payout_ht || 0);
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
        changeReason: editChangeReason || undefined,
      });
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      refetch();
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
                    setEditCommissionRate(parseFloat(e.target.value) || 0)
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
                    setEditPayoutHt(parseFloat(e.target.value) || 0)
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
              onClick={handleEditConfirm}
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
// TAB: ORGANISATIONS
// ============================================================================

// Status filter options for organisations
const ORG_STATUS_OPTIONS: {
  value: OrganisationApprovalStatus | 'all';
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { value: 'all', label: 'Toutes', icon: Building2, color: 'text-gray-600' },
  {
    value: 'pending_validation',
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
  },
  {
    value: 'approved',
    label: 'Approuvees',
    icon: CheckCircle,
    color: 'text-green-600',
  },
  {
    value: 'rejected',
    label: 'Rejetees',
    icon: XCircle,
    color: 'text-red-600',
  },
];

function OrganisationsTab() {
  const [selectedStatus, setSelectedStatus] = useState<
    OrganisationApprovalStatus | 'all'
  >('pending_validation');

  const {
    data: organisations,
    isLoading,
    refetch,
  } = useAllOrganisationsWithApproval(
    selectedStatus === 'all' ? undefined : selectedStatus
  );

  const approveOrg = useApproveOrganisation();
  const rejectOrg = useRejectOrganisation();

  const [selectedOrg, setSelectedOrg] = useState<PendingOrganisation | null>(
    null
  );
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleApprove = async (org: PendingOrganisation) => {
    try {
      await approveOrg.mutateAsync({ organisationId: org.id });
      refetch();
    } catch {
      alert("Erreur lors de l'approbation");
    }
  };

  const handleRejectClick = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedOrg || !rejectReason.trim()) return;

    try {
      await rejectOrg.mutateAsync({
        organisationId: selectedOrg.id,
        reason: rejectReason.trim(),
      });
      setIsRejectDialogOpen(false);
      setSelectedOrg(null);
      refetch();
    } catch {
      alert('Erreur lors du rejet');
    }
  };

  const handleViewDetails = (org: PendingOrganisation) => {
    setSelectedOrg(org);
    setIsDetailOpen(true);
  };

  return (
    <>
      {/* Status Filter */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          {ORG_STATUS_OPTIONS.map(option => {
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
      {!isLoading && (!organisations || organisations.length === 0) && (
        <div className="bg-white rounded-xl p-12 text-center border">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune organisation
          </h2>
          <p className="text-gray-500">
            {selectedStatus === 'pending_validation'
              ? 'Aucune organisation en attente de validation'
              : 'Aucune organisation trouvee avec ce filtre'}
          </p>
        </div>
      )}

      {/* Organisations Table */}
      {!isLoading && organisations && organisations.length > 0 && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Organisation
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Enseigne
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Contact
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  Localisation
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
              {organisations.map(org => (
                <tr key={org.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {org.trade_name || org.legal_name}
                      </p>
                      {org.trade_name && (
                        <p className="text-sm text-gray-500">
                          {org.legal_name}
                        </p>
                      )}
                      {org.siret && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          SIRET: {org.siret}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{org.enseigne_name || '-'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {org.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Mail className="h-3 w-3" />
                          {org.email}
                        </div>
                      )}
                      {org.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {org.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {org.city || '-'}
                      {org.postal_code && ` (${org.postal_code})`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <OrgStatusBadge status={org.approval_status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(org)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {org.approval_status === 'pending_validation' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectClick(org)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(org)}
                            disabled={approveOrg.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {approveOrg.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-4 w-4 mr-1" />
                            )}
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

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Details de l&apos;organisation</DialogTitle>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedOrg.trade_name || selectedOrg.legal_name}
                </h3>
                {selectedOrg.trade_name && (
                  <p className="text-sm text-gray-600">
                    Raison sociale: {selectedOrg.legal_name}
                  </p>
                )}
                {selectedOrg.siret && (
                  <p className="text-sm text-gray-600">
                    SIRET: {selectedOrg.siret}
                  </p>
                )}
              </div>

              {selectedOrg.enseigne_name && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Enseigne</p>
                  <p className="font-medium">{selectedOrg.enseigne_name}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{selectedOrg.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Telephone</p>
                  <p className="font-medium">{selectedOrg.phone || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Adresse</p>
                <div className="text-gray-700">
                  {selectedOrg.address_line1 && (
                    <p>{selectedOrg.address_line1}</p>
                  )}
                  {selectedOrg.address_line2 && (
                    <p>{selectedOrg.address_line2}</p>
                  )}
                  <p>
                    {selectedOrg.postal_code} {selectedOrg.city}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-1">Cree le</p>
                <p className="font-medium">
                  {new Date(selectedOrg.created_at).toLocaleDateString(
                    'fr-FR',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Rejeter l&apos;organisation
            </DialogTitle>
            <DialogDescription>Indiquez le motif du rejet.</DialogDescription>
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
              disabled={!rejectReason.trim() || rejectOrg.isPending}
            >
              {rejectOrg.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OrgStatusBadge({ status }: { status: OrganisationApprovalStatus }) {
  const config = {
    pending_validation: {
      label: 'En attente',
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    approved: {
      label: 'Approuvee',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    rejected: {
      label: 'Rejetee',
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
