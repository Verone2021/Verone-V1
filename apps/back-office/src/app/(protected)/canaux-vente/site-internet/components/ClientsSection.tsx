/**
 * Composant: ClientsSection
 * Gestion des clients site internet (derives des commandes site_orders)
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
import { Users, ShoppingCart, Loader2 } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────

interface SiteOrderRow {
  customer_email: string;
  customer_name: string;
  total: number;
  currency: string;
  created_at: string | null;
}

interface ClientAggregate {
  email: string;
  name: string;
  orderCount: number;
  totalSpent: number;
  currency: string;
  lastOrderDate: string | null;
}

// ── Supabase Client ────────────────────────────────────────────

const supabase = createClient();

// ── Fetch Function ─────────────────────────────────────────────

async function fetchSiteOrdersForClients(): Promise<SiteOrderRow[]> {
  const { data, error } = await supabase
    .from('site_orders')
    .select('customer_email, customer_name, total, currency, created_at')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('[ClientsSection] fetch site_orders error:', error);
    throw new Error(error.message);
  }

  return (data as SiteOrderRow[]) ?? [];
}

// ── Helpers ────────────────────────────────────────────────────

function aggregateClients(orders: SiteOrderRow[]): ClientAggregate[] {
  const clientMap = new Map<string, ClientAggregate>();

  for (const order of orders) {
    const key = order.customer_email.toLowerCase();
    const existing = clientMap.get(key);

    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += order.total;
      // Keep most recent name
      if (
        order.created_at &&
        (!existing.lastOrderDate || order.created_at > existing.lastOrderDate)
      ) {
        existing.name = order.customer_name;
        existing.lastOrderDate = order.created_at;
      }
    } else {
      clientMap.set(key, {
        email: order.customer_email,
        name: order.customer_name,
        orderCount: 1,
        totalSpent: order.total,
        currency: order.currency,
        lastOrderDate: order.created_at,
      });
    }
  }

  // Sort by total spent descending
  return Array.from(clientMap.values()).sort(
    (a, b) => b.totalSpent - a.totalSpent
  );
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
 * Section Clients Principale
 */
export function ClientsSection() {
  const {
    data: orders = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['site-clients'],
    queryFn: fetchSiteOrdersForClients,
    staleTime: 300_000,
    refetchOnWindowFocus: true,
  });

  // Aggregate clients from orders
  const clients = useMemo(() => aggregateClients(orders), [orders]);

  // Stats
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalOrders = orders.length;
    const totalRevenue = clients.reduce((sum, c) => sum + c.totalSpent, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return { totalClients, totalOrders, totalRevenue, avgOrderValue };
  }, [clients, orders]);

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
            : 'Impossible de charger les clients. Veuillez reessayer.'
        }
        variant="destructive"
        onRetry={() => {
          void refetch().catch(err => {
            console.error('[ClientsSection] refetch failed:', err);
          });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICardUnified
          variant="elegant"
          title="Clients Uniques"
          value={stats.totalClients}
          icon={Users}
        />
        <KPICardUnified
          variant="elegant"
          title="Total Commandes"
          value={stats.totalOrders}
          icon={ShoppingCart}
        />
        <KPICardUnified
          variant="elegant"
          title="Chiffre d'Affaires"
          value={`${stats.totalRevenue.toFixed(0)} EUR`}
          icon={ShoppingCart}
        />
        <KPICardUnified
          variant="elegant"
          title="Panier Moyen"
          value={`${stats.avgOrderValue.toFixed(0)} EUR`}
          icon={ShoppingCart}
        />
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Clients Site Internet</CardTitle>
          <CardDescription>
            {clients.length} client{clients.length !== 1 ? 's' : ''} unique
            {clients.length !== 1 ? 's' : ''} (issus des commandes)
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Table Clients */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Commandes</TableHead>
                <TableHead>Total Depense</TableHead>
                <TableHead>Derniere Commande</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Users className="h-8 w-8 opacity-50" />
                      <p>Aucun client trouve</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map(client => (
                  <TableRow key={client.email}>
                    {/* Nom */}
                    <TableCell className="font-medium">{client.name}</TableCell>

                    {/* Email */}
                    <TableCell className="text-sm text-muted-foreground">
                      {client.email}
                    </TableCell>

                    {/* Nombre commandes */}
                    <TableCell>
                      <Badge variant="outline">
                        {client.orderCount} commande
                        {client.orderCount !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>

                    {/* Total depense */}
                    <TableCell className="font-medium">
                      {formatCurrency(client.totalSpent, client.currency)}
                    </TableCell>

                    {/* Derniere commande */}
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(client.lastOrderDate)}
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
