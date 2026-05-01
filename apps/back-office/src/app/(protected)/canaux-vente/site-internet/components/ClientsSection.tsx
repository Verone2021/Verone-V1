/**
 * ClientsSection - Clients particuliers du canal Site Internet
 *
 * Affiche les individual_customers avec source_type='site-internet'.
 * Ces clients sont créés automatiquement par le checkout Stripe.
 *
 * Fonctionnalités :
 * - KPIs : total clients, clients actifs (6 mois), LTV moyenne, panier moyen
 * - Tableau avec tri par colonne et pagination côté client
 * - Recherche textuelle (nom, email, ville, téléphone)
 */

'use client';

import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Button } from '@verone/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  TrendingUp,
  ShoppingCart,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { useSiteCustomers } from '../hooks/use-site-customers';
import { useSiteCustomersKpis } from '../hooks/use-site-customers-kpis';

import { CustomerDetailModal } from './CustomerDetailModal';

import type { SiteCustomer } from '../hooks/use-site-customers';

// ── Constantes ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

type SortKey = 'last_name' | 'email' | 'city' | 'created_at';
type SortDir = 'asc' | 'desc';

// ── Helpers ───────────────────────────────────────────────────────

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

function SortIcon({
  column,
  sortKey,
  sortDir,
}: {
  column: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
}) {
  if (sortKey !== column)
    return <ChevronsUpDown className="h-3.5 w-3.5 ml-1 opacity-40" />;
  return sortDir === 'asc' ? (
    <ChevronUp className="h-3.5 w-3.5 ml-1" />
  ) : (
    <ChevronDown className="h-3.5 w-3.5 ml-1" />
  );
}

// ── Composant KPI card ─────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  value,
  loading,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  loading: boolean;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${iconColor}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-gray-300" />
            ) : (
              <p className="text-xl font-bold text-gray-900">{value}</p>
            )}
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Composant principal ───────────────────────────────────────────

export function ClientsSection() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<SiteCustomer | null>(
    null
  );
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);

  const { data: customers, isLoading, error } = useSiteCustomers();
  const { data: kpis, isLoading: kpisLoading } = useSiteCustomersKpis();

  // Filtrage par recherche
  const filtered = useMemo(() => {
    if (!customers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c => {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.toLowerCase();
      return (
        name.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.includes(q) ?? false) ||
        (c.city?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [customers, search]);

  // Tri
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: string | null;
      let valB: string | null;

      if (sortKey === 'last_name') {
        valA = `${a.last_name ?? ''} ${a.first_name ?? ''}`.toLowerCase();
        valB = `${b.last_name ?? ''} ${b.first_name ?? ''}`.toLowerCase();
      } else if (sortKey === 'email') {
        valA = a.email?.toLowerCase() ?? '';
        valB = b.email?.toLowerCase() ?? '';
      } else if (sortKey === 'city') {
        valA = a.city?.toLowerCase() ?? '';
        valB = b.city?.toLowerCase() ?? '';
      } else {
        // created_at
        valA = a.created_at ?? '';
        valB = b.created_at ?? '';
      }

      if (valA === valB) return 0;
      const cmp = (valA ?? '') < (valB ?? '') ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Réinitialiser la page à 0 lors d'une recherche ou d'un changement de tri
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-600">
          Erreur lors du chargement des clients.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Total clients"
          value={kpis ? String(kpis.totalCustomers) : '—'}
          loading={kpisLoading}
          iconColor="bg-blue-50 text-blue-600"
        />
        <KpiCard
          icon={UserCheck}
          label="Clients actifs (6 mois)"
          value={kpis ? String(kpis.activeCustomers) : '—'}
          loading={kpisLoading}
          iconColor="bg-green-50 text-green-600"
        />
        <KpiCard
          icon={TrendingUp}
          label="LTV moyenne"
          value={kpis ? formatEur(kpis.averageLtv) : '—'}
          loading={kpisLoading}
          iconColor="bg-purple-50 text-purple-600"
        />
        <KpiCard
          icon={ShoppingCart}
          label="Panier moyen"
          value={kpis ? formatEur(kpis.averageOrderValue) : '—'}
          loading={kpisLoading}
          iconColor="bg-orange-50 text-orange-600"
        />
      </div>

      {/* Table clients */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Clients du site internet
              </CardTitle>
              <CardDescription>
                Clients particuliers créés via le checkout du site (
                {customers?.length ?? 0} clients)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recherche */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Rechercher par nom, email, ville..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {search
                ? 'Aucun client ne correspond à la recherche.'
                : 'Aucun client site internet pour le moment.'}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center text-left font-medium hover:text-gray-900"
                          onClick={() => handleSort('last_name')}
                        >
                          Client
                          <SortIcon
                            column="last_name"
                            sortKey={sortKey}
                            sortDir={sortDir}
                          />
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          type="button"
                          className="flex items-center text-left font-medium hover:text-gray-900"
                          onClick={() => handleSort('email')}
                        >
                          Contact
                          <SortIcon
                            column="email"
                            sortKey={sortKey}
                            sortDir={sortDir}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        <button
                          type="button"
                          className="flex items-center text-left font-medium hover:text-gray-900"
                          onClick={() => handleSort('city')}
                        >
                          Localisation
                          <SortIcon
                            column="city"
                            sortKey={sortKey}
                            sortDir={sortDir}
                          />
                        </button>
                      </TableHead>
                      <TableHead className="hidden xl:table-cell">
                        <button
                          type="button"
                          className="flex items-center text-left font-medium hover:text-gray-900"
                          onClick={() => handleSort('created_at')}
                        >
                          Inscrit le
                          <SortIcon
                            column="created_at"
                            sortKey={sortKey}
                            sortDir={sortDir}
                          />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map(customer => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <TableCell className="font-medium">
                          {customer.first_name} {customer.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {customer.email && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {(customer.city ?? customer.postal_code) && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5" />
                              {[customer.postal_code, customer.city]
                                .filter(Boolean)
                                .join(' ')}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-sm text-gray-500">
                          {customer.created_at
                            ? format(
                                new Date(customer.created_at),
                                'dd MMM yyyy',
                                { locale: fr }
                              )
                            : '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Page {page + 1} / {totalPages} ({sorted.length} résultats)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="h-8 px-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage(p => Math.min(totalPages - 1, p + 1))
                      }
                      disabled={page >= totalPages - 1}
                      className="h-8 px-2"
                    >
                      Suivant
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          open={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
