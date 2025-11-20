'use client';

import { useState, useEffect, useMemo } from 'react';

import { useSearchParams } from 'next/navigation';

import { useToast } from '@verone/common';
import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import { PurchaseOrderFormModal } from '@verone/orders';
import { PurchaseOrderReceptionModal } from '@verone/orders';
import { PurchaseOrderDetailModal } from '@verone/orders';
import { usePurchaseOrders } from '@verone/orders';
import { useOrganisations } from '@verone/organisations';
import type { Database } from '@verone/types';
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
import { Separator } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Tabs, TabsList, TabsTrigger } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import {
  Plus,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Ban,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';

import { updatePurchaseOrderStatus } from '@/app/actions/purchase-orders';

type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row'];

// ✅ Type Safety: Interface ProductImage stricte
interface ProductImage {
  id?: string;
  public_url: string;
  is_primary: boolean;
  display_order?: number;
}

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validée',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée',
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  validated: 'bg-green-100 text-green-800', // 🟢 Alerte verte
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-gray-100 text-gray-900',
  partially_received: 'bg-gray-100 text-gray-900',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

type SortColumn = 'date' | 'supplier' | 'amount' | null;
type SortDirection = 'asc' | 'desc';

export default function PurchaseOrdersPage() {
  const {
    loading,
    orders,
    stats,
    fetchOrders,
    fetchStats,
    updateStatus,
    deleteOrder,
  } = usePurchaseOrders();

  const { organisations: suppliers } = useOrganisations({ type: 'supplier' });
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // États filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<PurchaseOrderStatus | 'all'>(
    'all'
  );
  const [supplierFilter, setSuppliersFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<
    'all' | 'month' | 'quarter' | 'year'
  >('all');

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

  useEffect(() => {
    fetchOrders();
    fetchStats();
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
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      partially_received: orders.filter(o => o.status === 'partially_received')
        .length,
      received: orders.filter(o => o.status === 'received').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  // ✅ Filtrage + Tri
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

      // Filtre fournisseur
      if (supplierFilter !== 'all' && order.supplier_id !== supplierFilter)
        return false;

      // Filtre période
      if (periodFilter !== 'all') {
        const orderDate = new Date(order.created_at);
        const now = new Date();

        switch (periodFilter) {
          case 'month':
            // Ce mois
            if (
              orderDate.getMonth() !== now.getMonth() ||
              orderDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
            break;
          case 'quarter':
            // Ce trimestre
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const orderQuarter = Math.floor(orderDate.getMonth() / 3);
            if (
              orderQuarter !== currentQuarter ||
              orderDate.getFullYear() !== now.getFullYear()
            ) {
              return false;
            }
            break;
          case 'year':
            // Cette année
            if (orderDate.getFullYear() !== now.getFullYear()) {
              return false;
            }
            break;
        }
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
          case 'supplier':
            const nameA = a.organisations
              ? getOrganisationDisplayName(a.organisations)
              : '';
            const nameB = b.organisations
              ? getOrganisationDisplayName(b.organisations)
              : '';
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
    searchTerm,
    supplierFilter,
    periodFilter,
    sortColumn,
    sortDirection,
  ]);

  // ✅ KPI dynamiques sur commandes filtrées
  const filteredStats = useMemo(() => {
    const stats = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++;
        acc.total_ht += order.total_ht || 0;
        acc.eco_tax_total += order.eco_tax_total || 0;
        acc.total_ttc += order.total_ttc || 0;

        if (
          ['draft', 'sent', 'confirmed', 'partially_received'].includes(
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

  const handleStatusChange = async (
    orderId: string,
    newStatus: PurchaseOrderStatus
  ) => {
    // Si validation (draft → confirmed), afficher modal de confirmation
    if (newStatus === 'confirmed') {
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
        throw new Error(result.error || 'Erreur lors de la mise à jour');
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
        'confirmed',
        user.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la confirmation');
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
          throw new Error(result.error || "Erreur lors de l'annulation");
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
        <PurchaseOrderFormModal onSuccess={() => fetchOrders()} />
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
              <TabsTrigger value="confirmed">
                Confirmée ({tabCounts.confirmed})
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

          {/* Filtres complémentaires */}
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
            <Select value={supplierFilter} onValueChange={setSuppliersFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Fournisseur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les fournisseurs</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {getOrganisationDisplayName(supplier)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={periodFilter}
              onValueChange={(value: 'all' | 'month' | 'quarter' | 'year') =>
                setPeriodFilter(value)
              }
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
                    <TableHead>N° Commande</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('supplier')}
                    >
                      Fournisseur {renderSortIcon('supplier')}
                    </TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('date')}
                    >
                      Date création {renderSortIcon('date')}
                    </TableHead>
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
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.po_number}
                      </TableCell>
                      <TableCell>
                        {order.organisations
                          ? getOrganisationDisplayName(order.organisations)
                          : 'Non défini'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        {order.expected_delivery_date
                          ? formatDate(order.expected_delivery_date)
                          : 'Non définie'}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_ttc)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconButton
                            icon={Eye}
                            variant="outline"
                            size="sm"
                            label="Voir les détails"
                            onClick={() => openOrderDetail(order)}
                          />

                          {/* DRAFT : Éditer + Valider + Annuler + Supprimer */}
                          {order.status === 'draft' && (
                            <>
                              <IconButton
                                icon={Edit}
                                variant="outline"
                                size="sm"
                                label="Éditer la commande"
                                onClick={() => openEditModal(order)}
                              />
                              <IconButton
                                icon={CheckCircle}
                                variant="success"
                                size="sm"
                                label="Valider la commande"
                                onClick={() =>
                                  handleStatusChange(order.id, 'confirmed')
                                }
                              />
                              <IconButton
                                icon={Ban}
                                variant="danger"
                                size="sm"
                                label="Annuler la commande"
                                onClick={() => handleCancel(order.id)}
                              />
                              <IconButton
                                icon={Trash2}
                                variant="danger"
                                size="sm"
                                label="Supprimer"
                                onClick={() => handleDelete(order.id)}
                              />
                            </>
                          )}

                          {/* CONFIRMED : Réceptionner + Dévalider + Annuler */}
                          {order.status === 'confirmed' && (
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
                                onClick={() =>
                                  handleStatusChange(order.id, 'draft')
                                }
                              />
                              <IconButton
                                icon={Ban}
                                variant="danger"
                                size="sm"
                                label="Annuler la commande"
                                onClick={() => handleCancel(order.id)}
                              />
                            </>
                          )}

                          {/* SENT : Confirmer + Dévalider + Annuler */}
                          {order.status === 'sent' && (
                            <>
                              <IconButton
                                icon={CheckCircle}
                                variant="success"
                                size="sm"
                                label="Confirmer la commande"
                                onClick={() =>
                                  handleStatusChange(order.id, 'confirmed')
                                }
                              />
                              <IconButton
                                icon={RotateCcw}
                                variant="outline"
                                size="sm"
                                label="Dévalider (retour brouillon)"
                                onClick={() =>
                                  handleStatusChange(order.id, 'draft')
                                }
                              />
                              <IconButton
                                icon={Ban}
                                variant="danger"
                                size="sm"
                                label="Annuler la commande"
                                onClick={() => handleCancel(order.id)}
                              />
                            </>
                          )}

                          {/* CONFIRMED : Réceptionner + Dévalider + Annuler */}
                          {order.status === 'confirmed' && (
                            <>
                              <IconButton
                                icon={Truck}
                                variant="outline"
                                size="sm"
                                label="Réceptionner la commande"
                                onClick={() => openReceptionModal(order)}
                              />
                              <IconButton
                                icon={RotateCcw}
                                variant="outline"
                                size="sm"
                                label="Dévalider (retour brouillon)"
                                onClick={() =>
                                  handleStatusChange(order.id, 'draft')
                                }
                              />
                              <IconButton
                                icon={Ban}
                                variant="danger"
                                size="sm"
                                label="Annuler la commande"
                                onClick={() => handleCancel(order.id)}
                              />
                            </>
                          )}

                          {/* PARTIALLY_RECEIVED : Réceptionner + Annuler DISABLED */}
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
                                icon={Ban}
                                variant="outline"
                                size="sm"
                                label="Impossible d'annuler : réception en cours"
                                disabled
                              />
                            </>
                          )}

                          {/* RECEIVED : Annuler DISABLED */}
                          {order.status === 'received' && (
                            <IconButton
                              icon={Ban}
                              variant="outline"
                              size="sm"
                              label="Impossible d'annuler : commande déjà reçue"
                              disabled
                            />
                          )}

                          {/* CANCELLED : Supprimer */}
                          {order.status === 'cancelled' && (
                            <IconButton
                              icon={Trash2}
                              variant="danger"
                              size="sm"
                              label="Supprimer"
                              onClick={() => handleDelete(order.id)}
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
          fetchOrders();
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
            fetchOrders();
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
            fetchOrders();
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
            <AlertDialogAction onClick={handleValidateConfirmed}>
              Confirmer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
