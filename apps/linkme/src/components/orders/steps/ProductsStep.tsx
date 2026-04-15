'use client';

/**
 * ProductsStep - Étape 3 du formulaire de commande
 *
 * @module ProductsStep
 * @since 2026-01-20
 * @updated 2026-04-14 - Refactoring: extraction ProductCard
 */

import { useState, useMemo } from 'react';

import { Input, cn } from '@verone/ui';
import {
  Package,
  Search,
  ShoppingCart,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { usePermissions } from '@/hooks/use-permissions';
import { toast } from 'sonner';

import type { SelectionItem } from '../../../lib/hooks/use-user-selection';
import {
  useSelectionItems,
  useUpdateAffiliateProductPrice,
} from '../../../lib/hooks/use-user-selection';
import type { OrderFormData, CartItem } from '../schemas/order-form.schema';
import { ProductCard } from './products/ProductCard';

// ============================================================================
// TYPES
// ============================================================================

interface ProductsStepProps {
  formData: OrderFormData;
  errors: string[];
  cartTotals: {
    totalHT: number;
    totalTVA: number;
    totalTTC: number;
    totalCommission: number;
    itemsCount: number;
  };
  onAddToCart: (item: CartItem) => void;
  onUpdateQuantity: (selectionItemId: string, quantity: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductsStep({
  formData,
  errors: _errors,
  cartTotals,
  onAddToCart,
  onUpdateQuantity,
}: ProductsStepProps) {
  const { canViewCommissions } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  const { data: selectionItems, isLoading } = useSelectionItems(
    formData.selection.selectionId || null
  );

  const updateAffiliatePriceMutation = useUpdateAffiliateProductPrice();

  const categories = useMemo(() => {
    if (!selectionItems) return [];
    const categoryMap = new Map<string, number>();
    selectionItems.forEach(item => {
      if (item.category_name) {
        const count = categoryMap.get(item.category_name) ?? 0;
        categoryMap.set(item.category_name, count + 1);
      }
    });
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectionItems]);

  const filteredProducts = useMemo(() => {
    if (!selectionItems) return [];
    let filtered = selectionItems;
    if (selectedCategory) {
      filtered = filtered.filter(
        item => item.category_name === selectedCategory
      );
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.product_name.toLowerCase().includes(query) ||
          item.product_reference.toLowerCase().includes(query)
      );
    }
    return filtered;
  }, [selectionItems, selectedCategory, searchQuery]);

  const isInCart = (selectionItemId: string) =>
    formData.cart.items.some(i => i.selectionItemId === selectionItemId);

  const handlePriceChange = (itemId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCustomPrices(prev => ({ ...prev, [itemId]: newPrice }));
  };

  const handlePriceSave = (item: SelectionItem) => {
    const newPrice = customPrices[item.id];
    if (newPrice === undefined || newPrice === item.selling_price_ht) return;
    updateAffiliatePriceMutation.mutate(
      { itemId: item.id, selectionId: item.selection_id, newPriceHt: newPrice },
      {
        onSuccess: () => toast.success('Prix mis à jour'),
        onError: error => {
          toast.error('Erreur lors de la mise à jour du prix');
          console.error(error);
          setCustomPrices(prev => ({
            ...prev,
            [item.id]: item.selling_price_ht,
          }));
        },
      }
    );
  };

  const handleAddToCart = (item: SelectionItem) => {
    const quantity = quantities[item.id] || 1;
    const effectivePrice = customPrices[item.id] ?? item.selling_price_ht;
    const cartItem: CartItem = {
      selectionItemId: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productSku: item.product_reference || undefined,
      productImage: item.product_image_url,
      quantity,
      basePriceHt: item.base_price_ht,
      unitPriceHt: effectivePrice,
      marginRate: item.margin_rate,
      isAffiliateProduct: item.is_affiliate_product,
      affiliateCommissionRate: item.affiliate_commission_rate,
    };
    onAddToCart(cartItem);
    toast.success(`${item.product_name} ajouté au panier`, {
      description: `Quantité: ${quantity}`,
    });
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  if (!formData.selection.selectionId) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucune sélection choisie
        </h3>
        <p className="text-gray-500">
          Veuillez d&apos;abord sélectionner une sélection de produits (étape
          2).
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!selectionItems || selectionItems.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Aucun produit dans cette sélection
        </h3>
        <p className="text-gray-500">
          Cette sélection ne contient aucun produit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-linkme-turquoise/10 rounded-lg">
          <ShoppingCart className="h-5 w-5 text-linkme-turquoise" />
          <span className="font-medium text-linkme-turquoise">
            {cartTotals.itemsCount} article
            {cartTotals.itemsCount > 1 ? 's' : ''}
          </span>
          <span className="text-gray-500">•</span>
          <span className="font-semibold text-gray-900">
            {cartTotals.totalTTC.toLocaleString('fr-FR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            € TTC
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="text-sm text-gray-500">
        Sélection :{' '}
        <span className="font-medium">{formData.selection.selectionName}</span>
        {' • '}
        {filteredProducts.length} produit
        {filteredProducts.length > 1 ? 's' : ''}{' '}
        {(searchQuery || selectedCategory) &&
          `(filtré${filteredProducts.length > 1 ? 's' : ''})`}
      </div>

      {/* Filtres catégories */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(undefined)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              !selectedCategory
                ? 'bg-linkme-turquoise text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            Tous
            <span
              className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                !selectedCategory ? 'bg-white/20' : 'bg-white text-gray-500'
              )}
            >
              {selectionItems?.length || 0}
            </span>
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCategory(cat.name)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                selectedCategory === cat.name
                  ? 'bg-linkme-turquoise text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {cat.name}
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  selectedCategory === cat.name
                    ? 'bg-white/20'
                    : 'bg-white text-gray-500'
                )}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Grille produits */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            Aucun produit ne correspond à votre recherche
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(item => {
            const inCart = isInCart(item.id);
            const cartItem = formData.cart.items.find(
              i => i.selectionItemId === item.id
            );
            const displayQuantity =
              inCart && cartItem ? cartItem.quantity : quantities[item.id] || 1;

            return (
              <ProductCard
                key={item.id}
                item={item}
                inCart={inCart}
                cartItem={cartItem}
                displayQuantity={displayQuantity}
                customPrice={customPrices[item.id]}
                canViewCommissions={canViewCommissions}
                onAddToCart={handleAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onLocalQuantityChange={(itemId, qty) =>
                  setQuantities(prev => ({ ...prev, [itemId]: qty }))
                }
                onPriceChange={handlePriceChange}
                onPriceSave={handlePriceSave}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsStep;
