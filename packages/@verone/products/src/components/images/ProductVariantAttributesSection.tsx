'use client';

import { cn } from '@verone/utils';

import {
  VARIANT_ATTRIBUTE_LABELS,
  type ProductForCharacteristics,
} from './product-fixed-characteristics-utils';

interface ProductVariantAttributesSectionProps {
  product: ProductForCharacteristics;
}

export function ProductVariantAttributesSection({
  product,
}: ProductVariantAttributesSectionProps) {
  const variantAttributes = product.variant_attributes ?? {};

  return (
    <div>
      <h4 className="text-sm font-medium text-black mb-2 opacity-70">
        Attributs de variante
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {['color', 'material', 'finish', 'pattern', 'style'].map(key => {
          const attributeInfo = VARIANT_ATTRIBUTE_LABELS[key] ?? {
            label: key,
            emoji: '🔹',
          };
          const value: unknown = variantAttributes[key];
          const displayValue = typeof value === 'string' ? value : null;
          return (
            <div
              key={key}
              className={cn(
                'p-2 rounded border',
                displayValue
                  ? 'bg-purple-50 border-purple-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              <span className="text-xs text-black opacity-60 flex items-center gap-1">
                <span>{attributeInfo.emoji}</span>
                {attributeInfo.label}
              </span>
              <div className="font-medium text-black">
                {displayValue ?? (
                  <span className="text-gray-400 italic text-sm">
                    Non renseigné
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {Object.entries(variantAttributes)
          .filter(
            ([key]) =>
              ![
                'color',
                'material',
                'finish',
                'pattern',
                'style',
                'size',
              ].includes(key)
          )
          .map(([key, value]) => {
            const attributeInfo = VARIANT_ATTRIBUTE_LABELS[key] ?? {
              label: key,
              emoji: '🔹',
            };
            const displayValue =
              typeof value === 'string' ? value : String(value);
            return (
              <div
                key={key}
                className="bg-blue-50 p-2 rounded border border-blue-200"
              >
                <span className="text-xs text-black opacity-60 flex items-center gap-1">
                  <span>{attributeInfo.emoji}</span>
                  {attributeInfo.label}
                </span>
                <div className="font-medium text-black">
                  {displayValue ?? (
                    <span className="text-gray-400 italic">Non défini</span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
      {product.variant_group_id && (
        <div className="text-xs text-purple-600 mt-1 flex items-center gap-1">
          ℹ️ Attributs spécifiques à cette variante du groupe
          <a
            href={`/catalogue/variantes/${product.variant_group_id}`}
            className="underline font-medium hover:text-purple-800"
          >
            (voir le groupe)
          </a>
        </div>
      )}
    </div>
  );
}
