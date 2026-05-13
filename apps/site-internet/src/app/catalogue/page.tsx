'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { Filter, Search, X } from 'lucide-react';

import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import { CatalogueMobileFilters } from '@/components/catalogue/CatalogueMobileFilters';
import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';
import { useCatalogueFilters } from '@/hooks/use-catalogue-filters';
import { createUntypedClient } from '@/lib/supabase/untyped-client';

interface SubcategoryRef {
  name: string;
  slug: string;
}

/**
 * Hook minimal pour charger la table `subcategories` (lecture publique anon).
 * Sert au mapping slug → name quand on arrive depuis le MegaMenu header
 * (`/catalogue?categorie=<slug>`).
 */
function useSubcategoriesSlugMap() {
  const supabase = createUntypedClient();
  return useQuery({
    queryKey: ['subcategories-slug-map'],
    queryFn: async (): Promise<SubcategoryRef[]> => {
      const { data, error } = await supabase
        .from('subcategories')
        .select('name, slug')
        .order('name');
      if (error) {
        console.error('[useSubcategoriesSlugMap] fetch error:', error);
        return [];
      }
      return (data ?? []) as SubcategoryRef[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

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
  const initialPage = parseInt(searchParams.get('page') ?? '1', 10);

  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const {
    filters,
    toggleCategory,
    toggleRoom,
    toggleStyle,
    toggleBrand,
    toggleColor,
    setPriceRange,
    clearAll: clearSidebarFilters,
    hasActiveFilters: hasSidebarFilters,
    activeFilterCount,
    applyFilters,
  } = useCatalogueFilters();

  const { data: allProducts, isLoading } = useCatalogueProducts({
    sortBy,
    searchQuery: searchQuery || undefined,
  });

  // Pré-sélection sous-catégorie depuis l'URL (?categorie=<slug>) — venu du
  // MegaMenu header (lien `/catalogue?categorie=<subcategories.slug>`). On
  // résout le slug en nom via la table `subcategories` puis on coche la case.
  const initialCategorieSlug = searchParams.get('categorie');
  const { data: subcategoriesMap } = useSubcategoriesSlugMap();
  const presetAppliedRef = useRef(false);

  useEffect(() => {
    if (presetAppliedRef.current) return;
    if (!initialCategorieSlug) return;
    if (!subcategoriesMap || subcategoriesMap.length === 0) return;
    if (!allProducts) return;

    const wanted = initialCategorieSlug.toLowerCase();
    const matched = subcategoriesMap.find(s => s.slug === wanted);
    const matchedName = matched?.name;

    if (matchedName && !filters.selectedCategories.includes(matchedName)) {
      toggleCategory(matchedName);
    }
    presetAppliedRef.current = true;
  }, [
    allProducts,
    filters.selectedCategories,
    initialCategorieSlug,
    subcategoriesMap,
    toggleCategory,
  ]);

  // Apply sidebar filters
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    return applyFilters(allProducts);
  }, [allProducts, applyFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const hasActiveFilters = hasSidebarFilters || !!searchQuery;

  // Update URL when filters change
  const updateUrl = useCallback(
    (params: Record<string, string>) => {
      const url = new URLSearchParams();
      const merged = {
        tri: sortBy,
        q: searchQuery,
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
    [sortBy, searchQuery, currentPage, router]
  );

  const handleSort = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
    updateUrl({ tri: value, page: '1' });
  };

  const handlePage = (page: number) => {
    setCurrentPage(page);
    updateUrl({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    clearSidebarFilters();
    setSearchQuery('');
    setCurrentPage(1);
    router.replace('/catalogue', { scroll: false });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-32 md:pb-6">
      {/* Header — pb-32 sur mobile pour la banniere cookies (audit 2026-04-26 Bug 8) */}
      <div className="mb-6">
        <span className="font-dm-sans text-[11px] font-light uppercase tracking-[0.3em] text-verone-or mb-2 block">
          CATALOGUE
        </span>
        <h1 className="font-bodoni text-2xl md:text-3xl font-bold text-verone-charbon mb-2">
          La sélection.
        </h1>
        <p className="text-sm text-verone-gray-600 font-montserrat">
          Des pièces originales de déco et mobilier, sourcées avec soin, au
          juste prix
        </p>
      </div>

      {/* Search + Sort bar */}
      <div className="bg-verone-white border border-verone-gray-200 p-3 md:p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
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
              className="w-full border border-verone-gray-300 rounded-none pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-verone-gray-400 hover:text-verone-black" />
              </button>
            )}
          </div>
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as SortOption)}
            className="border border-verone-gray-300 rounded-none px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
          >
            <option value="newest">Nouveautés</option>
            <option value="oldest">Plus anciens</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>

          {/* Bouton Filtres — drawer plein écran sur TOUS les breakpoints
              (sidebar desktop fixe retirée 2026-05-13, demande Romeo) */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 border text-sm transition-colors ${
              hasSidebarFilters
                ? 'border-verone-black bg-verone-black text-verone-white'
                : 'border-verone-gray-300 text-verone-gray-700 hover:border-verone-black'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 bg-verone-white text-verone-black text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Layout simplifié : sidebar desktop retirée, grid pleine largeur */}
      <div>
        <div className="min-w-0">
          {isLoading ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-verone-gray-200 animate-pulse"
                >
                  <div className="bg-verone-gray-200 aspect-square" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-verone-gray-200 rounded" />
                    <div className="h-4 bg-verone-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <p className="text-sm text-verone-gray-600 mb-4">
                {filteredProducts.length} produit
                {filteredProducts.length > 1 ? 's' : ''} trouvé
                {filteredProducts.length > 1 ? 's' : ''}
                {totalPages > 1 && ` — page ${currentPage} sur ${totalPages}`}
              </p>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {paginatedProducts.map(
                  (product: CatalogueProduct, index: number) => (
                    <CardProductLuxury
                      key={product.product_id}
                      id={product.product_id}
                      name={product.name}
                      description={product.seo_meta_description ?? undefined}
                      price={product.price_ttc}
                      imageUrl={product.primary_image_url}
                      cloudflareImageId={product.primary_cloudflare_image_id}
                      href={`/produit/${product.slug}`}
                      priority={index < 3}
                      subcategoryName={product.subcategory_name ?? undefined}
                      discountRate={product.discount_rate ?? undefined}
                      publicationDate={product.publication_date ?? undefined}
                      stockStatus={product.stock_status}
                      variantsCount={
                        product.eligible_variants_count > 1
                          ? product.eligible_variants_count
                          : undefined
                      }
                    />
                  )
                )}
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
              <p className="font-bodoni text-2xl text-verone-gray-500 mb-4">
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
      </div>

      {/* Mobile filters drawer */}
      {allProducts && (
        <CatalogueMobileFilters
          isOpen={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          products={allProducts}
          filters={filters}
          onToggleCategory={v => {
            toggleCategory(v);
            setCurrentPage(1);
          }}
          onToggleRoom={v => {
            toggleRoom(v);
            setCurrentPage(1);
          }}
          onToggleStyle={v => {
            toggleStyle(v);
            setCurrentPage(1);
          }}
          onToggleBrand={v => {
            toggleBrand(v);
            setCurrentPage(1);
          }}
          onToggleColor={v => {
            toggleColor(v);
            setCurrentPage(1);
          }}
          onSetPriceRange={(min, max) => {
            setPriceRange(min, max);
            setCurrentPage(1);
          }}
          onClearAll={() => {
            clearSidebarFilters();
            setCurrentPage(1);
          }}
          hasActiveFilters={hasSidebarFilters}
          resultCount={filteredProducts.length}
        />
      )}
    </div>
  );
}
