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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { AffiliateProduct } from '@/lib/hooks/use-affiliate-products';

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
