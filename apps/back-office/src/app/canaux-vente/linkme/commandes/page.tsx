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
} from 'lucide-react';

import { CreateLinkMeOrderModal } from '../components/CreateLinkMeOrderModal';

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
  customer_city: string | null;
  // Affilié (tracé via selection_items)
  affiliate_name: string | null;
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

  // Fetch commandes LinkMe
  useEffect(() => {
    async function fetchLinkMeOrders() {
      setIsLoading(true);
      try {
        // Fetch orders with channel_id = LinkMe
        const { data: ordersData, error: ordersError } = await supabase
          .from('sales_orders')
          .select(
            `
            id,
            order_number,
            status,
            payment_status,
            total_ht,
            total_ttc,
            customer_type,
            customer_id,
            created_at,
            sales_order_items (
              id,
              product_id,
              quantity,
              unit_price_ht,
              total_ht,
              retrocession_rate,
              retrocession_amount,
              linkme_selection_item_id
            )
          `
          )
          .eq('channel_id', LINKME_CHANNEL_ID)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Enrichir avec les données clients, affilié, sélection et produits
        const enrichedOrders: LinkMeOrder[] = await Promise.all(
          (ordersData || []).map(async (order: any) => {
            let customerName = 'Client inconnu';
            let customerCity: string | null = null;
            let affiliateName: string | null = null;
            let selectionName: string | null = null;

            // Fetch customer info selon type
            if (order.customer_type === 'organization' && order.customer_id) {
              const { data } = await supabase
                .from('organisations')
                .select('trade_name, legal_name, city')
                .eq('id', order.customer_id)
                .single();

              if (data) {
                customerName =
                  data.trade_name || data.legal_name || 'Organisation';
                customerCity = data.city;
              }
            } else if (
              order.customer_type === 'individual' &&
              order.customer_id
            ) {
              const { data } = await supabase
                .from('individual_customers')
                .select('first_name, last_name, city')
                .eq('id', order.customer_id)
                .single();

              if (data) {
                customerName = `${data.first_name} ${data.last_name}`.trim();
                customerCity = data.city;
              }
            }

            // Tracer affilié et sélection via les items
            const items = order.sales_order_items || [];
            if (items.length > 0) {
              const itemWithSelection = items.find(
                (item: any) => item.linkme_selection_item_id
              );

              if (itemWithSelection?.linkme_selection_item_id) {
                // Tracer: linkme_selection_items → linkme_selections
                const { data: selectionItem } = await supabase
                  .from('linkme_selection_items')
                  .select('selection_id')
                  .eq('id', itemWithSelection.linkme_selection_item_id)
                  .single();

                if (selectionItem?.selection_id) {
                  // Récupérer la sélection et l'affilié
                  const { data: selection } = await supabase
                    .from('linkme_selections')
                    .select('name, affiliate_id')
                    .eq('id', selectionItem.selection_id)
                    .single();

                  if (selection) {
                    selectionName = selection.name || null;

                    // Récupérer l'affilié
                    if (selection.affiliate_id) {
                      const { data: affiliate } = await supabase
                        .from('linkme_affiliates')
                        .select('display_name')
                        .eq('id', selection.affiliate_id)
                        .single();

                      affiliateName = affiliate?.display_name || null;
                    }
                  }
                }
              }
            }

            // Récupérer les données produits et sélection pour les items
            const enrichedItems: OrderItem[] = await Promise.all(
              items.map(async (item: any) => {
                let productName = 'Produit inconnu';
                let productImageUrl: string | null = null;
                let sellingPriceHt: number | null = null;
                let basePriceHt: number = item.unit_price_ht || 0;

                // Récupérer nom du produit
                if (item.product_id) {
                  const { data: product } = await supabase
                    .from('products')
                    .select('name')
                    .eq('id', item.product_id)
                    .single();

                  productName = product?.name || 'Produit inconnu';

                  // Récupérer l'image primaire depuis product_images
                  const { data: primaryImage } = await supabase
                    .from('product_images')
                    .select('public_url')
                    .eq('product_id', item.product_id)
                    .eq('is_primary', true)
                    .single();

                  productImageUrl = primaryImage?.public_url || null;
                }

                // Récupérer les prix depuis linkme_selection_items
                if (item.linkme_selection_item_id) {
                  const { data: selectionItem } = await supabase
                    .from('linkme_selection_items')
                    .select('base_price_ht, selling_price_ht')
                    .eq('id', item.linkme_selection_item_id)
                    .single();

                  if (selectionItem) {
                    sellingPriceHt = selectionItem.selling_price_ht;
                    basePriceHt =
                      selectionItem.base_price_ht || item.unit_price_ht || 0;
                  }
                }

                // Calcul marge affilié = (prix vente affilié - prix LinkMe) * quantité
                const affiliateMargin = sellingPriceHt
                  ? (sellingPriceHt - basePriceHt) * item.quantity
                  : 0;

                return {
                  id: item.id,
                  product_id: item.product_id,
                  product_name: productName,
                  product_image_url: productImageUrl,
                  quantity: item.quantity,
                  unit_price_ht: basePriceHt,
                  total_ht: item.total_ht || 0,
                  selling_price_ht: sellingPriceHt,
                  affiliate_margin: affiliateMargin,
                };
              })
            );

            // Calculer marge affilié totale
            const totalAffiliateMargin = enrichedItems.reduce(
              (sum, item) => sum + item.affiliate_margin,
              0
            );

            return {
              id: order.id,
              order_number: order.order_number,
              status: order.status,
              payment_status: order.payment_status,
              total_ht: order.total_ht,
              total_ttc: order.total_ttc,
              customer_type: order.customer_type,
              customer_id: order.customer_id,
              created_at: order.created_at,
              customer_name: customerName,
              customer_city: customerCity,
              affiliate_name: affiliateName,
              selection_name: selectionName,
              total_affiliate_margin: totalAffiliateMargin,
              items: enrichedItems,
            };
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
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Sélection</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">Marge Affilié</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
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
                        <TableCell>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-blue-600">
                            {order.order_number}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.affiliate_name ? (
                            <Badge variant="outline" className="text-xs">
                              {order.affiliate_name}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
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
                        <TableCell>
                          {order.selection_name ? (
                            <span className="text-sm text-gray-700">
                              {order.selection_name}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(order.total_ht)}
                        </TableCell>
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
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {paymentInfo ? (
                            <Badge variant={paymentInfo.variant}>
                              {paymentInfo.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
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
                                          {formatPrice(item.unit_price_ht)}
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
    </div>
  );
}
