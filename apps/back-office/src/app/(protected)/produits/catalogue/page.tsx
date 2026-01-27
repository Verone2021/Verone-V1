'use client';

import { useState, useMemo, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { Product } from '@verone/categories';
import { useCatalogue } from '@verone/categories';
import { useFamilies } from '@verone/categories';
import { useCategories } from '@verone/categories';
import { useSubcategories } from '@verone/categories';
import { useOrganisations } from '@verone/organisations';
import { ProductCardV2 as ProductCard } from '@verone/products';
import { useProductImages } from '@verone/products';
import { ViewModeToggle } from '@verone/ui';
import { ButtonUnified } from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@verone/ui';
import {
  CommandPaletteSearch as CommandPalette,
  type SearchItem,
} from '@verone/ui-business/components/utils/CommandPaletteSearch';
import { checkSLOCompliance, debounce } from '@verone/utils';
import { cn } from '@verone/utils';
import { Search, Plus, Package, Zap, X, RotateCcw } from 'lucide-react';

import {
  CatalogueFilterPanel,
  type FilterState,
} from '@/components/catalogue/CatalogueFilterPanel';

// Nouveaux composants UX/UI 2025
// Interface Produit selon business rules - utilise maintenant celle du hook useCatalogue

// Interface filtres - NOUVEAU: multi-niveaux (Famille > Catégorie > Sous-catégorie)
interface Filters {
  search: string;
  families: string[]; // ← NOUVEAU
  categories: string[]; // ← NOUVEAU
  subcategories: string[];
  suppliers: string[];
  statuses: string[];
}

export default function CataloguePage() {
  const startTime = Date.now();
  const router = useRouter();

  // Hook Supabase pour les données réelles
  const {
    products,
    loading,
    error,
    total,
    setFilters: setCatalogueFilters,
    loadArchivedProducts,
    archiveProduct,
    unarchiveProduct,
    deleteProduct,
    // Pagination
    currentPage,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    itemsPerPage,
  } = useCatalogue();

  // Hooks pour l'arborescence de catégories
  const { families } = useFamilies();
  const { allCategories } = useCategories();
  const { subcategories } = useSubcategories();

  // ✅ NOUVEAU: Hook pour charger TOUS les fournisseurs avec compteurs produits
  const { organisations: allSuppliers } = useOrganisations({
    type: 'supplier',
    is_active: true,
  });

  // État local
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  // État local pour la recherche (contrôlé)
  const [searchInput, setSearchInput] = useState('');
  // ✅ NOUVEAU: État filtres multi-niveaux
  const [filters, setFilters] = useState<Filters>({
    search: '',
    families: [],
    categories: [],
    subcategories: [],
    suppliers: [],
    statuses: [],
  });

  // Fonction de recherche debouncée - synchronise avec useCatalogue
  const _debouncedSearch = useMemo(
    () =>
      debounce((searchTerm: string) => {
        const newFilters = { ...filters, search: searchTerm };
        setFilters(newFilters);
        // Synchronise avec le hook useCatalogue (multi-niveaux)
        setCatalogueFilters({
          search: searchTerm,
          families: newFilters.families,
          categories: newFilters.categories,
          subcategories: newFilters.subcategories,
          suppliers: newFilters.suppliers,
          statuses: newFilters.statuses,
        });
      }, 300),
    [filters, setCatalogueFilters]
  );

  // Handler pour la recherche contrôlée (tape sans déclencher)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
  };

  // Handler pour soumettre la recherche (Entrée ou clic bouton)
  const handleSearchSubmit = () => {
    const newFilters = { ...filters, search: searchInput };
    setFilters(newFilters);
    setCatalogueFilters({
      search: searchInput,
      families: newFilters.families,
      categories: newFilters.categories,
      subcategories: newFilters.subcategories,
      suppliers: newFilters.suppliers,
      statuses: newFilters.statuses,
    });
  };

  // Handler pour touche Entrée
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    }
  };

  // Handler pour effacer la recherche
  const handleClearSearch = () => {
    setSearchInput('');
    const newFilters = { ...filters, search: '' };
    setFilters(newFilters);
    setCatalogueFilters({
      search: '',
      families: newFilters.families,
      categories: newFilters.categories,
      subcategories: newFilters.subcategories,
      suppliers: newFilters.suppliers,
      statuses: newFilters.statuses,
    });
  };

  // Handler pour réinitialiser TOUS les filtres
  const handleResetAllFilters = () => {
    setSearchInput('');
    const emptyFilters: Filters = {
      search: '',
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
    };
    setFilters(emptyFilters);
    setCatalogueFilters({
      search: '',
      families: [],
      categories: [],
      subcategories: [],
      suppliers: [],
      statuses: [],
    });
  };

  // Vérifie si des filtres sont actifs
  const hasActiveFilters =
    filters.search !== '' ||
    filters.families.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0 ||
    filters.suppliers.length > 0 ||
    filters.statuses.length > 0;

  // Fonction pour charger les produits archivés
  const loadArchivedProductsData = async () => {
    setArchivedLoading(true);
    try {
      const result = await loadArchivedProducts(filters);
      setArchivedProducts(result.products as any);
    } catch (error) {
      console.error('Erreur chargement produits archivés:', error);
    } finally {
      setArchivedLoading(false);
    }
  };

  // Charger les produits archivés quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'archived') {
      void loadArchivedProductsData().catch(error => {
        console.error('[Catalogue] loadArchivedProductsData failed:', error);
      });
    }
  }, [activeTab, filters]);

  // Listener global ⌘K pour CommandPalette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Préparer les items pour CommandPalette
  const searchItems: SearchItem[] = useMemo(() => {
    return products.map(product => ({
      id: product.id,
      type: 'product' as const,
      title: product.name,
      subtitle: product.sku || undefined,
      url: `/produits/${product.id}`,
    }));
  }, [products]);

  // Handler sélection item CommandPalette
  const handleSearchSelect = (item: SearchItem) => {
    router.push(item.url);
    setPaletteOpen(false);
  };

  // Le filtrage est maintenant géré par le hook useCatalogue + CatalogueFilterPanel

  // ✅ NOUVEAU: Handler unifié pour CatalogueFilterPanel
  const handleFiltersChange = (newFilterState: FilterState) => {
    const newFilters: Filters = {
      search: newFilterState.search,
      families: newFilterState.families,
      categories: newFilterState.categories,
      subcategories: newFilterState.subcategories,
      suppliers: newFilterState.suppliers,
      statuses: newFilterState.statuses,
    };
    setFilters(newFilters);

    // Synchronise avec le hook useCatalogue (multi-niveaux)
    setCatalogueFilters({
      search: newFilters.search,
      families: newFilters.families,
      categories: newFilters.categories,
      subcategories: newFilters.subcategories,
      suppliers: newFilters.suppliers,
      statuses: newFilters.statuses,
    });
  };

  // Gestion des actions produits
  const handleArchiveProduct = async (product: Product) => {
    try {
      if (product.archived_at) {
        await unarchiveProduct(product.id);
        console.log('✅ Produit restauré:', product.name);
        // Rafraîchir la liste des archivés après restauration
        await loadArchivedProductsData();
      } else {
        await archiveProduct(product.id);
        console.log('✅ Produit archivé:', product.name);
        // Rafraîchir la liste des archivés après archivage
        await loadArchivedProductsData();
      }
    } catch (error) {
      console.error('❌ Erreur archivage produit:', error);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    const confirmed = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement "${product.name}" ?\n\nCette action est irréversible !`
    );

    if (confirmed) {
      try {
        await deleteProduct(product.id);
        console.log('✅ Produit supprimé définitivement:', product.name);
      } catch (error) {
        console.error('❌ Erreur suppression produit:', error);
      }
    }
  };

  // Validation SLO dashboard
  const dashboardSLO = checkSLOCompliance(startTime, 'dashboard');

  // Gestion des états de chargement et erreur
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black opacity-70">Chargement du catalogue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-600">Erreur: {error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec indicateur performance */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-light text-black">Catalogue Produits</h1>

        {/* Actions et indicateur SLO performance */}
        <div className="flex items-center space-x-4">
          {/* Boutons de création */}
          <div className="flex items-center space-x-2">
            <ButtonUnified
              onClick={() => router.push('/produits/sourcing')}
              variant="outline"
              size="sm"
              icon={Zap}
              iconPosition="left"
              className="h-8 text-xs"
            >
              Sourcing Rapide
            </ButtonUnified>

            <ButtonUnified
              onClick={() => router.push('/produits/catalogue/nouveau')}
              variant="default"
              size="sm"
              icon={Plus}
              iconPosition="left"
              className="h-8 text-xs"
            >
              Nouveau Produit
            </ButtonUnified>
          </div>

          <div className="flex items-center space-x-2">
            <Badge
              variant={dashboardSLO.isCompliant ? 'success' : 'destructive'}
            >
              {dashboardSLO.duration}ms
            </Badge>
            <span className="text-xs text-black opacity-50">SLO: &lt;2s</span>
          </div>
        </div>
      </div>

      {/* Contenu principal catalogue */}
      <div className="space-y-6">
        {/* Onglets produits actifs/archivés */}
        <div className="flex border-b border-black">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'active'
                ? 'border-b-2 border-black text-black'
                : 'text-black opacity-60 hover:opacity-80'
            }`}
          >
            Produits Actifs ({total})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'archived'
                ? 'border-b-2 border-black text-black'
                : 'text-black opacity-60 hover:opacity-80'
            }`}
          >
            Produits Archivés ({archivedProducts.length})
          </button>
        </div>

        {/* Filtres horizontaux + Recherche + Toggle vue */}
        <div className="flex items-start gap-4">
          {/* Panneau de filtres */}
          <CatalogueFilterPanel
            families={families}
            categories={allCategories.filter(
              (c): c is typeof c & { family_id: string } => c.family_id !== null
            )}
            subcategories={subcategories}
            products={products}
            suppliers={allSuppliers}
            filters={{
              search: filters.search,
              families: filters.families,
              categories: filters.categories,
              subcategories: filters.subcategories,
              suppliers: filters.suppliers,
              statuses: filters.statuses,
            }}
            onFiltersChange={handleFiltersChange}
            className="flex-1"
          />

          {/* Recherche + Actions + Toggle vue alignés à droite */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Barre de recherche avec boutons */}
            <div className="flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black opacity-50" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchInput}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  className={cn(
                    'w-48 border border-black border-r-0 bg-white py-2 pl-10 text-sm text-black placeholder:text-black placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2',
                    searchInput ? 'pr-8' : 'pr-3'
                  )}
                />
                {/* Bouton Effacer la recherche (X) */}
                {searchInput && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-black opacity-50 hover:opacity-100 transition-opacity"
                    title="Effacer la recherche"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleSearchSubmit}
                className="h-[38px] px-3 border border-black bg-black text-white hover:bg-gray-800 transition-colors"
                title="Rechercher"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>

            {/* Bouton Réinitialiser tous les filtres */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="flex items-center gap-1.5 h-[38px] px-3 border border-black bg-white text-black hover:bg-gray-100 transition-colors text-sm"
                title="Réinitialiser tous les filtres"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            )}

            {/* Toggle vue */}
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              variant="outline"
            />
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          {/* Gestion du chargement et erreurs */}
          {(activeTab === 'active' && loading) ||
          (activeTab === 'archived' && archivedLoading) ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-black opacity-70">Chargement...</div>
            </div>
          ) : (
            <>
              {/* Compteur résultats avec pagination */}
              <div className="flex items-center justify-between text-sm text-black opacity-70">
                <span>
                  {activeTab === 'active'
                    ? `${total} produit${total > 1 ? 's' : ''} actif${total > 1 ? 's' : ''} - Page ${currentPage} sur ${totalPages}`
                    : `${archivedProducts.length} produit${archivedProducts.length > 1 ? 's' : ''} archivé${archivedProducts.length > 1 ? 's' : ''}`}
                </span>
                <span className="flex items-center gap-4">
                  {filters.search && <span>Recherche: "{filters.search}"</span>}
                  {activeTab === 'active' && totalPages > 1 && (
                    <span className="text-xs">
                      Affichage {(currentPage - 1) * itemsPerPage + 1}-
                      {Math.min(currentPage * itemsPerPage, total)} sur {total}
                    </span>
                  )}
                </span>
              </div>

              {/* Grille produits */}
              {(() => {
                const currentProducts =
                  activeTab === 'active' ? products : archivedProducts;

                return viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentProducts.map((product, index) => (
                      <ProductCard
                        key={product.id}
                        product={
                          {
                            ...product,
                            supplier: product.supplier
                              ? {
                                  ...product.supplier,
                                  slug: (
                                    product.supplier.trade_name ||
                                    product.supplier.legal_name
                                  )
                                    .toLowerCase()
                                    .replace(/\s+/g, '-'),
                                  is_active: true,
                                }
                              : undefined,
                          } as any
                        }
                        index={index}
                        onArchive={product => {
                          void handleArchiveProduct(product).catch(error => {
                            console.error(
                              '[Catalogue] handleArchiveProduct failed:',
                              error
                            );
                          });
                        }}
                        onDelete={product => {
                          void handleDeleteProduct(product).catch(error => {
                            console.error(
                              '[Catalogue] handleDeleteProduct failed:',
                              error
                            );
                          });
                        }}
                        archived={!!product.archived_at}
                      />
                    ))}
                  </div>
                ) : (
                  // Vue liste avec images - COMPACT
                  <div className="space-y-2">
                    {currentProducts.map(product => {
                      // Hook pour charger l'image
                      const ProductListItem = () => {
                        const { primaryImage, loading: imageLoading } =
                          useProductImages({
                            productId: product.id,
                            autoFetch: true,
                          });

                        return (
                          <div
                            key={product.id}
                            className="card-verone p-3 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() =>
                              router.push(`/produits/catalogue/${product.id}`)
                            }
                          >
                            <div className="flex items-center space-x-3">
                              {/* Image produit */}
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
                                {primaryImage?.public_url && !imageLoading ? (
                                  <img
                                    src={primaryImage.public_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm text-black truncate hover:underline">
                                  {product.name}
                                </h3>
                                <p className="text-xs text-black opacity-70">
                                  {product.sku}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="font-semibold text-sm text-black">
                                  {product.cost_price
                                    ? `${product.cost_price.toFixed(2)} € HT`
                                    : 'Prix non défini'}
                                </div>
                                <div className="flex items-center gap-1 mt-0.5 justify-end">
                                  <Badge className="text-[10px] px-1.5 py-0">
                                    {(() => {
                                      const labels: Record<string, string> = {
                                        active: '✓ Actif',
                                        preorder: '📅 Précommande',
                                        discontinued: '⚠ Arrêté',
                                        draft: '📝 Brouillon',
                                      };
                                      return (
                                        labels[product.product_status] ||
                                        product.product_status
                                      );
                                    })()}
                                  </Badge>
                                  {/* Badge "nouveau" pour les produits créés dans les 30 derniers jours */}
                                  {(() => {
                                    const createdAt = new Date(
                                      product.created_at
                                    );
                                    const thirtyDaysAgo = new Date();
                                    thirtyDaysAgo.setDate(
                                      thirtyDaysAgo.getDate() - 30
                                    );
                                    return createdAt > thirtyDaysAgo;
                                  })() && (
                                    <Badge
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 border-green-300 text-[10px] px-1.5 py-0"
                                    >
                                      nouveau
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      };

                      return <ProductListItem key={product.id} />;
                    })}
                  </div>
                );
              })()}

              {/* État vide */}
              {(() => {
                const currentProducts =
                  activeTab === 'active' ? products : archivedProducts;
                const isEmpty = currentProducts.length === 0;

                return (
                  isEmpty && (
                    <div className="text-center py-12">
                      <div className="text-black opacity-50 text-lg">
                        {activeTab === 'active'
                          ? 'Aucun produit actif trouvé'
                          : 'Aucun produit archivé trouvé'}
                      </div>
                      <p className="text-black opacity-30 text-sm mt-2">
                        {activeTab === 'active'
                          ? 'Essayez de modifier vos critères de recherche'
                          : 'Les produits archivés apparaîtront ici'}
                      </p>
                    </div>
                  )
                );
              })()}

              {/* Pagination */}
              {activeTab === 'active' && totalPages > 1 && (
                <div className="mt-8 pb-4">
                  <Pagination>
                    <PaginationContent>
                      {/* Bouton Précédent */}
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => hasPreviousPage && previousPage()}
                          className={cn(
                            'cursor-pointer',
                            !hasPreviousPage && 'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>

                      {/* Première page */}
                      {currentPage > 2 && (
                        <>
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => goToPage(1)}
                              isActive={currentPage === 1}
                            >
                              1
                            </PaginationLink>
                          </PaginationItem>
                          {currentPage > 3 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                        </>
                      )}

                      {/* Pages autour de la page courante */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          if (pageNum < 1 || pageNum > totalPages) return null;
                          if (pageNum === 1 && currentPage > 2) return null;
                          if (
                            pageNum === totalPages &&
                            currentPage < totalPages - 1
                          )
                            return null;

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => goToPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        }
                      )}

                      {/* Dernière page */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}
                          <PaginationItem>
                            <PaginationLink
                              onClick={() => goToPage(totalPages)}
                              isActive={currentPage === totalPages}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        </>
                      )}

                      {/* Bouton Suivant */}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => hasNextPage && nextPage()}
                          className={cn(
                            'cursor-pointer',
                            !hasNextPage && 'pointer-events-none opacity-50'
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* CommandPalette global ⌘K */}
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onSelect={handleSearchSelect}
        items={searchItems}
      />
    </div>
  );
}
