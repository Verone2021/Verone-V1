'use client';

import type { SourcingProduct } from '@verone/products';
import { Badge } from '@verone/ui';
import { Package } from 'lucide-react';

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  need_identified: {
    label: 'Besoin',
    variant: 'bg-violet-100 text-violet-800',
  },
  supplier_search: { label: 'Recherche', variant: 'bg-blue-100 text-blue-800' },
  initial_contact: { label: 'Contact', variant: 'bg-sky-100 text-sky-800' },
  evaluation: { label: 'Évaluation', variant: 'bg-indigo-100 text-indigo-800' },
  negotiation: {
    label: 'Négociation',
    variant: 'bg-orange-100 text-orange-800',
  },
  sample_requested: {
    label: 'Échantillon demandé',
    variant: 'bg-cyan-100 text-cyan-800',
  },
  sample_received: {
    label: 'Échantillon reçu',
    variant: 'bg-teal-100 text-teal-800',
  },
  sample_approved: { label: 'Validé', variant: 'bg-green-100 text-green-800' },
  sample_rejected: { label: 'Rejeté', variant: 'bg-red-100 text-red-800' },
  on_hold: { label: 'En pause', variant: 'bg-yellow-100 text-yellow-800' },
  cancelled: { label: 'Annulé', variant: 'bg-gray-100 text-gray-800' },
};

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

interface SourcingCardViewProps {
  products: SourcingProduct[];
  onView: (id: string) => void;
}

export function SourcingCardView({ products, onView }: SourcingCardViewProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Aucun produit en sourcing</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map(product => {
        const imageUrl =
          product.product_images?.find(img => img.is_primary)?.public_url ??
          product.product_images?.[0]?.public_url;
        const supplierName =
          product.supplier?.trade_name ?? product.supplier?.legal_name;
        const statusInfo = STATUS_LABELS[product.sourcing_status ?? ''];

        return (
          <div
            key={product.id}
            onClick={() => onView(product.id)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
          >
            {/* Image */}
            <div className="relative aspect-square bg-gray-50">
              {imageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-16 w-16 text-gray-200" />
                </div>
              )}
              {/* Status badge overlay */}
              {statusInfo && (
                <div className="absolute top-2 left-2">
                  <Badge className={`text-[10px] ${statusInfo.variant}`}>
                    {statusInfo.label}
                  </Badge>
                </div>
              )}
              {/* Priority badge overlay */}
              {product.sourcing_priority && (
                <div className="absolute top-2 right-2">
                  <Badge
                    className={`text-[10px] ${PRIORITY_STYLES[product.sourcing_priority] ?? ''}`}
                  >
                    {product.sourcing_priority === 'urgent'
                      ? 'Urgente'
                      : product.sourcing_priority === 'high'
                        ? 'Haute'
                        : product.sourcing_priority === 'medium'
                          ? 'Moy.'
                          : 'Basse'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-3 space-y-1.5">
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                {product.name}
              </h3>
              {supplierName && (
                <p className="text-xs text-gray-500 truncate">{supplierName}</p>
              )}
              <div className="flex items-center justify-between pt-1">
                {product.cost_price != null ? (
                  <span className="text-base font-bold text-gray-900">
                    {product.cost_price.toFixed(2)}€
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">Prix non défini</span>
                )}
                {product.target_price != null && (
                  <span className="text-xs text-gray-400 line-through">
                    Cible: {product.target_price.toFixed(2)}€
                  </span>
                )}
              </div>
              {product.sourcing_type === 'client' &&
                product.assigned_client && (
                  <Badge variant="info" className="text-[10px] mt-1">
                    Client: {product.assigned_client.name}
                  </Badge>
                )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
