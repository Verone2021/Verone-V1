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

import { useState, useMemo, useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  Search,
  Package,
  Loader2,
  X,
  LayoutGrid,
  List,
  Plus,
  Filter,
} from 'lucide-react';

import { AddToSelectionModal } from '../../components/catalogue/AddToSelectionModal';
import { useAuth, type LinkMeRole } from '../../contexts/AuthContext';
import {
  useLinkMeCatalogProducts,
  filterCatalogProducts,
  type LinkMeCatalogProduct,
  type CatalogFilters,
} from '../../lib/hooks/use-linkme-catalog';

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

export default function CataloguePage() {
  const router = useRouter();
  const { user, linkMeRole, loading: authLoading } = useAuth();
  const { data: products, isLoading: productsLoading } =
    useLinkMeCatalogProducts();

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

  // Produits filtrés
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    const filters: CatalogFilters = {
      search: searchTerm || undefined,
      category: selectedCategory,
    };

    return filterCatalogProducts(products, filters);
  }, [products, searchTerm, selectedCategory]);

  // Catégories uniques pour le filtre
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = new Set(
      products.map(p => p.category_name).filter(Boolean) as string[]
    );
    return Array.from(uniqueCategories).sort();
  }, [products]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Catalogue LinkMe
              </h1>
              <p className="text-gray-600">
                Découvrez nos produits et ajoutez-les à votre sélection
              </p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
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
          </div>

          {/* Résultats + Reset */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              {filteredProducts.length} produit
              {filteredProducts.length > 1 ? 's' : ''} trouvé
              {filteredProducts.length > 1 ? 's' : ''}
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

        {/* Grille produits */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Aucun produit trouvé</p>
            <p className="text-sm text-gray-500 mt-1">
              Essayez de modifier vos filtres
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
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
            {filteredProducts.map(product => (
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

      {/* Modal ajout à la sélection */}
      <AddToSelectionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
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
}

function ProductCard({
  product,
  canAddToSelection,
  onAddToSelection,
}: ProductCardProps) {
  const displayTitle = product.custom_title || product.name;
  const displayDescription = product.custom_description || product.description;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
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
            <Package className="h-16 w-16 text-gray-300" />
          </div>
        )}

        {/* Badge vedette */}
        {product.is_featured && (
          <span className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded">
            Vedette
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        {/* Catégorie */}
        {product.category_name && (
          <p className="text-xs text-gray-500 mb-1">{product.category_name}</p>
        )}

        {/* Nom */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
          {displayTitle}
        </h3>

        {/* Référence */}
        <p className="text-xs text-gray-400 font-mono mb-2">
          {product.reference}
        </p>

        {/* Prix */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              {customerPriceHT.toFixed(2)} €
            </span>
            <span className="text-xs text-gray-500">HT</span>
          </div>
          {product.public_price_ht && (
            <p className="text-xs text-gray-400 mt-1">
              Prix public : {product.public_price_ht.toFixed(2)} € HT
            </p>
          )}
        </div>

        {/* Bouton ajouter */}
        <button
          onClick={onAddToSelection}
          disabled={!canAddToSelection}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            canAddToSelection
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Plus className="h-4 w-4" />
          Ajouter à ma sélection
        </button>
      </div>
    </div>
  );
}

interface ProductListItemProps {
  product: LinkMeCatalogProduct;
  canAddToSelection: boolean;
  onAddToSelection: () => void;
}

function ProductListItem({
  product,
  canAddToSelection,
  onAddToSelection,
}: ProductListItemProps) {
  const displayTitle = product.custom_title || product.name;

  // Prix client calculé = prix vente × (1 + commission%)
  const customerPriceHT = calculateCustomerPrice(
    product.selling_price_ht,
    product.channel_commission_rate
  );

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {/* Image */}
      <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={displayTitle}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">
            {displayTitle}
          </h3>
          {product.is_featured && (
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded">
              Vedette
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          {product.category_name && `${product.category_name} • `}
          <span className="font-mono">{product.reference}</span>
        </p>
      </div>

      {/* Prix */}
      <div className="text-right">
        <p className="font-bold text-gray-900">
          {customerPriceHT.toFixed(2)} € HT
        </p>
        {product.public_price_ht && (
          <p className="text-xs text-gray-400">
            Prix public : {product.public_price_ht.toFixed(2)} €
          </p>
        )}
      </div>

      {/* Action */}
      <button
        onClick={onAddToSelection}
        disabled={!canAddToSelection}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
          canAddToSelection
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        <Plus className="h-4 w-4" />
        <span className="hidden lg:inline">Ajouter</span>
      </button>
    </div>
  );
}
