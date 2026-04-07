'use client';

import { ProductThumbnail } from '@verone/products';
import {
  ButtonV2,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from '@verone/ui';
import { Check, Package, Plus, Search, User } from 'lucide-react';

import type { LinkMeCatalogProduct } from '../../hooks/use-linkme-catalog';
import type { LinkMeUser } from '../../hooks/use-linkme-users';

interface NewSelectionCatalogProps {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  catalogLoading: boolean;
  filteredCatalog: LinkMeCatalogProduct[];
  selectedProductIds: Set<string>;
  selectedUser: LinkMeUser | null;
  onAddProduct: (product: LinkMeCatalogProduct) => void;
}

export function NewSelectionCatalog({
  searchQuery,
  onSearchChange,
  catalogLoading,
  filteredCatalog,
  selectedProductIds,
  selectedUser,
  onAddProduct,
}: NewSelectionCatalogProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Étape 2 : Catalogue LinkMe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher un produit..."
            className="pl-10"
          />
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {catalogLoading ? (
            <div className="text-center py-8 text-gray-500">
              Chargement du catalogue...
            </div>
          ) : !selectedUser ? (
            <div className="text-center py-8 text-gray-500">
              <User className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Sélectionnez un utilisateur</p>
              <p className="text-sm mt-1">pour voir les produits disponibles</p>
            </div>
          ) : filteredCatalog.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>Aucun produit disponible</p>
              <p className="text-sm mt-1">pour cette organisation</p>
            </div>
          ) : (
            filteredCatalog.map(product => {
              const isSelected = selectedProductIds.has(product.product_id);
              const basePriceHT = Number(product.product_price_ht);
              return (
                <div
                  key={product.product_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <ProductThumbnail
                    src={product.product_image_url}
                    alt={product.product_name}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.product_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {product.product_reference}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {basePriceHT.toFixed(2)} € HT
                      {product.suggested_margin_rate && (
                        <span className="text-gray-400">
                          {' '}
                          / Marge suggérée:{' '}
                          {Number(product.suggested_margin_rate).toFixed(1)}%
                        </span>
                      )}
                    </p>
                  </div>
                  <ButtonV2
                    variant={isSelected ? 'ghost' : 'secondary'}
                    size="sm"
                    icon={isSelected ? Check : Plus}
                    onClick={() => !isSelected && onAddProduct(product)}
                    disabled={isSelected}
                  >
                    {isSelected ? 'Ajouté' : 'Ajouter'}
                  </ButtonV2>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500 text-center">
          {filteredCatalog.length} produit(s) disponible(s)
        </div>
      </CardContent>
    </Card>
  );
}
