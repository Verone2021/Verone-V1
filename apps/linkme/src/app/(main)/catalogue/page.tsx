'use client';

/**
 * Page Catalogue LinkMe - Design E-commerce 2026
 *
 * Structure:
 * - Barre filtres horizontale: Onglets + Dropdown catégories + Recherche
 * - Grille produits pleine largeur
 *
 * @module CataloguePage
 * @since 2025-12-04
 * @updated 2026-01
 */

import { useState, useMemo, useEffect, Suspense } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import {
  Search,
  Package,
  Loader2,
  X,
  LayoutGrid,
  List,
  ArrowLeft,
  Star,
} from 'lucide-react';

import { AddToSelectionModal } from '@/components/catalogue/AddToSelectionModal';
import { useAuth, type LinkMeRole } from '@/contexts/AuthContext';
import {
  useCategorizedCatalogProducts,
  filterCatalogProducts,
  type LinkMeCatalogProduct,
  type CatalogFilters,
} from '@/lib/hooks/use-linkme-catalog';
import {
  useSelectionProductIds,
  useUserSelections,
} from '@/lib/hooks/use-user-selection';
import { cn } from '@/lib/utils';

import {
  CategoryBar,
  CategoryDropdown,
  FilterDrawer,
  ProductCard,
  ProductListItem,
  type ProductTypeFilter,
} from './components';

// Rôles autorisés à accéder au catalogue
const AUTHORIZED_ROLES: LinkMeRole[] = ['enseigne_admin', 'organisation_admin'];

// Rôles autorisés à ajouter des produits à leur sélection
const CAN_ADD_TO_SELECTION_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'organisation_admin',
];

// Wrapper avec Suspense pour useSearchParams (Next.js 15 requirement)
export default function CataloguePage(): JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
            <p className="text-gray-500">Chargement du catalogue...</p>
          </div>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}

function CatalogueContent(): JSX.Element | null {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, linkMeRole, initializing: authLoading } = useAuth();

  // Récupérer le selectionId depuis les query params (si présent)
  const selectionIdFromUrl = searchParams.get('selection');

  // Récupérer les sélections pour afficher le nom de la sélection cible
  const { data: selections } = useUserSelections();
  const targetSelection = selectionIdFromUrl
    ? selections?.find(s => s.id === selectionIdFromUrl)
    : null;

  // Récupérer les product_id déjà dans la sélection (pour filtrage)
  const { data: existingProductIds = [] } =
    useSelectionProductIds(selectionIdFromUrl);

  // Récupérer les produits catégorisés (sur mesure + général)
  const {
    customProducts,
    generalProducts,
    isLoading: productsLoading,
  } = useCategorizedCatalogProducts(
    linkMeRole?.enseigne_id ?? null,
    linkMeRole?.organisation_id ?? null
  );

  // State filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<
    string | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [productTypeFilter, setProductTypeFilter] =
    useState<ProductTypeFilter>('all');

  // State FilterDrawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // State filtre pièces (multi-sélection)
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);

  // State modal ajout sélection
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<LinkMeCatalogProduct | null>(null);

  // Vérifier les droits d'accès
  useEffect(() => {
    if (!authLoading) {
      // Pas connecté → redirect login
      if (!user) {
        router.push('/login');
        return;
      }

      // Pas de rôle LinkMe ou rôle non autorisé → redirect dashboard
      if (!linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, linkMeRole, authLoading, router]);

  // Vérifier si l'utilisateur peut ajouter à sa sélection
  const canAddToSelection = useMemo(() => {
    return !!(
      linkMeRole && CAN_ADD_TO_SELECTION_ROLES.includes(linkMeRole.role)
    );
  }, [linkMeRole]);

  // Tous les produits mélangés (sur mesure + général)
  const allProducts = useMemo(() => {
    return [...customProducts, ...generalProducts];
  }, [customProducts, generalProducts]);

  // Filtres actifs
  const filters: CatalogFilters = useMemo(
    () => ({
      search: searchTerm || undefined,
      category: selectedCategory,
      subcategory: selectedSubcategory,
    }),
    [searchTerm, selectedCategory, selectedSubcategory]
  );

  // Produits filtrés (+ filtre type + exclusion des produits déjà dans la sélection)
  const filteredProducts = useMemo(() => {
    let products = filterCatalogProducts(allProducts, filters);

    // Filtre par type de produit
    if (productTypeFilter === 'catalog') {
      products = products.filter(p => !p.is_custom);
    } else if (productTypeFilter === 'custom') {
      products = products.filter(p => p.is_custom === true);
    }

    // Si on est en mode ajout à une sélection, exclure les produits déjà présents
    if (selectionIdFromUrl && existingProductIds.length > 0) {
      products = products.filter(
        p => !existingProductIds.includes(p.product_id)
      );
    }

    // Filtre par pièces (multi-sélection)
    if (selectedRooms.length > 0) {
      products = products.filter(p =>
        p.suitable_rooms?.some(room => selectedRooms.includes(room))
      );
    }

    return products;
  }, [
    allProducts,
    filters,
    productTypeFilter,
    selectionIdFromUrl,
    existingProductIds,
    selectedRooms,
  ]);

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (productTypeFilter !== 'all') count++;
    if (selectedSubcategory) count++;
    return count;
  }, [productTypeFilter, selectedSubcategory]);

  // Handler ajouter à la sélection
  const handleAddToSelection = (product: LinkMeCatalogProduct): void => {
    setSelectedProduct(product);
    setIsAddModalOpen(true);
  };

  // Handler fermer le modal
  const handleCloseModal = (): void => {
    setIsAddModalOpen(false);
    setSelectedProduct(null);
  };

  // Reset des filtres
  const handleResetFilters = (): void => {
    setSearchTerm('');
    setSelectedCategory(undefined);
    setSelectedSubcategory(undefined);
    setProductTypeFilter('all');
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedCategory) ||
    Boolean(selectedSubcategory) ||
    productTypeFilter !== 'all';

  // Chargement
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-linkme-turquoise animate-spin mx-auto" />
          <p className="text-gray-500">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  // Vérification accès (redirection en cours)
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      {/* Bandeau: Mode ajout à une sélection */}
      {selectionIdFromUrl && targetSelection && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <Star className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  Ajout à :{' '}
                  <span className="text-amber-700">{targetSelection.name}</span>
                </p>
                <p className="text-xs text-gray-600">
                  {existingProductIds.length > 0
                    ? `${existingProductIds.length} produit${existingProductIds.length > 1 ? 's' : ''} déjà dans cette sélection (masqués)`
                    : 'Sélectionnez des produits à ajouter'}
                </p>
              </div>
            </div>
            <Link
              href={`/ma-selection/${selectionIdFromUrl}/produits`}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Link>
          </div>
        </div>
      )}

      {/* Zone principale - Pleine largeur (sans sidebar) */}
      <main className="flex flex-col min-h-[calc(100vh-4rem)]">
        {/* Barre de catégories dynamiques */}
        <CategoryBar
          products={allProducts}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          onOpenFilters={() => setIsFilterDrawerOpen(true)}
          activeFiltersCount={activeFiltersCount}
        />

        {/* Barre de filtres horizontale sticky */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
          {/* Filtres sur une ligne */}
          <div className="px-4 lg:px-6 py-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Dropdown catégories (pour sous-catégories) */}
              <CategoryDropdown
                products={allProducts}
                selectedCategory={selectedCategory}
                selectedSubcategory={selectedSubcategory}
                onCategorySelect={setSelectedCategory}
                onSubcategorySelect={setSelectedSubcategory}
              />

              {/* Recherche */}
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-linkme-turquoise/30 focus:border-linkme-turquoise transition-all text-sm"
                />
              </div>

              {/* Toggle vue grille/liste */}
              <div className="flex items-center border border-gray-200 rounded-lg p-0.5 bg-gray-50">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-linkme-turquoise'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                  title="Vue grille"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-md transition-all',
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-linkme-turquoise'
                      : 'text-gray-400 hover:text-gray-600'
                  )}
                  title="Vue liste"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Compteur résultats + Reset */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-linkme-marine">
                  {filteredProducts.length}
                </span>{' '}
                produit{filteredProducts.length > 1 ? 's' : ''} trouvé
                {filteredProducts.length > 1 ? 's' : ''}
              </p>

              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-linkme-turquoise transition-colors"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grille Produits - Design spacieux */}
        <div className="flex-1 overflow-y-auto px-12 py-12 bg-white">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">
                Aucun produit trouvé
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Essayez de modifier vos filtres de recherche
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-linkme-turquoise hover:bg-linkme-turquoise/10 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  canAddToSelection={canAddToSelection}
                  onAddToSelection={() => handleAddToSelection(product)}
                  showCustomBadge={product.is_custom === true}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
              {filteredProducts.map(product => (
                <ProductListItem
                  key={product.id}
                  product={product}
                  canAddToSelection={canAddToSelection}
                  onAddToSelection={() => handleAddToSelection(product)}
                  showCustomBadge={product.is_custom === true}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal ajout à la sélection */}
      <AddToSelectionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        preselectedSelectionId={selectionIdFromUrl}
      />

      {/* Tiroir de filtres avancés */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        products={allProducts}
        productTypeFilter={productTypeFilter}
        onProductTypeChange={setProductTypeFilter}
        selectedSubcategory={selectedSubcategory}
        onSubcategoryChange={setSelectedSubcategory}
        selectedCategory={selectedCategory}
        selectedRooms={selectedRooms}
        onRoomsChange={setSelectedRooms}
      />
    </div>
  );
}
