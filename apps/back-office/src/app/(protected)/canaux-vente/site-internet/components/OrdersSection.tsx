/**
 * Composant: OrdersSection
 * Gestion des commandes e-commerce site internet
 */

'use client';

import { useMemo } from 'react';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { ErrorStateCard } from '@verone/ui';
import { KPICardUnified } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import {
  Package,
  Clock,
  CreditCard,
  Truck,
  CheckCircle,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface SiteOrder {
  id: string;
  customer_email: string;
  customer_name: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  currency: string;
  items: unknown;
  created_at: string | null;
  updated_at: string | null;
}

type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

// ── Supabase Client ────────────────────────────────────────────

const supabase = createClient();

// ── Fetch Function ─────────────────────────────────────────────

async function fetchSiteOrders(): Promise<SiteOrder[]> {
  const { data, error } = await supabase
    .from('site_orders')
    .select(
      'id, customer_email, customer_name, status, total, subtotal, shipping_cost, currency, items, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    console.error('[OrdersSection] fetch site_orders error:', error);
    throw new Error(error.message);
  }

  return (data as SiteOrder[]) ?? [];
}

// ── Helpers ────────────────────────────────────────────────────

function getStatusBadgeVariant(
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status as OrderStatus) {
    case 'paid':
      return 'default';
    case 'cancelled':
      return 'destructive';
    case 'pending':
    case 'shipped':
    case 'delivered':
      return 'secondary';
    default:
      return 'outline';
  }
}

function getStatusColor(status: string): string {
  switch (status as OrderStatus) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'paid':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'shipped':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'delivered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return '';
  }
}

function getStatusLabel(status: string): string {
  switch (status as OrderStatus) {
    case 'pending':
      return 'En attente';
    case 'paid':
      return 'Payee';
    case 'shipped':
      return 'Expediee';
    case 'delivered':
      return 'Livree';
    case 'cancelled':
      return 'Annulee';
    default:
      return status;
  }
}

function countItems(items: unknown): number {
  if (Array.isArray(items)) {
    return items.length;
  }
  return 0;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

// ── Component ──────────────────────────────────────────────────

/**
 * Section Commandes Principale
 */
export function OrdersSection() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['site-orders'],
    queryFn: fetchSiteOrders,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });

  // Stats
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const paid = orders.filter(o => o.status === 'paid').length;
    const shipped = orders.filter(o => o.status === 'shipped').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    return { total, pending, paid, shipped, delivered };
  }, [orders]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <ErrorStateCard
        title="Erreur de chargement"
        message={
          error instanceof Error
            ? error.message
            : 'Impossible de charger les commandes. Veuillez reessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(err => {
            console.error('[OrdersSection] refetch failed:', err);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <KPICardUnified
          variant="elegant"
          title="Total Commandes"
          value={stats.total}
          icon={ShoppingCart}
        />
        <KPICardUnified
          variant="elegant"
          title="En Attente"
          value={stats.pending}
          icon={Clock}
        />
        <KPICardUnified
          variant="elegant"
          title="Payees"
          value={stats.paid}
          icon={CreditCard}
        />
        <KPICardUnified
          variant="elegant"
          title="Expediees"
          value={stats.shipped}
          icon={Truck}
        />
        <KPICardUnified
          variant="elegant"
          title="Livrees"
          value={stats.delivered}
          icon={CheckCircle}
        />
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Commandes Site Internet</CardTitle>
          <CardDescription>
            {orders.length} commande{orders.length !== 1 ? 's' : ''} au total
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Table Commandes */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Articles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-50" />
                      <p>Aucune commande trouvee</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id}>
                    {/* Date */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>

                    {/* Client */}
                    <TableCell className="font-medium">
                      {order.customer_name}
                    </TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">
                      {order.customer_email}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>

                    {/* Statut */}
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(order.status)}
                        className={getStatusColor(order.status)}
                      >
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>

                    {/* Articles */}
                    <TableCell>
                      <Badge variant="outline">
                        {countItems(order.items)} article
                        {countItems(order.items) !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
