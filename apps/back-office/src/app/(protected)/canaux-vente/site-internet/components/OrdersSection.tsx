/**
 * Composant: OrdersSection
 * Gestion des commandes e-commerce site internet
 */

'use client';

import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
import { toast } from 'sonner';

import { OrderDetailModal } from './OrderDetailModal';

// ── Types ──────────────────────────────────────────────────────

interface SiteOrder {
  id: string;
  order_number: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  shipping_address: string | null;
  billing_address: string | null;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  total_ht: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
  currency: string;
  items: unknown;
  stripe_session_id: string | null;
  discount_code: string | null;
  discount_amount: number;
  invoice_number: string | null;
  invoice_date: string | null;
  shipping_method: string | null;
  payment_method: string | null;
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
      'id, order_number, customer_email, customer_name, customer_phone, shipping_address, billing_address, status, total, subtotal, shipping_cost, total_ht, tax_amount, tax_rate, currency, items, stripe_session_id, discount_code, discount_amount, invoice_number, invoice_date, shipping_method, payment_method, created_at, updated_at'
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
  const [selectedOrder, setSelectedOrder] = useState<SiteOrder | null>(null);
  const queryClient = useQueryClient();
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

  // Update order status + trigger email
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      orderId,
      newStatus,
      customerEmail,
      customerName,
    }: {
      orderId: string;
      newStatus: string;
      customerEmail: string;
      customerName: string;
    }) => {
      const { error: updateError } = await supabase
        .from('site_orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Trigger status-specific email (non-blocking)
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_INTERNET_URL ?? 'http://localhost:3001';

      const emailEndpoints: Record<string, string> = {
        shipped: '/api/emails/shipping-notification',
        delivered: '/api/emails/delivery-confirmation',
      };

      const endpoint = emailEndpoints[newStatus];
      if (endpoint) {
        void fetch(`${siteUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            customerName,
            orderId,
          }),
        }).catch(emailErr => {
          console.error('[OrdersSection] Email trigger failed:', emailErr);
        });
      }

      // Generic status update email for other statuses
      if (!endpoint && newStatus !== 'paid') {
        void fetch(`${siteUrl}/api/emails/order-status-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: customerEmail,
            customerName,
            orderId,
            newStatus,
          }),
        }).catch(emailErr => {
          console.error('[OrdersSection] Status email failed:', emailErr);
        });
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['site-orders'] });
      toast.success('Statut mis \u00e0 jour');
    },
    onError: (err: Error) => {
      console.error('[OrdersSection] Status update failed:', err);
      toast.error('Erreur : ' + err.message);
    },
  });

  const handleStatusChange = useCallback(
    (order: SiteOrder, newStatus: string) => {
      updateStatusMutation.mutate({
        orderId: order.id,
        newStatus,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
      });
    },
    [updateStatusMutation]
  );

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
                <TableHead>Commande</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Articles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Package className="h-8 w-8 opacity-50" />
                      <p>Aucune commande trouvee</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedOrder(order)}
                  >
                    {/* Order Number */}
                    <TableCell className="font-mono text-sm font-medium">
                      {order.order_number ?? order.id.slice(0, 8)}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.created_at)}
                    </TableCell>

                    {/* Client */}
                    <TableCell className="font-medium">
                      {order.customer_name}
                    </TableCell>

                    {/* Total */}
                    <TableCell className="font-medium">
                      {formatCurrency(order.total, order.currency)}
                    </TableCell>

                    {/* Statut - Dropdown changement */}
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Select
                        value={order.status}
                        onValueChange={newStatus =>
                          handleStatusChange(order, newStatus)
                        }
                        disabled={updateStatusMutation.isPending}
                      >
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue>
                            <Badge
                              variant={getStatusBadgeVariant(order.status)}
                              className={getStatusColor(order.status)}
                            >
                              {getStatusLabel(order.status)}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="paid">Pay\u00e9e</SelectItem>
                          <SelectItem value="shipped">
                            Exp\u00e9di\u00e9e
                          </SelectItem>
                          <SelectItem value="delivered">Livr\u00e9e</SelectItem>
                          <SelectItem value="cancelled">
                            Annul\u00e9e
                          </SelectItem>
                        </SelectContent>
                      </Select>
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

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        open={selectedOrder !== null}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={(order, newStatus) => {
          handleStatusChange(order, newStatus);
          setSelectedOrder({ ...order, status: newStatus });
        }}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
}
