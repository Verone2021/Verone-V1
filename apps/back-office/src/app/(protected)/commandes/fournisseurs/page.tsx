'use client';

import React, { useState, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { useToast } from '@verone/common';
import { RapprochementFromOrderModal } from '@verone/finance';
import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import { PurchaseOrderFormModal } from '@verone/orders';
import { PurchaseOrderReceptionModal } from '@verone/orders';
import { PurchaseOrderDetailModal } from '@verone/orders';
import { CancelRemainderModal } from '@verone/orders';
import type { PurchaseAdvancedFilters } from '@verone/orders';
import { DEFAULT_PURCHASE_FILTERS, countActiveFilters } from '@verone/orders';
import { usePurchaseOrders } from '@verone/orders';
import { useOrganisations } from '@verone/organisations';
import { ProductThumbnail } from '@verone/products';
import type { Database } from '@verone/types';

// Type étendu pour les champs payment V2 et rapprochement (non encore dans schema DB)
type PurchaseOrderExtended = PurchaseOrder & {
  payment_status_v2?: 'paid' | 'pending' | 'failed' | null;
  manual_payment_type?: string | null;
  is_matched?: boolean | null;
  matched_transaction_label?: string | null;
};

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { IconButton } from '@verone/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { cn } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import {
  Search,
  Eye,
  Edit,
  Trash2,
  Ban,
  Package,
  Truck,
  CheckCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ChevronDown,
  XCircle,
  PackageCheck,
  Banknote,
  Receipt,
  Building2,
  CreditCard,
  CheckSquare,
  Link2,
} from 'lucide-react';

import { updatePurchaseOrderStatus } from '@/app/actions/purchase-orders';

type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée',
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800', // 🔵 En attente réception
  partially_received: 'bg-amber-100 text-amber-800', // 🟠 Partiel
  received: 'bg-green-100 text-green-800', // 🟢 Complet
  cancelled: 'bg-red-100 text-red-800',
};

type SortColumn = 'date' | 'po_number' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

export default function PurchaseOrdersPage() {
  const {
    loading,
    orders,
    stats: _stats,
    fetchOrders,
    fetchStats,
    updateStatus: _updateStatus,
    deleteOrder,
    markAsManuallyPaid,
  } = usePurchaseOrders();

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const { organisations: suppliers } = useOrganisations({ type: 'supplier' });

  // États filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>(
    'all'
  );
  const [advancedFilters, setAdvancedFilters] =
    useState<PurchaseAdvancedFilters>(DEFAULT_PURCHASE_FILTERS);

  // Année courante + années disponibles
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach(order => {
      const dateRef = order.order_date ?? order.created_at;
      years.add(new Date(dateRef).getFullYear());
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [orders, currentYear]);

  const isPeriodEnabled =
    advancedFilters.filterYear === null ||
    advancedFilters.filterYear === currentYear;

  // Détection filtres actifs (pour bouton reset)
  const hasActiveFilters = useMemo(
    () => countActiveFilters(advancedFilters, DEFAULT_PURCHASE_FILTERS) > 0,
    [advancedFilters]
  );

  // États tri
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // États modals
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<PurchaseOrderRow | null>(null);
  const [showValidateConfirmation, setShowValidateConfirmation] =
    useState(false);
  const [orderToValidate, setOrderToValidate] = useState<string | null>(null);

  // États pour le modal d'avertissement quantité insuffisante
  const [showShortageWarning, setShowShortageWarning] = useState(false);
  const [shortageDetails, setShortageDetails] = useState<
    Array<{
      itemId: string;
      productName: string;
      sku: string;
      quantityOrdered: number;
      minStock: number;
      stockReal: number;
      shortage: number;
      newQuantity: number;
    }>
  >([]);

  // État pour les lignes expandées (chevron)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // État pour modal annulation reliquat
  const [showCancelRemainderModal, setShowCancelRemainderModal] =
    useState(false);
  const [cancelRemainderOrder, setCancelRemainderOrder] =
    useState<PurchaseOrder | null>(null);
  const [cancelRemainderItems, setCancelRemainderItems] = useState<
    Array<{
      product_name: string;
      product_sku: string;
      quantity_remaining: number;
    }>
  >([]);

  // État pour modal rapprochement bancaire
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [rapprochementOrder, setRapprochementOrder] =
    useState<PurchaseOrder | null>(null);

  // État pour confirmation paiement manuel (évite double-clic)
  const [pendingPayment, setPendingPayment] = useState<{
    orderId: string;
    poNumber: string;
    type:
      | 'cash'
      | 'check'
      | 'transfer_other'
      | 'card'
      | 'compensation'
      | 'verified_bubble';
    amount: number;
  } | null>(null);

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

  useEffect(() => {
    void fetchOrders().catch(error => {
      console.error('[PurchaseOrders] Fetch orders failed:', error);
    });
    void fetchStats().catch(error => {
      console.error('[PurchaseOrders] Fetch stats failed:', error);
    });
  }, [fetchOrders, fetchStats]);

  // ✅ Auto-open modal from notification URL (?id=xxx)
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (orderId && orders.length > 0 && !showOrderDetail) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetail(true);
      }
    }
  }, [searchParams, orders, showOrderDetail]);

  // ✅ Compteurs onglets
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      draft: orders.filter(o => o.status === 'draft').length,
      validated: orders.filter(o => o.status === 'validated').length,
      partially_received: orders.filter(o => o.status === 'partially_received')
        .length,
      received: orders.filter(o => o.status === 'received').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // ✅ Filtrage + Tri (filtres avancés)
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      // Filtre onglet
      if (activeTab !== 'all' && order.status !== activeTab) return false;

      // Filtre recherche
      const matchesSearch =
        searchTerm === '' ||
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.organisations
          ? getOrganisationDisplayName(order.organisations)
          : ''
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Filtre multi-statuts (filtres avancés)
      if (
        advancedFilters.statuses.length > 0 &&
        !advancedFilters.statuses.includes(order.status)
      )
        return false;

      // Filtre fournisseur
      if (
        advancedFilters.supplierId &&
        order.supplier_id !== advancedFilters.supplierId
      )
        return false;

      // Filtre année spécifique (basé sur date commande, fallback date création)
      const orderDateRef = order.order_date ?? order.created_at;
      if (advancedFilters.filterYear !== null) {
        const orderDate = new Date(orderDateRef);
        if (orderDate.getFullYear() !== advancedFilters.filterYear)
          return false;
      }

      // Filtre période (seulement si année courante ou toutes)
      const periodActive =
        advancedFilters.filterYear === null ||
        advancedFilters.filterYear === currentYear;

      if (periodActive && advancedFilters.period !== 'all') {
        const orderDate = new Date(orderDateRef);
        const now = new Date();

        switch (advancedFilters.period) {
          case 'month':
            if (
              orderDate.getMonth() !== now.getMonth() ||
              orderDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
          case 'quarter': {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const orderQuarter = Math.floor(orderDate.getMonth() / 3);
            if (
              orderQuarter !== currentQuarter ||
              orderDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
          }
          case 'year':
            if (orderDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      // Filtre montant HT
      if (
        advancedFilters.amountMin !== null &&
        (order.total_ht ?? 0) < advancedFilters.amountMin
      )
        return false;
      if (
        advancedFilters.amountMax !== null &&
        (order.total_ht ?? 0) > advancedFilters.amountMax
      )
        return false;

      // Filtre rapprochement bancaire
      if (advancedFilters.matching !== 'all') {
        const extended = order as PurchaseOrderExtended;
        const isMatched = extended.is_matched === true;
        if (advancedFilters.matching === 'matched' && !isMatched) return false;
        if (advancedFilters.matching === 'unmatched' && isMatched) return false;
      }

      return true;
    });

    // Tri
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
          case 'date':
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case 'po_number':
            comparison = (a.po_number || '').localeCompare(b.po_number || '');
            break;
          case 'amount':
            comparison = (a.total_ttc ?? 0) - (b.total_ttc ?? 0);
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    orders,
    activeTab,
    searchTerm,
    advancedFilters,
    sortColumn,
    sortDirection,
    currentYear,
  ]);

  // ✅ KPI dynamiques sur commandes filtrées
  const filteredStats = useMemo(() => {
    const stats = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++;
        acc.total_ht += order.total_ht ?? 0;
        acc.eco_tax_total += order.eco_tax_total ?? 0;
        acc.total_ttc += order.total_ttc ?? 0;

        if (
          ['draft', 'validated', 'validated', 'partially_received'].includes(
            order.status
          )
        ) {
          acc.pending_orders++;
        }
        if (order.status === 'received') {
          acc.received_orders++;
        }
        if (order.status === 'cancelled') {
          acc.cancelled_orders++;
        }

        return acc;
      },
      {
        total_orders: 0,
        total_ht: 0,
        eco_tax_total: 0,
        total_ttc: 0,
        total_tva: 0,
        pending_orders: 0,
        received_orders: 0,
        cancelled_orders: 0,
      }
    );

    // Calculer TVA (identique ventes)
    stats.total_tva = stats.total_ttc - stats.total_ht;

    return stats;
  }, [filteredOrders]);

  // ✅ Fonction tri
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // ✅ Icône tri
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-2 inline opacity-30" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-2 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-2 inline" />
    );
  };

  // ✅ Fonction pour ajuster automatiquement les quantités au seuil minimum
  const handleAutoAdjustQuantities = async () => {
    if (!orderToValidate || shortageDetails.length === 0) return;

    const supabase = createClient();

    try {
      // Mettre à jour chaque item avec sa nouvelle quantité
      for (const item of shortageDetails) {
        const { error } = await supabase
          .from('purchase_order_items')
          .update({ quantity: item.newQuantity })
          .eq('id', item.itemId);

        if (error) {
          throw error;
        }
      }

      // Fermer le modal
      setShowShortageWarning(false);
      setShortageDetails([]);

      // Rafraîchir la liste des commandes
      await fetchOrders();

      // Toast de confirmation
      toast({
        title: 'Quantités ajustées',
        description: `${shortageDetails.length} produit(s) mis à jour pour atteindre les seuils minimum`,
      });
    } catch (error) {
      console.error('Erreur ajustement quantités:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'ajuster les quantités",
        variant: 'destructive',
      });
    }
  };

  // ✅ Fonction pour vérifier les quantités vs seuils min_stock
  // FIX: Ne plus dépendre de stock_forecasted_in qui peut être désynchronisé
  // Calcul simplifié: besoin = min_stock - stock_real
  // Si quantity >= besoin, le seuil est atteint → pas de modal
  const checkOrderShortages = async (orderId: string) => {
    const supabase = createClient();

    // Récupérer les items de la commande avec les infos produits
    type OrderItemWithProduct = {
      id: string;
      quantity: number;
      products: {
        name: string;
        sku: string;
        min_stock: number | null;
        stock_real: number | null;
      } | null;
    };

    const { data: orderItems, error } = await supabase
      .from('purchase_order_items')
      .select(
        `
        id,
        quantity,
        products (
          name,
          sku,
          min_stock,
          stock_real
        )
      `
      )
      .eq('purchase_order_id', orderId)
      .returns<OrderItemWithProduct[]>();

    if (error) {
      console.error('Erreur vérification shortages:', error);
      return [];
    }

    // Pour chaque item, vérifier si la quantité commandée atteint le seuil
    const shortages = (orderItems ?? [])
      .map(item => {
        const product = item.products as {
          name: string;
          sku: string;
          min_stock: number | null;
          stock_real: number | null;
        } | null;

        // Pas de seuil défini → pas de vérification
        if (!product?.min_stock || product.min_stock === 0) return null;

        // Besoin = ce qu'il manque pour atteindre le seuil
        const stockReal = product.stock_real ?? 0;
        const besoin = Math.max(0, product.min_stock - stockReal);

        // Si la quantité commandée >= besoin, le seuil est atteint
        if (item.quantity >= besoin) return null;

        // Il y a un shortage
        const shortage = besoin - item.quantity;
        return {
          itemId: item.id,
          productName: product.name,
          sku: product.sku,
          quantityOrdered: item.quantity,
          minStock: product.min_stock,
          stockReal: stockReal,
          shortage: shortage,
          newQuantity: besoin, // La quantité cible pour atteindre le seuil
        };
      })
      .filter(Boolean) as Array<{
      itemId: string;
      productName: string;
      sku: string;
      quantityOrdered: number;
      minStock: number;
      stockReal: number;
      shortage: number;
      newQuantity: number;
    }>;

    return shortages;
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: PurchaseOrderStatus
  ) => {
    // Si validation (draft → validated), vérifier d'abord les quantités vs seuils
    if (newStatus === 'validated') {
      // Vérifier si des produits n'atteignent pas leur seuil min_stock
      const shortages = await checkOrderShortages(orderId);

      if (shortages.length > 0) {
        // Il y a des manques → Afficher modal d'avertissement
        setOrderToValidate(orderId);
        setShortageDetails(shortages);
        setShowShortageWarning(true);
        return;
      }

      // Pas de manque → Afficher modal de confirmation standard
      setOrderToValidate(orderId);
      setShowValidateConfirmation(true);
      return;
    }

    // Sinon, exécuter directement
    try {
      // Récupérer l'utilisateur courant
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }

      // Appeler la Server Action pour mettre à jour le statut
      const result = await updatePurchaseOrderStatus(
        orderId,
        newStatus as PurchaseOrderStatus, // Cast nécessaire car database types pas encore à jour
        user.id
      );

      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la mise à jour');
      }

      toast({
        title: 'Succès',
        description: `Commande marquée comme ${newStatus}`,
      });

      // Rafraîchir les données
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de changer le statut',
        variant: 'destructive',
      });
    }
  };

  const handleValidateConfirmed = async () => {
    if (!orderToValidate) return;

    try {
      // Récupérer l'utilisateur courant
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        toast({
          title: 'Erreur',
          description: 'Utilisateur non authentifié',
          variant: 'destructive',
        });
        return;
      }

      // Appeler la Server Action pour confirmer
      const result = await updatePurchaseOrderStatus(
        orderToValidate,
        'validated',
        user.id
      );

      if (!result.success) {
        throw new Error(result.error ?? 'Erreur lors de la confirmation');
      }

      toast({
        title: 'Succès',
        description: 'Commande fournisseur confirmée avec succès',
      });

      setShowValidateConfirmation(false);
      setOrderToValidate(null);

      // Rafraîchir les données
      await fetchOrders();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de confirmer la commande',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      try {
        await deleteOrder(orderId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleCancel = async (orderId: string) => {
    if (confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      try {
        // Récupérer l'utilisateur courant
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          toast({
            title: 'Erreur',
            description: 'Utilisateur non authentifié',
            variant: 'destructive',
          });
          return;
        }

        // Appeler la Server Action pour annuler
        const result = await updatePurchaseOrderStatus(
          orderId,
          'cancelled',
          user.id
        );

        if (!result.success) {
          throw new Error(result.error ?? "Erreur lors de l'annulation");
        }

        toast({
          title: 'Succès',
          description: 'Commande annulée avec succès',
        });

        // Rafraîchir les données
        await fetchOrders();
      } catch (error) {
        console.error("Erreur lors de l'annulation:", error);
        toast({
          title: 'Erreur',
          description:
            error instanceof Error
              ? error.message
              : "Impossible d'annuler la commande",
          variant: 'destructive',
        });
      }
    }
  };

  const openOrderDetail = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const openEditModal = (order: PurchaseOrder) => {
    setOrderToEdit(order as PurchaseOrderRow);
    setShowEditModal(true);
  };

  const openReceptionModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowReceptionModal(true);
  };

  // Ouvrir modal annulation reliquat
  const openCancelRemainderModal = (order: PurchaseOrder) => {
    // Calculer les items avec reliquat
    const items = order.purchase_order_items ?? [];
    const remainderItems = items
      .filter(item => {
        const quantityOrdered = item.quantity ?? 0;
        const quantityReceived = item.quantity_received ?? 0;
        return quantityOrdered > quantityReceived;
      })
      .map(item => ({
        product_name: item.products?.name ?? 'Produit inconnu',
        product_sku: item.products?.sku ?? 'N/A',
        quantity_remaining:
          (item.quantity ?? 0) - (item.quantity_received ?? 0),
      }));

    setCancelRemainderOrder(order);
    setCancelRemainderItems(remainderItems);
    setShowCancelRemainderModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Fournisseurs
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des commandes et approvisionnements
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/stocks/receptions">
            <ButtonUnified variant="outline" icon={PackageCheck}>
              Réceptions
            </ButtonUnified>
          </Link>
          <PurchaseOrderFormModal
            onSuccess={() => {
              void fetchOrders().catch(error => {
                console.error(
                  '[PurchaseOrders] Fetch after create failed:',
                  error
                );
              });
            }}
          />
        </div>
      </div>

      {/* ✅ KPI Dynamiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredStats.total_orders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Chiffre d'affaires
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(filteredStats.total_ttc)}
            </div>
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              <div>HT: {formatCurrency(filteredStats.total_ht)}</div>
              {filteredStats.eco_tax_total > 0 && (
                <div className="text-amber-600">
                  Éco-taxe HT: {formatCurrency(filteredStats.eco_tax_total)}
                </div>
              )}
              <div>TVA: {formatCurrency(filteredStats.total_tva)}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              En cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">
              {filteredStats.pending_orders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Reçues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filteredStats.received_orders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Annulées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filteredStats.cancelled_orders}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets Statuts + Filtres (groupés dans une Card unique) */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Onglets Statuts */}
          <Tabs
            value={activeTab}
            onValueChange={value =>
              setActiveTab(value as PurchaseOrderStatus | 'all')
            }
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="draft">
                Brouillon ({tabCounts.draft})
              </TabsTrigger>
              <TabsTrigger value="validated">
                Validée ({tabCounts.validated})
              </TabsTrigger>
              <TabsTrigger value="partially_received">
                Part. reçue ({tabCounts.partially_received})
              </TabsTrigger>
              <TabsTrigger value="received">
                Reçue ({tabCounts.received})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Annulée ({tabCounts.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par numéro de commande ou fournisseur..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres inline (dropdowns compacts) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Fournisseur */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Fournisseur :
              </span>
              <Select
                value={advancedFilters.supplierId ?? 'all'}
                onValueChange={value =>
                  setAdvancedFilters(prev => ({
                    ...prev,
                    supplierId: value === 'all' ? null : value,
                  }))
                }
              >
                <SelectTrigger className="w-[220px] h-8 text-xs">
                  <SelectValue placeholder="Tous les fournisseurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {getOrganisationDisplayName(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Année */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Année :
              </span>
              <Select
                value={advancedFilters.filterYear?.toString() ?? 'all'}
                onValueChange={value => {
                  const year = value === 'all' ? null : Number(value);
                  setAdvancedFilters(prev => ({
                    ...prev,
                    filterYear: year,
                    period:
                      year !== null && year !== currentYear
                        ? 'all'
                        : prev.period,
                  }));
                }}
              >
                <SelectTrigger className="w-[110px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Période */}
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'text-sm font-medium whitespace-nowrap',
                  !isPeriodEnabled ? 'text-gray-400' : 'text-gray-600'
                )}
              >
                Période :
              </span>
              <Select
                value={advancedFilters.period}
                onValueChange={value =>
                  setAdvancedFilters(prev => ({
                    ...prev,
                    period: value as PurchaseAdvancedFilters['period'],
                  }))
                }
                disabled={!isPeriodEnabled}
              >
                <SelectTrigger
                  className={cn(
                    'w-[120px] h-8 text-xs',
                    !isPeriodEnabled && 'opacity-50'
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toute</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Année</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rapprochement */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Rapprochement :
              </span>
              <Select
                value={advancedFilters.matching}
                onValueChange={value =>
                  setAdvancedFilters(prev => ({
                    ...prev,
                    matching: value as PurchaseAdvancedFilters['matching'],
                  }))
                }
              >
                <SelectTrigger className="w-[90px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="matched">Oui</SelectItem>
                  <SelectItem value="unmatched">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <ButtonUnified
                variant="ghost"
                size="sm"
                icon={RotateCcw}
                onClick={() => setAdvancedFilters(DEFAULT_PURCHASE_FILTERS)}
              >
                Réinitialiser
              </ButtonUnified>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste des commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes Fournisseurs</CardTitle>
          <CardDescription>
            {filteredOrders.length} commande(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('po_number')}
                    >
                      N° Commande {renderSortIcon('po_number')}
                    </TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Paiement</TableHead>
                    <TableHead className="w-20 text-center">Articles</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Date création {renderSortIcon('date')}
                    </TableHead>
                    <TableHead>Date commande</TableHead>
                    <TableHead>Date livraison</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('amount')}
                    >
                      Montant TTC {renderSortIcon('amount')}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const items = order.purchase_order_items ?? [];
                    const hasSamples = items.some(item => item.sample_type);
                    const isExpanded = expandedRows.has(order.id);

                    return (
                      <React.Fragment key={order.id}>
                        <TableRow>
                          {/* Chevron expansion */}
                          <TableCell className="w-10">
                            {items.length > 0 && (
                              <button
                                onClick={() => toggleRow(order.id)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <ChevronDown
                                  className={cn(
                                    'h-4 w-4 text-gray-500 transition-transform',
                                    isExpanded && 'rotate-180'
                                  )}
                                />
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {order.po_number}
                          </TableCell>
                          <TableCell>
                            {order.organisations
                              ? getOrganisationDisplayName(order.organisations)
                              : 'Non défini'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                              {hasSamples && (
                                <Badge variant="secondary" className="text-xs">
                                  Échantillon
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          {/* Colonne Paiement */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {(order as PurchaseOrderExtended)
                                .payment_status_v2 === 'paid' ? (
                                <Badge className="bg-green-100 text-green-800">
                                  Payé
                                  {(order as PurchaseOrderExtended)
                                    .manual_payment_type && (
                                    <span className="ml-1 opacity-70">
                                      (manuel)
                                    </span>
                                  )}
                                </Badge>
                              ) : (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1 cursor-pointer">
                                      <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200 transition-colors">
                                        En attente
                                        <ChevronDown className="h-3 w-3 ml-1" />
                                      </Badge>
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuLabel>
                                      Marquer comme payé
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'cash',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <Banknote className="h-4 w-4 mr-2" />
                                      Espèces
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'check',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <Receipt className="h-4 w-4 mr-2" />
                                      Chèque
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'transfer_other',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <Building2 className="h-4 w-4 mr-2" />
                                      Virement autre banque
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'card',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <CreditCard className="h-4 w-4 mr-2" />
                                      Carte bancaire
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'compensation',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <CheckSquare className="h-4 w-4 mr-2" />
                                      Compensation
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        setPendingPayment({
                                          orderId: order.id,
                                          poNumber:
                                            order.po_number ||
                                            order.id.slice(0, 8),
                                          type: 'verified_bubble',
                                          amount: order.total_ttc || 0,
                                        })
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Vérifié Bubble
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                          {/* Colonne Articles */}
                          <TableCell className="text-center">
                            <span className="font-medium">{items.length}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              réf.
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            {order.order_date
                              ? formatDate(order.order_date)
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {order.expected_delivery_date
                              ? formatDate(order.expected_delivery_date)
                              : 'Non définie'}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(order.total_ttc)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <IconButton
                                icon={Eye}
                                variant="outline"
                                size="sm"
                                label="Voir les détails"
                                onClick={() => openOrderDetail(order)}
                              />

                              {/* DRAFT : Éditer + Valider + Annuler (Supprimer uniquement si cancelled) */}
                              {order.status === 'draft' && (
                                <>
                                  <IconButton
                                    icon={Edit}
                                    variant="outline"
                                    size="sm"
                                    label="Éditer la commande"
                                    onClick={() => {
                                      void openEditModal(order);
                                    }}
                                  />
                                  <IconButton
                                    icon={CheckCircle}
                                    variant="success"
                                    size="sm"
                                    label="Valider la commande"
                                    onClick={() => {
                                      void handleStatusChange(
                                        order.id,
                                        'validated'
                                      ).catch(error => {
                                        console.error(
                                          '[PurchaseOrders] Status change failed:',
                                          error
                                        );
                                      });
                                    }}
                                  />
                                  <IconButton
                                    icon={Ban}
                                    variant="danger"
                                    size="sm"
                                    label="Annuler la commande"
                                    onClick={() => {
                                      void handleCancel(order.id).catch(
                                        error => {
                                          console.error(
                                            '[PurchaseOrders] Cancel failed:',
                                            error
                                          );
                                        }
                                      );
                                    }}
                                  />
                                </>
                              )}

                              {/* VALIDATED : Réceptionner + Dévalider (PAS d'annulation directe!) */}
                              {order.status === 'validated' && (
                                <>
                                  <IconButton
                                    icon={Truck}
                                    variant="success"
                                    size="sm"
                                    label="Réceptionner la commande"
                                    onClick={() => openReceptionModal(order)}
                                  />
                                  <IconButton
                                    icon={RotateCcw}
                                    variant="outline"
                                    size="sm"
                                    label="Dévalider (retour brouillon)"
                                    onClick={() => {
                                      void handleStatusChange(
                                        order.id,
                                        'draft'
                                      ).catch(error => {
                                        console.error(
                                          '[PurchaseOrders] Status change failed:',
                                          error
                                        );
                                      });
                                    }}
                                  />
                                  {/* ❌ Bouton Annuler RETIRÉ - Workflow strict: validated → draft → cancelled */}
                                </>
                              )}

                              {/* PARTIALLY_RECEIVED : Réceptionner + Annuler Reliquat (PAS d'annulation complète!) */}
                              {order.status === 'partially_received' && (
                                <>
                                  <IconButton
                                    icon={Truck}
                                    variant="outline"
                                    size="sm"
                                    label="Réceptionner la commande"
                                    onClick={() => openReceptionModal(order)}
                                  />
                                  <IconButton
                                    icon={XCircle}
                                    variant="outline"
                                    size="sm"
                                    label="Annuler le reliquat"
                                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                                    onClick={() =>
                                      openCancelRemainderModal(order)
                                    }
                                  />
                                  {/* ❌ Bouton Annuler RETIRÉ - Impossible d'annuler une commande avec réceptions */}
                                </>
                              )}

                              {/* RECEIVED : Aucune action (commande terminée) */}

                              {/* CANCELLED : Supprimer */}
                              {order.status === 'cancelled' && (
                                <IconButton
                                  icon={Trash2}
                                  variant="danger"
                                  size="sm"
                                  label="Supprimer"
                                  onClick={() => {
                                    void handleDelete(order.id).catch(error => {
                                      console.error(
                                        '[PurchaseOrders] Delete failed:',
                                        error
                                      );
                                    });
                                  }}
                                />
                              )}

                              {/* Lier transaction / Rapprochée */}
                              {(order.status === 'validated' ||
                                order.status === 'partially_received' ||
                                order.status === 'received') && (
                                <>
                                  {(order as PurchaseOrderExtended)
                                    .is_matched ? (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-green-50 text-green-700 border-green-300 cursor-help"
                                      title={`Rapprochée: ${(order as PurchaseOrderExtended).matched_transaction_label ?? 'Transaction'} (${formatCurrency(Math.abs((order as PurchaseOrderExtended).matched_transaction_amount ?? 0))})`}
                                    >
                                      <Link2 className="h-3 w-3 mr-1 text-green-600" />
                                      Rapprochée
                                    </Badge>
                                  ) : (
                                    <IconButton
                                      icon={Link2}
                                      variant="outline"
                                      size="sm"
                                      label="Lier à une transaction"
                                      onClick={() => {
                                        setRapprochementOrder(order);
                                        setShowRapprochementModal(true);
                                      }}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Ligne d'expansion - affiche les produits */}
                        {isExpanded && items.length > 0 && (
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={10} className="p-0">
                              <div className="py-3 px-6 space-y-2">
                                {items.map(item => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-4 text-sm py-1"
                                  >
                                    <ProductThumbnail
                                      src={item.products?.primary_image_url}
                                      alt={item.products?.name ?? 'Produit'}
                                      size="xs"
                                    />
                                    <span className="flex-1 font-medium">
                                      {item.products?.name ?? 'Produit inconnu'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      x{item.quantity}
                                    </span>
                                    <span className="font-medium w-24 text-right">
                                      {formatCurrency(item.total_ht ?? 0)}
                                    </span>
                                    {item.sample_type && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {item.sample_type === 'internal'
                                          ? 'Éch. interne'
                                          : 'Éch. client'}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Modal Détail Commande - NOUVEAU FORMAT 2 COLONNES (aligné avec ventes) */}
      <PurchaseOrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={() => {
          setShowOrderDetail(false);
          setSelectedOrder(null);
        }}
        onUpdate={() => {
          void fetchOrders().catch(error => {
            console.error('[PurchaseOrders] Fetch after update failed:', error);
          });
        }}
      />

      {/* Modal de réception */}
      {selectedOrder && (
        <PurchaseOrderReceptionModal
          order={selectedOrder}
          open={showReceptionModal}
          onClose={() => {
            setShowReceptionModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={() => {
            void fetchOrders().catch(error => {
              console.error(
                '[PurchaseOrders] Fetch after success failed:',
                error
              );
            });
            setShowReceptionModal(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* ✅ Modal Édition Commande (nouveau - mode edit) */}
      {orderToEdit && (
        <PurchaseOrderFormModal
          order={orderToEdit}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setOrderToEdit(null);
          }}
          onSuccess={() => {
            void fetchOrders().catch(error => {
              console.error(
                '[PurchaseOrders] Fetch after success failed:',
                error
              );
            });
            setShowEditModal(false);
            setOrderToEdit(null);
          }}
        />
      )}

      {/* AlertDialog Confirmation Validation */}
      <AlertDialog
        open={showValidateConfirmation}
        onOpenChange={setShowValidateConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la validation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de confirmer cette commande fournisseur.
              Une fois confirmée, la commande sera envoyée au fournisseur et
              pourra être réceptionnée.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleValidateConfirmed().catch(error => {
                  console.error(
                    '[PurchaseOrders] Validate confirmed failed:',
                    error
                  );
                });
              }}
            >
              Confirmer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Avertissement Quantité Insuffisante */}
      <AlertDialog
        open={showShortageWarning}
        onOpenChange={setShowShortageWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Quantité insuffisante</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Les produits suivants n'atteignent pas leur seuil minimum :
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  {shortageDetails.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.productName}</strong> ({item.sku})
                      <br />
                      <span className="text-sm text-gray-600">
                        Stock réel : {item.stockReal} | Seuil : {item.minStock}
                      </span>
                      <br />
                      <span>
                        Quantité commandée : {item.quantityOrdered} →{' '}
                        <span className="text-green-600 font-medium">
                          {item.newQuantity}
                        </span>
                        <span className="text-red-600">
                          {' '}
                          (+{item.shortage})
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Cliquez sur "Ajuster automatiquement" pour mettre à jour les
                  quantités.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowShortageWarning(false);
                setShortageDetails([]);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleAutoAdjustQuantities().catch(error => {
                  console.error('[PurchaseOrders] Auto adjust failed:', error);
                });
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Ajuster automatiquement
            </AlertDialogAction>
            <AlertDialogAction
              onClick={() => {
                setShowShortageWarning(false);
                setShortageDetails([]);
                // Procéder à la validation malgré le manque
                setShowValidateConfirmation(true);
              }}
            >
              Valider quand même
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Annulation Reliquat */}
      {cancelRemainderOrder && (
        <CancelRemainderModal
          open={showCancelRemainderModal}
          onClose={() => {
            setShowCancelRemainderModal(false);
            setCancelRemainderOrder(null);
            setCancelRemainderItems([]);
          }}
          purchaseOrderId={cancelRemainderOrder.id}
          poNumber={cancelRemainderOrder.po_number}
          remainderItems={cancelRemainderItems}
          onSuccess={() => {
            void fetchOrders().catch(error => {
              console.error(
                '[PurchaseOrders] Fetch after success failed:',
                error
              );
            });
            setShowCancelRemainderModal(false);
            setCancelRemainderOrder(null);
            setCancelRemainderItems([]);
          }}
        />
      )}

      {/* Modal Rapprochement Bancaire */}
      {rapprochementOrder && (
        <RapprochementFromOrderModal
          open={showRapprochementModal}
          onOpenChange={setShowRapprochementModal}
          order={{
            id: rapprochementOrder.id,
            order_number: rapprochementOrder.po_number,
            customer_name:
              rapprochementOrder.organisations?.trade_name ??
              rapprochementOrder.organisations?.legal_name ??
              null,
            total_ttc: rapprochementOrder.total_ttc,
            created_at: rapprochementOrder.created_at,
            order_date: rapprochementOrder.order_date ?? null,
          }}
          orderType="purchase_order"
          onSuccess={() => {
            void fetchOrders().catch(error => {
              console.error(
                '[PurchaseOrders] Fetch after success failed:',
                error
              );
            });
            setShowRapprochementModal(false);
            setRapprochementOrder(null);
          }}
        />
      )}

      {/* AlertDialog Confirmation Paiement Manuel */}
      <AlertDialog
        open={pendingPayment !== null}
        onOpenChange={open => {
          if (!open) setPendingPayment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le paiement manuel</AlertDialogTitle>
            <AlertDialogDescription>
              Marquer la commande <strong>{pendingPayment?.poNumber}</strong>{' '}
              comme payée par{' '}
              <strong>
                {pendingPayment?.type === 'cash' && 'Espèces'}
                {pendingPayment?.type === 'check' && 'Chèque'}
                {pendingPayment?.type === 'transfer_other' &&
                  'Virement autre banque'}
                {pendingPayment?.type === 'card' && 'Carte bancaire'}
                {pendingPayment?.type === 'compensation' && 'Compensation'}
                {pendingPayment?.type === 'verified_bubble' && 'Vérifié Bubble'}
              </strong>{' '}
              pour <strong>{pendingPayment?.amount.toFixed(2)} €</strong> ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingPayment) return;
                void markAsManuallyPaid(
                  pendingPayment.orderId,
                  pendingPayment.type,
                  pendingPayment.amount
                ).catch(error => {
                  console.error(
                    '[PurchaseOrders] Manual payment failed:',
                    error
                  );
                });
                setPendingPayment(null);
              }}
            >
              Confirmer le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
