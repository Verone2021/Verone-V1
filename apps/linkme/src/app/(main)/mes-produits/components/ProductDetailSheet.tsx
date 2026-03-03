'use client';

/**
 * ProductDetailSheet - Sheet lateral de consultation produit
 *
 * Affiche les infos produit de facon lisible (pas un formulaire)
 * Sections: Photo + Infos, Tarification, Stockage/Dimensions, Statut
 *
 * @module ProductDetailSheet
 * @since 2026-03-03
 */

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Badge,
} from '@verone/ui';
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
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { AffiliateProduct } from '@/lib/hooks/use-affiliate-products';
import { useProductSalesDetail } from '@/lib/hooks/use-product-sales-detail';

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

interface ProductDetailSheetProps {
  product: AffiliateProduct;
  isOpen: boolean;
  onClose: () => void;
}

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

  return (
    <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        <SheetHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-start gap-4">
            {product.product_image_url ? (
              <Image
                src={product.product_image_url}
                alt={product.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-semibold text-[#183559] leading-tight">
                {product.name}
              </SheetTitle>
              <p className="text-sm text-gray-400 font-mono mt-1">
                {product.sku}
              </p>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`text-xs px-2 py-0.5 ${config.bgColor} ${config.color} border-0`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-6">
          {/* Rejection reason */}
          {isRejected && product.affiliate_rejection_reason && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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

          {/* Description */}
          {product.description && (
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </section>
          )}

          {/* Tarification */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Tarification
            </h3>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
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
          </section>

          {/* Stockage & Dimensions */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Stockage & expedition
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                {product.store_at_verone ? (
                  <>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Warehouse className="h-4 w-4 text-blue-600" />
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
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Truck className="h-4 w-4 text-amber-600" />
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
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-200">
                  <DimensionBox label="L" value={dims.length_cm!} />
                  <DimensionBox label="l" value={dims.width_cm!} />
                  <DimensionBox label="H" value={dims.height_cm!} />
                </div>
              )}

              {hasDimensions && volumeM3 > 0 && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Volume : {volumeM3 < 0.001 ? '< 0.001' : volumeM3.toFixed(3)}{' '}
                  m³
                </p>
              )}
            </div>
          </section>

          {/* Dates */}
          <section>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Dates
            </h3>
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-100">
              <InfoRow
                label="Cree le"
                value={new Date(product.created_at).toLocaleDateString(
                  'fr-FR',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              />
              <InfoRow
                label="Modifie le"
                value={new Date(product.updated_at).toLocaleDateString(
                  'fr-FR',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  }
                )}
              />
            </div>
          </section>

          {/* Historique des ventes (produits approuvés uniquement) */}
          {isApproved && (
            <SalesHistorySection
              productId={product.id}
              commissionRate={commissionRate}
            />
          )}

          {/* Actions */}
          {canEdit && (
            <Link
              href={`/mes-produits/${product.id}?edit=true`}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-white bg-[#5DBEBB] hover:bg-[#5DBEBB]/90 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Modifier ce produit
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- Sub-components ----

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
  validated: 'Validée',
  processing: 'En cours',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

function SalesHistorySection({
  productId,
  commissionRate,
}: {
  productId: string;
  commissionRate: number;
}): JSX.Element {
  const { data, isLoading } = useProductSalesDetail(productId);

  if (isLoading) {
    return (
      <section>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" />
          Historique des ventes
        </h3>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  const sales = data?.sales ?? [];
  const totals = data?.totals;

  // Compute commission totals
  const totalCommission = totals
    ? totals.totalRevenueHT * (commissionRate / 100)
    : 0;
  const totalNet = totals ? totals.totalRevenueHT - totalCommission : 0;

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
        <ShoppingBag className="h-4 w-4" />
        Historique des ventes
      </h3>

      {sales.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Aucune vente pour ce produit</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 3 Mini-KPIs */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                Commandes
              </p>
              <p className="text-lg font-bold text-[#183559]">
                {totals?.totalOrders ?? 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                CA HT
              </p>
              <p className="text-lg font-bold text-[#183559]">
                {formatCurrency(totals?.totalRevenueHT ?? 0)}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-green-600 uppercase tracking-wider">
                Net encaissé
              </p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(totalNet)}
              </p>
            </div>
          </div>

          {/* Sales table */}
          <div className="bg-gray-50 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Client
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">
                    Qté
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">
                    Total
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">
                    Net
                  </th>
                  <th className="text-center py-2 px-3 font-medium text-gray-500">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale, index) => {
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
                      className="hover:bg-white/50 transition-colors"
                    >
                      <td className="py-2 px-3 text-gray-600">
                        {formatDate(sale.orderDate)}
                      </td>
                      <td className="py-2 px-3 text-gray-700 truncate max-w-[100px]">
                        {sale.customerName}
                      </td>
                      <td className="py-2 px-3 text-right font-medium">
                        {sale.quantity}
                      </td>
                      <td className="py-2 px-3 text-right text-gray-700">
                        {formatCurrency(sale.totalHT)}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-green-600">
                        {formatCurrency(lineNet)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${statusColor}`}
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

          {/* Commission footer */}
          <div className="text-center text-xs text-gray-400 pt-1">
            Commission LinkMe totale : {formatCurrency(totalCommission)} (
            {commissionRate}%)
          </div>
        </div>
      )}
    </section>
  );
}

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
    <div className="flex items-center justify-between px-4 py-3">
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
    <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value} cm</p>
    </div>
  );
}
