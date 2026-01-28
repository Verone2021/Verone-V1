/**
 * SelectionPerformanceCard
 * Card expandable pour les performances d'une sélection
 *
 * Affiche les KPIs et permet le drill-down pour voir les produits vendus
 */

'use client';

import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { Card, ProgressBar, Badge } from '@tremor/react';
import {
  ChevronDown,
  ChevronUp,
  Package,
  Eye,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

import { useSelectionTopProducts } from '../../lib/hooks/use-affiliate-analytics';
import type { SelectionPerformance } from '../../types/analytics';
import { formatCurrency, formatPercentage } from '../../types/analytics';

interface SelectionPerformanceCardProps {
  selection: SelectionPerformance;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export function SelectionPerformanceCard({
  selection,
  isExpanded: controlledExpanded,
  onToggle,
}: SelectionPerformanceCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;

  const { data: topProducts, isLoading: isLoadingProducts } =
    useSelectionTopProducts(isExpanded ? selection.id : null);

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Calculer le taux de conversion pour la couleur
  const conversionColor =
    selection.conversionRate >= 5
      ? 'emerald'
      : selection.conversionRate >= 2
        ? 'blue'
        : 'orange';

  return (
    <Card className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Header avec image */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
        {selection.imageUrl ? (
          <Image
            src={selection.imageUrl}
            alt={selection.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-12 w-12 text-gray-400" />
          </div>
        )}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {/* Titre sur image */}
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="text-lg font-bold text-white truncate">
            {selection.name}
          </h3>
          {selection.publishedAt && (
            <Badge color="emerald" size="sm" className="mt-1">
              Publiée
            </Badge>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Produits */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {selection.productsCount} produits
            </span>
          </div>

          {/* Vues */}
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {selection.views.toLocaleString()} vues
            </span>
          </div>

          {/* Commandes */}
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-emerald-500" />
            <span className="text-sm text-gray-600">
              {selection.orders} commandes
            </span>
          </div>

          {/* CA */}
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-900">
              {formatCurrency(selection.revenue)}
            </span>
          </div>
        </div>

        {/* Taux de conversion */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Taux de conversion</span>
            <Badge color={conversionColor} size="sm">
              {formatPercentage(selection.conversionRate)}
            </Badge>
          </div>
          <ProgressBar
            value={Math.min(selection.conversionRate, 10) * 10}
            color={conversionColor}
            className="h-2"
          />
        </div>

        {/* Bouton expand */}
        <button
          onClick={handleToggle}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Masquer les détails
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Voir les produits vendus
            </>
          )}
        </button>
      </div>

      {/* Section expandable - Top produits */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">
              Top produits vendus
            </h4>
            <Link
              href={`/ma-selection?id=${selection.id}`}
              className="flex items-center gap-1 text-xs text-cyan-600 hover:text-cyan-700"
            >
              Voir la sélection
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {isLoadingProducts ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-3 py-2"
                >
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-24 mb-1" />
                    <div className="h-2 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : topProducts && topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.slice(0, 5).map((product, index) => (
                <div
                  key={product.productId}
                  className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white transition-colors"
                >
                  <span className="text-xs font-bold text-gray-400 w-4">
                    {index + 1}
                  </span>
                  <div className="relative h-8 w-8 rounded overflow-hidden bg-white flex-shrink-0">
                    {product.productImageUrl ? (
                      <Image
                        src={product.productImageUrl}
                        alt={product.productName}
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.productName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.quantitySold} vendus
                    </p>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(product.revenueHT)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Aucune vente pour cette sélection
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default SelectionPerformanceCard;
