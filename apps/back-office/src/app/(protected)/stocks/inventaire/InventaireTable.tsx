'use client';

import Image from 'next/image';
import Link from 'next/link';

import type { useStockInventory } from '@verone/stock';
import { Card, CardContent, ResponsiveDataView } from '@verone/ui';
import { IconButton } from '@verone/ui';
import {
  Package,
  TrendingUp,
  TrendingDown,
  History,
  Settings,
} from 'lucide-react';

type InventoryItem = ReturnType<typeof useStockInventory>['inventory'][number];
type InventoryStats = ReturnType<typeof useStockInventory>['stats'];

interface InventaireTableProps {
  inventory: InventoryItem[];
  filteredInventory: InventoryItem[];
  stats: InventoryStats;
  loading: boolean;
  showOnlyWithStock: boolean;
  onOpenHistory: (item: InventoryItem) => void;
  onOpenAdjustment: (item: InventoryItem) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatLastMovement(date: string | null | undefined): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function computeForecasted(item: InventoryItem): number {
  return item.stock_real + item.stock_forecasted_in - item.stock_forecasted_out;
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────

interface ProductImgProps {
  src: string | null | undefined;
  name: string;
}

function ProductImg({ src, name }: ProductImgProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={48}
        height={48}
        className="rounded object-cover border border-gray-200 mx-auto"
      />
    );
  }
  return (
    <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mx-auto">
      <span className="text-gray-400 text-xs">N/A</span>
    </div>
  );
}

// ─── Mobile card ──────────────────────────────────────────────────────────────

interface InventaireMobileCardProps {
  item: InventoryItem;
  onOpenHistory: (item: InventoryItem) => void;
  onOpenAdjustment: (item: InventoryItem) => void;
}

function InventaireMobileCard({
  item,
  onOpenHistory,
  onOpenAdjustment,
}: InventaireMobileCardProps) {
  const forecasted = computeForecasted(item);

  return (
    <div
      className="rounded-lg border bg-card p-4 space-y-3 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => onOpenHistory(item)}
    >
      {/* Header: image + nom + stock réel */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <ProductImg src={item.product_image_url} name={item.name} />
        </div>
        <div className="flex-1 min-w-0">
          <Link
            href={`/catalogue/${item.id}`}
            className="font-medium text-black hover:text-gray-700 hover:underline text-sm truncate block"
            onClick={e => e.stopPropagation()}
          >
            {item.name}
          </Link>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatLastMovement(item.last_movement_at)}
          </p>
        </div>
        {/* Stock réel — toujours visible */}
        <div className="shrink-0 text-right">
          <div className="text-xs text-muted-foreground">Stock</div>
          <div className="font-bold text-black text-lg leading-tight">
            {item.stock_real}
          </div>
        </div>
      </div>

      {/* Prév. Total + Entrées/Sorties */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex gap-3">
          <span className="flex items-center gap-1 text-black">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium text-xs">+{item.total_in}</span>
          </span>
          <span className="flex items-center gap-1 text-gray-600">
            <TrendingDown className="h-3 w-3" />
            <span className="font-medium text-xs">-{item.total_out}</span>
          </span>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Prév. Total</div>
          <div className="font-bold text-blue-600 text-base leading-tight">
            {forecasted}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 border-t flex justify-end gap-2">
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
  );
}

// ─── Desktop table ─────────────────────────────────────────────────────────

interface InventaireDesktopTableProps {
  items: InventoryItem[];
  onOpenHistory: (item: InventoryItem) => void;
  onOpenAdjustment: (item: InventoryItem) => void;
}

function InventaireDesktopTable({
  items,
  onOpenHistory,
  onOpenAdjustment,
}: InventaireDesktopTableProps) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50 border-b border-gray-200">
        <tr>
          {/* T2 — toujours visible */}
          <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs w-16" />
          <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
            Produit
          </th>
          {/* T2 — hidden < lg */}
          <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Entrées
          </th>
          <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Sorties
          </th>
          <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Ajust.
          </th>
          {/* T2 — toujours visible */}
          <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Stock
          </th>
          {/* T2 — hidden < xl */}
          <th className="hidden xl:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Prév. Entrant
          </th>
          <th className="hidden xl:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Prév. Sortant
          </th>
          {/* T2 — toujours visible */}
          <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
            Prév. Total
          </th>
          {/* T2 — hidden < xl */}
          <th className="hidden xl:table-cell text-left py-2 px-3 font-medium text-gray-900 text-xs">
            Dernière MAJ
          </th>
          <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {items.map(item => (
          <tr
            key={item.id}
            onClick={() => onOpenHistory(item)}
            className="hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <td className="py-2 px-3 text-center">
              <ProductImg src={item.product_image_url} name={item.name} />
            </td>
            <td className="py-2 px-3">
              <Link
                href={`/catalogue/${item.id}`}
                className="font-medium text-black hover:text-gray-700 hover:underline transition-colors text-sm"
              >
                {item.name}
              </Link>
            </td>
            <td className="hidden lg:table-cell py-2 px-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <TrendingUp className="h-4 w-4 text-black" />
                <span className="font-medium text-black text-sm">
                  +{item.total_in}
                </span>
              </div>
            </td>
            <td className="hidden lg:table-cell py-2 px-3 text-right">
              <div className="flex items-center justify-end gap-1">
                <TrendingDown className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-gray-700 text-sm">
                  -{item.total_out}
                </span>
              </div>
            </td>
            <td className="hidden lg:table-cell py-2 px-3 text-right">
              <div className="flex items-center justify-end gap-1">
                {item.total_adjustments !== 0 ? (
                  <>
                    {item.total_adjustments > 0 ? (
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-gray-500" />
                    )}
                    <span className="font-medium text-gray-700 text-sm">
                      {item.total_adjustments > 0 ? '+' : ''}
                      {item.total_adjustments}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400 text-xs">-</span>
                )}
              </div>
            </td>
            <td className="py-2 px-3 text-right">
              <span className="font-bold text-black text-base">
                {item.stock_real}
              </span>
            </td>
            <td className="hidden xl:table-cell py-2 px-3 text-right">
              {item.stock_forecasted_in > 0 ? (
                <span className="flex items-center justify-end gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="font-medium text-sm">
                    +{item.stock_forecasted_in}
                  </span>
                </span>
              ) : (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </td>
            <td className="hidden xl:table-cell py-2 px-3 text-right">
              {item.stock_forecasted_out > 0 ? (
                <span className="flex items-center justify-end gap-1 text-orange-600">
                  <TrendingDown className="h-3 w-3" />
                  <span className="font-medium text-sm">
                    -{item.stock_forecasted_out}
                  </span>
                </span>
              ) : (
                <span className="text-gray-400 text-xs">-</span>
              )}
            </td>
            <td className="py-2 px-3 text-right">
              <span className="font-bold text-blue-600 text-base">
                {computeForecasted(item)}
              </span>
            </td>
            <td className="hidden xl:table-cell py-2 px-3">
              <span className="text-xs text-gray-600">
                {formatLastMovement(item.last_movement_at)}
              </span>
            </td>
            <td className="py-2 px-3 text-center">
              <div className="flex items-center justify-center gap-1">
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InventaireTable({
  inventory,
  filteredInventory,
  stats,
  loading,
  showOnlyWithStock,
  onOpenHistory,
  onOpenAdjustment,
}: InventaireTableProps) {
  const emptyNode = (
    <div className="text-center py-12">
      <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500">
        {showOnlyWithStock
          ? 'Aucun produit avec stock > 0'
          : 'Aucun mouvement de stock trouvé'}
      </p>
      <p className="text-sm text-gray-400 mt-2">
        {showOnlyWithStock
          ? 'Décochez le filtre pour voir tous les produits'
          : 'Les produits apparaîtront après leur première entrée ou sortie'}
      </p>
    </div>
  );

  return (
    <>
      <Card className="border-black">
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <h2 className="text-sm font-bold text-black">
            Inventaire Consolidé ({filteredInventory.length} produits)
            {showOnlyWithStock && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                (filtre actif : Stock &gt; 0)
              </span>
            )}
          </h2>
        </div>
        <CardContent className="p-0">
          <ResponsiveDataView<InventoryItem>
            data={filteredInventory}
            loading={loading}
            emptyMessage={emptyNode}
            breakpoint="md"
            renderTable={items => (
              <div className="overflow-x-auto">
                <InventaireDesktopTable
                  items={items}
                  onOpenHistory={onOpenHistory}
                  onOpenAdjustment={onOpenAdjustment}
                />
              </div>
            )}
            renderCard={item => (
              <InventaireMobileCard
                key={item.id}
                item={item}
                onOpenHistory={onOpenHistory}
                onOpenAdjustment={onOpenAdjustment}
              />
            )}
          />
        </CardContent>
      </Card>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-gray-600 px-1">
        <p>
          <span className="font-medium text-black">
            {filteredInventory.length}
          </span>{' '}
          produit(s) affiché(s)
          {showOnlyWithStock &&
            inventory.length !== filteredInventory.length && (
              <span className="text-gray-400 ml-1">
                (sur {inventory.length} au total)
              </span>
            )}
        </p>
        <p className="text-gray-500">
          {stats.total_movements} mouvements totaux
        </p>
      </div>
    </>
  );
}
