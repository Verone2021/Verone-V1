/**
 * CustomersTable — sous-composant de ClientsSection
 *
 * Affiche le tableau des clients site-internet avec tri par colonne
 * et pagination. Extrait de ClientsSection pour respecter la limite 400 lignes.
 */

'use client';

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
  Mail,
  Phone,
  MapPin,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import type { SiteCustomer } from '../hooks/use-site-customers';

// ── Types ──────────────────────────────────────────────────────────

export type SortKey = 'last_name' | 'email' | 'city' | 'created_at';
export type SortDir = 'asc' | 'desc';

interface CustomersTableProps {
  customers: SiteCustomer[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRowClick: (customer: SiteCustomer) => void;
}

// ── Helpers ────────────────────────────────────────────────────────

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

// ── Composant ──────────────────────────────────────────────────────

export function CustomersTable({
  customers,
  sortKey,
  sortDir,
  onSort,
  page,
  totalPages,
  total,
  onPageChange,
  onRowClick,
}: CustomersTableProps) {
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center text-left font-medium hover:text-gray-900"
                  onClick={() => onSort('last_name')}
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
                  onClick={() => onSort('email')}
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
                  onClick={() => onSort('city')}
                >
                  Localisation
                  <SortIcon column="city" sortKey={sortKey} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead className="hidden xl:table-cell">
                <button
                  type="button"
                  className="flex items-center text-left font-medium hover:text-gray-900"
                  onClick={() => onSort('created_at')}
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
            {customers.map(customer => (
              <TableRow
                key={customer.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onRowClick(customer)}
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
                    ? format(new Date(customer.created_at), 'dd MMM yyyy', {
                        locale: fr,
                      })
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
            Page {page + 1} / {totalPages} ({total} résultats)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(0, page - 1))}
              disabled={page === 0}
              className="h-8 px-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
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
  );
}
