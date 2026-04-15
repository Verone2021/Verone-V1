'use client';

import type { SourcingProduct } from '@verone/products';
import { Badge } from '@verone/ui';
import { Package } from 'lucide-react';

const PIPELINE_COLUMNS = [
  {
    id: 'need_identified',
    label: 'Besoin',
    color: 'border-t-violet-400',
    bg: 'bg-violet-50',
  },
  {
    id: 'supplier_search',
    label: 'Recherche',
    color: 'border-t-blue-400',
    bg: 'bg-blue-50',
  },
  {
    id: 'initial_contact',
    label: 'Contact',
    color: 'border-t-sky-400',
    bg: 'bg-sky-50',
  },
  {
    id: 'evaluation',
    label: 'Évaluation',
    color: 'border-t-indigo-400',
    bg: 'bg-indigo-50',
  },
  {
    id: 'negotiation',
    label: 'Négociation',
    color: 'border-t-orange-400',
    bg: 'bg-orange-50',
  },
  {
    id: 'sample_requested',
    label: 'Échantillon',
    color: 'border-t-cyan-400',
    bg: 'bg-cyan-50',
  },
  {
    id: 'sample_received',
    label: 'Reçu',
    color: 'border-t-teal-400',
    bg: 'bg-teal-50',
  },
  {
    id: 'sample_approved',
    label: 'Validé',
    color: 'border-t-green-400',
    bg: 'bg-green-50',
  },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-blue-100 text-blue-800',
  low: 'bg-gray-100 text-gray-800',
};

interface SourcingKanbanViewProps {
  products: SourcingProduct[];
  onView: (id: string) => void;
}

function KanbanCard({
  product,
  onView,
}: {
  product: SourcingProduct;
  onView: (id: string) => void;
}) {
  const imageUrl =
    product.product_images?.find(img => img.is_primary)?.public_url ??
    product.product_images?.[0]?.public_url;
  const supplierName =
    product.supplier?.trade_name ?? product.supplier?.legal_name;
  const daysCreated = Math.floor(
    (Date.now() - new Date(product.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div
      onClick={() => onView(product.id)}
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer space-y-2"
    >
      <div className="flex items-start gap-2.5">
        {imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={imageUrl}
            alt={product.name}
            className="w-12 h-12 rounded border border-gray-100 object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
            <Package className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
            {product.name}
          </p>
          {supplierName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {supplierName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {product.cost_price != null ? (
          <span className="text-sm font-semibold text-gray-900">
            {product.cost_price.toFixed(2)}€
          </span>
        ) : (
          <span className="text-xs text-gray-400">Pas de prix</span>
        )}

        <div className="flex items-center gap-1.5">
          {product.sourcing_priority && (
            <Badge
              className={`text-[10px] px-1.5 py-0 ${PRIORITY_STYLES[product.sourcing_priority] ?? PRIORITY_STYLES.medium}`}
            >
              {product.sourcing_priority === 'urgent'
                ? 'Urgente'
                : product.sourcing_priority === 'high'
                  ? 'Haute'
                  : product.sourcing_priority === 'medium'
                    ? 'Moyenne'
                    : 'Basse'}
            </Badge>
          )}
          {daysCreated > 7 && (
            <span className="text-[10px] text-red-500 font-medium">
              {daysCreated}j
            </span>
          )}
          {daysCreated <= 7 && daysCreated > 0 && (
            <span className="text-[10px] text-gray-400">{daysCreated}j</span>
          )}
        </div>
      </div>

      {product.sourcing_type === 'client' && product.assigned_client && (
        <Badge variant="info" className="text-[10px]">
          Client: {product.assigned_client.name}
        </Badge>
      )}
    </div>
  );
}

export function SourcingKanbanView({
  products,
  onView,
}: SourcingKanbanViewProps) {
  const columnIds = PIPELINE_COLUMNS.map(c => c.id as string);
  const productsByStatus = PIPELINE_COLUMNS.map(col => ({
    ...col,
    products: products.filter(p => p.sourcing_status === (col.id as string)),
  }));

  // Also collect uncategorized products
  const uncategorized = products.filter(
    p => !p.sourcing_status || !columnIds.includes(p.sourcing_status)
  );

  return (
    <div className="overflow-x-auto pb-4">
      <div className="flex gap-4 min-w-max">
        {productsByStatus.map(col => (
          <div
            key={col.id}
            className={`w-[280px] flex-shrink-0 rounded-lg border border-gray-200 border-t-4 ${col.color} bg-gray-50/50`}
          >
            <div className="p-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                {col.label}
              </h3>
              <span className="text-xs font-medium text-gray-400 bg-white rounded-full px-2 py-0.5 border">
                {col.products.length}
              </span>
            </div>
            <div className="px-2 pb-2 space-y-2 min-h-[120px]">
              {col.products.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-8">
                  Aucun produit
                </p>
              ) : (
                col.products.map(product => (
                  <KanbanCard
                    key={product.id}
                    product={product}
                    onView={onView}
                  />
                ))
              )}
            </div>
          </div>
        ))}

        {uncategorized.length > 0 && (
          <div className="w-[280px] flex-shrink-0 rounded-lg border border-gray-200 border-t-4 border-t-gray-400 bg-gray-50/50">
            <div className="p-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                Autre
              </h3>
              <span className="text-xs font-medium text-gray-400 bg-white rounded-full px-2 py-0.5 border">
                {uncategorized.length}
              </span>
            </div>
            <div className="px-2 pb-2 space-y-2 min-h-[120px]">
              {uncategorized.map(product => (
                <KanbanCard
                  key={product.id}
                  product={product}
                  onView={onView}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
