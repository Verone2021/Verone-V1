/**
 * Selections Performance Table
 *
 * Table affichant les performances des sélections LinkMe
 * Colonnes: Sélection, Affilié, Produits, Vues, Commandes, CA, Taux Conv.
 */

'use client';

import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import { Skeleton } from '@verone/ui';
import { Eye, ExternalLink, Package } from 'lucide-react';

import type { SelectionPerformance } from '../hooks/use-linkme-analytics';

interface SelectionsPerformanceTableProps {
  data: SelectionPerformance[];
  isLoading?: boolean;
  maxRows?: number;
}

export function SelectionsPerformanceTable({
  data,
  isLoading = false,
  maxRows = 5,
}: SelectionsPerformanceTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: maxRows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Package className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">Aucune sélection active</p>
      </div>
    );
  }

  const displayData = data.slice(0, maxRows);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-medium">Sélection</TableHead>
            <TableHead className="font-medium">Affilié</TableHead>
            <TableHead className="font-medium text-center">Produits</TableHead>
            <TableHead className="font-medium text-center">Vues</TableHead>
            <TableHead className="font-medium text-center">Commandes</TableHead>
            <TableHead className="font-medium text-right">CA HT</TableHead>
            <TableHead className="font-medium text-right">Conv.</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayData.map(selection => (
            <TableRow key={selection.id} className="hover:bg-gray-50/50">
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate max-w-[180px]">
                    {selection.name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {selection.affiliateName}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <span className="text-gray-600">{selection.productsCount}</span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1 text-gray-600">
                  <Eye className="h-3.5 w-3.5" />
                  <span>{selection.views}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="font-medium">{selection.orders}</span>
              </TableCell>
              <TableCell className="text-right">
                <span className="font-semibold">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                  }).format(selection.revenue)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <Badge
                  variant="outline"
                  className={
                    selection.conversionRate >= 5
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : selection.conversionRate >= 2
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                  }
                >
                  {selection.conversionRate.toFixed(1)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {data.length > maxRows && (
        <div className="mt-3 text-center">
          <Link
            href="/canaux-vente/linkme/selections"
            className="text-sm text-gray-500 hover:text-gray-900 inline-flex items-center gap-1"
          >
            Voir les {data.length} sélections
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
