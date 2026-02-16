'use client';

/**
 * AddProductDialog - Dialog pour ajouter des produits depuis la selection
 *
 * Reutilise useSelectionItems pour charger les produits disponibles.
 * Filtre les produits deja dans la commande.
 *
 * @module AddProductDialog
 * @since 2026-02-16
 */

import { useState, useMemo } from 'react';

import Image from 'next/image';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  cn,
} from '@verone/ui';
import { Loader2, Package, Plus, Search, Check } from 'lucide-react';

import { useSelectionItems } from '../../../../../lib/hooks/use-user-selection';

// ============================================================================
// TYPES
// ============================================================================

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectionId: string;
  existingProductIds: Set<string>;
  onAdd: (
    products: Array<{
      product_id: string;
      product_name: string;
      product_sku: string | null;
      product_image_url: string | null;
      unit_price_ht: number;
      base_price_ht: number;
      margin_rate: number;
      quantity: number;
    }>
  ) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AddProductDialog({
  open,
  onOpenChange,
  selectionId,
  existingProductIds,
  onAdd,
}: AddProductDialogProps) {
  const { data: selectionItems, isLoading } = useSelectionItems(selectionId);

  const [searchQuery, setSearchQuery] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set());

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!selectionItems) return [];

    return selectionItems.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = item.product_name.toLowerCase().includes(query);
        const matchesSku = item.product_reference
          ?.toLowerCase()
          .includes(query);
        if (!matchesName && !matchesSku) return false;
      }

      return true;
    });
  }, [selectionItems, searchQuery]);

  const handleAdd = (item: (typeof filteredProducts)[0]) => {
    const quantity = quantities[item.id] || 1;
    onAdd([
      {
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_reference || null,
        product_image_url: item.product_image_url,
        unit_price_ht: item.selling_price_ht,
        base_price_ht: item.base_price_ht,
        margin_rate: item.margin_rate,
        quantity,
      },
    ]);

    // Track added
    setAddedProducts(prev => new Set(prev).add(item.product_id));

    // Reset quantity
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  const handleClose = () => {
    setSearchQuery('');
    setQuantities({});
    setAddedProducts(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#183559]">
            Ajouter des produits
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Products list */}
        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun produit trouve</p>
            </div>
          )}

          {!isLoading && filteredProducts.length > 0 && (
            <div className="space-y-2">
              {filteredProducts.map(item => {
                const inOrder = existingProductIds.has(item.product_id);
                const justAdded = addedProducts.has(item.product_id);
                const quantity = quantities[item.id] || 1;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      inOrder && !justAdded
                        ? 'bg-gray-50 border-gray-200'
                        : justAdded
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200 hover:border-[#5DBEBB]/50'
                    )}
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                      {item.product_image_url ? (
                        <Image
                          src={item.product_image_url}
                          alt={item.product_name}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#183559] truncate">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.product_reference &&
                          `${item.product_reference} | `}
                        {item.selling_price_ht.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        EUR HT
                        {item.margin_rate > 0 && (
                          <span className="ml-2 text-emerald-600">
                            Marge {item.margin_rate}%
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Badges */}
                    {inOrder && !justAdded && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                        Deja dans la commande
                      </span>
                    )}
                    {justAdded && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                        <Check className="h-3 w-3" />
                        Ajoute
                      </span>
                    )}

                    {/* Quantity + Add button */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-lg">
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: Math.max(1, (prev[item.id] || 1) - 1),
                            }))
                          }
                          className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={quantity}
                          onChange={e =>
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: Math.max(
                                1,
                                parseInt(e.target.value) || 1
                              ),
                            }))
                          }
                          className="w-10 text-center border-x py-1.5 text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setQuantities(prev => ({
                              ...prev,
                              [item.id]: (prev[item.id] || 1) + 1,
                            }))
                          }
                          className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAdd(item)}
                        className="flex items-center gap-1 px-3 py-2 bg-[#5DBEBB] text-white rounded-lg font-medium text-sm hover:bg-[#4DAEAB] transition-colors whitespace-nowrap"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AddProductDialog;
