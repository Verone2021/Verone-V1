'use client';

/**
 * 📦 Page Réceptions Marchandises (Purchase Orders)
 *
 * Vue d'ensemble et gestion des réceptions
 * - Dashboard stats (pending, partial, overdue, urgent)
 * - Tabs: À recevoir / Historique (Best practices Odoo/ERPNext)
 * - Liste POs confirmés/partiellement reçus
 * - Historique POs complètement reçus
 * - Filtres intelligents (urgent, en retard, statut)
 * - Réception inline via modal complète
 * - Support réceptions partielles
 * - Traçabilité stock (before/after)
 *
 * @since Phase 3.7 - Unification réceptions (2025-11-04)
 * @updated Phase 3.8 - Historique + Tabs (2025-11-04)
 */

import React, { useState, useEffect } from 'react';

import type { ReceptionShipmentStats, ReceptionHistory } from '@verone/types';

import {
  PurchaseOrderReceptionModal,
  AffiliateReceptionModal,
} from '@verone/orders';
import type { AffiliateReception, PurchaseOrder } from '@verone/orders';
import { usePurchaseReceptions } from '@verone/orders';
import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import {
  Package,
  Truck,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  TrendingUp,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronRight,
  Users,
  Building2,
} from 'lucide-react';

// ============================================================================
// TYPES LOCAUX
// ============================================================================

/**
 * Purchase Order avec items enrichis + supplier name mappé
 * Retourné par loadPurchaseOrdersReadyForReception()
 */
interface PurchaseOrderWithSupplier {
  id: string;
  po_number: string;
  status: string;
  created_at: string;
  expected_delivery_date: string | null;
  received_at: string | null;
  supplier_name: string;
  organisations: {
    id: string;
    legal_name: string;
    trade_name: string | null;
  } | null;
  purchase_order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    quantity_received: number | null;
    unit_price_ht: number;
    products: {
      id: string;
      name: string;
      sku: string;
      stock_real: number | null; // ✅ stock_real (pas stock_quantity)
      product_images?: Array<{
        public_url: string;
        is_primary: boolean;
      }>;
    };
  }>;
}

/**
 * Historique annulation (reliquat annulé)
 * Retourné par loadCancellationHistory()
 */
interface CancellationHistoryItem {
  id: string;
  performed_at: string;
  notes: string | null;
  quantity_cancelled: number;
  product_name: string;
  product_sku: string;
}

/**
 * Réception affilié mappée avec noms display
 * Retourné par loadAffiliateProductReceptions()
 */
interface AffiliateReceptionMapped {
  id: string;
  reference_type: string;
  product_id: string;
  quantity_expected: number;
  quantity_received: number | null;
  status: string;
  notes: string | null;
  received_at: string | null;
  received_by: string | null;
  created_at: string;
  affiliate_id: string | null;
  affiliate_name: string;
  enseigne_name: string;
  product_name: string;
  product_sku: string;
  product_image_url: string | null;
}

/**
 * Filtres pour queries PO
 */
interface ReceptionFilters {
  status?: string;
  search?: string;
  urgent_only?: boolean;
  overdue_only?: boolean;
}

// ============================================================================
// COMPOSANT
// ============================================================================

export default function ReceptionsPage() {
  const {
    loading,
    error,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception,
    loadReceptionHistory,
    loadCancellationHistory,
    loadAffiliateProductReceptions,
  } = usePurchaseReceptions();

  const [stats, setStats] = useState<ReceptionShipmentStats | null>(null);
  const [orders, setOrders] = useState<PurchaseOrderWithSupplier[]>([]);
  const [historyOrders, setHistoryOrders] = useState<
    PurchaseOrderWithSupplier[]
  >([]);
  const [selectedOrder, setSelectedOrder] =
    useState<PurchaseOrderWithSupplier | null>(null);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionHistory, setReceptionHistory] = useState<ReceptionHistory[]>(
    []
  );
  const [cancellationHistory, setCancellationHistory] = useState<
    CancellationHistoryItem[]
  >([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Réceptions affiliés
  const [affiliateReceptions, setAffiliateReceptions] = useState<
    AffiliateReceptionMapped[]
  >([]);
  const [affiliateHistory, setAffiliateHistory] = useState<
    AffiliateReceptionMapped[]
  >([]);
  const [selectedAffiliateReception, setSelectedAffiliateReception] =
    useState<AffiliateReceptionMapped | null>(null);

  const [activeTab, setActiveTab] = useState<string>('to-receive');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  // Filtre source: tous, fournisseurs (PO) ou affiliés
  const [sourceFilter, setSourceFilter] = useState<
    'all' | 'suppliers' | 'affiliates'
  >('all');

  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // État pour les lignes expandées (affichage détails produits)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedHistoryRows, setExpandedHistoryRows] = useState<Set<string>>(
    new Set()
  );

  // Toggle expansion d'une ligne
  const toggleRowExpansion = (orderId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleHistoryRowExpansion = (orderId: string) => {
    setExpandedHistoryRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Charger stats
  useEffect(() => {
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to load stats:', error);
      });
  }, [loadReceptionStats]);

  // Charger liste POs à recevoir (fournisseurs) - aussi quand 'all'
  useEffect(() => {
    if (
      activeTab === 'to-receive' &&
      (sourceFilter === 'suppliers' || sourceFilter === 'all')
    ) {
      const filters: ReceptionFilters = {};

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchTerm) {
        filters.search = searchTerm;
      }

      if (urgencyFilter === 'urgent') {
        filters.urgent_only = true;
      } else if (urgencyFilter === 'overdue') {
        filters.overdue_only = true;
      }

      void loadPurchaseOrdersReadyForReception(filters)
        .then(data => setOrders(data as PurchaseOrderWithSupplier[]))
        .catch(error => {
          console.error('[Receptions] Failed to load purchase orders:', error);
        });
    }
  }, [
    statusFilter,
    searchTerm,
    urgencyFilter,
    activeTab,
    sourceFilter,
    loadPurchaseOrdersReadyForReception,
  ]);

  // Charger réceptions affiliés - aussi quand 'all'
  useEffect(() => {
    if (
      activeTab === 'to-receive' &&
      (sourceFilter === 'affiliates' || sourceFilter === 'all')
    ) {
      void loadAffiliateProductReceptions({ search: searchTerm })
        .then(data =>
          setAffiliateReceptions(data as AffiliateReceptionMapped[])
        )
        .catch(error => {
          console.error(
            '[Receptions] Failed to load affiliate receptions:',
            error
          );
        });
    }
  }, [searchTerm, activeTab, sourceFilter, loadAffiliateProductReceptions]);

  // Charger historique POs reçus + affiliés
  useEffect(() => {
    if (activeTab === 'history') {
      const filters: ReceptionFilters = {
        status: 'received', // Uniquement les POs complètement reçus
      };

      if (historySearchTerm) {
        filters.search = historySearchTerm;
      }

      // Charger historique POs fournisseurs
      void loadPurchaseOrdersReadyForReception(filters)
        .then(data => setHistoryOrders(data as PurchaseOrderWithSupplier[]))
        .catch(error => {
          console.error('[Receptions] Failed to load history orders:', error);
        });

      // Charger historique réceptions affiliés (completed/cancelled)
      void loadAffiliateProductReceptions({
        status: 'completed',
        search: historySearchTerm,
      })
        .then(data => setAffiliateHistory(data as AffiliateReceptionMapped[]))
        .catch(error => {
          console.error(
            '[Receptions] Failed to load affiliate history:',
            error
          );
        });
    }
  }, [
    historySearchTerm,
    activeTab,
    loadAffiliateProductReceptions,
    loadPurchaseOrdersReadyForReception,
  ]);

  const handleOpenReception = (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    setShowReceptionModal(true);
  };

  const handleReceptionSuccess = () => {
    // Recharger stats et liste
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to reload stats:', error);
      });
    void loadPurchaseOrdersReadyForReception()
      .then(data => setOrders(data as PurchaseOrderWithSupplier[]))
      .catch(error => {
        console.error('[Receptions] Failed to reload orders:', error);
      });
    setShowReceptionModal(false);
    setSelectedOrder(null);
  };

  const handleViewHistory = async (order: PurchaseOrderWithSupplier) => {
    setSelectedOrder(order);
    // Charger réceptions ET annulations en parallèle
    const [history, cancellations] = await Promise.all([
      loadReceptionHistory(order.id),
      loadCancellationHistory(order.id),
    ]);
    setReceptionHistory(history ?? []);
    setCancellationHistory(cancellations ?? []);
    setShowHistoryModal(true);
  };

  // Handler pour succès réception affilié (appelé par le modal)
  const handleAffiliateReceptionSuccess = () => {
    // Recharger la liste et stats
    void loadAffiliateProductReceptions()
      .then(data => setAffiliateReceptions(data as AffiliateReceptionMapped[]))
      .catch(error => {
        console.error(
          '[Receptions] Failed to reload affiliate receptions:',
          error
        );
      });
    void loadReceptionStats()
      .then(setStats)
      .catch(error => {
        console.error('[Receptions] Failed to reload stats:', error);
      });
    setSelectedAffiliateReception(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Réceptions Marchandises
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion complète des réceptions fournisseurs
        </p>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  En attente
                </CardTitle>
                <Package className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total_pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">Commandes confirmées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Partielles
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-verone-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-warning">
                {stats.total_partial}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Réceptions incomplètes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Aujourd'hui
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-verone-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-success">
                {stats.total_completed_today}
              </div>
              <p className="text-xs text-gray-500 mt-1">Réceptions complètes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  En retard
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-verone-danger" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-danger">
                {stats.total_overdue}
              </div>
              <p className="text-xs text-gray-500 mt-1">Date dépassée</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Urgent
                </CardTitle>
                <Clock className="h-4 w-4 text-verone-warning" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-verone-warning">
                {stats.total_urgent}
              </div>
              <p className="text-xs text-gray-500 mt-1">Sous 3 jours</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs: À recevoir / Historique */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="to-receive">À recevoir</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* TAB 1: À RECEVOIR */}
        <TabsContent value="to-receive" className="space-y-4 mt-6">
          {/* Sélecteur Source: Toutes / Fournisseurs / Affiliés */}
          <div className="flex gap-2">
            <ButtonV2
              variant={sourceFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setSourceFilter('all')}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              Toutes
            </ButtonV2>
            <ButtonV2
              variant={sourceFilter === 'suppliers' ? 'default' : 'outline'}
              onClick={() => setSourceFilter('suppliers')}
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Commandes
            </ButtonV2>
            <ButtonV2
              variant={sourceFilter === 'affiliates' ? 'default' : 'outline'}
              onClick={() => setSourceFilter('affiliates')}
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Affilies
              {affiliateReceptions.length > 0 && (
                <Badge className="ml-1 bg-purple-500">
                  {affiliateReceptions.length}
                </Badge>
              )}
            </ButtonV2>
          </div>

          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={
                        sourceFilter === 'suppliers'
                          ? 'Rechercher par numéro de commande ou fournisseur...'
                          : 'Rechercher par produit ou affilié...'
                      }
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                {(sourceFilter === 'suppliers' || sourceFilter === 'all') && (
                  <>
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="validated">Validee</SelectItem>
                        <SelectItem value="partially_received">
                          Partielle
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={urgencyFilter}
                      onValueChange={setUrgencyFilter}
                    >
                      <SelectTrigger className="w-full lg:w-48">
                        <SelectValue placeholder="Urgence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="urgent">Urgent (&lt; 3j)</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Liste des commandes fournisseurs à recevoir */}
          {(sourceFilter === 'suppliers' || sourceFilter === 'all') && (
            <Card>
              <CardHeader>
                <CardTitle>Commandes fournisseurs à recevoir</CardTitle>
                <CardDescription>
                  {orders.length} commande(s) trouvée(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Chargement...</div>
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-600">
                    Erreur: {error}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Aucune commande à recevoir</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8" />
                          <TableHead>N° Commande</TableHead>
                          <TableHead>Fournisseur</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date livraison</TableHead>
                          <TableHead>Progression</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map(order => {
                          // Calculer progression
                          const totalItems =
                            order.purchase_order_items?.reduce(
                              (
                                sum: number,
                                item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                              ) => sum + item.quantity,
                              0
                            ) ?? 0;
                          const receivedItems =
                            order.purchase_order_items?.reduce(
                              (
                                sum: number,
                                item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                              ) => sum + (item.quantity_received ?? 0),
                              0
                            ) ?? 0;
                          const progressPercent =
                            totalItems > 0
                              ? Math.round((receivedItems / totalItems) * 100)
                              : 0;

                          // Urgence
                          const deliveryDate = order.expected_delivery_date
                            ? new Date(order.expected_delivery_date)
                            : null;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isOverdue =
                            deliveryDate && deliveryDate < today;
                          const daysUntil = deliveryDate
                            ? Math.ceil(
                                (deliveryDate.getTime() - today.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            : null;
                          const isUrgent =
                            daysUntil !== null &&
                            daysUntil <= 3 &&
                            daysUntil >= 0;

                          const isExpanded = expandedRows.has(order.id);

                          return (
                            <React.Fragment key={order.id}>
                              <TableRow
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleRowExpansion(order.id)}
                              >
                                <TableCell className="w-8">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-gray-500" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-gray-500" />
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {order.po_number}
                                  {isOverdue && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-2 text-xs"
                                    >
                                      En retard
                                    </Badge>
                                  )}
                                  {isUrgent && !isOverdue && (
                                    <Badge className="ml-2 text-xs bg-verone-warning">
                                      Urgent
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {order.supplier_name ?? 'Fournisseur inconnu'}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      order.status === 'validated'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-amber-500 text-white'
                                    }
                                  >
                                    {order.status === 'validated'
                                      ? 'Validée'
                                      : 'Partielle'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {order.expected_delivery_date
                                    ? formatDate(order.expected_delivery_date)
                                    : 'Non définie'}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-green-500 h-2 rounded-full transition-all"
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">
                                      {progressPercent}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <ButtonV2
                                    variant="outline"
                                    size="sm"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleOpenReception(order);
                                    }}
                                  >
                                    <Truck className="h-4 w-4 mr-2" />
                                    Recevoir
                                  </ButtonV2>
                                </TableCell>
                              </TableRow>
                              {/* Ligne expandable avec détails produits */}
                              {isExpanded && (
                                <TableRow key={`${order.id}-details`}>
                                  <TableCell
                                    colSpan={7}
                                    className="bg-gray-50 p-0"
                                  >
                                    <div className="p-4">
                                      <h4 className="font-medium text-sm mb-3 text-gray-700">
                                        Produits de la commande (
                                        {order.purchase_order_items?.length ||
                                          0}
                                        )
                                      </h4>
                                      <div className="space-y-2">
                                        {order.purchase_order_items?.map(
                                          (
                                            item: PurchaseOrderWithSupplier['purchase_order_items'][0],
                                            itemIndex: number
                                          ) => (
                                            <div
                                              key={
                                                item.id ||
                                                `item-${order.id}-${itemIndex}`
                                              }
                                              className="flex items-center gap-4 p-2 bg-white rounded-lg border"
                                            >
                                              <ProductThumbnail
                                                src={
                                                  /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- Fallback to first image if no primary found */
                                                  item.products?.product_images?.find(
                                                    (img: {
                                                      public_url: string;
                                                      is_primary: boolean;
                                                    }) => img.is_primary
                                                  )?.public_url ||
                                                  item.products
                                                    ?.product_images?.[0]
                                                    ?.public_url
                                                  /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
                                                }
                                                alt={
                                                  item.products?.name ||
                                                  'Produit'
                                                }
                                                size="sm"
                                              />
                                              <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm truncate">
                                                  {item.products?.name ||
                                                    'Produit inconnu'}
                                                </p>
                                                <p className="text-xs text-gray-500 font-mono">
                                                  SKU:{' '}
                                                  {item.products?.sku ?? 'N/A'}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-medium">
                                                  {item.quantity_received ?? 0}{' '}
                                                  / {item.quantity} reçu(s)
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Stock actuel:{' '}
                                                  {item.products?.stock_real ??
                                                    '-'}
                                                </p>
                                              </div>
                                              <div className="text-right">
                                                <p className="text-sm font-medium">
                                                  {formatCurrency(
                                                    (item.unit_price_ht ?? 0) *
                                                      item.quantity
                                                  )}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {formatCurrency(
                                                    item.unit_price_ht ?? 0
                                                  )}{' '}
                                                  /u
                                                </p>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
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
          )}

          {/* Liste des réceptions affiliés */}
          {(sourceFilter === 'affiliates' || sourceFilter === 'all') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Réceptions produits affiliés
                </CardTitle>
                <CardDescription>
                  {affiliateReceptions.length} réception(s) en attente
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-gray-500">Chargement...</div>
                  </div>
                ) : affiliateReceptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      Aucune réception affilié en attente
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produit</TableHead>
                          <TableHead>Affilié</TableHead>
                          <TableHead>Enseigne</TableHead>
                          <TableHead>Quantité attendue</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {affiliateReceptions.map(reception => (
                          <TableRow key={reception.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <ProductThumbnail
                                  src={reception.product_image_url}
                                  alt={reception.product_name}
                                  size="sm"
                                />
                                <div>
                                  <p className="font-medium">
                                    {reception.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500 font-mono">
                                    {reception.product_sku}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{reception.affiliate_name}</TableCell>
                            <TableCell>{reception.enseigne_name}</TableCell>
                            <TableCell className="font-medium">
                              {reception.quantity_expected} unité(s)
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  reception.status === 'pending'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-100 text-blue-800'
                                }
                              >
                                {reception.status === 'pending'
                                  ? 'En attente'
                                  : 'Partielle'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <ButtonV2
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedAffiliateReception(reception);
                                }}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Recevoir
                              </ButtonV2>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Modal réception affilié */}
          {selectedAffiliateReception && (
            <AffiliateReceptionModal
              reception={
                selectedAffiliateReception as unknown as AffiliateReception
              }
              open={!!selectedAffiliateReception}
              onClose={() => setSelectedAffiliateReception(null)}
              onSuccess={handleAffiliateReceptionSuccess}
            />
          )}
        </TabsContent>

        {/* TAB 2: HISTORIQUE */}
        <TabsContent value="history" className="space-y-4 mt-6">
          {/* Filtres Historique */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher par numéro de commande ou fournisseur..."
                      value={historySearchTerm}
                      onChange={e => setHistorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Historique des réceptions */}
          <Card>
            <CardHeader>
              <CardTitle>Historique réceptions</CardTitle>
              <CardDescription>
                {historyOrders.length} commande(s) reçue(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">
                  Erreur: {error}
                </div>
              ) : historyOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Aucune réception dans l'historique
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date réception</TableHead>
                        <TableHead>Quantité totale</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyOrders.map(order => {
                        // Calculer quantité totale commandée vs reçue
                        const totalOrdered =
                          order.purchase_order_items?.reduce(
                            (
                              sum: number,
                              item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                            ) => sum + item.quantity,
                            0
                          ) ?? 0;
                        const totalReceived =
                          order.purchase_order_items?.reduce(
                            (
                              sum: number,
                              item: PurchaseOrderWithSupplier['purchase_order_items'][0]
                            ) => sum + (item.quantity_received ?? 0),
                            0
                          ) ?? 0;
                        const isComplete = totalReceived >= totalOrdered;

                        const isExpanded = expandedHistoryRows.has(order.id);

                        return (
                          <React.Fragment key={order.id}>
                            <TableRow
                              className="cursor-pointer hover:bg-gray-50"
                              onClick={() =>
                                toggleHistoryRowExpansion(order.id)
                              }
                            >
                              <TableCell className="w-8">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                              </TableCell>
                              <TableCell className="font-medium">
                                {order.po_number}
                              </TableCell>
                              <TableCell>
                                {order.supplier_name ?? 'Fournisseur inconnu'}
                              </TableCell>
                              <TableCell>
                                {isComplete ? (
                                  <Badge className="bg-green-500 text-white">
                                    Reçue complète
                                  </Badge>
                                ) : (
                                  <Badge className="bg-amber-500 text-white">
                                    Reçue et clôturée ({totalReceived}/
                                    {totalOrdered})
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {order.received_at
                                  ? formatDate(order.received_at)
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {totalReceived}/{totalOrdered} unité(s)
                              </TableCell>
                              <TableCell>
                                <ButtonV2
                                  variant="outline"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    void handleViewHistory(order).catch(
                                      error => {
                                        console.error(
                                          '[Receptions] Failed to view history:',
                                          error
                                        );
                                      }
                                    );
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Voir détails
                                </ButtonV2>
                              </TableCell>
                            </TableRow>
                            {/* Ligne expandable avec détails produits */}
                            {isExpanded && (
                              <TableRow key={`${order.id}-details`}>
                                <TableCell
                                  colSpan={7}
                                  className="bg-gray-50 p-0"
                                >
                                  <div className="p-4">
                                    <h4 className="font-medium text-sm mb-3 text-gray-700">
                                      Produits de la commande (
                                      {order.purchase_order_items?.length ?? 0})
                                    </h4>
                                    <div className="space-y-2">
                                      {order.purchase_order_items?.map(
                                        (
                                          item: PurchaseOrderWithSupplier['purchase_order_items'][0],
                                          itemIndex: number
                                        ) => (
                                          <div
                                            key={
                                              item.id ||
                                              `item-${order.id}-${itemIndex}`
                                            }
                                            className="flex items-center gap-4 p-2 bg-white rounded-lg border"
                                          >
                                            <ProductThumbnail
                                              src={
                                                item.products?.product_images?.find(
                                                  (img: {
                                                    public_url: string;
                                                    is_primary: boolean;
                                                  }) => img.is_primary
                                                )?.public_url ??
                                                item.products
                                                  ?.product_images?.[0]
                                                  ?.public_url
                                              }
                                              alt={
                                                item.products?.name ?? 'Produit'
                                              }
                                              size="sm"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm truncate">
                                                {item.products?.name ||
                                                  'Produit inconnu'}
                                              </p>
                                              <p className="text-xs text-gray-500 font-mono">
                                                SKU:{' '}
                                                {item.products?.sku ?? 'N/A'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {item.quantity_received ?? 0} /{' '}
                                                {item.quantity} reçu(s)
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Stock actuel:{' '}
                                                {item.products?.stock_real ??
                                                  '-'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {formatCurrency(
                                                  (item.unit_price_ht ?? 0) *
                                                    item.quantity
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {formatCurrency(
                                                  item.unit_price_ht ?? 0
                                                )}{' '}
                                                /u
                                              </p>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
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

          {/* Historique réceptions affiliés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Historique réceptions affiliés
              </CardTitle>
              <CardDescription>
                {affiliateHistory.length} réception(s) complétée(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="text-gray-500">Chargement...</div>
                </div>
              ) : affiliateHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">
                    Aucune réception affilié dans l'historique
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Affilié</TableHead>
                        <TableHead>Enseigne</TableHead>
                        <TableHead>Quantité reçue</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date réception</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateHistory.map(reception => (
                        <TableRow key={reception.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <ProductThumbnail
                                src={reception.product_image_url}
                                alt={reception.product_name}
                                size="sm"
                              />
                              <div>
                                <p className="font-medium">
                                  {reception.product_name}
                                </p>
                                <p className="text-xs text-gray-500 font-mono">
                                  {reception.product_sku}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{reception.affiliate_name}</TableCell>
                          <TableCell>{reception.enseigne_name}</TableCell>
                          <TableCell className="font-medium">
                            {reception.quantity_received ?? 0} /{' '}
                            {reception.quantity_expected} unité(s)
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                reception.status === 'completed'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-500 text-white'
                              }
                            >
                              {reception.status === 'completed'
                                ? 'Complétée'
                                : 'Annulée'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {reception.received_at
                              ? formatDate(reception.received_at)
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de réception */}
      {selectedOrder && showReceptionModal && (
        <PurchaseOrderReceptionModal
          order={selectedOrder as unknown as PurchaseOrder}
          open={showReceptionModal}
          onClose={() => {
            setShowReceptionModal(false);
            setSelectedOrder(null);
          }}
          onSuccess={handleReceptionSuccess}
        />
      )}

      {/* Modal détails historique */}
      {selectedOrder && showHistoryModal && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Détails réception - {selectedOrder.po_number}
                </CardTitle>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedOrder(null);
                    setReceptionHistory([]);
                    setCancellationHistory([]);
                  }}
                >
                  ✕
                </ButtonV2>
              </div>
              <CardDescription>
                Fournisseur: {selectedOrder.supplier_name ?? 'Non renseigné'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receptionHistory.length === 0 &&
              cancellationHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun détail de réception disponible
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SECTION RÉCEPTIONS */}
                  {receptionHistory.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Réceptions ({receptionHistory.length})
                      </h3>
                      {receptionHistory.map(
                        (reception: ReceptionHistory, index: number) => (
                          <Card
                            key={index}
                            className="border-l-4 border-verone-success"
                          >
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-lg">
                                    Réception #{index + 1}
                                  </CardTitle>
                                  <CardDescription>
                                    {reception.received_at
                                      ? `Reçue le ${formatDate(reception.received_at)}`
                                      : 'Date non disponible'}
                                  </CardDescription>
                                </div>
                                {reception.received_by_name && (
                                  <Badge variant="outline">
                                    Par: {reception.received_by_name}
                                  </Badge>
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              {/* Notes réception */}
                              {reception.notes && (
                                <div className="mb-4 p-3 bg-gray-50 rounded">
                                  <p className="text-sm font-medium text-gray-700">
                                    Notes:
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {reception.notes}
                                  </p>
                                </div>
                              )}

                              {/* Liste articles reçus */}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-[50px]" />
                                    <TableHead>Produit</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">
                                      Quantité reçue
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Stock avant
                                    </TableHead>
                                    <TableHead className="text-right">
                                      Stock après
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {reception.items?.map(
                                    (
                                      item: ReceptionHistory['items'][0],
                                      idx: number
                                    ) => (
                                      <TableRow key={idx}>
                                        <TableCell className="w-[50px] p-1">
                                          <ProductThumbnail
                                            src={item.product_image_url}
                                            alt={item.product_name}
                                            size="xs"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          {item.product_name}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                          {item.product_sku}
                                        </TableCell>
                                        <TableCell className="text-right font-medium text-green-600">
                                          +{item.quantity_received}
                                        </TableCell>
                                        <TableCell className="text-right text-gray-600">
                                          {item.stock_before}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                          {item.stock_after}
                                        </TableCell>
                                      </TableRow>
                                    )
                                  )}
                                </TableBody>
                              </Table>

                              {/* Résumé */}
                              <div className="mt-4 pt-4 border-t">
                                <p className="text-sm font-medium text-gray-700">
                                  Total reçu:{' '}
                                  <span className="text-verone-success font-bold">
                                    {reception.total_quantity} unités
                                  </span>
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      )}
                    </>
                  )}

                  {/* SECTION ANNULATIONS */}
                  {cancellationHistory.length > 0 && (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mt-6">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Annulations ({cancellationHistory.length} produit
                        {cancellationHistory.length > 1 ? 's' : ''})
                      </h3>
                      <Card className="border-l-4 border-amber-500">
                        <CardHeader>
                          <CardTitle className="text-lg text-amber-700">
                            Reliquat annulé
                          </CardTitle>
                          <CardDescription>
                            {cancellationHistory[0]?.performed_at
                              ? `Annulé le ${formatDate(cancellationHistory[0].performed_at)}`
                              : 'Date non disponible'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Notes annulation (si présentes) */}
                          {cancellationHistory[0]?.notes && (
                            <div className="mb-4 p-3 bg-amber-50 rounded border border-amber-200">
                              <p className="text-sm font-medium text-amber-800">
                                Raison:
                              </p>
                              <p className="text-sm text-amber-700">
                                {cancellationHistory[0].notes}
                              </p>
                            </div>
                          )}

                          {/* Liste produits annulés */}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">
                                  Quantité annulée
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cancellationHistory.map(
                                (
                                  cancellation: CancellationHistoryItem,
                                  idx: number
                                ) => (
                                  <TableRow key={idx}>
                                    <TableCell>
                                      {cancellation.product_name}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {cancellation.product_sku}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-amber-600">
                                      -{cancellation.quantity_cancelled}
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>

                          {/* Résumé annulations */}
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-sm font-medium text-gray-700">
                              Total annulé:{' '}
                              <span className="text-amber-600 font-bold">
                                {cancellationHistory.reduce(
                                  (sum: number, c: CancellationHistoryItem) =>
                                    sum + c.quantity_cancelled,
                                  0
                                )}{' '}
                                unités
                              </span>
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
