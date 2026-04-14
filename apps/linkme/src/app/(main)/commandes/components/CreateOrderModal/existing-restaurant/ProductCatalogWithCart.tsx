'use client';

/**
 * ProductCatalogWithCart - Catalogue produits + panier en colonnes
 *
 * @module ProductCatalogWithCart
 * @since 2026-04-14
 */

import Image from 'next/image';

import { calculateMargin } from '@verone/utils';
import {
  AlertCircle,
  Loader2,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Star,
} from 'lucide-react';

import {
  CategoryTabs,
  Pagination,
  ProductFilters,
} from '@/components/public-selection';

import type { SelectionProduct } from '../../../../../../lib/hooks/use-affiliate-orders';
import type { CartItem, CartTotals } from '../types';

interface Category {
  id: string;
  name: string;
  count: number;
}

interface Selection {
  id: string;
  name: string;
  products_count: number;
}

interface ProductCatalogWithCartProps {
  selectedSelectionId: string | null;
  selectedSelection: Selection | undefined;
  products: SelectionProduct[] | undefined;
  productsLoading: boolean;
  productsError: Error | null;
  paginatedProducts: SelectionProduct[];
  filteredProducts: SelectionProduct[];
  categories: Category[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  cart: CartItem[];
  cartTotals: CartTotals;
  notes: string;
  setNotes: (v: string) => void;
  onAddToCart: (product: SelectionProduct) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

const DEFAULT_BRANDING = {
  primary_color: '#3b82f6',
  secondary_color: '#1e40af',
  accent_color: '#60a5fa',
  text_color: '#1f2937',
  background_color: '#ffffff',
  logo_url: null,
};

export function ProductCatalogWithCart({
  selectedSelectionId,
  selectedSelection,
  products,
  productsLoading,
  productsError,
  paginatedProducts,
  filteredProducts,
  categories,
  totalPages,
  currentPage,
  setCurrentPage,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  cart,
  cartTotals,
  notes,
  setNotes,
  onAddToCart,
  onUpdateQuantity,
}: ProductCatalogWithCartProps) {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-gray-50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Sélection de produits</h3>
          {selectedSelection && (
            <span className="text-sm text-gray-500">
              — {selectedSelection.name}
            </span>
          )}
        </div>
      </div>

      {!selectedSelectionId ? (
        <div className="p-8 text-center">
          <Star className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Sélectionnez d&apos;abord une sélection de produits
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-4 p-4">
          {/* COLONNE GAUCHE: CATALOGUE */}
          <div className="space-y-4">
            <ProductFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              branding={DEFAULT_BRANDING}
              isSearchOpen={false}
              onSearchOpenChange={() => {}}
            />

            {categories.length > 1 && (
              <CategoryTabs
                categories={categories}
                selectedCategory={selectedCategory}
                selectedSubcategory={null}
                onCategoryChange={setSelectedCategory}
                onSubcategoryChange={() => {}}
                branding={DEFAULT_BRANDING}
                totalCount={products?.length ?? 0}
              />
            )}

            {(searchQuery || selectedCategory) && (
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {filteredProducts.length} résultat
                  {filteredProducts.length > 1 ? 's' : ''}
                  {searchQuery && ` pour "${searchQuery}"`}
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Effacer les filtres
                </button>
              </div>
            )}

            {productsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : productsError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600">Erreur de chargement</p>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {paginatedProducts.map((product: SelectionProduct) => {
                  const inCart = cart.find(
                    item => item.selectionItemId === product.id
                  );
                  return (
                    <div
                      key={product.id}
                      className={`p-4 border rounded-xl transition-all ${
                        inCart
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {product.productImage ? (
                            <Image
                              src={product.productImage}
                              alt={product.productName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-2 text-sm">
                            {product.productName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {product.productSku}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-sm font-semibold text-gray-900">
                              {product.sellingPriceHt.toFixed(2)} €
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded">
                              {product.marginRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-end">
                        {inCart ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onUpdateQuantity(product.id, -1)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-semibold text-sm">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => onAddToCart(product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">
                  {searchQuery || selectedCategory
                    ? 'Aucun produit ne correspond à votre recherche'
                    : 'Aucun produit disponible'}
                </p>
                {(searchQuery || selectedCategory) && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="mt-4 text-blue-600 hover:underline font-medium"
                  >
                    Voir tous les produits
                  </button>
                )}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                branding={{
                  primary_color: '#3b82f6',
                  secondary_color: '#1e40af',
                  accent_color: '#60a5fa',
                  text_color: '#1f2937',
                }}
              />
            )}
          </div>

          {/* COLONNE DROITE: PANIER */}
          <div className="space-y-4">
            {cart.length > 0 ? (
              <div className="sticky top-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-900">Panier</h4>
                </div>

                <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                  {cart.map(item => {
                    const { gainEuros } = calculateMargin({
                      basePriceHt: item.basePriceHt,
                      marginRate: item.marginRate,
                    });
                    return (
                      <div
                        key={item.selectionItemId}
                        className="flex items-center justify-between bg-white rounded-lg p-3 text-sm"
                      >
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            x{item.quantity} • {item.unitPriceHt.toFixed(2)} €
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {(item.quantity * item.unitPriceHt).toFixed(2)} €
                          </p>
                          <p className="text-xs text-green-600">
                            +{(gainEuros * item.quantity).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-blue-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Articles</span>
                    <span className="font-medium">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total HT</span>
                    <span className="font-medium">
                      {cartTotals.totalHt.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">TVA</span>
                    <span className="font-medium">
                      {cartTotals.totalTva.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-base font-bold border-t border-blue-200 pt-2">
                    <span className="text-gray-900">Total TTC</span>
                    <span className="text-blue-600">
                      {cartTotals.totalTtc.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex justify-between text-sm bg-green-50 rounded-lg p-2 border border-green-200">
                    <span className="text-green-700 font-medium">
                      Votre commission
                    </span>
                    <span className="text-green-700 font-bold">
                      +{cartTotals.totalMargin.toFixed(2)} €
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Instructions spéciales..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="sticky top-4 bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Votre panier est vide</p>
                <p className="text-gray-400 text-xs mt-1">
                  Ajoutez des produits pour commencer
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
