/**
 * ClientsSection - Clients particuliers du canal Site Internet
 *
 * Affiche les individual_customers avec source_type='site-internet'.
 * Ces clients sont créés automatiquement par le checkout Stripe.
 *
 * Fonctionnalités :
 * - KPIs : clients actifs, clients actifs (6 mois), LTV moyenne, panier moyen
 * - Tableau avec tri par colonne et pagination côté client (via CustomersTable)
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
  Users,
  Search,
  UserCheck,
  TrendingUp,
  ShoppingCart,
  Loader2,
} from 'lucide-react';

import { useSiteCustomers } from '../hooks/use-site-customers';
import { useSiteCustomersKpis } from '../hooks/use-site-customers-kpis';

import { CustomerDetailModal } from './CustomerDetailModal';
import { CustomersTable } from './CustomersTable';

import type { SiteCustomer } from '../hooks/use-site-customers';
import type { SortKey, SortDir } from './CustomersTable';

// ── Constantes ────────────────────────────────────────────────────
const PAGE_SIZE = 20;

// ── Helpers ───────────────────────────────────────────────────────

function formatEur(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

// ── Composant KPI card ─────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  label,
  description,
  value,
  loading,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  description?: string;
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
            {description && (
              <p className="text-xs text-gray-400">{description}</p>
            )}
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
      let valA: string;
      let valB: string;

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
        valA = a.created_at ?? '';
        valB = b.created_at ?? '';
      }

      if (valA === valB) return 0;
      const cmp = valA < valB ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
          label="Clients actifs"
          description="Source site-internet, actifs"
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

          {/* Contenu */}
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
            <CustomersTable
              customers={paginated}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              page={page}
              pageSize={PAGE_SIZE}
              total={sorted.length}
              totalPages={totalPages}
              onPageChange={setPage}
              onRowClick={setSelectedCustomer}
            />
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
