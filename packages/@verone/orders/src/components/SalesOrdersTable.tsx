'use client';

/**
 * SalesOrdersTable - Composant reutilisable pour afficher les commandes clients
 *
 * Utilise par:
 * - /commandes/clients (toutes les commandes)
 * - /canaux-vente/linkme/commandes (filtre canal LinkMe)
 * - /canaux-vente/site-internet/commandes (futur)
 *
 * Les triggers stock sont agnostiques du canal - meme workflow pour tous.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { RapprochementFromOrderModal } from '@verone/finance/components';
import { useActiveEnseignes } from '@verone/organisations';
import { ProductThumbnail } from '@verone/products';
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
import { cn, formatCurrency, formatDate } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Plus,
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';

import type { SalesAdvancedFilters } from '../types/advanced-filters';
import {
  DEFAULT_SALES_FILTERS,
  countActiveFilters,
} from '../types/advanced-filters';
import type {
  SalesOrder,
  SalesOrderItem,
  SalesOrderStatus,
} from '../hooks/use-sales-orders';
import { useSalesOrders } from '../hooks/use-sales-orders';
import { CreateLinkMeOrderModal } from './modals/CreateLinkMeOrderModal';
import { OrderDetailModal } from './modals/OrderDetailModal';
import { SalesOrderFormModal } from './modals/SalesOrderFormModal';
import { SalesOrderShipmentModal } from './modals/SalesOrderShipmentModal';
import { SalesOrderActionMenu } from './SalesOrderActionMenu';

// Canaux de vente connus
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';
const SITE_INTERNET_CHANNEL_ID = '0c2639e9-df80-41fa-84d0-9da96a128f7f';

const statusLabels: Record<SalesOrderStatus, string> = {
  pending_approval: "En attente d'approbation",
  draft: 'Brouillon',
  validated: 'Validee',
  partially_shipped: 'Partiellement expediee',
  shipped: 'Expediee',
  cancelled: 'Annulee',
};

const statusColors: Record<SalesOrderStatus, string> = {
  pending_approval: 'bg-orange-100 text-orange-800',
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-amber-100 text-amber-800',
  shipped: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type SortColumn = 'date' | 'client' | 'amount' | 'order_number' | null;
type SortDirection = 'asc' | 'desc';

// Props du composant
export interface SalesOrdersTableProps {
  /** ID du canal de vente pour filtrer (null = toutes les commandes) */
  channelId?: string | null;

  /** Afficher la colonne Canal */
  showChannelColumn?: boolean;

  /** Afficher les KPIs */
  showKPIs?: boolean;

  /** Autoriser la validation */
  allowValidate?: boolean;

  /** Autoriser l'expedition */
  allowShip?: boolean;

  /** Autoriser l'annulation */
  allowCancel?: boolean;

  /** Autoriser la suppression */
  allowDelete?: boolean;

  /** Autoriser l'edition (modal standard) */
  allowEdit?: boolean;

  /** Colonnes personnalisees (pour LinkMe: Affilie, Marge) */
  additionalColumns?: Array<{
    key: string;
    header: string;
    cell: (order: SalesOrder) => React.ReactNode;
  }>;

  /** Callback custom pour le bouton "Nouvelle commande" (ex: redirection) */
  onCreateClick?: () => void;

  /** Callback quand l'utilisateur clique "LinkMe" dans le wizard canal (ex: redirection) */
  onLinkMeClick?: () => void;

  /** Ouvrir le modal de création au montage (ex: ?action=new) */
  initialCreateOpen?: boolean;

  /** Render custom du modal de creation */
  renderCreateModal?: (props: {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;

  /** Render custom du modal d'edition */
  renderEditModal?: (props: {
    orderId: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
  }) => React.ReactNode;

  /** Callback apres creation */
  onOrderCreated?: () => void;

  /** Callback apres mise a jour */
  onOrderUpdated?: () => void;

  /** Server Action pour update status (doit etre passee depuis l'app) */
  updateStatusAction?: (
    orderId: string,
    newStatus: SalesOrderStatus,
    userId: string
  ) => Promise<{ success: boolean; error?: string }>;

  /** Render custom element a droite du header (ex: bouton filtre) */
  renderHeaderRight?: () => React.ReactNode;

  /** Filtre personnalise applique sur les commandes */
  customFilter?: (order: SalesOrder) => boolean;

  /** Activer la pagination */
  enablePagination?: boolean;

  /** Nombre d'items par page par defaut (10 ou 20) */
  defaultItemsPerPage?: 10 | 20;

  /** Commandes pré-chargées (évite double fetch quand parent fetch déjà) */
  preloadedOrders?: SalesOrder[];

  /** Contrôle colonnes triables */
  sortableColumns?: {
    date?: boolean;
    client?: boolean;
    amount?: boolean;
    orderNumber?: boolean;
  };

  /** Callback custom pour le bouton "Voir" (remplace le modal par défaut) */
  onViewOrder?: (order: SalesOrder) => void;
}

const isOrderEditable = (order: SalesOrder, channelId?: string | null) => {
  // Si on filtre par canal, les commandes sont editables via le modal custom
  if (channelId) return true;
  // Sinon, seules les commandes sans canal specifique sont editables
  return (
    !order.channel_id ||
    (order.channel_id !== LINKME_CHANNEL_ID &&
      order.channel_id !== SITE_INTERNET_CHANNEL_ID)
  );
};

const getChannelRedirectUrl = (order: SalesOrder) => {
  if (order.channel_id === LINKME_CHANNEL_ID) {
    if (order.status === 'pending_approval') {
      return '/canaux-vente/linkme/approbations';
    }
    return '/canaux-vente/linkme/commandes';
  }
  if (order.channel_id === SITE_INTERNET_CHANNEL_ID) {
    return '/canaux-vente/site-internet/commandes';
  }
  return null;
};

export function SalesOrdersTable({
  channelId = null,
  showChannelColumn = true,
  showKPIs = true,
  allowValidate = true,
  allowShip = true,
  allowCancel = true,
  allowDelete = true,
  allowEdit = true,
  additionalColumns = [],
  onCreateClick,
  onLinkMeClick,
  initialCreateOpen = false,
  renderCreateModal,
  renderEditModal,
  onOrderCreated,
  onOrderUpdated,
  updateStatusAction,
  renderHeaderRight,
  customFilter,
  enablePagination = false,
  defaultItemsPerPage = 10,
  preloadedOrders,
  sortableColumns,
  onViewOrder,
}: SalesOrdersTableProps) {
  const {
    loading: hookLoading,
    orders: fetchedOrders,
    stats: _stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
  } = useSalesOrders();

  // ✅ OPTIMISÉ: Utiliser preloadedOrders si fourni (évite double fetch)
  const orders = preloadedOrders ?? fetchedOrders;
  const loading = preloadedOrders ? false : hookLoading;

  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const { enseignes } = useActiveEnseignes();

  // Etats filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<SalesOrderStatus | 'all'>('all');
  const [advancedFilters, setAdvancedFilters] = useState<SalesAdvancedFilters>(
    DEFAULT_SALES_FILTERS
  );

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
    () => countActiveFilters(advancedFilters, DEFAULT_SALES_FILTERS) > 0,
    [advancedFilters]
  );

  // Etats tri
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Etats pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<10 | 20>(
    defaultItemsPerPage
  );

  // Etats modals
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [dismissedOrderId, setDismissedOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(initialCreateOpen);
  const [showLinkMeModal, setShowLinkMeModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [orderToShip, setOrderToShip] = useState<SalesOrder | null>(null);
  const [showValidateConfirmation, setShowValidateConfirmation] =
    useState(false);
  const [orderToValidate, setOrderToValidate] = useState<string | null>(null);
  const [showDevalidateConfirmation, setShowDevalidateConfirmation] =
    useState(false);
  const [orderToDevalidate, setOrderToDevalidate] = useState<string | null>(
    null
  );
  const [showLinkTransactionModal, setShowLinkTransactionModal] =
    useState(false);
  const [selectedOrderForLink, setSelectedOrderForLink] =
    useState<SalesOrder | null>(null);

  // Etat pour les lignes expandees (chevron)
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

  // Fetch initial avec filtre canal
  useEffect(() => {
    // ✅ OPTIMISÉ: Ne pas fetch si preloadedOrders fourni (évite double fetch)
    if (preloadedOrders) return;

    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    void fetchStats(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchStats failed:', err);
    });
  }, [fetchOrders, fetchStats, channelId, preloadedOrders]);

  // Ouvrir automatiquement le modal si query param ?id= present
  useEffect(() => {
    const orderId = searchParams.get('id');
    if (
      orderId &&
      orders.length > 0 &&
      !showOrderDetail &&
      orderId !== dismissedOrderId
    ) {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setShowOrderDetail(true);
      }
    }
  }, [searchParams, orders, showOrderDetail, dismissedOrderId]);

  // Filtrage des commandes
  const filteredOrders = useMemo(() => {
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const filtered = orders.filter(order => {
      // Filtre onglet statut (accès direct, prioritaire)
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      // Filtre avancé: statuts multi-select (si onglet = 'all')
      if (
        activeTab === 'all' &&
        advancedFilters.statuses.length > 0 &&
        !advancedFilters.statuses.includes(order.status)
      ) {
        return false;
      }

      // Filtre avancé: type client
      if (advancedFilters.customerType !== 'all') {
        switch (advancedFilters.customerType) {
          case 'individual':
            if (order.customer_type !== 'individual') return false;
            break;
          case 'professional':
            if (order.customer_type !== 'organization') return false;
            break;
          case 'enseigne':
            if (
              order.customer_type !== 'organization' ||
              !order.organisations?.enseigne_id
            )
              return false;
            // Filtre enseigne spécifique
            if (
              advancedFilters.enseigneId &&
              order.organisations?.enseigne_id !== advancedFilters.enseigneId
            )
              return false;
            break;
        }
      }

      // Filtre avancé: année spécifique (basé sur date commande, fallback date création)
      const orderDateRef = order.order_date ?? order.created_at;
      if (advancedFilters.filterYear !== null) {
        const orderDate = new Date(orderDateRef);
        if (orderDate.getFullYear() !== advancedFilters.filterYear)
          return false;
      }

      // Filtre avancé: période (seulement si année courante ou toutes)
      const periodActive =
        advancedFilters.filterYear === null ||
        advancedFilters.filterYear === currentYear;

      if (periodActive && advancedFilters.period !== 'all') {
        const orderDate = new Date(orderDateRef);
        const now = new Date();

        switch (advancedFilters.period) {
          case 'month': {
            const monthAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate()
            );
            if (orderDate < monthAgo) return false;
            break;
          }
          case 'quarter': {
            const quarterAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate()
            );
            if (orderDate < quarterAgo) return false;
            break;
          }
          case 'year': {
            const yearAgo = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate()
            );
            if (orderDate < yearAgo) return false;
            break;
          }
        }
      }

      // Filtre avancé: montant TTC
      if (
        advancedFilters.amountMin !== null &&
        (order.total_ttc || 0) < advancedFilters.amountMin
      ) {
        return false;
      }
      if (
        advancedFilters.amountMax !== null &&
        (order.total_ttc || 0) > advancedFilters.amountMax
      ) {
        return false;
      }

      // Filtre avancé: rapprochement bancaire
      if (advancedFilters.matching !== 'all') {
        if (advancedFilters.matching === 'matched' && !order.is_matched) {
          return false;
        }
        if (advancedFilters.matching === 'unmatched' && order.is_matched) {
          return false;
        }
      }

      // Filtre recherche (accès direct)
      if (searchTerm) {
        const term = normalizeString(searchTerm);
        const matchesOrderNumber = normalizeString(order.order_number).includes(
          term
        );
        const matchesOrgName = normalizeString(
          order.organisations?.trade_name ??
            order.organisations?.legal_name ??
            ''
        ).includes(term);
        const matchesIndividualName =
          normalizeString(order.individual_customers?.first_name).includes(
            term
          ) ||
          normalizeString(order.individual_customers?.last_name).includes(term);

        if (!matchesOrderNumber && !matchesOrgName && !matchesIndividualName) {
          return false;
        }
      }

      // Filtre personnalise
      if (customFilter && !customFilter(order)) {
        return false;
      }

      return true;
    });

    // Tri des commandes
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison =
              new Date(a.order_date ?? a.created_at).getTime() -
              new Date(b.order_date ?? b.created_at).getTime();
            break;
          case 'client': {
            const nameA =
              a.customer_type === 'organization'
                ? (a.organisations?.trade_name ??
                  a.organisations?.legal_name ??
                  '')
                : a.individual_customers
                  ? [
                      a.individual_customers.first_name,
                      a.individual_customers.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : '';
            const nameB =
              b.customer_type === 'organization'
                ? (b.organisations?.trade_name ??
                  b.organisations?.legal_name ??
                  '')
                : b.individual_customers
                  ? [
                      b.individual_customers.first_name,
                      b.individual_customers.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : '';
            comparison = nameA.localeCompare(nameB);
            break;
          }
          case 'order_number':
            comparison = (a.order_number || '').localeCompare(
              b.order_number || ''
            );
            break;
          case 'amount':
            comparison = (a.total_ttc || 0) - (b.total_ttc || 0);
            break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    orders,
    activeTab,
    advancedFilters,
    searchTerm,
    sortColumn,
    sortDirection,
    customFilter,
    currentYear,
  ]);

  // KPI dynamiques calcules sur commandes filtrees
  const filteredStats = useMemo(() => {
    if (filteredOrders.length === 0) {
      return {
        total_orders: 0,
        total_ht: 0,
        total_tva: 0,
        total_ttc: 0,
        eco_tax_total: 0,
        average_basket: 0,
        pending_orders: 0,
        shipped_orders: 0,
      };
    }

    const statsData = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++;
        acc.total_ht += order.total_ht || 0;
        acc.total_ttc += order.total_ttc || 0;
        acc.eco_tax_total += order.eco_tax_total || 0;

        if (order.status === 'draft' || order.status === 'validated') {
          acc.pending_orders++;
        } else if (
          order.status === 'shipped' ||
          order.status === 'partially_shipped'
        ) {
          acc.shipped_orders++;
        }

        return acc;
      },
      {
        total_orders: 0,
        total_ht: 0,
        total_ttc: 0,
        total_tva: 0,
        eco_tax_total: 0,
        average_basket: 0,
        pending_orders: 0,
        shipped_orders: 0,
      }
    );

    statsData.total_tva = statsData.total_ttc - statsData.total_ht;
    statsData.average_basket =
      statsData.total_orders > 0
        ? statsData.total_ttc / statsData.total_orders
        : 0;

    return statsData;
  }, [filteredOrders]);

  // Pagination: calcul des commandes a afficher
  const totalPages = enablePagination
    ? Math.ceil(filteredOrders.length / itemsPerPage)
    : 1;
  const paginatedOrders = enablePagination
    ? filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredOrders;

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, advancedFilters, searchTerm, customFilter]);

  // Compteurs par onglet
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pending_approval: orders.filter(o => o.status === 'pending_approval')
        .length,
      draft: orders.filter(o => o.status === 'draft').length,
      validated: orders.filter(o => o.status === 'validated').length,
      shipped: orders.filter(
        o => o.status === 'shipped' || o.status === 'partially_shipped'
      ).length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // Handlers tri
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };

  // Handlers actions
  const handleStatusChange = async (
    orderId: string,
    newStatus: SalesOrderStatus
  ) => {
    if (newStatus === 'validated') {
      setOrderToValidate(orderId);
      setShowValidateConfirmation(true);
      return;
    }

    if (newStatus === 'draft') {
      setOrderToDevalidate(orderId);
      setShowDevalidateConfirmation(true);
      return;
    }

    try {
      await updateStatus(orderId, newStatus);
      toast({
        title: 'Succes',
        description: 'Commande mise a jour avec succes',
      });
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleDevalidateConfirmed = async () => {
    if (!orderToDevalidate) return;

    try {
      await updateStatus(orderToDevalidate, 'draft');
      toast({
        title: 'Succes',
        description:
          'Commande devalidee avec succes. Elle est de nouveau en brouillon.',
      });
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors de la devalidation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de devalider la commande',
        variant: 'destructive',
      });
    } finally {
      setShowDevalidateConfirmation(false);
      setOrderToDevalidate(null);
    }
  };

  const handleValidateConfirmed = async () => {
    if (!orderToValidate) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Utilisateur non authentifie');
      }

      // Utiliser la Server Action si fournie, sinon le hook
      if (updateStatusAction) {
        const result = await updateStatusAction(
          orderToValidate,
          'validated',
          user.id
        );
        if (!result.success) {
          throw new Error(result.error ?? 'Erreur lors de la validation');
        }
      } else {
        await updateStatus(orderToValidate, 'validated');
      }

      toast({
        title: 'Succes',
        description: 'Commande validee avec succes',
      });

      setShowValidateConfirmation(false);
      setOrderToValidate(null);

      // Rafraichir la liste
      const filters = channelId ? { channel_id: channelId } : undefined;
      await fetchOrders(filters);
      onOrderUpdated?.();
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de valider la commande',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    if (confirm('Etes-vous sur de vouloir supprimer cette commande ?')) {
      try {
        await deleteOrder(orderId);
        onOrderUpdated?.();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const handleCancel = async (orderId: string) => {
    if (confirm('Etes-vous sur de vouloir annuler cette commande ?')) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          throw new Error('Utilisateur non authentifie');
        }

        if (updateStatusAction) {
          const result = await updateStatusAction(
            orderId,
            'cancelled',
            user.id
          );
          if (!result.success) {
            throw new Error(result.error ?? "Erreur lors de l'annulation");
          }
        } else {
          await updateStatus(orderId, 'cancelled');
        }

        // Liberer les reservations de stock
        await supabase
          .from('stock_reservations')
          .update({
            released_at: new Date().toISOString(),
            released_by: user.id,
          })
          .eq('reference_type', 'sales_order')
          .eq('reference_id', orderId)
          .is('released_at', null);

        toast({
          title: 'Succes',
          description: 'Commande annulee avec succes',
        });

        const filters = channelId ? { channel_id: channelId } : undefined;
        await fetchOrders(filters);
        await fetchStats(filters);
        onOrderUpdated?.();
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

  const _handlePrintPDF = async (order: SalesOrder) => {
    try {
      toast({
        title: 'Generation PDF...',
        description: `Preparation de la commande ${order.order_number}`,
      });

      const response = await fetch(`/api/sales-orders/${order.id}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commande-${order.order_number}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF genere avec succes',
        description: 'Le telechargement a demarre',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erreur generation PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de generer le PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      toast({
        title: 'Export en cours...',
        description: 'Generation du fichier Excel',
      });

      const response = await fetch('/api/sales-orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeTab,
          customerType: advancedFilters.customerType,
          period: advancedFilters.period,
          searchTerm,
          channelId,
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-${channelId ? 'linkme-' : ''}${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export reussi',
        description: 'Le fichier Excel a ete telecharge',
      });
    } catch (error) {
      console.error('Erreur export Excel:', error);
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les commandes",
        variant: 'destructive',
      });
    }
  };

  const openOrderDetail = (order: SalesOrder) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const openEditOrder = (orderId: string) => {
    setEditingOrderId(orderId);
    setShowEditModal(true);
  };

  const openShipmentModal = (order: SalesOrder) => {
    setOrderToShip(order);
    setShowShipmentModal(true);
  };

  const handleShipmentSuccess = () => {
    setShowShipmentModal(false);
    setOrderToShip(null);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    void fetchStats(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchStats failed:', err);
    });
    toast({
      title: 'Succes',
      description: 'Expedition enregistree avec succes',
    });
    onOrderUpdated?.();
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    void fetchStats(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchStats failed:', err);
    });
    onOrderCreated?.();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingOrderId(null);
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    void fetchStats(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchStats failed:', err);
    });
    onOrderUpdated?.();
  };

  const handleLinkTransactionSuccess = () => {
    toast({
      title: 'Commande liee',
      description: 'La transaction a ete liee a la commande.',
    });
    const filters = channelId ? { channel_id: channelId } : undefined;
    void fetchOrders(filters).catch((err: unknown) => {
      console.error('[SalesOrdersTable] fetchOrders failed:', err);
    });
    setShowLinkTransactionModal(false);
    setSelectedOrderForLink(null);
  };

  // Fermeture du modal detail : nettoyer ?id= de l'URL pour eviter la boucle de reouverture
  const handleCloseOrderDetail = useCallback(() => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
    const orderId = searchParams.get('id');
    if (orderId) {
      setDismissedOrderId(orderId);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('id');
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <div className="space-y-6">
      {/* Statistiques KPI */}
      {showKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredStats.total_orders}
              </div>
              <p className="text-xs text-gray-500 mt-1">commandes</p>
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
                    Eco-taxe HT: {formatCurrency(filteredStats.eco_tax_total)}
                  </div>
                )}
                <div>TVA: {formatCurrency(filteredStats.total_tva)}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Panier Moyen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredStats.average_basket)}
              </div>
              <p className="text-xs text-gray-500 mt-1">par commande</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                En cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {filteredStats.pending_orders}
              </div>
              <p className="text-xs text-gray-500 mt-1">draft + validee</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expediees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {filteredStats.shipped_orders}
              </div>
              <p className="text-xs text-gray-500 mt-1">commandes</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Onglets Statuts + Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filtres</CardTitle>
            <div className="flex gap-2">
              <ButtonUnified
                onClick={() => {
                  void handleExportExcel().catch((err: unknown) => {
                    console.error('[SalesOrdersTable] export failed:', err);
                  });
                }}
                variant="outline"
                icon={FileSpreadsheet}
              >
                Exporter Excel
              </ButtonUnified>
              {onCreateClick ? (
                <ButtonUnified onClick={onCreateClick} icon={Plus}>
                  Nouvelle commande
                </ButtonUnified>
              ) : renderCreateModal ? (
                <ButtonUnified
                  onClick={() => setShowCreateModal(true)}
                  icon={Plus}
                >
                  Nouvelle commande
                </ButtonUnified>
              ) : (
                <SalesOrderFormModal
                  buttonLabel="Nouvelle commande"
                  onSuccess={handleCreateSuccess}
                  onLinkMeClick={onLinkMeClick}
                />
              )}
              {renderHeaderRight?.()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Onglets Statuts */}
          <Tabs
            value={activeTab}
            onValueChange={value =>
              setActiveTab(value as SalesOrderStatus | 'all')
            }
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="pending_approval">
                Approbation ({tabCounts.pending_approval})
              </TabsTrigger>
              <TabsTrigger value="draft">
                Brouillon ({tabCounts.draft})
              </TabsTrigger>
              <TabsTrigger value="validated">
                Validee ({tabCounts.validated})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Expediee ({tabCounts.shipped})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Annulee ({tabCounts.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par numero ou client..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtres inline (dropdowns compacts) */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Type client */}
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                Type client :
              </span>
              <Select
                value={advancedFilters.customerType}
                onValueChange={value =>
                  setAdvancedFilters(prev => ({
                    ...prev,
                    customerType: value,
                    enseigneId: value !== 'enseigne' ? null : prev.enseigneId,
                  }))
                }
              >
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="individual">Particulier</SelectItem>
                  <SelectItem value="professional">Professionnel</SelectItem>
                  <SelectItem value="enseigne">Enseigne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Enseigne (visible si customerType === 'enseigne') */}
            {advancedFilters.customerType === 'enseigne' &&
              enseignes.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                    Enseigne :
                  </span>
                  <Select
                    value={advancedFilters.enseigneId ?? 'all'}
                    onValueChange={value =>
                      setAdvancedFilters(prev => ({
                        ...prev,
                        enseigneId: value === 'all' ? null : value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Toutes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {enseignes.map(e => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.name} ({e.member_count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                    period: value as SalesAdvancedFilters['period'],
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
                    matching: value as SalesAdvancedFilters['matching'],
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
                onClick={() => setAdvancedFilters(DEFAULT_SALES_FILTERS)}
              >
                Réinitialiser
              </ButtonUnified>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes</CardTitle>
          <CardDescription>
            {filteredOrders.length} commande(s) trouvee(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Aucune commande trouvee</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6">
              <div className="px-6">
                <Table className="w-auto [&_th]:px-2.5 [&_td]:px-2.5">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      {/* N° Commande - sortable si sortableColumns.orderNumber */}
                      {sortableColumns?.orderNumber !== false ? (
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                          onClick={() => handleSort('order_number')}
                        >
                          <span className="inline-flex items-center gap-1">
                            N Commande
                            {renderSortIcon('order_number')}
                          </span>
                        </TableHead>
                      ) : (
                        <TableHead className="whitespace-nowrap">
                          N Commande
                        </TableHead>
                      )}
                      {/* Client - sortable si sortableColumns.client */}
                      {sortableColumns?.client !== false ? (
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => handleSort('client')}
                        >
                          <span className="inline-flex items-center gap-1">
                            Client
                            {renderSortIcon('client')}
                          </span>
                        </TableHead>
                      ) : (
                        <TableHead>Client</TableHead>
                      )}
                      <TableHead className="whitespace-nowrap">
                        Statut
                      </TableHead>
                      <TableHead className="whitespace-nowrap">
                        Paiement
                      </TableHead>
                      <TableHead className="whitespace-nowrap text-center">
                        Art.
                      </TableHead>
                      {/* Date commande - sortable si sortableColumns.date */}
                      {sortableColumns?.date !== false ? (
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                          onClick={() => handleSort('date')}
                        >
                          <span className="inline-flex items-center gap-1">
                            Date commande
                            {renderSortIcon('date')}
                          </span>
                        </TableHead>
                      ) : (
                        <TableHead className="whitespace-nowrap">
                          Date commande
                        </TableHead>
                      )}
                      {showChannelColumn && (
                        <TableHead className="whitespace-nowrap">
                          Canal
                        </TableHead>
                      )}
                      {/* Colonnes additionnelles */}
                      {additionalColumns.map(col => (
                        <TableHead key={col.key}>{col.header}</TableHead>
                      ))}
                      {/* Montant - sortable si sortableColumns.amount */}
                      {sortableColumns?.amount !== false ? (
                        <TableHead
                          className="cursor-pointer hover:bg-gray-50 whitespace-nowrap"
                          onClick={() => handleSort('amount')}
                        >
                          <span className="inline-flex items-center gap-1">
                            Montant TTC
                            {renderSortIcon('amount')}
                          </span>
                        </TableHead>
                      ) : (
                        <TableHead className="whitespace-nowrap">
                          Montant TTC
                        </TableHead>
                      )}
                      <TableHead className="whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map(order => {
                      const customerDisplayName =
                        order.customer_type === 'organization' &&
                        order.organisations
                          ? order.organisations.trade_name &&
                            order.organisations.trade_name !==
                              order.organisations.legal_name
                            ? `${order.organisations.trade_name} (${order.organisations.legal_name})`
                            : (order.organisations.legal_name ??
                              order.organisations.trade_name ??
                              '')
                          : order.individual_customers
                            ? [
                                order.individual_customers.first_name,
                                order.individual_customers.last_name,
                              ]
                                .filter(Boolean)
                                .join(' ')
                            : '';

                      const _canDelete =
                        order.status === 'draft' ||
                        order.status === 'cancelled';

                      const items = order.sales_order_items ?? [];
                      const hasSamples = items.some(
                        item => item.is_sample === true
                      );
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
                            <TableCell className="w-[80px]">
                              <div className="space-y-0.5">
                                <span className="text-xs font-mono font-medium break-all leading-tight">
                                  {order.order_number}
                                </span>
                                {order.invoice_number && (
                                  <Link
                                    href={
                                      order.invoice_qonto_id
                                        ? `/factures/${order.invoice_qonto_id}`
                                        : '#'
                                    }
                                    target="_blank"
                                    className="flex items-center gap-1 text-[10px] font-mono text-blue-600 hover:text-blue-800 hover:underline"
                                    title={`Voir facture ${order.invoice_number}`}
                                  >
                                    <FileText className="h-3 w-3 shrink-0" />
                                    {order.invoice_number}
                                  </Link>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium leading-tight break-words">
                                  {customerDisplayName || 'Non defini'}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {order.customer_type === 'organization'
                                    ? 'Pro'
                                    : 'Particulier'}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    statusColors[order.status]
                                  )}
                                >
                                  {statusLabels[order.status]}
                                </Badge>
                                {hasSamples && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Echantillon
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {order.payment_status_v2 === 'overpaid' ? (
                                  <Badge className="text-xs bg-red-100 text-red-800">
                                    Surpayé
                                  </Badge>
                                ) : order.payment_status_v2 === 'paid' ? (
                                  <Badge className="text-xs bg-green-100 text-green-800">
                                    Payé
                                  </Badge>
                                ) : order.payment_status_v2 ===
                                  'partially_paid' ? (
                                  <Badge className="text-xs bg-amber-100 text-amber-800">
                                    Partiel
                                  </Badge>
                                ) : (
                                  <Badge className="text-xs bg-orange-100 text-orange-800">
                                    En attente
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center whitespace-nowrap">
                              <span className="text-xs font-medium">
                                {items.length}
                              </span>
                              <span className="text-muted-foreground text-[10px] ml-0.5">
                                ref.
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <span className="text-xs">
                                {order.order_date
                                  ? formatDate(order.order_date)
                                  : formatDate(order.created_at)}
                              </span>
                            </TableCell>
                            {showChannelColumn && (
                              <TableCell className="whitespace-nowrap">
                                {order.sales_channel?.name ? (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium px-1.5 py-0"
                                  >
                                    {order.sales_channel.name}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-xs">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            )}
                            {/* Colonnes additionnelles */}
                            {additionalColumns.map(col => (
                              <TableCell key={col.key}>
                                {col.cell(order)}
                              </TableCell>
                            ))}
                            <TableCell className="whitespace-nowrap">
                              <span className="text-xs font-medium">
                                {formatCurrency(
                                  order.total_ttc || order.total_ht
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              <SalesOrderActionMenu
                                order={order}
                                channelId={channelId}
                                channelRedirectUrl={getChannelRedirectUrl(
                                  order
                                )}
                                channelName={
                                  order.sales_channel?.name ?? 'le CMS du canal'
                                }
                                isEditable={isOrderEditable(order, channelId)}
                                allowEdit={allowEdit}
                                allowValidate={allowValidate}
                                allowShip={allowShip}
                                allowCancel={allowCancel}
                                allowDelete={allowDelete}
                                onView={() =>
                                  onViewOrder
                                    ? onViewOrder(order)
                                    : openOrderDetail(order)
                                }
                                onEdit={() => openEditOrder(order.id)}
                                onValidate={() => {
                                  void handleStatusChange(
                                    order.id,
                                    'validated'
                                  ).catch((err: unknown) => {
                                    console.error(
                                      '[SalesOrdersTable] validate failed:',
                                      err
                                    );
                                  });
                                }}
                                onDevalidate={() => {
                                  void handleStatusChange(
                                    order.id,
                                    'draft'
                                  ).catch((err: unknown) => {
                                    console.error(
                                      '[SalesOrdersTable] devalidate failed:',
                                      err
                                    );
                                  });
                                }}
                                onShip={() => openShipmentModal(order)}
                                onCancel={() => {
                                  void handleCancel(order.id).catch(
                                    (err: unknown) => {
                                      console.error(
                                        '[SalesOrdersTable] cancel failed:',
                                        err
                                      );
                                    }
                                  );
                                }}
                                onDelete={() => {
                                  void handleDelete(order.id).catch(
                                    (err: unknown) => {
                                      console.error(
                                        '[SalesOrdersTable] delete failed:',
                                        err
                                      );
                                    }
                                  );
                                }}
                                onLinkTransaction={() => {
                                  setSelectedOrderForLink(order);
                                  setShowLinkTransactionModal(true);
                                }}
                              />
                            </TableCell>
                          </TableRow>

                          {/* Ligne d'expansion - affiche les produits */}
                          {isExpanded && items.length > 0 && (
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              <TableCell
                                colSpan={
                                  9 +
                                  additionalColumns.length +
                                  (showChannelColumn ? 1 : 0)
                                }
                                className="p-0"
                              >
                                <div className="py-3 px-6 space-y-2">
                                  {items.map((item: SalesOrderItem) => (
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
                                        {item.products?.name ??
                                          'Produit inconnu'}
                                      </span>
                                      <span className="text-muted-foreground">
                                        x{item.quantity}
                                      </span>
                                      <span className="font-medium w-24 text-right">
                                        {formatCurrency(item.total_ht ?? 0)}
                                      </span>
                                      {item.is_sample && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          Echantillon
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
            </div>
          )}

          {/* Pagination controls */}
          {enablePagination && filteredOrders.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Afficher</span>
                <div className="flex gap-1">
                  <ButtonUnified
                    variant={itemsPerPage === 10 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setItemsPerPage(10);
                      setCurrentPage(1);
                    }}
                  >
                    10
                  </ButtonUnified>
                  <ButtonUnified
                    variant={itemsPerPage === 20 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setItemsPerPage(20);
                      setCurrentPage(1);
                    }}
                  >
                    20
                  </ButtonUnified>
                </div>
                <span className="text-sm text-gray-600">par page</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {(currentPage - 1) * itemsPerPage + 1}-
                  {Math.min(currentPage * itemsPerPage, filteredOrders.length)}{' '}
                  sur {filteredOrders.length}
                </span>
                <div className="flex gap-1">
                  <ButtonUnified
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Precedent
                  </ButtonUnified>
                  <ButtonUnified
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(p => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </ButtonUnified>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Detail Commande */}
      <OrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={handleCloseOrderDetail}
        onUpdate={() => {
          const filters = channelId ? { channel_id: channelId } : undefined;
          void fetchOrders(filters).catch((err: unknown) => {
            console.error('[SalesOrdersTable] fetchOrders failed:', err);
          });
          void fetchStats(filters).catch((err: unknown) => {
            console.error('[SalesOrdersTable] fetchStats failed:', err);
          });
          onOrderUpdated?.();
        }}
      />

      {/* Modal Edition Commande */}
      {editingOrderId &&
        (renderEditModal ? (
          renderEditModal({
            orderId: editingOrderId,
            open: showEditModal,
            onClose: () => {
              setShowEditModal(false);
              setEditingOrderId(null);
            },
            onSuccess: handleEditSuccess,
          })
        ) : (
          <SalesOrderFormModal
            mode="edit"
            orderId={editingOrderId}
            open={showEditModal}
            onOpenChange={value => {
              setShowEditModal(value);
              if (!value) {
                setEditingOrderId(null);
              }
            }}
            onSuccess={handleEditSuccess}
          />
        ))}

      {/* Modal Creation (si custom) */}
      {renderCreateModal?.({
        open: showCreateModal,
        onClose: () => setShowCreateModal(false),
        onSuccess: handleCreateSuccess,
      })}

      {/* Modal LinkMe (quand sélectionné depuis SalesOrderFormModal) */}
      <CreateLinkMeOrderModal
        isOpen={showLinkMeModal}
        onClose={() => {
          setShowLinkMeModal(false);
          handleCreateSuccess();
        }}
      />

      {/* Modal Expedition */}
      {orderToShip && (
        <SalesOrderShipmentModal
          order={orderToShip}
          open={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setOrderToShip(null);
          }}
          onSuccess={handleShipmentSuccess}
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
              Vous etes sur le point de valider cette commande client. Une fois
              validee, la commande pourra etre expediee et les alertes de stock
              seront generees automatiquement si necessaire.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleValidateConfirmed().catch((err: unknown) => {
                  console.error(
                    '[SalesOrdersTable] validate confirmed failed:',
                    err
                  );
                });
              }}
            >
              Valider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog Confirmation Devalidation */}
      <AlertDialog
        open={showDevalidateConfirmation}
        onOpenChange={setShowDevalidateConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la devalidation</AlertDialogTitle>
            <AlertDialogDescription>
              Vous etes sur le point de devalider cette commande client. Elle
              repassera en statut brouillon et ne pourra plus etre expediee tant
              qu&apos;elle ne sera pas revalidee.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDevalidateConfirmed().catch((err: unknown) => {
                  console.error(
                    '[SalesOrdersTable] devalidate confirmed failed:',
                    err
                  );
                });
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Devalider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal Rapprochement Transaction */}
      <RapprochementFromOrderModal
        open={showLinkTransactionModal}
        onOpenChange={setShowLinkTransactionModal}
        order={
          selectedOrderForLink
            ? {
                id: selectedOrderForLink.id,
                order_number: selectedOrderForLink.order_number,
                customer_name:
                  selectedOrderForLink.organisations?.legal_name ??
                  ((selectedOrderForLink.individual_customers
                    ? [
                        selectedOrderForLink.individual_customers.first_name,
                        selectedOrderForLink.individual_customers.last_name,
                      ]
                        .filter(Boolean)
                        .join(' ')
                    : '') ||
                    'Non défini'),
                total_ttc: selectedOrderForLink.total_ttc,
                created_at: selectedOrderForLink.created_at,
                order_date: selectedOrderForLink.order_date ?? null,
                shipped_at: selectedOrderForLink.shipped_at,
                payment_status_v2: selectedOrderForLink.payment_status_v2,
              }
            : null
        }
        onSuccess={handleLinkTransactionSuccess}
      />
    </div>
  );
}

export default SalesOrdersTable;
