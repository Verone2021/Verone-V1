'use client';

import type { useRouter } from 'next/navigation';

import { Badge, ButtonV2, CloudflareImage } from '@verone/ui';
import { Eye, Edit3, Package, X } from 'lucide-react';

import {
  formatAttributesForDisplay,
  type VariantAttributes,
} from '@verone/types';

import type { GroupDimensions, VariantProductWithSupplier } from '../types';

interface VariantProductCardProps {
  product: VariantProductWithSupplier;
  variantType: string;
  hasCommonSupplier: boolean;
  groupDimensions: GroupDimensions | null;
  onRemove: (id: string, name: string) => void;
  onEdit: (product: VariantProductWithSupplier) => void;
  router: ReturnType<typeof useRouter>;
}

export function VariantProductCard({
  product,
  variantType: _variantType,
  hasCommonSupplier,
  groupDimensions,
  onRemove,
  onEdit,
  router,
}: VariantProductCardProps) {
  const attributesDisplay = formatAttributesForDisplay(
    product.variant_attributes as VariantAttributes
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      {/* Image compacte */}
      <div className="relative w-full h-32 bg-gray-50 flex-shrink-0">
        {product.image_url || product.cloudflare_image_id ? (
          <CloudflareImage
            cloudflareId={product.cloudflare_image_id}
            fallbackSrc={product.image_url}
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
        {product.variant_position && (
          <div className="absolute top-1.5 left-1.5">
            <Badge className="bg-black text-white text-[10px] px-1.5 py-0.5">
              #{product.variant_position}
            </Badge>
          </div>
        )}
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
        <div className="flex-none mb-2">
          <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 mb-0.5">
            {product.name}
          </h3>
          <p className="text-[10px] text-gray-500">SKU: {product.sku}</p>
        </div>

        <div className="flex-none mb-2">
          <div className="text-sm font-semibold text-black">
            {product.cost_price != null
              ? `${Number(product.cost_price).toFixed(2)} €`
              : 'N/A'}
          </div>
        </div>

        <div className="flex-1 mb-2">
          <div className="flex flex-wrap gap-1">
            {attributesDisplay.map((attr, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="text-[10px] px-1.5 py-0.5"
              >
                {attr.value}
              </Badge>
            ))}
            {product.weight && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-900 border-gray-300"
              >
                ⚖️ {product.weight}kg
              </Badge>
            )}
            {!hasCommonSupplier && product.supplier && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 border-blue-200"
              >
                🏢 {product.supplier.name}
              </Badge>
            )}
            {groupDimensions?.length && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 border-green-200"
              >
                📐 {groupDimensions.length}×{groupDimensions.width}×
                {groupDimensions.height}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex-none grid grid-cols-2 gap-1">
          <ButtonV2
            variant="outline"
            size="sm"
            className="text-[10px] h-7 w-full px-1"
            onClick={() => onEdit(product)}
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Modifier
          </ButtonV2>
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
