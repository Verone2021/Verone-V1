'use client';

import Image from 'next/image';

import { Package, Search, Check, Plus, Loader2, X } from 'lucide-react';

import { CategoryFilterCombobox } from '@verone/categories';
import { cn } from '@verone/utils';

import type { SelectionItem } from '../../../hooks/linkme/use-linkme-selections';
import type { CartItem } from './types';

interface ProductSelectionSectionProps {
  selectionDetails: { items?: SelectionItem[] } | null | undefined;
  selectionDetailsLoading: boolean;
  filteredSelectionItems: SelectionItem[];
  cart: CartItem[];
  productSearchQuery: string;
  onProductSearchQueryChange: (v: string) => void;
  selectedSubcategoryId: string | undefined;
  onSelectedSubcategoryIdChange: (v: string | undefined) => void;
  onAddProduct: (item: SelectionItem) => void;
}

export function ProductSelectionSection({
  selectionDetails,
  selectionDetailsLoading,
  filteredSelectionItems,
  cart,
  productSearchQuery,
  onProductSearchQueryChange,
  selectedSubcategoryId,
  onSelectedSubcategoryIdChange,
  onAddProduct,
}: ProductSelectionSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        <Package className="h-4 w-4 inline mr-1" />
        Produits disponibles ({selectionDetails?.items?.length ?? 0})
      </label>

      {/* Barre de recherche + Filtre catégorie */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={productSearchQuery}
            onChange={e => onProductSearchQueryChange(e.target.value)}
            placeholder="Rechercher (nom ou SKU)..."
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {productSearchQuery && (
            <button
              onClick={() => onProductSearchQueryChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <CategoryFilterCombobox
          value={selectedSubcategoryId}
          onValueChange={onSelectedSubcategoryIdChange}
          placeholder="Filtrer par catégorie..."
          entityType="products"
          className="w-64"
        />
      </div>

      {/* Indicateur de filtres actifs */}
      {(productSearchQuery || selectedSubcategoryId) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{filteredSelectionItems.length} produit(s) trouvé(s)</span>
          <button
            onClick={() => {
              onProductSearchQueryChange('');
              onSelectedSubcategoryIdChange(undefined);
            }}
            className="text-purple-600 hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Liste produits */}
      {selectionDetailsLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">
            Chargement des produits...
          </span>
        </div>
      ) : filteredSelectionItems.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 max-h-[28rem] overflow-y-auto">
          {filteredSelectionItems.map(item => {
            const isInCart = cart.some(c => c.product_id === item.product_id);
            const sellingPrice =
              item.selling_price_ht ??
              item.base_price_ht * (1 + item.margin_rate / 100);
            return (
              <button
                key={item.id}
                onClick={() => onAddProduct(item)}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg border transition-all text-left',
                  isInCart
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                )}
              >
                {item.product_image_url ? (
                  <Image
                    src={item.product_image_url}
                    alt={item.product?.name ?? ''}
                    width={56}
                    height={56}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product?.name ?? 'Produit'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sellingPrice.toFixed(2)}€ HT •{' '}
                    {item.margin_rate > 0
                      ? `marge ${item.margin_rate.toFixed(0)}%`
                      : (item.commission_rate ?? 0) > 0
                        ? `commission ${(item.commission_rate ?? 0).toFixed(0)}%`
                        : 'pas de marge'}
                  </p>
                </div>
                {isInCart ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Plus className="h-4 w-4 text-purple-600" />
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-2">
          {productSearchQuery.trim()
            ? `Aucun produit ne correspond à "${productSearchQuery}"`
            : 'Aucun produit dans cette sélection'}
        </p>
      )}
    </div>
  );
}
