'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Badge, Card, CardContent } from '@verone/ui';
import { Package } from 'lucide-react';

import type { CustomerProduct } from './customer-detail.types';

interface CustomerProductsTabProps {
  products: CustomerProduct[];
  loading: boolean;
}

export function CustomerProductsTab({
  products,
  loading,
}: CustomerProductsTabProps) {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4" />
        <p className="text-gray-600">Chargement des produits...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-black mb-2">
          Aucun produit sourcé
        </h3>
        <p className="text-gray-600">
          Aucun produit n&apos;a été sourcé pour ce client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-black">
          Produits sourcés pour ce client
        </h3>
        <Badge variant="secondary">{products.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(product => (
          <Link
            key={product.id}
            href={`/produits/catalogue/${product.id}`}
            className="block"
          >
            <Card className="hover:border-black transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {product.primary_image_url ? (
                    <Image
                      src={product.primary_image_url}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="object-cover rounded"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-black truncate">
                      {product.name}
                    </h4>
                    {product.sku && (
                      <p className="text-xs text-gray-500">
                        SKU: {product.sku}
                      </p>
                    )}
                    <Badge
                      variant={
                        product.product_status === 'active'
                          ? 'success'
                          : 'secondary'
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {product.product_status === 'active'
                        ? 'Actif'
                        : product.product_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
