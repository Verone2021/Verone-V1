'use client';

import type { SourcingProduct } from '@verone/products';
import {
  SOURCING_STAGES,
  SOURCING_STAGE_LABELS,
  stageOfStatus,
} from '@verone/products/utils';
import { Badge, CloudflareImage, StatPill } from '@verone/ui';
import { Package } from 'lucide-react';

import { getPrimaryImage } from './sourcing-page.helpers';

const PRIORITY_LABELS: Record<string, { label: string; className: string }> = {
  urgent: { label: 'Urgente', className: 'bg-red-100 text-red-800' },
  high: { label: 'Haute', className: 'bg-orange-100 text-orange-800' },
  medium: { label: 'Moyenne', className: 'bg-blue-100 text-blue-800' },
  low: { label: 'Basse', className: 'bg-gray-100 text-gray-800' },
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
  const primaryImage = getPrimaryImage(product);
  const hasImage = primaryImage.cloudflareId ?? primaryImage.publicUrl;
  const supplierName =
    product.supplier?.trade_name ?? product.supplier?.legal_name;
  const priority = product.sourcing_priority
    ? PRIORITY_LABELS[product.sourcing_priority]
    : undefined;
  const daysCreated = Math.floor(
    (Date.now() - new Date(product.created_at).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <button
      type="button"
      onClick={() => onView(product.id)}
      className="w-full space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-2.5">
        {hasImage ? (
          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-100">
            <CloudflareImage
              cloudflareId={primaryImage.cloudflareId}
              fallbackSrc={primaryImage.publicUrl}
              alt={product.name}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded border border-gray-100 bg-gray-50">
            <Package className="h-5 w-5 text-gray-300" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium leading-tight text-gray-900">
            {product.name}
          </p>
          {supplierName && (
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {supplierName}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        {product.cost_price != null ? (
          <span className="text-sm font-semibold text-gray-900">
            {product.cost_price.toFixed(2)} €
          </span>
        ) : (
          <span className="text-xs text-gray-400">Pas de prix</span>
        )}

        <div className="flex items-center gap-1.5">
          {priority && (
            <Badge className={`px-1.5 py-0 text-xs ${priority.className}`}>
              {priority.label}
            </Badge>
          )}
          {daysCreated > 0 && (
            <span
              className={
                daysCreated > 7
                  ? 'text-xs font-medium text-red-500'
                  : 'text-xs text-gray-400'
              }
            >
              {daysCreated} j
            </span>
          )}
        </div>
      </div>

      {product.sourcing_type === 'client' && product.assigned_client && (
        <Badge variant="info" className="text-xs">
          Client : {product.assigned_client.name}
        </Badge>
      )}
    </button>
  );
}

/**
 * Produits en cours sur les 4 étapes du sourcing (BO-SOURCING-P5-001) : les
 * anciens statuts sont regroupés par stageOfStatus, comme sur la fiche.
 */
export function SourcingKanbanView({
  products,
  onView,
}: SourcingKanbanViewProps) {
  const columns = SOURCING_STAGES.map(stage => ({
    stage,
    products: products.filter(
      product => stageOfStatus(product.sourcing_status).stage === stage
    ),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {columns.map(column => (
        <section
          key={column.stage}
          aria-label={SOURCING_STAGE_LABELS[column.stage]}
          className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/50"
        >
          <div className="flex items-center justify-between p-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {SOURCING_STAGE_LABELS[column.stage]}
            </h3>
            <StatPill label="produits" value={column.products.length} />
          </div>
          <div className="min-h-[120px] space-y-2 px-2 pb-2">
            {column.products.length === 0 ? (
              <p className="py-8 text-center text-xs text-gray-400">
                Aucun produit
              </p>
            ) : (
              column.products.map(product => (
                <KanbanCard
                  key={product.id}
                  product={product}
                  onView={onView}
                />
              ))
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
