'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useToast } from '@verone/common';
import type { SalesOrder, SalesOrderStatus } from '@verone/orders';
import { SalesOrderFormModal } from '@verone/orders';
import { OrderDetailModal } from '@verone/orders';
import { SalesOrderShipmentModal } from '@verone/orders';
import { useSalesOrders } from '@verone/orders';
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@verone/ui';
import { cn, formatCurrency, formatDate } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  RotateCcw,
  Ban,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  FileSpreadsheet,
  Truck,
  ChevronDown,
} from 'lucide-react';

import { updateSalesOrderStatus } from '@/app/actions/sales-orders';

const statusLabels: Record<SalesOrderStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const statusColors: Record<SalesOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-blue-100 text-blue-800', // 🔵 En attente expédition
  partially_shipped: 'bg-amber-100 text-amber-800', // 🟠 Partiel
  shipped: 'bg-cyan-100 text-cyan-800', // 🔷 En transit
  delivered: 'bg-green-100 text-green-800', // 🟢 Complet
  cancelled: 'bg-red-100 text-red-800',
};

type SortColumn = 'date' | 'client' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

export default function SalesOrdersPage() {
  const {
    loading,
    orders,
    stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
  } = useSalesOrders();

  const { toast } = useToast();
  const searchParams = useSearchParams();

  // États filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<SalesOrderStatus | 'all'>('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState<
    'all' | 'professional' | 'individual'
  >('all');
  const [periodFilter, setPeriodFilter] = useState<
    'all' | 'month' | 'quarter' | 'year'
  >('all');

  // États tri
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // États modals
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [showValidateConfirmation, setShowValidateConfirmation] =
    useState(false);
  const [orderToValidate, setOrderToValidate] = useState<string | null>(null);

  // État pour les lignes expandées (chevron)
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

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [fetchOrders, fetchStats]);

  // Ouvrir automatiquement le modal si query param ?id= présent (venant des notifications)
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

  // Filtrage des commandes
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      // Filtre onglet statut
      if (activeTab !== 'all' && order.status !== activeTab) {
        return false;
      }

      // Filtre type client
      if (customerTypeFilter !== 'all') {
        if (
          customerTypeFilter === 'professional' &&
          order.customer_type !== 'organization'
        ) {
          return false;
        }
        if (
          customerTypeFilter === 'individual' &&
          order.customer_type !== 'individual'
        ) {
          return false;
        }
      }

      // Filtre période
      if (periodFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();

        switch (periodFilter) {
          case 'month':
            const monthAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate()
            );
            if (orderDate < monthAgo) return false;
            break;
          case 'quarter':
            const quarterAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate()
            );
            if (orderDate < quarterAgo) return false;
            break;
          case 'year':
            const yearAgo = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate()
            );
            if (orderDate < yearAgo) return false;
            break;
        }
      }

      // Filtre recherche (case-insensitive + accents + whitespace)
      if (searchTerm) {
        // Fonction defensive: gère NULL, accents Unicode, whitespace
        const normalizeString = (str: string | null | undefined): string => {
          if (!str) return '';
          return str
            .trim()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Supprime diacritiques
        };

        const term = normalizeString(searchTerm);
        const matchesOrderNumber = normalizeString(order.order_number).includes(
          term
        );
        const matchesOrgName = normalizeString(
          order.organisations?.trade_name ||
            order.organisations?.legal_name ||
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

      return true;
    });

    // Tri des commandes
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison =
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime();
            break;
          case 'client':
            const nameA =
              a.customer_type === 'organization'
                ? a.organisations?.trade_name ||
                  a.organisations?.legal_name ||
                  ''
                : `${a.individual_customers?.first_name} ${a.individual_customers?.last_name}`;
            const nameB =
              b.customer_type === 'organization'
                ? b.organisations?.trade_name ||
                  b.organisations?.legal_name ||
                  ''
                : `${b.individual_customers?.first_name} ${b.individual_customers?.last_name}`;
            comparison = nameA.localeCompare(nameB);
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
    customerTypeFilter,
    periodFilter,
    searchTerm,
    sortColumn,
    sortDirection,
  ]);

  // KPI dynamiques calculés sur commandes filtrées
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

    const stats = filteredOrders.reduce(
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

    stats.total_tva = stats.total_ttc - stats.total_ht;
    stats.average_basket =
      stats.total_orders > 0 ? stats.total_ttc / stats.total_orders : 0;

    return stats;
  }, [filteredOrders]);

  // Compteurs par onglet (sur toutes les commandes, pas filtrées)
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
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
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
  };

  // Handlers actions
  const handleStatusChange = async (
    orderId: string,
    newStatus: SalesOrderStatus
  ) => {
    // Si validation (draft → confirmed), afficher modal de confirmation
    if (newStatus === 'validated') {
      setOrderToValidate(orderId);
      setShowValidateConfirmation(true);
      return;
    }

    // Sinon, exécuter directement (dévalidation, annulation, etc.)
    try {
      await updateStatus(orderId, newStatus);
      toast({
        title: 'Succès',
        description: `Commande ${newStatus === 'draft' ? 'dévalidée' : 'mise à jour'} avec succès`,
      });
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
    }
  };

  const handleValidateConfirmed = async () => {
    if (!orderToValidate) return;

    try {
      // ✅ FIX: Appeler DIRECTEMENT la Server Action (pas via le hook car import impossible depuis monorepo)
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const result = await updateSalesOrderStatus(
        orderToValidate,
        'validated',
        user.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la validation');
      }

      toast({
        title: 'Succès',
        description: 'Commande validée avec succès',
      });

      setShowValidateConfirmation(false);
      setOrderToValidate(null);

      // Rafraîchir la liste des commandes
      await fetchOrders();
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
        // ✅ FIX: Appeler DIRECTEMENT la Server Action (pas via le hook car import impossible depuis monorepo)
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user?.id) {
          throw new Error('Utilisateur non authentifié');
        }

        const result = await updateSalesOrderStatus(
          orderId,
          'cancelled',
          user.id
        );

        if (!result.success) {
          throw new Error(result.error || "Erreur lors de l'annulation");
        }

        // Libérer les réservations de stock
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
          title: 'Succès',
          description: 'Commande annulée avec succès',
        });

        // Rafraîchir la liste des commandes
        await fetchOrders();
        await fetchStats();
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

  const handlePrintPDF = async (order: SalesOrder) => {
    try {
      toast({
        title: 'Génération PDF...',
        description: `Préparation de la commande ${order.order_number}`,
      });

      // Appel API pour générer le PDF
      const response = await fetch(`/api/sales-orders/${order.id}/pdf`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      // Récupérer le blob PDF
      const blob = await response.blob();

      // Créer URL temporaire et déclencher téléchargement
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `commande-${order.order_number}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF généré avec succès',
        description: 'Le téléchargement a démarré',
        variant: 'default',
      });
    } catch (error) {
      console.error('Erreur génération PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive',
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      toast({
        title: 'Export en cours...',
        description: 'Génération du fichier Excel',
      });

      const response = await fetch('/api/sales-orders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activeTab,
          customerTypeFilter,
          periodFilter,
          searchTerm,
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      // Télécharger le fichier
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commandes-clients-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: 'Le fichier Excel a été téléchargé',
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
    setSelectedOrder(order);
    setShowShipmentModal(true);
  };

  const handleShipmentSuccess = () => {
    fetchOrders();
    fetchStats();
    setShowShipmentModal(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6 p-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Commandes Clients
          </h1>
          <p className="text-gray-600 mt-1">
            Gestion des commandes et expéditions clients
          </p>
        </div>
        <div className="flex gap-2">
          <ButtonUnified
            onClick={handleExportExcel}
            variant="outline"
            icon={FileSpreadsheet}
          >
            Exporter Excel
          </ButtonUnified>
          <SalesOrderFormModal
            onSuccess={() => {
              fetchOrders();
              fetchStats();
            }}
          />
        </div>
      </div>

      {/* Statistiques KPI (5 cartes - dynamiques filtrées) */}
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
            <p className="text-xs text-gray-500 mt-1">draft + validée</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Expédiées
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

      {/* Onglets Statuts + Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Onglets Statuts */}
          <Tabs
            value={activeTab}
            onValueChange={value =>
              setActiveTab(value as SalesOrderStatus | 'all')
            }
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">Toutes ({tabCounts.all})</TabsTrigger>
              <TabsTrigger value="draft">
                Brouillon ({tabCounts.draft})
              </TabsTrigger>
              <TabsTrigger value="validated">
                Validée ({tabCounts.validated})
              </TabsTrigger>
              <TabsTrigger value="shipped">
                Expédiée ({tabCounts.shipped})
              </TabsTrigger>
              <TabsTrigger value="cancelled">
                Annulée ({tabCounts.cancelled})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filtres complémentaires */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher par numéro ou client..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type client */}
            <Select
              value={customerTypeFilter}
              onValueChange={(value: any) => setCustomerTypeFilter(value)}
            >
              <SelectTrigger className="w-full lg:w-56">
                <SelectValue placeholder="Type de client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="professional">
                  Clients professionnels
                </SelectItem>
                <SelectItem value="individual">Clients particuliers</SelectItem>
              </SelectContent>
            </Select>

            {/* Période */}
            <Select
              value={periodFilter}
              onValueChange={(value: any) => setPeriodFilter(value)}
            >
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute période</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
                <SelectItem value="quarter">Ce trimestre</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau commandes */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes</CardTitle>
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
              <p className="text-gray-500">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10" />
                    <TableHead>N° Commande</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('client')}
                    >
                      Client {renderSortIcon('client')}
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-20 text-center">Articles</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Date {renderSortIcon('date')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('amount')}
                    >
                      Montant {renderSortIcon('amount')}
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => {
                    const customerName =
                      order.customer_type === 'organization'
                        ? order.organisations?.trade_name ||
                          order.organisations?.legal_name
                        : `${order.individual_customers?.first_name} ${order.individual_customers?.last_name}`;

                    const canDelete =
                      order.status === 'draft' || order.status === 'cancelled';

                    const items = order.sales_order_items || [];
                    const hasSamples = items.some(
                      (item: any) => item.is_sample === true
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
                          <TableCell className="font-medium">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {customerName || 'Non défini'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {order.customer_type === 'organization'
                                  ? 'Professionnel'
                                  : 'Particulier'}
                              </div>
                            </div>
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
                          {/* Colonne Articles */}
                          <TableCell className="text-center">
                            <span className="font-medium">{items.length}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              réf.
                            </span>
                          </TableCell>
                          <TableCell>{formatDate(order.created_at)}</TableCell>
                          <TableCell>
                            <div className="font-medium">
                              {formatCurrency(
                                order.total_ttc || order.total_ht
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {/* Voir */}
                              <IconButton
                                icon={Eye}
                                variant="outline"
                                size="sm"
                                label="Voir détails"
                                onClick={() => openOrderDetail(order)}
                              />

                              {/* Modifier (draft ou confirmed non payée) */}
                              {(order.status === 'draft' ||
                                order.status === 'validated') && (
                                <IconButton
                                  icon={Edit}
                                  variant="outline"
                                  size="sm"
                                  label="Modifier"
                                  onClick={() => openEditOrder(order.id)}
                                />
                              )}

                              {/* Valider (draft uniquement) */}
                              {order.status === 'draft' && (
                                <IconButton
                                  icon={CheckCircle}
                                  variant="success"
                                  size="sm"
                                  label="Valider"
                                  onClick={() =>
                                    handleStatusChange(order.id, 'validated')
                                  }
                                />
                              )}

                              {/* Dévalider (confirmed uniquement) */}
                              {order.status === 'validated' && (
                                <IconButton
                                  icon={RotateCcw}
                                  variant="outline"
                                  size="sm"
                                  label="Dévalider (retour brouillon)"
                                  onClick={() =>
                                    handleStatusChange(order.id, 'draft')
                                  }
                                />
                              )}

                              {/* Expédier (confirmed ou partially_shipped) */}
                              {(order.status === 'validated' ||
                                order.status === 'partially_shipped') && (
                                <IconButton
                                  icon={Truck}
                                  variant="outline"
                                  size="sm"
                                  label="Expédier la commande"
                                  onClick={() => openShipmentModal(order)}
                                />
                              )}

                              {/* Annuler (UNIQUEMENT brouillon - Workflow: dévalidation obligatoire) */}
                              {order.status === 'draft' && (
                                <IconButton
                                  icon={Ban}
                                  variant="danger"
                                  size="sm"
                                  label="Annuler la commande (brouillon uniquement)"
                                  onClick={() => handleCancel(order.id)}
                                />
                              )}

                              {/* Annuler disabled pour confirmed - Doit dévalider d'abord */}
                              {order.status === 'validated' && (
                                <IconButton
                                  icon={Ban}
                                  variant="outline"
                                  size="sm"
                                  label="Impossible d'annuler directement une commande validée. Veuillez d'abord la dévalider (retour brouillon), puis l'annuler."
                                  disabled
                                />
                              )}

                              {/* Annuler disabled pour paid/delivered - Règle absolue */}
                              {(order.payment_status === 'paid' ||
                                order.status === 'delivered') &&
                                order.status !== 'cancelled' &&
                                order.status !== 'draft' &&
                                order.status !== 'validated' && (
                                  <IconButton
                                    icon={Ban}
                                    variant="outline"
                                    size="sm"
                                    label={
                                      order.payment_status === 'paid'
                                        ? "Impossible d'annuler : commande déjà payée. Contacter un administrateur pour remboursement."
                                        : "Impossible d'annuler : commande déjà livrée. Créer un avoir."
                                    }
                                    disabled
                                  />
                                )}

                              {/* Supprimer (cancelled uniquement) */}
                              {order.status === 'cancelled' && (
                                <IconButton
                                  icon={Trash2}
                                  variant="danger"
                                  size="sm"
                                  label="Supprimer"
                                  onClick={() => handleDelete(order.id)}
                                />
                              )}

                              {/* Imprimer PDF */}
                              <IconButton
                                icon={FileText}
                                variant="outline"
                                size="sm"
                                label="Imprimer PDF"
                                onClick={() => handlePrintPDF(order)}
                              />
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Ligne d'expansion - affiche les produits */}
                        {isExpanded && items.length > 0 && (
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableCell colSpan={8} className="p-0">
                              <div className="py-3 px-6 space-y-2">
                                {items.map((item: any) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-4 text-sm py-1"
                                  >
                                    <ProductThumbnail
                                      src={item.products?.primary_image_url}
                                      alt={item.products?.name || 'Produit'}
                                      size="xs"
                                    />
                                    <span className="flex-1 font-medium">
                                      {item.products?.name || 'Produit inconnu'}
                                    </span>
                                    <span className="text-muted-foreground">
                                      x{item.quantity}
                                    </span>
                                    <span className="font-medium w-24 text-right">
                                      {formatCurrency(item.total_ht || 0)}
                                    </span>
                                    {item.is_sample && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        Échantillon
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

      {/* Modal Détail Commande */}
      <OrderDetailModal
        order={selectedOrder}
        open={showOrderDetail}
        onClose={() => setShowOrderDetail(false)}
        onUpdate={() => {
          fetchOrders();
          fetchStats();
        }}
      />

      {/* Modal Édition Commande */}
      {editingOrderId && (
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
          onSuccess={() => {
            setShowEditModal(false);
            setEditingOrderId(null);
            fetchOrders();
            fetchStats();
          }}
        />
      )}

      {/* Modal Expédition */}
      {selectedOrder && (
        <SalesOrderShipmentModal
          order={selectedOrder}
          open={showShipmentModal}
          onClose={() => {
            setShowShipmentModal(false);
            setSelectedOrder(null);
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
              Vous êtes sur le point de valider cette commande client. Une fois
              validée, la commande pourra être expédiée et les alertes de stock
              seront générées automatiquement si nécessaire.
              <br />
              <br />
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleValidateConfirmed}>
              Valider la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
