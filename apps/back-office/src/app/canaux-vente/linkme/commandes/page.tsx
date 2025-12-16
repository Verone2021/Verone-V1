'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { ProductThumbnail } from '@verone/products';
import { Badge } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Button } from '@verone/ui';
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
// Accordéon géré manuellement avec state (pas de Collapsible pour les tables)
import { cn, formatPrice } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ShoppingCart,
  Loader2,
  Plus,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Building2,
  User,
  DollarSign,
  TrendingUp,
  CalendarDays,
  Package,
  Eye,
} from 'lucide-react';

import { CreateLinkMeOrderModal } from '../components/CreateLinkMeOrderModal';
import { LinkMeOrderDetailModal } from '../components/LinkMeOrderDetailModal';

// ID du canal LinkMe
const LINKME_CHANNEL_ID = '93c68db1-5a30-4168-89ec-6383152be405';

// Types
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  quantity: number;
  unit_price_ht: number;
  total_ht: number;
  selling_price_ht: number | null;
  affiliate_margin: number;
}

interface LinkMeOrder {
  id: string;
  order_number: string;
  status: string;
  payment_status: string | null;
  total_ht: number;
  total_ttc: number;
  customer_type: 'organization' | 'individual';
  customer_id: string;
  created_at: string;
  // Client info
  customer_name: string;
  customer_address: string | null;
  customer_postal_code: string | null;
  customer_city: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  // Affilié (tracé via selection_items)
  affiliate_name: string | null;
  affiliate_type: 'enseigne' | 'organisation' | null;
  // Sélection
  selection_name: string | null;
  // Marge affilié totale (somme des marges affilié de chaque produit)
  total_affiliate_margin: number;
  // Items pour accordéon
  items: OrderItem[];
}

interface OrderStats {
  total_orders: number;
  total_ht: number;
  total_affiliate_margins: number;
  orders_by_status: Record<string, number>;
}

const STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant:
      | 'default'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'destructive'
      | 'outline';
  }
> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  validated: { label: 'Validée', variant: 'default' },
  partially_shipped: { label: 'Expédition partielle', variant: 'warning' },
  shipped: { label: 'Expédiée', variant: 'success' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'destructive' },
};

const PAYMENT_STATUS_LABELS: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive';
  }
> = {
  pending: { label: 'En attente', variant: 'secondary' },
  partial: { label: 'Partiel', variant: 'warning' },
  paid: { label: 'Payé', variant: 'success' },
  refunded: { label: 'Remboursé', variant: 'destructive' },
  overdue: { label: 'En retard', variant: 'destructive' },
};

/**
 * Page Commandes LinkMe
 * Affiche les commandes filtrées par channel_id = LinkMe
 * Avec accordéon pour voir les produits et leur taux de marge
 */
export default function LinkMeOrdersPage() {
  const [orders, setOrders] = useState<LinkMeOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<LinkMeOrder | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const supabase = createClient();

  // Toggle accordéon
  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Ouvrir le modal de détail
  const handleViewOrder = (order: LinkMeOrder) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  // Fetch commandes LinkMe - OPTIMISÉ avec vues PostgreSQL (1-2 requêtes au lieu de 500+)
  useEffect(() => {
    async function fetchLinkMeOrders() {
      setIsLoading(true);
      try {
        // 1. Fetch toutes les commandes avec données enrichies via la vue optimisée
        // Note: Cast nécessaire car les types Supabase ne sont pas encore régénérés
        const { data: ordersData, error: ordersError } = await (supabase as any)
          .from('linkme_orders_with_margins')
          .select('*')
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // 2. Fetch tous les items enrichis en une seule requête
        const orderIds = (ordersData || []).map((o: any) => o.id);
        const { data: itemsData, error: itemsError } = await (supabase as any)
          .from('linkme_order_items_enriched')
          .select('*')
          .in('sales_order_id', orderIds);

        if (itemsError) throw itemsError;

        // 3. Grouper les items par commande (côté client, très rapide)
        const itemsByOrderId = (itemsData || []).reduce(
          (acc: Record<string, OrderItem[]>, item: any) => {
            const orderId = item.sales_order_id;
            if (!acc[orderId]) acc[orderId] = [];
            acc[orderId].push({
              id: item.id,
              product_id: item.product_id,
              product_name: item.product_name || 'Produit inconnu',
              product_image_url: item.product_image_url,
              quantity: item.quantity,
              unit_price_ht: item.base_price_ht || item.unit_price_ht || 0,
              total_ht: item.total_ht || 0,
              selling_price_ht: item.selling_price_ht,
              affiliate_margin: item.affiliate_margin || 0,
            });
            return acc;
          },
          {}
        );

        // 4. Mapper les données vers l'interface LinkMeOrder
        const enrichedOrders: LinkMeOrder[] = (ordersData || []).map(
          (order: any) => ({
            id: order.id,
            order_number: order.order_number,
            status: order.status,
            payment_status: order.payment_status,
            total_ht: order.total_ht || 0,
            total_ttc: order.total_ttc || 0,
            customer_type: order.customer_type,
            customer_id: order.customer_id,
            created_at: order.created_at,
            customer_name: order.customer_name || 'Client inconnu',
            customer_address: order.customer_address,
            customer_postal_code: order.customer_postal_code,
            customer_city: order.customer_city,
            customer_email: order.customer_email,
            customer_phone: order.customer_phone,
            affiliate_name: order.affiliate_name,
            affiliate_type: order.affiliate_type as
              | 'enseigne'
              | 'organisation'
              | null,
            selection_name: order.selection_name,
            total_affiliate_margin: order.total_affiliate_margin || 0,
            items: itemsByOrderId[order.id] || [],
          })
        );

        setOrders(enrichedOrders);

        // Calculer stats
        const statsData: OrderStats = {
          total_orders: enrichedOrders.length,
          total_ht: enrichedOrders.reduce((sum, o) => sum + o.total_ht, 0),
          total_affiliate_margins: enrichedOrders.reduce(
            (sum, o) => sum + o.total_affiliate_margin,
            0
          ),
          orders_by_status: enrichedOrders.reduce(
            (acc, o) => {
              acc[o.status] = (acc[o.status] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>
          ),
        };
        setStats(statsData);
      } catch (error) {
        console.error('Erreur fetch commandes LinkMe:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLinkMeOrders();
  }, [supabase]);

  // Filtrage
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtre recherche
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !order.order_number.toLowerCase().includes(query) &&
          !order.customer_name.toLowerCase().includes(query) &&
          !(order.affiliate_name?.toLowerCase().includes(query) ?? false)
        ) {
          return false;
        }
      }

      // Filtre statut
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [orders, searchQuery, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement des commandes LinkMe...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Commandes LinkMe</h1>
              <p className="text-sm text-gray-500">
                {stats?.total_orders || 0} commande
                {(stats?.total_orders || 0) > 1 ? 's' : ''} via le canal LinkMe
              </p>
            </div>
          </div>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Commande
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 p-6 border-b bg-gray-50">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              CA HT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatPrice(stats?.total_ht || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Marge Affilié
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatPrice(stats?.total_affiliate_margins || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 border-b bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par n°, client ou affilié..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Tous les statuts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="validated">Validée</SelectItem>
            <SelectItem value="partially_shipped">
              Expédition partielle
            </SelectItem>
            <SelectItem value="shipped">Expédiée</SelectItem>
            <SelectItem value="delivered">Livrée</SelectItem>
            <SelectItem value="cancelled">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="flex-1 p-6 overflow-auto">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucune commande LinkMe</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchQuery || statusFilter !== 'all'
                ? 'Aucune commande ne correspond aux filtres'
                : 'Les commandes créées via LinkMe apparaîtront ici'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>Date</TableHead>
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Sélection</TableHead>
                  <TableHead className="text-right">Total TTC</TableHead>
                  <TableHead className="text-right">Marge Affilié</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-16 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => {
                  const isExpanded = expandedOrders.has(order.id);
                  const statusInfo = STATUS_LABELS[order.status] || {
                    label: order.status,
                    variant: 'secondary' as const,
                  };
                  const paymentInfo = order.payment_status
                    ? PAYMENT_STATUS_LABELS[order.payment_status] || {
                        label: order.payment_status,
                        variant: 'secondary' as const,
                      }
                    : null;

                  return (
                    <React.Fragment key={order.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer hover:bg-gray-50',
                          isExpanded && 'bg-blue-50'
                        )}
                        onClick={() => toggleOrder(order.id)}
                      >
                        {/* Expand button */}
                        <TableCell>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        {/* Date (déplacé en premier) */}
                        <TableCell>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(order.created_at).toLocaleDateString(
                              'fr-FR',
                              {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </div>
                        </TableCell>
                        {/* N° Commande */}
                        <TableCell>
                          <span className="font-mono text-sm text-blue-600">
                            {order.order_number}
                          </span>
                        </TableCell>
                        {/* Affilié */}
                        <TableCell>
                          {order.affiliate_name ? (
                            <Badge variant="outline" className="text-xs">
                              {order.affiliate_name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        {/* Client */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {order.customer_type === 'organization' ? (
                              <Building2 className="h-4 w-4 text-gray-400" />
                            ) : (
                              <User className="h-4 w-4 text-gray-400" />
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {order.customer_name}
                              </p>
                              {order.customer_city && (
                                <p className="text-xs text-gray-500">
                                  {order.customer_city}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        {/* Sélection */}
                        <TableCell>
                          {order.selection_name ? (
                            <span className="text-sm text-gray-700">
                              {order.selection_name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        {/* Total TTC (calculé: HT × 1.2) */}
                        <TableCell className="text-right font-medium">
                          {formatPrice(order.total_ttc)}
                        </TableCell>
                        {/* Marge Affilié */}
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-medium',
                              order.total_affiliate_margin > 0
                                ? 'text-orange-600'
                                : 'text-gray-400'
                            )}
                          >
                            {order.total_affiliate_margin > 0
                              ? formatPrice(order.total_affiliate_margin)
                              : '-'}
                          </span>
                        </TableCell>
                        {/* Statut */}
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        {/* Actions */}
                        <TableCell className="text-center">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleViewOrder(order);
                            }}
                            className="p-2 rounded-lg hover:bg-purple-100 transition-colors group"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4 text-gray-500 group-hover:text-purple-600" />
                          </button>
                        </TableCell>
                      </TableRow>

                      {/* Accordéon - Détails des produits */}
                      {isExpanded && (
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableCell colSpan={10} className="p-0">
                            <div className="px-8 py-4">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Produits ({order.items.length})
                              </h4>
                              <div className="bg-white rounded border">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-gray-100">
                                      <TableHead className="text-xs w-16">
                                        Photo
                                      </TableHead>
                                      <TableHead className="text-xs">
                                        Produit
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Qté
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Prix unit. HT
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Total HT
                                      </TableHead>
                                      <TableHead className="text-xs text-right">
                                        Marge Affilié (€)
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {order.items.map(item => (
                                      <TableRow key={item.id}>
                                        <TableCell className="p-2">
                                          <ProductThumbnail
                                            src={item.product_image_url}
                                            alt={item.product_name}
                                            size="xs"
                                          />
                                        </TableCell>
                                        <TableCell className="text-sm">
                                          {item.product_name}
                                        </TableCell>
                                        <TableCell className="text-sm text-right">
                                          {item.quantity}
                                        </TableCell>
                                        <TableCell className="text-sm text-right">
                                          {formatPrice(
                                            item.selling_price_ht ||
                                              item.unit_price_ht
                                          )}
                                        </TableCell>
                                        <TableCell className="text-sm text-right font-medium">
                                          {formatPrice(item.total_ht)}
                                        </TableCell>
                                        <TableCell className="text-sm text-right">
                                          {item.affiliate_margin > 0 ? (
                                            <span className="text-orange-600 font-medium">
                                              {formatPrice(
                                                item.affiliate_margin
                                              )}
                                            </span>
                                          ) : (
                                            <span className="text-gray-400">
                                              -
                                            </span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
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
      </div>

      {/* Modal création commande */}
      <CreateLinkMeOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Modal détail commande */}
      <LinkMeOrderDetailModal
        order={selectedOrder}
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </div>
  );
}
