/**
 * CollectionGrid - Grille de produits pour collections Vérone
 * Design minimaliste noir/blanc avec filtres élégants
 */

import React, { useState } from 'react';

import { ProductCardV2 } from '@verone/products';
import { ButtonV2 } from '@verone/ui';
import { Input } from '@verone/ui';
import { cn } from '@verone/utils';

interface Product {
  id: string;
  name: string;
  sku: string;
  price_ht: number;
  status:
    | 'in_stock'
    | 'out_of_stock'
    | 'preorder'
    | 'coming_soon'
    | 'discontinued';
  primary_image_url: string;
  category?: string;
  variant_attributes?: Record<string, string>;
}

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface CollectionGridProps {
  products: Product[];
  title?: string;
  description?: string;
  categories?: FilterOption[];
  statusOptions?: FilterOption[];
  loading?: boolean;
  className?: string;
  onProductEdit?: (id: string) => void;
  onProductView?: (id: string) => void;
  onAddProduct?: () => void;
  onExport?: () => void;
}

const FilterSection = ({
  title,
  options,
  selectedValues,
  onChange,
  multiSelect = true,
}: {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  multiSelect?: boolean;
}) => {
  const handleChange = (value: string) => {
    if (multiSelect) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onChange(newValues);
    } else {
      onChange(selectedValues.includes(value) ? [] : [value]);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-black">{title}</h4>
      <div className="space-y-2">
        {options.map(option => (
          <label
            key={option.value}
            className="flex items-center gap-3 cursor-pointer hover:opacity-70 transition-opacity"
          >
            <input
              type="checkbox"
              checked={selectedValues.includes(option.value)}
              onChange={() => handleChange(option.value)}
              className="w-4 h-4 border border-black focus:ring-black focus:ring-1"
            />
            <span className="text-sm text-black flex-1">{option.label}</span>
            {option.count !== undefined && (
              <span className="text-xs text-gray-500">({option.count})</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export const CollectionGrid: React.FC<CollectionGridProps> = ({
  products,
  title = 'Catalogue',
  description,
  categories = [],
  statusOptions = [],
  loading = false,
  className,
  onProductEdit,
  onProductView,
  onAddProduct,
  onExport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrage des produits
  const filteredProducts = products.filter(product => {
    // Filtre par recherche
    if (
      searchQuery &&
      !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }

    // Filtre par catégorie
    if (
      selectedCategories.length > 0 &&
      product.category &&
      !selectedCategories.includes(product.category)
    ) {
      return false;
    }

    // Filtre par statut
    if (
      selectedStatuses.length > 0 &&
      !selectedStatuses.includes(product.status)
    ) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedStatuses([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-black">Chargement...</div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-black pb-4">
        <div>
          <h2 className="text-2xl font-bold text-black">{title}</h2>
          {description && <p className="text-gray-600 mt-1">{description}</p>}
          <div className="text-sm text-gray-500 mt-2">
            {filteredProducts.length} produit
            {filteredProducts.length > 1 ? 's' : ''}
            {filteredProducts.length !== products.length && (
              <span> sur {products.length}</span>
            )}
          </div>
        </div>

        {/* Actions header */}
        <div className="flex gap-3">
          {onExport && (
            <ButtonV2 variant="secondary" onClick={onExport}>
              Exporter
            </ButtonV2>
          )}
          {onAddProduct && (
            <ButtonV2 onClick={onAddProduct}>Nouveau produit</ButtonV2>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filtres */}
        <div className="lg:col-span-1 space-y-6">
          {/* Recherche */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-black">Recherche</h4>
            <Input
              placeholder="Nom ou référence..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-black focus:ring-black"
            />
          </div>

          {/* Filtre par catégorie */}
          {categories.length > 0 && (
            <FilterSection
              title="Catégories"
              options={categories}
              selectedValues={selectedCategories}
              onChange={setSelectedCategories}
            />
          )}

          {/* Filtre par statut */}
          {statusOptions.length > 0 && (
            <FilterSection
              title="Disponibilité"
              options={statusOptions}
              selectedValues={selectedStatuses}
              onChange={setSelectedStatuses}
            />
          )}

          {/* Reset filtres */}
          {(selectedCategories.length > 0 ||
            selectedStatuses.length > 0 ||
            searchQuery) && (
            <ButtonV2
              variant="ghost"
              onClick={resetFilters}
              className="w-full text-left justify-start"
            >
              Réinitialiser les filtres
            </ButtonV2>
          )}

          {/* Mode d'affichage */}
          <div className="space-y-3 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-black">Affichage</h4>
            <div className="flex gap-2">
              <ButtonV2
                variant={viewMode === 'grid' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grille
              </ButtonV2>
              <ButtonV2
                variant={viewMode === 'list' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                Liste
              </ButtonV2>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">Aucun produit trouvé</div>
              {(selectedCategories.length > 0 ||
                selectedStatuses.length > 0 ||
                searchQuery) && (
                <ButtonV2 variant="secondary" onClick={resetFilters}>
                  Voir tous les produits
                </ButtonV2>
              )}
            </div>
          ) : (
            <div
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              )}
            >
              {filteredProducts.map(product => (
                <ProductCardV2
                  key={product.id}
                  product={product as any}
                  className={viewMode === 'list' ? 'flex-row' : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CollectionGrid.displayName = 'CollectionGrid';
