'use client';

/**
 * Page Catalogue
 *
 * Affiche les produits de la sélection avec:
 * - Grille paginée (12 produits par page)
 * - Sidebar filtres catégories (droite)
 * - Recherche
 * - Bouton "Ajouter" compact
 *
 * @module CataloguePage
 * @since 2026-01-12
 */

import { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';

import { cn } from '@verone/ui';
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Package,
  Plus,
  Search,
  Star,
} from 'lucide-react';

import { usePublicSelection } from '@/contexts/PublicSelectionContext';

// ============================================
// CONSTANTS
// ============================================

const PRODUCTS_PER_PAGE = 12;

// ============================================
// HELPERS
// ============================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function CataloguePage() {
  const { items, branding, cart, addToCart, updateQuantity } =
    usePublicSelection();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Extract categories
  const categories = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach(item => {
      const cat = item.category ?? 'Autres';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.product_name.toLowerCase().includes(q) ||
          item.product_sku.toLowerCase().includes(q)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(
        item => (item.category ?? 'Autres') === selectedCategory
      );
    }

    return filtered;
  }, [items, searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredItems.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex max-w-7xl mx-auto">
      {/* Main content - Products grid */}
      <main className="flex-1 p-6">
        {/* Search results info */}
        {(searchQuery || selectedCategory) && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {filteredItems.length} résultat
              {filteredItems.length > 1 ? 's' : ''}
              {searchQuery && ` pour "${searchQuery}"`}
              {selectedCategory && ` dans "${selectedCategory}"`}
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              className="text-sm font-medium hover:underline"
              style={{ color: branding.primary_color }}
            >
              Effacer les filtres
            </button>
          </div>
        )}

        {/* Products grid */}
        {paginatedItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedItems.map(item => {
              const inCart = cart.find(c => c.id === item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  style={
                    item.is_featured
                      ? { boxShadow: `0 0 0 2px ${branding.accent_color}` }
                      : undefined
                  }
                >
                  {/* Product image */}
                  <div className="relative h-40 bg-gray-100 overflow-hidden group">
                    {item.product_image ? (
                      <Image
                        src={item.product_image}
                        alt={item.product_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="h-12 w-12" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                      {item.is_featured && (
                        <span
                          className="text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 shadow-sm"
                          style={{ backgroundColor: branding.accent_color }}
                        >
                          <Star className="h-3 w-3 fill-current" />
                          Vedette
                        </span>
                      )}
                      {!item.is_featured && <span />}
                      {item.stock_quantity > 0 ? (
                        <span
                          className="text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm"
                          style={{ backgroundColor: branding.primary_color }}
                        >
                          Stock: {item.stock_quantity}
                        </span>
                      ) : (
                        <span className="bg-amber-500 text-white text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                          Sur commande
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product info */}
                  <div className="p-3">
                    <h3
                      className="font-medium text-sm line-clamp-2 mb-2"
                      style={{ color: branding.text_color }}
                    >
                      {item.product_name}
                    </h3>

                    <div className="flex items-center justify-between">
                      <span className="font-bold">
                        {formatPrice(item.selling_price_ttc)}
                      </span>

                      {inCart ? (
                        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-medium">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        /* Compact add button */
                        <button
                          onClick={() => addToCart(item)}
                          className="flex items-center gap-1 text-white py-1.5 px-3 rounded-lg text-sm transition-colors hover:opacity-90"
                          style={{ backgroundColor: branding.primary_color }}
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
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-10 h-10 rounded-lg font-medium transition-colors',
                  currentPage === page
                    ? 'bg-linkme-turquoise text-white'
                    : 'border hover:bg-gray-50'
                )}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </main>

      {/* Sidebar - Filters */}
      <aside className="hidden lg:block w-64 bg-white border-l p-4 sticky top-[140px] h-[calc(100vh-140px)] overflow-y-auto">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-linkme-turquoise/50 focus:border-linkme-turquoise"
          />
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-semibold text-sm text-gray-700 mb-3">
            Catégories
          </h3>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                !selectedCategory
                  ? 'bg-linkme-turquoise text-white'
                  : 'hover:bg-gray-100'
              )}
            >
              Tous ({items.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedCategory === cat.name
                    ? 'bg-linkme-turquoise text-white'
                    : 'hover:bg-gray-100'
                )}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
