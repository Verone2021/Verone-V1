'use client';

/**
 * ProductSalesDetailModal
 * Modal affichant le détail de toutes les ventes d'un produit spécifique.
 *
 * - 4 mini-KPIs : commandes, quantité, CA HT, CA TTC
 * - Tableau des ventes triable par date, N° commande, quantité
 * - Badges statut colorés
 *
 * @module ProductSalesDetailModal
 * @since 2026-02-10
 */

import { useState, useMemo, useEffect } from 'react';

import Image from 'next/image';

import { Card } from '@tremor/react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Receipt,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';

import { useProductSalesDetail } from '@/lib/hooks/use-product-sales-detail';

// ============================================
// CONSTANTS
// ============================================

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  validated: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  validated: 'Validée',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const SOURCE_BADGE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  catalogue: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Catalogue' },
  'mes-produits': {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    label: 'Mes produits',
  },
  'sur-mesure': {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    label: 'Sur-mesure',
  },
};

// ============================================
// HELPERS
// ============================================

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: fr });
  } catch {
    return '-';
  }
}

// ============================================
// TYPES
// ============================================

type SortColumn = 'date' | 'orderNumber' | 'quantity' | null;
type SortDirection = 'asc' | 'desc';

interface ProductSalesDetailModalProps {
  productId: string | null;
  onClose: () => void;
}

// ============================================
// SORT HELPERS
// ============================================

/**
 * Parse un numéro de commande pour tri chronologique.
 * 4 formats coexistent en base :
 * - LINK-23NNNN → année 23, séquence NNNN (collés, 2023-2024)
 * - F-25-NNN   → année 25, séquence NNN (séparés, 2025)
 * - SO-2026-NNNNN → année 2026, séquence NNNNN (2026+)
 * - [TEST]-CMD-NNN → format test (fallback)
 * Retourne [année 4 chiffres, séquence] pour tri naturel.
 */
function parseOrderNumber(orderNumber: string): [number, number] {
  // LINK-23NNNN → année 23, séquence NNNN (collés)
  const linkMatch = orderNumber.match(/^LINK-(\d{2})(\d{4})$/);
  if (linkMatch) {
    return [parseInt(linkMatch[1], 10) + 2000, parseInt(linkMatch[2], 10)];
  }
  // F-25-NNN → année 25, séquence NNN (séparés)
  const fMatch = orderNumber.match(/^F-(\d{2})-(\d+)$/);
  if (fMatch) {
    return [parseInt(fMatch[1], 10) + 2000, parseInt(fMatch[2], 10)];
  }
  // SO-2026-NNNNN → année 2026, séquence NNNNN
  const soMatch = orderNumber.match(/^SO-(\d{4})-(\d+)$/);
  if (soMatch) {
    return [parseInt(soMatch[1], 10), parseInt(soMatch[2], 10)];
  }
  // Fallback : essayer d'extraire des chiffres
  const nums = orderNumber.match(/(\d+)/g);
  if (nums && nums.length >= 2) {
    return [parseInt(nums[0], 10), parseInt(nums[1], 10)];
  }
  return [0, 0];
}

// ============================================
// COMPONENT
// ============================================

export function ProductSalesDetailModal({
  productId,
  onClose,
}: ProductSalesDetailModalProps): JSX.Element | null {
  const { data, isLoading } = useProductSalesDetail(productId);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const isOpen = productId !== null;

  // Reset filters quand le produit change
  useEffect(() => {
    setYearFilter(undefined);
    setSortColumn(null);
    setSortDirection('desc');
  }, [productId]);

  // Années disponibles (extraites des dates de commande)
  const availableYears = useMemo(() => {
    const sales = data?.sales ?? [];
    const years = [
      ...new Set(
        sales
          .map(s => new Date(s.orderDate).getFullYear())
          .filter(y => !isNaN(y))
      ),
    ].sort((a, b) => b - a);
    return years;
  }, [data?.sales]);

  // Tri des ventes (avec filtre année)
  const sortedSales = useMemo(() => {
    let sales = data?.sales ?? [];

    // Filtre année
    if (yearFilter) {
      sales = sales.filter(
        s => new Date(s.orderDate).getFullYear() === yearFilter
      );
    }

    if (!sortColumn) return sales;

    return [...sales].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'date':
          comparison =
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case 'orderNumber': {
          const [yearA, seqA] = parseOrderNumber(a.orderNumber);
          const [yearB, seqB] = parseOrderNumber(b.orderNumber);
          comparison = yearA !== yearB ? yearA - yearB : seqA - seqB;
          break;
        }
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data?.sales, yearFilter, sortColumn, sortDirection]);

  // Toggle tri (même pattern que back-office)
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Icône tri (même pattern que back-office)
  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* DialogTitle toujours présent pour accessibilité (Radix requirement) */}
        {isLoading ? (
          <div className="space-y-6 p-2">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-[#183559]">
                Chargement...
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-20 bg-gray-200 rounded"
                />
              ))}
            </div>
            <div className="animate-pulse h-48 bg-gray-200 rounded" />
          </div>
        ) : data ? (
          <>
            {/* Header - pas de bouton X custom, DialogContent en a déjà un */}
            <DialogHeader>
              <div className="flex items-center gap-3">
                {/* Product image */}
                <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {data.productImageUrl ? (
                    <Image
                      src={data.productImageUrl}
                      alt={data.productName}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-lg font-semibold text-[#183559]">
                      {data.productName}
                    </DialogTitle>
                    {SOURCE_BADGE_STYLES[data.productSource] && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${SOURCE_BADGE_STYLES[data.productSource].bg} ${SOURCE_BADGE_STYLES[data.productSource].text}`}
                      >
                        {SOURCE_BADGE_STYLES[data.productSource].label}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    SKU : {data.productSku || 'N/A'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            {/* 4 Mini-KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
              <Card className="p-3 border-l-4 border-[#7E84C0]">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5 text-[#7E84C0]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Commandes
                  </span>
                </div>
                <p className="text-lg font-bold text-[#7E84C0]">
                  {data.totals.totalOrders}
                </p>
              </Card>

              <Card className="p-3 border-l-4 border-[#3976BB]">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShoppingCart className="h-3.5 w-3.5 text-[#3976BB]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    Quantité
                  </span>
                </div>
                <p className="text-lg font-bold text-[#3976BB]">
                  {data.totals.totalQuantity.toLocaleString('fr-FR')}
                </p>
              </Card>

              <Card className="p-3 border-l-4 border-[#183559]">
                <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-[#183559]" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    CA HT
                  </span>
                </div>
                <p className="text-lg font-bold text-[#183559]">
                  {formatCurrency(data.totals.totalRevenueHT)}
                </p>
              </Card>

              <Card className="p-3 border-l-4 border-[#183559]/60">
                <div className="flex items-center gap-1.5 mb-1">
                  <Receipt className="h-3.5 w-3.5 text-[#183559]/70" />
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                    CA TTC
                  </span>
                </div>
                <p className="text-lg font-bold text-[#183559]/70">
                  {formatCurrency(data.totals.totalRevenueTTC)}
                </p>
              </Card>
            </div>

            {/* Filtre par année */}
            {availableYears.length > 1 && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                <button
                  onClick={() => setYearFilter(undefined)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    yearFilter === undefined
                      ? 'bg-[#183559] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Toutes
                </button>
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setYearFilter(year)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      yearFilter === year
                        ? 'bg-[#183559] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}

            {/* Sales table */}
            <div className="mt-4 overflow-x-auto">
              {data.sales.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Aucune vente pour ce produit
                  </p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th
                        className="text-left py-2.5 px-2 font-medium text-gray-500 text-xs cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('date')}
                      >
                        Date {renderSortIcon('date')}
                      </th>
                      <th
                        className="text-left py-2.5 px-2 font-medium text-gray-500 text-xs cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('orderNumber')}
                      >
                        N° commande {renderSortIcon('orderNumber')}
                      </th>
                      <th className="text-left py-2.5 px-2 font-medium text-gray-500 text-xs">
                        Client
                      </th>
                      <th
                        className="text-right py-2.5 px-2 font-medium text-gray-500 text-xs cursor-pointer hover:text-gray-700 select-none"
                        onClick={() => handleSort('quantity')}
                      >
                        Qté {renderSortIcon('quantity')}
                      </th>
                      <th className="text-right py-2.5 px-2 font-medium text-gray-500 text-xs">
                        Total HT
                      </th>
                      <th className="text-center py-2.5 px-2 font-medium text-gray-500 text-xs">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {sortedSales.map((sale, index) => {
                      const statusColor =
                        STATUS_COLORS[sale.orderStatus] ??
                        STATUS_COLORS.pending;
                      const statusLabel =
                        STATUS_LABELS[sale.orderStatus] ?? sale.orderStatus;

                      return (
                        <tr
                          key={`${sale.orderId}-${index}`}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="py-2.5 px-2 text-gray-600">
                            {formatDate(sale.orderDate)}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-[#183559]">
                            {sale.orderNumber}
                          </td>
                          <td className="py-2.5 px-2 text-gray-600 truncate max-w-[150px]">
                            {sale.customerName}
                          </td>
                          <td className="py-2.5 px-2 text-right font-medium">
                            {sale.quantity}
                          </td>
                          <td className="py-2.5 px-2 text-right font-semibold text-[#183559]">
                            {formatCurrency(sale.totalHT)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor}`}
                            >
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            {data.sales.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center text-xs text-gray-400">
                {sortedSales.length} commande
                {sortedSales.length > 1 ? 's' : ''}
                {yearFilter ? ` en ${yearFilter}` : ''} ·{' '}
                {sortedSales
                  .reduce((sum, s) => sum + s.quantity, 0)
                  .toLocaleString('fr-FR')}{' '}
                unité
                {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1
                  ? 's'
                  : ''}{' '}
                vendue
                {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1
                  ? 's'
                  : ''}
                {yearFilter && data.totals.totalOrders !== sortedSales.length
                  ? ` (${data.totals.totalOrders} au total)`
                  : ''}
              </div>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
