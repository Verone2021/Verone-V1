'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import type { CartItem, CartState, CartTotals } from '../../types';

const TVA_RATE = 0.2;

interface CartContextValue extends CartState, CartTotals {
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  setAffiliateInfo: (affiliateId: string, affiliateSlug: string) => void;
  setSelectionInfo: (selectionId: string, selectionSlug: string) => void;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [affiliateId, setAffiliateId] = useState<string | null>(null);
  const [affiliateSlug, setAffiliateSlug] = useState<string | null>(null);
  const [selectionId, setSelectionId] = useState<string | null>(null);
  const [selectionSlug, setSelectionSlug] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Ajouter un item
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.selection_item_id === newItem.selection_item_id
      );

      if (existingIndex >= 0) {
        // Incrémenter quantité
        return prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      // Ajouter nouvel item
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }, []);

  // Supprimer un item
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  // Modifier quantité
  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems(prev =>
        prev.map(item => (item.id === itemId ? { ...item, quantity } : item))
      );
    },
    [removeItem]
  );

  // Vider le panier
  const clearCart = useCallback(() => {
    setItems([]);
    setAffiliateId(null);
    setAffiliateSlug(null);
    setSelectionId(null);
    setSelectionSlug(null);
  }, []);

  // Définir info affilié
  const setAffiliateInfo = useCallback((id: string, slug: string) => {
    setAffiliateId(id);
    setAffiliateSlug(slug);
  }, []);

  // Définir info sélection
  const setSelectionInfo = useCallback((id: string, slug: string) => {
    setSelectionId(id);
    setSelectionSlug(slug);
  }, []);

  // Ouvrir/Fermer panier
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Calcul totaux
  const totals = useMemo<CartTotals>(() => {
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalHT = items.reduce(
      (sum, item) => sum + item.selling_price_ht * item.quantity,
      0
    );
    const totalTVA = totalHT * TVA_RATE;
    const totalTTC = totalHT + totalTVA;

    return {
      itemCount,
      totalHT,
      totalTVA,
      totalTTC,
    };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      affiliateId,
      affiliateSlug,
      selectionId,
      selectionSlug,
      ...totals,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setAffiliateInfo,
      setSelectionInfo,
      isCartOpen,
      openCart,
      closeCart,
    }),
    [
      items,
      affiliateId,
      affiliateSlug,
      selectionId,
      selectionSlug,
      totals,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      setAffiliateInfo,
      setSelectionInfo,
      isCartOpen,
      openCart,
      closeCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
