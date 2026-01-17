'use client';

/**
 * Composant: ProductStockSection
 * Section stock du produit (readonly - informations uniquement)
 */

import { Badge } from '@verone/ui';

import type { SiteInternetProduct } from '../../../types';

interface ProductStockSectionProps {
  product: SiteInternetProduct;
}

export default function ProductStockSection({
  product,
}: ProductStockSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Stock & Disponibilité
        </h2>
        <Badge variant="outline">Lecture seule</Badge>
      </div>

      {/* Contenu */}
      <div className="space-y-4">
        {/* Informations produit */}
        <div>
          <span className="text-sm font-medium text-gray-700 block mb-2">
            Type de produit
          </span>
          <p className="text-sm text-gray-700">
            {product.product_type || (
              <span className="text-gray-400 italic">Non défini</span>
            )}
          </p>
        </div>

        {/* Sous-catégorie */}
        {product.subcategory_name && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Sous-catégorie
            </span>
            <p className="text-sm text-gray-700">{product.subcategory_name}</p>
          </div>
        )}

        {/* Dimensions */}
        {product.dimensions && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Dimensions
            </span>
            <p className="text-sm text-gray-700">
              {JSON.stringify(product.dimensions)}
            </p>
          </div>
        )}

        {/* Poids */}
        {product.weight && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Poids
            </span>
            <p className="text-sm text-gray-700">{product.weight} kg</p>
          </div>
        )}

        {/* MOQ Fournisseur */}
        {product.supplier_moq && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Quantité min. fournisseur
            </span>
            <p className="text-sm text-gray-700">
              {product.supplier_moq} unités
            </p>
          </div>
        )}

        {/* Pièces compatibles */}
        {product.suitable_rooms.length > 0 && (
          <div>
            <span className="text-sm font-medium text-gray-700 block mb-2">
              Pièces compatibles
            </span>
            <div className="flex flex-wrap gap-2">
              {product.suitable_rooms.map((room, index) => (
                <Badge key={index} variant="outline">
                  {room}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
