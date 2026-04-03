'use client';

import Image from 'next/image';
import { cn } from '@verone/utils';
import { Package, Search, Plus, Check, Loader2, X } from 'lucide-react';
import { CategoryFilterCombobox } from '@verone/categories';
import type { SelectionItem } from '../../hooks/use-linkme-selections';
import type { CartItem } from '../../hooks/use-create-linkme-order-form';

interface ProductSelectionSectionProps {
  items: SelectionItem[];
  isLoading: boolean;
  totalCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSubcategoryId: string | undefined;
  onSubcategoryChange: (id: string | undefined) => void;
  cart: CartItem[];
  onAddProduct: (item: SelectionItem) => void;
}

export function ProductSelectionSection({
  items,
  isLoading,
  totalCount,
  searchQuery,
  onSearchChange,
  selectedSubcategoryId,
  onSubcategoryChange,
  cart,
  onAddProduct,
}: ProductSelectionSectionProps) {
  return (
    <div className="space-y-3 border-t pt-6">
      <label className="block text-sm font-medium text-gray-700">
        <Package className="h-4 w-4 inline mr-1" />
        Produits disponibles ({totalCount})
      </label>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Rechercher (nom ou SKU)..."
            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <CategoryFilterCombobox
          value={selectedSubcategoryId}
          onValueChange={onSubcategoryChange}
          placeholder="Filtrer par catégorie..."
          entityType="products"
          className="w-64"
        />
      </div>

      {(searchQuery || selectedSubcategoryId) && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{items.length} produit(s) trouvé(s)</span>
          {(searchQuery || selectedSubcategoryId) && (
            <button
              onClick={() => {
                onSearchChange('');
                onSubcategoryChange(undefined);
              }}
              className="text-purple-600 hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-500">
            Chargement des produits...
          </span>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
          {items.map(item => {
            const isInCart = cart.some(c => c.product_id === item.product_id);
            const sellingPrice = item.selling_price_ht ?? item.base_price_ht;
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
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="h-4 w-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product?.name ?? 'Produit'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sellingPrice.toFixed(2)}€ HT
                    {item.margin_rate > 0 && (
                      <> • Marge {item.margin_rate.toFixed(0)}%</>
                    )}
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
          {searchQuery.trim()
            ? `Aucun produit ne correspond à "${searchQuery}"`
            : 'Aucun produit dans cette sélection'}
        </p>
      )}
    </div>
  );
}
