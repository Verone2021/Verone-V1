'use client';

/**
 * 📦 Page Expéditions Clients (Commandes)
 *
 * Vue d'ensemble et gestion des expéditions
 * - Dashboard stats (pending, partial, overdue, urgent)
 * - Tabs: À expédier / Historique (Best practices Odoo/ERPNext)
 * - Liste commandes confirmées/partiellement expédiées
 * - Historique commandes expédiées/livrées
 * - Filtres intelligents (urgent, en retard, statut)
 * - Support expéditions partielles
 *
 * NOTE: Le modal d'expédition sera recréé ultérieurement (simple sortie stock)
 *
 * @since Phase 3.7 - Unification expéditions (2025-11-04)
 * @updated 2025-11-28 - Suppression modal PackLink (sera recréé)
 */

import React, { useState, useEffect } from 'react';

import type { Database } from '@verone/types';

import { useSalesShipments, SalesOrderShipmentModal } from '@verone/orders';
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
} from 'lucide-react';

// Types locaux pour structures avec relations
type ProductRow = Database['public']['Tables']['products']['Row'];
type ProductImage = Database['public']['Tables']['product_images']['Row'];
type SalesOrderItemRow =
  Database['public']['Tables']['sales_order_items']['Row'];
type SalesOrderRow = Database['public']['Tables']['sales_orders']['Row'];

interface ProductWithImages extends Partial<ProductRow> {
  product_images?: ProductImage[];
}

interface SalesOrderItem extends SalesOrderItemRow {
  products?: ProductWithImages;
}

interface SalesOrder extends SalesOrderRow {
  sales_order_items?: SalesOrderItem[];
  customer_name?: string;
}

interface ShipmentStats {
  total_pending: number;
  total_partial: number;
  total_completed_today: number;
  total_overdue: number;
  total_urgent: number;
}

interface ShipmentHistoryItem {
  shipped_at?: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier_name?: string;
  service_name?: string;
  cost_paid_eur?: number;
  cost_charged_eur?: number;
  items?: Array<{
    product_name: string;
    product_sku: string;
    quantity_shipped: number;
  }>;
}

export default function ExpeditionsPage() {
  const {
    loading,
    error,
    loadShipmentStats,
    loadSalesOrdersReadyForShipment,
    loadShipmentHistory,
    loadShippedOrdersHistory,
  } = useSalesShipments();

  const [stats, setStats] = useState<ShipmentStats | null>(null);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [historyOrders, setHistoryOrders] = useState<SalesOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [shipmentHistory, setShipmentHistory] = useState<ShipmentHistoryItem[]>(
    []
  );
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [orderToShip, setOrderToShip] = useState<SalesOrder | null>(null);

  // État pour les lignes expandées (affichage détails produits)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [expandedHistoryRows, setExpandedHistoryRows] = useState<Set<string>>(
    new Set()
  );

  const [activeTab, setActiveTab] = useState<string>('to-ship');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');

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
    void loadShipmentStats()
      .then(setStats)
      .catch(error => {
        console.error('[ExpeditionsPage] Load stats failed:', error);
      });
  }, [loadShipmentStats]);

  // Charger liste commandes à expédier
  useEffect(() => {
    if (activeTab === 'to-ship') {
      const filters: {
        status?: string;
        search?: string;
        urgent_only?: boolean;
        overdue_only?: boolean;
      } = {};

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

      void loadSalesOrdersReadyForShipment(filters)
        .then(setOrders)
        .catch(error => {
          console.error('[ExpeditionsPage] Load ready orders failed:', error);
        });
    }
  }, [
    loadSalesOrdersReadyForShipment,
    statusFilter,
    searchTerm,
    urgencyFilter,
    activeTab,
  ]);

  // Charger historique commandes expédiées
  // ✅ FIX 2025-11-28: Utiliser loadShippedOrdersHistory avec filtrage .in() pour éviter erreur enum
  useEffect(() => {
    if (activeTab === 'history') {
      const filters: {
        status?: string;
        search?: string;
      } = {};

      // ✅ Status filter: 'all' = ['shipped', 'delivered'], sinon single status
      if (historyStatusFilter !== 'all') {
        filters.status = historyStatusFilter;
      }

      if (historySearchTerm) {
        filters.search = historySearchTerm;
      }

      // ✅ Utiliser la bonne fonction qui gère le filtrage par array de statuts
      void loadShippedOrdersHistory(filters)
        .then(setHistoryOrders)
        .catch(error => {
          console.error('[ExpeditionsPage] Load history failed:', error);
        });
    }
  }, [
    loadShippedOrdersHistory,
    historyStatusFilter,
    historySearchTerm,
    activeTab,
  ]);

  // Handler pour ouvrir le modal d'expédition
  const handleOpenShipmentModal = (order: SalesOrder) => {
    setOrderToShip(order);
    setShowShipmentModal(true);
  };

  // Handler pour fermeture + refresh après succès
  const handleShipmentSuccess = () => {
    setShowShipmentModal(false);
    setOrderToShip(null);
    // Recharger stats et commandes
    void loadShipmentStats()
      .then(setStats)
      .catch(error => {
        console.error('[ExpeditionsPage] Reload stats failed:', error);
      });
    void loadSalesOrdersReadyForShipment({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm ?? undefined,
    })
      .then(setOrders)
      .catch(error => {
        console.error('[ExpeditionsPage] Reload orders failed:', error);
      });
  };

  const handleViewHistory = async (order: SalesOrder) => {
    setSelectedOrder(order);
    const history = await loadShipmentHistory(order.id);
    setShipmentHistory(history ?? []);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Expéditions Clients
        </h1>
        <p className="text-gray-600 mt-1">
          Gestion complète des expéditions commandes clients
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
                Expéditions incomplètes
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
              <p className="text-xs text-gray-500 mt-1">
                Expéditions complètes
              </p>
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

      {/* Tabs: À expédier / Historique */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="to-ship">À expédier</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>

        {/* TAB 1: À EXPÉDIER */}
        <TabsContent value="to-ship" className="space-y-4 mt-6">
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
                      placeholder="Rechercher par numéro de commande ou client..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="validated">Validée</SelectItem>
                    <SelectItem value="partially_shipped">Partielle</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Urgence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent (&lt; 3j)</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des commandes à expédier */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes à expédier</CardTitle>
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
                  <p className="text-gray-500">Aucune commande à expédier</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date livraison</TableHead>
                        <TableHead>Progression</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order: SalesOrder) => {
                        // Calculer progression
                        const totalItems =
                          order.sales_order_items?.reduce(
                            (sum: number, item: SalesOrderItem) =>
                              sum + item.quantity,
                            0
                          ) ?? 0;
                        const shippedItems =
                          order.sales_order_items?.reduce(
                            (sum: number, item: SalesOrderItem) =>
                              sum + (item.quantity_shipped ?? 0),
                            0
                          ) ?? 0;
                        const progressPercent =
                          totalItems > 0
                            ? Math.round((shippedItems / totalItems) * 100)
                            : 0;

                        // Urgence
                        const deliveryDate = order.expected_delivery_date
                          ? new Date(order.expected_delivery_date)
                          : null;
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isOverdue = deliveryDate && deliveryDate < today;
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
                                {order.order_number}
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
                                {order.customer_name ?? 'Client inconnu'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    order.status === 'validated'
                                      ? 'bg-gray-100 text-gray-900'
                                      : 'bg-verone-warning text-white'
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
                                      className="bg-verone-success h-2 rounded-full transition-all"
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
                                    handleOpenShipmentModal(order);
                                  }}
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Expédier
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
                                      {order.sales_order_items?.length ?? 0})
                                    </h4>
                                    <div className="space-y-2">
                                      {order.sales_order_items?.map(
                                        (item: SalesOrderItem) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-2 bg-white rounded-lg border"
                                          >
                                            <ProductThumbnail
                                              src={
                                                item.products?.product_images?.find(
                                                  (img: ProductImage) =>
                                                    img.is_primary
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
                                                {item.products?.name ??
                                                  'Produit inconnu'}
                                              </p>
                                              <p className="text-xs text-gray-500 font-mono">
                                                SKU:{' '}
                                                {item.products?.sku ?? 'N/A'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {item.quantity_shipped ?? 0} /{' '}
                                                {item.quantity} expédié(s)
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Stock:{' '}
                                                {item.products?.stock_real ??
                                                  '-'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {formatCurrency(
                                                  item.unit_price_ht *
                                                    item.quantity
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {formatCurrency(
                                                  item.unit_price_ht
                                                )}{' '}
                                                HT/u
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
                      placeholder="Rechercher par numéro de commande ou client..."
                      value={historySearchTerm}
                      onChange={e => setHistorySearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select
                  value={historyStatusFilter}
                  onValueChange={setHistoryStatusFilter}
                >
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes expédiées</SelectItem>
                    <SelectItem value="shipped">Expédiée</SelectItem>
                    <SelectItem value="delivered">Livrée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Historique des expéditions */}
          <Card>
            <CardHeader>
              <CardTitle>Historique expéditions</CardTitle>
              <CardDescription>
                {historyOrders.length} commande(s) expédiée(s)
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
                    Aucune expédition dans l'historique
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8" />
                        <TableHead>N° Commande</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date expédition</TableHead>
                        <TableHead>Date livraison</TableHead>
                        <TableHead>Quantité totale</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyOrders.map((order: SalesOrder) => {
                        // Calculer quantité totale
                        const totalItems =
                          order.sales_order_items?.reduce(
                            (sum: number, item: SalesOrderItem) =>
                              sum + item.quantity,
                            0
                          ) ?? 0;

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
                                {order.order_number}
                              </TableCell>
                              <TableCell>
                                {order.customer_name ?? 'Client inconnu'}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    order.status === 'shipped'
                                      ? 'bg-verone-success text-white'
                                      : 'bg-blue-500 text-white'
                                  }
                                >
                                  {order.status === 'shipped'
                                    ? 'Expédiée'
                                    : 'Livrée'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {order.shipped_at
                                  ? formatDate(order.shipped_at)
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                {order.delivered_at
                                  ? formatDate(order.delivered_at)
                                  : '-'}
                              </TableCell>
                              <TableCell>{totalItems} unité(s)</TableCell>
                              <TableCell>
                                <ButtonV2
                                  variant="outline"
                                  size="sm"
                                  onClick={e => {
                                    e.stopPropagation();
                                    void handleViewHistory(order).catch(
                                      error => {
                                        console.error(
                                          '[ExpeditionsPage] View history failed:',
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
                                  colSpan={8}
                                  className="bg-gray-50 p-0"
                                >
                                  <div className="p-4">
                                    <h4 className="font-medium text-sm mb-3 text-gray-700">
                                      Produits de la commande (
                                      {order.sales_order_items?.length ?? 0})
                                    </h4>
                                    <div className="space-y-2">
                                      {order.sales_order_items?.map(
                                        (item: SalesOrderItem) => (
                                          <div
                                            key={item.id}
                                            className="flex items-center gap-4 p-2 bg-white rounded-lg border"
                                          >
                                            <ProductThumbnail
                                              src={
                                                item.products?.product_images?.find(
                                                  (img: ProductImage) =>
                                                    img.is_primary
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
                                                {item.products?.name ??
                                                  'Produit inconnu'}
                                              </p>
                                              <p className="text-xs text-gray-500 font-mono">
                                                SKU:{' '}
                                                {item.products?.sku ?? 'N/A'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {item.quantity_shipped ?? 0} /{' '}
                                                {item.quantity} expédié(s)
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                Stock:{' '}
                                                {item.products?.stock_real ??
                                                  '-'}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="text-sm font-medium">
                                                {formatCurrency(
                                                  item.unit_price_ht *
                                                    item.quantity
                                                )}
                                              </p>
                                              <p className="text-xs text-gray-500">
                                                {formatCurrency(
                                                  item.unit_price_ht
                                                )}{' '}
                                                HT/u
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
        </TabsContent>
      </Tabs>

      {/* Modal d'expédition */}
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

      {/* Modal détails historique */}
      {selectedOrder && showHistoryModal && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Détails expédition - {selectedOrder.order_number}
                </CardTitle>
                <ButtonV2
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowHistoryModal(false);
                    setSelectedOrder(null);
                    setShipmentHistory([]);
                  }}
                >
                  ✕
                </ButtonV2>
              </div>
              <CardDescription>
                Client: {selectedOrder.customer_name ?? 'Non renseigné'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {shipmentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun détail d'expédition disponible
                </div>
              ) : (
                <div className="space-y-6">
                  {shipmentHistory.map(
                    (shipment: ShipmentHistoryItem, index: number) => (
                      <Card
                        key={index}
                        className="border-l-4 border-verone-success"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">
                                Expédition #{index + 1}
                              </CardTitle>
                              <CardDescription>
                                {shipment.shipped_at
                                  ? `Expédiée le ${formatDate(shipment.shipped_at)}`
                                  : 'Date non disponible'}
                              </CardDescription>
                            </div>
                            {shipment.tracking_number && (
                              <Badge variant="outline">
                                Suivi: {shipment.tracking_number}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Infos transporteur */}
                          {shipment.carrier_name && (
                            <div className="mb-4 p-3 bg-gray-50 rounded">
                              <p className="text-sm font-medium text-gray-700">
                                Transporteur: {shipment.carrier_name}
                              </p>
                              {shipment.service_name && (
                                <p className="text-sm text-gray-600">
                                  Service: {shipment.service_name}
                                </p>
                              )}
                              {shipment.tracking_url && (
                                <a
                                  href={shipment.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-verone-primary hover:underline"
                                >
                                  Suivre le colis →
                                </a>
                              )}
                            </div>
                          )}

                          {/* Liste articles expédiés */}
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead className="text-right">
                                  Quantité
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {shipment.items?.map((item, idx: number) => (
                                <TableRow key={idx}>
                                  <TableCell>{item.product_name}</TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {item.product_sku}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.quantity_shipped}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          {/* Coûts */}
                          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
                          {(shipment.cost_paid_eur ||
                            shipment.cost_charged_eur) && (
                            <div className="mt-4 pt-4 border-t space-y-1">
                              {shipment.cost_paid_eur && (
                                <p className="text-sm text-gray-600">
                                  Coût réel:{' '}
                                  {formatCurrency(shipment.cost_paid_eur)}
                                </p>
                              )}
                              {shipment.cost_charged_eur && (
                                <p className="text-sm text-gray-600">
                                  Coût facturé:{' '}
                                  {formatCurrency(shipment.cost_charged_eur)}
                                </p>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
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
