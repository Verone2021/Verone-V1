'use client';

/**
 * ProductDetailSheet - Dialog centre de consultation produit
 *
 * Remplace l'ancien Sheet lateral (trop etroit, noms clients tronques).
 * Meme pattern que ProductSalesDetailModal dans statistiques/produits.
 *
 * Sections: Photo + Infos, Tarification, Stockage/Dimensions, Ventes
 *
 * @module ProductDetailSheet
 * @since 2026-03-04
 */

import { useState, useMemo, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Card } from '@tremor/react';
import {
  Package,
  Euro,
  Ruler,
  Warehouse,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  AlertCircle,
  ExternalLink,
  FileText,
  ShoppingCart,
  DollarSign,
  Receipt,
  Calendar,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@verone/ui';

import type { AffiliateProduct } from '@/lib/hooks/use-affiliate-products';
import { useProductSalesDetail } from '@/lib/hooks/use-product-sales-detail';

// ============================================
// CONSTANTS
// ============================================

const STATUS_CONFIG = {
  draft: {
    label: 'Brouillon',
    icon: FileEdit,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  pending_approval: {
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  approved: {
    label: 'Approuve',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  rejected: {
    label: 'Rejete',
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
} as const;

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
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

// ============================================
// TYPES
// ============================================

type SortColumn = 'date' | 'orderNumber' | 'quantity' | null;
type SortDirection = 'asc' | 'desc';

interface ProductDetailSheetProps {
  product: AffiliateProduct;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ProductDetailSheet({
  product,
  isOpen,
  onClose,
}: ProductDetailSheetProps): JSX.Element {
  const status = product.affiliate_approval_status;
  const config = STATUS_CONFIG[status];
  const StatusIcon = config.icon;
  const isDraft = status === 'draft';
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved';
  const canEdit = isDraft || isRejected;

  // Pricing
  const commissionRate = product.affiliate_commission_rate || 0;
  const prixVenteHt = product.affiliate_payout_ht || 0;
  const commissionMontant = prixVenteHt * (commissionRate / 100);
  const encaissementNet = prixVenteHt - commissionMontant;

  // Dimensions
  const dims = product.dimensions;
  const hasDimensions = dims?.length_cm && dims?.width_cm && dims?.height_cm;
  const volumeM3 = hasDimensions
    ? (dims.length_cm! * dims.width_cm! * dims.height_cm!) / 1_000_000
    : 0;

  // Sales data (only for approved products)
  const { data: salesData, isLoading: salesLoading } = useProductSalesDetail(
    isApproved ? product.id : null
  );

  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  // Reset filters when product changes
  useEffect(() => {
    setYearFilter(undefined);
    setSortColumn(null);
    setSortDirection('desc');
  }, [product.id]);

  // Available years
  const availableYears = useMemo(() => {
    const sales = salesData?.sales ?? [];
    const years = [
      ...new Set(
        sales
          .map(s => new Date(s.orderDate).getFullYear())
          .filter(y => !isNaN(y))
      ),
    ].sort((a, b) => b - a);
    return years;
  }, [salesData?.sales]);

  // Sorted/filtered sales
  const sortedSales = useMemo(() => {
    let sales = salesData?.sales ?? [];
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
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline" />
    );
  };

  // Commission totals for sales
  const totalCommission = salesData?.totals
    ? salesData.totals.totalRevenueHT * (commissionRate / 100)
    : 0;
  const totalNet = salesData?.totals
    ? salesData.totals.totalRevenueHT - totalCommission
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-start gap-4">
            {product.product_image_url ? (
              <Image
                src={product.product_image_url}
                alt={product.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-lg font-semibold text-[#183559]">
                  {product.name}
                </DialogTitle>
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${config.bgColor} ${config.color} border-0`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-gray-400 font-mono mt-1">
                SKU : {product.sku}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Rejection reason */}
        {isRejected && product.affiliate_rejection_reason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">
                  Motif du rejet
                </p>
                <p className="text-sm text-red-700 mt-0.5">
                  {product.affiliate_rejection_reason}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info grid: Tarification + Stockage side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Tarification */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Euro className="h-3.5 w-3.5" />
              Tarification
            </h3>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100 text-sm">
              <InfoRow
                label="Prix de vente HT"
                value={`${prixVenteHt.toFixed(2)} €`}
              />
              {commissionRate > 0 ? (
                <>
                  <InfoRow
                    label="Commission LinkMe"
                    value={`${commissionRate}% (${commissionMontant.toFixed(2)} €)`}
                  />
                  <InfoRow
                    label="Encaissement net"
                    value={`${encaissementNet.toFixed(2)} €`}
                    valueClassName="text-green-600 font-bold"
                  />
                </>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-xs text-blue-600">
                    Commission definie par Verone apres approbation
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stockage & Dimensions */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Stockage & expedition
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                {product.store_at_verone ? (
                  <>
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Warehouse className="h-3.5 w-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Stocke chez Verone
                      </p>
                      <p className="text-xs text-gray-500">
                        Verone gere le stock et les envois
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <Truck className="h-3.5 w-3.5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        Gestion autonome
                      </p>
                      <p className="text-xs text-gray-500">
                        Vous envoyez directement au client
                      </p>
                    </div>
                  </>
                )}
              </div>
              {hasDimensions && (
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-gray-200">
                  <DimensionBox label="L" value={dims.length_cm!} />
                  <DimensionBox label="l" value={dims.width_cm!} />
                  <DimensionBox label="H" value={dims.height_cm!} />
                </div>
              )}
              {hasDimensions && volumeM3 > 0 && (
                <p className="text-xs text-gray-400 mt-1 text-center">
                  Volume : {volumeM3 < 0.001 ? '< 0.001' : volumeM3.toFixed(3)}{' '}
                  m³
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {product.description && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Description
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {product.description}
            </p>
          </div>
        )}

        {/* Sales section (approved products only) */}
        {isApproved && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {salesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : salesData && salesData.sales.length > 0 ? (
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
                        const lineCommission =
                          sale.totalHT * (commissionRate / 100);
                        const lineNet = sale.totalHT - lineCommission;
                        const statusColor =
                          ORDER_STATUS_COLORS[sale.orderStatus] ??
                          ORDER_STATUS_COLORS.pending;
                        const statusLabel =
                          ORDER_STATUS_LABELS[sale.orderStatus] ??
                          sale.orderStatus;

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
                  {sortedSales.length} commande
                  {sortedSales.length > 1 ? 's' : ''} ·{' '}
                  {sortedSales
                    .reduce((sum, s) => sum + s.quantity, 0)
                    .toLocaleString('fr-FR')}{' '}
                  unite
                  {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1
                    ? 's'
                    : ''}{' '}
                  vendue
                  {sortedSales.reduce((sum, s) => sum + s.quantity, 0) > 1
                    ? 's'
                    : ''}{' '}
                  · Commission LinkMe : {formatCurrency(totalCommission)} (
                  {commissionRate}%)
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  Aucune vente pour ce produit
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit action */}
        {canEdit && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link
              href={`/mes-produits/${product.id}?edit=true`}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-white bg-[#5DBEBB] hover:bg-[#5DBEBB]/90 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Modifier ce produit
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---- Sub-components ----

function InfoRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}): JSX.Element {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-sm font-medium text-gray-800 ${valueClassName ?? ''}`}
      >
        {value}
      </span>
    </div>
  );
}

function DimensionBox({
  label,
  value,
}: {
  label: string;
  value: number;
}): JSX.Element {
  return (
    <div className="text-center bg-white rounded-lg p-1.5 border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value} cm</p>
    </div>
  );
}
