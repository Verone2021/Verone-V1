'use client';

import { useCallback, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Filter, Search, X } from 'lucide-react';

import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';

type SortOption =
  | 'name_asc'
  | 'name_desc'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'oldest';

const PRODUCTS_PER_PAGE = 12;

export default function CataloguePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const initialSort = (searchParams.get('tri') as SortOption) ?? 'newest';
  const initialSearch = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('categorie') ?? '';
  const initialBrand = searchParams.get('marque') ?? '';
  const initialPage = parseInt(searchParams.get('page') ?? '1', 10);

  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [showFilters, setShowFilters] = useState(false);

  const { data: allProducts, isLoading } = useCatalogueProducts({
    sortBy,
    searchQuery: searchQuery || undefined,
  });

  // Extract unique categories and brands for filters
  const { categories, brands } = useMemo(() => {
    if (!allProducts) return { categories: [], brands: [] };
    const cats = [
      ...new Set(
        allProducts
          .map((p: CatalogueProduct) => p.subcategory_name)
          .filter(Boolean)
      ),
    ].sort() as string[];
    const brs = [
      ...new Set(
        allProducts.map((p: CatalogueProduct) => p.brand).filter(Boolean)
      ),
    ].sort() as string[];
    return { categories: cats, brands: brs };
  }, [allProducts]);

  // Apply client-side filters
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    let result = allProducts;
    if (selectedCategory) {
      result = result.filter(
        (p: CatalogueProduct) => p.subcategory_name === selectedCategory
      );
    }
    if (selectedBrand) {
      result = result.filter(
        (p: CatalogueProduct) => p.brand === selectedBrand
      );
    }
    return result;
  }, [allProducts, selectedCategory, selectedBrand]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Update URL when filters change
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const url = new URLSearchParams();
      const merged = {
        tri: sortBy,
        q: searchQuery,
        categorie: selectedCategory,
        marque: selectedBrand,
        page: String(currentPage),
        ...params,
      };
      Object.entries(merged).forEach(([key, value]) => {
        if (value && value !== 'newest' && value !== '1') {
          url.set(key, value);
        }
      });
      const qs = url.toString();
      router.replace(`/catalogue${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [sortBy, searchQuery, selectedCategory, selectedBrand, currentPage, router]
  );

  const handleSort = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
    updateUrl({ tri: value, page: '1' });
  };

  const handleCategory = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    updateUrl({ categorie: value, page: '1' });
  };

  const handleBrand = (value: string) => {
    setSelectedBrand(value);
    setCurrentPage(1);
    updateUrl({ marque: value, page: '1' });
  };

  const handlePage = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearchQuery('');
    setCurrentPage(1);
    router.replace('/catalogue', { scroll: false });
  };

  const hasActiveFilters = selectedCategory || selectedBrand || searchQuery;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-playfair text-5xl font-bold text-verone-black mb-4">
          Notre Catalogue
        </h1>
        <p className="text-lg text-verone-gray-600">
          Découvrez notre sélection de mobilier et décoration haut de gamme
        </p>
      </div>

      {/* Search + Sort + Filter toggle */}
      <div className="bg-verone-white border border-verone-gray-200 p-4 md:p-6 mb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-verone-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full border border-verone-gray-300 rounded-none pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
            />
          </div>
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as SortOption)}
            className="border border-verone-gray-300 rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
          >
            <option value="newest">Nouveautés</option>
            <option value="oldest">Plus anciens</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 border text-sm transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-verone-black bg-verone-black text-verone-white'
                : 'border-verone-gray-300 text-verone-gray-700 hover:border-verone-black'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-verone-white" />
            )}
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-verone-white border border-verone-gray-200 border-t-0 p-4 md:p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Category filter */}
            {categories.length > 0 && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-verone-gray-500 uppercase tracking-wide mb-2">
                  Catégorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={e => handleCategory(e.target.value)}
                  className="w-full border border-verone-gray-300 rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Brand filter */}
            {brands.length > 0 && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-verone-gray-500 uppercase tracking-wide mb-2">
                  Marque
                </label>
                <select
                  value={selectedBrand}
                  onChange={e => handleBrand(e.target.value)}
                  className="w-full border border-verone-gray-300 rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
                >
                  <option value="">Toutes les marques</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-4 py-2.5 text-sm text-verone-gray-500 hover:text-verone-black transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                  Effacer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border border-verone-gray-200 animate-pulse"
            >
              <div className="bg-verone-gray-200 aspect-square" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-verone-gray-200 rounded" />
                <div className="h-4 bg-verone-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedProducts.length > 0 ? (
        <>
          <p className="text-sm text-verone-gray-600 mb-6">
            {filteredProducts.length} produit
            {filteredProducts.length > 1 ? 's' : ''} trouvé
            {filteredProducts.length > 1 ? 's' : ''}
            {totalPages > 1 && ` — page ${currentPage} sur ${totalPages}`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {paginatedProducts.map((product, index) => (
              <CardProductLuxury
                key={product.product_id}
                id={product.product_id}
                name={product.name}
                description={product.seo_meta_description ?? undefined}
                price={product.price_ttc}
                imageUrl={product.primary_image_url}
                href={`/produit/${product.slug}`}
                priority={index < 4}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                type="button"
                onClick={() => handlePage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm border border-verone-gray-300 hover:border-verone-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Précédent
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePage(i + 1)}
                  className={`w-10 h-10 text-sm border transition-colors ${
                    currentPage === i + 1
                      ? 'border-verone-black bg-verone-black text-verone-white'
                      : 'border-verone-gray-300 hover:border-verone-black'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handlePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm border border-verone-gray-300 hover:border-verone-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivant
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-24">
          <p className="font-playfair text-2xl text-verone-gray-500 mb-4">
            Aucun produit trouvé
          </p>
          <p className="text-verone-gray-400 mb-6">
            Essayez de modifier vos filtres
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-verone-black underline"
            >
              Effacer tous les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
