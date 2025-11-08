'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Package,
  Search,
  ArrowLeft,
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  BarChart3,
  History,
  Settings,
  Calendar,
  Clock,
  User,
  FileText,
  ExternalLink,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { StockKPICard } from '@/components/ui-v2/stock';
import { formatPrice } from '@verone/utils';
import { ProductHistoryModal } from '@/shared/modules/products/components/modals/ProductHistoryModal';
import { InventoryAdjustmentModal } from '@/shared/modules/stock/components/modals/InventoryAdjustmentModal';
import { StockReportsModal } from '@/shared/modules/stock/components/modals/StockReportsModal';
import { useStockMovements } from '@/shared/modules/stock/hooks';
import { useStockInventory } from '@/shared/modules/stock/hooks';

export default function InventairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const { inventory, stats, loading, fetchInventory, exportInventoryCSV } =
    useStockInventory();

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Ouvrir automatiquement le modal si query param ?id= présent (venant des notifications)
  useEffect(() => {
    const productId = searchParams.get('id');
    if (productId && inventory.length > 0 && !isHistoryModalOpen) {
      const product = inventory.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
      }
    }
  }, [searchParams, inventory, isHistoryModalOpen]);

  const handleRefresh = () => {
    fetchInventory(filters);
  };

  const handleExport = () => {
    exportInventoryCSV(inventory);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleApplyFilters = () => {
    fetchInventory(filters);
  };

  const openHistoryModal = (product: any) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
  };

  const openAdjustmentModal = (product: any) => {
    setSelectedProduct(product);
    setIsAdjustmentModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="ghost"
                size="sm"
                onClick={() => router.push('/stocks')}
                className="flex items-center text-gray-600 hover:text-black h-8 px-2"
              >
                <ArrowLeft className="h-3 w-3 mr-1.5" />
                Retour
              </ButtonV2>
              <div className="flex items-center space-x-2">
                <Package className="h-6 w-6 text-black" />
                <div>
                  <h1 className="text-xl font-bold text-black">
                    Inventaire Stock
                  </h1>
                  <p className="text-xs text-gray-600">
                    Vue consolidée des mouvements
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1.5 ${loading ? 'animate-spin' : ''}`}
                />
                Actualiser
              </ButtonV2>
              <ButtonV2
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-black text-black hover:bg-black hover:text-white h-8 text-xs"
              >
                <Download className="h-3 w-3 mr-1.5" />
                CSV
              </ButtonV2>
              <ButtonV2
                size="sm"
                className="bg-black hover:bg-gray-800 text-white h-8 text-xs"
                onClick={() => setIsReportsModalOpen(true)}
              >
                <BarChart3 className="h-3 w-3 mr-1.5" />
                Rapports
              </ButtonV2>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 space-y-4">
        {/* Statistiques KPIs - Design System V2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StockKPICard
            title="Produits Actifs"
            value={stats.products_with_activity}
            icon={Package}
            variant="success"
            subtitle={`sur ${stats.total_products}`}
          />

          <StockKPICard
            title="Mouvements"
            value={stats.total_movements}
            icon={TrendingUp}
            variant="info"
            subtitle="totaux"
          />

          <StockKPICard
            title="Valeur Stock"
            value={formatPrice(stats.total_stock_value)}
            icon={BarChart3}
            variant="default"
            subtitle="valorisation"
          />

          <StockKPICard
            title="Dernière MAJ"
            value={new Date().toLocaleDateString('fr-FR')}
            icon={Calendar}
            variant="info"
            subtitle={new Date().toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          />
        </div>

        {/* Filtres - Inline compact */}
        <div className="bg-white border border-black rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Rechercher produit, SKU..."
                value={filters.search}
                onChange={e => handleSearch(e.target.value)}
                className="pl-8 border-gray-300 h-9 text-sm"
              />
            </div>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateFrom: e.target.value }))
              }
              className="border-gray-300 w-40 h-9 text-sm"
              placeholder="Date début"
            />
            <Input
              type="date"
              value={filters.dateTo}
              onChange={e =>
                setFilters(prev => ({ ...prev, dateTo: e.target.value }))
              }
              className="border-gray-300 w-40 h-9 text-sm"
              placeholder="Date fin"
            />
            <ButtonV2
              onClick={handleApplyFilters}
              size="sm"
              className="bg-black hover:bg-gray-800 text-white h-9 px-4 text-sm"
            >
              Appliquer
            </ButtonV2>
          </div>
        </div>

        {/* Table Inventaire - Dense */}
        <Card className="border-black">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-bold text-black">
              Inventaire Consolidé ({inventory.length} produits)
            </h2>
          </div>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Aucun mouvement de stock trouvé</p>
                <p className="text-sm text-gray-400 mt-2">
                  Les produits apparaîtront après leur première entrée ou sortie
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs w-16" />
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        Produit
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        SKU
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Entrées
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Sorties
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Ajust.
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Stock
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        Dernière MAJ
                      </th>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map(item => (
                      <tr
                        key={item.id}
                        onClick={() => openHistoryModal(item)}
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
                        <td className="py-2 px-3">
                          <span className="text-gray-500 font-mono text-xs">
                            {item.sku}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4 text-black" />
                            <span className="font-medium text-black text-sm">
                              +{item.total_in}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingDown className="h-4 w-4 text-gray-600" />
                            <span className="font-medium text-gray-700 text-sm">
                              -{item.total_out}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right">
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
                            {item.stock_quantity}
                          </span>
                        </td>
                        <td className="py-2 px-3">
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
                            <ButtonV2
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                openAdjustmentModal(item);
                              }}
                              title="Ajuster le stock"
                              className="h-7 w-7 p-0 hover:bg-green-600 hover:text-white transition-colors"
                            >
                              <Settings className="h-3 w-3" />
                            </ButtonV2>
                            <ButtonV2
                              variant="ghost"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation();
                                openHistoryModal(item);
                              }}
                              title="Voir historique détaillé"
                              className="h-7 w-7 p-0 hover:bg-black hover:text-white transition-colors"
                            >
                              <History className="h-3 w-3" />
                            </ButtonV2>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer stats - Compact */}
        <div className="flex items-center justify-between text-xs text-gray-600 px-1">
          <p>
            <span className="font-medium text-black">{inventory.length}</span>{' '}
            produit(s) avec mouvements
          </p>
          <p className="text-gray-500">
            {stats.total_movements} mouvements totaux
          </p>
        </div>
      </div>

      {/* Modal Ajustement Stock - Inline */}
      <InventoryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => {
          fetchInventory(); // Refresh data après ajustement
        }}
        product={selectedProduct}
      />

      {/* Modal Historique - Professionnel */}
      <ProductHistoryModal
        product={selectedProduct}
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      {/* Modal Rapports - Catalogue complet */}
      <StockReportsModal
        isOpen={isReportsModalOpen}
        onClose={() => setIsReportsModalOpen(false)}
      />
    </div>
  );
}
