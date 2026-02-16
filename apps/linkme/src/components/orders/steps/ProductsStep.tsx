'use client';

/**
 * ProductsStep - Étape 3 du formulaire de commande
 *
 * Grille de produits avec :
 * - Image, nom, référence
 * - Prix unitaire HT (read-only)
 * - Indicateur de marge (feu tricolore)
 * - Input quantité + bouton ajouter
 *
 * @module ProductsStep
 * @since 2026-01-20
 */

import { useState, useMemo } from 'react';

import Image from 'next/image';

import { Card, Input, cn } from '@verone/ui';
import {
  Package,
  Search,
  Plus,
  ShoppingCart,
  AlertCircle,
  Loader2,
  Check,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import type { SelectionItem } from '../../../lib/hooks/use-user-selection';
import {
  useSelectionItems,
  useUpdateAffiliateProductPrice,
} from '../../../lib/hooks/use-user-selection';
import type { OrderFormData, CartItem } from '../schemas/order-form.schema';

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
// HELPERS
// ============================================================================

/**
 * Retourne la couleur du feu tricolore selon le taux de marge
 */
function getMarginIndicator(marginRate: number): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (marginRate >= 30) {
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Excellente',
    };
  }
  if (marginRate >= 20) {
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      label: 'Correcte',
    };
  }
  return {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Faible',
  };
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
  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  // Prix personnalisés pour les produits affiliés (clé = itemId, valeur = prix HT)
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Charger les produits de la sélection
  const { data: selectionItems, isLoading } = useSelectionItems(
    formData.selection.selectionId || null
  );

  // Mutation pour mettre à jour le prix des produits affiliés
  const updateAffiliatePriceMutation = useUpdateAffiliateProductPrice();

  // Extraire les catégories des produits
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

  // Filtrer les produits par catégorie et recherche
  const filteredProducts = useMemo(() => {
    if (!selectionItems) return [];

    let filtered = selectionItems;

    // Filtre par catégorie
    if (selectedCategory) {
      filtered = filtered.filter(
        item => item.category_name === selectedCategory
      );
    }

    // Filtre par recherche
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

  // Vérifier si un produit est déjà dans le panier
  const isInCart = (selectionItemId: string) => {
    return formData.cart.items.some(i => i.selectionItemId === selectionItemId);
  };

  // Handler pour modifier le prix d'un produit affilié
  const handlePriceChange = (itemId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCustomPrices(prev => ({ ...prev, [itemId]: newPrice }));
  };

  // Handler pour sauvegarder le prix modifié (sur blur)
  const handlePriceSave = (item: SelectionItem) => {
    const newPrice = customPrices[item.id];
    if (newPrice === undefined || newPrice === item.selling_price_ht) return;

    updateAffiliatePriceMutation.mutate(
      {
        itemId: item.id,
        selectionId: item.selection_id,
        newPriceHt: newPrice,
      },
      {
        onSuccess: () => {
          toast.success('Prix mis à jour');
        },
        onError: error => {
          toast.error('Erreur lors de la mise à jour du prix');
          console.error(error);
          // Réinitialiser au prix original
          setCustomPrices(prev => ({
            ...prev,
            [item.id]: item.selling_price_ht,
          }));
        },
      }
    );
  };

  // Handler pour ajouter au panier
  const handleAddToCart = (item: SelectionItem) => {
    const quantity = quantities[item.id] || 1;
    // Utiliser le prix personnalisé s'il existe (pour produits affiliés)
    const effectivePrice = customPrices[item.id] ?? item.selling_price_ht;

    const cartItem: CartItem = {
      selectionItemId: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productSku: item.product_reference || undefined,
      productImage: item.product_image_url,
      quantity,
      // SSOT: Inclure basePriceHt pour calcul de marge centralisé
      basePriceHt: item.base_price_ht,
      unitPriceHt: effectivePrice, // = selling_price_ht
      marginRate: item.margin_rate,
      // Propriétés pour identifier le type de produit
      isAffiliateProduct: item.is_affiliate_product,
      affiliateCommissionRate: item.affiliate_commission_rate,
    };

    onAddToCart(cartItem);
    toast.success(`${item.product_name} ajouté au panier`, {
      description: `Quantité: ${quantity}`,
    });

    // Reset quantity
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  // Pas de sélection choisie
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

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Pas de produits
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
      {/* Header avec recherche et récap panier */}
      <div className="flex items-center justify-between gap-4">
        {/* Barre de recherche */}
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

        {/* Récap panier */}
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

      {/* Info sélection */}
      <div className="text-sm text-gray-500">
        Sélection :{' '}
        <span className="font-medium">{formData.selection.selectionName}</span>
        {' • '}
        {filteredProducts.length} produit
        {filteredProducts.length > 1 ? 's' : ''}{' '}
        {(searchQuery || selectedCategory) &&
          `(filtré${filteredProducts.length > 1 ? 's' : ''})`}
      </div>

      {/* Barre de catégories */}
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

      {/* Grille de produits */}
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
            const marginIndicator = getMarginIndicator(item.margin_rate);
            const inCart = isInCart(item.id);
            const cartItem = formData.cart.items.find(
              i => i.selectionItemId === item.id
            );
            // Afficher la quantité du panier si produit dans panier, sinon quantité locale
            const displayQuantity =
              inCart && cartItem ? cartItem.quantity : quantities[item.id] || 1;

            return (
              <Card
                key={item.id}
                className={cn(
                  'overflow-hidden transition-all',
                  inCart && 'border-green-300 bg-green-50/30'
                )}
              >
                {/* Image */}
                <div className="aspect-square bg-gray-100 relative">
                  {item.product_image_url ? (
                    <Image
                      src={item.product_image_url}
                      alt={item.product_name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Package className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                  {/* Badge si déjà dans le panier */}
                  {inCart && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Dans le panier
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div className="p-4 space-y-3">
                  {/* Nom et référence */}
                  <div>
                    <h3 className="font-medium text-gray-900 line-clamp-2">
                      {item.product_name}
                    </h3>
                    {item.product_reference && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Réf: {item.product_reference}
                      </p>
                    )}
                  </div>

                  {/* Prix et marge / badge produit affilié */}
                  <div className="flex items-center justify-between">
                    <div>
                      {/* Prix modifiable pour produits affiliés, sinon lecture seule */}
                      {item.is_affiliate_product ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={
                              customPrices[item.id] ?? item.selling_price_ht
                            }
                            onChange={e =>
                              handlePriceChange(
                                item.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            onBlur={() => handlePriceSave(item)}
                            className="w-20 text-lg font-bold text-gray-900 border rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                          />
                          <span className="text-lg font-bold text-gray-900">
                            €
                          </span>
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-gray-900">
                          {item.selling_price_ht.toLocaleString('fr-FR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          €
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        {item.is_affiliate_product
                          ? 'Prix HT (modifiable)'
                          : 'Prix HT'}
                      </p>
                    </div>
                    {/* Badge: "Votre produit" pour affilié, marge pour catalogue */}
                    {item.is_affiliate_product ? (
                      <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Votre produit
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          marginIndicator.bgColor,
                          marginIndicator.color
                        )}
                        title={`Marge: ${item.margin_rate}%`}
                      >
                        {item.margin_rate}%
                      </div>
                    )}
                  </div>

                  {/* Quantité + Ajouter */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg">
                      <button
                        type="button"
                        onClick={() => {
                          if (inCart && cartItem) {
                            // Produit dans le panier -> modifier directement la quantité du panier
                            onUpdateQuantity(
                              item.id,
                              Math.max(1, cartItem.quantity - 1)
                            );
                          } else {
                            // Produit pas dans le panier -> modifier la quantité locale
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                            }));
                          }
                        }}
                        className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        value={displayQuantity}
                        onChange={e => {
                          const newValue = Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          );
                          if (inCart && cartItem) {
                            onUpdateQuantity(item.id, newValue);
                          } else {
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: newValue,
                            }));
                          }
                        }}
                        className="w-12 text-center border-x py-1.5 text-sm focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (inCart && cartItem) {
                            // Produit dans le panier -> modifier directement la quantité du panier
                            onUpdateQuantity(item.id, cartItem.quantity + 1);
                          } else {
                            // Produit pas dans le panier -> modifier la quantité locale
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: (prev[item.id] || 1) + 1,
                            }));
                          }
                        }}
                        className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
                        inCart
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90'
                      )}
                    >
                      <Plus className="h-4 w-4" />
                      {inCart ? 'Ajouter encore' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProductsStep;
