'use client';

/**
 * InventaireMobileCard — carte mobile pour ResponsiveDataView
 *
 * Affiche une ligne d'inventaire sous forme de carte pour les ecrans < lg (1024px).
 * HOOKS AUDIT : aucun hook — composant pur props-driven.
 */

import Image from 'next/image';
import Link from 'next/link';

import type { useStockInventory } from '@verone/stock';
import { IconButton } from '@verone/ui';
import { History, Settings, TrendingDown, TrendingUp } from 'lucide-react';

type InventoryItem = ReturnType<typeof useStockInventory>['inventory'][number];

interface InventaireMobileCardProps {
  item: InventoryItem;
  onOpenHistory: (item: InventoryItem) => void;
  onOpenAdjustment: (item: InventoryItem) => void;
}

export function InventaireMobileCard({
  item,
  onOpenHistory,
  onOpenAdjustment,
}: InventaireMobileCardProps) {
  const forecastedTotal =
    item.stock_real + item.stock_forecasted_in - item.stock_forecasted_out;

  return (
    <div
      className="rounded-lg border bg-card p-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={() => onOpenHistory(item)}
    >
      <div className="flex items-start gap-3">
        {/* Image produit */}
        <div className="shrink-0">
          {item.product_image_url ? (
            <Image
              src={item.product_image_url}
              alt={item.name}
              width={56}
              height={56}
              className="rounded object-cover border border-gray-200"
            />
          ) : (
            <div className="w-14 h-14 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">N/A</span>
            </div>
          )}
        </div>

        {/* Infos principales */}
        <div className="min-w-0 flex-1">
          <Link
            href={`/catalogue/${item.id}`}
            className="font-medium text-black hover:underline text-sm leading-tight block"
            onClick={e => e.stopPropagation()}
          >
            {item.name}
          </Link>
          <div className="mt-2 flex items-baseline gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Stock</p>
              <p className="text-lg font-bold text-black leading-none">
                {item.stock_real}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase">Prév. Total</p>
              <p className="text-lg font-bold text-blue-600 leading-none">
                {forecastedTotal}
              </p>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-black">
              <TrendingUp className="h-3 w-3" />+{item.total_in}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <TrendingDown className="h-3 w-3" />-{item.total_out}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <IconButton
            icon={Settings}
            variant="outline"
            size="sm"
            label="Ajuster le stock"
            onClick={e => {
              e.stopPropagation();
              onOpenAdjustment(item);
            }}
          />
          <IconButton
            icon={History}
            variant="outline"
            size="sm"
            label="Voir historique"
            onClick={e => {
              e.stopPropagation();
              onOpenHistory(item);
            }}
          />
        </div>
      </div>
    </div>
  );
}
