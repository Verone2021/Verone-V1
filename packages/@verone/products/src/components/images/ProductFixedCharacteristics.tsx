'use client';

import { Package, Edit2 } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { cn } from '@verone/utils';

import {
  formatStyle,
  type ProductForCharacteristics,
} from './product-fixed-characteristics-utils';
import { ProductVariantAttributesSection } from './ProductVariantAttributesSection';
import { ProductCompatibleRoomsSection } from './ProductCompatibleRoomsSection';
import { ProductDimensionsSection } from './ProductDimensionsSection';

interface ProductFixedCharacteristicsProps {
  product: ProductForCharacteristics;
  className?: string;
  onEditVideoUrl?: () => void;
}

export function ProductFixedCharacteristics({
  product,
  className,
  onEditVideoUrl,
}: ProductFixedCharacteristicsProps) {
  const variantAttributes = product.variant_attributes ?? {};
  const hasVariantAttributes = Object.keys(variantAttributes).length > 0;

  const displayWeight = product.variant_group_id
    ? (product.variant_group?.common_weight ?? null)
    : (product.weight ?? null);
  const weightFromGroup = !!(
    product.variant_group_id && product.variant_group?.common_weight
  );

  const hasAnyContent =
    hasVariantAttributes ||
    product.weight != null ||
    product.variant_group?.common_weight != null ||
    product.dimensions != null ||
    product.variant_group?.dimensions_length != null ||
    Boolean(product.video_url);

  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Caractéristiques
        </h3>
        {onEditVideoUrl && (
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onEditVideoUrl}
            className="text-xs"
          >
            <Edit2 className="h-3 w-3 mr-1" />
            Éditer vidéo
          </ButtonV2>
        )}
      </div>

      <div className="space-y-4">
        <ProductVariantAttributesSection product={product} />
        <ProductCompatibleRoomsSection product={product} />
        <ProductDimensionsSection product={product} />

        {/* Poids */}
        <div>
          <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
            ⚖️ Poids
            {weightFromGroup && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                🔒 Hérité du groupe
              </span>
            )}
          </h4>
          {displayWeight != null ? (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-black">
                {displayWeight} kg
              </div>
              {weightFromGroup && product.variant_group_id && (
                <div className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                  ⚖️ Poids commun à toutes les variantes du groupe
                  <a
                    href={`/catalogue/variantes/${product.variant_group_id}`}
                    className="underline font-medium hover:text-blue-800 ml-1"
                  >
                    (modifier dans le groupe)
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-gray-400 italic text-sm">Non renseigné</div>
            </div>
          )}
        </div>

        {/* Style décoratif (hérité du Variant Group) */}
        {product.variant_group?.style && product.variant_group_id && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70 flex items-center gap-2">
              🎨 Style décoratif (hérité du groupe)
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                🔒 Non modifiable ici
              </span>
            </h4>
            <div className="bg-purple-50 p-3 rounded border border-purple-200">
              <Badge variant="outline" className="bg-white">
                {formatStyle(product.variant_group.style)}
              </Badge>
              <div className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                🎨 Style commun à toutes les variantes du groupe
                {product.variant_group_id && (
                  <a
                    href={`/catalogue/variantes/${product.variant_group_id}`}
                    className="underline font-medium hover:text-purple-800 ml-1"
                  >
                    (modifier dans le groupe)
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Vidéo (spécifique à la variante) */}
        {product.video_url && (
          <div>
            <h4 className="text-sm font-medium text-black mb-2 opacity-70">
              Vidéo produit
            </h4>
            <div className="bg-green-50 p-3 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <Package className="h-4 w-4 mr-2 text-green-600" />
                  <span className="text-green-700 font-medium">
                    Vidéo disponible
                  </span>
                </div>
                {onEditVideoUrl && (
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    onClick={onEditVideoUrl}
                    className="h-7 text-xs"
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Modifier
                  </ButtonV2>
                )}
              </div>
              <div className="text-xs text-green-600 mt-1 break-all">
                {product.video_url}
              </div>
            </div>
          </div>
        )}

        {/* Message si caractéristiques manquantes */}
        {!hasAnyContent && (
          <div className="text-center py-6">
            <Package className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <div className="text-sm text-gray-400">
              Aucune caractéristique définie
            </div>
            {product.variant_group_id && (
              <div className="text-xs text-gray-400 mt-1">
                Les caractéristiques sont gérées au niveau du groupe de
                variantes
              </div>
            )}
          </div>
        )}

        {/* Note explicative */}
        {product.variant_group_id && (
          <div className="border-t border-gray-200 pt-3 mt-4">
            <div className="text-xs text-gray-600 space-y-1">
              <div className="font-medium">
                📋 Règles de gestion (système variant_groups) :
              </div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Attributs variantes</strong> : Différences spécifiques
                  entre produits du groupe (couleur, matériau)
                </li>
                <li>
                  <strong>Dimensions/Poids</strong> : Peuvent varier ou être
                  communes selon le groupe
                </li>
                <li>
                  <strong>Édition</strong> : Gérer les variantes depuis la page
                  du groupe
                </li>
                <li>
                  <strong>Images/Vidéos</strong> : Spécifiques à chaque produit
                  (modifiables individuellement)
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
