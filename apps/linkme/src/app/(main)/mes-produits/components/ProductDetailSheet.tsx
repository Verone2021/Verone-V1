'use client';

/**
 * ProductDetailSheet - Dialog centre de consultation produit
 *
 * @module ProductDetailSheet
 * @since 2026-03-04
 * @updated 2026-04-14 - Refactoring: extraction ProductSalesSection
 */

import Image from 'next/image';
import Link from 'next/link';

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
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Badge,
} from '@verone/ui';

import type { AffiliateProduct } from '@/lib/hooks/use-affiliate-products';
import { ProductSalesSection } from './ProductSalesSection';

// ============================================================================
// CONSTANTS
// ============================================================================

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

// ============================================================================
// TYPES
// ============================================================================

interface ProductDetailSheetProps {
  product: AffiliateProduct;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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

// ============================================================================
// COMPONENT
// ============================================================================

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

  const commissionRate = product.affiliate_commission_rate || 0;
  const prixVenteHt = product.affiliate_payout_ht || 0;
  const commissionMontant = prixVenteHt * (commissionRate / 100);
  const encaissementNet = prixVenteHt - commissionMontant;

  const dims = product.dimensions;
  const hasDimensions = dims?.length_cm && dims?.width_cm && dims?.height_cm;
  const volumeM3 = hasDimensions
    ? (dims.length_cm! * dims.width_cm! * dims.height_cm!) / 1_000_000
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

        {/* Info grid */}
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
              Stockage &amp; expedition
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

        {/* Sales section (approved only) */}
        {isApproved && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <ProductSalesSection
              productId={product.id}
              commissionRate={commissionRate}
            />
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
