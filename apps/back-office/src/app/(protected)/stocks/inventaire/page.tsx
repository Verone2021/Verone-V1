'use client';

import React, { useState, useEffect } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { ProductHistoryModal } from '@verone/products';
import { InventoryAdjustmentModal } from '@verone/stock';
import { StockReportsModal } from '@verone/stock';
import { useStockInventory } from '@verone/stock';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent } from '@verone/ui';
import { IconButton } from '@verone/ui';
import { Input } from '@verone/ui';
import { formatPrice } from '@verone/utils';
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
  Filter,
  X,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

import { StockKPICard } from '@/components/ui-v2/stock';

export default function InventairePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
  const [quickDateFilter, setQuickDateFilter] = useState<
    'all' | 'today' | '7days' | '30days'
  >('all');
  const [stockLevelFilter, setStockLevelFilter] = useState<
    'all' | 'critical' | 'low' | 'sufficient'
  >('all');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const { inventory, stats, loading, fetchInventory, exportInventoryCSV } =
    useStockInventory();

  useEffect(() => {
    void fetchInventory().catch(error => {
      console.error('[Inventaire] fetchInventory failed:', error);
    });
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
    void fetchInventory(filters).catch(error => {
      console.error('[Inventaire] handleRefresh failed:', error);
    });
  };

  const handleExport = () => {
    exportInventoryCSV(inventory);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleApplyFilters = () => {
    void fetchInventory(filters).catch(error => {
      console.error('[Inventaire] handleApplyFilters failed:', error);
    });
  };

  const openHistoryModal = (product: any) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
  };

  const openAdjustmentModal = (product: any) => {
    setSelectedProduct(product);
    setIsAdjustmentModalOpen(true);
  };

  // Helper : Calcul dates pour filtres rapides
  const getQuickDateRange = (
    filter: 'all' | 'today' | '7days' | '30days'
  ): { from: string; to: string } | null => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (filter) {
      case 'today':
        return { from: formatDate(today), to: formatDate(today) };
      case '7days':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: formatDate(weekAgo), to: formatDate(today) };
      case '30days':
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return { from: formatDate(monthAgo), to: formatDate(today) };
      default:
        return null;
    }
  };

  // Handler filtre rapide date
  const handleQuickDateFilter = (
    filter: 'all' | 'today' | '7days' | '30days'
  ) => {
    setQuickDateFilter(filter);
    const range = getQuickDateRange(filter);
    if (range) {
      setFilters(prev => ({ ...prev, dateFrom: range.from, dateTo: range.to }));
    } else {
      setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    }
  };

  // Reset tous les filtres
  const handleResetFilters = () => {
    setFilters({ search: '', dateFrom: '', dateTo: '' });
    setShowOnlyWithStock(false);
    setQuickDateFilter('all');
    setStockLevelFilter('all');
    void fetchInventory().catch(error => {
      console.error('[Inventaire] handleResetFilters failed:', error);
    });
  };

  // Nombre de filtres actifs
  const activeFiltersCount = [
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    showOnlyWithStock,
    stockLevelFilter !== 'all',
  ].filter(Boolean).length;

  // ✅ Filtrage local combiné : Stock > 0 + Niveau de stock
  // Utilise le seuil min_stock propre à chaque produit (fallback 5 si non défini)
  const filteredInventory = inventory.filter(item => {
    // Filtre Stock > 0
    if (showOnlyWithStock && item.stock_real <= 0) return false;

    // Filtre niveau de stock (basé sur stock_real vs min_stock du produit)
    const threshold = item.min_stock || 5; // Seuil du produit, fallback 5
    if (stockLevelFilter === 'critical' && item.stock_real > 0) return false;
    if (
      stockLevelFilter === 'low' &&
      (item.stock_real === 0 || item.stock_real >= threshold)
    )
      return false;
    if (stockLevelFilter === 'sufficient' && item.stock_real < threshold)
      return false;

    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ButtonV2
                variant="outline"
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

      <div className="w-full px-4 py-4 space-y-4">
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

        {/* ✅ Filtres Refondus - Best Practices Odoo/ERP 2025 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          {/* Ligne 1 : Recherche + Filtres rapides période */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              {/* Barre de recherche - Plus visible */}
              <div className="flex-1 relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher produit, SKU..."
                  value={filters.search}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10 border-gray-300 h-10 text-sm rounded-lg"
                />
              </div>

              {/* Séparateur vertical */}
              <div className="h-8 w-px bg-gray-200" />

              {/* Filtres rapides période - Style Odoo */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-1">Période:</span>
                {[
                  { key: 'all', label: 'Tout' },
                  { key: 'today', label: "Aujourd'hui" },
                  { key: '7days', label: '7 jours' },
                  { key: '30days', label: '30 jours' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() =>
                      handleQuickDateFilter(
                        opt.key as 'all' | 'today' | '7days' | '30days'
                      )
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      quickDateFilter === opt.key
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Séparateur vertical */}
              <div className="h-8 w-px bg-gray-200" />

              {/* Dates personnalisées */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Du</span>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={e => {
                    setFilters(prev => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }));
                    setQuickDateFilter('all');
                  }}
                  className="border-gray-300 w-36 h-9 text-xs rounded-md"
                />
                <span className="text-xs text-gray-500">au</span>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={e => {
                    setFilters(prev => ({ ...prev, dateTo: e.target.value }));
                    setQuickDateFilter('all');
                  }}
                  className="border-gray-300 w-36 h-9 text-xs rounded-md"
                />
              </div>

              {/* Bouton Appliquer */}
              <ButtonV2
                onClick={handleApplyFilters}
                size="sm"
                className="bg-black hover:bg-gray-800 text-white h-9 px-4 text-xs"
              >
                <Filter className="h-3 w-3 mr-1.5" />
                Appliquer
              </ButtonV2>
            </div>
          </div>

          {/* Ligne 2 : Filtres avancés + Reset */}
          <div className="px-3 py-2 bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Filtre niveau de stock - Style badges */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 mr-1">Stock:</span>
                {[
                  { key: 'all', label: 'Tous', icon: null },
                  {
                    key: 'critical',
                    label: 'Rupture',
                    icon: <X className="h-3 w-3" />,
                    color: 'red',
                  },
                  {
                    key: 'low',
                    label: 'Faible',
                    icon: <AlertTriangle className="h-3 w-3" />,
                    color: 'orange',
                  },
                  {
                    key: 'sufficient',
                    label: 'OK',
                    icon: <CheckCircle className="h-3 w-3" />,
                    color: 'green',
                  },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() =>
                      setStockLevelFilter(
                        opt.key as 'all' | 'critical' | 'low' | 'sufficient'
                      )
                    }
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                      stockLevelFilter === opt.key
                        ? opt.color === 'red'
                          ? 'bg-red-600 text-white'
                          : opt.color === 'orange'
                            ? 'bg-orange-500 text-white'
                            : opt.color === 'green'
                              ? 'bg-green-600 text-white'
                              : 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Séparateur */}
              <div className="h-6 w-px bg-gray-200" />

              {/* Checkbox Stock > 0 */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showOnlyWithStock}
                  onChange={e => setShowOnlyWithStock(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
                />
                <span className="text-xs text-gray-700">
                  Uniquement stock &gt; 0
                </span>
              </label>
            </div>

            {/* Reset + Compteur filtres actifs */}
            <div className="flex items-center gap-2">
              {activeFiltersCount > 0 && (
                <>
                  <Badge
                    variant="outline"
                    className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                  >
                    {activeFiltersCount} filtre
                    {activeFiltersCount > 1 ? 's' : ''} actif
                    {activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                  <ButtonV2
                    variant="ghost"
                    size="sm"
                    onClick={handleResetFilters}
                    className="text-xs text-gray-500 hover:text-red-600 h-7 px-2"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Réinitialiser
                  </ButtonV2>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table Inventaire - Dense */}
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
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredInventory.length === 0 ? (
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
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-center py-2 px-3 font-medium text-gray-900 text-xs w-16" />
                      <th className="text-left py-2 px-3 font-medium text-gray-900 text-xs">
                        Produit
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
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Entrant
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Sortant
                      </th>
                      <th className="text-right py-2 px-3 font-medium text-gray-900 text-xs">
                        Prév. Total
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
                    {filteredInventory.map(item => (
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
                            {item.stock_real}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
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
                        <td className="py-2 px-3 text-right">
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
                            <IconButton
                              icon={Settings}
                              variant="outline"
                              size="sm"
                              label="Ajuster le stock"
                              onClick={e => {
                                e.stopPropagation();
                                openAdjustmentModal(item);
                              }}
                            />
                            <IconButton
                              icon={History}
                              variant="outline"
                              size="sm"
                              label="Voir historique"
                              onClick={e => {
                                e.stopPropagation();
                                openHistoryModal(item);
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
          </CardContent>
        </Card>

        {/* Footer stats - Compact */}
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
      </div>

      {/* Modal Ajustement Stock - Inline */}
      <InventoryAdjustmentModal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        onSuccess={() => {
          void fetchInventory().catch(error => {
            console.error(
              '[Inventaire] onSuccess fetchInventory failed:',
              error
            );
          }); // Refresh data après ajustement
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
