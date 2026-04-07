'use client';

import Image from 'next/image';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Eye, Package, X } from 'lucide-react';

import type { CollectionProductCardProps } from './types';

export function CollectionProductCard({
  product,
  position,
  onRemove,
  router,
}: CollectionProductCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image compacte */}
      <div className="relative w-full h-32 bg-gray-50 flex-shrink-0">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {/* Badge position si présent */}
        {position !== undefined && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-black text-white text-[10px] px-1.5 py-0.5">
              #{position}
            </Badge>
          </div>
        )}
        {/* Bouton retirer - petit */}
        <button
          onClick={() => onRemove(product.id, product.name)}
          className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1 opacity-0 hover:opacity-100 transition-opacity hover:bg-red-600"
          title={`Retirer ${product.name}`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Contenu compact */}
      <div className="p-3 flex-1 flex flex-col">
        {/* Nom + SKU compacts */}
        <div className="flex-none mb-2">
          <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-0.5">
            {product.name}
          </h3>
          {product.sku && (
            <p className="text-[10px] text-gray-500">SKU: {product.sku}</p>
          )}
        </div>

        {/* Prix compact */}
        <div className="flex-none mb-2">
          <div className="text-sm font-semibold text-black">
            {product.cost_price != null
              ? `${product.cost_price.toFixed(2)} €`
              : 'N/A'}
          </div>
        </div>

        {/* Bouton Détails */}
        <div className="flex-none mt-auto">
          <ButtonV2
            variant="outline"
            size="sm"
            className="text-[10px] h-7 w-full px-1"
            onClick={() => router.push(`/catalogue/${product.id}`)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Détails
          </ButtonV2>
        </div>
      </div>
    </div>
  );
}
