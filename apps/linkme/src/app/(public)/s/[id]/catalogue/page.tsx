'use client';

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { Minus, Package, Plus, Star } from 'lucide-react';

import {
  Pagination,
  SelectionCategoryBar,
} from '@/components/public-selection';

import { useSelection } from '../selection-context';

const ITEMS_PER_PAGE = 12;

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function CataloguePage() {
  const { items, branding, cart, categories, addToCart, updateQuantity } =
    useSelection();

  const [_isSearchOpen, _setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_sku.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        item => item.category_name === selectedCategory
      );
      if (selectedSubcategory) {
        filtered = filtered.filter(
          item => item.subcategory_id === selectedSubcategory
        );
      }
    }

    // Sort by featured first
    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return 0;
    });

    return sorted;
  }, [items, searchQuery, selectedCategory, selectedSubcategory]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubcategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-6">
        {/* Products Grid */}
        <div className="flex-1">
          {/* Category Bar */}
          <div className="mb-6">
            <SelectionCategoryBar
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={cat => {
                setSelectedCategory(cat);
                setSelectedSubcategory(null);
              }}
              branding={branding}
              totalCount={items.length}
            />
          </div>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredItems.length} produit
              {filteredItems.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* Products */}
          {paginatedItems.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedItems.map(item => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                  >
                    {/* Image */}
                    <div className="relative aspect-square bg-gray-100">
                      {item.product_image ? (
                        <Image
                          src={item.product_image}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      {item.is_featured && (
                        <div className="absolute top-2 right-2 bg-yellow-400 text-white p-1.5 rounded-full shadow">
                          <Star className="h-3.5 w-3.5 fill-current" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3
                        className="font-semibold text-sm mb-1 line-clamp-2"
                        style={{ color: branding.text_color }}
                      >
                        {item.product_name}
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        {item.product_sku}
                      </p>

                      <div className="flex items-center justify-between">
                        {/* Price */}
                        <div>
                          <span
                            className="text-xl font-bold"
                            style={{ color: branding.text_color }}
                          >
                            {formatPrice(item.selling_price_ttc)}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            TTC
                          </span>
                        </div>

                        {/* Add to Cart / Quantity */}
                        {inCart ? (
                          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-6 text-center font-medium text-sm">
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1 text-white py-1.5 px-2.5 rounded-lg text-xs transition-colors hover:opacity-90"
                            style={{
                              backgroundColor: branding.primary_color,
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">
                {searchQuery || selectedCategory
                  ? 'Aucun produit ne correspond à votre recherche'
                  : 'Aucun produit dans cette selection'}
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className="mt-4 text-sm font-medium hover:underline"
                  style={{ color: branding.primary_color }}
                >
                  Voir tous les produits
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              branding={branding}
            />
          )}
        </div>
      </div>
    </div>
  );
}
