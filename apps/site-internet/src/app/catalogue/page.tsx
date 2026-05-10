'use client';

import { useCallback, useMemo, useState } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { Filter, Search, X } from 'lucide-react';

import { ProductCardEditorial } from '@/components/home/ProductCardEditorial';
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar';
import { CatalogueMobileFilters } from '@/components/catalogue/CatalogueMobileFilters';
import {
  useCatalogueProducts,
  type CatalogueProduct,
} from '@/hooks/use-catalogue-products';
import { useCatalogueFilters } from '@/hooks/use-catalogue-filters';

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

  // Pagination compacte type Stitch : 1 2 3 … N
  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-32 pt-12 md:px-16 md:pb-24 md:pt-16">
      {/* Header centré (Stitch) */}
      <header className="mb-16 text-center md:mb-24">
        <span className="block font-dm-sans text-[12px] font-light uppercase tracking-[0.32em] text-verone-or">
          Catalogue
        </span>
        <h1 className="mt-6 font-bodoni text-[36px] font-black leading-[1.1] text-verone-charbon md:text-[48px]">
          La sélection
        </h1>
      </header>

      {/* Search + Sort bar — bordures minimales */}
      <div className="mb-10 flex flex-col gap-3 border-y border-verone-pearl-soft py-4 md:flex-row md:items-center md:py-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-verone-pearl" />
          <input
            type="text"
            placeholder="Rechercher une pièce…"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full border-0 bg-transparent py-2 pl-9 pr-9 font-montserrat text-sm text-verone-charbon placeholder:text-verone-pearl focus:outline-none focus:ring-0"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              aria-label="Effacer la recherche"
            >
              <X className="h-4 w-4 text-verone-pearl transition-colors duration-[180ms] ease-editorial hover:text-verone-charbon" />
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <select
            value={sortBy}
            onChange={e => handleSort(e.target.value as SortOption)}
            className="border-0 border-l border-verone-pearl-soft bg-transparent px-3 py-2 font-montserrat text-sm text-verone-charbon focus:outline-none focus:ring-0"
            aria-label="Trier par"
          >
            <option value="newest">Trier : Nouveautés</option>
            <option value="oldest">Trier : Plus anciens</option>
            <option value="name_asc">Trier : Nom A–Z</option>
            <option value="name_desc">Trier : Nom Z–A</option>
            <option value="price_asc">Trier : Prix croissant</option>
            <option value="price_desc">Trier : Prix décroissant</option>
          </select>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className={`flex items-center gap-2 border px-4 py-2 font-montserrat text-xs font-medium uppercase tracking-[0.16em] transition-colors duration-[180ms] ease-editorial lg:hidden ${
              hasSidebarFilters
                ? 'border-verone-charbon bg-verone-charbon text-verone-white'
                : 'border-verone-charbon text-verone-charbon hover:bg-verone-charbon hover:text-verone-white'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtres
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center bg-verone-or font-montserrat text-[10px] font-semibold text-verone-charbon">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-12">
        {/* Sidebar (desktop only) */}
        {allProducts && allProducts.length > 0 && (
          <CatalogueSidebar
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
            className="hidden lg:block"
          />
        )}

        {/* Products area */}
        <div className="min-w-0 flex-1">
          {/* Result count */}
          {!isLoading && filteredProducts.length > 0 && (
            <p className="mb-6 font-montserrat text-[13px] text-verone-pearl">
              {filteredProducts.length} pièce
              {filteredProducts.length > 1 ? 's' : ''}
              {totalPages > 1 && ` — page ${currentPage} sur ${totalPages}`}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-verone-pearl-soft" />
                  <div className="mt-5 space-y-2">
                    <div className="h-4 w-3/4 bg-verone-pearl-soft" />
                    <div className="h-4 w-1/3 bg-verone-pearl-soft" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map(
                  (product: CatalogueProduct, index: number) => (
                    <ProductCardEditorial
                      key={product.product_id}
                      name={product.name}
                      slug={product.slug}
                      priceTtc={product.price_ttc}
                      imageUrl={product.primary_image_url}
                      cloudflareImageId={product.primary_cloudflare_image_id}
                      priority={index < 3}
                      stockStatus={product.stock_status}
                      discountRate={product.discount_rate}
                      showCents
                    />
                  )
                )}
              </div>

              {/* Pagination minimaliste type Stitch */}
              {totalPages > 1 && (
                <div className="mt-16 flex items-center justify-center gap-4 font-montserrat text-[14px]">
                  <button
                    type="button"
                    onClick={() => handlePage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="transition-colors duration-[180ms] ease-editorial disabled:cursor-not-allowed disabled:text-verone-pearl-soft hover:text-verone-or"
                    aria-label="Page précédente"
                  >
                    ←
                  </button>
                  {visiblePages.map((p, idx) =>
                    p === 'ellipsis' ? (
                      <span key={`e-${idx}`} className="text-verone-pearl">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePage(p)}
                        className={`pb-1 transition-colors duration-[180ms] ease-editorial ${
                          currentPage === p
                            ? 'border-b border-verone-charbon text-verone-charbon'
                            : 'text-verone-pearl hover:text-verone-charbon'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => handlePage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="transition-colors duration-[180ms] ease-editorial disabled:cursor-not-allowed disabled:text-verone-pearl-soft hover:text-verone-or"
                    aria-label="Page suivante"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center">
              <p className="mb-4 font-bodoni text-[28px] font-black text-verone-charbon">
                Aucune pièce ne correspond.
              </p>
              <p className="mb-6 font-montserrat text-sm text-verone-pearl">
                Essaie de modifier tes filtres.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="font-montserrat text-xs font-medium uppercase tracking-[0.16em] text-verone-charbon underline decoration-verone-or decoration-1 underline-offset-[6px] transition-colors duration-[180ms] ease-editorial hover:text-verone-or"
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
