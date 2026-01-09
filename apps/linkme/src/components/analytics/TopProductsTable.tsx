/**
 * TopProductsTable
 * Tableau des produits les plus vendus avec BarList Tremor
 *
 * Design premium avec images produits et barres de progression
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, Badge } from '@tremor/react';
import { Package, TrendingUp, ArrowRight } from 'lucide-react';

import type { TopProductData } from '../../types/analytics';
import { formatCurrency } from '../../types/analytics';

interface TopProductsTableProps {
  products: TopProductData[] | undefined;
  isLoading?: boolean;
  title?: string;
  maxItems?: number;
}

export function TopProductsTable({
  products,
  isLoading,
  title = 'Top 10 Produits Vendus',
  maxItems = 10,
}: TopProductsTableProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <div className="h-12 w-12 bg-gray-200 rounded" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const displayProducts = (products || []).slice(0, maxItems);

  // Trouver le max pour la barre de progression
  const maxQuantity = Math.max(...displayProducts.map(p => p.quantitySold), 1);

  // Préparer données pour BarList
  const barListData = displayProducts.map((product, index) => ({
    name: product.productName,
    value: product.quantitySold,
    icon: () => (
      <div className="flex items-center gap-3 mr-2">
        <span className="text-sm font-bold text-gray-400 w-6">
          #{index + 1}
        </span>
        <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {product.productImageUrl ? (
            <Image
              src={product.productImageUrl}
              alt={product.productName}
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    ),
  }));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <Badge color="gray" size="sm">
            {displayProducts.length} produits
          </Badge>
          <Link
            href="/statistiques/produits"
            className="flex items-center gap-1 text-sm text-[#5DBEBB] hover:text-[#3976BB] transition-colors"
          >
            Voir tout
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {displayProducts.length > 0 ? (
        <div className="space-y-4">
          {displayProducts.map((product, index) => (
            <div
              key={product.productId}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Rang */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                <span className="text-sm font-bold text-gray-600">
                  {index + 1}
                </span>
              </div>

              {/* Image */}
              <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {product.productImageUrl ? (
                  <Image
                    src={product.productImageUrl}
                    alt={product.productName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Infos produit */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {product.productName}
                </p>
                <p className="text-sm text-gray-500">
                  {product.productSku && (
                    <span className="mr-2">SKU: {product.productSku}</span>
                  )}
                </p>
                {/* Barre de progression */}
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${(product.quantitySold / maxQuantity) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">
                  {product.quantitySold} vendus
                </p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(product.revenueHT)} CA
                </p>
                <p className="text-xs text-emerald-600">
                  {formatCurrency(product.commissionHT)} comm.
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune vente enregistrée</p>
          <p className="text-sm text-gray-400">
            Vos produits les plus vendus apparaîtront ici
          </p>
        </div>
      )}
    </Card>
  );
}

export default TopProductsTable;
