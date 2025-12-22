'use client';

/**
 * Page Catalogue LinkMe
 *
 * Affiche tous les produits du catalogue LinkMe
 * Accessible uniquement aux utilisateurs connectés avec rôle autorisé
 *
 * Droits:
 * - enseigne_admin: Accès complet + Ajouter à sélection
 * - org_independante: Accès complet + Ajouter à sélection
 * - organisation_admin: Accès lecture seule (bouton grisé)
 * - client: Pas d'accès (redirect)
 *
 * @module CataloguePage
 * @since 2025-12-04
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
  Plus,
  Filter,
  Sparkles,
  ArrowLeft,
  Star,
  Check,
  PackagePlus,
} from 'lucide-react';

import { AddToSelectionModal } from '../../../components/catalogue/AddToSelectionModal';
import { useAuth, type LinkMeRole } from '../../../contexts/AuthContext';
import {
  useCategorizedCatalogProducts,
  filterCatalogProducts,
  type LinkMeCatalogProduct,
  type CatalogFilters,
} from '../../../lib/hooks/use-linkme-catalog';
import {
  useSelectionProductIds,
  useUserSelections,
} from '../../../lib/hooks/use-user-selection';

// Rôles autorisés à accéder au catalogue
const AUTHORIZED_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'org_independante',
  'organisation_admin',
];

// Rôles autorisés à ajouter des produits à leur sélection
const CAN_ADD_TO_SELECTION_ROLES: LinkMeRole[] = [
  'enseigne_admin',
  'org_independante',
];

// Wrapper avec Suspense pour useSearchParams (Next.js 15 requirement)
export default function CataloguePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
            <p className="text-gray-600">Chargement du catalogue...</p>
          </div>
        </div>
      }
    >
      <CatalogueContent />
    </Suspense>
  );
}

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, linkMeRole, loading: authLoading } = useAuth();

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
    allProducts,
    isLoading: productsLoading,
  } = useCategorizedCatalogProducts(
    linkMeRole?.enseigne_id || null,
    linkMeRole?.organisation_id || null
  );

  // State filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    undefined
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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

  // Filtres actifs
  const filters: CatalogFilters = useMemo(
    () => ({
      search: searchTerm || undefined,
      category: selectedCategory,
    }),
    [searchTerm, selectedCategory]
  );

  // Produits sur mesure filtrés (+ exclusion des produits déjà dans la sélection)
  const filteredCustomProducts = useMemo(() => {
    let products = filterCatalogProducts(customProducts, filters);
    // Si on est en mode ajout à une sélection, exclure les produits déjà présents
    if (selectionIdFromUrl && existingProductIds.length > 0) {
      products = products.filter(
        p => !existingProductIds.includes(p.product_id)
      );
    }
    return products;
  }, [customProducts, filters, selectionIdFromUrl, existingProductIds]);

  // Produits généraux filtrés (+ exclusion des produits déjà dans la sélection)
  const filteredGeneralProducts = useMemo(() => {
    let products = filterCatalogProducts(generalProducts, filters);
    // Si on est en mode ajout à une sélection, exclure les produits déjà présents
    if (selectionIdFromUrl && existingProductIds.length > 0) {
      products = products.filter(
        p => !existingProductIds.includes(p.product_id)
      );
    }
    return products;
  }, [generalProducts, filters, selectionIdFromUrl, existingProductIds]);

  // Total produits filtrés (pour affichage)
  const totalFilteredProducts =
    filteredCustomProducts.length + filteredGeneralProducts.length;

  // Catégories uniques pour le filtre (tous produits visibles)
  const categories = useMemo(() => {
    const allVisibleProducts = [...customProducts, ...generalProducts];
    const uniqueCategories = new Set(
      allVisibleProducts.map(p => p.category_name).filter(Boolean) as string[]
    );
    return Array.from(uniqueCategories).sort();
  }, [customProducts, generalProducts]);

  // Handler ajouter à la sélection
  const handleAddToSelection = (product: LinkMeCatalogProduct) => {
    setSelectedProduct(product);
    setIsAddModalOpen(true);
  };

  // Handler fermer le modal
  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setSelectedProduct(null);
  };

  // Chargement
  if (authLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
          <p className="text-gray-600">Chargement du catalogue...</p>
        </div>
      </div>
    );
  }

  // Vérification accès (redirection en cours)
  if (!user || !linkMeRole || !AUTHORIZED_ROLES.includes(linkMeRole.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bandeau: Mode ajout à une sélection */}
        {selectionIdFromUrl && targetSelection && (
          <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <Star className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Ajout à :{' '}
                    <span className="text-amber-700">
                      {targetSelection.name}
                    </span>
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
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la sélection
              </Link>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                Catalogue LinkMe
              </h1>
              <p className="text-gray-600 text-sm">
                {selectionIdFromUrl
                  ? 'Sélectionnez les produits à ajouter'
                  : 'Découvrez nos produits et ajoutez-les à votre sélection'}
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filtre catégorie */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedCategory || ''}
                onChange={e => setSelectedCategory(e.target.value || undefined)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Toggle vue */}
            <div className="flex items-center border rounded-lg p-0.5 bg-gray-100">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vue grille"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vue liste"
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            {/* Bouton Mes Produits */}
            {canAddToSelection && (
              <Link
                href="/mes-produits"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-sm font-medium"
              >
                <PackagePlus className="h-4 w-4" />
                Mes Produits
              </Link>
            )}
          </div>

          {/* Résultats + Reset */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              {totalFilteredProducts} produit
              {totalFilteredProducts > 1 ? 's' : ''} trouvé
              {totalFilteredProducts > 1 ? 's' : ''}
              {filteredCustomProducts.length > 0 && (
                <span className="text-purple-600 ml-1">
                  (dont {filteredCustomProducts.length} sur mesure)
                </span>
              )}
            </p>

            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory(undefined);
                }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Aucun produit */}
        {totalFilteredProducts === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres
            </p>
          </div>
        ) : (
          <>
            {/* Section: Produits sur mesure */}
            {filteredCustomProducts.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Produits sur mesure
                    </h2>
                    <p className="text-sm text-gray-500">
                      {filteredCustomProducts.length} produit
                      {filteredCustomProducts.length > 1 ? 's' : ''} créé
                      {filteredCustomProducts.length > 1 ? 's' : ''}{' '}
                      spécialement pour vous
                    </p>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredCustomProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        canAddToSelection={canAddToSelection}
                        onAddToSelection={() => handleAddToSelection(product)}
                        showCustomBadge
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 divide-y">
                    {filteredCustomProducts.map(product => (
                      <ProductListItem
                        key={product.id}
                        product={product}
                        canAddToSelection={canAddToSelection}
                        onAddToSelection={() => handleAddToSelection(product)}
                        showCustomBadge
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Séparateur si les deux sections existent */}
            {filteredCustomProducts.length > 0 &&
              filteredGeneralProducts.length > 0 && (
                <div className="border-t border-gray-200 my-8" />
              )}

            {/* Section: Catalogue général */}
            {filteredGeneralProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      Catalogue général
                    </h2>
                    <p className="text-sm text-gray-500">
                      {filteredGeneralProducts.length} produit
                      {filteredGeneralProducts.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredGeneralProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        canAddToSelection={canAddToSelection}
                        onAddToSelection={() => handleAddToSelection(product)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 divide-y">
                    {filteredGeneralProducts.map(product => (
                      <ProductListItem
                        key={product.id}
                        product={product}
                        canAddToSelection={canAddToSelection}
                        onAddToSelection={() => handleAddToSelection(product)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal ajout à la sélection */}
      <AddToSelectionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        preselectedSelectionId={selectionIdFromUrl}
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Calcule le prix client LinkMe avec commission
 * Formule: prix_vente × (1 + commission_rate / 100)
 */
function calculateCustomerPrice(
  sellingPriceHT: number,
  commissionRate: number | null
): number {
  const commission = commissionRate ?? 0;
  return sellingPriceHT * (1 + commission / 100);
}

// ============================================================================
// Composants internes
// ============================================================================

interface ProductCardProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

function ProductCard({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductCardProps) {
  const displayTitle = product.custom_title || product.name;
  const displayDescription = product.custom_description || product.description;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-300" />
          </div>
        )}

        {/* Badge sur mesure */}
        {showCustomBadge && (
          <span className="absolute top-1.5 right-1.5 bg-purple-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <Sparkles className="h-2.5 w-2.5" />
            Sur mesure
          </span>
        )}

        {/* Badge vedette */}
        {product.is_featured && (
          <span className="absolute top-1.5 left-1.5 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded">
            Vedette
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-2.5">
        {/* Catégorie */}
        {product.category_name && (
          <p className="text-[10px] text-gray-500 mb-0.5 truncate">
            {product.category_name}
          </p>
        )}

        {/* Nom */}
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-0.5 leading-tight">
          {displayTitle}
        </h3>

        {/* Référence */}
        <p className="text-[10px] text-gray-400 font-mono mb-1.5">
          {product.reference}
        </p>

        {/* Prix */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-gray-900">
              {customerPriceHT.toFixed(2)} €
            </span>
            <span className="text-[10px] text-gray-500">HT</span>
          </div>
        </div>

        {/* Bouton ajouter */}
        <button
          onClick={onAddToSelection}
          disabled={!canAddToSelection}
          className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
            canAddToSelection
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="h-3 w-3" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

interface ProductListItemProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
  showCustomBadge?: boolean;
}

function ProductListItem({
  product,
  canAddToSelection,
  onAddToSelection,
  showCustomBadge = false,
}: ProductListItemProps) {
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
      {/* Image */}
      <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <h3 className="font-medium text-gray-900 truncate text-sm">
            {displayTitle}
          </h3>
          {showCustomBadge && (
            <span className="bg-purple-100 text-purple-700 text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              Sur mesure
            </span>
          )}
          {product.is_featured && (
            <span className="bg-yellow-100 text-yellow-700 text-[10px] font-medium px-1.5 py-0.5 rounded">
              Vedette
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {product.category_name && `${product.category_name} • `}
          <span className="font-mono">{product.reference}</span>
        </p>
      </div>

      {/* Prix */}
      <div className="text-right">
        <p className="font-bold text-gray-900 text-sm">
          {customerPriceHT.toFixed(2)} € HT
        </p>
      </div>

      {/* Action */}
      <button
        onClick={onAddToSelection}
        disabled={!canAddToSelection}
        className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          canAddToSelection
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Plus className="h-3 w-3" />
        <span className="hidden lg:inline">Ajouter</span>
      </button>
    </div>
  );
}
