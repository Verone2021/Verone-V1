'use client';

import { cn } from '@verone/utils';

import type { ProductForCharacteristics } from './product-fixed-characteristics-utils';

interface DimensionsData {
  length: number | null;
  width: number | null;
  height: number | null;
  diameter: number | null;
  unit: string;
  fromGroup: boolean;
}

function getNum(
  obj: Record<string, unknown> | null,
  ...keys: string[]
): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === 'number') return v;
  }
  return null;
}

export function extractDimensions(
  product: ProductForCharacteristics
): DimensionsData | null {
  const variantGroup = product.variant_group;
  const hasGroupDimensions =
    variantGroup?.dimensions_length != null ||
    variantGroup?.dimensions_width != null ||
    variantGroup?.dimensions_height != null;

  const dims = product.dimensions as Record<string, unknown> | null;
  const productLength = getNum(dims, 'length_cm', 'length');
  const productWidth = getNum(dims, 'width_cm', 'width');
  const productHeight = getNum(dims, 'height_cm', 'height');
  const productDepth = getNum(dims, 'depth_cm', 'depth');
  const productDiameter = getNum(dims, 'diameter_cm', 'diameter');
  const hasProductDimensions =
    productLength != null ||
    productWidth != null ||
    productHeight != null ||
    productDepth != null ||
    productDiameter != null;

  if (hasGroupDimensions) {
    return {
      length: variantGroup?.dimensions_length ?? null,
      width: variantGroup?.dimensions_width ?? null,
      height: variantGroup?.dimensions_height ?? null,
      diameter: null,
      unit: variantGroup?.dimensions_unit ?? 'cm',
      fromGroup: true,
    };
  }

  if (hasProductDimensions) {
    return {
      length: productLength ?? productDepth,
      width: productWidth,
      height: productHeight,
      diameter: productDiameter,
      unit: 'cm',
      fromGroup: false,
    };
  }

  return null;
}

interface ProductDimensionsSectionProps {
  product: ProductForCharacteristics;
}

export function ProductDimensionsSection({
  product,
}: ProductDimensionsSectionProps) {
  const dimensions = extractDimensions(product);

  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
        📐 Dimensions
        {dimensions?.fromGroup && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
            🔒 Héritées du groupe
          </span>
        )}
      </h4>
      {dimensions ? (
        <div
          className={cn(
            'p-3 rounded-lg border',
            dimensions.fromGroup
              ? 'bg-green-50 border-green-200'
              : 'bg-blue-50 border-blue-200'
          )}
        >
          <div className="text-sm font-medium text-black">
            {dimensions.diameter != null ? (
              <>
                &#8960; {dimensions.diameter} {dimensions.unit}
              </>
            ) : (
              <>
                L: {dimensions.length ?? '-'} × l: {dimensions.width ?? '-'} ×
                H: {dimensions.height ?? '-'} {dimensions.unit ?? 'cm'}
              </>
            )}
          </div>
          {dimensions.fromGroup && product.variant_group_id && (
            <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
              📏 Dimensions communes à toutes les variantes du groupe
              <a
                href={`/catalogue/variantes/${product.variant_group_id}`}
                className="underline font-medium hover:text-green-800 ml-1"
              >
                (modifier dans le groupe)
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="text-gray-400 italic text-sm">Non renseignées</div>
        </div>
      )}
    </div>
  );
}
