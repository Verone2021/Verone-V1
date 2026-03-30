'use client';

/**
 * Composant: ProductStockSection
 * Section stock du produit (readonly - informations uniquement)
 */

import { Badge } from '@verone/ui';

import type { SiteInternetProduct } from '../../../types';

function StockField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-sm font-medium text-gray-700 block mb-2">
        {label}
      </span>
      {children}
    </div>
  );
}

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
        <StockField label="Type de produit">
          <p className="text-sm text-gray-700">
            {product.product_type ?? (
              <span className="text-gray-400 italic">Non défini</span>
            )}
          </p>
        </StockField>
        {product.subcategory_name && (
          <StockField label="Sous-catégorie">
            <p className="text-sm text-gray-700">{product.subcategory_name}</p>
          </StockField>
        )}
        {product.dimensions && (
          <StockField label="Dimensions">
            <p className="text-sm text-gray-700">
              {JSON.stringify(product.dimensions)}
            </p>
          </StockField>
        )}
        {product.weight && (
          <StockField label="Poids">
            <p className="text-sm text-gray-700">{product.weight} kg</p>
          </StockField>
        )}
        {product.supplier_moq && (
          <StockField label="Quantité min. fournisseur">
            <p className="text-sm text-gray-700">
              {product.supplier_moq} unités
            </p>
          </StockField>
        )}
        {product.suitable_rooms.length > 0 && (
          <StockField label="Pièces compatibles">
            <div className="flex flex-wrap gap-2">
              {product.suitable_rooms.map((room, index) => (
                <Badge key={index} variant="outline">
                  {room}
                </Badge>
              ))}
            </div>
          </StockField>
        )}
      </div>
    </div>
  );
}
