'use client';

import { useState, useMemo } from 'react';

import { Button, CloudflareImage } from '@verone/ui';
import { cn } from '@verone/utils';
import {
  X,
  Package,
  Search,
  Plus,
  Check,
  Loader2,
  Minus,
  Trash2,
  ShoppingCart,
} from 'lucide-react';

import { useLinkMeSelection } from '../../../../hooks/use-linkme-selections';
import type { SelectionItem } from '../../../../hooks/use-linkme-selections';
import { useLinkMeSelectionsByAffiliate } from '../../../../hooks/use-linkme-affiliates';

// ============================================
// TYPES
// ============================================

interface AddProductToOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectionId: string | null;
  affiliateId: string | null;
  existingProductIds: string[];
  onAddItems: (
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price_ht: number;
      base_price_ht: number;
      retrocession_rate: number;
      linkme_selection_item_id: string;
    }>
  ) => void;
}

interface CartEntry {
  selectionItem: SelectionItem;
  quantity: number;
  unit_price_ht: number;
  base_price_ht: number;
  margin_rate: number;
}

// ============================================
// COMPONENT
// ============================================

export function AddProductToOrderModal({
  isOpen,
  onClose,
  selectionId,
  affiliateId,
  existingProductIds,
  onAddItems,
}: AddProductToOrderModalProps) {
  // Si pas de selectionId direct, retrouver via l'affilié
  const { data: affiliateSelections } = useLinkMeSelectionsByAffiliate(
    selectionId ? null : affiliateId
  );
  const resolvedSelectionId =
    selectionId ?? affiliateSelections?.[0]?.id ?? null;
  const { data: selection, isLoading } =
    useLinkMeSelection(resolvedSelectionId);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartEntry[]>([]);

  // Filter available items: not already in order, not hidden, match search
  const availableItems = useMemo(() => {
    if (!selection?.items) return [];
    return selection.items.filter(item => {
      if (existingProductIds.includes(item.product_id)) return false;
      if (item.is_hidden_by_staff) return false;
      // Also exclude items already in the local cart
      if (cart.some(c => c.selectionItem.product_id === item.product_id))
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (item.product?.name ?? '').toLowerCase();
        const sku = (item.product?.sku ?? '').toLowerCase();
        return name.includes(q) || sku.includes(q);
      }
      return true;
    });
  }, [selection?.items, existingProductIds, cart, searchQuery]);

  const addToCart = (item: SelectionItem) => {
    const isAffiliate = !!item.product?.created_by_affiliate;
    const sellingPrice = item.selling_price_ht ?? item.base_price_ht;
    const marginRate = isAffiliate
      ? (item.product?.affiliate_commission_rate ?? 0) * 100
      : item.margin_rate;

    setCart(prev => [
      ...prev,
      {
        selectionItem: item,
        quantity: 1,
        unit_price_ht: sellingPrice,
        base_price_ht: item.base_price_ht,
        margin_rate: marginRate,
      },
    ]);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.selectionItem.product_id !== productId));
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.selectionItem.product_id !== productId) return c;
        const newQty = Math.max(1, c.quantity + delta);
        return { ...c, quantity: newQty };
      })
    );
  };

  const updateCartPrice = (productId: string, newPrice: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.selectionItem.product_id !== productId) return c;
        const newMargin =
          c.base_price_ht > 0
            ? ((newPrice - c.base_price_ht) / c.base_price_ht) * 100
            : 0;
        return {
          ...c,
          unit_price_ht: newPrice,
          margin_rate: Math.max(0, newMargin),
        };
      })
    );
  };

  const updateCartMargin = (productId: string, newMargin: number) => {
    setCart(prev =>
      prev.map(c => {
        if (c.selectionItem.product_id !== productId) return c;
        const newPrice =
          c.base_price_ht > 0
            ? c.base_price_ht * (1 + newMargin / 100)
            : c.unit_price_ht;
        return {
          ...c,
          margin_rate: newMargin,
          unit_price_ht: Math.round(newPrice * 100) / 100,
        };
      })
    );
  };

  const handleConfirm = () => {
    const items = cart.map(c => ({
      product_id: c.selectionItem.product_id,
      quantity: c.quantity,
      unit_price_ht: c.unit_price_ht,
      base_price_ht: c.base_price_ht,
      retrocession_rate: c.margin_rate / 100,
      linkme_selection_item_id: c.selectionItem.id,
    }));
    onAddItems(items);
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity * c.unit_price_ht, 0),
    [cart]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative min-h-screen flex items-end md:items-center justify-center md:p-4">
        <div className="relative bg-white rounded-t-xl md:rounded-xl shadow-2xl w-full md:max-w-2xl h-full md:h-auto md:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Ajouter des produits</h2>
                <p className="text-sm text-gray-500">
                  {selection?.name ?? 'Chargement...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              </div>
            ) : (
              <>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom ou SKU..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Available products */}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Produits disponibles ({availableItems.length})
                  </p>
                  {availableItems.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {availableItems.map(item => {
                        const sellingPrice =
                          item.selling_price_ht ?? item.base_price_ht;
                        return (
                          <button
                            key={item.id}
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                          >
                            {(item.product_image_cloudflare_id ??
                            item.product_image_url) ? (
                              <CloudflareImage
                                cloudflareId={item.product_image_cloudflare_id}
                                fallbackSrc={item.product_image_url}
                                alt={item.product?.name ?? ''}
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {item.product?.name ?? 'Produit'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.product?.sku ?? '-'} •{' '}
                                {sellingPrice.toFixed(2)}€ HT
                                {item.margin_rate > 0 && (
                                  <> • Marge {item.margin_rate.toFixed(0)}%</>
                                )}
                              </p>
                            </div>
                            <Plus className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      {searchQuery.trim()
                        ? `Aucun produit ne correspond à "${searchQuery}"`
                        : 'Tous les produits sont déjà dans la commande'}
                    </p>
                  )}
                </div>

                {/* Cart */}
                {cart.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <ShoppingCart className="h-4 w-4 text-purple-600" />
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        À ajouter ({cart.length})
                      </p>
                    </div>
                    <div className="space-y-3">
                      {cart.map(entry => {
                        const isAffiliate =
                          !!entry.selectionItem.product?.created_by_affiliate;
                        return (
                          <div
                            key={entry.selectionItem.product_id}
                            className={cn(
                              'p-3 rounded-lg',
                              isAffiliate
                                ? 'bg-blue-50 border border-blue-200'
                                : 'bg-gray-50 border border-gray-200'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {entry.selectionItem.product?.name ??
                                    'Produit'}
                                </p>
                                {isAffiliate && (
                                  <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
                                    Affilié
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  removeFromCart(entry.selectionItem.product_id)
                                }
                                className="p-1 hover:bg-red-100 rounded text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Quantity */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() =>
                                    updateCartQuantity(
                                      entry.selectionItem.product_id,
                                      -1
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={entry.quantity}
                                  onChange={e => {
                                    const val = parseInt(e.target.value, 10);
                                    if (!isNaN(val) && val > 0) {
                                      updateCartQuantity(
                                        entry.selectionItem.product_id,
                                        val - entry.quantity
                                      );
                                    }
                                  }}
                                  className="w-14 h-7 text-center text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                  onClick={() =>
                                    updateCartQuantity(
                                      entry.selectionItem.product_id,
                                      1
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Price */}
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600">
                                  Prix HT
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={entry.unit_price_ht}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0) {
                                      updateCartPrice(
                                        entry.selectionItem.product_id,
                                        val
                                      );
                                    }
                                  }}
                                  className="w-24 h-7 text-sm text-right border border-gray-300 rounded px-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-xs text-gray-500">€</span>
                              </div>

                              {/* Margin */}
                              <div className="flex items-center gap-1">
                                <label className="text-xs text-gray-600">
                                  {isAffiliate ? 'Commission' : 'Marge'}
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={99}
                                  step={0.5}
                                  value={parseFloat(
                                    entry.margin_rate.toFixed(2)
                                  )}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    if (!isNaN(val) && val >= 0 && val < 100) {
                                      updateCartMargin(
                                        entry.selectionItem.product_id,
                                        val
                                      );
                                    }
                                  }}
                                  className="w-16 h-7 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <span className="text-xs text-gray-500">%</span>
                              </div>

                              {/* Line total */}
                              <p className="text-sm font-medium ml-auto">
                                {(entry.quantity * entry.unit_price_ht).toFixed(
                                  2
                                )}
                                € HT
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div>
              {cart.length > 0 && (
                <p className="text-sm font-medium">
                  Total : {cartTotal.toFixed(2)}€ HT
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 md:flex-row">
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full md:w-auto"
              >
                Annuler
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={cart.length === 0}
                className="w-full md:w-auto gap-2"
              >
                <Check className="h-4 w-4" />
                Ajouter {cart.length > 0 ? `(${cart.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
