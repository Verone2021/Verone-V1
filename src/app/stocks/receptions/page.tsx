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

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { ButtonV2 } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePurchaseReceptions } from '@/shared/modules/orders/hooks';
import { PurchaseOrderReceptionModal } from '@/components/business/purchase-order-reception-modal';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReceptionsPage() {
  const {
    loading,
    error,
    loadReceptionStats,
    loadPurchaseOrdersReadyForReception,
    loadReceptionHistory,
  } = usePurchaseReceptions();

  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [receptionHistory, setReceptionHistory] = useState<any[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [activeTab, setActiveTab] = useState<string>('to-receive');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');

  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Charger stats
  useEffect(() => {
    loadReceptionStats().then(setStats);
  }, [loadReceptionStats]);

  // Charger liste POs à recevoir
  useEffect(() => {
    if (activeTab === 'to-receive') {
      const filters: any = {};

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

      loadPurchaseOrdersReadyForReception(filters).then(setOrders);
    }
  }, [
    loadPurchaseOrdersReadyForReception,
    statusFilter,
    searchTerm,
    urgencyFilter,
    activeTab,
  ]);

  // Charger historique POs reçus
  useEffect(() => {
    if (activeTab === 'history') {
      const filters: any = {
        status: 'received', // Uniquement les POs complètement reçus
      };

      if (historySearchTerm) {
        filters.search = historySearchTerm;
      }

      loadPurchaseOrdersReadyForReception(filters).then(setHistoryOrders);
    }
  }, [loadPurchaseOrdersReadyForReception, historySearchTerm, activeTab]);

  const handleOpenReception = (order: any) => {
    setSelectedOrder(order);
    setShowReceptionModal(true);
  };

  const handleReceptionSuccess = () => {
    // Recharger stats et liste
    loadReceptionStats().then(setStats);
    loadPurchaseOrdersReadyForReception().then(setOrders);
    setShowReceptionModal(false);
    setSelectedOrder(null);
  };

  const handleViewHistory = async (order: any) => {
    setSelectedOrder(order);
    const history = await loadReceptionHistory(order.id);
    setReceptionHistory(history || []);
    setShowHistoryModal(true);
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
                      placeholder="Rechercher par numéro de commande ou fournisseur..."
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
                    <SelectItem value="confirmed">Confirmée</SelectItem>
                    <SelectItem value="partially_received">
                      Partielle
                    </SelectItem>
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

          {/* Liste des commandes à recevoir */}
          <Card>
            <CardHeader>
              <CardTitle>Commandes à recevoir</CardTitle>
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
                            (sum: number, item: any) => sum + item.quantity,
                            0
                          ) || 0;
                        const receivedItems =
                          order.purchase_order_items?.reduce(
                            (sum: number, item: any) =>
                              sum + (item.quantity_received || 0),
                            0
                          ) || 0;
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

                        return (
                          <TableRow key={order.id}>
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
                              {order.supplier_name || 'Fournisseur inconnu'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.status === 'confirmed'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'bg-verone-warning text-white'
                                }
                              >
                                {order.status === 'confirmed'
                                  ? 'Confirmée'
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
                                onClick={() => handleOpenReception(order)}
                              >
                                <Truck className="h-4 w-4 mr-2" />
                                Recevoir
                              </ButtonV2>
                            </TableCell>
                          </TableRow>
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
                        // Calculer quantité totale
                        const totalItems =
                          order.purchase_order_items?.reduce(
                            (sum: number, item: any) => sum + item.quantity,
                            0
                          ) || 0;

                        return (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">
                              {order.po_number}
                            </TableCell>
                            <TableCell>
                              {order.supplier_name || 'Fournisseur inconnu'}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-verone-success text-white">
                                Reçue
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {order.received_at
                                ? formatDate(order.received_at)
                                : '-'}
                            </TableCell>
                            <TableCell>{totalItems} unité(s)</TableCell>
                            <TableCell>
                              <ButtonV2
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewHistory(order)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Voir détails
                              </ButtonV2>
                            </TableCell>
                          </TableRow>
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

      {/* Modal de réception */}
      {selectedOrder && showReceptionModal && (
        <PurchaseOrderReceptionModal
          order={selectedOrder}
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
                  }}
                >
                  ✕
                </ButtonV2>
              </div>
              <CardDescription>
                Fournisseur: {selectedOrder.supplier_name || 'Non renseigné'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receptionHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Aucun détail de réception disponible
                </div>
              ) : (
                <div className="space-y-6">
                  {receptionHistory.map((reception: any, index: number) => (
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
                          {reception.received_by && (
                            <Badge variant="outline">
                              Par: {reception.received_by}
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
                            {reception.items?.map((item: any, idx: number) => (
                              <TableRow key={idx}>
                                <TableCell>{item.product_name}</TableCell>
                                <TableCell className="font-mono text-sm">
                                  {item.product_sku}
                                </TableCell>
                                <TableCell className="text-right font-medium text-verone-success">
                                  +{item.quantity_received}
                                </TableCell>
                                <TableCell className="text-right text-gray-600">
                                  {item.stock_before}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {item.stock_after}
                                </TableCell>
                              </TableRow>
                            ))}
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
                  ))}
                </div>
              )}
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
