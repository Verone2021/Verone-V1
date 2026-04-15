'use client';

/**
 * ProductSalesSection - Section ventes dans ProductDetailSheet
 *
 * @module ProductSalesSection
 * @since 2026-04-14
 */

import { useMemo, useState } from 'react';

import { Card } from '@tremor/react';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  Package,
  Receipt,
  ShoppingCart,
} from 'lucide-react';

import { useProductSalesDetail } from '@/lib/hooks/use-product-sales-detail';

// ============================================================================
// TYPES
// ============================================================================

type SortColumn = 'date' | 'orderNumber' | 'quantity' | null;
type SortDirection = 'asc' | 'desc';

const ORDER_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  validated: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const ORDER_STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  pending: 'En attente',
  validated: 'Validee',
  processing: 'En cours',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

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
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ProductSalesSectionProps {
  productId: string;
  commissionRate: number;
}

export function ProductSalesSection({
  productId,
  commissionRate,
}: ProductSalesSectionProps) {
  const { data: salesData, isLoading: salesLoading } =
    useProductSalesDetail(productId);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const availableYears = useMemo(() => {
    const sales = salesData?.sales ?? [];
    return [
      ...new Set(
        sales
          .map(s => new Date(s.orderDate).getFullYear())
          .filter(y => !isNaN(y))
      ),
    ].sort((a, b) => b - a);
  }, [salesData?.sales]);

  const sortedSales = useMemo(() => {
    let sales = salesData?.sales ?? [];
    if (yearFilter)
      sales = sales.filter(
        s => new Date(s.orderDate).getFullYear() === yearFilter
      );
    if (!sortColumn) return sales;
    return [...sales].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'date':
          comparison =
            new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime();
          break;
        case 'orderNumber':
          comparison = a.orderNumber.localeCompare(b.orderNumber);
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [salesData?.sales, yearFilter, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column)
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />;
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  const totalCommission = salesData?.totals
    ? salesData.totals.totalRevenueHT * (commissionRate / 100)
    : 0;
  const totalNet = salesData?.totals
    ? salesData.totals.totalRevenueHT - totalCommission
    : 0;

  if (salesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!salesData || salesData.sales.length === 0) {
    return (
      <div className="text-center py-6">
        <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Aucune vente pour ce produit</p>
      </div>
    );
  }

  return (
    <>
      {/* 4 Mini-KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border-l-4 border-[#7E84C0]">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3.5 w-3.5 text-[#7E84C0]" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Commandes
            </span>
          </div>
          <p className="text-lg font-bold text-[#7E84C0]">
            {salesData.totals.totalOrders}
          </p>
        </Card>
        <Card className="p-3 border-l-4 border-[#3976BB]">
          <div className="flex items-center gap-1.5 mb-1">
            <ShoppingCart className="h-3.5 w-3.5 text-[#3976BB]" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Quantite
            </span>
          </div>
          <p className="text-lg font-bold text-[#3976BB]">
            {salesData.totals.totalQuantity.toLocaleString('fr-FR')}
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
            {formatCurrency(salesData.totals.totalRevenueHT)}
          </p>
        </Card>
        <Card className="p-3 border-l-4 border-green-500">
          <div className="flex items-center gap-1.5 mb-1">
            <Receipt className="h-3.5 w-3.5 text-green-600" />
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Net encaisse
            </span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {formatCurrency(totalNet)}
          </p>
        </Card>
      </div>

      {/* Year filter */}
      {availableYears.length > 1 && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          <button
            onClick={() => setYearFilter(undefined)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${yearFilter === undefined ? 'bg-[#183559] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Toutes
          </button>
          {availableYears.map(year => (
            <button
              key={year}
              onClick={() => setYearFilter(year)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${yearFilter === year ? 'bg-[#183559] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Sales table */}
      <div className="mt-3 overflow-x-auto">
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
                Qte {renderSortIcon('quantity')}
              </th>
              <th className="text-right py-2.5 px-2 font-medium text-gray-500 text-xs">
                Total HT
              </th>
              <th className="text-right py-2.5 px-2 font-medium text-gray-500 text-xs">
                Net
              </th>
              <th className="text-center py-2.5 px-2 font-medium text-gray-500 text-xs">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedSales.map((sale, index) => {
              const lineCommission = sale.totalHT * (commissionRate / 100);
              const lineNet = sale.totalHT - lineCommission;
              const statusColor =
                ORDER_STATUS_COLORS[sale.orderStatus] ??
                ORDER_STATUS_COLORS.pending;
              const statusLabel =
                ORDER_STATUS_LABELS[sale.orderStatus] ?? sale.orderStatus;
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
                  <td className="py-2.5 px-2 text-gray-600">
                    {sale.customerName}
                  </td>
                  <td className="py-2.5 px-2 text-right font-medium">
                    {sale.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-[#183559]">
                    {formatCurrency(sale.totalHT)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-semibold text-green-600">
                    {formatCurrency(lineNet)}
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
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-center text-xs text-gray-400">
        {sortedSales.length} commande{sortedSales.length > 1 ? 's' : ''} ·{' '}
        {sortedSales
          .reduce((sum, s) => sum + s.quantity, 0)
          .toLocaleString('fr-FR')}{' '}
        unite
        {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1 ? 's' : ''}{' '}
        vendue
        {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1 ? 's' : ''} ·
        Commission LinkMe : {formatCurrency(totalCommission)} ({commissionRate}
        %)
      </div>
    </>
  );
}
