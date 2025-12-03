'use client';

import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

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
import { IconButton } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import { createClient } from '@verone/utils/supabase/client';
import {
  ShoppingCart,
  Loader2,
  Plus,
  Eye,
  Search,
  Filter,
  ChevronDown,
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
  // Client info (polymorphique)
  customer_name: string;
  customer_city: string | null;
  // Commission info (agrégée depuis items)
  total_commission: number;
  net_benefit: number;
  // Affilié (tracé via source_affiliate_id du client ou via selection_items)
  affiliate_name: string | null;
  items_count: number;
}

interface OrderStats {
  total_orders: number;
  total_ht: number;
  total_commissions: number;
  net_benefit: number;
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
 * Avec colonnes spécifiques: affilié, commission, bénéfice net
 */
export default function LinkMeOrdersPage() {
  const [orders, setOrders] = useState<LinkMeOrder[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const supabase = createClient();

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
              quantity,
              retrocession_rate,
              retrocession_amount
            )
          `
          )
          .eq('channel_id', LINKME_CHANNEL_ID)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;

        // Enrichir avec les données clients
        const enrichedOrders: LinkMeOrder[] = await Promise.all(
          (ordersData || []).map(async (order: any) => {
            let customerName = 'Client inconnu';
            let customerCity: string | null = null;
            let affiliateName: string | null = null;

            // Fetch customer info selon type
            // Note: source_affiliate_id existe en DB mais pas dans les types Git - utiliser any
            if (order.customer_type === 'organization' && order.customer_id) {
              const { data } = await supabase
                .from('organisations')
                .select('trade_name, legal_name, city, source_affiliate_id')
                .eq('id', order.customer_id)
                .single();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const org = data as any;

              if (org) {
                customerName =
                  org.trade_name || org.legal_name || 'Organisation';
                customerCity = org.city;

                // Fetch affiliate name si source_affiliate_id existe
                if (org.source_affiliate_id) {
                  const { data: affiliate } = await supabase
                    .from('linkme_affiliates')
                    .select('display_name')
                    .eq('id', org.source_affiliate_id)
                    .single();
                  affiliateName = affiliate?.display_name || null;
                }
              }
            } else if (
              order.customer_type === 'individual' &&
              order.customer_id
            ) {
              const { data } = await supabase
                .from('individual_customers')
                .select('first_name, last_name, city, source_affiliate_id')
                .eq('id', order.customer_id)
                .single();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const individual = data as any;

              if (individual) {
                customerName =
                  `${individual.first_name} ${individual.last_name}`.trim();
                customerCity = individual.city;

                // Fetch affiliate name si source_affiliate_id existe
                if (individual.source_affiliate_id) {
                  const { data: affiliate } = await supabase
                    .from('linkme_affiliates')
                    .select('display_name')
                    .eq('id', individual.source_affiliate_id)
                    .single();
                  affiliateName = affiliate?.display_name || null;
                }
              }
            }

            // Calculer commission totale (somme des retrocession_amount)
            const items = order.sales_order_items || [];
            const totalCommission = items.reduce(
              (sum: number, item: any) => sum + (item.retrocession_amount || 0),
              0
            );
            const netBenefit = order.total_ht - totalCommission;

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
              total_commission: totalCommission,
              net_benefit: netBenefit,
              affiliate_name: affiliateName,
              items_count: items.length,
            };
          })
        );

        setOrders(enrichedOrders);

        // Calculer stats
        const statsData: OrderStats = {
          total_orders: enrichedOrders.length,
          total_ht: enrichedOrders.reduce((sum, o) => sum + o.total_ht, 0),
          total_commissions: enrichedOrders.reduce(
            (sum, o) => sum + o.total_commission,
            0
          ),
          net_benefit: enrichedOrders.reduce(
            (sum, o) => sum + o.net_benefit,
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
          !order.customer_name.toLowerCase().includes(query)
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
      <div className="grid grid-cols-4 gap-4 p-6 border-b bg-gray-50">
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
              Commissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              {formatPrice(stats?.total_commissions || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Bénéfice Net
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(stats?.net_benefit || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-6 border-b bg-white">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher par n° ou client..."
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
                  <TableHead>N° Commande</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Affilié</TableHead>
                  <TableHead className="text-right">Total HT</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Bénéfice Net</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map(order => {
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
                    <TableRow key={order.id}>
                      <TableCell>
                        <Link
                          href={`/commandes/clients/${order.id}`}
                          className="font-mono text-sm text-blue-600 hover:underline"
                        >
                          {order.order_number}
                        </Link>
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
                        {order.affiliate_name ? (
                          <Badge variant="outline" className="text-xs">
                            {order.affiliate_name}
                          </Badge>
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
                            order.total_commission > 0
                              ? 'text-orange-600'
                              : 'text-gray-400'
                          )}
                        >
                          {order.total_commission > 0
                            ? formatPrice(order.total_commission)
                            : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-green-600">
                          {formatPrice(order.net_benefit)}
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
                      <TableCell>
                        <Link href={`/commandes/clients/${order.id}`}>
                          <IconButton
                            variant="ghost"
                            size="sm"
                            icon={Eye}
                            label="Voir détails"
                          />
                        </Link>
                      </TableCell>
                    </TableRow>
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
