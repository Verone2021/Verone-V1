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

import { InventaireMobileCard } from './InventaireMobileCard';

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

export function InventaireTable({
  inventory,
  filteredInventory,
  stats,
  loading,
  showOnlyWithStock,
  onOpenHistory,
  onOpenAdjustment,
}: InventaireTableProps) {
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
            skeletonCount={3}
            breakpoint="lg"
            className="p-3 lg:p-0"
            emptyMessage={
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
            }
            renderCard={item => (
              <InventaireMobileCard
                key={item.id}
                item={item}
                onOpenHistory={onOpenHistory}
                onOpenAdjustment={onOpenAdjustment}
              />
            )}
            renderTable={() => (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs w-16" />
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        Produit
                      </th>
                      <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Entrées
                      </th>
                      <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Sorties
                      </th>
                      <th className="hidden lg:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Ajust.
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Stock
                      </th>
                      <th className="hidden xl:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Entrant
                      </th>
                      <th className="hidden xl:table-cell text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Sortant
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Total
                      </th>
                      <th className="hidden 2xl:table-cell text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        Dernière MAJ
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInventory.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => onOpenHistory(item)}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-3 text-center">
                          {item.product_image_url ? (
                            <Image
                              src={item.product_image_url}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="rounded object-cover border border-gray-200 mx-auto"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border border-gray-200 flex items-center justify-center mx-auto">
                              <span className="text-gray-400 text-xs">N/A</span>
                            </div>
                          )}
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
                            {item.stock_real +
                              item.stock_forecasted_in -
                              item.stock_forecasted_out}
                          </span>
                        </td>
                        <td className="hidden 2xl:table-cell py-2 px-3">
                          <span className="text-xs text-gray-600">
                            {item.last_movement_at
                              ? new Date(item.last_movement_at).toLocaleString(
                                  'fr-FR',
                                  {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )
                              : 'N/A'}
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
              </div>
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
