'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Loader2, Package } from 'lucide-react';

import type { EnseigneProduct } from '../types';

interface EnseigneProductsTabProps {
  enseigneName: string;
  products: EnseigneProduct[];
  loading: boolean;
}

export function EnseigneProductsTab({
  enseigneName,
  products,
  loading,
}: EnseigneProductsTabProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center">
          <Package className="h-5 w-5 mr-2 text-blue-500" />
          Produits sources pour {enseigneName}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({products.length} produit{products.length > 1 ? 's' : ''})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun produit source pour cette enseigne
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/catalogue/produits/${product.id}`}
                className="group cursor-pointer"
              >
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 flex items-center justify-center group-hover:ring-2 ring-blue-500 transition-all">
                  {product.primary_image_url ? (
                    <Image
                      src={product.primary_image_url}
                      alt={product.name}
                      width={120}
                      height={120}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-gray-300" />
                  )}
                </div>
                <p className="text-xs font-medium truncate">{product.name}</p>
                {product.sku && (
                  <p className="text-xs text-gray-500 truncate">
                    {product.sku}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
