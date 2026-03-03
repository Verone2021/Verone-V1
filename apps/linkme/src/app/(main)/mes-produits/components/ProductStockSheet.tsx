'use client';

/**
 * ProductStockSheet - Sheet lateral montrant les metriques de stock d'un produit
 *
 * Sections:
 * - KPIs: Quantite en stock, Volume, Cout stockage estime
 * - Mouvements recents: Entrees/sorties via useStorageEventsHistory
 * - Demandes: Historique demandes pour ce produit
 * - CTA: Bouton "Envoyer au stock" ouvre SendToStorageDialog
 *
 * @module ProductStockSheet
 * @since 2026-03-03
 */

import { useState, useMemo } from 'react';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Badge,
} from '@verone/ui';
import {
  Package,
  Warehouse,
  ArrowDownCircle,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Box,
  Send,
} from 'lucide-react';
import Image from 'next/image';

import {
  useAffiliateStorageDetails,
  useStorageEventsHistory,
  formatVolume,
  formatPrice,
  useStoragePricingTiers,
  calculateStoragePrice,
  type StorageAllocation,
  type StorageEvent,
} from '@/lib/hooks/use-affiliate-storage';
import {
  useAffiliateStorageRequests,
  type StorageRequest,
} from '@/lib/hooks/use-storage-requests';
import type { AffiliateProduct } from '@/lib/hooks/use-affiliate-products';

import { SendToStorageDialog } from './SendToStorageDialog';

// Status config for storage requests
const REQUEST_STATUS_CONFIG: Record<
  StorageRequest['status'],
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  pending: {
    label: 'En attente',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    icon: Clock,
  },
  approved: {
    label: 'Approuvee',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejetee',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: XCircle,
  },
  cancelled: {
    label: 'Annulee',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
    icon: AlertCircle,
  },
  reception_created: {
    label: 'Reception creee',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: CheckCircle,
  },
};

interface ProductStockSheetProps {
  product: AffiliateProduct;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductStockSheet({
  product,
  isOpen,
  onClose,
}: ProductStockSheetProps): JSX.Element {
  const [showStorageDialog, setShowStorageDialog] = useState(false);

  // Fetch storage data
  const { data: allocations, isLoading: allocationsLoading } =
    useAffiliateStorageDetails();
  const { data: events, isLoading: eventsLoading } =
    useStorageEventsHistory(50);
  const { data: requests, isLoading: requestsLoading } =
    useAffiliateStorageRequests();
  const { data: pricingTiers } = useStoragePricingTiers();

  // Filter data for THIS product
  const productAllocation = useMemo(
    () =>
      (allocations ?? []).find(
        (a: StorageAllocation) => a.product_id === product.id
      ) ?? null,
    [allocations, product.id]
  );

  const productEvents = useMemo(
    () =>
      (events ?? [])
        .filter((e: StorageEvent) => e.product_id === product.id)
        .slice(0, 10),
    [events, product.id]
  );

  const productRequests = useMemo(
    () =>
      (requests ?? []).filter(
        (r: StorageRequest) => r.product_id === product.id
      ),
    [requests, product.id]
  );

  // Compute KPIs
  const stockQty = productAllocation?.stock_quantity ?? 0;
  const volumeM3 = productAllocation?.total_volume_m3 ?? 0;
  const estimatedCost =
    pricingTiers && volumeM3 > 0
      ? calculateStoragePrice(volumeM3, pricingTiers)
      : 0;
  const hasPendingRequest = productRequests.some(r => r.status === 'pending');

  return (
    <>
      <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-lg overflow-y-auto p-0"
        >
          <SheetHeader className="p-6 pb-4 border-b border-gray-100">
            {/* Product header */}
            <div className="flex items-start gap-4">
              {product.product_image_url ? (
                <Image
                  src={product.product_image_url}
                  alt={product.name}
                  width={56}
                  height={56}
                  className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <SheetTitle className="text-lg font-semibold text-[#183559] truncate">
                  {product.name}
                </SheetTitle>
                <p className="text-sm text-gray-400 font-mono mt-0.5">
                  {product.sku}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {/* KPIs Grid */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Stock
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <KpiCard
                  icon={Box}
                  label="En stock"
                  value={`${stockQty}`}
                  subtitle="unites"
                  loading={allocationsLoading}
                />
                <KpiCard
                  icon={TrendingUp}
                  label="Volume"
                  value={formatVolume(volumeM3)}
                  loading={allocationsLoading}
                />
                <KpiCard
                  icon={Warehouse}
                  label="Cout estime/mois"
                  value={estimatedCost > 0 ? formatPrice(estimatedCost) : '-'}
                  loading={allocationsLoading}
                />
                <KpiCard
                  icon={Clock}
                  label="Depuis"
                  value={
                    productAllocation?.storage_start_date
                      ? new Date(
                          productAllocation.storage_start_date
                        ).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-'
                  }
                  loading={allocationsLoading}
                />
              </div>
            </section>

            {/* CTA Button */}
            <button
              type="button"
              onClick={() => setShowStorageDialog(true)}
              disabled={hasPendingRequest}
              className="w-full flex items-center justify-center gap-2 h-11 px-4 text-sm font-medium text-white bg-[#5DBEBB] hover:bg-[#5DBEBB]/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {hasPendingRequest
                ? 'Demande en cours...'
                : 'Envoyer au stock Verone'}
            </button>

            {/* Recent movements */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Mouvements recents
              </h3>
              {eventsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : productEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Aucun mouvement
                </p>
              ) : (
                <div className="space-y-2">
                  {productEvents.map(event => (
                    <EventRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>

            {/* Storage requests */}
            <section>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Demandes de stockage
              </h3>
              {requestsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : productRequests.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">
                  Aucune demande
                </p>
              ) : (
                <div className="space-y-2">
                  {productRequests.map(request => (
                    <RequestRow key={request.id} request={request} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog envoi au stock (nested) */}
      {showStorageDialog && (
        <SendToStorageDialog
          product={{ id: product.id, name: product.name, sku: product.sku }}
          isOpen={showStorageDialog}
          onClose={() => setShowStorageDialog(false)}
        />
      )}
    </>
  );
}

// ---- Sub-components ----

function KpiCard({
  icon: Icon,
  label,
  value,
  subtitle,
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  loading: boolean;
}): JSX.Element {
  return (
    <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-4 w-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      {loading ? (
        <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
      ) : (
        <div>
          <p className="text-lg font-bold text-[#183559]">{value}</p>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: StorageEvent }): JSX.Element {
  const isEntry = event.qty_change > 0;
  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50/50 rounded-lg">
      {isEntry ? (
        <ArrowDownCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <ArrowUpCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">
          {isEntry ? '+' : ''}
          {event.qty_change} unites
        </p>
        <p className="text-xs text-gray-400">{event.source}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {new Date(event.happened_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </div>
  );
}

function RequestRow({ request }: { request: StorageRequest }): JSX.Element {
  const config = REQUEST_STATUS_CONFIG[request.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-3 py-2 px-3 bg-gray-50/50 rounded-lg">
      <StatusIcon className={`h-4 w-4 ${config.color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-700">
            {request.quantity} unites
          </p>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${config.bgColor} ${config.color} border-0`}
          >
            {config.label}
          </Badge>
        </div>
        {request.rejection_reason && (
          <p className="text-xs text-red-500 mt-0.5 truncate">
            {request.rejection_reason}
          </p>
        )}
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0">
        {new Date(request.created_at).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'short',
        })}
      </span>
    </div>
  );
}
