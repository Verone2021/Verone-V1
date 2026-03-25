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

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';

import { useSearchParams, useRouter } from 'next/navigation';

import { useToast } from '@verone/common';
import { RapprochementFromOrderModal } from '@verone/finance/components';
import { useActiveEnseignes } from '@verone/organisations';
import { ButtonUnified } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Plus } from 'lucide-react';

import type { SalesAdvancedFilters } from '../../types/advanced-filters';
import {
  DEFAULT_SALES_FILTERS,
  countActiveFilters,
} from '../../types/advanced-filters';
import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../hooks/use-sales-orders';
import { useSalesOrders } from '../../hooks/use-sales-orders';
import { CreateLinkMeOrderModal } from '../modals/CreateLinkMeOrderModal';
import { OrderDetailModal } from '../modals/OrderDetailModal';
import { SalesOrderFormModal } from '../modals/SalesOrderFormModal';
import { SalesOrderShipmentModal } from '../modals/SalesOrderShipmentModal';
import type { SortColumn, SortDirection } from './sales-orders-constants';
import { SalesOrderConfirmDialogs } from './SalesOrderConfirmDialogs';
import { SalesOrderDataTable } from './SalesOrderDataTable';
import { SalesOrderFilters } from './SalesOrderFilters';
import { SalesOrderStatsCards } from './SalesOrderStatsCards';

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

  /** Ouvrir le modal de creation au montage (ex: ?action=new) */
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

  /** Commandes pre-chargees (evite double fetch quand parent fetch deja) */
  preloadedOrders?: SalesOrder[];

  /** Controle colonnes triables */
  sortableColumns?: {
    date?: boolean;
    client?: boolean;
    amount?: boolean;
    orderNumber?: boolean;
  };

  /** Callback custom pour le bouton "Voir" (remplace le modal par defaut) */
  onViewOrder?: (order: SalesOrder) => void;
}

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

  // OPTIMISE: Utiliser preloadedOrders si fourni (evite double fetch)
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

  // Annee courante + annees disponibles
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

  // Detection filtres actifs (pour bouton reset)
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
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const [showLinkTransactionModal, setShowLinkTransactionModal] =
    useState(false);
  const [selectedOrderForLink, setSelectedOrderForLink] =
    useState<SalesOrder | null>(null);

  // FIX: Refs stables pour eviter re-fetch en StrictMode
  const fetchOrdersRef = useRef(fetchOrders);
  fetchOrdersRef.current = fetchOrders;
  const fetchStatsRef = useRef(fetchStats);
  fetchStatsRef.current = fetchStats;

  // Fetch initial avec filtre canal (StrictMode safe + retry on total failure)
  useEffect(() => {
    // OPTIMISE: Ne pas fetch si preloadedOrders fourni (evite double fetch)
    if (preloadedOrders) return;

    let stale = false;
    const filters = channelId ? { channel_id: channelId } : undefined;

    // Retry logic: if fetchOrders fails completely (main query), retry up to 2 times with 3s delay
    const fetchWithRetry = async (retries = 2) => {
      try {
        await fetchOrdersRef.current(filters);
      } catch (err: unknown) {
        console.error(
          `[SalesOrdersTable] fetchOrders failed (retries left: ${retries}):`,
          err
        );
        if (retries > 0 && !stale) {
          await new Promise(resolve => setTimeout(resolve, 3000));
          if (!stale) {
            await fetchWithRetry(retries - 1);
          }
        }
      }
    };

    if (!stale) {
      void fetchWithRetry().catch((err: unknown) => {
        console.error(
          '[SalesOrdersTable] fetchOrders failed after retries:',
          err
        );
      });
      void fetchStatsRef.current(filters).catch((err: unknown) => {
        console.error('[SalesOrdersTable] fetchStats failed:', err);
      });
    }
    return () => {
      stale = true;
    };
  }, [channelId, preloadedOrders]);

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
      // Filtre onglet statut (acces direct, prioritaire)
      // pending_approval = status 'pending_approval' OU legacy 'draft' + pending_admin_validation
      if (activeTab !== 'all') {
        if (activeTab === 'pending_approval') {
          if (
            !(
              order.status === 'draft' &&
              order.pending_admin_validation === true
            )
          )
            return false;
        } else if (activeTab === 'draft') {
          if (
            order.status !== 'draft' ||
            order.pending_admin_validation === true
          )
            return false;
        } else if (order.status !== activeTab) {
          return false;
        }
      }

      // Filtre avance: statuts multi-select (si onglet = 'all')
      if (
        activeTab === 'all' &&
        advancedFilters.statuses.length > 0 &&
        !advancedFilters.statuses.includes(order.status)
      ) {
        return false;
      }

      // Filtre avance: type client
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
            // Filtre enseigne specifique
            if (
              advancedFilters.enseigneId &&
              order.organisations?.enseigne_id !== advancedFilters.enseigneId
            )
              return false;
            break;
        }
      }

      // Filtre avance: annee specifique (base sur date commande, fallback date creation)
      const orderDateRef = order.order_date ?? order.created_at;
      if (advancedFilters.filterYear !== null) {
        const orderDate = new Date(orderDateRef);
        if (orderDate.getFullYear() !== advancedFilters.filterYear)
          return false;
      }

      // Filtre avance: periode (seulement si annee courante ou toutes)
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

      // Filtre avance: montant TTC
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

      // Filtre avance: rapprochement bancaire
      if (advancedFilters.matching !== 'all') {
        if (advancedFilters.matching === 'matched' && !order.is_matched) {
          return false;
        }
        if (advancedFilters.matching === 'unmatched' && order.is_matched) {
          return false;
        }
      }

      // Filtre recherche (acces direct)
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
      pending_approval: orders.filter(
        o => o.status === 'draft' && o.pending_admin_validation === true
      ).length,
      draft: orders.filter(
        o => o.status === 'draft' && o.pending_admin_validation !== true
      ).length,
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

  const handleDelete = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!orderToDelete) return;
    try {
      await deleteOrder(orderToDelete);
      onOrderUpdated?.();
      toast({
        title: 'Succes',
        description: 'Commande supprimee avec succes',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error
            ? error.message
            : 'Impossible de supprimer la commande',
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirmation(false);
      setOrderToDelete(null);
    }
  };

  const handleCancel = (orderId: string) => {
    setOrderToCancel(orderId);
    setShowCancelConfirmation(true);
  };

  const handleCancelConfirmed = async () => {
    if (!orderToCancel) return;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Utilisateur non authentifie');
      }

      if (updateStatusAction) {
        const result = await updateStatusAction(
          orderToCancel,
          'cancelled',
          user.id
        );
        if (!result.success) {
          throw new Error(result.error ?? "Erreur lors de l'annulation");
        }
      } else {
        await updateStatus(orderToCancel, 'cancelled');
      }

      // Liberer les reservations de stock
      await supabase
        .from('stock_reservations')
        .update({
          released_at: new Date().toISOString(),
          released_by: user.id,
        })
        .eq('reference_type', 'sales_order')
        .eq('reference_id', orderToCancel)
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
    } finally {
      setShowCancelConfirmation(false);
      setOrderToCancel(null);
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

  // Build create button for the filter bar
  const renderCreateButton = onCreateClick ? (
    <ButtonUnified onClick={onCreateClick} icon={Plus}>
      Nouvelle commande
    </ButtonUnified>
  ) : renderCreateModal ? (
    <ButtonUnified onClick={() => setShowCreateModal(true)} icon={Plus}>
      Nouvelle commande
    </ButtonUnified>
  ) : (
    <SalesOrderFormModal
      buttonLabel="Nouvelle commande"
      onSuccess={handleCreateSuccess}
      onLinkMeClick={onLinkMeClick}
    />
  );

  return (
    <div className="space-y-6">
      {/* Statistiques KPI */}
      {showKPIs && <SalesOrderStatsCards stats={filteredStats} />}

      {/* Onglets Statuts + Filtres */}
      <SalesOrderFilters
        activeTab={activeTab}
        onActiveTabChange={setActiveTab}
        tabCounts={tabCounts}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        advancedFilters={advancedFilters}
        onAdvancedFiltersChange={setAdvancedFilters}
        hasActiveFilters={hasActiveFilters}
        currentYear={currentYear}
        availableYears={availableYears}
        isPeriodEnabled={isPeriodEnabled}
        enseignes={enseignes}
        onExportExcel={() => {
          void handleExportExcel().catch((err: unknown) => {
            console.error('[SalesOrdersTable] export failed:', err);
          });
        }}
        renderCreateButton={renderCreateButton}
        renderHeaderRight={renderHeaderRight}
      />

      {/* Tableau commandes */}
      <SalesOrderDataTable
        paginatedOrders={paginatedOrders}
        filteredCount={filteredOrders.length}
        loading={loading}
        showChannelColumn={showChannelColumn}
        additionalColumns={additionalColumns}
        sortableColumns={sortableColumns}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
        channelId={channelId}
        allowEdit={allowEdit}
        allowValidate={allowValidate}
        allowShip={allowShip}
        allowCancel={allowCancel}
        allowDelete={allowDelete}
        onView={order =>
          onViewOrder ? onViewOrder(order) : openOrderDetail(order)
        }
        onEdit={openEditOrder}
        onValidate={orderId => {
          void handleStatusChange(orderId, 'validated').catch(
            (err: unknown) => {
              console.error('[SalesOrdersTable] validate failed:', err);
            }
          );
        }}
        onDevalidate={orderId => {
          void handleStatusChange(orderId, 'draft').catch((err: unknown) => {
            console.error('[SalesOrdersTable] devalidate failed:', err);
          });
        }}
        onShip={openShipmentModal}
        onCancel={handleCancel}
        onDelete={handleDelete}
        onLinkTransaction={order => {
          setSelectedOrderForLink(order);
          setShowLinkTransactionModal(true);
        }}
        enablePagination={enablePagination}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

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

      {/* Modal LinkMe (quand selectionne depuis SalesOrderFormModal) */}
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

      {/* Confirmation Dialogs */}
      <SalesOrderConfirmDialogs
        showValidateConfirmation={showValidateConfirmation}
        onValidateConfirmationChange={setShowValidateConfirmation}
        onValidateConfirmed={() => {
          void handleValidateConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] validate confirmed failed:', err);
          });
        }}
        showDevalidateConfirmation={showDevalidateConfirmation}
        onDevalidateConfirmationChange={setShowDevalidateConfirmation}
        onDevalidateConfirmed={() => {
          void handleDevalidateConfirmed().catch((err: unknown) => {
            console.error(
              '[SalesOrdersTable] devalidate confirmed failed:',
              err
            );
          });
        }}
        showDeleteConfirmation={showDeleteConfirmation}
        onDeleteConfirmationChange={setShowDeleteConfirmation}
        onDeleteConfirmed={() => {
          void handleDeleteConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] delete confirmed failed:', err);
          });
        }}
        showCancelConfirmation={showCancelConfirmation}
        onCancelConfirmationChange={setShowCancelConfirmation}
        onCancelConfirmed={() => {
          void handleCancelConfirmed().catch((err: unknown) => {
            console.error('[SalesOrdersTable] cancel confirmed failed:', err);
          });
        }}
      />

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
                    'Non defini'),
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
